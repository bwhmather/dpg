module Dpg.Output where

import Html exposing (Html, fieldset, legend, text)


type Output
    = NoResult
    | Progress Float
    | Result String
    | Error String


view : Output -> Html
view output =
  fieldset []
    [ legend [] [text "Output"]
    , case output of
        NoResult -> Html.text "empty"
        Progress progress -> Html.text ("progress: " ++ (toString (100 * progress)) ++ "%")
        Result password -> Html.text ("password: " ++ password)
        Error message -> Html.text ("error: " ++ message)
    ]
