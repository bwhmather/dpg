module DPG where

import Maybe
import Signal
import Signal (Signal, Channel, Message)

import Html (Html)

import DPG.Utils (filterMap)
import DPG.Target as Target


type Action
    = TargetAction Target.Action
    | NoOp

sendTargetAction : Channel Action -> Target.Action -> Message
sendTargetAction updates action = Signal.send updates (TargetAction action)

targetActions : Signal Action -> Signal Target.Action
targetActions = filterMap
    (\ action -> case action of
        TargetAction tAction -> Just tAction
        _ -> Nothing)
    Target.NoOp


updates : Channel Action
updates = Signal.channel NoOp

model : Signal Target.Model
model = Signal.foldp Target.update Target.emptyModel (targetActions (Signal.subscribe updates))

main : Signal Html
main = Signal.map (Target.view (sendTargetAction updates)) model
