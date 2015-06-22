Elm.Native.Dpg = Elm.Native.Dpg || {};

Elm.Native.Dpg.Generator = {};
Elm.Native.Dpg.Generator.make = function(elm) {
    elm.Native = elm.Native || {};
    elm.Native.Dpg = elm.Native.Dpg || {};
    elm.Native.Dpg.Generator = elm.Native.Dpg.Generator || {};

    if (elm.Native.Dpg.Generator.values) {
        return elm.Native.Dpg.Generator.values;
    }

    var MAX_INT = 4294967296.0;
    var N = 624;
    var M = 397;
    var UPPER_MASK = 0x80000000;
    var LOWER_MASK = 0x7fffffff;
    var MATRIX_A = 0x9908b0df;

    var reseed = function(gen, seed) {
        var s;

        gen.mt[0] = seed >>> 0;

        for (gen.mti = 1; gen.mti < N; gen.mti++) {
            s = gen.mt[gen.mti - 1] ^ (gen.mt[gen.mti - 1] >>> 30);
            gen.mt[gen.mti] =
                (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0x0000ffff) * 1812433253) + gen.mti;
            gen.mt[gen.mti] >>>= 0;
        }
    };

    var fromInt = function(seed) {
        var generator = {
            ctor: "Generator",
            mt: new Array(N),
            mti: N + 1
        }

        reseed(generator, seed);

        return generator;
    };

    var fromInts = function(vector) {
        var i = 1;
        var j = 0;
        var k = N > vector.length ? N : vector.length;
        var s;

        var gen = fromInt(19650218);

        for (; k > 0; k--) {
            s = gen.mt[i-1] ^ (gen.mt[i-1] >>> 30);

            gen.mt[i] = (gen.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16) + ((s & 0x0000ffff) * 1664525))) +
                vector[j] + j;
            gen.mt[i] >>>= 0;
            i++;
            j++;
            if (i >= N) {
                gen.mt[0] = gen.mt[N - 1];
                i = 1;
            }
            if (j >= vector.length) {
                j = 0;
            }
        }

        for (k = N - 1; k; k--) {
            s = gen.mt[i - 1] ^ (gen.mt[i - 1] >>> 30);
            gen.mt[i] =
                (gen.mt[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16) + (s & 0x0000ffff) * 1566083941)) - i;
            gen.mt[i] >>>= 0;
            i++;
            if (i >= N) {
                gen.mt[0] = gen.mt[N - 1];
                i = 1;
            }
        }

        gen.mt[0] = 0x80000000;

        return gen;
    };

    var next = function (gen) {
        var y;
        var kk;
        var mag01 = new Array(0, MATRIX_A);

        gen = {
            ctor: "Generator",
            mt: gen.mt.slice(0),
            mti: gen.mti
        };

        if (gen.mti >= N) {
            if (gen.mti === N + 1) {
                reseed(gen, 5489);
            }

            for (kk = 0; kk < N - M; kk++) {
                y = (gen.mt[kk] & UPPER_MASK) | (gen.mt[kk + 1] & LOWER_MASK);
                gen.mt[kk] = gen.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 1];
            }

            for (; kk < N - 1; kk++) {
                y = (gen.mt[kk] & UPPER_MASK) | (gen.mt[kk + 1] & LOWER_MASK);
                gen.mt[kk] = gen.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 1];
            }

            y = (gen.mt[N - 1] & UPPER_MASK) | (gen.mt[0] & LOWER_MASK);
            gen.mt[N - 1] = gen.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 1];
            gen.mti = 0;
        }

        y = gen.mt[gen.mti++];

        y ^= (y >>> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >>> 18);

        return {_0: y >>> 0, _1: gen};
    };

    return elm.Native.Dpg.Generator.values = { 
        fromInts: fromInts,
        next: next
    };
};
