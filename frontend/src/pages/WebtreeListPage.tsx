import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webtreeApi, qrApi } from '../lib/api-services';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function WebtreeListPage(): JSX.Element {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['webtree-pages'],
    queryFn: () => webtreeApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => webtreeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webtree-pages'] });
    },
  });

  const generateQrMutation = useMutation({
    mutationFn: ({ title, url }: { title: string; url: string }) =>
      qrApi.create({
        type: 'dynamic',
        category: 'url',
        title,
        targetUrl: url,
      }),
    onSuccess: (qr) => {
      navigate(`/qr/${qr.id}`);
    },
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Páginas Webtree
        </h1>
        <Link to="/webtree/create">
          <Button>+ Crear Página</Button>
        </Link>
      </div>

      {pages && pages.length === 0 && (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No tienes páginas Webtree creadas.</p>
          <Link to="/webtree/create" className="mt-4 inline-block">
            <Button>Crear mi primera página</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pages?.map((page) => (
          <div
            key={page.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{page.title}</h3>
                <a
                  href={`${window.location.origin}/p/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline"
                >
                  /p/{page.slug}
                </a>
              </div>
              <Badge variant={page.isActive ? 'success' : 'neutral'}>
                {page.isActive ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>

            {page.bio && (
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{page.bio}</p>
            )}

            <div className="mb-4 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>{page.links.length} enlaces</span>
              <span>•</span>
              <span>{new Date(page.createdAt).toLocaleDateString('es-AR')}</span>
            </div>

            <div className="flex gap-2">
              <Link to={`/webtree/${page.id}/edit`} className="flex-1">
                <Button variant="secondary" size="sm" className="w-full">Editar</Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                disabled={generateQrMutation.isPending}
                onClick={() => {
                  const publicUrl = `${window.location.origin}/p/${page.slug}`;
                  generateQrMutation.mutate({ title: `Webtree - ${page.title}`, url: publicUrl });
                }}
              >
                {generateQrMutation.isPending ? '...' : 'QR'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (confirm('¿Eliminar esta página?')) deleteMutation.mutate(page.id);
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
