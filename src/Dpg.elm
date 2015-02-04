module Dpg where

import Maybe
import Result
import Result (Result (Ok, Err))
import Signal
import Signal (Signal, Channel, Message)

import Html
import Html (Html, div)

import Dpg.Target as Target
import Dpg.NoiseSource as Source
import Dpg.Generator as Generator


type alias Model =
    { target : Target.Model
    , generator : Generator.Model
    }

type Action
    = TargetAction Target.Action
    | GeneratorAction Generator.Action
    | NoOp

emptyModel : Model
emptyModel =
    { target = Target.emptyModel
    , generator = Generator.emptyModel
    }

update : Action -> Model -> Model
update action model = case action of
    TargetAction a ->
        { model | target <- Target.update a model.target }
    GeneratorAction a ->
        { model | generator <- Generator.update a model.generator }
    _ -> model

view : (Action -> Message) -> Model -> Result String String -> Html
view send model output =
    div []
    [ Target.view (\m -> send (TargetAction m)) model.target
    , case output of
        Ok password -> Html.text ("password: " ++ password)
        Err message -> Html.text ("error: " ++ message)
    , Generator.view (\m -> send (GeneratorAction m)) model.generator
    ]

updates : Channel Action
updates = Signal.channel NoOp

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)

noiseSource : Source.NoiseSource
noiseSource = Source.new (Signal.map (\m -> Result.toMaybe (Target.output m.target)) model)


updateOutput : Model -> Source.Output -> Result String String
updateOutput model noiseOutput = case noiseOutput of
    Source.Ok noise -> Generator.output model.generator noise
    _ -> Err "TODO"

output : Signal (Result String String)
output = Signal.map2 updateOutput model (Source.status noiseSource)


main : Signal Html
main = Signal.map2 (view (Signal.send updates)) model output
