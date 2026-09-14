import { useState, useEffect, useMemo, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { qrApi } from '../lib/api-services';
import { Input, Select, TextArea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { QrType, QrCategory, QrEyeShape, CreateQrCodeDto } from '../types';

// Map our eye shapes to qr4code=code-styling dot/eye styles
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

export default function CreateQrPage(): JSX.Element {
  const navigate = useNavigate();
  const [type, setType] = useState<QrType>('static');
  const [category, setCategory] = useState<QrCategory>('url');
  const [title, setTitle] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [eyeShape, setEyeShape] = useState<QrEyeShape>('square');
  const [logoUrl, setLogoUrl] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  // Content fields
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState('WPA');
  const [vcardName, setVcardName] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateQrCodeDto) => qrApi.create(data),
    onSuccess: (qr) => navigate(`/qr/${qr.id}`),
  });

  // Build encoded content for preview
  const encodedContent = useMemo((): string => {
    if (type === 'dynamic') return targetUrl || 'https://example.com';

    switch (category) {
      case 'url': return url || 'https://example.com';
      case 'text': return text || 'Sample text';
      case 'email': return `mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'phone': return `tel:${phone}`;
      case 'sms': return `sms:${phone}?body=${encodeURIComponent(smsBody)}`;
      case 'wifi': return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};H:false;;`;
      case 'vcard': return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nORG:${vcardOrg}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      default: return '';
    }
  }, [type, category, targetUrl, url, text, email, emailSubject, emailBody, phone, smsBody, wifiSsid, wifiPassword, wifiEncryption, vcardName, vcardOrg, vcardPhone, vcardEmail]);

  // Generate preview with qr-code-styling (supports logo + dot/@/types/eye shapes)
  useEffect(() => {
    if (!previewRef.current) return;

    const dotStyle = dotStyleMap[eyeShape] ?? 'square';
    const eyeStyle = eyeStyleMap[eyeShape] ?? 'square';

    // Dynamic import to avoid SSR issues
    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      const qr = new QRCodeStyling({
        width: 250,
        height: 250,
        type: 'svg',
        data: encodedContent || 'https://example.com',
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

      qr.append(previewRef.current!);
    });

    // Cleanup previous preview
    return () => {
      if (previewRef.current) {
        previewRef.current.innerHTML = '';
      }
    };
  }, [encodedContent, fgColor, bgColor, errorLevel, eyeShape, logoUrl]);

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();

    const dto: CreateQrCodeDto = {
      type,
      category,
      title,
      styleConfig: {
        foregroundColor: fgColor,
        backgroundColor: bgColor,
        errorCorrectionLevel: errorLevel,
        eyeShape,
        logoUrl: logoUrl || undefined,
        margin: 2,
        width: 300,
      },
    };

    if (type === 'dynamic') {
      dto.targetUrl = targetUrl;
    } else {
      switch (category) {
        case 'url': dto.content = { url }; break;
        case 'text': dto.content = { text }; break;
        case 'email': dto.content = { email, subject: emailSubject, body: emailBody }; break;
        case 'phone': dto.content = { phone }; break;
        case 'sms': dto.content = { phone, body: smsBody }; break;
        case 'wifi': dto.content = { ssid: wifiSsid, password: wifiPassword, encryption: wifiEncryption }; break;
        case 'vcard': dto.content = { name: vcardName, org: vcardOrg, phone: vcardPhone, email: vcardEmail }; break;
      }
    }

    createMutation.mutate(dto);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Crear Código QR</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={type} onChange={(e) => setType(e.target.value as QrType)}>
              <option value="static">Estático</option>
              <option value="dynamic">Dinámico</option>
            </Select>
            <Select label="Categoría" value={category} onChange={(e) => setCategory(e.target.value as QrCategory)} disabled={type === 'dynamic'}>
              <option value="url">URL</option>
              <option value="text">Texto</option>
              <option value="wifi">WiFi</option>
              <option value="vcard">vCard</option>
              <option value="email">Email</option>
              <option value="phone">Teléfono</option>
              <option value="sms">SMS</option>
            </Select>
          </div>

          <Input label="Título" value={title} onChange={(e) => setTitle(e.target.value)} required />

          {/* Dynamic: target URL */}
          {type === 'dynamic' && (
            <Input label="URL Destino" type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://example.com" required />
          )}

          {/* Static: category-specific fields */}
          {type === 'static' && category === 'url' && (
            <Input label="URL" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />
          )}
          {type === 'static' && category === 'text' && (
            <TextArea label="Texto" value={text} onChange={(e) => setText(e.target.value)} rows={4} required />
          )}
          {type === 'static' && category === 'email' && (
            <>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Asunto" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              <TextArea label="Cuerpo" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={3} />
            </>
          )}
          {type === 'static' && category === 'phone' && (
            <Input label="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          )}
          {type === 'static' && category === 'sms' && (
            <>
              <Input label="Teléfono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <TextArea label="Mensaje" value={smsBody} onChange={(e) => setSmsBody(e.target.value)} rows={3} />
            </>
          )}
          {type === 'static' && category === 'wifi' && (
            <>
              <Input label="SSID" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} required />
              <Input label="Contraseña" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)} required />
              <Select label="Cifrado" value={wifiEncryption} onChange={(e) => setWifiEncryption(e.target.value)}>
                <option value="WPA">WPA/WPA2</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Sin Contraseña</option>
              </Select>
            </>
          )}
          {type === 'static' && category === 'vcard' && (
            <>
              <Input label="Nombre" value={vcardName} onChange={(e) => setVcardName(e.target.value)} required />
              <Input label="Organización" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} />
              <Input label="Teléfono" type="tel" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} />
              <Input label="Email" type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} />
            </>
          )}

          {/* Style */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Estilo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400">Color frontal</label>
                <input type="color" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="h-10 w-full rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400">Color de fondo</label>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-full rounded" />
              </div>
            </div>
            <div className="mt-4">
              <Select label="Forma de los módulos" value={eyeShape} onChange={(e) => setEyeShape(e.target.value as QrEyeShape)}>
                <option value="square">Cuadrado</option>
                <option value="rounded">Redondeado</option>
                <option value="circle">Círculo</option>
              </Select>
            </div>
            <div className="mt-4">
              <Select label="Corrección de errores" value={errorLevel} onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}>
                <option value="L">Baja (7%)</option>
                <option value="M">Media (15%)</option>
                <option value="Q">Cuartil (25%)</option>
                <option value="H">Alta (30%)</option>
              </Select>
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo (opcional)</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setLogoUrl(reader.result as string);
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-white hover:file:bg-brand-700"
              />
              {logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded border border-gray-200 object-contain" />
                  <button type="button" onClick={() => setLogoUrl('')} className="text-sm text-red-500 hover:underline">Quitar logo</button>
                </div>
              )}
            </div>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-red-500">Error al crear el código QR</p>
          )}
          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Código QR'}
          </Button>
        </form>

        {/* Preview */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Vista previa</h3>
          <div className="flex flex-col items-center gap-4">
            <div ref={previewRef} className="flex items-center justify-center" />
            {encodedContent && <p className="text-sm text-gray-500 break-all max-w-xs">{encodedContent}</p>}
            {!encodedContent && <p className="text-gray-400">La vista previa aparecerá aquí</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
