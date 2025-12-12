import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable search input component
 * 
 * Features:
 * - Search on Enter key press or search button click
 * - Clear button when input has text
 * - Search icon indicator
 * - Customizable placeholder
 * - Mobile-friendly with dedicated search button
 */
export function SearchInput({
  value,
  onChange,
  placeholder = '検索...',
  onSearch,
  className = '',
  disabled = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(internalValue);
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch(internalValue);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    onChange('');
    // Don't trigger search on clear - user needs to press Enter or click search button
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9"
          disabled={disabled}
        />
        {internalValue && !disabled && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Button
        onClick={handleSearchClick}
        variant="default"
        className="flex-shrink-0"
        type="button"
        disabled={disabled}
      >
        <Search className="w-4 h-4 mr-2" />
        検索
      </Button>
    </div>
  );
}
