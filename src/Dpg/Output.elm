module Dpg.Output where

import Html exposing (Html, fieldset, legend, text, node)
import Html.Attributes exposing (value)


type Status
    = NoResult
    | Progress Float
    | Result String
    | Error String


viewPassword : Status -> Html
viewPassword status =
    case status of
      Result password -> node "output" [] [text password]
      _ -> text ""

viewStatus : Status -> Html
viewStatus status =
    case status of
      NoResult -> text "Please enter master password and site name"
      Progress progress -> text ("Generating password: " ++ (toString (100 * progress)) ++ "%")
      Result _ -> text ("Password generated succesfully")
      Error message -> text ("Error: " ++ message)

view : Status -> Html
view status =
  fieldset []
    [ legend [] [text "Output"]
    , viewPassword status
    , viewStatus status
    ]
