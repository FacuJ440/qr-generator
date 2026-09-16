import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { qrApi } from '../lib/api-services';
import { Select, Input } from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import type { QrCode, QrType, QrStatus, QrCategory } from '../types';

const statusVariant: Record<QrStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  expired: 'danger',
  archived: 'neutral',
};

const typeLabels: Record<string, string> = {
  static: 'Estático',
  dynamic: 'Dinámico',
};

const statusLabels: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  expired: 'Expirado',
  archived: 'Archivado',
};

const categoryLabels: Record<string, string> = {
  url: 'URL',
  text: 'Texto',
  wifi: 'WiFi',
  vcard: 'vCard',
  email: 'Email',
  phone: 'Teléfono',
  sms: 'SMS',
};

export default function DashboardPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    type?: QrType;
    status?: QrStatus;
    category?: QrCategory;
    search?: string;
  }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['qr-codes', filters],
    queryFn: () => qrApi.list(filters),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => qrApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => qrApi.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Códigos QR Municipales</h1>
        <Link to="/create">
          <Button className='bg-[#4B0984] hover:bg-[#2e0652]'>+ Crear Código QR</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="w-48">
          <Select
            label="Tipo"
            value={filters.type ?? ''}
            onChange={(e) => setFilters({ ...filters, type: (e.target.value as QrType) || undefined })}
          >
            <option value="">Todos</option>
            <option value="static">Estático</option>
            <option value="dynamic">Dinámico</option>
          </Select>
        </div>
        <div className="w-48">
          <Select
            label="Estado"
            value={filters.status ?? ''}
            onChange={(e) => setFilters({ ...filters, status: (e.target.value as QrStatus) || undefined })}
          >
            <option value="">Todos</option>
            <option value="active">Activo</option>
            <option value="paused">Pausado</option>
            <option value="expired">Expirado</option>
          </Select>
        </div>
        <div className="w-48">
          <Select
            label="Categoría"
            value={filters.category ?? ''}
            onChange={(e) => setFilters({ ...filters, category: (e.target.value as QrCategory) || undefined })}
          >
            <option value="">Todas</option>
            <option value="url">URL</option>
            <option value="text">Texto</option>
            <option value="wifi">WiFi</option>
            <option value="vcard">vCard</option>
            <option value="email">Email</option>
            <option value="phone">Teléfono</option>
            <option value="sms">SMS</option>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            label="Buscar"
            type="text"
            placeholder="Buscar por título..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Escaneos</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No se encontraron códigos QR. ¡Crea uno!</td></tr>
            )}
            {data?.items.map((qr: QrCode) => (
              <tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  <Link to={`/qr/${qr.id}`} className="hover:text-[#4B0984]">{qr.title}</Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={qr.type === 'dynamic' ? 'info' : 'neutral'}>{typeLabels[qr.type] ?? qr.type}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{categoryLabels[qr.category] ?? qr.category}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[qr.status]}>{statusLabels[qr.status] ?? qr.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {qr.dynamicContent?.scanCount ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                  {new Date(qr.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => archiveMutation.mutate(qr.id)}>
                      Archivar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm('¿Eliminar este código QR permanentemente?')) deleteMutation.mutate(qr.id);
                      }}
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && (
        <p className="text-sm text-gray-500">Total: {data.total} códigos QR</p>
      )}
    </div>
  );
}
