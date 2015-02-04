module Dpg where

import Maybe
import Result
import Signal
import Signal (Signal, Channel, Message)

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

view : (Action -> Message) -> Model -> Html
view send model =
    div []
    [ Target.view (\m -> send (TargetAction m)) model.target
    , Generator.view (\m -> send (GeneratorAction m)) model.generator
    ]

updates : Channel Action
updates = Signal.channel NoOp

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)

noiseSource : Source.NoiseSource
noiseSource = Source.new (Signal.map (\m -> Result.toMaybe (Target.output m.target)) model)

main : Signal Html
main = Signal.map (view (Signal.send updates)) model
