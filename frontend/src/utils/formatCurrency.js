/**
 * Shared currency formatter — instantiated once at module level so
 * Intl.NumberFormat construction cost is paid only on first import.
 */
const _formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/**
 * Format an amount as a USD currency string.
 * Absolute value is always used so negative amounts render without a minus sign.
 *
 * @param {number} amount
 * @returns {string}  e.g. "$1,234.56"
 */
export const formatCurrency = (amount) => _formatter.format(Math.abs(amount));

/**
 * Same as formatCurrency but preserves the sign (useful for net savings).
 *
 * @param {number} amount
 * @returns {string}  e.g. "-$1,234.56"
 */
export const formatCurrencySigned = (amount) => _formatter.format(amount);
