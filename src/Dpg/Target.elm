module Dpg.Target where

import String exposing (length)
import Result exposing (Result(Ok, Err))

import Html exposing (Html, br, fieldset, label, text, input)
import Html.Events exposing (on, targetValue)
import Html.Attributes exposing (stringProperty, boolProperty, value)

import Signal exposing (Message)


type alias Settings =
    { hostname : String
    , username : String
    , password : String
    }

type Action
    = Hostname String
    | Username String
    | Password String

defaultSettings : Settings
defaultSettings =
    { hostname = ""
    , username = ""
    , password = ""
    }

update : Action -> Settings -> Settings
update action settings =
  case action of
    Hostname content ->
        { settings | hostname <- content }
    Username content ->
        { settings | username <- content }
    Password content ->
        { settings | password <- content }


viewHostname : (Action -> Message) -> Settings -> Html
viewHostname send settings =
    label []
        [ text "Hostname:"
        , input
            [ on "change" targetValue (send << Hostname)
            , value settings.hostname
            , boolProperty "autofocus" True
            , stringProperty "autocorrect" "off"
            , stringProperty "autocapitalize" "off"
            , stringProperty "type" "text"
            ]
            []
        ]

viewUsername : (Action -> Message) -> Settings -> Html
viewUsername send settings =
    label []
        [ text "Username:"
        , input
            [ on "change" targetValue (send << Username)
            , value settings.username
            , stringProperty "autocorrect" "off"
            , stringProperty "autocapitalize" "off"
            , stringProperty "type" "text"
            ]
            []
        ]

viewPassword : (Action -> Message) -> Settings -> Html
viewPassword send settings =
    label []
        [ text "Password:"
        , input
            [ on "change" targetValue (send << Password)
            , value settings.password
            , stringProperty "type" "password"
            ]
            []
        ]

view : (Action -> Message) -> Settings -> Html
view send settings =
    fieldset []
        [ viewHostname send settings
        , br [] []
        , viewUsername send settings
        , br [] []
        , viewPassword send settings
        ]


output : Settings -> Result String String
output settings =
    if | length settings.hostname == 0 -> Err "Please enter a hostname"
       | length settings.username == 0 -> Err "Please enter a username"
       | length settings.password == 0 -> Err "Please enter a password"
       | otherwise -> Ok
            (settings.hostname ++ ":" ++ settings.username ++ ":" ++ settings.password)
