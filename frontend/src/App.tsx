import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CreateQrPage from './pages/CreateQrPage';
import QrDetailPage from './pages/QrDetailPage';
import ExpiredPage from './pages/ExpiredPage';
import NotFoundPage from './pages/NotFoundPage';
import Layout from './components/Layout';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/expired" element={<ExpiredPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />

      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="create" element={<CreateQrPage />} />
        <Route path="qr/:id" element={<QrDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}
