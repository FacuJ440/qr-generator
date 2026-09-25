import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api-services';
import { Input, Select } from '../components/ui/Input';
import Button from '../components/ui/Button';
import type { AdminUser } from '../types';

const roleLabels: Record<string, string> = {
  user: 'Usuario',
  admin: 'Administrador',
};

const planLabels: Record<string, string> = {
  free: 'Gratis',
  pro: 'Pro',
  enterprise: 'Empresa',
};

export default function AdminDashboardPage(): JSX.Element {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPlan, setEditPlan] = useState('free');
  const [editRole, setEditRole] = useState('user');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPlan, setNewPlan] = useState('free');
  const [newRole, setNewRole] = useState('user');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.listUsers,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; body: { name?: string; email?: string; plan?: string; role?: string } }) =>
      adminApi.updateUser(data.id, data.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setShowCreate(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPlan('free');
      setNewRole('user');
    },
  });

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPlan(user.plan);
    setEditRole(user.role);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Administración de Usuarios</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancelar' : '+ Nuevo Usuario'}
        </Button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Crear nuevo usuario</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate({
                email: newEmail,
                name: newName,
                password: newPassword,
                plan: newPlan,
                role: newRole,
              });
            }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <Input label="Nombre" value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <Input label="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            <Input label="Contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            <Select label="Plan" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
              <option value="free">Gratis</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Empresa</option>
            </Select>
            <Select label="Rol" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </Select>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr className="text-left text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Creado</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users?.map((user) => (
              <tr key={user.id} className="text-gray-900 dark:text-gray-100">
                {editingId === user.id ? (
                  <>
                    <td className="px-4 py-3">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Select value={editPlan} onChange={(e) => setEditPlan(e.target.value)}>
                        <option value="free">Gratis</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Empresa</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              id: user.id,
                              body: { name: editName, email: editEmail, plan: editPlan, role: editRole },
                            })
                          }
                        >
                          Guardar
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700">
                        {planLabels[user.plan] ?? user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="text-sm text-[#4B0984] hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${user.name}?`)) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          className="text-sm text-red-500 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-500">
        Total de usuarios: {users?.length ?? 0}
      </p>
    </div>
  );
}
