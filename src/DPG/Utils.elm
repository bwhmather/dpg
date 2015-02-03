module DPG.Utils (filterMap) where

import Signal (Signal, map, keepIf)

-- TODO belongs upstream
filterMap : (a -> Maybe b) -> b -> Signal a -> Signal b
filterMap filter default input =
    map filter input
    |> keepIf (\item ->
            case item of
                Just _ -> True
                Nothing -> False)
        (Just default)
    |> map (\(Just value) -> value)
