import { IconAlert, IconCheck, IconInfo } from './icons';

const BUTTON_VARIANTS = {
  primary: 'bg-accent text-ink shadow-sm hover:brightness-95 disabled:bg-accent/40',
  secondary: 'border border-line bg-white text-ink hover:border-edge hover:bg-raised',
  ghost: 'text-ink-2 hover:bg-raised hover:text-ink',
  danger: 'border border-critical/30 text-critical hover:bg-critical/10',
};

const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-[15px]',
};

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all
        disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className = '', children, ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent text-ink">
            <Icon />
          </span>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold leading-tight text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </header>
  );
}

const BADGE_TONES = {
  neutral: 'border-line bg-raised text-ink-2',
  accent: 'border-transparent bg-[#FFD600] text-ink',
  good: 'border-good/35 bg-good/10 text-good',
  warning: 'border-transparent bg-[#FFD600] text-ink',
  critical: 'border-critical/40 bg-critical/10 text-critical',
};

export function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Field({ label, hint, error, required, children }) {
  return (
    <label className="block">
      <span className="label flex items-center gap-1.5">
        {label}
        {required ? <span className="text-accent">*</span> : null}
      </span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-[12px] text-critical">{error}</span>
      ) : hint ? (
        <span className="mt-1.5 block text-[12px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export const Input = ({ className = '', ...props }) => <input className={`input ${className}`} {...props} />;

export const Textarea = ({ className = '', rows = 4, ...props }) => (
  <textarea rows={rows} className={`input resize-y leading-relaxed ${className}`} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`input cursor-pointer appearance-none pr-8 ${className}`} {...props}>
    {children}
  </select>
);

export function StatTile({ label, value, caption, tone = 'neutral' }) {
  const valueTone = { neutral: 'text-ink', accent: 'text-accent', good: 'text-good', warning: 'text-warning' }[tone];
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3.5">
      <p className="label">{label}</p>
      <p className={`mt-1.5 text-[26px] font-semibold leading-none ${valueTone}`}>{value}</p>
      {caption ? <p className="mt-1.5 text-[12px] leading-snug text-muted">{caption}</p> : null}
    </div>
  );
}

const NOTE_TONES = {
  info: { wrap: 'border-line bg-raised text-ink-2', icon: 'text-muted', Icon: IconInfo },
  warning: { wrap: 'border-accent bg-accent text-ink', icon: 'text-ink', Icon: IconAlert },
  good: { wrap: 'border-good/30 bg-good/[0.07] text-ink-2', icon: 'text-good', Icon: IconCheck },
  critical: { wrap: 'border-critical/35 bg-critical/[0.07] text-ink-2', icon: 'text-critical', Icon: IconAlert },
};

/** Status is never carried by colour alone — every note ships with an icon. */
export function Note({ tone = 'info', title, children }) {
  const { wrap, icon, Icon } = NOTE_TONES[tone];
  return (
    <div className={`flex gap-3 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed ${wrap}`}>
      <Icon className={`mt-0.5 shrink-0 ${icon}`} />
      <div>
        {title ? <p className="font-semibold text-ink">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {Icon ? (
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-raised text-muted">
          <Icon width={22} height={22} />
        </span>
      ) : null}
      <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-2">{children}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      aria-hidden
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white ${className}`}
    />
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
              selected ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink-2'
            }`}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ml-2 rounded-full bg-raised px-1.5 py-0.5 text-[11px] text-ink-2 numeric">{tab.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
