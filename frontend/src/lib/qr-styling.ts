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
