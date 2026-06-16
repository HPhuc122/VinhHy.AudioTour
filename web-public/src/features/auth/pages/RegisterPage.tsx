import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../../../routes/routeConstants';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLanguage: string;
}

const LANGUAGES = [
  { value: 'vi', label: '🇻🇳 Tiếng Việt' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'zh', label: '🇨🇳 中文' },
  { value: 'ko', label: '🇰🇷 한국어' },
  { value: 'ja', label: '🇯🇵 日本語' },
  { value: 'fr', label: '🇫🇷 Français' },
];

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: { preferredLanguage: 'vi' },
  });

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await authApi.register({
        username: data.username,
        email: data.email,
        password: data.password,
        preferredLanguage: data.preferredLanguage,
      });
      login(res);
      navigate(ROUTES.HOME, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">V</div>
            <span className="font-bold text-white">VinhHy AudioTour</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
          <p className="text-gray-400 text-sm mt-1">Tham gia để trải nghiệm audio tour</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Tên đăng nhập</label>
              <input
                placeholder="username"
                autoFocus
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('username', {
                  required: 'Vui lòng nhập tên đăng nhập',
                  minLength: { value: 3, message: 'Tối thiểu 3 ký tự' },
                })}
              />
              {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Tối thiểu 6 ký tự' },
                })}
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('confirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (v) => v === password || 'Mật khẩu không khớp',
                })}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-300">Ngôn ngữ ưa thích</label>
              <select
                className="bg-gray-900 text-white rounded-xl px-4 py-2.5 border border-gray-700 focus:outline-none focus:border-emerald-500 text-sm"
                {...register('preferredLanguage')}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
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
              {isSubmitting ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            Đã có tài khoản?{' '}
            <Link to={ROUTES.LOGIN} className="text-emerald-400 hover:text-emerald-300 font-medium">
              Đăng nhập
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
