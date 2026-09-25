import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { webtreeApi } from '../lib/api-services';

export default function PublicWebtreePage(): JSX.Element {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ['public-webtree', slug],
    queryFn: () => webtreeApi.getPublic(slug!),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-700">Página no encontrada</h1>
        <p className="text-gray-500">La página que buscas no existe o no está disponible.</p>
      </div>
    );
  }

  const sortedLinks = [...page.links]
    .filter((l) => l.isActive && l.label.trim() && l.url.trim())
    .sort((a, b) => a.order - b.order);

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-12"
      style={{ backgroundColor: page.backgroundColor, color: page.textColor }}
    >
      <div className="w-full max-w-md">
        {/* Avatar */}
        {page.avatarUrl && (
          <div className="mb-6 flex justify-center">
            <img
              src={page.avatarUrl}
              alt={page.title}
              className="h-28 w-28 rounded-full object-cover shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Title & Bio */}
        <h1 className="mb-2 text-center text-2xl font-bold">{page.title}</h1>
        {page.bio && (
          <p className="mb-8 text-center text-sm opacity-80">{page.bio}</p>
        )}

        {/* Links */}
        <div className="flex flex-col gap-4">
          {sortedLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl px-6 py-4 text-center font-semibold shadow-md transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ backgroundColor: page.themeColor, color: '#ffffff' }}
            >
              {link.icon && <span className="mr-2">{link.icon}</span>}
              {link.label}
            </a>
          ))}
        </div>

        {sortedLinks.length === 0 && (
          <p className="mt-8 text-center text-sm opacity-50">Esta página no tiene enlaces.</p>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs opacity-40">
          <p>Creado con Muni QR</p>
        </div>
      </div>
    </div>
  );
}
