import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { TransferRequest } from '../types';
import { 
  CheckIcon, 
  XMarkIcon, 
  ClockIcon, 
  ArrowsRightLeftIcon,
  DocumentTextIcon
} from './Icons';

import { formatDate, formatTime } from '../utils/formatters';

export const TransferList: React.FC = () => {
  const { t } = useTranslation();
  const { transferRequests, vehicles, updateData } = useData();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'cancelled'>('pending');

  const filteredRequests = transferRequests.filter(req => {
    if (filter === 'all') return true;
    return String(req.status || '').toLowerCase() === filter;
  }).sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime());

  const handleAction = async (requestId: string, status: 'Accepted' | 'Rejected') => {
    try {
      const request = transferRequests.find(r => r.id === requestId);
      if (!request) return;

      let reason = '';
      if (status === 'Rejected') {
        reason = window.prompt(t('enterRejectionReason') || 'Enter rejection reason:') || '';
        if (!reason) {
          alert(t('alert_reasonRequired'));
          return;
        }
      }

      // Update Transfer Request
      await updateData('TransferRequests', {
        ...request,
        status,
        dateAccepted: formatDate(new Date()),
        acceptedBy: currentUser?.id || 'Unknown',
        rejectionReason: reason
      });

      // If accepted, update vehicle location
      if (status === 'Accepted') {
        const vehicle = vehicles.find(v => v.id === request.vehicleId);
        if (vehicle) {
          await updateData('Vehicles', {
            ...vehicle,
            branchLocation: request.toLocation
          });
        }
      }
      alert(status === 'Accepted' ? t('alert_requestAccepted') || 'Request accepted' : t('alert_requestRejected'));
    } catch (error) {
      console.error('Error updating transfer request:', error);
      alert('Failed to update request');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const request = transferRequests.find(r => r.id === requestId);
      if (!request) return;

      const reason = window.prompt(t('enterCancellationReason') || 'Please enter the reason for cancellation:');
      if (!reason) {
        if (reason === '') alert(t('cancellationReasonRequired') || 'Cancellation reason is required.');
        return;
      }

      await updateData('TransferRequests', {
        ...request,
        status: 'Cancelled',
        rejectionReason: reason
      });
      alert(t('alert_requestCancelled') || 'Request has been cancelled.');
    } catch (error) {
      console.error('Error cancelling transfer request:', error);
      alert('Failed to cancel request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 me-1" />
            {t('pending')}
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckIcon className="w-3 h-3 me-1" />
            {t('accepted')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XMarkIcon className="w-3 h-3 me-1" />
            {t('rejected')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XMarkIcon className="w-3 h-3 me-1" />
            {t('cancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <ArrowsRightLeftIcon className="h-7 w-7 me-2 text-green-600" />
          {t('transferRequests')}
        </h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(['pending', 'accepted', 'rejected', 'cancelled', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                filter === f 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicle')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('transferDetails')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('requester')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('approver')}</th>
                <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
                <th className="px-6 py-3 text-right rtl:text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    {t('noTransferRequestsFound')}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
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
                          <span className="font-medium">{req.fromLocation}</span>
                          <ArrowsRightLeftIcon className="h-3 w-3 mx-2 text-gray-400" />
                          <span className="font-medium text-green-600">{req.toLocation}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {req.reason}
                        </div>
                        {req.rejectionReason && (
                          <div className="text-xs text-red-500 mt-1 italic">
                            {req.status === 'Cancelled' ? t('cancellationReason') : t('rejectionReason')}: {req.rejectionReason}
                          </div>
                        )}
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
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right rtl:text-left text-sm font-medium">
                        <div className="flex justify-end space-x-2 rtl:space-x-reverse">
                          {String(req.status || '').toLowerCase() === 'pending' && (currentUser?.location === req.toLocation || currentUser?.role === 'admin') && (
                            <>
                              <button
                                onClick={() => handleAction(req.id, 'Accepted')}
                                className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition"
                                title={t('accept')}
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleAction(req.id, 'Rejected')}
                                className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                                title={t('reject')}
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          
                          {String(req.status || '').toLowerCase() === 'pending' && (currentUser?.id === req.requesterId || currentUser?.role === 'admin' || currentUser?.location === req.fromLocation) && (
                            <button
                              onClick={() => handleCancel(req.id)}
                              className="p-1.5 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition"
                              title={t('cancel')}
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          )}

                          {String(req.status || '').toLowerCase() !== 'pending' && (
                            <button className="text-green-600 hover:text-green-800">
                              {t('viewDetails')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
