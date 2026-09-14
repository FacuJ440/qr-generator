import { useSearchParams } from 'react-router-dom';

export default function ExpiredPage(): JSX.Element {
  const [params] = useSearchParams();
  const code = params.get('code');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
        <div className="mb-4 text-6xl">⏳</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Código QR no disponible
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Este código QR está inactivo, pausado o ha expirado.
          Contacta al propietario para más información.
        </p>
        {code && (
          <p className="mt-4 text-sm text-gray-400">Código: {code}</p>
        )}
      </div>
    </div>
  );
}
