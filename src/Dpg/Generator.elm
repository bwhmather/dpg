module Dpg.Generator (Generator, next) where

import Native.Dpg.Generator

type Generator = Generator


fromInts : List Int -> Generator
fromInts = Native.Dpg.Generator.fromInts

next : Generator -> (Int, Generator)
next = Native.Dpg.Generator.next
