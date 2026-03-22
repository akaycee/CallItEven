import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Manages error/success notification state with automatic success dismissal.
 *
 * Replaces the per-page boilerplate of:
 *   const [error, setError]     = useState('');
 *   const [success, setSuccess] = useState('');
 *   const timeoutRefs           = useRef([]);
 *   useEffect(() => () => timeoutRefs.current.forEach(clearTimeout), []);
 *
 * @param {number} [duration=3000] - ms before success message auto-clears
 * @returns {{ error, setError, success, setSuccess, showSuccess }}
 */
export function useNotification(duration = 3000) {
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const timeoutRefs           = useRef([]);

  useEffect(() => {
    const refs = timeoutRefs.current;
    return () => refs.forEach(clearTimeout);
  }, []);

  /** Set a success message and auto-clear it after `duration` ms. */
  const showSuccess = useCallback((message) => {
    setSuccess(message);
    const id = setTimeout(() => setSuccess(''), duration);
    timeoutRefs.current.push(id);
  }, [duration]);

  return { error, setError, success, setSuccess, showSuccess };
}
