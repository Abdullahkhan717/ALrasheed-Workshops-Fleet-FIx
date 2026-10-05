import React, { useState, useMemo } from 'react';
import type { Vehicle, RepairRequest, OilLog } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';
import { WhatsappIcon, PrinterIcon, PencilSquareIcon } from './Icons';
import { formatVehicleInfo, formatDate, formatTime, parseDate } from '../utils/formatters';
import { calculateOilSchedule, parseOdometer, areSameVehicle } from '../utils/oilSchedule';
import { OilChangeCardModal } from './OilChangeCardModal';
import { EditOilLogModal } from './EditOilLogModal';

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
  const [selectedCardLog, setSelectedCardLog] = useState<OilLog | null>(null);
  const [editingOilLog, setEditingOilLog] = useState<OilLog | null>(null);

  const vehicleOilLogs = useMemo(() => {
    return oilLogs
      .filter(o => areSameVehicle(o.vehicleId, vehicle.id, [vehicle]))
      .sort((a, b) => {
        const timeA = parseDate(a.date).getTime() || 0;
        const timeB = parseDate(b.date).getTime() || 0;
        if (timeA !== timeB) return timeB - timeA;
        return parseOdometer(b.mileage) - parseOdometer(a.mileage);
      });
  }, [oilLogs, vehicle]);

  const vehicleStatus = useMemo((): 'Available' | 'In-Use' | 'Maintenance' => {
    const hasActiveRepair = repairRequests.some(r => {
      const rStatus = String(r.status || '').toLowerCase();
      if (rStatus !== 'pending' && rStatus !== 'in progress' && rStatus !== 'open') return false;
      const vid = String(vehicle.id || '');
      const cNum = String(vehicle.vehicleCompanyNumber || '');
      const vNum = String(vehicle.vehicleNumber || '');
      const reqVid = String(r.vehicleId || '');
      return reqVid === vid || (cNum && reqVid === cNum) || (vNum && reqVid === vNum);
    });
    if (hasActiveRepair) return 'Maintenance';

    const raw = String(vehicle.condition || '').trim().toLowerCase();
    if (raw === 'maintenance' || raw === 'damage' || raw === 'brekdown' || raw === 'breakdown') {
      return 'Maintenance';
    }
    if (raw === 'available' || raw === 'ready for work' || raw === 'ready') {
      return 'Available';
    }
    if (raw === 'in-use' || raw === 'in use' || raw === 'working') {
      return 'In-Use';
    }
    return 'Available';
  }, [vehicle, repairRequests]);

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
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-green-600">{t('step1_selectedVehicle')}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
              vehicleStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              vehicleStatus === 'In-Use' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full me-1.5 ${
                vehicleStatus === 'Available' ? 'bg-emerald-500' :
                vehicleStatus === 'In-Use' ? 'bg-blue-500' :
                'bg-amber-500'
              }`} />
              {vehicleStatus === 'Available' ? t('status_available') :
               vehicleStatus === 'In-Use' ? t('status_inUse') :
               t('status_maintenance')}
            </span>
          </div>
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
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('vehicleStatus') || 'Status'}</span>
            <span className={`font-bold inline-flex items-center gap-1.5 text-sm ${
              vehicleStatus === 'Available' ? 'text-emerald-700' :
              vehicleStatus === 'In-Use' ? 'text-blue-700' :
              'text-amber-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                vehicleStatus === 'Available' ? 'bg-emerald-500' :
                vehicleStatus === 'In-Use' ? 'bg-blue-500' :
                'bg-amber-500'
              }`} />
              {vehicleStatus === 'Available' ? t('status_available') :
               vehicleStatus === 'In-Use' ? t('status_inUse') :
               t('status_maintenance')}
            </span>
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
        <div className="space-y-4 mb-8 max-h-[460px] overflow-y-auto pr-2">
          {vehicleOilLogs.length > 0 ? (
            vehicleOilLogs.map(log => {
              const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters, vehicle.id, vehicleOilLogs, [vehicle], log.id, log.date, vehicleOilLogs);
              const currentOdo = parseOdometer(log.mileage);
              return (
                <div key={log.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm hover:border-emerald-400 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-bold text-emerald-700">{formatDate(log.date)}</span>
                      <span className="text-xs text-gray-500 ms-2">{formatTime(log.time)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingOilLog(log)}
                        className="flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-2 py-1 rounded-md transition shadow-xs"
                        title={t('editOilLog') || t('edit')}
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        {t('edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCardLog(log)}
                        className="flex items-center gap-1 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2.5 py-1 rounded-md transition shadow-xs"
                      >
                        <PrinterIcon className="h-3.5 w-3.5" />
                        {t('viewOilDetails') || t('print')}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-gray-50 p-2 rounded-lg">
                    <p className="text-gray-600"><strong>{t('driver')}:</strong> {log.driverName}</p>
                    <p className="text-gray-600">
                      <strong>{t('currentOdometer') || t('mileage')}:</strong>{' '}
                      <span className="font-mono font-bold text-emerald-700">{currentOdo.toLocaleString()} KM</span>
                    </p>
                  </div>

                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">{t('oilTypes')}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {log.oilTypes.map((ot, i) => (
                        <span key={i} className="bg-emerald-100 text-emerald-900 text-xs px-2 py-0.5 rounded font-bold">
                          {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">{t('filters')}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {log.filters.map((f, i) => (
                        <span key={i} className="bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded font-bold">
                          {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Next Due Odometer Quick Schedule */}
                  <div className="mt-3 pt-2 border-t border-gray-100 bg-emerald-50/50 p-2 rounded-lg">
                    <p className="text-[10px] font-black uppercase text-emerald-900 mb-1.5 flex justify-between">
                      <span>{t('nextDueSchedule') || 'Next Due Schedule'}:</span>
                      <span className="text-emerald-700 font-bold">قراءة العداد القادمة</span>
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
                      {schedule.map(item => (
                        <div key={item.id} className="bg-white p-1.5 rounded border border-emerald-200 flex flex-col justify-between">
                          <span className="text-[10px] text-gray-700 font-medium truncate">
                            {language === 'ar' ? item.nameAr : item.defaultName}
                          </span>
                          {item.id === 'airFilter' || item.asPerRequired ? (
                            <span className="font-bold text-blue-900 text-[10px] mt-0.5 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
                              {language === 'ar' ? 'حسب الحاجة' : 'As Per Required'}
                            </span>
                          ) : (
                            <span className="font-mono font-black text-emerald-800 text-xs mt-0.5">
                              {item.nextOdo.toLocaleString()} <span className="text-[9px] font-sans text-gray-500">KM</span>
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {log.remarks && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-700 italic">"{log.remarks}"</p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center py-6 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">{language === 'ar' ? 'لا يوجد سجل تغيير زيت' : 'No oil change history found'}</p>
          )}
        </div>
      )}

      {selectedCardLog && (
        <OilChangeCardModal
          log={selectedCardLog}
          vehicle={vehicle}
          allLogs={oilLogs}
          onClose={() => setSelectedCardLog(null)}
          onUpdate={(updated) => {
            setSelectedCardLog(updated);
          }}
        />
      )}

      {editingOilLog && (
        <EditOilLogModal
          log={editingOilLog}
          onClose={() => setEditingOilLog(null)}
          onSuccess={(updated) => {
            if (selectedCardLog && selectedCardLog.id === updated.id) {
              setSelectedCardLog(updated);
            }
            setEditingOilLog(null);
          }}
        />
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
