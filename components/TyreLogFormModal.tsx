import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { generateId } from '../utils/idGenerator';
import type { TyreLog, Vehicle } from '../types';
import { XMarkIcon, SearchIcon } from './Icons';

import { formatDate, formatTime } from '../utils/formatters';

interface TyreLogFormModalProps {
  onClose: () => void;
  onSave: (tyreLog: Omit<TyreLog, 'id'>) => Promise<void>;
}

export const TyreLogFormModal: React.FC<TyreLogFormModalProps> = ({ onClose, onSave }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { vehicles, locations, workshops } = useData();
  
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [mileage, setMileage] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [workshopLocation, setWorkshopLocation] = useState('Puncture WorkShop');
  const [mechanicName, setMechanicName] = useState('');
  
  const [tyreType, setTyreType] = useState('');
  const [customTyreType, setCustomTyreType] = useState('');
  const [showCustomTyreType, setShowCustomTyreType] = useState(false);

  const [tyreSize, setTyreSize] = useState('');
  const [tyreSizeSearch, setTyreSizeSearch] = useState('');
  const [isTyreSizeDropdownOpen, setIsTyreSizeDropdownOpen] = useState(false);
  const [customTyreSize, setCustomTyreSize] = useState('');
  const [showCustomTyreSize, setShowCustomTyreSize] = useState(false);

  const [serialNumber, setSerialNumber] = useState('');
  
  const [fromVehicleId, setFromVehicleId] = useState('');
  const [fromVehicleSearch, setFromVehicleSearch] = useState('');
  const [isFromVehicleDropdownOpen, setIsFromVehicleDropdownOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Update mechanic name when workshop changes
  useEffect(() => {
    const workshop = workshops.find(w => w.subName === workshopLocation);
    if (workshop) {
      setMechanicName(workshop.mechanic || workshop.foreman || '');
    } else {
      setMechanicName('');
    }
  }, [workshopLocation, workshops]);

  // Set initial mechanic name if default workshop exists
  useEffect(() => {
    const workshop = workshops.find(w => w.subName === 'Puncture WorkShop');
    if (workshop) {
      setMechanicName(workshop.mechanic || workshop.foreman || '');
    }
  }, [workshops]);

  // Filtered vehicles for search
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch) return vehicles;
    const query = vehicleSearch.toLowerCase();
    return vehicles.filter(v => 
      String(v.vehicleNumber || '').toLowerCase().includes(query) || 
      String(v.vehicleCompanyNumber || '').toLowerCase().includes(query)
    );
  }, [vehicles, vehicleSearch]);

  const filteredFromVehicles = useMemo(() => {
    if (!fromVehicleSearch) return vehicles;
    const query = fromVehicleSearch.toLowerCase();
    return vehicles.filter(v => 
      String(v.vehicleNumber || '').toLowerCase().includes(query) || 
      String(v.vehicleCompanyNumber || '').toLowerCase().includes(query)
    );
  }, [vehicles, fromVehicleSearch]);

  // Filtered locations (Show all locations)
  const filteredLocations = useMemo(() => {
    return locations;
  }, [locations]);

  const tyreSizeOptions = ['385', '315', '24'];

  const filteredTyreSizes = useMemo(() => {
    if (!tyreSizeSearch) return tyreSizeOptions;
    const query = tyreSizeSearch.toLowerCase();
    return tyreSizeOptions.filter(s => s.toLowerCase().includes(query));
  }, [tyreSizeSearch]);

  const getVehicleDisplayName = (v: Vehicle) => {
    return `${t(v.vehiclesType)} ${v.vehicleCompanyNumber ? `${v.vehicleCompanyNumber}-` : ''}${v.vehicleNumber}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
        alert(t('alert_selectVehicle'));
        return;
    }
    
    setIsSaving(true);
    try {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const fromVehicle = vehicles.find(v => v.id === fromVehicleId);
        
        const finalTyreType = tyreType === 'addNew' ? customTyreType : tyreType;
        const finalTyreSize = tyreSize === 'addNew' ? customTyreSize : tyreSize;

        const tyreLog: Omit<TyreLog, 'id'> = {
            vehicleId,
            vehicleNumber: vehicle?.vehicleNumber || '',
            date: formatDate(date),
            time: formatTime(time),
            mileage,
            driverName: requesterName,
            workshopLocation,
            tyreDetails: [{
                id: generateId(),
                condition: finalTyreType, // Mapping tyreType to condition for now as it seems to be used that way
                size: finalTyreSize,
                serialNumber,
                fromVehicle: fromVehicle ? getVehicleDisplayName(fromVehicle) : '',
                fromVehicleId: fromVehicleId
            }],
            mechanicName: mechanicName
        };
        await onSave(tyreLog);
        onClose();
    } catch (error) {
        console.error('Failed to create tyre log:', error);
        alert('Failed to create tyre log.');
    } finally {
        setIsSaving(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const selectedFromVehicle = vehicles.find(v => v.id === fromVehicleId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{t('addNewTyreLog')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Row 1: Vehicle & Serial Number */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicle')}</label>
              <div 
                className="w-full p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center bg-white"
                onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
              >
                <span className={vehicleId ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedVehicle ? getVehicleDisplayName(selectedVehicle) : t('selectVehicle')}
                </span>
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              
              {isVehicleDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      placeholder={t('search')}
                      value={vehicleSearch}
                      onChange={(e) => setVehicleSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {filteredVehicles.map(v => (
                    <div
                      key={v.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setVehicleId(v.id);
                        setIsVehicleDropdownOpen(false);
                        setVehicleSearch('');
                      }}
                    >
                      {getVehicleDisplayName(v)}
                    </div>
                  ))}
                  {filteredVehicles.length === 0 && (
                    <div className="p-2 text-sm text-gray-500 text-center">{t('noVehicleFound')}</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('serialNumber')}</label>
              <input 
                type="text" 
                value={serialNumber} 
                onChange={(e) => setSerialNumber(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                placeholder={t('serialNumber')}
                required
              />
            </div>

            {/* Row 2: Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('time')}</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>

            {/* Row 3: Mileage & Driver Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('mileage')}</label>
              <input type="text" value={mileage} onChange={(e) => setMileage(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('requester')}</label>
              <input type="text" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" required />
            </div>

            {/* Row 4: Workshop Location & Mechanic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('workshopLocation')}</label>
              <select
                value={workshopLocation}
                onChange={(e) => setWorkshopLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">{t('selectLocation')}</option>
                {filteredLocations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('mechanicName')}</label>
              <input 
                type="text" 
                value={mechanicName} 
                onChange={(e) => setMechanicName(e.target.value)} 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500" 
                placeholder={t('mechanicName')}
              />
            </div>

            {/* Row 5: Tyre Type & Tyre Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tyreType')}</label>
              <select
                value={tyreType}
                onChange={(e) => {
                  setTyreType(e.target.value);
                  setShowCustomTyreType(e.target.value === 'addNew');
                }}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              >
                <option value="">{t('selectTyreType')}</option>
                <option value="NEW">{t('tyreType_NEW')}</option>
                <option value="Used">{t('tyreType_Used')}</option>
                <option value="Repaired">{t('tyreType_Repaired')}</option>
                <option value="addNew">{t('addNew')}</option>
              </select>
              {showCustomTyreType && (
                <input
                  type="text"
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                  placeholder={t('newTyreType')}
                  value={customTyreType}
                  onChange={(e) => setCustomTyreType(e.target.value)}
                  required
                />
              )}
            </div>

            {/* Row 5: Tyre Size & From Vehicle (Conditional) */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('tyreSize')}</label>
              <div 
                className="w-full p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center bg-white"
                onClick={() => setIsTyreSizeDropdownOpen(!isTyreSizeDropdownOpen)}
              >
                <span className={tyreSize ? 'text-gray-900' : 'text-gray-400'}>
                  {tyreSize === 'addNew' ? customTyreSize || t('newTyreSize') : tyreSize || t('selectTyreSize')}
                </span>
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              
              {isTyreSizeDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 sticky top-0 bg-white border-b">
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      placeholder={t('search')}
                      value={tyreSizeSearch}
                      onChange={(e) => setTyreSizeSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {filteredTyreSizes.map(size => (
                    <div
                      key={size}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => {
                        setTyreSize(size);
                        setShowCustomTyreSize(false);
                        setIsTyreSizeDropdownOpen(false);
                        setTyreSizeSearch('');
                      }}
                    >
                      {size}
                    </div>
                  ))}
                  <div
                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm font-medium text-green-600 border-t"
                    onClick={() => {
                      setTyreSize('addNew');
                      setShowCustomTyreSize(true);
                      setIsTyreSizeDropdownOpen(false);
                    }}
                  >
                    + {t('addNew')}
                  </div>
                </div>
              )}
              {showCustomTyreSize && (
                <input
                  type="text"
                  className="mt-2 w-full p-2 border border-gray-300 rounded-md"
                  placeholder={t('newTyreSize')}
                  value={customTyreSize}
                  onChange={(e) => setCustomTyreSize(e.target.value)}
                  required
                />
              )}
            </div>

            {tyreType === 'Used' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('fromVehicle')}</label>
                <div 
                  className="w-full p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center bg-white"
                  onClick={() => setIsFromVehicleDropdownOpen(!isFromVehicleDropdownOpen)}
                >
                  <span className={fromVehicleId ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedFromVehicle ? getVehicleDisplayName(selectedFromVehicle) : t('selectFromVehicle')}
                  </span>
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                
                {isFromVehicleDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-200 rounded-md text-sm"
                        placeholder={t('search')}
                        value={fromVehicleSearch}
                        onChange={(e) => setFromVehicleSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    {filteredFromVehicles.map(v => (
                      <div
                        key={v.id}
                        className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setFromVehicleId(v.id);
                          setIsFromVehicleDropdownOpen(false);
                          setFromVehicleSearch('');
                        }}
                      >
                        {getVehicleDisplayName(v)}
                      </div>
                    ))}
                    {filteredFromVehicles.length === 0 && (
                      <div className="p-2 text-sm text-gray-500 text-center">{t('noVehicleFound')}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>


          <div className="flex space-x-3 pt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
