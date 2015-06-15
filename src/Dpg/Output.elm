module Dpg.Output where

import Html exposing (Html, fieldset, legend, text)
import Html.Attributes exposing (value)


type Status
    = NoResult
    | Progress Float
    | Result String
    | Error String


viewPassword : Status -> Html
viewPassword status =
    case status of
      Result password -> Html.node "output" [] [Html.text password]
      _ -> Html.text ""

viewStatus : Status -> Html
viewStatus status =
    case status of
      NoResult -> Html.text "Please enter master password and site name"
      Progress progress -> Html.text ("Generating password: " ++ (toString (100 * progress)) ++ "%")
      Result _ -> Html.text ("Password generated succesfully")
      Error message -> Html.text ("Error: " ++ message)

view : Status -> Html
view status =
  fieldset []
    [ legend [] [text "Output"]
    , viewPassword status
    , viewStatus status
    ]
