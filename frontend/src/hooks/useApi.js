import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for executing async API functions with automatic state tracking.
 *
 * @param {Function} apiFunc - Async function returning a promise
 * @param {Array} deps - Dependency array to trigger refetch when changed (defaults to [])
 * @param {Object} options - Optional configuration { initialData, lazy, onSuccess, onError }
 * @returns {Object} { data, loading, error, refetch, setData }
 */
export function useApi(apiFunc, deps = [], options = {}) {
  const { initialData = null, lazy = false, onSuccess, onError } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!lazy);
  const [error, setError] = useState(null);

  // Track latest request counter to prevent race conditions
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  // Keep latest callbacks and function in refs to ensure execute/refetch identity stability
  const apiFuncRef = useRef(apiFunc);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  apiFuncRef.current = apiFunc;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const execute = useCallback(async (...args) => {
    const fn = apiFuncRef.current;
    if (!fn || typeof fn !== 'function') {
      return;
    }

    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const result = await fn(...args);

      // Only update state if this is the most recent request and still mounted
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        setData(result);
        setLoading(false);
        if (onSuccessRef.current) {
          onSuccessRef.current(result);
        }
      }
      return result;
    } catch (err) {
      if (isMountedRef.current && currentRequestId === requestIdRef.current) {
        const parsedError =
          err?.response?.data?.message || err?.message || 'An unexpected error occurred';
        setError(parsedError);
        setLoading(false);
        if (onErrorRef.current) {
          onErrorRef.current(err);
        }
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (!lazy) {
      execute().catch(() => {
        // Handled in execute catch block
      });
    }
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(
    (...args) => {
      return execute(...args);
    },
    [execute]
  );

  return {
    data,
    loading,
    error,
    refetch,
    setData,
  };
}

export default useApi;
