module WebWorker
    ( Request(SendMessage, NoOp)
    , Response(Waiting, Message, Error)
    , spawn
    ) where
-- TODO belongs in bwhmather/elm-webworker package

{-| A simple library for spawning and communicating with Web Workers.
# Open a Connection
@docs connect
-}

import Signal exposing (Signal)
import Json.Encode
import Json.Decode
import Native.WebWorker


type Request
    = SendMessage Json.Encode.Value
    | NoOp

type Response
    = Waiting
    | Message Json.Decode.Value
    | Error String


{-| Spawn a new web-worker instance running the script named in the first
argument.  The worker can send and receive arbitrary json objects.
-}
spawn : String -> Signal Request -> Signal Response
spawn = Native.WebWorker.spawn
