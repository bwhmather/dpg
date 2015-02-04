module DPG where

import Maybe
import Signal
import Signal (Signal, Channel, Message)

import Html (Html, div)

import DPG.Utils (filterMap)
import DPG.Target as Target

type alias Model =
    { target : Target.Model
    }

type Action
    = TargetAction Target.Action
    | NoOp

updates : Channel Action
updates = Signal.channel NoOp

emptyModel : Model
emptyModel =
    { target = Target.emptyModel
    }

update : Action -> Model -> Model
update action model = case action of
    TargetAction a -> { model | target <- Target.update a model.target }
    _ -> model

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)

view : (Action -> Message) -> Model -> Html
view send model =
    div [] [
        Target.view (\m -> send (TargetAction m)) model.target
    ]

main : Signal Html
main = Signal.map (view (Signal.send updates)) model
