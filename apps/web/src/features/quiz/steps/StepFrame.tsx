import type { ReactNode } from 'react';

interface StepFrameProps {
  eyebrow: string;
  title: string;
  intro?: string;
  aside?: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/** Common layout for every quiz step: heading, body, sticky action bar on phones. */
export function StepFrame({ eyebrow, title, intro, aside, footer, children }: StepFrameProps) {
  return (
    <section className="step container narrow">
      <div className="step__head">
        <div className="stack-sm">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-2">{title}</h1>
          {intro && <p className="lead">{intro}</p>}
        </div>
        {aside}
      </div>
      <div className="step__body stack-lg">{children}</div>
      <div className="step__footer">{footer}</div>
    </section>
  );
}
