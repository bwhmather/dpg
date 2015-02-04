module Dpg.Target where

import String (length)
import Result (Result(Ok, Err))

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue)
import Html.Attributes (stringProperty, boolProperty, value)

import Signal (Message)


type alias Model =
    { hostname : String
    , username : String
    , password : String
    }

type Action
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

update : Action -> Model -> Model
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


viewHostname : (Action -> Message) -> Model -> Html
viewHostname send model =
    label []
        [ text "Hostname:"
        , input
            [ on "change" targetValue (send << Hostname)
            , value model.hostname
            , boolProperty "autofocus" True
            , stringProperty "autocorrect" "off"
            , stringProperty "autocapitalize" "off"
            , stringProperty "type" "text"
            ]
            []
        ]

viewUsername : (Action -> Message) -> Model -> Html
viewUsername send model =
    label []
        [ text "Username:"
        , input
            [ on "change" targetValue (send << Username)
            , value model.username
            , stringProperty "autocorrect" "off"
            , stringProperty "autocapitalize" "off"
            , stringProperty "type" "text"
            ]
            []
        ]

viewPassword : (Action -> Message) -> Model -> Html
viewPassword send model =
    label []
        [ text "Password:"
        , input
            [ on "change" targetValue (send << Password)
            , value model.password
            , stringProperty "type" "password"
            ]
            []
        ]

view : (Action -> Message) -> Model -> Html
view send model =
    fieldset []
        [ viewHostname send model
        , br [] []
        , viewUsername send model
        , br [] []
        , viewPassword send model
        , br [] []
        , case output model of
            Err message -> text message
            Ok message -> text message
        ]


output : Model -> Result String String
output model =
    if | length model.hostname == 0 -> Err "Please enter a hostname"
       | length model.username == 0 -> Err "Please enter a username"
       | length model.password == 0 -> Err "Please enter a password"
       | otherwise -> Ok
            (model.hostname ++ ":" ++ model.username ++ ":" ++ model.password)
