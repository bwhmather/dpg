module Dpg.Renderer where

import Maybe
import String exposing (length, toInt)
import Result
import Result exposing (Result (Ok, Err))

import Html exposing (Html, br, fieldset, legend, label, text, input, span)
import Html.Events exposing (on, targetValue, targetChecked)
import Html.Attributes exposing (value)

import Signal exposing (Message)

import Dpg.Utils exposing (stringProperty, boolProperty)
import Dpg.Generator as Generator exposing (Generator)


type alias Settings =
    { length : Int
    , lowercase : Bool
    , uppercase : Bool
    , numeric : Bool
    , symbols : Bool
    }

type Action
    = Length Int
    | Lowercase Bool
    | Uppercase Bool
    | Numeric Bool
    | Symbols Bool

initialSettings : Settings
initialSettings =
    { length = 16
    , lowercase = True
    , uppercase = True
    , numeric = True
    , symbols = True
    }


update : Action -> Settings -> Settings
update action settings =
    case action of
      Length content ->
          { settings | length <- content }
      Lowercase enabled ->
          { settings | lowercase <- enabled }
      Uppercase enabled ->
          { settings | uppercase <- enabled }
      Numeric enabled ->
          { settings | numeric <- enabled }
      Symbols enabled ->
          { settings | symbols <- enabled }


viewLength : Signal.Address Action -> Settings -> Html
viewLength address settings =
  label []
    [ text "Password length:"
    , input
      [ on "change" targetValue
          ( Signal.message address
                 << Length
                 << Maybe.withDefault 0
                 << Result.toMaybe
                 << toInt)
      , value (toString settings.length)
      , stringProperty "type" "number"
      ]
      []
    ]

viewCharacter : String -> Signal.Address Bool -> Settings -> Html
viewCharacter name address settings =
  label []
    [ text ("Enable " ++ name ++ ":")
    , input
      [ on "change" targetChecked (Signal.message address)
      , stringProperty "type" "checkbox"
      , stringProperty "checked" "checked"
      ]
      []
    , span [] []
    ]

view : Signal.Address Action -> Settings -> Html
view address settings =
  fieldset []
    [ legend [] [text "Options"]
    , viewLength address settings
    , viewCharacter "lowercase" (Signal.forwardTo address Lowercase) settings
    , viewCharacter "uppercase" (Signal.forwardTo address Uppercase) settings
    , viewCharacter "numbers" (Signal.forwardTo address Numeric) settings
    , viewCharacter "symbols" (Signal.forwardTo address Symbols) settings
    ]


getSrcChars : Settings -> String
getSrcChars settings
    =  (if settings.lowercase then "abcdefghijklmnopqrstuvwxyz" else "")
    ++ (if settings.uppercase then "ABCDEFGHIJKLMNOPQRSTUVWXYZ" else "")
    ++ (if settings.numeric then "01234567890123456789" else "")
    ++ (if settings.symbols then "!\"#$%&'()*+,-./:;<=>>@[\\]^_`{|}~" else "")


render : String -> Int -> Generator -> String
render srcChars length generator = case length of
    0 -> ""
    _ -> let (seed, generator') = Generator.next generator
             index = seed % (String.length srcChars)
             rest = render srcChars (length - 1) generator'
             head = String.slice index (index + 1) srcChars
         in
             head ++ rest


output : Settings -> Result String (Generator -> String)
output settings =
    if | not ( settings.lowercase
            || settings.uppercase
            || settings.numeric
            || settings.symbols) -> Err "Must select at least one character type"
       | settings.length < 6 -> Err "Requested output too short"
       | otherwise -> Ok (render (getSrcChars settings) settings.length)

error : Settings -> Maybe String
error settings =
    case output settings of
      Err msg -> Just msg
      Ok _ -> Nothing
