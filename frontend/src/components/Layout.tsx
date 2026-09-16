import { Outlet, Link } from 'react-router-dom';
// import Button from './ui/Button';

export default function Layout(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[#4B0984]">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
            </svg>
            MuniQR
          </Link>
          {/* <div className="flex items-center gap-4">
            <Link to="/create">
              <Button size="sm">+ Nuevo QR</Button>
            </Link>
          </div> */}
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
        MuniQR © 2026 | Dirección de Innovación y Gobierno Digital
      </footer>
    </div>
  );
}
