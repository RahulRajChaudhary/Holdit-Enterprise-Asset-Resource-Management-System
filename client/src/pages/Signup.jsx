import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import FormField from '../components/FormField';
import AuthLayout from '../components/AuthLayout';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validateName() {
    setFieldErrors((prev) => ({ ...prev, name: name.trim() ? null : 'Name is required.' }));
  }

  function validateEmail() {
    setFieldErrors((prev) => ({
      ...prev,
      email: EMAIL_RE.test(email) ? null : 'Entered email is invalid.',
    }));
  }

  function validatePassword() {
    setFieldErrors((prev) => ({
      ...prev,
      password: password.length >= 8 ? null : 'Password must be at least 8 characters.',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const errors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!EMAIL_RE.test(email)) errors.email = 'Entered email is invalid.';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await signup({ name: name.trim(), email, password });
      navigate('/login');
    } catch (err) {
      const res = err.response?.data;
      if (res?.field) {
        setFieldErrors((prev) => ({ ...prev, [res.field]: res.message }));
      } else {
        setFormError('Could not create the account. Try again in a moment.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Signup creates an Employee account. Roles are assigned later by an Admin."
    >
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <FormField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={validateName}
          error={fieldErrors.name}
          autoComplete="name"
        />
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
          onBlur={validatePassword}
          error={fieldErrors.password}
          autoComplete="new-password"
        />

        {formError && <p className="text-sm text-status-overdue">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 flex items-center justify-center gap-2 rounded-md bg-accent-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-60"
        >
          {submitting && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-6 border-t border-gray-200 pt-4 text-center">
        <p className="text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Signup;
