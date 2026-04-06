import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { Vehicle, AppLocation } from '../types';
import { XMarkIcon } from './Icons';
import { generateId } from '../utils/idGenerator';

import { formatDate, formatTime } from '../utils/formatters';

interface TransferFormModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onSave: (transferData: any) => Promise<void>;
}

export const TransferFormModal: React.FC<TransferFormModalProps> = ({ vehicle, onClose, onSave }) => {
  const { t } = useTranslation();
  const { locations } = useData();
  const { currentUser } = useAuth();
  const [toLocation, setToLocation] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toLocation) {
        alert(t('selectLocation'));
        return;
    }
    
    setIsSaving(true);
    try {
        const transferData = {
            id: generateId(),
            vehicleId: vehicle.id,
            fromLocation: vehicle.branchLocation,
            toLocation,
            requesterName: currentUser?.id || 'Unknown',
            reason,
            remarks,
            status: 'Pending',
            dateRequested: formatDate(new Date()),
        };
        await onSave(transferData);
        onClose();
    } catch (error) {
        console.error('Failed to create transfer request:', error);
        alert('Failed to create transfer request.');
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('branchTransfer')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicle')}</label>
            <div className="p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-600">
                {t(vehicle.vehiclesType)} {vehicle.vehicleCompanyNumber || ''}-{vehicle.vehicleNumber}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('transferTo')}</label>
            <select
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">{t('selectLocation')}</option>
              {locations.filter(l => l.name !== vehicle.branchLocation).map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reason')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              rows={3}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('remarks')}</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              rows={2}
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
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
