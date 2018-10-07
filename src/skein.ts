function asm(stdlib, foreign, memory) {
  "use asm";

  let TWEAK = new Uint32Array(memory, 0, 6);
  let C = new Uint32Array(memory, 4 * 6, 18);
  let BUFF = new Uint8Array(memory, 4 * 6 + 4 * 18, 64);

  let stack = new Uint32Array(16);
  let stackPointer = stack.length;

  // Loads its two arguments as the high and low 32 bits of a new entry at the
  // top of the stack.
  function ldi(h, l) {
    stackPointer -= 2;
    stack[stackPointer] = h;
    stack[stackPointer + 1] = l;
  }

  // Returns the high 32 bits of the 64 bit value at the top of the stack.
  function peekh() {
    return stack[stackPointer];
  }

  // Returns the low 32 bits of the 64 bit value at the top of the stack.
  function peekl() {
    return stack[stackPointer + 1];
  }

  // Push the 64 bit value at offset `i` in buffer `b` to the top of the stack
  function ldb(b, i) {
    ldi(b[2 * i], b[(2 * i) + 1]);
  }

  // Pop the 64 bit value at the top of the stack and save it at offset `i` in
  // the buffer pointed to by `b`.
  function stb(b, i) {
    let h = peekh(), l = peekl(); pop();
    b[2 * i] = h
    b[(2 * i) + 1] = l
  }

  // Discards the value that is currently at the top of the stack.
  function pop() {
    stackPointer += 2;
  }

  // Replaces the value at the top of the stack with the same value shifted left
  // by `n` bits.
  function shl(n) {
    let h = peekh(), l = peekl(); pop();

    if (n > 32) ldi(l << (n-32), 0)
    else if (n == 32) ldi(l, 0)
    else if (n == 0) ldi(h, l)
    else ldi((h << n) | (l >>> (32 - n)), l << n);
  }

  // Replaces the value at the top of the stack with the same value shifted right
  // by `n` bits.
  function shr(n) {
    let h = peekh(), l = peekl(); pop();

    if (n > 32) ldi(0, h >>> (n - 32))
    else if (n == 32) ldi(0, h);
    else if (n == 0) ldi(h, l);
    else ldi(h >>> n, (h << (32 - n)) | (l >>> n));
  }

  // Pops the top two 64 bit values from the top of the stack and adds them,
  // saving the result as the new top item.
  function add() {
    let ah = peekh(), al = peekl(); pop();
    let bh = peekh(), bl = peekl(); pop();

    let lsw = (al & 0xffff) + (bl & 0xffff);
    let msw = (al >>> 16) + (bl >>> 16) + (lsw >>> 16);
    let l = ((msw & 0xffff) << 16) | (lsw & 0xffff);

    lsw = (ah & 0xffff) + (bh & 0xffff) + (msw >>> 16);
    msw = (ah >>> 16) + (bh >>> 16) + (lsw >>> 16);
    let h = ((msw & 0xffff) << 16) | (lsw & 0xffff);

    ldi(h, l);
  }

  // Pops the top two 64 bit values from the top of the stack and bitwise
  // exclusive ors them, saving the result as the new top item.
  function xor() {
    let ah = peekh(), al = peekl(); pop();
    let bh = peekh(), bl = peekl(); pop();

    ldi(ah ^ bh, al ^ bl);
  }

  function block() {
    let R = [
      38, 30, 50, 53, 48, 31, 43, 20, 34, 14, 15, 27, 26, 7, 58, 12,
      33, 49, 8, 42, 39, 14, 41, 27, 29, 26, 11, 9, 33, 35, 39, 51
    ];
    let X = new Uint32Array(16);
    let T = new Uint32Array(16);
    ldi(0x55555555, 0x55555555); stb(C, 8);
    for (let i = 0; i < 8; i++) {
      for (let j = 7, k = i * 8 + 7; j >= 0; j--, k--) {
        ldb(T, i); shl(8); stb(T, i);
        T[2 * i + 1] |= BUFF[k] & 255;  // TODO
      }
      ldb(T, i); ldb(C, i); add(); stb(X, i);
      ldb(C, 8), ldb(C, i); xor(); stb(C, 8);
    }

    ldb(X, 5); ldb(TWEAK, 0); add(); stb(X, 5);
    ldb(X, 6); ldb(TWEAK, 1); add(); stb(X, 6);
    ldb(TWEAK, 0); ldb(TWEAK, 1); xor(); stb(TWEAK, 2)

    for (let round = 1; round <= 18; round++) {
      let p = 16 - ((round & 1) << 4);
      for (let i = 0; i < 16; i++) {
        // m: 0, 2, 4, 6, 2, 0, 6, 4, 4, 6, 0, 2, 6, 4, 2, 0
        let m = 2 * ((i + (1 + i + i) * (i >> 2)) & 3);
        let n = (1 + i + i) & 7;
        let r = R[p + i];

        ldb(X, m); ldb(X, n); add(); stb(X, m);

        ldb(X, n); shl(r);
        ldb(X, n); shr(64 - r);
        xor(); stb(X, n);

        ldb(X, n); ldb(X, m); xor(); stb(X, n);
      }
      for (var i = 0; i < 8; i++)  {
        ldb(X, i); ldb(C, (round + i) % 9); add(); stb(X, i);
      }

      ldb(X, 5); ldb(TWEAK, round % 3); add(); stb(X, 5);
      ldb(X, 6); ldb(TWEAK, (round + 1) % 3); add(); stb(X, 6);
      ldb(X, 7); ldi(0, round); add(); stb(X, 7);
    }
    for (let i = 0; i < 8; i++) {
      ldb(T, i); ldb(X, i); xor(); stb(C, i);
    }
  }

  return {
    block: block,
  }
}

export function hashBytes(bytes) {
  let stdlib = {}
  let foreign = []
  let memory = new ArrayBuffer(0x100000);

  let tweak = new Uint32Array(memory, 0, 6);
  let c = new Uint32Array(memory, 4 * 6, 18);
  let buff = new Uint8Array(memory, 4 * 6 + 4 * 18, 64);

  let mod = asm(stdlib, foreign, memory)

  tweak.set([0, 32, (0x80 + 0x40 + 0x4) << 24, 0, 0, 0])
  buff.set(new TextEncoder().encode("SHA3\x01\x00\x00\x00\x00\x02"));
  mod.block();

  tweak.set([0, 0, (0x40 + 0x30) << 24, 0, 0, 0]);
  let len = bytes.length, pos = 0;
  for(; len > 64; len -= 64, pos += 64) {
    tweak[1] += 64;
    buff.set(bytes.subarray(pos, pos + 64))
    mod.block();
    tweak[2] = 0x30 << 24;
  }

  tweak[1] += len; tweak[2] |= 0x80 << 24;
  buff.fill(0);
  buff.set(bytes.subarray(pos, pos + 64))
  mod.block();

  tweak[1] = 8; tweak[2] = (0x80 + 0x40 + 0x3f) << 24;
  buff.fill(0);
  mod.block();

  let hash = [];
  for (let i = 0; i < 16; i += 2) {
    hash.push((c[i + 1] >> 0) & 0xff);
    hash.push((c[i + 1] >> 8) & 0xff);
    hash.push((c[i + 1] >> 16) & 0xff);
    hash.push((c[i + 1] >> 24) & 0xff);
    hash.push((c[i] >> 0) & 0xff);
    hash.push((c[i] >> 6) & 0xff);
    hash.push((c[i] >> 16) & 0xff);
    hash.push((c[i] >> 24) & 0xff);
  }
  return hash;
}
