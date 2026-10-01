import React, { useState } from 'react';
import type { TyreLog, TyreDetail, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { XMarkIcon, PlusIcon, TrashIcon, ArrowsRightLeftIcon } from './Icons';
import { formatDateForSheet, parseDate } from '../utils/formatters';
import { SearchableVehicleSelect } from './SearchableVehicleSelect';
import { generateId } from '../utils/idGenerator';

interface EditTyreLogModalProps {
  log: TyreLog;
  initialTyreIndex?: number;
  onClose: () => void;
  onSuccess?: (updatedLog: TyreLog) => void;
}

export const EditTyreLogModal: React.FC<EditTyreLogModalProps> = ({
  log,
  initialTyreIndex,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const { vehicles, workshops, locations, updateData } = useData();

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
  const [workshopLocation, setWorkshopLocation] = useState<string>(log.workshopLocation || 'Puncture WorkShop');
  const [customWorkshop, setCustomWorkshop] = useState<string>('');
  const [showCustomWorkshop, setShowCustomWorkshop] = useState<boolean>(false);
  const [mechanicName, setMechanicName] = useState<string>(log.mechanicName || '');
  const [customDate, setCustomDate] = useState<string>(getInitialDate(log.date));
  const [customTime, setCustomTime] = useState<string>(getInitialTime(log.time, log.date));

  // Initialize tyres from log.tyreDetails
  const initialTyres: TyreDetail[] = (log.tyreDetails && log.tyreDetails.length > 0)
    ? log.tyreDetails.map(td => ({
        id: td.id || generateId(),
        condition: td.condition || 'NEW',
        size: td.size || '385',
        serialNumber: td.serialNumber || '',
        brand: td.brand || '',
        fromVehicle: td.fromVehicle || '',
        fromVehicleId: td.fromVehicleId || '',
        remarks: td.remarks || ''
      }))
    : [{
        id: generateId(),
        condition: 'NEW',
        size: '385',
        serialNumber: '',
        brand: '',
        fromVehicle: '',
        fromVehicleId: '',
        remarks: ''
      }];

  const [tyres, setTyres] = useState<TyreDetail[]>(initialTyres);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const brandOptions = [
    'Bridgestone',
    'Continental',
    'Goodyear',
    'Pirelli',
    'Hankook',
    'BFGoodrich',
    'Triangle',
    'Yokohama',
    'Falken',
    'Michelin',
    'DEEstone',
    'Jinyu'
  ];

  const sizeOptions = ['385', '315', '24'];

  const handleTyreFieldChange = (index: number, field: keyof TyreDetail, value: string) => {
    setTyres(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      // If changing fromVehicleId, update fromVehicle display text as well
      if (field === 'fromVehicleId') {
        const fromVeh = vehicles.find(v => v.id === value);
        if (fromVeh) {
          updated[index].fromVehicle = `${fromVeh.vehicleCompanyNumber ? `${fromVeh.vehicleCompanyNumber}-` : ''}${fromVeh.vehicleNumber}`;
        } else {
          updated[index].fromVehicle = '';
        }
      }
      return updated;
    });
  };

  const handleAddTyre = () => {
    setTyres(prev => [
      ...prev,
      {
        id: generateId(),
        condition: 'NEW',
        size: '385',
        serialNumber: '',
        brand: '',
        fromVehicle: '',
        fromVehicleId: '',
        remarks: ''
      }
    ]);
  };

  const handleRemoveTyre = (index: number) => {
    if (tyres.length <= 1) return;
    setTyres(prev => prev.filter((_, i) => i !== index));
  };

  const handleWorkshopChange = (val: string) => {
    if (val === 'addNew') {
      setShowCustomWorkshop(true);
      setWorkshopLocation('');
    } else {
      setShowCustomWorkshop(false);
      setWorkshopLocation(val);
      const workshopObj = workshops.find(w => w.subName === val || w.location === val);
      if (workshopObj && (workshopObj.mechanic || workshopObj.foreman)) {
        setMechanicName(workshopObj.mechanic || workshopObj.foreman || '');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalWorkshop = showCustomWorkshop ? customWorkshop.trim() : workshopLocation.trim();

    if (!selectedVehicleId) {
      alert(t('alert_selectVehicle') || 'Please select a vehicle.');
      return;
    }

    if (tyres.length === 0) {
      alert(t('alert_fillAllFields') || 'Please add at least one tyre.');
      return;
    }

    // Validate tyre serial numbers
    const emptySerialIndex = tyres.findIndex(t => !String(t.serialNumber || '').trim());
    if (emptySerialIndex !== -1) {
      alert(`${t('tyre')} ${emptySerialIndex + 1}: ${t('serialNumber')} is required.`);
      return;
    }

    setIsSaving(true);
    try {
      const dateObj = new Date(`${customDate}T${customTime || '12:00'}`);
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      const vehicleNum = selectedVehicle?.vehicleNumber || log.vehicleNumber || '';

      const updatedTyres: TyreDetail[] = tyres.map(t => ({
        ...t,
        id: t.id || generateId(),
        serialNumber: String(t.serialNumber).trim(),
        brand: String(t.brand || '').trim(),
        remarks: String(t.remarks || '').trim()
      }));

      const updatedLog: TyreLog = {
        ...log,
        vehicleId: selectedVehicleId,
        vehicleNumber: vehicleNum,
        date: dateObj.toISOString(),
        time: dateObj.toISOString(),
        mileage: mileage.trim(),
        driverName: driverName.trim(),
        workshopLocation: finalWorkshop,
        mechanicName: mechanicName.trim(),
        tyreDetails: updatedTyres
      };

      const payload = {
        id: log.id,
        'Vehicle ID': selectedVehicleId,
        vehicleId: selectedVehicleId,
        VehicleId: selectedVehicleId,
        'Vehicle Number': vehicleNum,
        vehicleNumber: vehicleNum,
        VehicleNumber: vehicleNum,
        'Date': formatDateForSheet(dateObj),
        date: formatDateForSheet(dateObj),
        'Time': customTime || '12:00',
        time: customTime || '12:00',
        'Mileage': updatedLog.mileage,
        mileage: updatedLog.mileage,
        'Driver Name': updatedLog.driverName,
        driverName: updatedLog.driverName,
        'Workshop Location': updatedLog.workshopLocation,
        workshopLocation: updatedLog.workshopLocation,
        'Mechanic Name': updatedLog.mechanicName,
        mechanicName: updatedLog.mechanicName,
        tyreDetails: JSON.stringify(updatedTyres),
        'Tyre Details': JSON.stringify(updatedTyres),
        // Flat compatibility fields for first tyre
        'Tyre Type': updatedTyres[0]?.condition || '',
        'Tyre Size': updatedTyres[0]?.size || '',
        'Serial Number': updatedTyres[0]?.serialNumber || '',
        'From Vehicle': updatedTyres[0]?.fromVehicle || '',
        brand: updatedTyres[0]?.brand || '',
        remarks: updatedTyres[0]?.remarks || ''
      };

      await updateData('TyreLogs', payload);

      if (onSuccess) {
        onSuccess(updatedLog);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update tyre log:', err);
      alert('Failed to update tyre log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <span className="text-xl">🛞</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {t('editTyreLog') || 'Edit Tyre Entry'}
              </h2>
              <p className="text-xs text-blue-100">
                {t('id')}: #{log.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Section 1: Vehicle & Basic Details */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-500 tracking-wider">
              {t('step1_selectedVehicle')} & {t('details')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t('vehicle')} <span className="text-red-500">*</span>
                </label>
                <SearchableVehicleSelect
                  vehicles={vehicles}
                  value={selectedVehicleId}
                  onChange={(val) => setSelectedVehicleId(val)}
                  placeholder={t('selectVehicle')}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t('driver')} / {t('requesterName') || 'Driver Name'}
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder={t('driver')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t('mileage')} (KM)
                </label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="e.g. 750000"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm font-mono focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t('workshopLocation')}
                </label>
                {!showCustomWorkshop ? (
                  <select
                    value={workshopLocation}
                    onChange={(e) => handleWorkshopChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="Puncture WorkShop">Puncture WorkShop</option>
                    {workshops.map(w => (
                      <option key={w.id} value={w.subName || w.location}>
                        {w.subName || w.location}
                      </option>
                    ))}
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                    <option value="addNew">+ {t('addNew') || 'Add New'}</option>
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customWorkshop}
                      onChange={(e) => setCustomWorkshop(e.target.value)}
                      placeholder={t('enterCustomLocation') || 'Enter Location'}
                      className="flex-1 p-2 border border-gray-300 rounded-md text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCustomWorkshop(false)}
                      className="px-2.5 py-1 text-xs text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  {t('mechanic')}
                </label>
                <input
                  type="text"
                  value={mechanicName}
                  onChange={(e) => setMechanicName(e.target.value)}
                  placeholder={t('mechanic')}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {t('date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    {t('time')}
                  </label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tyre Details Items */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>🛞 {t('tyreDetailsList') || 'Tyre Details'}</span>
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {tyres.length}
                </span>
              </h3>
              <button
                type="button"
                onClick={handleAddTyre}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {t('addTyreItem') || 'Add Another Tyre'}
              </button>
            </div>

            <div className="space-y-4">
              {tyres.map((tyre, idx) => (
                <div
                  key={tyre.id || idx}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs relative hover:border-blue-300 transition"
                >
                  <div className="flex justify-between items-center pb-2 mb-3 border-b border-gray-100">
                    <span className="font-bold text-sm text-blue-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      {t('tyre')} #{idx + 1}
                    </span>
                    {tyres.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTyre(idx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        {t('removeTyreItem') || 'Remove'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Condition / Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        {t('condition')} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={tyre.condition}
                        onChange={(e) => handleTyreFieldChange(idx, 'condition', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white font-medium"
                      >
                        <option value="NEW">{t('tyreType_NEW') || 'NEW'}</option>
                        <option value="Used">{t('tyreType_Used') || 'Used'}</option>
                        <option value="Repaired">{t('tyreType_Repaired') || 'Repaired'}</option>
                      </select>
                    </div>

                    {/* Size */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        {t('size')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          list={`size-options-${idx}`}
                          value={tyre.size}
                          onChange={(e) => handleTyreFieldChange(idx, 'size', e.target.value)}
                          placeholder="e.g. 385, 315, 24"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                        />
                        <datalist id={`size-options-${idx}`}>
                          {sizeOptions.map(sz => (
                            <option key={sz} value={sz} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Brand */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        {t('brand')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          list={`brand-options-${idx}`}
                          value={tyre.brand || ''}
                          onChange={(e) => handleTyreFieldChange(idx, 'brand', e.target.value)}
                          placeholder="e.g. Bridgestone"
                          className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                        />
                        <datalist id={`brand-options-${idx}`}>
                          {brandOptions.map(b => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>
                    </div>

                    {/* Serial Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        {t('serialNumber')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tyre.serialNumber}
                        onChange={(e) => handleTyreFieldChange(idx, 'serialNumber', e.target.value)}
                        placeholder="e.g. 98451"
                        className="w-full p-2 border border-gray-300 rounded-md text-sm font-mono font-bold bg-white"
                      />
                    </div>

                    {/* From Vehicle (if Used) */}
                    {tyre.condition === 'Used' && (
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                          {t('fromVehicle')}
                        </label>
                        <SearchableVehicleSelect
                          vehicles={vehicles}
                          value={tyre.fromVehicleId || ''}
                          onChange={(val) => handleTyreFieldChange(idx, 'fromVehicleId', val)}
                          placeholder={t('selectVehicle')}
                        />
                      </div>
                    )}

                    {/* Remarks */}
                    <div className={tyre.condition === 'Used' ? 'sm:col-span-3' : 'sm:col-span-2'}>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        {t('remarks')}
                      </label>
                      <input
                        type="text"
                        value={tyre.remarks || ''}
                        onChange={(e) => handleTyreFieldChange(idx, 'remarks', e.target.value)}
                        placeholder={t('remarks')}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50 transition"
              disabled={isSaving}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>{t('saving') || 'Saving...'}</span>
                </>
              ) : (
                <span>{t('updateTyreLog') || 'Update Tyre Entry'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
