export function formatAmount(value, currency) {
  const n = parseFloat(value);
  if (isNaN(n)) return currency === 'INR' ? '₹0' : '$0';

  const symbol = currency === 'INR' ? '₹' : '$';

  // Smart abbreviation thresholds
  if (currency === 'INR') {
    // Indian system: Crore > Lakh > Thousand
    if (n >= 1_00_00_00_000)   return symbol + (n / 1_00_00_00_000).toFixed(2) + 'B';   // 1B+
    if (n >= 1_00_00_000)      return symbol + (n / 1_00_00_000).toFixed(2) + 'Cr';     // 1Cr+
    if (n >= 1_00_000)         return symbol + (n / 1_00_000).toFixed(2) + 'L';         // 1L+
    if (n >= 1_000)            return symbol + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    if (n >= 1)                return symbol + n.toFixed(2);
    if (n >= 0.01)             return symbol + n.toFixed(5);
    if (n >= 0.0001)           return symbol + n.toFixed(6);
    return symbol + n.toFixed(10).replace(/0+$/, '');
  } else {
    // USD system
    if (n >= 1_000_000_000)    return symbol + (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000)        return symbol + (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000)            return symbol + n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1)                return symbol + n.toFixed(2);
    if (n >= 0.01)             return symbol + n.toFixed(5);
    if (n >= 0.0001)           return symbol + n.toFixed(6);
    return symbol + n.toFixed(10).replace(/0+$/, '');
  }
}
