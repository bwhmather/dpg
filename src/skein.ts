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

function block(c, tweak, b, off) {
  let R = [
    38, 30, 50, 53, 48, 31, 43, 20, 34, 14, 15, 27, 26, 7, 58, 12,
    33, 49, 8, 42, 39, 14, 41, 27, 29, 26, 11, 9, 33, 35, 39, 51
  ];
  let x = new Uint32Array(16);
  let t = new Uint32Array(16);
  ldi(0x55555555, 0x55555555); stb(c, 8);
  for (let i = 0; i < 8; i++) {
    for (let j = 7, k = off + i * 8 + 7; j >= 0; j--, k--) {
      ldb(t, i); shl(8); stb(t, i);
      t[2 * i + 1] |= b[k] & 255;  // TODO
    }
    ldb(t, i); ldb(c, i); add(); stb(x, i);
    ldb(c, 8), ldb(c, i); xor(); stb(c, 8);
  }

  ldb(x, 5); ldb(tweak, 0); add(); stb(x, 5);
  ldb(x, 6); ldb(tweak, 1); add(); stb(x, 6);
  ldb(tweak, 0); ldb(tweak, 1); xor(); stb(tweak, 2)

  for (let round = 1; round <= 18; round++) {
    let p = 16 - ((round & 1) << 4);
    for (let i = 0; i < 16; i++) {
      // m: 0, 2, 4, 6, 2, 0, 6, 4, 4, 6, 0, 2, 6, 4, 2, 0
      let m = 2 * ((i + (1 + i + i) * (i >> 2)) & 3);
      let n = (1 + i + i) & 7;
      let r = R[p + i];

      ldb(x, m); ldb(x, n); add(); stb(x, m);

      ldb(x, n); shl(r);
      ldb(x, n); shr(64 - r);
      xor(); stb(x, n);

      ldb(x, n); ldb(x, m); xor(); stb(x, n);
    }
    for (var i = 0; i < 8; i++)  {
      ldb(x, i); ldb(c, (round + i) % 9); add(); stb(x, i);
    }

    ldb(x, 5); ldb(tweak, round % 3); add(); stb(x, 5);
    ldb(x, 6); ldb(tweak, (round + 1) % 3); add(); stb(x, 6);
    ldb(x, 7); ldi(0, round); add(); stb(x, 7);
  }
  for (let i = 0; i < 8; i++) {
    ldb(t, i); ldb(x, i); xor(); stb(c, i);
  }
}

export function hashBytes(msg) {
  let tweak = new Uint32Array(
    [0, 32, (0x80 + 0x40 + 0x4) << 24, 0, 0, 0]
  );
  let c = new Uint32Array(18);
  let buff = new TextEncoder().encode("SHA3\x01\x00\x00\x00\x00\x02");
  block(c, tweak, buff, 0);

  tweak = new Uint32Array([0, 0, (0x40 + 0x30) << 24, 0, 0, 0]);
  let len = msg.length, pos = 0;
  for(; len > 64; len -= 64, pos += 64) {
    tweak[1] += 64;
    block(c, tweak, msg, pos);
    tweak[2] = 0x30 << 24;
  }
  tweak[1] += len; tweak[2] |= 0x80 << 24;
  block(c, tweak, msg, pos);
  tweak[1] = 8; tweak[2] = (0x80 + 0x40 + 0x3f) << 24;
  block(c, tweak, [], 0);

  let hash = [];
  for (let i = 0; i < 64; i++) {
    ldb(c, i >> 3);
    shr((i & 7) * 8);
    hash.push(peekl() & 255);
    pop();
  }
  return hash;
}

export function hashString(str) {
  return hashBytes(new TextEncoder().encode(str));
}
