import React, { useState, useRef, useEffect } from 'react';
import type { Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SearchIcon, XMarkIcon } from './Icons';
import { formatVehicleInfo } from '../utils/formatters?v=3';

interface SearchableVehicleSelectProps {
  vehicles: Vehicle[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const SearchableVehicleSelect: React.FC<SearchableVehicleSelectProps> = ({
  vehicles,
  value,
  onChange,
  placeholder,
  label
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedVehicle = vehicles.find(v => v.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const info = formatVehicleInfo(v, t).toLowerCase();
    const query = searchQuery.toLowerCase();
    const serial = String(v.serialNumber || '').toLowerCase();
    return info.includes(query) || serial.includes(query);
  }).slice(0, 50);

  return (
    <div className="relative" ref={wrapperRef}>
      {label && <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>}
      <div 
        className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedVehicle ? 'text-gray-800' : 'text-gray-400'}>
          {selectedVehicle ? formatVehicleInfo(selectedVehicle, t) : (placeholder || t('selectVehicle'))}
        </span>
        {value && (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <input
                type="text"
                autoFocus
                className="w-full p-2 pl-8 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="py-1">
            {filteredVehicles.length > 0 ? (
              filteredVehicles.map(v => (
                <div
                  key={v.id}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-green-50 ${v.id === value ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'}`}
                  onClick={() => {
                    onChange(v.id);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <p>{formatVehicleInfo(v, t)}</p>
                  <p className="text-[10px] text-gray-400">{v.serialNumber}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 italic">{t('noVehicleFound')}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
