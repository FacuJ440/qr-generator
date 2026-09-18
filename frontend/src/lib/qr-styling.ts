import type { QrCode, QrEyeShape, QrStyleConfig } from '../types';

// Map our eye shapes to qr-code-styling dot/eye styles
const dotStyleMap: Record<string, 'square' | 'dots' | 'rounded'> = {
  square: 'square',
  rounded: 'rounded',
  circle: 'dots',
};
const eyeStyleMap: Record<string, 'square' | 'dot' | 'extra-rounded'> = {
  square: 'square',
  rounded: 'extra-rounded',
  circle: 'dot',
};

/**
 * Build the encoded content string from a QrCode entity.
 * Mirrors the backend `getEncodedContent` logic.
 */
export function getEncodedContent(qr: QrCode): string {
  if (qr.type === 'dynamic' && qr.dynamicContent) {
    const base = window.location.origin;
    return `${base}/r/${qr.dynamicContent.shortCode}`;
  }

  if (!qr.staticContent) return '';
  const c = qr.staticContent.content as Record<string, unknown>;

  switch (qr.category) {
    case 'url':
      return String(c['url'] ?? '');
    case 'text':
      return String(c['text'] ?? '');
    case 'email':
      return `mailto:${c['email'] ?? ''}?subject=${encodeURIComponent(String(c['subject'] ?? ''))}&body=${encodeURIComponent(String(c['body'] ?? ''))}`;
    case 'phone':
      return `tel:${c['phone'] ?? ''}`;
    case 'sms':
      return `sms:${c['phone'] ?? ''}?body=${encodeURIComponent(String(c['body'] ?? ''))}`;
    case 'wifi':
      return `WIFI:T:${c['encryption'] ?? 'WPA'};S:${c['ssid'] ?? ''};P:${c['password'] ?? ''};H:${c['hidden'] ? 'true' : 'false'};;`;
    case 'vcard':
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${c['name'] ?? ''}\nORG:${c['org'] ?? ''}\nTEL:${c['phone'] ?? ''}\nEMAIL:${c['email'] ?? ''}\nURL:${c['url'] ?? ''}\nEND:VCARD`;
    default:
      return '';
  }
}

/**
 * Create a QRCodeStyling instance from a QrCode entity with full style support.
 */
export async function createQrStylingInstance(qr: QrCode, size: number = 300) {
  const { default: QRCodeStyling } = await import('qr-code-styling');

  const style: QrStyleConfig = qr.styleConfig ?? ({} as QrStyleConfig);
  const fgColor = style.foregroundColor ?? '#000000';
  const bgColor = style.backgroundColor ?? '#FFFFFF';
  const errorLevel = style.errorCorrectionLevel ?? 'M';
  const eyeShape: QrEyeShape = style.eyeShape ?? 'square';
  const logoUrl = style.logoUrl;

  const dotStyle = dotStyleMap[eyeShape] ?? 'square';
  const eyeStyle = eyeStyleMap[eyeShape] ?? 'square';

  const data = getEncodedContent(qr) || 'https://example.com';

  return new QRCodeStyling({
    width: size,
    height: size,
    type: 'svg',
    data,
    dotsOptions: {
      color: fgColor,
      type: dotStyle,
    },
    backgroundOptions: {
      color: bgColor,
    },
    cornersSquareOptions: {
      type: eyeStyle,
    },
    cornersDotOptions: {
      type: eyeStyle,
    },
    qrOptions: {
      errorCorrectionLevel: errorLevel,
    },
    image: logoUrl || undefined,
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 4,
      hideBackgroundDots: true,
      imageSize: 0.4,
    },
  });
}

/**
 * Download a QR code as PNG (with full styling) — generated client-side.
 */
export async function downloadQrPng(qr: QrCode, filename: string): Promise<void> {
  const size = qr.styleConfig?.width ?? 300;
  const instance = await createQrStylingInstance(qr, size);

  // qr-code-styling getRawData('png') returns a Blob in the browser
  const blob = await instance.getRawData('png');
  if (!blob) return;

  const url = URL.createObjectURL(blob as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a QR code as SVG (with full styling) — generated client-side.
 */
export async function downloadQrSvg(qr: QrCode, filename: string): Promise<void> {
  const size = qr.styleConfig?.width ?? 300;
  const instance = await createQrStylingInstance(qr, size);

  const rawData = await instance.getRawData('svg');
  if (!rawData) return;

  // getRawData returns a Blob in the browser
  const blob = rawData instanceof Blob
    ? rawData
    : new Blob([rawData as BlobPart], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ---------- Tarjeta / Card JPG ----------

/** Subtitle suggestions per category */
const categorySubtitles: Record<string, string> = {
  url: 'Enlace directo',
  text: 'Información de texto',
  wifi: 'Conexión WiFi',
  vcard: 'Tarjeta de contacto',
  email: 'Contacto por email',
  phone: 'Teléfono',
  sms: 'Mensaje de texto',
};

/** Tint a hex color by mixing it with white (amount 0..1, 0=white, 1=original) */
function tintColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  return `#${mix(r).toString(16).padStart(2, '0')}${mix(g).toString(16).padStart(2, '0')}${mix(b).toString(16).padStart(2, '0')}`;
}

/** Draw a simple category icon (location pin) inside a white circle */
function drawCategoryIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  // White circle background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Location pin icon (simplified) in the category color
  const pinScale = radius * 0.9;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pinScale / 10, pinScale / 10);

  // Pin body (teardrop)
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(-5, -8, -5, -2, 0, 6);
  ctx.bezierCurveTo(5, -2, 5, -8, 0, -8);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Inner circle (cutout effect — draw in white to match circle bg)
  ctx.beginPath();
  ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.restore();
}

