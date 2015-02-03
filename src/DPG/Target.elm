module DPG.Target where

import String (length)

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue)

import Signal
import Signal (Signal, Channel)


type alias Model =
    { hostname : String
    , username : String
    , password : String
    }

type Update
    = Hostname String
    | Username String
    | Password String
    | NoOp

type Output
    = SeedString String
    | Error String

emptyModel : Model
emptyModel =
    { hostname = ""
    , username = ""
    , password = ""
    }

update : Update -> Model -> Model
update updt model =
  case updt of
    Hostname content ->
        { model | hostname <- content }
    Username content ->
        { model | username <- content }
    Password content ->
        { model | password <- content }
    NoOp ->
        model


viewHostname : Channel Update -> Model -> Html
viewHostname updates model =
    label []
        [ text "Hostname:"
        , input
            [ on "change" targetValue (Signal.send updates << Hostname) ]
            []
        ]

viewUsername : Channel Update -> Model -> Html
viewUsername updates model =
    label []
        [ text "Username:"
        , input
            [ on "change" targetValue (Signal.send updates << Username) ]
            []
        ]

viewPassword : Channel Update -> Model -> Html
viewPassword updates model =
    label []
        [ text "Password:"
        , input
            [ on "change" targetValue (Signal.send updates << Password) ]
            []
        ]

view : Channel Update -> Model -> Html
view updates model =
    fieldset []
        [ viewHostname updates model
        , br [] []
        , viewUsername updates model
        , br [] []
        , viewPassword updates model
        , br [] []
        , case output model of
            Error message -> text message
            SeedString message -> text message
        ]

updates : Channel Update
updates = Signal.channel NoOp

main : Signal Html
main = Signal.map (view updates) model

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)


output : Model -> Output
output model =
    if | length model.hostname == 0 -> Error "Please enter a hostname"
       | length model.username == 0 -> Error "Please enter a username"
       | length model.password == 0 -> Error "Please enter a password"
       | otherwise -> SeedString
            (model.hostname ++ ":" ++ model.username ++ ":" ++ model.password)


error : Model -> Maybe String
error model = case output model of
    Error message -> Just message
    _ -> Nothing


seedString : Model -> Maybe String
seedString model = case output model of
    SeedString message -> Just message
    _ -> Nothing
