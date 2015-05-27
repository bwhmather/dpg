module Dpg where

import Maybe
import Result
import Result exposing (Result (Ok, Err))
import Signal
import Signal exposing (Signal, Mailbox, Message)

import Html
import Html exposing (Html, div, fieldset, legend, text)

import Dpg.Target as Target
import Dpg.NoiseSource as Source
import Dpg.Generator as Generator


type alias Settings =
    { target : Target.Settings
    , generator : Generator.Settings
    }

type Action
    = TargetAction Target.Action
    | GeneratorAction Generator.Action
    | NoOp

defaultSettings : Settings
defaultSettings =
    { target = Target.defaultSettings
    , generator = Generator.defaultSettings
    }

update : Action -> Settings -> Settings
update action settings = case action of
    TargetAction a ->
        { settings | target <- Target.update a settings.target }
    GeneratorAction a ->
        { settings | generator <- Generator.update a settings.generator }
    _ -> settings

view : Signal.Address Action -> Settings -> Result String String -> Html
view address settings output =
    div []
    [ Target.view (Signal.forwardTo address TargetAction) settings.target
    , fieldset []
      [ legend [] [text "Output"]
      , case output of
          Ok password -> Html.text ("password: " ++ password)
          Err message -> Html.text ("error: " ++ message)
      ]
    , Generator.view (Signal.forwardTo address GeneratorAction) settings.generator
    ]

--noiseSource : Source.NoiseSource
--noiseSource = Source.new (Signal.map (\m -> Result.toMaybe (Target.output m.target)) settings)

generatePassword : Settings -> Result String String
generatePassword settings
    = Result.map2 (\ seed generator -> generator seed)
        (Target.output settings.target)
        (Generator.output settings.generator)


actions : Mailbox Action
actions  = Signal.mailbox NoOp

settings : Signal Settings
settings = Signal.foldp update defaultSettings actions.signal

output : Signal (Result String String)
output = Signal.map generatePassword settings

main : Signal Html
main = Signal.map2 (view actions.address) settings output
