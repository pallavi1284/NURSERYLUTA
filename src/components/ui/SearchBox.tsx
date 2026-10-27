/**
 * Reusable Search component with debouncing
 */

import { useState, useCallback, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './Input';

interface SearchBoxProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  value?: string;
}

export function SearchBox({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  value: initialValue = ''
}: SearchBoxProps) {
  const [value, setValue] = useState(initialValue);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  const handleClear = useCallback(() => {
    setValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
