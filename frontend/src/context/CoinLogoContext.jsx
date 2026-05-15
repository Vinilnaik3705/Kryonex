import { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import axios from 'axios';

const CoinLogoContext = createContext({});

const MANUAL_OVERRIDES = {
  DOGS: 'https://assets.coingecko.com/coins/images/34897/thumb/DOGS.jpg',
  PUMP: 'https://assets.coingecko.com/coins/images/39700/thumb/pump.png',
  // add more here as discovered
};

export function CoinLogoProvider({ children }) {
  const [logos, setLogos] = useState({});

  useEffect(() => {
    // Check localStorage cache first (avoid re-fetching on every page load)
    const cached = localStorage.getItem('tradesim_coin_logos');
    const cachedTime = localStorage.getItem('tradesim_coin_logos_time');
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < SIX_HOURS) {
      const parsed = JSON.parse(cached);
      setLogos({ ...parsed, ...MANUAL_OVERRIDES });
      return;
    }

    axios.get(`${API_BASE_URL}/coin-logos`)
      .then(r => r.data)
      .then(data => {
        setLogos({ ...data, ...MANUAL_OVERRIDES });
        localStorage.setItem('tradesim_coin_logos', JSON.stringify(data));
        localStorage.setItem('tradesim_coin_logos_time', Date.now().toString());
      })
      .catch(console.error);
  }, []);

  return (
    <CoinLogoContext.Provider value={logos}>
      {children}
    </CoinLogoContext.Provider>
  );
}

export const useCoinLogos = () => useContext(CoinLogoContext);
