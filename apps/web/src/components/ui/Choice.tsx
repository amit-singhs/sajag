import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface ChoiceButtonProps {
  kind: 'radio' | 'checkbox';
  selected: boolean;
  onSelect: () => void;
  letter?: string;
  children: ReactNode;
  tone?: 'default' | 'correct' | 'wrong';
  disabled?: boolean;
}

/** Large tappable option used by quiz answers, age selection and the builder preview. */
export function ChoiceButton({ kind, selected, onSelect, letter, children, tone = 'default', disabled }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      role={kind}
      aria-checked={selected}
      disabled={disabled}
      className={`choice choice--${kind}${selected ? ' is-selected' : ''} choice--${tone}`}
      onClick={onSelect}
    >
      <span className="choice__mark" aria-hidden="true">
        {kind === 'checkbox' ? <Icon name="check" size={14} strokeWidth={3} /> : letter}
      </span>
      <span className="choice__text">{children}</span>
    </button>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

/** Pill group behaving as a single-select radio group. */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="chips">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          className={`chip${o.value === value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
