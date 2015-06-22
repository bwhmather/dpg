module Dpg.NoiseSource
    ( Seed, Request(Request, Nothing)
    , Output(NoResult, Progress, Result, Error)
    , new
    ) where

import Http exposing (uriEncode)

import Json.Encode as JE

import String exposing (toUpper)
import Signal
import Time exposing (delay, second)

import Native.Dpg.NoiseSource

import Dpg.Generator exposing (Generator)


type NoiseSource = NoiseSource (Signal Output)


type alias Seed =
    { password : String
    , salt : String
    }

type Request
  = Request Seed
  | Nothing

{-| Update to internal state
|-}
type Update
    = RequestStart Seed
    | RequestStop
    | NotifyProgress Float
    | NotifyCompleted Generator
    | NotifyError String
    | NoOp

{-| Internal state
|-}
type State
    = Stopped
    | InProgress Float
    | Completed Generator
    | Errored String

{-| Public state
|-}
type Output
    = NoResult
    | Progress Float
    | Result Generator
    | Error String


requestToStateUpdate : Request -> Update
requestToStateUpdate req =
    case req of
      Request req -> RequestStart req
      Nothing -> RequestStop


applyStateUpdate : Update -> State -> State
applyStateUpdate update state =
    case update of
      RequestStart params -> case state of
        Errored msg -> Errored msg
        _ -> InProgress 0.0
      RequestStop -> case state of
        Errored msg -> Errored msg
        _ -> Stopped
      NotifyProgress progress -> case state of
        Stopped -> Errored "unexpected progress update"
        InProgress _ -> InProgress progress
        Completed _ -> Errored "already completed"
        Errored msg -> Errored msg
      NotifyCompleted res -> case state of
        Stopped -> Completed res
        InProgress _ -> Completed res
        Completed _ -> Errored "worker already finished"
        Errored msg -> Errored msg
      NotifyError msg -> case state of
        Errored _ -> state
        _ -> Errored msg
      NoOp -> state


renderState : State -> Output
renderState state =
    case state of
      Stopped -> NoResult
      InProgress progress -> Progress progress
      Completed res -> Result res
      Errored msg -> Error msg


new : Signal Request -> Signal Output
new requests =
    let responses = Native.Dpg.NoiseSource.spawn requests
    in (Signal.map
      renderState
      (Signal.foldp
        applyStateUpdate
        (Stopped)
        (Signal.merge
          (Signal.map requestToStateUpdate requests)
          responses)))
