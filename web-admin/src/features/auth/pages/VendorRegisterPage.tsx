import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { ApiClientError } from '@/api/apiError';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/context/AuthContext';
import type { VendorRegisterRequest } from '@/types/auth';

const successMessage = 'Đăng ký tài khoản chủ sạp thành công. Vui lòng đăng nhập.';

export function VendorRegisterPage() {
  const { authApi, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<VendorRegisterRequest>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    ownerName: '',
    storeName: '',
    phoneNumber: '',
    preferredLanguage: 'vi',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationKey: ['auth', 'registerVendor'],
    mutationFn: (request: VendorRegisterRequest) => authApi.registerVendor(request),
  });

  if (isAuthenticated) {
    return <Navigate to={routes.dashboard} replace />;
  }

  const updateField =
    (field: keyof VendorRegisterRequest) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const request: VendorRegisterRequest = {
      username: form.username.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      email: form.email.trim(),
      ownerName: form.ownerName.trim(),
      storeName: form.storeName.trim(),
      phoneNumber: form.phoneNumber?.trim() || undefined,
      preferredLanguage: 'vi',
    };

    if (
      !request.username ||
      !request.password ||
      !request.confirmPassword ||
      !request.email ||
      !request.ownerName ||
      !request.storeName
    ) {
      setValidationError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    if (request.password !== request.confirmPassword) {
      setValidationError('Xác nhận mật khẩu không khớp.');
      return;
    }

    registerMutation.mutate(request, {
      onSuccess: () => {
        navigate(routes.login, {
          replace: true,
          state: { message: successMessage },
        });
      },
    });
  };

  const apiError =
    registerMutation.error instanceof ApiClientError
      ? registerMutation.error.message
      : registerMutation.error
        ? 'Đăng ký thất bại. Vui lòng thử lại.'
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
            K
          </div>
          <h1 className="text-xl font-bold text-gray-900">Đăng ký chủ sạp</h1>
          <p className="mt-1 text-sm text-gray-500">KhanhHoi AudioTour CMS</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {validationError ? <Alert variant="error" message={validationError} /> : null}
          {apiError ? <Alert variant="error" message={apiError} /> : null}

          <FormField label="Tên đăng nhập" htmlFor="vendor-username">
            <Input
              id="vendor-username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={updateField('username')}
            />
          </FormField>

          <FormField label="Email" htmlFor="vendor-email">
            <Input
              id="vendor-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField('email')}
            />
          </FormField>

          <FormField label="Mật khẩu" htmlFor="vendor-password">
            <Input
              id="vendor-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={updateField('password')}
            />
          </FormField>

          <FormField label="Xác nhận mật khẩu" htmlFor="vendor-confirm-password">
            <Input
              id="vendor-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
            />
          </FormField>

          <FormField label="Tên chủ sạp / chủ cửa hàng" htmlFor="vendor-owner-name">
            <Input
              id="vendor-owner-name"
              name="ownerName"
              autoComplete="name"
              value={form.ownerName}
              onChange={updateField('ownerName')}
            />
          </FormField>

          <FormField label="Tên sạp / tên cửa hàng" htmlFor="vendor-store-name">
            <Input
              id="vendor-store-name"
              name="storeName"
              value={form.storeName}
              onChange={updateField('storeName')}
            />
          </FormField>

          <FormField label="Số điện thoại" htmlFor="vendor-phone-number">
            <Input
              id="vendor-phone-number"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={updateField('phoneNumber')}
            />
          </FormField>

          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
            Đăng ký tài khoản chủ sạp
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link to={routes.login} className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
