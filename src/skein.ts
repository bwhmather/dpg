// tslint:disable:no-bitwise
// tslint:disable:one-variable-per-declaration
function asm(stdlib, foreign, memory) {
  "use asm";

  const imul = stdlib.Math.imul;

  const HEAP8 = new stdlib.Uint8Array(memory);
  const HEAP32 = new stdlib.Uint32Array(memory);

  // The tweak array.  This is an array of settings describing the current
  // block and its position in the stream.  A 3 word long array of 64 bit
  // integers.
  const TWEAK = 0;
  // The accumulator array.  This stores the state that is updated by with each
  // block.  A nine word long array of 64 bit integers.  The first eight words
  // are returned as the result of the hash operation.
  const C = 24;  // (8 * 3);
  // The input buffer.  This is a 64 byte long byte array.
  const BUFF = 96;  // (8 * 3) + (8 * 9);
  const R = 160; // (8 * 3) + (8 * 9) + 64;

  // Intermediate arrays, each containing 8 64 bit numbers.
  const X = 192;  // (8 * 3) + (8 * 9) + 64 + 32;
  const T = 256;  // (8 * 3) + (8 * 9) + 64 + 32 + (8 * 8);

  let STACK = 320;  // (8 * 3) + (8 * 9) + 64 + (8 * 8) + (8 * 8);

  // Loads its two arguments as the high and low 32 bits of a new entry at the
  // top of the stack.
  function ldi(h, l) {
    h = h | 0;
    l = l | 0;

    STACK = STACK + 8 | 0;
    HEAP32[STACK >> 2] = h;
    HEAP32[STACK + 4 >> 2] = l;
  }

  // Returns the high 32 bits of the 64 bit value at the top of the stack.
  function peekh() {
    return HEAP32[STACK >> 2] | 0;
  }

  // Returns the low 32 bits of the 64 bit value at the top of the stack.
  function peekl() {
    return HEAP32[STACK + 4 >> 2] | 0;
  }

  // Push the 64 bit value at offset `i` in buffer `b` to the top of the stack
  function ldb(b, i) {
    b = b | 0;
    i = i | 0;

    ldi(
      HEAP32[b + (8 * i | 0) >> 2] | 0,
      HEAP32[b + (8 * i | 0) + 4 >> 2] | 0,
    );
  }

  // Pop the 64 bit value at the top of the stack and save it at offset `i` in
  // the buffer pointed to by `b`.
  function stb(b, i) {
    b = b | 0;
    i = i | 0;

    let h = 0, l = 0;
    h = peekh() | 0; l = peekl() | 0; pop();

    HEAP32[b + (8 * i | 0) >> 2] = h;
    HEAP32[b + (8 * i | 0) + 4 >> 2] = l;
  }

  // Discards the value that is currently at the top of the stack.
  function pop() {
    STACK = STACK - 8 | 0;
  }

  // Replaces the value at the top of the stack with the same value shifted left
  // by `n` bits.
  function shl(n) {
    n = n | 0;

    let h = 0, l = 0;
    h = peekh() | 0; l = peekl() | 0; pop();

    if ((n | 0) >= (32 | 0)) {
      ldi(l << (n - 32), 0);
    } else {
      ldi((h << n) | (l >>> (32 - n)), l << n);
    }
  }

  // Replaces the value at the top of the stack with the same value shifted right
  // by `n` bits.
  function shr(n) {
    n = n | 0;

    let h = 0, l = 0;
    h = peekh() | 0; l = peekl() | 0; pop();

    if ((n | 0) >= (32 | 0)) {
      ldi(0, h >>> (n - 32));
    } else {
      ldi(h >>> n, (h << (32 - n)) | (l >>> n));
    }
  }

  // Pops the top two 64 bit values from the top of the stack and adds them,
  // saving the result as the new top item.
  function add() {
    let ah = 0, al = 0, bh = 0, bl = 0;
    let lsw = 0, msw = 0, l = 0, h = 0;

    ah = peekh() | 0; al = peekl() | 0; pop();
    bh = peekh() | 0; bl = peekl() | 0; pop();

    lsw = (al & 0xffff) + (bl & 0xffff) | 0;
    msw = (al >>> 16) + (bl >>> 16) + (lsw >>> 16) | 0;
    l = ((msw & 0xffff) << 16) | (lsw & 0xffff);

    lsw = (ah & 0xffff) + (bh & 0xffff) + (msw >>> 16) | 0;
    msw = (ah >>> 16) + (bh >>> 16) + (lsw >>> 16) | 0;
    h = ((msw & 0xffff) << 16) | (lsw & 0xffff);

    ldi(h, l);
  }

  // Pops the top two 64 bit values from the top of the stack and bitwise
  // exclusive ors them, saving the result as the new top item.
  function xor() {
    let ah = 0, al = 0, bh = 0, bl = 0;
    ah = peekh() | 0; al = peekl() | 0; pop();
    bh = peekh() | 0; bl = peekl() | 0; pop();

    ldi(ah ^ bh, al ^ bl);
  }

  function block() {
    let i = 0, j = 0, k = 0;
    let l = 0, h = 0;
    let round = 0, p = 0;
    let m = 0, n = 0, r = 0;

    // Zero out the X and T arrays.
    for (i = 0; (i | 0) < (8 | 0); i = i + 1 | 0) {
      ldi(0, 0); stb(X, i);
      ldi(0, 0); stb(T, i);
    }

    ldi(0x55555555, 0x55555555); stb(C, 8);
    for (i = 0; (i | 0) < (8 | 0); i = i + 1 | 0) {
      k = (i * 8) | 0;
      for (j = 7; (j | 0) >= (0 | 0); j = j - 1 | 0) {
        ldb(T, i); shl(8); stb(T, i);

        ldb(T, i);
        h = peekh() | 0; l = peekl() | 0; pop();
        l = l | HEAP8[BUFF + k + j | 0] & 0xff;
        ldi(h, l); stb(T, i);
      }
      ldb(T, i); ldb(C, i); add(); stb(X, i);
      ldb(C, 8); ldb(C, i); xor(); stb(C, 8);
    }

    ldb(X, 5); ldb(TWEAK, 0); add(); stb(X, 5);
    ldb(X, 6); ldb(TWEAK, 1); add(); stb(X, 6);
    ldb(TWEAK, 0); ldb(TWEAK, 1); xor(); stb(TWEAK, 2);

    for (round = 1; (round | 0) <= (18 | 0); round = round + 1 | 0) {
      p = 16 - ((round & 1) << 4) | 0;
      for (i = 0; (i | 0) < (16 | 0); i = i + 1 | 0) {
        // m: 0, 2, 4, 6, 2, 0, 6, 4, 4, 6, 0, 2, 6, 4, 2, 0
        m = imul(2, (i + imul(1 + i + i, i >> 2) | 0) & 3);
        n = (1 + i + i) & 7;
        r = HEAP8[R + p + i | 0] | 0;

        ldb(X, m); ldb(X, n); add(); stb(X, m);

        ldb(X, n); shl(r);
        ldb(X, n); shr(64 - r | 0);
        xor(); stb(X, n);

        ldb(X, n); ldb(X, m); xor(); stb(X, n);
      }
      for (i = 0; (i | 0) < (8 | 0); i = i + 1 | 0)  {
        ldb(X, i); ldb(C, (round + i | 0) % 9 | 0); add(); stb(X, i);
      }

      ldb(X, 5); ldb(TWEAK, (round | 0) % 3 | 0); add(); stb(X, 5);
      ldb(X, 6); ldb(TWEAK, (round + 1 | 0) % 3 | 0); add(); stb(X, 6);
      ldb(X, 7); ldi(0, round); add(); stb(X, 7);
    }
    for (i = 0; (i | 0) < (8 | 0); i = i + 1 | 0) {
      ldb(T, i); ldb(X, i); xor(); stb(C, i);
    }
  }

  return {
    block,
  };
}

