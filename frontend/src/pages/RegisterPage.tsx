import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function RegisterPage(): JSX.Element {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, name, password);
      navigate('/');
    } catch {
      setError('Error al registrarse. El email ya podría estar en uso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creando...' : 'Registrarse'}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-[#4B0984] hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
