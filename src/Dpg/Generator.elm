module Dpg.Generator where

import Maybe
import String (length, toInt)
import Result
import Result (Result (Ok, Err))

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue, targetChecked)
import Html.Attributes (stringProperty, boolProperty, value)

import Signal (Message)

import Dpg.NoiseSource (Noise)


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

defaultSettings : Settings
defaultSettings =
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


viewLength : (Action -> Message) -> Settings -> Html
viewLength send settings =
    label []
        [ text "Password length:"
        , input
            [ on "change" targetValue
                ( send << Length
                       << Maybe.withDefault 0
                       << Result.toMaybe
                       << toInt)
            , value (toString settings.length)
            , stringProperty "type" "number"
            ]
            []
        ]

viewCharacter : String -> (Bool -> Action) -> (Action -> Message) -> Settings -> Html
viewCharacter name constructor send settings =
    label []
        [ text ("Enable " ++ name ++ ":")
        , input
            [ on "change" targetChecked (send << constructor)
            , stringProperty "type" "checkbox"
            , stringProperty "checked" "checked"
            ]
            []
        ]

view : (Action -> Message) -> Settings -> Html
view send settings =
    fieldset []
        [ viewLength send settings
        , br [] []
        , viewCharacter "lowercase" Lowercase send settings
        , br [] []
        , viewCharacter "uppercase" Uppercase send settings
        , br [] []
        , viewCharacter "numbers" Numeric send settings
        , br [] []
        , viewCharacter "symbols" Symbols send settings
        ]


output : Settings -> Noise -> Result String String
output settings seed =
    if | not ( settings.lowercase
            || settings.uppercase
            || settings.numeric
            || settings.symbols) -> Err "Must select at least one character type"
       | settings.length < 6 -> Err "Requested output too short"
       | otherwise -> Ok seed
