export default function ApiDocsPage(): JSX.Element {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documentación de la API</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
        <iframe
          src="/api/docs"
          title="Swagger UI"
          className="h-[80vh] w-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}
