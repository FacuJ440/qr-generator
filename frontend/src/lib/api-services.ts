import apiClient from './api';
import type {
  QrCode,
  CreateQrCodeDto,
  UpdateQrCodeDto,
  QrCodeFilters,
  AnalyticsSummary,
  Tag,
  AuthResponse,
  AdminUser,
  WebtreePage,
  CreateWebtreePageDto,
  UpdateWebtreePageDto,
} from '../types';

// ---------- Auth ----------
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
};

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

// ---------- Tags ----------
export const tagApi = {
  list: () => apiClient.get<Tag[]>('/tags').then((r) => r.data),
  create: (data: { text: string; color: string }) => apiClient.post<Tag>('/tags', data).then((r) => r.data),
  update: (id: string, data: { text?: string; color?: string }) =>
    apiClient.put<Tag>(`/tags/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/tags/${id}`),
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

// ---------- Admin ----------
export const adminApi = {
  listUsers: () => apiClient.get<AdminUser[]>('/admin/users').then((r) => r.data),
  createUser: (data: { email: string; name: string; password: string; plan?: string; role?: string }) =>
    apiClient.post<AdminUser>('/admin/users', data).then((r) => r.data),
  updateUser: (id: string, data: { name?: string; email?: string; plan?: string; role?: string }) =>
    apiClient.put<AdminUser>(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  setupAdmin: () => apiClient.get<{ message: string }>('/auth/setup-admin').then((r) => r.data),
};

// ---------- Webtree ----------
export const webtreeApi = {
  list: () => apiClient.get<WebtreePage[]>('/webtree').then((r) => r.data),
  get: (id: string) => apiClient.get<WebtreePage>(`/webtree/${id}`).then((r) => r.data),
  create: (data: CreateWebtreePageDto) => apiClient.post<WebtreePage>('/webtree', data).then((r) => r.data),
  update: (id: string, data: UpdateWebtreePageDto) => apiClient.put<WebtreePage>(`/webtree/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/webtree/${id}`),
  getPublic: (slug: string) => apiClient.get<WebtreePage>(`/p/${slug}`).then((r) => r.data),
};
