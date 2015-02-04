module DPG.Target where

import String (length)

import Html (Html, br, fieldset, label, text, input)
import Html.Events (on, targetValue)
import Html.Attributes (stringProperty, boolProperty)

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

type Output
    = SeedString String
    | Error String

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
            Error message -> text message
            SeedString message -> text message
        ]

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
