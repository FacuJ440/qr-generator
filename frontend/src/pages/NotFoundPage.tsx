import { Link } from 'react-router-dom';

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <div className="mb-4 text-6xl">🔍</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">404</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-400">Página no encontrada</p>
        <Link to="/" className="text-brand-600 hover:underline">Ir al inicio</Link>
      </div>
    </div>
  );
}
