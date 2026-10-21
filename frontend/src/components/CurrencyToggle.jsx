import { useCurrency } from '../context/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const base = 'flex items-center gap-0.5 bg-hover border border-border rounded-xl p-0.5';
  const btn = (active) =>
    `rounded-lg transition-all font-bold ${
      active
        ? 'bg-brand-gradient text-white shadow-glow-soft'
        : 'text-text-muted hover:text-text-main'
    }`;

  return (
    <div className={base}>
      <button
        onClick={() => setCurrency('USD')}
        className={btn(currency === 'USD')}
        style={{ padding: '5px clamp(8px, 2vw, 14px)', fontSize: 'clamp(10px, 2.5vw, 13px)' }}
      >
        $ USD
      </button>
      <button
        onClick={() => setCurrency('INR')}
        className={btn(currency === 'INR')}
        style={{ padding: '5px clamp(8px, 2vw, 14px)', fontSize: 'clamp(10px, 2.5vw, 13px)' }}
      >
        ₹ INR
      </button>
    </div>
  );
}
