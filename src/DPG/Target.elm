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


viewHostname : (Action -> Signal.Message) -> Model -> Html
viewHostname send model =
    label []
        [ text "Hostname:"
        , input
            [ on "change" targetValue (send << Hostname) ]
            []
        ]

viewUsername : (Action -> Signal.Message) -> Model -> Html
viewUsername send model =
    label []
        [ text "Username:"
        , input
            [ on "change" targetValue (send << Username) ]
            []
        ]

viewPassword : (Action -> Signal.Message) -> Model -> Html
viewPassword send model =
    label []
        [ text "Password:"
        , input
            [ on "change" targetValue (send << Password) ]
            []
        ]

view : (Action -> Signal.Message) -> Model -> Html
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

updates : Channel Action
updates = Signal.channel NoOp

main : Signal Html
main = Signal.map (view (Signal.send updates)) model

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
