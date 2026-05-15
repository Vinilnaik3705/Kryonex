import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(
    () => localStorage.getItem('kryonex_currency') || 'USD'
  );
  const [usdToInr, setUsdToInr] = useState(83.5);  // fallback rate

  useEffect(() => {
    // Fetch live USD→INR rate
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(r => r.json())
      .then(data => setUsdToInr(data.rates.INR))
      .catch(() => setUsdToInr(83.5)); // fallback if API fails
  }, []);

  const convert = (usdValue) => {
    const val = parseFloat(usdValue);
    if (isNaN(val)) return 0;
    return currency === 'INR' ? val * usdToInr : val;
  };

  const handleSetCurrency = (c) => {
    setCurrency(c);
    localStorage.setItem('kryonex_currency', c);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, convert, usdToInr }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
