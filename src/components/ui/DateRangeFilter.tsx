import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from './Button';

export type DateRangePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | null) => void;
  onPresetChange?: (preset: DateRangePreset) => void;
}

export function DateRangeFilter({ onDateRangeChange, onPresetChange }: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const getDateRange = (preset: DateRangePreset): DateRange | null => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    switch (preset) {
      case 'today':
        return {
          startDate: startOfDay(now),
          endDate: now,
        };
      case 'week': {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay());
        return {
          startDate: startOfDay(start),
          endDate: now,
        };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: startOfDay(start),
          endDate: now,
        };
      }
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), quarter * 3, 1);
        return {
          startDate: startOfDay(start),
          endDate: now,
        };
      }
      case 'year': {
        const start = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: startOfDay(start),
          endDate: now,
        };
      }
      case 'all':
        return null;
      case 'custom':
        return null;
      default:
        return null;
    }
  };

  const handlePresetClick = (preset: DateRangePreset) => {
    setSelectedPreset(preset);
    setShowCustom(preset === 'custom');
    
    if (preset !== 'custom') {
      const range = getDateRange(preset);
      onDateRangeChange(range);
      onPresetChange?.(preset);
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      
      if (start <= end) {
        onDateRangeChange({ startDate: start, endDate: end });
        onPresetChange?.('custom');
        setShowCustom(false);
      }
    }
  };

  const handleClear = () => {
    setSelectedPreset('all');
    setCustomStart('');
    setCustomEnd('');
    setShowCustom(false);
    onDateRangeChange(null);
    onPresetChange?.('all');
  };

  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handlePresetClick(preset.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedPreset === preset.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={() => {
            setSelectedPreset('custom');
            setShowCustom(true);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
            selectedPreset === 'custom'
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <Calendar size={14} /> Custom
        </button>
      </div>

      {/* Custom date picker */}
      {showCustom && (
        <div className="bg-neutral-50 rounded-xl p-4 space-y-3 border border-neutral-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1.5 block">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleCustomApply}
              disabled={!customStart || !customEnd}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCustom(false);
                setSelectedPreset('all');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Clear button - only show if not "all time" */}
      {selectedPreset !== 'all' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2"
          onClick={handleClear}
        >
          <X size={14} /> Clear Filters
        </Button>
      )}
    </div>
  );
}
