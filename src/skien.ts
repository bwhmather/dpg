// Implementation originally created by Thomas Mueller
// [www.h2database.com/skein/];
// Modified by John Plevyak [jplevyak at acm.org] for use in his password
// generator
// Slightly reformatted again for my original generator and then modernized
// for this version.

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

function shiftLeft(x, n) {
  if (x == null) {
    return [0, 0];
  }
  if (n > 32) {
    return [x[1] << (n-32), 0];
  }
  if (n == 32) {
    return [x[1], 0];
  }
  if (n == 0) {
    return x;
  }
  return [(x[0] << n) | (x[1] >>> (32 - n)), x[1] << n];
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

function add(x, y) {
  if (y == null) {
    return x;
  }
  let lsw = (x[1] & 0xffff) + (y[1] & 0xffff);
  let msw = (x[1] >>> 16) + (y[1] >>> 16) + (lsw >>> 16);
  let lowOrder = ((msw & 0xffff) << 16) | (lsw & 0xffff);

  lsw = (x[0] & 0xffff) + (y[0] & 0xffff) + (msw >>>16);
  msw = (x[0] >>> 16)+(y[0] >>> 16) + (lsw >>> 16);
  let highOrder = ((msw & 0xffff) << 16) | (lsw & 0xffff);
  return [highOrder,lowOrder];
}

function xor(a, b) {
  if (b == null) {
    return a;
  }
  return [a[0] ^ b[0], a[1] ^ b[1]];
}

function load(b, i) {
  return [b[2 * i], b[(2 * i) + 1]]
}

function store(b, i, v) {
  b[2 * i] = v[0]
  b[(2 * i) + 1] = v[1]
}

function block(c, tweak, b, off) {
  let R = [
    38, 30, 50, 53, 48, 31, 43, 20, 34, 14, 15, 27, 26, 7, 58, 12,
    33, 49, 8, 42, 39, 14, 41, 27, 29, 26, 11, 9, 33, 35, 39, 51
  ];
  let x = new Uint32Array(16);
  let t = new Uint32Array(16);
  store(c, 8, [0x55555555, 0x55555555]);
  for (let i = 0; i < 8; i++) {
    for (let j = 7, k = off + i * 8 + 7; j >= 0; j--, k--) {
      store(t, i, shiftLeft(load(t, i), 8));
      t[2 * i + 1] |= b[k] & 255;
    }
    store(x, i, add(load(t, i), load(c, i)));
    store(c, 8, xor(load(c, 8), load(c, i)));
  }
  store(x, 5, add(load(x, 5), load(tweak, 0)));
  store(x, 6, add(load(x, 6), load(tweak, 1)));
  store(tweak, 2, xor(load(tweak, 0), load(tweak, 1)));
  for (let round = 1; round <= 18; round++) {
    let p = 16 - ((round & 1) << 4);
    for (let i = 0; i < 16; i++) {
      // m: 0, 2, 4, 6, 2, 0, 6, 4, 4, 6, 0, 2, 6, 4, 2, 0
      let m = 2 * ((i + (1 + i + i) * (i >> 2)) & 3);
      let n = (1 + i + i) & 7;
      let r = R[p + i];
      store(x, m, add(load(x, m), load(x, n)));
      store(x, n, xor(
        shiftLeft(load(x, n), r),
        shiftRight(load(x, n), 64 - r)
      ));
      store(x, n, xor(load(x, n), load(x, m)));
    }
    for (var i = 0; i < 8; i++)  {
      store(x, i, add(load(x, i), load(c, (round + i) % 9)));
    }
    store(x, 5, add(load(x, 5), load(tweak, round % 3)));
    store(x, 6, add(load(x, 6), load(tweak, (round + 1) % 3)));
    store(x, 7, add(load(x, 7), [0, round]));
  }
  for (let i = 0; i < 8; i++) {
    store(c, i, xor(load(t, i), load(x, i)));
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
    var b = shiftRight(load(c, i >> 3), (i & 7) * 8)[1] & 255;
    hash.push(b);
  }
  return hash;
}

export function hashString(string) {
  return hashBytes(string2bytes(string));
}
