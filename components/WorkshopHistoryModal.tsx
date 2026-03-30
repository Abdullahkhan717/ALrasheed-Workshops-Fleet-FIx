import React from 'react';
import type { RepairRequest, Vehicle, Workshop } from '../types';
import { XMarkIcon, DownloadIcon } from './Icons';
import { downloadHistoryCSV } from '../utils/csvExport';
import { useTranslation } from '../hooks/useTranslation';

interface WorkshopHistoryModalProps {
  workshop: Workshop;
  allRequests: RepairRequest[];
  allVehicles: Vehicle[];
  allWorkshops: Workshop[];
  onClose: () => void;
}

export const WorkshopHistoryModal: React.FC<WorkshopHistoryModalProps> = ({
  workshop,
  allRequests,
  allVehicles,
  allWorkshops,
  onClose,
}) => {
  const { t } = useTranslation();
  
  const relevantRequests = allRequests.filter(req => 
    req.faults.some(fault => fault.workshopId === workshop.id)
  ).sort((a,b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime());

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    return vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}` : t('unknownVehicle');
  };

  const handleDownload = () => {
    if (relevantRequests.length > 0) {
      const fileName = `workshop-history-${workshop.subName.replace(/\s+/g, '-')}.csv`;
      downloadHistoryCSV(relevantRequests, allVehicles, allWorkshops, fileName, workshop.id, t);
    } else {
      alert(t('alert_noHistoryToDownload'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] flex flex-col relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
                 <h2 className="text-2xl font-bold text-gray-800">{t('historyFor', { workshopName: workshop.subName })}</h2>
                 <p className="text-sm text-gray-500">{t('recordsFound', { count: relevantRequests.length })}</p>
            </div>
            {relevantRequests.length > 0 && (
                <button
                    onClick={handleDownload}
                    className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
                >
                    <DownloadIcon className="h-5 w-5 me-2" />
                    {t('downloadHistory')}
                </button>
            )}
        </div>
        
        <div className="overflow-y-auto">
          {relevantRequests.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('jobCardNo')}</th>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('vehicle')}</th>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('dateIn')}</th>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('mileage')}</th>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                  <th className="px-4 py-2 text-start text-xs font-medium text-gray-500 uppercase">{t('fault')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relevantRequests.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{req.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{getVehicleInfo(req.vehicleId)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{req.dateIn}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">{req.mileage || 'N/A'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {t(String(req.status || '').toLowerCase() as 'pending' | 'completed')}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                        <ul className="list-disc list-inside">
                            {req.faults.filter(f => f.workshopId === workshop.id).map(f => (
                                <li key={f.id}>{f.description}</li>
                            ))}
                        </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center py-10 text-gray-500">{t('noHistoryForWorkshop')}</p>
          )}
        </div>
      </div>
    </div>
  );
};
