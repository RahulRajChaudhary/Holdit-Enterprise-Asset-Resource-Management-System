import { useId, useState } from 'react';

function FormField({ label, type = 'text', value, onChange, onBlur, error, autoComplete }) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';

  return (
    <div>
      <label htmlFor={id} className="block text-left text-sm text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={isPassword && reveal ? 'text' : type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 focus:ring-accent-500/40 ${
            isPassword ? 'pr-16' : ''
          } ${error ? 'border-status-overdue' : 'border-gray-300 focus:border-accent-500'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-400 hover:text-accent-600"
            tabIndex={-1}
          >
            {reveal ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-status-overdue">{error}</p>}
    </div>
  );
}

export default FormField;
