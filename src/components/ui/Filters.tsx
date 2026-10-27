/**
 * Reusable Filters component for applying multiple filter criteria
 */

import { useState, useCallback } from 'react';
import { ChevronDown, X, Filter } from 'lucide-react';
import { Button } from './Button';
import { Input, Select } from './Input';

export interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'select' | 'date-range' | 'price-range' | 'search';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface AppliedFilters {
  [key: string]: string | string[] | { from: string; to: string } | { min: number; max: number };
}

interface FiltersProps {
  filterGroups: FilterGroup[];
  appliedFilters: AppliedFilters;
  onFilterChange: (filters: AppliedFilters) => void;
  onClearAll?: () => void;
}

export function Filters({
  filterGroups,
  appliedFilters,
  onFilterChange,
  onClearAll
}: FiltersProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [localFilters, setLocalFilters] = useState<AppliedFilters>(appliedFilters);

  const toggleGroup = useCallback((id: string) => {
    setExpandedGroups(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  }, []);

  const handleFilterChange = useCallback((groupId: string, value: any) => {
    const updated = { ...localFilters, [groupId]: value };
    if (!value || (Array.isArray(value) && value.length === 0)) {
      delete updated[groupId];
    }
    setLocalFilters(updated);
    onFilterChange(updated);
  }, [localFilters, onFilterChange]);

  const handleClearAll = useCallback(() => {
    setLocalFilters({});
    onFilterChange({});
    onClearAll?.();
  }, [onFilterChange, onClearAll]);

  const activeFilterCount = Object.values(localFilters).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return true;
    return Boolean(v);
  }).length;

  return (
    <div className="space-y-4">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-neutral-600" />
          <span className="font-semibold text-neutral-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="space-y-2">
        {filterGroups.map(group => (
          <div key={group.id} className="border border-neutral-200 rounded-lg">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between p-3 hover:bg-neutral-50 transition-colors"
            >
              <span className="font-medium text-neutral-900">{group.label}</span>
              <ChevronDown
                size={18}
                className={`text-neutral-400 transition-transform ${
                  expandedGroups.has(group.id) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Group Content */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-neutral-200 p-3 space-y-2 bg-neutral-50">
                {group.type === 'checkbox' && (
                  <div className="space-y-2">
                    {group.options?.map(option => (
                      <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(localFilters[group.id])
                              ? (localFilters[group.id] as string[]).includes(option.value)
                              : false
                          }
                          onChange={(e) => {
                            const current = Array.isArray(localFilters[group.id])
                              ? (localFilters[group.id] as string[])
                              : [];
                            const updated = e.target.checked
                              ? [...current, option.value]
                              : current.filter(v => v !== option.value);
                            handleFilterChange(group.id, updated);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-neutral-700">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="text-xs text-neutral-500 ml-auto">({option.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {group.type === 'select' && (
                  <Select
                    value={String(localFilters[group.id] ?? '')}
                    onChange={(e) => handleFilterChange(group.id, e.target.value)}
                  >
                    <option value="">All</option>
                    {group.options?.map(option => (
                      <option key={option.id} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                )}

                {group.type === 'search' && (
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={String(localFilters[group.id] ?? '')}
                    onChange={(e) => handleFilterChange(group.id, e.target.value)}
                  />
                )}

                {group.type === 'price-range' && (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      min={group.min}
                      max={group.max}
                      value={
                        typeof localFilters[group.id] === 'object' &&
                        'min' in (localFilters[group.id] as any)
                          ? (localFilters[group.id] as any).min
                          : ''
                      }
                      onChange={(e) => {
                        const current =
                          typeof localFilters[group.id] === 'object' &&
                          'min' in (localFilters[group.id] as any)
                            ? (localFilters[group.id] as any)
                            : { min: 0, max: group.max ?? 10000 };
                        handleFilterChange(group.id, {
                          ...current,
                          min: Number(e.target.value) || 0
                        });
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      min={group.min}
                      max={group.max}
                      value={
                        typeof localFilters[group.id] === 'object' &&
                        'max' in (localFilters[group.id] as any)
                          ? (localFilters[group.id] as any).max
                          : ''
                      }
                      onChange={(e) => {
                        const current =
                          typeof localFilters[group.id] === 'object' &&
                          'max' in (localFilters[group.id] as any)
                            ? (localFilters[group.id] as any)
                            : { min: 0, max: group.max ?? 10000 };
                        handleFilterChange(group.id, {
                          ...current,
                          max: Number(e.target.value) || group.max || 10000
                        });
                      }}
                    />
                  </div>
                )}

                {group.type === 'date-range' && (
                  <div className="space-y-2">
                    <Input
                      type="date"
                      value={
                        typeof localFilters[group.id] === 'object' &&
                        'from' in (localFilters[group.id] as any)
                          ? (localFilters[group.id] as any).from
                          : ''
                      }
                      onChange={(e) => {
                        const current =
                          typeof localFilters[group.id] === 'object' &&
                          'from' in (localFilters[group.id] as any)
                            ? (localFilters[group.id] as any)
                            : { from: '', to: '' };
                        handleFilterChange(group.id, {
                          ...current,
                          from: e.target.value
                        });
                      }}
                    />
                    <Input
                      type="date"
                      value={
                        typeof localFilters[group.id] === 'object' &&
                        'to' in (localFilters[group.id] as any)
                          ? (localFilters[group.id] as any).to
                          : ''
                      }
                      onChange={(e) => {
                        const current =
                          typeof localFilters[group.id] === 'object' &&
                          'to' in (localFilters[group.id] as any)
                            ? (localFilters[group.id] as any)
                            : { from: '', to: '' };
                        handleFilterChange(group.id, {
                          ...current,
                          to: e.target.value
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
