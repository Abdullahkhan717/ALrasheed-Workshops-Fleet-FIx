import React from 'react';
import type { RepairRequest, Vehicle } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface DuplicateRequestModalProps {
  request: RepairRequest;
  vehicle: Vehicle;
  onAddFault: () => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export const DuplicateRequestModal: React.FC<DuplicateRequestModalProps> = ({ request, vehicle, onAddFault, onCreateNew, onClose }) => {
  const { t } = useTranslation();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-orange-600 mb-4">{t('pendingRequestFound')}</h2>
        <p className="text-gray-600 mb-6">
          {t('pendingRequestDesc', { 
            vehicleInfo: `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`
          })}
        </p>
        
        <div className="border rounded-lg p-4 bg-gray-50 mb-6 text-start">
            <p><strong className="w-24 inline-block">{t('jobCardNo')}:</strong> {request.id}</p>
            <p><strong className="w-24 inline-block">{t('dateIn')}:</strong> {request.dateIn}</p>
            <p><strong className="w-24 inline-block">{t('driver')}:</strong> {request.driverName}</p>
            <p className="mt-2"><strong className="w-24">{t('faults')}:</strong></p>
            <ul className="list-disc list-inside ms-4 text-sm text-gray-700">
                {request.faults.map(fault => <li key={fault.id}>{fault.description}</li>)}
            </ul>
        </div>

        <p className="text-gray-600 mb-6">{t('howToProceed')}</p>

        <div className="flex justify-end space-x-4">
          <button onClick={onAddFault} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            {t('addFaultToRequest')}
          </button>
          <button onClick={onCreateNew} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            {t('createNewRequest')}
          </button>
        </div>
      </div>
    </div>
  );
};
