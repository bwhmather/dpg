module Dpg where

import Maybe
import Result
import Result exposing (Result (Ok, Err))
import Signal
import Signal exposing (Signal, Mailbox, Message)

import Html
import Html exposing (Html, div)

import Dpg.Target as Target
import Dpg.NoiseSource as Source
import Dpg.Renderer as Renderer
import Dpg.Output as Output


type alias Settings =
    { target : Target.Settings
    , renderer : Renderer.Settings
    }

type Action
    = TargetAction Target.Action
    | RendererAction Renderer.Action
    | NoOp


defaultSettings : Settings
defaultSettings =
    { target = Target.defaultSettings
    , renderer = Renderer.defaultSettings
    }


-- Update functions
update : Action -> Settings -> Settings
update action settings =
    case action of
      TargetAction a ->
        { settings | target <- Target.update a settings.target }
      RendererAction a ->
        { settings | renderer <- Renderer.update a settings.renderer }
      _ -> settings


-- Views
view : Signal.Address Action -> Settings -> Output.Status -> Html
view address settings output =
    div []
    [ Target.view (Signal.forwardTo address TargetAction) settings.target
    , Output.view output
    , Renderer.view (Signal.forwardTo address RendererAction) settings.renderer
    ]


-- Filter functions
generateSeed : Settings -> Result String Source.Seed
generateSeed settings =
    Result.map2 (\ target renderer ->
        { password = target.password
        , salt = target.salt
        })
      (Target.output settings.target)
      (Renderer.output settings.renderer)


--generatePassword : Settings -> Source.Output -> Result String String

generateOutput : Settings -> Source.Output -> Output.Status
generateOutput settings sourceOut =
    case Renderer.output settings.renderer of
      Err msg -> Output.Error msg
      Ok renderer -> case sourceOut of
        Source.Progress progress -> Output.Progress progress
        Source.Result noise -> Output.Result (renderer noise)
        Source.Error msg -> Output.Error msg
        Source.NoResult -> Output.NoResult


--- Mailboxes
{-| Mailbox for user input, clicks etc.  Passed to view
|-}
actions : Mailbox Action
actions = Signal.mailbox NoOp


-- Signals
settings : Signal Settings
settings = Signal.foldp update defaultSettings actions.signal

seed : Signal (Result String Source.Seed)
seed = Signal.dropRepeats <| Signal.map generateSeed settings

noiseRequests : Signal Source.Request
noiseRequests = Signal.map (\ seed -> case seed of
    Ok value -> Source.Request value
    Err _ -> Source.Nothing) seed

noise : Signal Source.Output
noise = Source.new noiseRequests

output : Signal Output.Status
output = Signal.map2 generateOutput settings noise

main : Signal Html
main = Signal.map2 (view actions.address) settings output
