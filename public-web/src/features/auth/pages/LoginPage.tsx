import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../../../routes/routeConstants';

interface FormData {
  username: string;
  password: string;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? ROUTES.HOME;
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.login(data);
      login(res);
      navigate(from, { replace: true });
    } catch {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="font-bold text-white">VinhHy AudioTour</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
          <p className="text-gray-400 text-sm mt-1">Chào mừng trở lại!</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Tên đăng nhập</label>
              <input
                placeholder="username"
                autoFocus
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('username', { required: 'Vui lòng nhập tên đăng nhập' })}
              />
              {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium text-sm transition-colors mt-1"
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            Chưa có tài khoản?{' '}
            <Link to={ROUTES.REGISTER} className="text-emerald-400 hover:text-emerald-300 font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to={ROUTES.HOME} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
