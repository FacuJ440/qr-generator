import apiClient from './api';
import type {
  QrCode,
  CreateQrCodeDto,
  UpdateQrCodeDto,
  QrCodeFilters,
  AnalyticsSummary,
} from '../types';

// ---------- QR Codes ----------
export const qrApi = {
  list: (filters: QrCodeFilters = {}) =>
    apiClient.get<{ items: QrCode[]; total: number }>('/qr-codes', { params: filters }).then((r) => r.data),
  get: (id: string) => apiClient.get<QrCode>(`/qr-codes/${id}`).then((r) => r.data),
  create: (data: CreateQrCodeDto) => apiClient.post<QrCode>('/qr-codes', data).then((r) => r.data),
  update: (id: string, data: UpdateQrCodeDto) =>
    apiClient.put<QrCode>(`/qr-codes/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/qr-codes/${id}`),
  archive: (id: string) => apiClient.patch<QrCode>(`/qr-codes/${id}/archive`).then((r) => r.data),
  imageUrl: (id: string, format: 'png' | 'svg' = 'png') =>
    `${apiClient.defaults.baseURL}/qr-codes/${id}/image?format=${format}`,
};

// ---------- Analytics ----------
export const analyticsApi = {
  summary: (qrCodeId: string, range?: { startDate?: string; endDate?: string }) =>
    apiClient
      .get<AnalyticsSummary>(`/analytics/${qrCodeId}`, { params: range })
      .then((r) => r.data),
  exportCsv: (qrCodeId: string) =>
    `${apiClient.defaults.baseURL}/analytics/${qrCodeId}/export`,
};
