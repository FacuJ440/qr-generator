import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { webtreeApi } from '../lib/api-services';
import { Input, TextArea } from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { WebtreeLink } from '../types';

export default function EditWebtreePage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ['webtree', id],
    queryFn: () => webtreeApi.get(id!),
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [slug, setSlug] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [themeColor, setThemeColor] = useState('#16a34a');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#1f2937');
  const [isActive, setIsActive] = useState(true);
  const [links, setLinks] = useState<WebtreeLink[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setBio(page.bio || '');
      setSlug(page.slug);
      setAvatarUrl(page.avatarUrl || '');
      setThemeColor(page.themeColor);
      setBackgroundColor(page.backgroundColor);
      setTextColor(page.textColor);
      setIsActive(page.isActive);
      setLinks([...page.links].sort((a, b) => a.order - b.order));
      setDirty(false);
    }
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof webtreeApi.update>[1]) => webtreeApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webtree', id] });
      queryClient.invalidateQueries({ queryKey: ['webtree-pages'] });
      setDirty(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => webtreeApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webtree-pages'] });
      navigate('/');
    },
  });

  const markDirty = () => setDirty(true);

  const handleAddLink = () => {
    const newLink: WebtreeLink = {
      id: `temp-${Date.now()}`,
      pageId: id!,
      label: '',
      url: '',
      icon: null,
      order: links.length,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLinks([...links, newLink]);
    markDirty();
  };

  const handleRemoveLink = (linkId: string) => {
    setLinks(links.filter((l) => l.id !== linkId));
    markDirty();
  };

  const handleLinkChange = (linkId: string, field: keyof WebtreeLink, value: string) => {
    setLinks(links.map((l) => (l.id === linkId ? { ...l, [field]: value } : l)));
    markDirty();
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newLinks.length) return;
    [newLinks[index], newLinks[swapIndex]] = [newLinks[swapIndex], newLinks[index]];
    newLinks.forEach((l, i) => (l.order = i));
    setLinks(newLinks);
    markDirty();
  };

  const handleSave = () => {
    updateMutation.mutate({
      title,
      bio: bio || undefined,
      slug,
      avatarUrl: avatarUrl || undefined,
      themeColor,
      backgroundColor,
      textColor,
      isActive,
      links: links
        .filter((l) => l.label.trim() && l.url.trim())
        .map((l, i) => ({ label: l.label, url: l.url, icon: l.icon || undefined, order: i, isActive: l.isActive })),
    });
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  if (!page) {
    return <div className="text-center text-gray-500">Página no encontrada</div>;
  }

  const publicUrl = `${window.location.origin}/p/${slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Editar Página Webtree
        </h1>
        <div className="flex gap-2">
          <Link to="/webtree" className="contents">
            <Button variant="ghost">Volver</Button>
          </Link>
          <Button variant="danger" onClick={() => {
            if (confirm('¿Eliminar esta página permanentemente?')) deleteMutation.mutate();
          }}>
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          {/* Basic Info */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Información</h2>
            <Input
              label="Título"
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            />
            <TextArea
              label="Biografía"
              value={bio}
              onChange={(e) => { setBio(e.target.value); markDirty(); }}
              rows={2}
            />
            <Input
              label="Slug (URL pública)"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); markDirty(); }}
            />
            <div className="rounded-md bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              URL pública: <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{publicUrl}</a>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Avatar
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => { setAvatarUrl(reader.result as string); markDirty(); };
                  reader.readAsDataURL(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-[#4B0984] file:px-3 file:py-1.5 file:text-white hover:file:bg-[#2e0652]"
              />
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setAvatarUrl(''); markDirty(); }}
                    className="text-sm text-red-500 hover:underline"
                  >
                    Quitar avatar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Colores</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Enlaces</label>
                <input type="color" value={themeColor} onChange={(e) => { setThemeColor(e.target.value); markDirty(); }} className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fondo</label>
                <input type="color" value={backgroundColor} onChange={(e) => { setBackgroundColor(e.target.value); markDirty(); }} className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
                <input type="color" value={textColor} onChange={(e) => { setTextColor(e.target.value); markDirty(); }} className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600" />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Página activa</label>
            <input type="checkbox" checked={isActive} onChange={(e) => { setIsActive(e.target.checked); markDirty(); }} className="h-5 w-5 rounded" />
          </div>

          {/* Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Enlaces</h2>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLink}>+ Agregar</Button>
            </div>
            {links.map((link, index) => (
              <div key={link.id} className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Texto del botón"
                    value={link.label}
                    onChange={(e) => handleLinkChange(link.id, 'label', e.target.value)}
                  />
                  <input
                    className="flex-[2] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleLinkChange(link.id, 'url', e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleMoveLink(index, 'up')} disabled={index === 0}>↑</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleMoveLink(index, 'down')} disabled={index === links.length - 1}>↓</Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveLink(link.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
          </div>

          {updateMutation.isError && (
            <p className="text-sm text-red-500">Error al guardar. Intenta nuevamente.</p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending || !dirty}>
              {updateMutation.isPending ? 'Guardando...' : dirty ? 'Guardar cambios' : 'Guardado ✓'}
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200">Vista previa</h2>
          <div
            className="flex min-h-[500px] flex-col items-center rounded-lg p-8 shadow-sm"
            style={{ backgroundColor, color: textColor }}
          >
            {avatarUrl && (
              <img
                src={avatarUrl}
                alt={title}
                className="mb-4 h-24 w-24 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <h3 className="mb-1 text-xl font-bold">{title || 'Sin título'}</h3>
            {bio && <p className="mb-6 text-sm opacity-80">{bio}</p>}
            <div className="flex w-full max-w-xs flex-col gap-3">
              {links.filter((l) => l.label.trim() && l.url.trim()).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg px-4 py-3 text-center font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: themeColor, color: '#ffffff' }}
                >
                  {link.label}
                </a>
              ))}
              {links.filter((l) => l.label.trim() && l.url.trim()).length === 0 && (
                <p className="text-center text-sm opacity-50">Sin enlaces</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
