module Dpg.Utils where

import Html exposing (Attribute)
import Html.Attributes exposing (property)

import Json.Encode as Json


stringProperty : String -> String -> Attribute
stringProperty name string =
  property name (Json.string string)


boolProperty : String -> Bool -> Attribute
boolProperty name bool =
  property name (Json.bool bool)

