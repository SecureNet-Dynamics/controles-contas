// Gera os ícones do app (favicon + PWA) em PNG puro, sem dependências externas.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// ── CRC32 ────────────────────────────────────────────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG writer (RGBA 8-bit, no interlace) ───────────────────────────────
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // raw scanlines with filter byte 0 (none)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Shape helpers ────────────────────────────────────────────────────────
function inRoundedRect(x, y, cx, cy, w, h, r) {
  const px = Math.abs(x - cx);
  const py = Math.abs(y - cy);
  const hw = w / 2, hh = h / 2;
  if (px > hw || py > hh) return false;
  const qx = px - (hw - r);
  const qy = py - (hh - r);
  if (qx <= 0 || qy <= 0) return true; // inside the plus-shaped cross region
  return qx * qx + qy * qy <= r * r;
}

function inCircle(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function mix(colA, colB, t) {
  return [lerp(colA[0], colB[0], t), lerp(colA[1], colB[1], t), lerp(colA[2], colB[2], t)];
}

// ── Icon renderer (supersampled for smooth edges) ───────────────────────
function renderIcon(size, { padded = false } = {}) {
  const SS = 4; // supersample factor
  const S = size * SS;
  const buf = new Float32Array(S * S * 3);
  const alpha = new Float32Array(S * S);

  const bgA = [110, 178, 227];  // #6EB2E3
  const bgB = [53, 121, 184];   // #3579B8
  const white = [255, 255, 255];
  const gold = [245, 166, 35];  // #F5A623
  const goldDark = [204, 122, 0];

  const scale = padded ? 0.72 : 1; // maskable icons need safe-area padding
  const offset = (S - S * scale) / 2;

  const cornerR = S * 0.22 * scale;
  const iconCenterX = S / 2;
  const iconCenterY = S / 2;
  const bgW = S * scale;
  const bgH = S * scale;

  const cardW = bgW * 0.62;
  const cardH = bgH * 0.40;
  const cardCx = iconCenterX;
  const cardCy = iconCenterY + bgH * 0.02;
  const cardR = bgW * 0.07;

  const stripeH = bgH * 0.09;
  const stripeY = cardCy - cardH / 2 + stripeH * 1.3;

  const coinR = bgW * 0.115;
  const coinCx = cardCx + cardW / 2 - coinR * 0.7;
  const coinCy = cardCy + cardH / 2 - coinR * 0.5;

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = y * S + x;
      const inBg = inRoundedRect(x, y, iconCenterX, iconCenterY, bgW, bgH, cornerR);
      if (!inBg) continue;
      alpha[idx] = 1;
      const t = (y - offset) / (S * scale);
      let col = mix(bgA, bgB, Math.min(1, Math.max(0, t)));

      if (inRoundedRect(x, y, cardCx, cardCy, cardW, cardH, cardR)) {
        col = white;
        if (y >= stripeY - stripeH / 2 && y <= stripeY + stripeH / 2) {
          col = mix(bgA, bgB, 0.5);
        }
        if (inCircle(x, y, coinCx, coinCy, coinR)) {
          col = gold;
          if (inCircle(x, y, coinCx, coinCy, coinR * 0.55)) col = goldDark;
        }
      }

      buf[idx * 3] = col[0];
      buf[idx * 3 + 1] = col[1];
      buf[idx * 3 + 2] = col[2];
    }
  }

  // Downsample S x S -> size x size (box filter) with alpha
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const sX = x * SS + sx, sY = y * SS + sy;
          const idx = sY * S + sX;
          const al = alpha[idx];
          r += buf[idx * 3] * al;
          g += buf[idx * 3 + 1] * al;
          b += buf[idx * 3 + 2] * al;
          a += al;
        }
      }
      const n = SS * SS;
      const outIdx = (y * size + x) * 4;
      if (a > 0) {
        rgba[outIdx] = Math.round(r / a);
        rgba[outIdx + 1] = Math.round(g / a);
        rgba[outIdx + 2] = Math.round(b / a);
        rgba[outIdx + 3] = Math.round((a / n) * 255);
      } else {
        rgba[outIdx] = 0; rgba[outIdx + 1] = 0; rgba[outIdx + 2] = 0; rgba[outIdx + 3] = 0;
      }
    }
  }
  return rgba;
}

function writeIcon(size, name, opts) {
  const rgba = renderIcon(size, opts);
  const png = encodePNG(size, size, rgba);
  writeFileSync(join(outDir, name), png);
  console.log(`✓ ${name} (${size}x${size})`);
}

writeIcon(16, 'favicon-16.png');
writeIcon(32, 'favicon-32.png');
writeIcon(180, 'apple-touch-icon.png');
writeIcon(192, 'icon-192.png');
writeIcon(512, 'icon-512.png');
writeIcon(512, 'icon-512-maskable.png', { padded: true });

console.log('Ícones gerados em public/icons/');
