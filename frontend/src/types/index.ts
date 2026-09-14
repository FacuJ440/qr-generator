export type QrType = 'static' | 'dynamic';
export type QrCategory = 'url' | 'text' | 'wifi' | 'vcard' | 'email' | 'phone' | 'sms';
export type QrStatus = 'active' | 'paused' | 'expired' | 'archived';
export type QrEyeShape = 'square' | 'rounded' | 'circle';
export type QrErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrStyleConfig {
  foregroundColor: string;
  backgroundColor: string;
  logoUrl?: string;
  eyeShape: QrEyeShape;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  margin: number;
  width: number;
}

export interface QrStaticContent {
  content: Record<string, unknown>;
}

export interface QrDynamicContent {
  shortCode: string;
  targetUrl: string;
  expiresAt: string | null;
  scanCount: number;
}

export interface QrCode {
  id: string;
  userId: string;
  type: QrType;
  category: QrCategory;
  title: string;
  styleConfig: QrStyleConfig;
  status: QrStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  staticContent: QrStaticContent | null;
  dynamicContent: QrDynamicContent | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; plan: string };
}

export interface AnalyticsSummary {
  totalScans: number;
  scansByDate: { date: string; count: number }[];
  scansByDevice: { key: string; count: number }[];
  scansByBrowser: { key: string; count: number }[];
  scansByCountry: { key: string; count: number }[];
  scansByOs: { key: string; count: number }[];
}

export interface CreateQrCodeDto {
  type: QrType;
  category: QrCategory;
  title: string;
  styleConfig?: Partial<QrStyleConfig>;
  content?: Record<string, unknown>;
  targetUrl?: string;
  expiresAt?: string;
}

export interface UpdateQrCodeDto {
  title?: string;
  styleConfig?: Partial<QrStyleConfig>;
  status?: QrStatus;
  targetUrl?: string;
  expiresAt?: string;
}

export interface QrCodeFilters {
  type?: QrType;
  status?: QrStatus;
  category?: QrCategory;
  search?: string;
  sortByScans?: boolean;
  page?: number;
  limit?: number;
}
