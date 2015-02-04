module Dpg.NoiseSource where


type Output
    = Calculating
    | Value List Int
    | Error String


noise : Stream Target.Output -> Stream Output
