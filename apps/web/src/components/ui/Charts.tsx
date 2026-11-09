import type { ReactNode } from 'react';

export function Stat({ label, value, unit, note }: { label: string; value: ReactNode; unit?: string; note?: ReactNode }) {
  return (
    <div className="card stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {value}
        {unit && <span className="stat__unit"> {unit}</span>}
      </span>
      {note && <span className="stat__note">{note}</span>}
    </div>
  );
}

export interface Bar {
  key: string;
  value: number;
  tone?: 'base' | 'hot' | 'soft';
  tip: string;
}

/** Column chart drawn with CSS — light, accessible via a text summary. */
export function ColumnChart({ bars, label, axis }: { bars: readonly Bar[]; label: string; axis?: ReactNode }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  return (
    <figure className="chart">
      <div className="chart__columns" role="img" aria-label={label}>
        {bars.map((b) => (
          <div key={b.key} className={`chart__col chart__col--${b.tone ?? 'base'}`} style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }} title={b.tip} />
        ))}
      </div>
      {axis && <figcaption className="chart__axis">{axis}</figcaption>}
    </figure>
  );
}

export function MeterRow({ label, sub, percent, hot }: { label: ReactNode; sub?: string; percent: number; hot?: boolean }) {
  return (
    <div className="meter-row">
      <span className="meter-row__label">{label}</span>
      <span className="meter-row__sub">{sub}</span>
      <span className="meter" aria-hidden="true">
        <span className={`meter__fill${hot ? ' is-hot' : ''}`} style={{ width: `${percent}%` }} />
      </span>
      <span className="meter-row__value">{percent}%</span>
    </div>
  );
}

export function Legend({ items }: { items: ReadonlyArray<{ tone: 'base' | 'hot' | 'soft'; label: string }> }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label} className="legend__item">
          <span className={`legend__swatch legend__swatch--${i.tone}`} />
          {i.label}
        </span>
      ))}
    </div>
  );
}
