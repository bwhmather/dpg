module Dpg.NoiseSource where

import String exposing (toUpper)
import Signal
import Time exposing (delay, second)

type alias Noise = String
type NoiseSource = NoiseSource (Signal Output)


type Output
    = Waiting
    | Progress Float
    | Ok Noise
    | Err String

makeOutput : Maybe String -> Output
makeOutput request = case request of
    Just string -> Ok (toUpper string)
    Nothing -> Waiting

new : Signal (Maybe String) -> NoiseSource
new requests = NoiseSource (Signal.map makeOutput (delay (2 * second) requests))

status : NoiseSource -> Signal Output
status (NoiseSource stream) = stream

noise : NoiseSource -> Signal (Maybe Noise)
noise (NoiseSource stream) = Signal.map
    (\o -> case o of
        Ok noise -> Just noise
        _ -> Nothing)
    stream
