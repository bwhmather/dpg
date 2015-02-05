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
    | NoOp

defaultSettings : Settings
defaultSettings =
    { length = 16
    , lowercase = True
    , uppercase = True
    , numeric = True
    , symbols = True
    }

update : Action -> Settings -> Settings
update updt model =
  case updt of
    Length content ->
        { model | length <- content }
    Lowercase enabled ->
        { model | lowercase <- enabled }
    Uppercase enabled ->
        { model | uppercase <- enabled }
    Numeric enabled ->
        { model | numeric <- enabled }
    Symbols enabled ->
        { model | symbols <- enabled }
    NoOp ->
        model


viewLength : (Action -> Message) -> Settings -> Html
viewLength send model =
    label []
        [ text "Password length:"
        , input
            [ on "change" targetValue
                ( send << Length
                       << Maybe.withDefault 0
                       << Result.toMaybe
                       << toInt)
            , value (toString model.length)
            , stringProperty "type" "number"
            ]
            []
        ]

viewCharacter : String -> (Bool -> Action) -> (Action -> Message) -> Settings -> Html
viewCharacter name constructor send model =
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
view send model =
    fieldset []
        [ viewLength send model
        , br [] []
        , viewCharacter "lowercase" Lowercase send model
        , br [] []
        , viewCharacter "uppercase" Uppercase send model
        , br [] []
        , viewCharacter "numbers" Numeric send model
        , br [] []
        , viewCharacter "symbols" Symbols send model
        ]


output : Settings -> Noise -> Result String String
output model seed =
    if | not ( model.lowercase
            || model.uppercase
            || model.numeric
            || model.symbols) -> Err "Must select at least one character type"
       | model.length < 6 -> Err "Requested output too short"
       | otherwise -> Ok seed
