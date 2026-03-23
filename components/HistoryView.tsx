import React, { useState } from 'react';
import type { Vehicle, RepairRequest, Workshop } from '../types';
import { JobCard } from './JobCard';
import { PrinterIcon, WhatsappIcon, DownloadIcon, EyeIcon } from './Icons';
import { downloadHistoryCSV } from '../utils/csvExport';
import { useTranslation } from '../hooks/useTranslation';
import { CompletionFormModal } from './CompletionFormModal';
import { SearchableVehicleSelect } from './SearchableVehicleSelect';
import * as XLSX from 'xlsx';
import { translateText } from '../services/translationService';
import { formatDate, formatTime, formatVehicleInfo, parseDate } from '../utils/formatters';

interface HistoryViewProps {
  vehicles: Vehicle[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  onUpdateRequest: (request: RepairRequest) => Promise<void>;
  selectedVehicleId?: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ vehicles, workshops, repairRequests, onUpdateRequest, selectedVehicleId: propSelectedVehicleId }) => {
  const [internalSelectedVehicleId, setInternalSelectedVehicleId] = useState('');
  const selectedVehicleId = propSelectedVehicleId !== undefined ? propSelectedVehicleId : internalSelectedVehicleId;
  const setSelectedVehicleId = propSelectedVehicleId !== undefined ? () => {} : setInternalSelectedVehicleId;
  
  const [requestToPrint, setRequestToPrint] = useState<RepairRequest | null>(null);
  const [requestToShare, setRequestToShare] = useState<RepairRequest | null>(null);
  const [requestToComplete, setRequestToComplete] = useState<RepairRequest | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'monthly'>('all');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<string | null>(null);

  const handleSaveCompletion = async (completedRequest: RepairRequest) => {
    await onUpdateRequest(completedRequest);
    setRequestToComplete(null);
  };

  const handleShare = (request: RepairRequest) => {
    setRequestToShare(request);
  };
  
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const filteredRequests = repairRequests
    .filter(req => {
      if (selectedVehicleId && req.vehicleId !== selectedVehicleId) {
        return false;
      }
      if (selectedWorkshopId && req.workshopId !== selectedWorkshopId) {
        return false;
      }
      if (timeFilter === 'monthly' && selectedMonth) {
        const reqDate = parseDate(req.dateIn);
        const reqMonth = !isNaN(reqDate.getTime()) ? reqDate.toISOString().slice(0, 7) : '';
        if (reqMonth !== selectedMonth) {
          return false;
        }
      }
      if (timeFilter === 'daily' && selectedDate) {
        const reqDate = parseDate(req.dateIn);
        const filterDate = parseDate(selectedDate);
        
        if (isNaN(reqDate.getTime()) || isNaN(filterDate.getTime())) {
          return false;
        }

        if (reqDate.getFullYear() !== filterDate.getFullYear() ||
            reqDate.getMonth() !== filterDate.getMonth() ||
            reqDate.getDate() !== filterDate.getDate()) {
          return false;
        }
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const vehicle = vehicles.find(v => v.id === req.vehicleId);
        const workshop = workshops.find(w => w.id === req.workshopId);
        
        const matchesVehicle = vehicle && (
          String(vehicle.vehicleNumber || '').toLowerCase().includes(query) ||
          String(vehicle.vehicleCompanyNumber || '').toLowerCase().includes(query) ||
          t(vehicle.vehiclesType).toLowerCase().includes(query)
        );
        
        const matchesDriver = String(req.driverName || '').toLowerCase().includes(query);
        const matchesId = String(req.id || '').toLowerCase().includes(query);
        const matchesWorkshop = workshop?.subName?.toLowerCase().includes(query);
        const matchesWorkDone = req.workDone?.toLowerCase().includes(query);
        const matchesPartsUsed = req.partsUsed?.toLowerCase().includes(query) || 
                               req.faults.some(f => f.partsUsed?.some(p => p.name?.toLowerCase().includes(query)));
        
        if (!matchesVehicle && !matchesDriver && !matchesId && !matchesWorkshop && !matchesWorkDone && !matchesPartsUsed) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => parseDate(b.dateIn).getTime() - parseDate(a.dateIn).getTime());

  const handleDownloadExcel = () => {
    if (filteredRequests.length === 0) {
      alert(t('alert_noHistoryToDownload'));
      return;
    }

    const dataToExport = filteredRequests.map(req => {
      const vehicle = vehicles.find(v => v.id === req.vehicleId);
      const workshop = workshops.find(w => w.id === req.workshopId);
      return {
        [t('jobCardNo')]: req.id,
        [t('workshopName')]: workshop?.subName || '',
        [t('vehicle')]: vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}` : '',
        [t('driver')]: req.driverName,
        [t('dateIn')]: req.dateIn,
        [t('timeIn')]: formatTime(req.timeIn),
        [t('dateOut')]: req.dateOut || '',
        [t('timeOut')]: req.timeOut ? formatTime(req.timeOut) : '',
        [t('applicationStatus')]: req.applicationStatus || 'Pending',
        [t('workStatus')]: req.status,
        [t('rejectionReason')]: req.rejectionReason || '',
        [t('workDone')]: req.workDone || '',
        [t('partsUsed')]: req.partsUsed || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'History');
    XLSX.writeFile(workbook, 'workshop_history.xlsx');
  };

  return (
    <div className="p-4 md:p-8">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('repairHistory')}</h1>
        <button
          onClick={handleDownloadExcel}
          className="w-full md:w-auto flex items-center justify-center bg-green-600 text-white px-4 py-2.5 rounded-lg shadow-md hover:bg-green-700 transition-colors font-medium"
        >
          <DownloadIcon className="h-5 w-5 me-2" />
          {t('downloadExcel')}
        </button>
      </div>
      
      {requestToPrint && (
        <JobCard 
            request={requestToPrint} 
            vehicle={vehicles.find(v => v.id === requestToPrint.vehicleId)!}
            workshops={workshops}
            onClose={() => setRequestToPrint(null)}
        />
      )}

      {requestToShare && (
        <JobCard 
            request={requestToShare} 
            vehicle={vehicles.find(v => v.id === requestToShare.vehicleId)!}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {propSelectedVehicleId === undefined && (
          <div>
            <SearchableVehicleSelect
              vehicles={vehicles}
              value={selectedVehicleId}
              onChange={setSelectedVehicleId}
              label={t('selectVehicleToFilter')}
              placeholder={t('allVehicles')}
            />
          </div>
        )}
        <div>
          <label htmlFor="workshop-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('selectWorkshop')}</label>
          <select
            id="workshop-select"
            value={selectedWorkshopId}
            onChange={e => setSelectedWorkshopId(e.target.value)}
            className="block w-full p-2.5 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            <option value="">{t('allWorkshops')}</option>
            {workshops.map(w => (
              <option key={w.id} value={w.id}>
                {w.subName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('timeFilter')}</label>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setTimeFilter('all')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all ${timeFilter === 'all' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('history_all')}
            </button>
            <button
              onClick={() => setTimeFilter('daily')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all ${timeFilter === 'daily' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('history_daily')}
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-md uppercase transition-all ${timeFilter === 'monthly' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('history_monthly')}
            </button>
          </div>
        </div>
        <div>
          {timeFilter === 'monthly' && (
            <>
              <label htmlFor="month-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('selectMonth')}</label>
              <input
                type="month"
                id="month-select"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="block w-full p-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </>
          )}
          {timeFilter === 'daily' && (
            <>
              <label htmlFor="date-select" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('selectDate')}</label>
              <input
                type="date"
                id="date-select"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="block w-full p-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </>
          )}
        </div>
        <div>
          <label htmlFor="search-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{t('search')}</label>
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder') || "Search..."}
            className="block w-full p-2.5 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req, index) => (
            <div key={`${req.id}-${index}`} className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-3 mb-1">
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{t('jobCardNo')} {req.id}</span>
                    <div className="flex gap-2 sm:hidden">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          req.applicationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          req.applicationStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                          req.applicationStatus === 'Rejected' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                      }`}>
                        {t(req.applicationStatus?.toLowerCase() as any || 'pending')}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                          req.applicationStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-green-100 text-green-800'
                      }`}>
                        {t(req.status.toLowerCase() as any)}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {!selectedVehicleId && getVehicleInfo(req.vehicleId)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dateIn')}: {formatDate(req.dateIn)}
                    {formatDate(req.dateIn) && formatTime(req.timeIn) && ' at '}
                    {formatTime(req.timeIn)}
                  </p>
                </div>
                
                <div className="hidden sm:flex items-center space-x-2 rtl:space-x-reverse">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                        req.applicationStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        req.applicationStatus === 'Accepted' ? 'bg-green-100 text-green-800' :
                        req.applicationStatus === 'Rejected' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {t(req.applicationStatus?.toLowerCase() as any || 'pending')}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                        req.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        req.applicationStatus === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                    }`}>
                      {t(req.status.toLowerCase() as any)}
                    </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24 flex-shrink-0">{t('purpose')}:</span>
                    <span className="font-medium text-gray-800">{t(`purpose_${req.purpose.toLowerCase().replace(/ /g, '_')}`)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24 flex-shrink-0">{t('driver')}:</span>
                    <span className="font-medium text-gray-800">{req.driverName}</span>
                  </div>
                  
                  {req.rejectionReason && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-xs">
                      <span className="font-bold">{req.applicationStatus === 'Rejected' ? t('rejectionReason') : t('cancellationReason')}:</span> {req.rejectionReason}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{req.status === 'Completed' ? t('resolvedFaults') : t('faults')}:</p>
                  <ul className="space-y-2">
                    {req.faults.map((f, fIndex) => (
                      <li key={`${f.id}-${fIndex}`} className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm text-gray-700">{f.description}</span>
                          <button 
                            onClick={async () => {
                              setTranslating(f.id);
                              const translation = await translateText(f.description);
                              setTranslatedTexts(prev => ({ ...prev, [f.id]: translation }));
                              setTranslating(null);
                            }}
                            className="text-[10px] font-bold text-green-600 uppercase hover:text-green-700 flex-shrink-0"
                            disabled={translating === f.id}
                          >
                            {translating === f.id ? t('translating') : t('translate')}
                          </button>
                        </div>
                        {translatedTexts[f.id] && <p className="text-xs text-gray-500 mt-1 italic border-t border-gray-200 pt-1">{translatedTexts[f.id]}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-6 pt-4 border-t border-gray-50 gap-3">
                <div className="flex gap-2">
                    <button onClick={() => setRequestToPrint(req)} className="flex-1 sm:flex-none flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors uppercase">
                        <PrinterIcon className="h-4 w-4 me-2" /> {t('pdf')}
                    </button>
                    <button onClick={() => handleShare(req)} className="flex-1 sm:flex-none flex items-center justify-center text-xs font-bold bg-green-50 text-green-700 px-4 py-2.5 rounded-lg hover:bg-green-100 transition-colors uppercase">
                        <WhatsappIcon className="h-4 w-4 me-2" /> {t('share')}
                    </button>
                </div>
                
                {req.status === 'Pending' ? (
                    <button onClick={() => setRequestToComplete(req)} className="w-full sm:w-auto bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 text-xs font-bold uppercase shadow-sm transition-colors">
                      {t('markAsCompleted')}
                    </button>
                ) : (
                    <div className="text-end">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('completedOn')}</p>
                       <p className="text-xs font-medium text-gray-600">{formatDate(req.dateOut)} {formatTime(req.timeOut)}</p>
                    </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{selectedVehicleId ? t('noHistoryForVehicle') : t('noRepairHistoryFound')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
