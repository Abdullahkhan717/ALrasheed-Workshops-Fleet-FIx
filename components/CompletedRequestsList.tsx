import React, { useState } from 'react';
import type { Vehicle, Workshop, RepairRequest } from '../types';
import { JobCard } from './JobCard';
import { PrinterIcon, WhatsappIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { formatVehicleInfo } from '../utils/formatters';

interface CompletedRequestsListProps {
  repairRequests: RepairRequest[];
  vehicles: Vehicle[];
  workshops: Workshop[];
}

export const CompletedRequestsList: React.FC<CompletedRequestsListProps> = ({ repairRequests, vehicles, workshops }) => {
  const [requestToPrint, setRequestToPrint] = useState<RepairRequest | null>(null);
  const [requestToShare, setRequestToShare] = useState<RepairRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const handleShare = (request: RepairRequest) => {
    setRequestToShare(request);
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const filteredRequests = repairRequests.filter(request => {
    const vehicle = vehicles.find(v => String(v.id) === String(request.vehicleId));
    if (!vehicle) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      String(vehicle.vehicleNumber || '').toLowerCase().includes(query) ||
      String(vehicle.vehicleCompanyNumber || '').toLowerCase().includes(query) ||
      String(request.id).toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('completedRequests')}</h1>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder={t('searchByVehicleOrJobCard') || 'Search by Vehicle or Job Card...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {requestToPrint && (
        <JobCard 
            request={requestToPrint} 
            vehicle={vehicles.find(v => v.id === requestToPrint.vehicleId) as Vehicle}
            workshops={workshops}
            onClose={() => setRequestToPrint(null)}
        />
      )}

      {requestToShare && (
        <JobCard 
            request={requestToShare} 
            vehicle={vehicles.find(v => v.id === requestToShare.vehicleId) as Vehicle}
            workshops={workshops}
            onClose={() => setRequestToShare(null)}
            onShare={() => {}} 
        />
      )}

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobCardNo')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicle')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('resolvedFaults')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getVehicleInfo(request.vehicleId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <ul className="list-disc list-inside">
                      {request.faults.map((f, fIndex) => <li key={`${f.id}-${fIndex}`}>{f.description}</li>)}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleShare(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                        <WhatsappIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('printJobCard')}>
                        <PrinterIcon className="h-5 w-5"/>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">{t('noCompletedRequests')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map(request => (
            <div key={request.id} className="bg-white rounded-xl shadow-md p-4 space-y-3 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{t('jobCardNo')} {request.id}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{getVehicleInfo(request.vehicleId)}</h3>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase">
                  {t('completed')}
                </span>
              </div>
              
              <div>
                <span className="text-gray-500 block text-xs mb-1">{t('resolvedFaults')}</span>
                <ul className="space-y-1">
                  {request.faults.map((f, fIndex) => (
                    <li key={`${f.id}-${fIndex}`} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-500 me-2">•</span>
                      {f.description}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-gray-50 flex gap-2">
                <button 
                  onClick={() => handleShare(request)} 
                  className="flex-1 flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <WhatsappIcon className="h-4 w-4"/>
                  <span className="text-xs font-medium">{t('whatsapp')}</span>
                </button>
                <button 
                  onClick={() => setRequestToPrint(request)} 
                  className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <PrinterIcon className="h-4 w-4"/>
                  <span className="text-xs font-medium">{t('print')}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">{t('noCompletedRequests')}</div>
        )}
      </div>
    </div>
  );
};
