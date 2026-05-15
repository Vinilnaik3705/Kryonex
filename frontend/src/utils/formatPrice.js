export function formatPrice(price) {
    const n = Number.parseFloat(price);

    if (!Number.isFinite(n) || n === 0) return '$0';
    if (n >= 1000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 1) return `$${n.toFixed(4)}`;
    if (n >= 0.01) return `$${n.toFixed(5)}`;
    if (n >= 0.0001) return `$${n.toFixed(6)}`;

    return `$${n.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')}`;
}