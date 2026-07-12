import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import FormField from '../components/FormField';
import AuthLayout from '../components/AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setSession } = useAuth();
  const [email, setEmail] = useState(location.state?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validateEmail() {
    setFieldErrors((prev) => ({
      ...prev,
      email: EMAIL_RE.test(email) ? null : 'Entered email is invalid.',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!EMAIL_RE.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Entered email is invalid.' }));
      return;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password is required.' }));
      return;
    }

    setSubmitting(true);
    try {
      const { token, user } = await login({ email, password });
      setSession({ token, user });
      navigate('/dashboard');
    } catch (err) {
      const res = err.response?.data;
      if (res?.field) {
        setFieldErrors((prev) => ({ ...prev, [res.field]: res.message }));
      } else {
        setFormError('Could not sign in. Try again in a moment.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Welcome back to Holdit">
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={validateEmail}
          error={fieldErrors.email}
          autoComplete="email"
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        {formError && <p className="text-sm text-status-overdue">{formError}</p>}

        <button
          type="button"
          onClick={() => setShowForgotNote((v) => !v)}
          className="self-end text-xs text-gray-500 underline decoration-dotted hover:text-accent-600"
        >
          Forgot password
        </button>
        {showForgotNote && (
          <p className="-mt-2 text-xs text-gray-500">
            Password reset isn't available in this demo — ask an Admin to help.
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
        >
          {submitting && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-500">
          New here? Sign up creates an employee account — admin roles are assigned later.
        </p>
        <Link
          to="/signup"
          className="mt-3 inline-block w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-accent-500 hover:text-accent-600"
        >
          Create account
        </Link>
      </div>
    </AuthLayout>
  );
}

export default Login;
