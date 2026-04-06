import React, { useState, useEffect } from 'react';
import type { RepairRequest } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon } from './Icons';

import { formatDate, formatTime } from '../utils/formatters';

interface StatusChangeModalProps {
  request: RepairRequest;
  type: 'Cancelled' | 'Outsourced';
  onClose: () => void;
  onSave: (updatedRequest: RepairRequest) => Promise<void>;
}

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({ request, type, onClose, onSave }) => {
  const { t } = useTranslation();
  const [dateOut, setDateOut] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [reason, setReason] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [remark, setRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDateOut(now.toISOString().split('T')[0]);
    setTimeOut(now.toTimeString().slice(0, 5));
    if (type === 'Outsourced') {
      setWorkshopName(request.outsourcedWorkshopName || '');
      setRemark(request.transferOutsourceRemark || '');
    } else {
      setReason(request.rejectionReason || '');
    }
  }, [request, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateOut || !timeOut) {
      alert(t('alert_enterDateAndTimeOut'));
      return;
    }

    if (type === 'Cancelled' && !reason.trim()) {
      alert(t('cancellationReasonRequired'));
      return;
    }

    if (type === 'Outsourced' && !workshopName.trim()) {
      alert(t('enterOutsourcedWorkshopName'));
      return;
    }

    setIsSaving(true);
    try {
      const updatedRequest: RepairRequest = {
        ...request,
        status: type,
        applicationStatus: type === 'Cancelled' ? 'Cancelled' : request.applicationStatus,
        rejectionReason: type === 'Cancelled' ? reason : (type === 'Outsourced' ? remark : request.rejectionReason),
        toLocation: type === 'Outsourced' ? workshopName : request.toLocation,
        outsourcedWorkshopName: type === 'Outsourced' ? workshopName : request.outsourcedWorkshopName,
        transferOutsourceRemark: type === 'Outsourced' ? remark : request.transferOutsourceRemark,
        dateOut: formatDate(dateOut),
        timeOut: formatTime(timeOut),
        approvalDate: formatDate(new Date()),
      };
      await onSave(updatedRequest);
      onClose();
    } catch (error) {
      console.error('Failed to update request status:', error);
      alert('Failed to update request status.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {type === 'Cancelled' ? t('cancelRequest') : t('transferOutsource')}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {type === 'Cancelled' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('cancellationReason')}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder={t('enterCancellationReason')}
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('outsourcedWorkshopName')}</label>
              <input
                type="text"
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                placeholder={t('enterOutsourcedWorkshopName')}
                required
              />
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transferOutsourceRemark')}</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  rows={2}
                  placeholder={t('transferOutsourceRemark')}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateOut')}</label>
              <input
                type="date"
                value={dateOut}
                onChange={(e) => setDateOut(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t('timeOut')}</label>
              <input
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${
                type === 'Cancelled' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isSaving ? t('saving') : t('confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
