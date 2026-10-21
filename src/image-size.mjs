// Reads the pixel size of a PNG, JPEG, WebP, GIF or SVG from its bytes, so
// note images can get width and height attributes without a dependency.
// Returns { width, height }, or null when the format isn't recognised.

export function imageSize(buf) {
  if (buf.length < 12) return null;
  const ascii = (start, end) => buf.toString('latin1', start, end);

  // PNG: the IHDR chunk always comes first.
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.length >= 24) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF: logical screen size right after the signature.
  if (ascii(0, 4) === 'GIF8') {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP: lossy (VP8), lossless (VP8L) or extended (VP8X) first chunk.
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' && buf.length >= 30) {
    const chunk = ascii(12, 16);
    if (chunk === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8X') return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 };
    return null;
  }

  // JPEG: walk the marker segments until a start-of-frame (SOF0-SOF15, except
  // DHT, JPG and DAC, which share the range).
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 4 <= buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      // Fill bytes, and markers with no length (TEM, RSTn, SOI, EOI).
      if (marker === 0xff) { i++; continue; }
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        if (i + 9 > buf.length) return null;
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
    return null;
  }

  // SVG: width/height attributes in px (or unitless), else the viewBox.
  const text = buf.toString('utf8', 0, Math.min(buf.length, 4096));
  const tag = text.match(/<svg\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const attr = (name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
  const px = (v) => (v && /^\s*[\d.]+\s*(px)?\s*$/.test(v) ? parseFloat(v) : null);
  let width = px(attr('width'));
  let height = px(attr('height'));
  const box = attr('viewBox')?.trim().split(/[\s,]+/).map(Number);
  if (box?.length === 4 && box[2] > 0 && box[3] > 0) {
    // Fill a missing side from the viewBox's aspect ratio.
    if (width && !height) height = (width * box[3]) / box[2];
    else if (height && !width) width = (height * box[2]) / box[3];
    else if (!width && !height) [width, height] = [box[2], box[3]];
  }
  return width && height ? { width: Math.round(width), height: Math.round(height) } : null;
}
