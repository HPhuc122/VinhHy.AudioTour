import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation';
import { ApiClientError } from '@/api/apiError';
import { getDefaultRouteForRole } from '@/features/auth/roleAccess';

export function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setValidationError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }

    loginMutation.mutate(
      { username: trimmedUsername, password },
      {
        onSuccess: (session) => {
          navigate(getDefaultRouteForRole(session.user.role), { replace: true });
        },
      },
    );
  };

  const apiError =
    loginMutation.error instanceof ApiClientError
      ? loginMutation.error.message
      : loginMutation.error
        ? 'Đăng nhập thất bại. Vui lòng thử lại.'
        : null;

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {validationError ? <Alert variant="error" message={validationError} /> : null}
      {apiError ? <Alert variant="error" message={apiError} /> : null}

      <FormField label="Ten dang nhap" htmlFor="username">
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          hasError={Boolean(validationError && !username.trim())}
        />
      </FormField>

      <FormField label="Mat khau" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hasError={Boolean(validationError && !password)}
        />
      </FormField>

      <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
        Dang nhap
      </Button>
    </form>
  );
}
