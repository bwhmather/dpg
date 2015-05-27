module Dpg.NoiseSource
    ( Request(Request, Nothing)
    , Output(NoResult, Progress, Result, Error)
    , Noise
    ) where

import Json.Encode as JE

import String exposing (toUpper)
import Signal
import Time exposing (delay, second)

import WebWorker

type alias Noise = String
type NoiseSource = NoiseSource (Signal Output)


type Request
  = Request
      { password : String
      , salt : String
      , bytes : Int
      }
  | Nothing


{-| Update to internal state
|-}
type Update
    = RequestStart { password : String, salt : String, bytes : Int }
    | RequestStop
    | NotifyAccepted
    | NotifyProgress Float
    | NotifyCompleted Noise
    | NotifyError String
    | NoOp


{-| Internal state
|-}
type State
    = Waiting Int
    | Stopping Int
    | InProgress Float
    | Completed Noise
    | Errored String


{-| Public state
|-}
type Output
    = NoResult
    | Progress Float
    | Result Noise
    | Error String

requestToMessage : Request -> WebWorker.Request
requestToMessage req = case req of
    Request req -> WebWorker.SendMessage <| JE.object
        [ ("password", JE.string req.password)
        , ("salt", JE.string req.salt)
        , ("bytes", JE.int req.bytes)
        ]
    Nothing -> WebWorker.NoOp


requestToStateUpdate : Request -> Update
requestToStateUpdate req = case req of
    Request req -> RequestStart req
    Nothing -> RequestStop


messageToStateUpdate : WebWorker.Response -> Update
messageToStateUpdate msg = case msg of
    WebWorker.Waiting -> NoOp
    WebWorker.Message msg -> NotifyAccepted  -- TODO
    WebWorker.Error msg -> NotifyError msg


applyStateUpdate : Update -> State -> State
applyStateUpdate update state = case update of
    RequestStart params -> case state of
        Waiting count -> Waiting (count + 1)
        Stopping count -> Waiting (count + 1)
        Errored msg -> Errored msg
        _ -> Waiting 0
    RequestStop -> case state of
        Waiting count -> Stopping count
        Stopping count -> Stopping count
        InProgress _ -> Stopping 0
        Completed _ -> Stopping 0
        Errored msg -> Errored msg
    NotifyAccepted -> case state of
        Waiting 0 -> InProgress 0.0
        Waiting n -> Waiting (n - 1)
        Stopping n -> Stopping (n - 1)
        InProgress _ -> Errored "worker restarted unexpectedly"
        Completed _ -> Errored "worker restarted unexpectedly"
        Errored msg -> Errored msg
    NotifyProgress progress -> case state of
        Waiting _ -> state
        Stopping _ -> state
        InProgress _ -> InProgress progress
        Completed _ -> Errored "unexpected progress update"
        Errored msg -> Errored msg
    NotifyCompleted res -> case state of
        Waiting _ -> state
        Stopping _ -> state
        InProgress _ -> Completed res
        Completed _ -> Errored "worker already finished"
        Errored msg -> Errored msg 
    NotifyError msg -> case state of
        Errored _ -> state
        _ -> Errored msg
    NoOp -> state


renderState : State -> Output
renderState state = case state of
    Stopping _ -> NoResult
    Waiting _ -> Progress 0.0
    InProgress progress -> Progress progress
    Completed res -> Result res
    Errored msg -> Error msg


new : Signal Request -> Signal Output
new requests =
    let messages = WebWorker.spawn "worker" (Signal.map requestToMessage requests)
    in
        (Signal.map renderState
            (Signal.foldp applyStateUpdate (Stopping 0) (Signal.merge
                (Signal.map requestToStateUpdate requests)
                (Signal.map messageToStateUpdate messages))))