export function hashBytes(bytes) {
  const stdlib = {
    Math,
    Uint32Array,
    Uint8Array,
  };
  const foreign = [];
  const memory = new ArrayBuffer(0x100000);

  const tweak = new Uint32Array(memory, 0, 6);
  const c = new Uint32Array(memory, 4 * 6, 18);
  const buff = new Uint8Array(memory, 4 * 6 + 4 * 18, 64);
  const r = new Uint8Array(memory, 4 * 6 + 4 * 18 + 64, 32);

  const mod = asm(stdlib, foreign, memory);

  // Deprecated constants from original submission.
  r.set([
    38, 30, 50, 53, 48, 31, 43, 20, 34, 14, 15, 27, 26, 7, 58, 12,
    33, 49, 8, 42, 39, 14, 41, 27, 29, 26, 11, 9, 33, 35, 39, 51,
  ]);

  tweak.set([0, 32, (0x80 + 0x40 + 0x4) << 24, 0, 0, 0]);
  buff.set(new TextEncoder().encode("SHA3\x01\x00\x00\x00\x00\x02"));
  mod.block();

  tweak.set([0, 0, (0x40 + 0x30) << 24, 0, 0, 0]);
  let len = bytes.length;
  let pos = 0;
  for (; len > 64; len -= 64, pos += 64) {
    tweak[1] += 64;
    buff.set(bytes.subarray(pos, pos + 64));
    mod.block();
    tweak[2] = 0x30 << 24;
  }

  tweak[1] += len; tweak[2] |= 0x80 << 24;
  buff.fill(0);
  buff.set(bytes.subarray(pos, pos + 64));
  mod.block();

  tweak[1] = 8; tweak[2] = (0x80 + 0x40 + 0x3f) << 24;
  buff.fill(0);
  mod.block();

  const hash = [];
  for (let i = 0; i < 16; i += 2) {
    hash.push((c[i + 1] >> 0) & 0xff);
    hash.push((c[i + 1] >> 8) & 0xff);
    hash.push((c[i + 1] >> 16) & 0xff);
    hash.push((c[i + 1] >> 24) & 0xff);
    hash.push((c[i] >> 0) & 0xff);
    hash.push((c[i] >> 8) & 0xff);
    hash.push((c[i] >> 16) & 0xff);
    hash.push((c[i] >> 24) & 0xff);
  }
  return hash;
}
