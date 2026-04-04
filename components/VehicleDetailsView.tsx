import React, { useState } from 'react';
import type { Vehicle, RepairRequest, OilLog } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { WhatsappIcon } from './Icons';
import { formatVehicleInfo, formatDate, formatTime, parseDate } from '../utils/formatters';

interface VehicleDetailsViewProps {
  vehicle: Vehicle;
  repairRequests: RepairRequest[];
  oilLogs: OilLog[];
  onBack: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onTransfer: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onNewRepairRequest: (vehicleId: string) => void;
  onWhatsAppShare: (vehicle: Vehicle) => void;
}

export const VehicleDetailsView: React.FC<VehicleDetailsViewProps> = ({
  vehicle,
  repairRequests,
  oilLogs,
  onBack,
  onEdit,
  onTransfer,
  onDelete,
  onNewRepairRequest,
  onWhatsAppShare,
}) => {
  const { t, language } = useTranslation();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'repair' | 'oil'>('details');

  const isHomeBranch = (branchLocation: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (branchLocation === 'To Be Determined/يُحدد لاحقاً') return true;
    return currentUser.location === branchLocation;
  };

  return (
    <div className="border-2 border-green-100 rounded-xl p-6 bg-green-50">
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-green-600 mb-1">{t('step1_selectedVehicle')}</h2>
          <p className="text-2xl font-black text-green-900 uppercase">
            {formatVehicleInfo(vehicle, t)}
          </p>
        </div>
        <button 
          onClick={onBack}
          className="bg-white text-green-600 px-4 py-2 rounded-lg border border-green-200 shadow-sm hover:bg-green-100 transition font-bold text-sm"
        >
          {t('back')}
        </button>
      </div>

      <div className="flex space-x-4 rtl:space-x-reverse mb-6 border-b border-green-200">
        <button 
          onClick={() => setActiveTab('details')}
          className={`pb-2 px-4 font-bold transition ${activeTab === 'details' ? 'border-b-4 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('details')}
        </button>
        <button 
          onClick={() => setActiveTab('repair')}
          className={`pb-2 px-4 font-bold transition ${activeTab === 'repair' ? 'border-b-4 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('repairHistory')}
        </button>
        <button 
          onClick={() => setActiveTab('oil')}
          className={`pb-2 px-4 font-bold transition ${activeTab === 'oil' ? 'border-b-4 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('oilChangeHistory')}
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 mb-8">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('type')}</span>
            <span className="font-bold text-gray-800">{t(vehicle.vehiclesType)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('companyNumber')}</span>
            <span className="font-bold text-gray-800">{vehicle.vehicleCompanyNumber || '-'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('vehicleNumber')}</span>
            <span className="font-bold text-gray-800">{vehicle.vehicleNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('make')}</span>
            <span className="font-bold text-gray-800">{vehicle.make}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('model')}</span>
            <span className="font-bold text-gray-800">{vehicle.modelNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('serialNumber')}</span>
            <span className="font-bold text-gray-800">{vehicle.serialNumber}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('location')}</span>
            <span className="font-bold text-gray-800">{vehicle.branchLocation}</span>
          </div>
        </div>
      )}

      {activeTab === 'repair' && (
        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
          {repairRequests.filter(r => r.vehicleId === vehicle.id).length > 0 ? (
            repairRequests
              .filter(r => r.vehicleId === vehicle.id)
              .sort((a, b) => parseDate(b.dateIn).getTime() - parseDate(a.dateIn).getTime())
              .map(request => (
                <div key={request.id} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-green-600">#{request.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      request.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'Outsourced' ? 'bg-purple-100 text-purple-800' :
                      request.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {t(request.status.toLowerCase() as any)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1"><strong>{t('dateIn')}:</strong> {formatDate(request.dateIn)}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>{t('purpose')}:</strong> {t(request.purpose.toLowerCase().replace(/ /g, '') as any)}</p>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('faults')}:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {request.faults.map(f => (
                        <li key={f.id}>{f.description} {f.workDone ? ` - ${f.workDone}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center py-6 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">{language === 'ar' ? 'لا يوجد سجل إصلاح' : 'No repair history found'}</p>
          )}
        </div>
      )}

      {activeTab === 'oil' && (
        <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2">
          {oilLogs.filter(o => o.vehicleId === vehicle.id).length > 0 ? (
            oilLogs
              .filter(o => o.vehicleId === vehicle.id)
              .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())
              .map(log => (
                <div key={log.id} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-bold text-green-600">{formatDate(log.date)}</span>
                    <span className="text-xs text-gray-500">{formatTime(log.time)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1"><strong>{t('driver')}:</strong> {log.driverName}</p>
                  <p className="text-sm text-gray-600 mb-1"><strong>{t('mileage')}:</strong> {log.mileage}</p>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('oilTypes')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.oilTypes.map((ot, i) => (
                        <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{ot}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t('filters')}:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.filters.map((f, i) => (
                        <span key={i} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center py-6 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">{language === 'ar' ? 'لا يوجد سجل تغيير زيت' : 'No oil change history found'}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-6 border-t border-green-200">
        {isHomeBranch(vehicle.branchLocation) && (
          <>
            <button 
              onClick={() => onEdit(vehicle)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('edit')}
            </button>
            <button 
              onClick={() => onTransfer(vehicle)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('transfer')}
            </button>
          </>
        )}
        <button 
          onClick={() => onWhatsAppShare(vehicle)}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-600 transition shadow-sm flex items-center"
        >
          <WhatsappIcon className="h-4 w-4 me-2" />
          {t('shareViaWhatsApp')}
        </button>
        {isHomeBranch(vehicle.branchLocation) && (
          <>
            <button 
              onClick={() => onDelete(vehicle.id)}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-bold hover:bg-red-100 transition shadow-sm"
            >
              {t('delete')}
            </button>
            <button 
              onClick={() => onNewRepairRequest(vehicle.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-sm ms-auto"
            >
              {t('newRepairRequest')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