/**
 * Download a QR code as a JPG card/poster with a colored frame based on the tag.
 * Generates everything client-side using Canvas.
 */
export async function downloadQrCard(qr: QrCode, filename: string): Promise<void> {
  const qrSize = 380;
  const instance = await createQrStylingInstance(qr, qrSize);

  const qrBlob = await instance.getRawData('png');
  if (!qrBlob) return;
  const qrImg = await blobToImage(qrBlob as Blob);

  // Card dimensions
  const cardWidth = 520;
  const topBarHeight = 56;
  const bottomBarHeight = 10;
  const qrPadding = 36;
  const qrBoxSize = qrSize + qrPadding * 2;
  const subtitleAreaHeight = 60;
  const gapAboveBox = 24;
  const cardHeight =
    topBarHeight + gapAboveBox + qrBoxSize + subtitleAreaHeight + bottomBarHeight;

  const tagColor = qr.tag?.color ?? '#6b7280';
  const tagName = (qr.tag?.text ?? 'General').toUpperCase();
  const subtitle = qr.title;
  const lightTint = tintColor(tagColor, 0.08);

  // Retina-ish rendering for crisper JPG
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = cardWidth * scale;
  canvas.height = cardHeight * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // --- Card background (white, rounded, soft shadow) ---
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 0, 0, cardWidth, cardHeight, 20);
  ctx.fill();
  ctx.restore();

  // --- Top color bar ---
  ctx.save();
  roundRect(ctx, 0, 0, cardWidth, cardHeight, 20); // clip to card's rounded shape
  ctx.clip();
  ctx.fillStyle = tagColor;
  ctx.fillRect(0, 0, cardWidth, topBarHeight);
  ctx.restore();

  // --- Icon + tag name, centered as a group vertically in the bar ---
  const iconRadius = 15;
  const iconCenterX = 30;
  const iconCenterY = topBarHeight / 2;
  drawTagIcon(ctx, iconCenterX, iconCenterY, iconRadius, tagColor);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 17px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(tagName, iconCenterX + iconRadius + 12, iconCenterY + 1);

  // --- QR box (light tint background + subtle border) ---
  const qrBoxX = (cardWidth - qrBoxSize) / 2;
  const qrBoxY = topBarHeight + gapAboveBox;
  ctx.fillStyle = lightTint;
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
  ctx.fill();
  ctx.strokeStyle = tintColor(tagColor, 0.25);
  ctx.lineWidth = 1;
  roundRect(ctx, qrBoxX + 0.5, qrBoxY + 0.5, qrBoxSize - 1, qrBoxSize - 1, 16);
  ctx.stroke();

  // Draw QR centered inside the box
  ctx.drawImage(qrImg, qrBoxX + qrPadding, qrBoxY + qrPadding, qrSize, qrSize);

  // --- Subtitle ---
  ctx.fillStyle = '#6b7280';
  ctx.font = '400 15px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(subtitle, cardWidth / 2, qrBoxY + qrBoxSize + subtitleAreaHeight / 2);

  // --- Bottom color bar ---
  ctx.save();
  roundRect(ctx, 0, 0, cardWidth, cardHeight, 20);
  ctx.clip();
  ctx.fillStyle = tagColor;
  ctx.fillRect(0, cardHeight - bottomBarHeight, cardWidth, bottomBarHeight);
  ctx.restore();

  // Export as JPG
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Draws the white circular badge with a small target/pin glyph inside,
 * matching the reference design's icon style.
 */
function drawTagIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
): void {
  // White circle background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  // Inner colored ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.22;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Crosshair ticks (top/bottom/left/right)
  const tickLen = radius * 0.35;
  const tickStart = radius * 0.85;
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 0.18;
  ctx.lineCap = 'round';
  [0, 90, 180, 270].forEach((deg) => {
    const rad = (deg * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * tickStart;
    const y1 = cy + Math.sin(rad) * tickStart;
    const x2 = cx + Math.cos(rad) * (tickStart - tickLen);
    const y2 = cy + Math.sin(rad) * (tickStart - tickLen);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

/** Helper: convert a Blob to an HTMLImageElement */
function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Draw a rounded rectangle.
 * corners: [topLeft, topRight, bottomRight, bottomLeft] — true = rounded
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  corners: boolean[] = [true, true, true, true],
): void {
  const tl = corners[0] ? r : 0;
  const tr = corners[1] ? r : 0;
  const br = corners[2] ? r : 0;
  const bl = corners[3] ? r : 0;

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  if (tl) ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}
