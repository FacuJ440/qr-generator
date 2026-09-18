import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { qrApi, analyticsApi } from "../lib/api-services";
import {
  createQrStylingInstance,
  downloadQrPng,
  downloadQrSvg,
  downloadQrCard,
} from "../lib/qr-styling";
import { Input, Select } from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import type { QrStatus, QrStyleConfig } from "../types";
import { useEffect, useRef, useState } from "react";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

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

export default function QrDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const qrImageRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const { data: qr, isLoading } = useQuery({
    queryKey: ["qr-code", id],
    queryFn: () => qrApi.get(id!),
    enabled: !!id,
  });

  const { data: analytics } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => analyticsApi.summary(id!),
    enabled: !!id && qr?.type === "dynamic",
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      title?: string;
      status?: QrStatus;
      targetUrl?: string;
      styleConfig?: Partial<QrStyleConfig>;
    }) => qrApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qr-code", id] });
      queryClient.invalidateQueries({ queryKey: ["qr-codes"] });
    },
  });

  // Render QR with full styling using qr-code-styling (client-side)
  useEffect(() => {
    if (!qr || !qrImageRef.current) return;

    const container = qrImageRef.current;
    let cancelled = false;

    createQrStylingInstance(qr, 300).then((instance) => {
      if (!cancelled && container) {
        container.innerHTML = "";
        instance.append(container);
      }
    });

    return () => {
      cancelled = true;
      if (container) container.innerHTML = "";
    };
  }, [qr]);

  const handleDownloadPng = async (): Promise<void> => {
    if (!qr) return;
    setDownloading(true);
    try {
      await downloadQrPng(qr, `qr-${qr.id}.png`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSvg = async (): Promise<void> => {
    if (!qr) return;
    setDownloading(true);
    try {
      await downloadQrSvg(qr, `qr-${qr.id}.svg`);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadCard = async (): Promise<void> => {
    if (!qr) return;
    setDownloading(true);
    try {
      await downloadQrCard(qr, `qr-${qr.id}-tarjeta.jpg`);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !qr) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  const isDynamic = qr.type === "dynamic";
  const shortUrl = qr.dynamicContent
    ? `${window.location.origin}/r/${qr.dynamicContent.shortCode}`
    : "";

  const deviceData = analytics?.scansByDevice
    ? analytics.scansByDevice.map((d) => ({ name: d.key, value: d.count }))
    : [];

  const browserData = analytics?.scansByBrowser
    ? analytics.scansByBrowser.map((b) => ({ name: b.key, value: b.count }))
    : [];

  const hourData = analytics?.scansByHour
    ? analytics.scansByHour.map((h) => ({
        hour: `${String(h.hour).padStart(2, "0")}:00`,
        count: h.count,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-[#4B0984] hover:underline">
          ← Volver
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {qr.title}
        </h1>
        <Badge variant={qr.status === "active" ? "success" : "warning"}>
          {statusLabels[qr.status] ?? qr.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* QR Image */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
            Código QR
          </h3>
          <div
            ref={qrImageRef}
            className="mx-auto flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700"
            style={{ width: 300, height: 300 }}
          />
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadPng}
              disabled={downloading}
            >
              PNG
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadSvg}
              disabled={downloading}
            >
              SVG
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownloadCard}
              disabled={downloading}
            >
              Tarjeta
            </Button>
          </div>
        </div>

        {/* Details & Edit */}
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
            Detalles
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Tipo:</dt>
              <dd className="font-medium">{typeLabels[qr.type] ?? qr.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Categoría:</dt>
              <dd className="font-medium">
                {categoryLabels[qr.category] ?? qr.category}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Etiqueta:</dt>
              <dd className="font-medium">
                {qr.tag ? (
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: qr.tag.color }}
                  >
                    {qr.tag.text}
                  </span>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Creado:</dt>
              <dd className="font-medium">
                {new Date(qr.createdAt).toLocaleDateString()}
              </dd>
            </div>
            {isDynamic && qr.dynamicContent && (
              <>
                <div className="flex justify-between">
                  <dt className="text-gray-500">URL corta:</dt>
                  <dd className="font-mono text-xs break-all">{shortUrl}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Destino:</dt>
                  <dd className="font-mono text-xs break-all">
                    {qr.dynamicContent.targetUrl}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Escaneos:</dt>
                  <dd className="font-medium">{qr.dynamicContent.scanCount}</dd>
                </div>
              </>
            )}
          </dl>

          {/* Edit for dynamic */}
          {isDynamic && (
            <div className="mt-6 space-y-3 border-t border-gray-200 pt-4 dark:border-gray-700">
              <h4 className="text-sm font-semibold">Editar</h4>
              <Input
                label="Título"
                defaultValue={qr.title}
                onBlur={(e) => updateMutation.mutate({ title: e.target.value })}
              />
              <Select
                label="Estado"
                defaultValue={qr.status}
                onChange={(e) =>
                  updateMutation.mutate({ status: e.target.value as QrStatus })
                }
              >
                <option value="active">Activo</option>
                <option value="paused">Pausado</option>
                <option value="expired">Expirado</option>
              </Select>
              <Input
                label="URL Destino"
                defaultValue={qr.dynamicContent?.targetUrl}
                onBlur={(e) =>
                  updateMutation.mutate({ targetUrl: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* Analytics */}
        {isDynamic && (
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
              Analíticas
            </h3>
            <div className="mb-4 text-center">
              <p className="text-3xl font-bold text-[#4B0984]">
                {analytics?.totalScans ?? 0}
              </p>
              <p className="text-sm text-gray-500">Total de escaneos</p>
            </div>
            <a href={analyticsApi.exportCsv(qr.id)}>
              <Button size="sm" variant="secondary" className="w-full">
                Exportar CSV
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* Charts */}
      {isDynamic && analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
              Escaneos en el tiempo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.scansByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
              Escaneos por hora
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
              Por dispositivo
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {deviceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
            <h3 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
              Por navegador
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={browserData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
