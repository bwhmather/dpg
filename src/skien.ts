function string2bytes(s) {
  let b=[]
  for (let i=0; i < s.length; i++) {
    b.push(s.charCodeAt(i));
  }
  return new Uint8Array(b);
}

function bytes2string(b) {
  let str = "";
  for(let i = 0; i < b.length; i++) {
    str += String.fromCharCode(b[i]);
  }
  return str;
}

let stack = new Uint32Array(16);
let stackPointer = stack.length;


function loadi(h, l) {
  stackPointer -= 2;
  stack[stackPointer] = h;
  stack[stackPointer + 1] = l;
}

function peekh() {
  return stack[stackPointer];
}

function peekl() {
  return stack[stackPointer + 1];
}

function pop() {
  stackPointer += 2;
}

function load(b, i) {
  loadi(b[2 * i], b[(2 * i) + 1]);
}

function store(b, i) {
  let h = peekh(), l = peekl(); pop();
  b[2 * i] = h
  b[(2 * i) + 1] = l
}

function shl(n) {
  let h = peekh(), l = peekl(); pop();

  if (n > 32) loadi(l << (n-32), 0)
  else if (n == 32) loadi(l, 0)
  else if (n == 0) loadi(h, l)
  else loadi((h << n) | (l >>> (32 - n)), l << n);
}

function shr(n) {
  let h = peekh(), l = peekl(); pop();

  if (n > 32) loadi(0, h >>> (n - 32))
  else if (n == 32) loadi(0, h);
  else if (n == 0) loadi(h, l);
  else loadi(h >>> n, (h << (32 - n)) | (l >>> n));
}

function add() {
  let ah = peekh(), al = peekl(); pop();
  let bh = peekh(), bl = peekl(); pop();

  let lsw = (al & 0xffff) + (bl & 0xffff);
  let msw = (al >>> 16) + (bl >>> 16) + (lsw >>> 16);
  let l = ((msw & 0xffff) << 16) | (lsw & 0xffff);

  lsw = (ah & 0xffff) + (bh & 0xffff) + (msw >>> 16);
  msw = (ah >>> 16) + (bh >>> 16) + (lsw >>> 16);
  let h = ((msw & 0xffff) << 16) | (lsw & 0xffff);

  loadi(h, l);
}

function xor() {
  let ah = peekh(), al = peekl(); pop();
  let bh = peekh(), bl = peekl(); pop();

  loadi(ah ^ bh, al ^ bl);
}

function shiftRight(x, n) {
  if (x == null) {
    return [0, 0];
  }

  if (n > 32) {
    return [0, x[0] >>> (n-32)];
  }
  if (n == 32) {
    return [0, x[0]];
  }
  if (n == 0) {
    return x;
  }
  return [x[0] >>> n, (x[0] << (32 - n)) | (x[1] >>> n)];
}


function block(c, tweak, b, off) {
  let R = [
    38, 30, 50, 53, 48, 31, 43, 20, 34, 14, 15, 27, 26, 7, 58, 12,
    33, 49, 8, 42, 39, 14, 41, 27, 29, 26, 11, 9, 33, 35, 39, 51
  ];
  let x = new Uint32Array(16);
  let t = new Uint32Array(16);
  loadi(0x55555555, 0x55555555); store(c, 8);
  for (let i = 0; i < 8; i++) {
    for (let j = 7, k = off + i * 8 + 7; j >= 0; j--, k--) {
      load(t, i); shl(8); store(t, i);
      t[2 * i + 1] |= b[k] & 255;  // TODO
    }
    load(t, i); load(c, i); add(); store(x, i);
    load(c, 8), load(c, i); xor(); store(c, 8);
  }

  load(x, 5); load(tweak, 0); add(); store(x, 5);
  load(x, 6); load(tweak, 1); add(); store(x, 6);
  load(tweak, 0); load(tweak, 1); xor(); store(tweak, 2)

  for (let round = 1; round <= 18; round++) {
    let p = 16 - ((round & 1) << 4);
    for (let i = 0; i < 16; i++) {
      // m: 0, 2, 4, 6, 2, 0, 6, 4, 4, 6, 0, 2, 6, 4, 2, 0
      let m = 2 * ((i + (1 + i + i) * (i >> 2)) & 3);
      let n = (1 + i + i) & 7;
      let r = R[p + i];

      load(x, m); load(x, n); add(); store(x, m);

      load(x, n); shl(r);
      load(x, n); shr(64 - r);
      xor(); store(x, n);

      load(x, n); load(x, m); xor(); store(x, n);
    }
    for (var i = 0; i < 8; i++)  {
      load(x, i); load(c, (round + i) % 9); add(); store(x, i);
    }

    load(x, 5); load(tweak, round % 3); add(); store(x, 5);
    load(x, 6); load(tweak, (round + 1) % 3); add(); store(x, 6);
    load(x, 7); loadi(0, round); add(); store(x, 7);
  }
  for (let i = 0; i < 8; i++) {
    load(t, i); load(x, i); xor(); store(c, i);
  }
}

export function hashBytes(msg) {
  let tweak = new Uint32Array(
    [0, 32, (0x80 + 0x40 + 0x4) << 24, 0, 0, 0]
  );
  let c = new Uint32Array(18);
  let buff = string2bytes("SHA3\x01\x00\x00\x00\x00\x02");
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
    load(c, i >> 3);
    let h = peekh(), l = peekl(); pop();
    var b = shiftRight([h, l], (i & 7) * 8)[1] & 255;
    hash.push(b);
  }
  return hash;
}

export function hashString(string) {
  return hashBytes(string2bytes(string));
}
