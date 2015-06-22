module Dpg.Target where

import String exposing (length)
import Result exposing (Result(Ok, Err))

import Html exposing (Html, br, fieldset, legend, label, text, input)
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


initialSettings : Settings
initialSettings =
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


viewHostname : Signal.Address Action -> Settings -> Html
viewHostname address settings =
  label []
    [ text "Hostname:"
    , input
        [ on "change" targetValue (Signal.message address << Hostname)
        , value settings.hostname
        , boolProperty "autofocus" True
        , stringProperty "autocorrect" "off"
        , stringProperty "autocapitalize" "off"
        , stringProperty "type" "text"
        ]
        []
    ]

viewUsername : Signal.Address Action -> Settings -> Html
viewUsername address settings =
  label []
    [ text "Username:"
    , input
      [ on "change" targetValue (Signal.message address << Username)
      , value settings.username
      , stringProperty "autocorrect" "off"
      , stringProperty "autocapitalize" "off"
      , stringProperty "type" "text"
      ]
      []
    ]

viewPassword : Signal.Address Action -> Settings -> Html
viewPassword address settings =
  label []
    [ text "Password:"
    , input
      [ on "change" targetValue (Signal.message address << Password)
      , value settings.password
      , stringProperty "type" "password"
      ]
      []
    ]

view : Signal.Address Action -> Settings -> Html
view address settings =
  fieldset []
    [ legend [] [text "Login Details"]
    , viewHostname address settings
    , viewUsername address settings
    , viewPassword address settings
    ]


output : Settings -> Result String { salt : String, password : String }
output settings =
    if | length settings.hostname == 0 -> Err "Please enter a hostname"
       | length settings.username == 0 -> Err "Please enter a username"
       | length settings.password == 0 -> Err "Please enter a password"
       | otherwise -> Ok
            { salt = settings.hostname ++ ":" ++ settings.username
            , password = settings.password
            }

error : Settings -> Maybe String
error settings = case output settings of
    Err msg -> Just msg
    Ok _ -> Nothing
