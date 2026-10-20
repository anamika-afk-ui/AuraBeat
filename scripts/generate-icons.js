import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(size, isMaskable = false) {
  const width = size;
  const height = size;

  // CRC Table
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw Image Data (height rows, each row starts with filter byte 0)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark background (#080c16)
      let r = 8;
      let g = 12;
      let b = 22;
      let a = 255;

      if (dist <= radius) {
        // Vinyl body: dark slate (#0f172a)
        r = 15;
        g = 23;
        b = 42;

        // Vinyl Grooves
        const groove1 = Math.abs(dist - radius * 0.8);
        const groove2 = Math.abs(dist - radius * 0.6);
        if (groove1 < 1.5 || groove2 < 1.5) {
          r = 40;
          g = 55;
          b = 80;
        }

        // Outer Neon Ring (Cyan/Pink gradient)
        if (dist > radius - 6) {
          const t = (x / width);
          r = Math.floor(6 + t * 230);
          g = Math.floor(182 - t * 110);
          b = Math.floor(212 - t * 60);
        }

        // Center Disc Label
        if (dist <= radius * 0.42) {
          // Cyan to Indigo gradient
          const t = y / height;
          r = Math.floor(6 + t * 90);
          g = Math.floor(182 - t * 80);
          b = Math.floor(212 + t * 30);
        }

        // Center Spindle Hole
        if (dist <= radius * 0.12) {
          r = 8;
          g = 12;
          b = 22;
        }

        // Center Audio Bars
        const barDistY = Math.abs(dy);
        const barDistX = Math.abs(dx);
        if (barDistX < radius * 0.25 && barDistY < radius * 0.28) {
          if ((Math.abs(dx) < 3 && barDistY < radius * 0.28) ||
              (Math.abs(dx - 12) < 3 && barDistY < radius * 0.18) ||
              (Math.abs(dx + 12) < 3 && barDistY < radius * 0.18)) {
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180));

console.log('PNG Icons successfully generated in /public!');
