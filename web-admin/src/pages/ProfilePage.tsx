import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useUpdateUser } from '../features/users/hooks/useUsers';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { extractApiError } from '../api/apiError';

const schema = z
  .object({
    password: z.string().min(6, 'Tối thiểu 6 ký tự').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    preferredLanguage: z.string(),
  })
  .refine(
    (d) => !d.password || d.password === d.confirmPassword,
    { message: 'Mật khẩu xác nhận không khớp', path: ['confirmPassword'] },
  );

type FormData = z.infer<typeof schema>;

const LANGUAGES = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
];

export function ProfilePage() {
  const { user } = useAuth();
  const updateUser = useUpdateUser(user?.userId ?? 0);
  const toast = useToast();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferredLanguage: user?.preferredLanguage ?? 'vi' },
  });

  const onSubmit = async (data: FormData) => {
    const payload: any = { preferredLanguage: data.preferredLanguage };
    if (data.password) payload.password = data.password;
    try {
      await updateUser.mutateAsync(payload);
      toast('Cập nhật thành công', 'success');
      setSuccess(true);
      reset({ password: '', confirmPassword: '', preferredLanguage: data.preferredLanguage });
    } catch (err) {
      toast(extractApiError(err), 'error');
    }
  };

  return (
    <div className="app-page max-w-lg">
      <div>
        <h1 className="app-title">Thông tin cá nhân</h1>
        <p className="app-subtitle">Cập nhật mật khẩu và tuỳ chỉnh của bạn</p>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold uppercase text-white">
            {user?.username?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.username}</p>
            <p className="text-sm text-gray-600">{user?.role}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select
            label="Ngôn ngữ mặc định"
            options={LANGUAGES}
            {...register('preferredLanguage')}
          />

          <hr className="border-gray-100" />

          <Input
            label="Mật khẩu mới (bỏ trống để giữ nguyên)"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          {success && (
            <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
              Cập nhật thành công!
            </div>
          )}

          <Button type="submit" loading={updateUser.isPending} className="self-start">
            Lưu thay đổi
          </Button>
        </form>
      </div>
    </div>
  );
}
