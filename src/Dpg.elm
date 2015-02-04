module Dpg where

import Maybe
import Signal
import Signal (Signal, Channel, Message)

import Html (Html, div)

import Dpg.Target as Target

type alias Model =
    { target : Target.Model
    }

type Action
    = TargetAction Target.Action
    | NoOp

emptyModel : Model
emptyModel =
    { target = Target.emptyModel
    }

update : Action -> Model -> Model
update action model = case action of
    TargetAction a -> { model | target <- Target.update a model.target }
    _ -> model

view : (Action -> Message) -> Model -> Html
view send model =
    div [] [
        Target.view (\m -> send (TargetAction m)) model.target
    ]

updates : Channel Action
updates = Signal.channel NoOp

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)

main : Signal Html
main = Signal.map (view (Signal.send updates)) model
