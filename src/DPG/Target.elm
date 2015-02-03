module DPG.Target where

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue)

import Signal


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


viewHostname : Model -> Html
viewHostname model =
    label []
        [ text "Hostname:"
        , input
            [ on "change" targetValue (Signal.send updates << Hostname)]
            []
        ]

viewUsername : Model -> Html
viewUsername model =
    label []
        [ text "Username:"
        , input
            [ on "change" targetValue (Signal.send updates << Username)]
            []
        ]

viewPassword : Model -> Html
viewPassword model =
    label []
        [ text "Password:"
        , input
            [ on "change" targetValue (Signal.send updates << Password)]
            []
        ]

view : Model -> Html
view model =
    fieldset []
        [ viewUsername model
        , br [] []
        , viewHostname model
        , br [] []
        , viewPassword model
        , br [] []
        , text <| seedString model
        ]

updates : Signal.Channel Update
updates = Signal.channel NoOp

main : Signal Html
main = Signal.map view model

model : Signal Model
model = Signal.foldp update emptyModel (Signal.subscribe updates)


seedString : Model -> String
seedString model = model.hostname ++ ":" ++ model.username ++ ":" ++ model.password
