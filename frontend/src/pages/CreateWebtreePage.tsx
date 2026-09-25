import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { webtreeApi } from '../lib/api-services';
import { Input, TextArea } from '../components/ui/Input';
import Button from '../components/ui/Button';

interface LinkItem {
  label: string;
  url: string;
}

const STORAGE_KEY = 'webtree-create-draft';

interface DraftState {
  title: string;
  bio: string;
  description: string;
  avatarUrl: string;
  themeColor: string;
  backgroundColor: string;
  textColor: string;
  links: LinkItem[];
}

function loadDraft(): DraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState;
    if (!parsed.links || !Array.isArray(parsed.links) || parsed.links.length === 0) {
      parsed.links = [{ label: '', url: '' }];
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function CreateWebtreePage(): JSX.Element {
  const navigate = useNavigate();

  const draft = loadDraft();
  const [title, setTitle] = useState(draft?.title ?? '');
  const [bio, setBio] = useState(draft?.bio ?? '');
  const [description, setDescription] = useState(draft?.description ?? '');
  const [avatarUrl, setAvatarUrl] = useState(draft?.avatarUrl ?? '');
  const [themeColor, setThemeColor] = useState(draft?.themeColor ?? '#16a34a');
  const [backgroundColor, setBackgroundColor] = useState(draft?.backgroundColor ?? '#ffffff');
  const [textColor, setTextColor] = useState(draft?.textColor ?? '#1f2937');
  const [links, setLinks] = useState<LinkItem[]>(draft?.links ?? [{ label: '', url: '' }]);

  // Persist to localStorage on every change
  useEffect(() => {
    const state: DraftState = { title, bio, description, avatarUrl, themeColor, backgroundColor, textColor, links };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [title, bio, description, avatarUrl, themeColor, backgroundColor, textColor, links]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof webtreeApi.create>[0]) => webtreeApi.create(data),
    onSuccess: (page) => {
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/webtree/${page.id}/edit`);
    },
  });

  const handleAddLink = () => {
    setLinks([...links, { label: '', url: '' }]);
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, field: keyof LinkItem, value: string) => {
    const updated = [...links];
    updated[index][field] = value;
    setLinks(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLinks = links.filter((l) => l.label.trim() && l.url.trim());
    createMutation.mutate({
      title,
      bio: bio || undefined,
      description: description || undefined,
      avatarUrl: avatarUrl || undefined,
      themeColor,
      backgroundColor,
      textColor,
      links: validLinks.map((l, i) => ({ label: l.label, url: l.url, order: i })),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Crear Página Webtree
        </h1>
        <Button variant="ghost" onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/'); }}>
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Información básica</h2>
          <Input
            label="Título *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mi página de enlaces"
            required
          />
          <TextArea
            label="Biografía"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Una breve descripción sobre ti"
            rows={2}
          />
          <TextArea
            label="Descripción interna (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas internas sobre esta página"
            rows={2}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Avatar (opcional)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setAvatarUrl(reader.result as string);
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
                  onClick={() => setAvatarUrl("")}
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
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Colores del tema</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color de enlaces</label>
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fondo</label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Texto</label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Enlaces</h2>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddLink}>
              + Agregar enlace
            </Button>
          </div>
          {links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Texto del botón"
                value={link.label}
                onChange={(e) => handleLinkChange(index, 'label', e.target.value)}
              />
              <input
                className="flex-[2] rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                placeholder="https://..."
                value={link.url}
                onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
              />
              {links.length > 1 && (
                <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveLink(index)}>
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-500">
            Error al crear la página. Verifica los datos e intenta nuevamente.
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => { localStorage.removeItem(STORAGE_KEY); navigate('/'); }}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
            {createMutation.isPending ? 'Creando...' : 'Crear página'}
          </Button>
        </div>
      </form>
    </div>
  );
}
