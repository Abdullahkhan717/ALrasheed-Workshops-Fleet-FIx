import React from 'react';
import type { Workshop } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface WorkshopDeleteConfirmationModalProps {
  workshop: Workshop;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkshopDeleteConfirmationModal: React.FC<WorkshopDeleteConfirmationModalProps> = ({ workshop, onConfirm, onCancel }) => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 animate-fade-in-up">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        <h2 className="text-xl font-bold text-red-600 mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-700 mb-4">
          {t('confirmDeleteWorkshopMsg')} <br />
          <strong className="font-semibold">{workshop.subName}</strong>?
        </p>
        <p className="text-gray-600 mb-6">{t('actionCannotBeUndone')}</p>
        
        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
            {t('cancel')}
          </button>
          <button onClick={onConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            {t('confirmDelete')}
          </button>
        </div>
      </div>
    </div>
  );
};
