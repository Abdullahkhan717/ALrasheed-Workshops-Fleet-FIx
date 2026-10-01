import React, { useState } from 'react';
import type { OilLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { XMarkIcon, TruckIcon } from './Icons';
import { formatDateForSheet, parseDate } from '../utils/formatters';
import { SearchableVehicleSelect } from './SearchableVehicleSelect';

interface EditOilLogModalProps {
  log: OilLog;
  onClose: () => void;
  onSuccess?: (updatedLog: OilLog) => void;
}

export const EditOilLogModal: React.FC<EditOilLogModalProps> = ({ log, onClose, onSuccess }) => {
  const { t, language } = useTranslation();
  const { vehicles, locations: dbLocations, updateData } = useData();

  // Helper to extract YYYY-MM-DD from various date formats
  const getInitialDate = (dateStr: any): string => {
    const d = parseDate(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return new Date().toISOString().split('T')[0];
  };

  // Helper to extract HH:MM from time or date
  const getInitialTime = (timeStr: any, dateStr: any): string => {
    if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
      const match = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
      }
    }
    const d = parseDate(dateStr);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '12:00';
  };

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(log.vehicleId || '');
  const [driverName, setDriverName] = useState<string>(log.driverName || '');
  const [mileage, setMileage] = useState<string>(String(log.mileage || ''));
  const [location, setLocation] = useState<string>(log.location || '');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [showCustomLocation, setShowCustomLocation] = useState<boolean>(false);
  const [customDate, setCustomDate] = useState<string>(getInitialDate(log.date));
  const [customTime, setCustomTime] = useState<string>(getInitialTime(log.time, log.date));
  const [oilTypes, setOilTypes] = useState<string[]>(Array.isArray(log.oilTypes) ? log.oilTypes : []);
  const [customOil, setCustomOil] = useState<string>('');
  const [filters, setFilters] = useState<string[]>(Array.isArray(log.filters) ? log.filters : []);
  const [customFilter, setCustomFilter] = useState<string>('');
  const [remarks, setRemarks] = useState<string>(log.remarks || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const oilTypeOptions = [
    { id: 'engineOil', label: t('oilLog_engineOil') },
    { id: 'gearOil', label: t('oilLog_gearOil') },
    { id: 'deffranceOil', label: t('oilLog_deffranceOil') },
    { id: 'greasing', label: t('oilLog_greasing') },
    { id: 'noOilChange', label: t('oilLog_noOilChange') },
    { id: 'noOil', label: t('oilLog_noOil') },
    { id: 'other', label: t('oilLog_addNew') }
  ];

  const filterOptions = [
    { id: 'airFilter', label: t('oilLog_airFilter') },
    { id: 'dieselFilter', label: t('oilLog_dieselFilter') },
    { id: 'oilFilter', label: t('oilLog_oilFilter') },
    { id: 'gearOilFilter', label: t('oilLog_gearOilFilter') },
    { id: 'hydraulicFilter', label: t('oilLog_hydraulicFilter') },
    { id: 'other', label: t('oilLog_addNew') }
  ];

  const handleToggleOilType = (id: string) => {
    setOilTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleToggleFilter = (id: string) => {
    setFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleLocationChange = (val: string) => {
    if (val === 'addNew') {
      setShowCustomLocation(true);
      setLocation('');
    } else {
      setShowCustomLocation(false);
      setLocation(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = showCustomLocation ? customLocation.trim() : location.trim();
    if (!selectedVehicleId || !driverName.trim() || !mileage.trim() || !finalLocation || !customDate) {
      alert(t('alert_fillAllFields') || 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    try {
      const dateObj = new Date(`${customDate}T${customTime || '12:00'}`);
      const finalOilTypes = oilTypes.map(t => t === 'other' ? customOil.trim() : t).filter(Boolean);
      const finalFilters = filters.map(f => f === 'other' ? customFilter.trim() : f).filter(Boolean);

      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      const truckId = vehicle ? (vehicle.vehicleCompanyNumber || vehicle.vehicleNumber) : selectedVehicleId;

      const updatedLog: OilLog = {
        ...log,
        vehicleId: selectedVehicleId,
        driverName: driverName.trim(),
        mileage: mileage.trim(),
        location: finalLocation,
        oilTypes: finalOilTypes,
        filters: finalFilters,
        remarks: remarks.trim(),
        date: dateObj.toISOString(),
        time: dateObj.toISOString()
      };

      const payload = {
        id: log.id,
        vehicleId: selectedVehicleId,
        VehicleId: selectedVehicleId,
        'Vehicle ID': selectedVehicleId,
        'Truck ID': truckId,
        truckId: truckId,
        TruckID: truckId,
        vehicleNumber: vehicle?.vehicleNumber || '',
        driverName: updatedLog.driverName,
        mileage: updatedLog.mileage,
        location: updatedLog.location,
        oilTypes: JSON.stringify(updatedLog.oilTypes),
        filters: JSON.stringify(updatedLog.filters),
        remarks: updatedLog.remarks || '',
        date: formatDateForSheet(dateObj),
        time: dateObj.toLocaleTimeString()
      };

      await updateData('OilLogs', payload);

      if (onSuccess) {
        onSuccess(updatedLog);
      }
      onClose();
    } catch (error) {
      console.error('Failed to update oil log:', error);
      alert('Failed to update oil log. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-4 md:p-6 bg-emerald-700 text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-6 w-6 text-emerald-200" />
            <div>
              <h2 className="text-lg md:text-xl font-bold">{t('editOilLog') || 'Edit Oil Entry'}</h2>
              <p className="text-xs text-emerald-100">ID: #{log.id}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-emerald-600 transition"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Vehicle Select */}
          <div>
            <SearchableVehicleSelect
              vehicles={vehicles}
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              label={t('vehicle') + ' *'}
              placeholder={t('selectVehicle')}
            />
          </div>

          {/* Driver Name & Mileage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t('driver')} *
              </label>
              <input
                type="text"
                value={driverName}
                onChange={e => setDriverName(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder={t('enterDriverName') || 'Driver Name'}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t('currentOdometer') || 'Current Odometer (KM)'} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={mileage}
                  onChange={e => setMileage(e.target.value)}
                  required
                  className="w-full p-2.5 pr-12 border border-gray-300 rounded-lg text-sm font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 790493"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">KM</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t('location')} *
            </label>
            {!showCustomLocation ? (
              <div className="flex gap-2">
                <select
                  value={location}
                  onChange={e => handleLocationChange(e.target.value)}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">{t('selectLocation')}</option>
                  {location && !dbLocations.some(l => l.name === location) && (
                    <option value={location}>{location}</option>
                  )}
                  {dbLocations.map(loc => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} {loc.hasWorkshop ? `(${t('workshop') || 'Workshop'})` : ''}
                    </option>
                  ))}
                  <option value="addNew">+ {t('oilLog_addNew') || 'Add New Location'}</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLocation}
                  onChange={e => setCustomLocation(e.target.value)}
                  placeholder={t('enterCustomLocation') || 'Enter Location'}
                  required
                  className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomLocation(false)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-gray-50 hover:bg-gray-100 text-gray-600"
                >
                  {t('cancel')}
                </button>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t('date')} *
              </label>
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                {t('time') || 'Time'}
              </label>
              <input
                type="time"
                value={customTime}
                onChange={e => setCustomTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Oil Types */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {t('oilLog_oilTypes')}
            </label>
            <div className="flex flex-wrap gap-2">
              {oilTypeOptions.map(option => {
                const isSelected = oilTypes.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleOilType(option.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {oilTypes.includes('other') && (
              <input
                type="text"
                placeholder={t('specify') || 'Specify other oil type'}
                value={customOil}
                onChange={e => setCustomOil(e.target.value)}
                className="mt-2 w-full p-2 border border-gray-300 rounded-lg text-xs"
              />
            )}
          </div>

          {/* Filters */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              {t('oilLog_filters')}
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => {
                const isSelected = filters.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggleFilter(option.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {filters.includes('other') && (
              <input
                type="text"
                placeholder={t('specify') || 'Specify other filter'}
                value={customFilter}
                onChange={e => setCustomFilter(e.target.value)}
                className="mt-2 w-full p-2 border border-gray-300 rounded-lg text-xs"
              />
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              {t('remarks')}
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder={t('remarks') || 'Any notes or remarks...'}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('saving') || 'Saving...'}
                </>
              ) : (
                t('updateLog') || t('save') || 'Update Log'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
