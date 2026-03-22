/**
 * Compute a start/end date range from a named filter.
 *
 * @param {string} filter        - 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
 * @param {string} [customStart] - ISO date string when filter === 'custom'
 * @param {string} [customEnd]   - ISO date string when filter === 'custom'
 * @returns {{ startDate: string, endDate: string } | null}
 *   ISO date strings ('YYYY-MM-DD'), or null when filter === 'custom' and dates are not yet set.
 */
export function getDateRange(filter, customStart = '', customEnd = '') {
  const now = new Date();
  let startDate, endDate;

  switch (filter) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;

    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = new Date(now);
      break;

    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'quarter': {
      const qStart = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), qStart, 1);
      endDate   = new Date(now.getFullYear(), qStart + 3, 0);
      break;
    }

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate   = new Date(now.getFullYear(), 11, 31);
      break;

    case 'custom':
      if (customStart && customEnd) {
        startDate = new Date(customStart);
        endDate   = new Date(customEnd);
      } else {
        return null;
      }
      break;

    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate:   endDate.toISOString().split('T')[0],
  };
}
