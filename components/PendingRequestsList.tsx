import React, { useState } from 'react';
import type { Vehicle, Workshop, RepairRequest } from '../types';
import { JobCard } from './JobCard';
import { PrinterIcon, WhatsappIcon, CheckBadgeIcon, EyeIcon, XMarkIcon, TrashIcon, XCircleIcon, ArrowRightCircleIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { CompletionFormModal } from './CompletionFormModal';
import { StatusChangeModal } from './StatusChangeModal';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatDate, formatVehicleInfo } from '../utils/formatters';

interface PendingRequestsListProps {
  repairRequests: RepairRequest[];
  onUpdateRequest: (request: RepairRequest) => Promise<void>;
  vehicles: Vehicle[];
  workshops: Workshop[];
  title?: string;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ repairRequests, onUpdateRequest, vehicles, workshops, title }) => {
  const [requestToPrint, setRequestToPrint] = useState<RepairRequest | null>(null);
  const [requestToShare, setRequestToShare] = useState<RepairRequest | null>(null);
  const [requestToComplete, setRequestToComplete] = useState<RepairRequest | null>(null);
  const [requestToStatusChange, setRequestToStatusChange] = useState<{ request: RepairRequest, type: 'Cancelled' | 'Outsourced' } | null>(null);
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const { updateData, deleteData } = useData();

  const handleShare = (request: RepairRequest) => {
    setRequestToShare(request);
  };

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };
  
  const handleSaveCompletion = async (completedRequest: RepairRequest) => {
    await onUpdateRequest(completedRequest);
    setRequestToComplete(null);
  };

  const handleSaveStatusChange = async (updatedRequest: RepairRequest) => {
    const payload = {
        ...updatedRequest,
        faults: JSON.stringify(updatedRequest.faults)
    };
    await updateData('RepairRequests', payload);
    setRequestToStatusChange(null);
  };

  const handleAccept = async (request: RepairRequest) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من قبول هذا الطلب؟' : 'Are you sure you want to accept this request?')) {
      const payload = { 
        ...request, 
        applicationStatus: 'Accepted', 
        acceptedBy: currentUser?.id || 'Unknown',
        approvalDate: formatDate(new Date()),
        faults: JSON.stringify(request.faults) 
      };
      await updateData('RepairRequests', payload);
      alert(language === 'ar' ? 'تم قبول الطلب بنجاح.' : 'Request accepted successfully.');
    }
  };

  const handleReject = async (request: RepairRequest) => {
    const reason = window.prompt(t('enterRejectionReason') || 'Enter rejection reason:');
    if (reason) {
      const payload = { 
        ...request, 
        applicationStatus: 'Rejected', 
        status: 'Rejected',
        rejectionReason: reason, 
        acceptedBy: currentUser?.id || 'Unknown',
        approvalDate: formatDate(new Date()),
        faults: JSON.stringify(request.faults) 
      };
      await updateData('RepairRequests', payload);
      alert(t('alert_requestRejected'));
    } else if (reason === '') {
      alert(t('alert_reasonRequired'));
    }
  };

  const handleCancel = (request: RepairRequest) => {
    setRequestToStatusChange({ request, type: 'Cancelled' });
  };

  const handleOutsource = (request: RepairRequest) => {
    setRequestToStatusChange({ request, type: 'Outsourced' });
  };

  const handleDelete = async (request: RepairRequest) => {
    if (window.confirm(t('actionCannotBeUndone'))) {
      await deleteData('RepairRequests', request.id);
    }
  };

  // Debug: Check for duplicate IDs
  React.useEffect(() => {
    const ids = repairRequests.map(r => r.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error("Duplicate repair request IDs found:", ids.filter((id, index) => ids.indexOf(id) !== index));
    }
  }, [repairRequests]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{title || t('pendingRequests')}</h1>

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

      {requestToComplete && (
        <CompletionFormModal
            request={requestToComplete}
            onClose={() => setRequestToComplete(null)}
            onSave={handleSaveCompletion}
        />
      )}

      {requestToStatusChange && (
        <StatusChangeModal
            request={requestToStatusChange.request}
            type={requestToStatusChange.type}
            onClose={() => setRequestToStatusChange(null)}
            onSave={handleSaveStatusChange}
        />
      )}

      {/* Desktop View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobCardNo')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicle')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('driver')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dateIn')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('applicationStatus')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('jobStatus')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {repairRequests.length > 0 ? (
              repairRequests.map((request, index) => (
                <tr key={`${request.id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{request.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getVehicleInfo(request.vehicleId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.driverName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(request.dateIn)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.applicationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.applicationStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                        request.applicationStatus === 'Rejected' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {t(request.applicationStatus?.toLowerCase() as any || 'pending')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        request.applicationStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        request.status === 'Outsourced' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                      {t(request.status.toLowerCase() as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full" title={t('showCard')}>
                        <EyeIcon className="h-5 w-5"/>
                    </button>
                    
                    {(currentUser?.location === request.toLocation || currentUser?.role === 'admin') && request.applicationStatus === 'Pending' && (
                        <>
                            <button onClick={() => handleAccept(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('accept')}>
                                <CheckBadgeIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => handleOutsource(request)} className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-full" title={t('transferOutsource')}>
                                <ArrowRightCircleIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => handleReject(request)} className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-full" title={t('reject')}>
                                <XMarkIcon className="h-5 w-5"/>
                            </button>
                        </>
                    )}

                    {(currentUser?.id === request.createdBy || currentUser?.location === request.fromLocation || currentUser?.role === 'admin') && (request.applicationStatus === 'Pending' || request.applicationStatus === 'Accepted') && request.status === 'Pending' && (
                        <button onClick={() => handleCancel(request)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('cancel')}>
                            <XCircleIcon className="h-5 w-5"/>
                        </button>
                    )}

                    {(currentUser?.role === 'admin' || currentUser?.id === request.createdBy) && request.applicationStatus === 'Pending' && (
                        <button onClick={() => handleDelete(request)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('delete')}>
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    )}

                    {(currentUser?.location === request.toLocation || currentUser?.location === request.fromLocation || currentUser?.role === 'admin') && request.applicationStatus === 'Accepted' && request.status === 'Pending' && (
                        <>
                            <button onClick={() => setRequestToComplete(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('markAsCompleted')}>
                                <CheckBadgeIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => handleOutsource(request)} className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-100 rounded-full" title={t('transferOutsource')}>
                                <ArrowRightCircleIcon className="h-5 w-5"/>
                            </button>
                        </>
                    )}
                    
                    <button onClick={() => handleShare(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                        <WhatsappIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => setRequestToPrint(request)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('printJobCard')}>
                        <PrinterIcon className="h-5 w-5"/>
                    </button>
                   </div>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500">{t('noPendingRequests')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {repairRequests.length > 0 ? (
          repairRequests.map((request, index) => (
            <div key={`${request.id}-${index}`} className="bg-white rounded-xl shadow-md p-4 space-y-3 border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{t('jobCardNo')} {request.id}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{getVehicleInfo(request.vehicleId)}</h3>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      request.applicationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.applicationStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                      request.applicationStatus === 'Rejected' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                  }`}>
                    {t(request.applicationStatus?.toLowerCase() as any || 'pending')}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      request.applicationStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      request.status === 'Outsourced' ? 'bg-purple-100 text-purple-800' :
                      'bg-green-100 text-green-800'
                  }`}>
                    {t(request.status.toLowerCase() as any)}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">{t('driver')}</span>
                  <span className="font-medium text-gray-800">{request.driverName}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">{t('dateIn')}</span>
                  <span className="font-medium text-gray-800">{formatDate(request.dateIn)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-50 flex flex-wrap gap-2">
                <button 
                  onClick={() => setRequestToPrint(request)} 
                  className="flex-1 flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <EyeIcon className="h-4 w-4"/>
                  <span className="text-xs font-medium">{t('view')}</span>
                </button>

                 {(currentUser?.location === request.toLocation || currentUser?.role === 'admin') && request.applicationStatus === 'Pending' && (
                  <>
                    <button 
                      onClick={() => handleAccept(request)} 
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckBadgeIcon className="h-4 w-4"/>
                      <span className="text-xs font-medium">{t('accept')}</span>
                    </button>
                    <button 
                      onClick={() => handleOutsource(request)} 
                      className="flex-1 flex items-center justify-center space-x-2 bg-purple-50 text-purple-700 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <ArrowRightCircleIcon className="h-4 w-4"/>
                      <span className="text-xs font-medium">{t('transferOutsource')}</span>
                    </button>
                    <button 
                      onClick={() => handleReject(request)} 
                      className="flex-1 flex items-center justify-center space-x-2 bg-orange-50 text-orange-700 py-2 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4"/>
                      <span className="text-xs font-medium">{t('reject')}</span>
                    </button>
                  </>
                )}

                {(currentUser?.id === request.createdBy || currentUser?.location === request.fromLocation || currentUser?.role === 'admin') && (request.applicationStatus === 'Pending' || request.applicationStatus === 'Accepted') && request.status === 'Pending' && (
                  <button 
                    onClick={() => handleCancel(request)} 
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4"/>
                    <span className="text-xs font-medium">{t('cancel')}</span>
                  </button>
                )}

                {(currentUser?.location === request.toLocation || currentUser?.location === request.fromLocation || currentUser?.role === 'admin') && request.applicationStatus === 'Accepted' && request.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => setRequestToComplete(request)} 
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckBadgeIcon className="h-4 w-4"/>
                      <span className="text-xs font-medium">{t('complete')}</span>
                    </button>
                    <button 
                      onClick={() => handleOutsource(request)} 
                      className="flex-1 flex items-center justify-center space-x-2 bg-purple-50 text-purple-700 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <ArrowRightCircleIcon className="h-4 w-4"/>
                      <span className="text-xs font-medium">{t('transferOutsource')}</span>
                    </button>
                  </>
                )}

                <div className="w-full flex gap-2">
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
            </div>
          ))
        ) : (
          <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-500">{t('noPendingRequests')}</div>
        )}
      </div>
    </div>
  );
};
