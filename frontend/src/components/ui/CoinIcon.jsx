import { useState } from 'react';
import { useCoinLogos } from '../../context/CoinLogoContext';

const COIN_COLORS = {
  BTC:'#f7931a', ETH:'#627eea', BNB:'#f0b90b', SOL:'#9945ff',
  XRP:'#00aae4', DOGE:'#c2a633', PEPE:'#22c55e', SHIB:'#e84142',
  BONK:'#f97316', FLOKI:'#e4a20c', DOGS:'#3b82f6', LUNC:'#f4bc2f',
  TON:'#0098ea', SUI:'#4da2ff', INJ:'#00c2ff', AVAX:'#e84142',
  LINK:'#2a5ada', DOT:'#e6007a', UNI:'#ff007a', LTC:'#bfbbbb',
  TRX:'#ff0013', ZEC:'#f4b728', ICP:'#29abe2', TAO:'#00d4aa',
  PUMP:'#a855f7', ADA:'#0033ad', MATIC:'#8247e5', ATOM:'#2e3148',
};

export default function CoinIcon({ symbol, size = 32 }) {
  const logos = useCoinLogos();
  const clean = symbol?.toUpperCase().split('/')[0].replace('USDT','').replace('BUSD','').replace('USD','');
  const bg = COIN_COLORS[clean] || '#38BDF8';
  const radius = Math.round(size * 0.28);

  const geckoUrl = logos[clean]; // from CoinGecko via your backend
  const jsdelivrUrl = `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${clean?.toLowerCase()}.png`;
  const coincapUrl = `https://assets.coincap.io/assets/icons/${clean?.toLowerCase()}@2x.png`;

  const [triedFallback1, setTriedFallback1] = useState(false);
  const [triedFallback2, setTriedFallback2] = useState(false);
  const [failed, setFailed] = useState(false);

  // Pick best available URL
  const initialSrc = geckoUrl || jsdelivrUrl;

  const handleError = (e) => {
    if (!triedFallback1 && e.currentTarget.src !== coincapUrl) {
      setTriedFallback1(true);
      e.currentTarget.src = coincapUrl;
    } else if (!triedFallback2) {
      setTriedFallback2(true);
      e.currentTarget.src = jsdelivrUrl;
    } else {
      setFailed(true);
    }
  };

  if (failed || !initialSrc) {
    return (
      <div style={{
        width: size, height: size, borderRadius: radius,
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.34,
        fontWeight: 800, color: '#fff', flexShrink: 0,
        fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
      }}>
        {clean?.[0]}
      </div>
    );
  }

  return (
    <img
      src={initialSrc}
      alt={clean}
      onError={handleError}
      style={{
        width: size, height: size, borderRadius: radius,
        objectFit: 'contain', flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        padding: size * 0.06,
      }}
    />
  );
}
