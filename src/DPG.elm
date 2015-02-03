module DPG where

import Signal (Signal)
import Html (Html)

import DPG.Target as Target


main : Signal Html
main = Target.main
