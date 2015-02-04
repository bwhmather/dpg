module Dpg.Generator where

import Maybe
import String (length, toInt)
import Result
import Result (Result (Ok, Err))

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue, targetChecked)
import Html.Attributes (stringProperty, boolProperty, value)

import Signal (Message)


type alias Model =
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

emptyModel : Model
emptyModel =
    { length = 16
    , lowercase = True
    , uppercase = True
    , numeric = True
    , symbols = True
    }

update : Action -> Model -> Model
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


viewLength : (Action -> Message) -> Model -> Html
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

viewCharacter : String -> (Bool -> Action) -> (Action -> Message) -> Model -> Html
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


view : (Action -> Message) -> Model -> Html
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
        , br [] []
        , case output model "super secret seed" of
            Err message -> text message
            Ok password -> text password
        ]


output : Model -> String -> Result String String
output model seed =
    if | not ( model.lowercase
            || model.uppercase
            || model.numeric
            || model.symbols) -> Err "Must select at least one character type"
       | model.length < 6 -> Err "Requested output too short"
       | otherwise -> Ok seed
