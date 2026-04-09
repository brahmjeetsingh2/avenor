import { useState, useEffect, useCallback, useRef } from 'react';
import searchService from '../services/searchService';

const RECENT_KEY  = 'avenor-recent-searches';
const MAX_RECENT  = 6;

export const useRecentSearches = () => {
  const get = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
  const add = (q) => {
    if (!q?.trim()) return;
    const prev    = get().filter(s => s !== q);
    const updated = [q, ...prev].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };
  const clear = () => localStorage.removeItem(RECENT_KEY);
  return { get, add, clear };
};

const useSearch = (debounceMs = 300) => {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState({ companies: [], roles: [] });
  const [loading,     setLoading]     = useState(false);
  const timerRef = useRef(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 2) { setSuggestions({ companies: [], roles: [] }); return; }
    setLoading(true);
    try {
      const res = await searchService.suggestions(q);
      setSuggestions(res.data);
    } catch {
      setSuggestions({ companies: [], roles: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(query), debounceMs);
    return () => clearTimeout(timerRef.current);
  }, [query, debounceMs, fetchSuggestions]);

  const clearSuggestions = () => setSuggestions({ companies: [], roles: [] });

  return { query, setQuery, suggestions, loading, clearSuggestions };
};

export default useSearch;
