/**
 * Return up to 2 uppercase initials from a display name.
 *
 * @param {string} [name]
 * @returns {string}  e.g. 'JD' for 'Jane Doe', '?' for empty/undefined
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};
