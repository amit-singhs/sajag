import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Icon } from './Icon';

interface FieldShellProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Label + control + hint/error, with accessible wiring. Every form control uses this shell. */
function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children(id, describedBy)}
      {hint && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

type Common = { label: ReactNode; hint?: ReactNode; error?: string | undefined };

export function TextField({ label, hint, error, className, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <input id={id} className={`input ${className ?? ''}`} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />
      )}
    </FieldShell>
  );
}

/** Password input with an eye button to show / hide what was typed. */
export function PasswordField({ label, hint, error, className, ...rest }: Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <div className="password">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            className={`input password__input ${className ?? ''}`}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy}
            autoCapitalize="off"
            spellCheck={false}
            {...rest}
          />
          <button
            type="button"
            className="password__toggle"
            aria-label={visible ? 'पासवर्ड छिपाएँ' : 'पासवर्ड दिखाएँ'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
          >
            <Icon name={visible ? 'eyeOff' : 'eye'} size={20} />
          </button>
        </div>
      )}
    </FieldShell>
  );
}

export function TextArea({ label, hint, error, className, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <textarea id={id} className={`input input--area ${className ?? ''}`} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...rest} />
      )}
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string> extends Common, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({ label, hint, error, options, value, onChange, ...rest }: SelectFieldProps<T>) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {(id, describedBy) => (
        <select id={id} className="input" value={value} aria-describedby={describedBy} onChange={(e) => onChange(e.target.value as T)} {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FieldShell>
  );
}

export function Checkbox({ label, checked, onChange, disabled }: { label: ReactNode; checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`checkbox${disabled ? ' checkbox--disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
