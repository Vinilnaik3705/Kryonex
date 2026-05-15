import { useCurrency } from '../context/CurrencyContext';

export default function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  return (
    <div className="flex items-center gap-0.5 bg-white/[0.04] border border-[rgba(255,255,255,0.06)] rounded-lg p-0.5 text-[11px] font-semibold">
      <button
        onClick={() => setCurrency('USD')}
        className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[10px] sm:text-[11px] ${
          currency === 'USD'
            ? 'bg-accent text-black font-bold shadow-[0_0_10px_rgba(56,189,248,0.25)]'
            : 'text-[rgba(255,255,255,0.35)] hover:text-white'
        }`}
        style={{ padding: '5px clamp(8px, 2vw, 14px)', fontSize: 'clamp(10px, 2.5vw, 13px)' }}
      >
        $ USD
      </button>
      <button
        onClick={() => setCurrency('INR')}
        className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[10px] sm:text-[11px] ${
          currency === 'INR'
            ? 'bg-accent text-black font-bold shadow-[0_0_10px_rgba(56,189,248,0.25)]'
            : 'text-[rgba(255,255,255,0.35)] hover:text-white'
        }`}
        style={{ padding: '5px clamp(8px, 2vw, 14px)', fontSize: 'clamp(10px, 2.5vw, 13px)' }}
      >
        ₹ INR
      </button>
    </div>
  );
}
