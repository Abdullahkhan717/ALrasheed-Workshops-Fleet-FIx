import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { ArrowsRightLeftIcon, DocumentTextIcon } from './Icons';

interface TransferHistoryProps {
  selectedVehicleId?: string;
}

export const TransferHistory: React.FC<TransferHistoryProps> = ({ selectedVehicleId }) => {
  const { t } = useTranslation();
  const { transferRequests, vehicles } = useData();

  const completedTransfers = transferRequests.filter(req => {
    const isCompleted = req.status.toLowerCase() === 'accepted' || req.status.toLowerCase() === 'rejected';
    if (!isCompleted) return false;
    if (selectedVehicleId && req.vehicleId !== selectedVehicleId) return false;
    return true;
  }).sort((a, b) => new Date(b.dateAccepted || '').getTime() - new Date(a.dateAccepted || '').getTime());

  return (
    <div className="space-y-4">
      {completedTransfers.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
          {t('noTransferHistoryFound')}
        </div>
      ) : (
        completedTransfers.map((req) => {
          const vehicle = vehicles.find(v => v.id === req.vehicleId);
          return (
            <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 md:hidden">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-bold text-gray-900">
                  {vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}` : req.vehicleId}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  req.status.toLowerCase() === 'accepted' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {t(req.status.toLowerCase())}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-900 mb-2">
                <span>{req.fromLocation}</span>
                <ArrowsRightLeftIcon className="h-3 w-3 mx-2 text-gray-400" />
                <span className="text-green-600">{req.toLocation}</span>
              </div>
              <div className="text-xs text-gray-500">{t('requester')}: {req.requesterName}</div>
            </div>
          );
        })
      )}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicle')}</th>
              <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transferDetails')}</th>
              <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requester')}</th>
              <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('approver')}</th>
              <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {completedTransfers.map((req) => {
              const vehicle = vehicles.find(v => v.id === req.vehicleId);
              return (
                <tr key={req.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="ms-4">
                        <div className="text-sm font-bold text-gray-900">
                          {vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}` : req.vehicleId}
                        </div>

                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <span>{req.fromLocation}</span>
                      <ArrowsRightLeftIcon className="h-3 w-3 mx-2 text-gray-400" />
                      <span className="text-green-600">{req.toLocation}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {req.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.requesterName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(req.dateRequested).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{req.acceptedBy || '-'}</div>
                    <div className="text-xs text-gray-500">
                      {req.dateAccepted ? new Date(req.dateAccepted).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status.toLowerCase() === 'accepted' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t(req.status.toLowerCase())}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
