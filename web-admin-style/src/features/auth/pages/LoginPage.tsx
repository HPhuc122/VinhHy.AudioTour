import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLogin } from '../hooks/useLogin';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { extractApiError } from '../../../api/apiError';

interface FormData {
  username: string;
  password: string;
}

export function LoginPage() {
  const login = useLogin();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { username: '', password: '' },
  });

  const validate = {
    username: { required: 'Vui lòng nhập tên đăng nhập' },
    password: { required: 'Vui lòng nhập mật khẩu' },
  };

  const onSubmit = async (data: FormData) => {
    setServerError('');
    try {
      await login.mutateAsync(data);
    } catch (err) {
      setServerError(extractApiError(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white font-bold">
            V
          </div>
          <h1 className="text-xl font-bold text-gray-900">VinhHy AudioTour</h1>
          <p className="mt-1 text-sm text-gray-500">CMS Admin</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            id="username"
            label="Tên đăng nhập"
            placeholder="admin"
            autoComplete="username"
            autoFocus
            error={errors.username?.message}
            {...register('username', validate.username)}
          />

          <Input
            id="password"
            type="password"
            label="Mật khẩu"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', validate.password)}
          />

          {serverError && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 border border-red-200">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            loading={login.isPending}
            className="mt-2 w-full"
          >
            Đăng nhập
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} VinhHy AudioTour
        </p>
      </div>
    </div>
  );
}
