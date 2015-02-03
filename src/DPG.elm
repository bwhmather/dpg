module DPG where

import Maybe
import Signal
import Signal (Signal, Channel, Message)

import Html (Html)

import DPG.Target as Target

filterMap : (a -> Maybe b) -> b -> Signal a -> Signal b
filterMap filter default input =
    Signal.map filter input
    |> Signal.keepIf (\item ->
            case item of
                Just _ -> True
                Nothing -> False)
        (Just default)
    |> Signal.map (\(Just value) -> value)

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
