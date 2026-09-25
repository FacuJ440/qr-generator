import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CreateQrPage from './pages/CreateQrPage';
import QrDetailPage from './pages/QrDetailPage';
import ApiDocsPage from './pages/ApiDocsPage';
import ExpiredPage from './pages/ExpiredPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import CreateWebtreePage from './pages/CreateWebtreePage';
import EditWebtreePage from './pages/EditWebtreePage';
import WebtreeListPage from './pages/WebtreeListPage';
import PublicWebtreePage from './pages/PublicWebtreePage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

export default function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/expired" element={<ExpiredPage />} />
      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="/p/:slug" element={<PublicWebtreePage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="create" element={<CreateQrPage />} />
        <Route path="qr/:id" element={<QrDetailPage />} />
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="api-docs" element={<ApiDocsPage />} />
        <Route path="webtree" element={<WebtreeListPage />} />
        <Route path="webtree/create" element={<CreateWebtreePage />} />
        <Route path="webtree/:id/edit" element={<EditWebtreePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  );
}
