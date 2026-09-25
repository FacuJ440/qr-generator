import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { qrApi, tagApi } from "../lib/api-services";
import { Select, Input } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import type { QrCode, QrType, QrStatus, QrCategory } from "../types";

const statusVariant: Record<
  QrStatus,
  "success" | "warning" | "danger" | "neutral"
> = {
  active: "success",
  paused: "warning",
  expired: "danger",
  archived: "neutral",
};

const typeLabels: Record<string, string> = {
  static: "Estático",
  dynamic: "Dinámico",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  paused: "Pausado",
  expired: "Expirado",
  archived: "Archivado",
};

const categoryLabels: Record<string, string> = {
  url: "URL",
  text: "Texto",
  wifi: "WiFi",
  vcard: "vCard",
  email: "Email",
  phone: "Teléfono",
  sms: "SMS",
};

export default function DashboardPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<{
    type?: QrType;
    status?: QrStatus;
    category?: QrCategory;
    search?: string;
    tagId?: string;
    page?: number;
    limit?: number;
  }>({ page: 1, limit: 10 });

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const { data, isLoading } = useQuery({
    queryKey: ["qr-codes", filters],
    queryFn: () => qrApi.list(filters),
  });

  const { data: tags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => qrApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["qr-codes"] }),
  });

  const totalPages = data ? Math.ceil(data.total / (filters.limit ?? 10)) : 0;
  const currentPage = filters.page ?? 1;

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value || undefined, page: 1 });
  };

  const changePage = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const changeLimit = (newLimit: number) => {
    setFilters({ ...filters, limit: newLimit, page: 1 });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Códigos QR Municipales
        </h1>
        <div className="flex gap-2">
          <Link to="/webtree">
            <Button variant="secondary">Páginas Webtree</Button>
          </Link>
          <Link to="/create">
            <Button>+ Crear Código QR</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="w-48">
          <Select
            label="Tipo"
            value={filters.type ?? ""}
            onChange={(e) => updateFilter("type", e.target.value)}
          >
            <option value="">Todos</option>
            <option value="static">Estático</option>
            <option value="dynamic">Dinámico</option>
          </Select>
        </div>
        <div className="w-48">
          <Select
            label="Estado"
            value={filters.status ?? ""}
            onChange={(e) => updateFilter("status", e.target.value)}
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
            value={filters.category ?? ""}
            onChange={(e) => updateFilter("category", e.target.value)}
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
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            label="Etiqueta"
            value={filters.tagId ?? ""}
            onChange={(e) => updateFilter("tagId", e.target.value)}
          >
            <option value="">Todas</option>
            {tags?.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.text}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* View toggle + page size */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === "list" ? "bg-[#4B0984] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${viewMode === "grid" ? "bg-[#4B0984] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}
          >
            Tarjetas
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Resultados por página:</span>
          <Select
            value={String(filters.limit ?? 10)}
            onChange={(e) => changeLimit(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="py-12 text-center text-gray-500">Cargando...</div>
      )}

      {!isLoading && data?.items.length === 0 && (
        <div className="py-12 text-center text-gray-500">
          No se encontraron códigos QR. ¡Crea uno!
        </div>
      )}

      {/* List view */}
      {!isLoading && viewMode === "list" && data && data.items.length > 0 && (
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
              {data.items.map((qr: QrCode) => (
                <tr key={qr.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    <Link to={`/qr/${qr.id}`} className="hover:text-[#4B0984]">
                      {qr.title}
                    </Link>
                    {qr.tag && (
                      <span
                        className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: qr.tag.color }}
                      >
                        {qr.tag.text}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={qr.type === "dynamic" ? "info" : "neutral"}>
                      {typeLabels[qr.type] ?? qr.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {categoryLabels[qr.category] ?? qr.category}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[qr.status]}>
                      {statusLabels[qr.status] ?? qr.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {qr.dynamicContent?.scanCount ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {new Date(qr.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm("¿Eliminar este código QR permanentemente?"))
                            deleteMutation.mutate(qr.id);
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
      )}

      {/* Grid view (cards) */}
      {!isLoading && viewMode === "grid" && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((qr: QrCode) => (
            <Link
              key={qr.id}
              to={`/qr/${qr.id}`}
              className="group rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md dark:bg-gray-800"
            >
              <div className="mb-3 flex items-center justify-center rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                <img
                  src={qrApi.imageUrl(qr.id)}
                  alt={qr.title}
                  className="h-32 w-32 object-contain"
                  loading="lazy"
                />
              </div>
              <h3 className="mb-1 truncate font-medium text-gray-900 group-hover:text-[#4B0984] dark:text-gray-100">
                {qr.title}
              </h3>
              <div className="mb-2 flex flex-wrap gap-1">
                <Badge variant={qr.type === "dynamic" ? "info" : "neutral"}>
                  {typeLabels[qr.type] ?? qr.type}
                </Badge>
                <Badge variant={statusVariant[qr.status]}>
                  {statusLabels[qr.status] ?? qr.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {categoryLabels[qr.category] ?? qr.category}
                {qr.dynamicContent?.scanCount !== undefined && ` · ${qr.dynamicContent.scanCount} escaneos`}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(qr.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {data.items.length} de {data.total} códigos QR
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
