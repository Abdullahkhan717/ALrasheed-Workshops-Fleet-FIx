import React, { useState, useEffect, useMemo } from 'react';
import type { Vehicle } from '../types';
import { NewVehicleForm } from './NewVehicleForm';
import { PlusIcon, PencilIcon, TrashIcon, WhatsappIcon, ArrowsRightLeftIcon, EyeIcon, TruckIcon, WrenchScrewdriverIcon, CheckIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { VehicleDetailsView } from './VehicleDetailsView';
import { formatVehicleInfo } from '../utils/formatters';

interface VehicleListProps {
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | void>;
  deleteVehicle: (vehicleId: string) => void;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  onTransfer?: (vehicle: Vehicle) => void;
  initialSearchQuery?: string;
  initialLocationFilter?: string;
  onNewRepairRequest?: (vehicleId: string) => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ 
  vehicles, 
  addVehicle, 
  deleteVehicle, 
  updateVehicle, 
  onTransfer, 
  initialSearchQuery = '',
  initialLocationFilter = '',
  onNewRepairRequest
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState(String(initialSearchQuery || ''));
  const [locationFilter, setLocationFilter] = useState(initialLocationFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'Available' | 'In-Use' | 'Maintenance'>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { repairRequests, oilLogs } = useData();

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setLocationFilter(initialLocationFilter);
  }, [initialLocationFilter]);

  const isHomeBranch = (branchLocation: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (branchLocation === 'To Be Determined/يُحدد لاحقاً') return true;
    
    // Merged branches logic: Marhaba and Al Hasa
    const mergedBranches = ['Marhaba/المرحبہ', 'Al hasa/الاحساء'];
    if (mergedBranches.includes(currentUser.location) && mergedBranches.includes(branchLocation)) {
      return true;
    }
    
    return currentUser.location === branchLocation;
  };

  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      const result = await addVehicle(vehicle);
      if (result) {
        handleCloseModal();
        alert(t('alert_vehicleAdded'));
      }
    } catch (error) {
      console.error(error);
      alert(t('alert_vehicleAddFailed') || 'Failed to add vehicle. Please check your connection and Google Sheet setup.');
    }
  };
  
  const handleUpdateVehicle = async (updatedVehicle: Vehicle) => {
    try {
      await updateVehicle(updatedVehicle);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update vehicle:', error);
      alert(t('alert_vehicleUpdateFailed'));
    }
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };
  
  const handleShareVehicle = (vehicle: Vehicle) => {
    const details = [
      `*${t('vehicleDetails')}*`,
      `${t('type')}: ${t(vehicle.vehiclesType)}`,
      `${t('vehicleNumber')}: ${vehicle.vehicleNumber}`,
      `${t('make')}: ${vehicle.make}`,
      `${t('model')}: ${vehicle.modelNumber}`,
      `${t('serialNumber')}: ${vehicle.serialNumber}`,
      `${t('location')}: ${vehicle.branchLocation}`
    ].join('\n');

    const encodedMessage = encodeURIComponent(details);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Helper to determine status of any vehicle ('Available' | 'In-Use' | 'Maintenance')
  const getVehicleStatus = (vehicle: Vehicle): 'Available' | 'In-Use' | 'Maintenance' => {
    // 1. Check if vehicle is under active/pending repair in repairRequests
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
  };

  // Status counts respecting active location filter
  const statusCounts = useMemo(() => {
    const counts = {
      all: 0,
      Available: 0,
      'In-Use': 0,
      Maintenance: 0
    };
    const baseList = locationFilter 
      ? vehicles.filter(v => v.branchLocation === locationFilter)
      : vehicles;

    counts.all = baseList.length;
    baseList.forEach(v => {
      const s = getVehicleStatus(v);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [vehicles, locationFilter, repairRequests]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      // Location filter
      if (locationFilter && v.branchLocation !== locationFilter) return false;

      // Status filter ('Available' | 'In-Use' | 'Maintenance')
      if (statusFilter !== 'all') {
        const vStatus = getVehicleStatus(v);
        if (vStatus !== statusFilter) return false;
      }

      const query = String(searchQuery || '').toLowerCase().trim();
      if (!query) return true;
      
      const vNum = String(v.vehicleNumber || '').toLowerCase();
      const cNum = String(v.vehicleCompanyNumber || '').toLowerCase();
      const serial = String(v.serialNumber || '').toLowerCase();
      const arabicName = String(v.arabicName || '').toLowerCase();
      const type = t(v.vehiclesType).toLowerCase();
      
      // Check if any vehicle has an EXACT match for vehicle number, company number or serial
      const hasExactMatch = vehicles.some(e => 
          String(e.vehicleNumber || '').toLowerCase() === query || 
          String(e.vehicleCompanyNumber || '').toLowerCase() === query ||
          String(e.serialNumber || '').toLowerCase() === query
      );
      
      if (hasExactMatch) {
          return vNum === query || cNum === query || serial === query;
      }

      return vNum.includes(query) ||
             cNum.includes(query) ||
             type.includes(query) ||
             serial.includes(query) ||
             arabicName.includes(query);
    });
  }, [vehicles, locationFilter, statusFilter, searchQuery, repairRequests, t]);

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, locationFilter, statusFilter]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('vehicleList')}</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md bg-white text-sm"
          >
            <option value="">{t('allLocations') || 'All Locations'}</option>
            {Array.from(new Set(vehicles.map(e => e.branchLocation))).filter(Boolean).sort().map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder={t('searchByVehicleOrSerial')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full p-2 border border-gray-300 rounded-md ps-10"
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full start-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto min-w-[250px]">
                {vehicles
                  .filter(v => 
                    String(v.vehicleNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
                    String(v.vehicleCompanyNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
                    String(v.serialNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase())
                  )
                  .sort((a, b) => {
                    const aV = String(a.vehicleNumber || '').toLowerCase();
                    const bV = String(b.vehicleNumber || '').toLowerCase();
                    const aC = String(a.vehicleCompanyNumber || '').toLowerCase();
                    const bC = String(b.vehicleCompanyNumber || '').toLowerCase();
                    const query = String(searchQuery || '').toLowerCase();
                    if ((aV === query || aC === query) && (bV !== query && bC !== query)) return -1;
                    if ((bV === query || bC === query) && (aV !== query && aC !== query)) return 1;
                    return 0;
                  })
                  .slice(0, 10)
                  .map((v, index) => (
                    <div 
                      key={`${v.id}-${index}`} 
                      onClick={() => {
                        setSelectedVehicleId(v.id);
                        setSearchQuery('');
                        setIsSearchFocused(false);
                      }}
                      className="p-3 border-b hover:bg-green-50 cursor-pointer"
                    >
                      <p className="font-semibold">
                        {t(v.vehiclesType)} {v.vehicleCompanyNumber ? `${v.vehicleCompanyNumber}-` : ''}{v.vehicleNumber}
                      </p>
                      <p className="text-sm text-gray-500">{v.serialNumber}</p>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 me-2" />
            {t('addNewVehicle')}
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="mb-6 bg-white p-3 rounded-xl shadow-xs border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-sm font-medium scrollbar-thin">
            <span className="text-xs font-bold text-gray-500 uppercase px-1 hidden md:inline">
              {t('filterByStatus') || 'Filter by Status'}:
            </span>
            
            {/* All */}
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white shadow-sm ring-2 ring-gray-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{t('status_all') || 'All'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-gray-700 text-white font-bold' : 'bg-gray-200 text-gray-700 font-semibold'
              }`}>
                {statusCounts.all}
              </span>
            </button>

            {/* Available */}
            <button
              type="button"
              onClick={() => setStatusFilter('Available')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap ${
                statusFilter === 'Available'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'Available' ? 'bg-white' : 'bg-emerald-500'}`} />
              <span>{t('status_available') || 'Available'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'Available' ? 'bg-emerald-700 text-white font-bold' : 'bg-emerald-200/90 text-emerald-900 font-bold'
              }`}>
                {statusCounts.Available}
              </span>
            </button>

            {/* In-Use */}
            <button
              type="button"
              onClick={() => setStatusFilter('In-Use')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap ${
                statusFilter === 'In-Use'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'In-Use' ? 'bg-white' : 'bg-blue-500'}`} />
              <span>{t('status_inUse') || 'In-Use'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'In-Use' ? 'bg-blue-700 text-white font-bold' : 'bg-blue-200/90 text-blue-900 font-bold'
              }`}>
                {statusCounts['In-Use']}
              </span>
            </button>

            {/* Maintenance */}
            <button
              type="button"
              onClick={() => setStatusFilter('Maintenance')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-xs transition whitespace-nowrap ${
                statusFilter === 'Maintenance'
                  ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${statusFilter === 'Maintenance' ? 'bg-white' : 'bg-amber-500'}`} />
              <span>{t('status_maintenance') || 'Maintenance'}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'Maintenance' ? 'bg-amber-700 text-white font-bold' : 'bg-amber-200/90 text-amber-900 font-bold'
              }`}>
                {statusCounts.Maintenance}
              </span>
            </button>
          </div>

          {/* Clear active filter button */}
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs text-gray-500 hover:text-gray-800 underline font-medium self-end sm:self-center"
            >
              {t('resetFilters') || 'Clear Status Filter'}
            </button>
          )}
        </div>
      </div>

      {selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId) && (
        <div className="mb-8">
          <VehicleDetailsView
            vehicle={vehicles.find(v => v.id === selectedVehicleId)!}
            repairRequests={repairRequests}
            oilLogs={oilLogs}
            onBack={() => setSelectedVehicleId(null)}
            onEdit={handleEditClick}
            onTransfer={onTransfer || (() => {})}
            onDelete={deleteVehicle}
            onWhatsAppShare={handleShareVehicle}
            onNewRepairRequest={(id) => onNewRepairRequest?.(id)}
          />
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('type')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicleNumber')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('companyNumber')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('model')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location')}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('vehicleStatus') || 'Status'}</th>
                <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {currentVehicles.length > 0 ? (
                    currentVehicles.map((vehicle, index) => {
                    const status = getVehicleStatus(vehicle);
                    return (
                    <tr key={`${vehicle.id}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t(vehicle.vehiclesType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatVehicleInfo(vehicle, t)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.vehicleCompanyNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.modelNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.branchLocation}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        status === 'In-Use' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full me-1.5 ${
                          status === 'Available' ? 'bg-emerald-500' :
                          status === 'In-Use' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`} />
                        {status === 'Available' ? t('status_available') :
                         status === 'In-Use' ? t('status_inUse') :
                         t('status_maintenance')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setSelectedVehicleId(vehicle.id)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('details')}>
                                <EyeIcon className="h-5 w-5"/>
                            </button>
                            <button onClick={() => onNewRepairRequest?.(vehicle.id)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('select')}>
                                <CheckIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(vehicle.branchLocation) && (
                                <button onClick={() => handleEditClick(vehicle)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('editVehicle')}>
                                    <PencilIcon className="h-5 w-5"/>
                                </button>
                            )}
                            <button onClick={() => handleShareVehicle(vehicle)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('shareViaWhatsApp')}>
                                <WhatsappIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(vehicle.branchLocation) && (
                                <>
                                    <button onClick={() => onTransfer?.(vehicle)} className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-100 rounded-full" title={t('branchTransfer')}>
                                        <ArrowsRightLeftIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => deleteVehicle(vehicle.id)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('deleteVehicle')}>
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </td>
                    </tr>
                    );
                  })
                ) : (
                    <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-500">{t('noVehicleFound')}</td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {currentVehicles.length > 0 ? (
            currentVehicles.map((vehicle, index) => {
              const status = getVehicleStatus(vehicle);
              return (
                <div key={`${vehicle.id}-${index}`} className="bg-white rounded-xl shadow-md p-4 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t(vehicle.vehiclesType)}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  status === 'In-Use' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full me-1 ${
                                    status === 'Available' ? 'bg-emerald-500' :
                                    status === 'In-Use' ? 'bg-blue-500' :
                                    'bg-amber-500'
                                  }`} />
                                  {status === 'Available' ? t('status_available') :
                                   status === 'In-Use' ? t('status_inUse') :
                                   t('status_maintenance')}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                                {formatVehicleInfo(vehicle, t)}
                            </h3>
                        </div>
                        <div className="flex space-x-1">
                            <button onClick={() => setSelectedVehicleId(vehicle.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-full" title={t('viewDetails')}>
                                <EyeIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(vehicle.branchLocation) && (
                                <button onClick={() => handleEditClick(vehicle)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                                    <PencilIcon className="h-5 w-5"/>
                                </button>
                            )}
                            <button onClick={() => handleShareVehicle(vehicle)} className="p-2 text-green-600 hover:bg-green-50 rounded-full">
                                <WhatsappIcon className="h-5 w-5"/>
                            </button>
                            {isHomeBranch(vehicle.branchLocation) && (
                                <>
                                    <button onClick={() => onTransfer?.(vehicle)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-full">
                                        <ArrowsRightLeftIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => deleteVehicle(vehicle.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <p className="text-gray-500">{t('companyNumber')}</p>
                            <p className="font-medium">{vehicle.vehicleCompanyNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{t('model')}</p>
                            <p className="font-medium">{vehicle.modelNumber}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">{t('serialNumber')}</p>
                            <p className="font-medium">{vehicle.serialNumber}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500">{t('location')}</p>
                            <p className="font-medium">{vehicle.branchLocation}</p>
                        </div>
                    </div>
                    {isHomeBranch(vehicle.branchLocation) && (
                        <div className="pt-2 border-t border-gray-100">
                            <button 
                                onClick={() => onNewRepairRequest?.(vehicle.id)}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-bold flex items-center justify-center"
                            >
                                <WrenchScrewdriverIcon className="h-4 w-4 me-2" />
                                {t('newRepairRequest')}
                            </button>
                        </div>
                    )}
                </div>
              );
            })
        ) : (
            <div className="text-center py-10 bg-white rounded-xl shadow-md text-gray-500">
                {t('noVehicleFound')}
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {t('previous') || 'Previous'}
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first, last, and pages around current
                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              })
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 py-1 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md border ${currentPage === page ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
          </div>

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded-md border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          >
            {t('next') || 'Next'}
          </button>
        </div>
      )}

      {isModalOpen && (
        <NewVehicleForm
          onClose={handleCloseModal}
          onAddVehicle={handleAddVehicle}
          onUpdateVehicle={handleUpdateVehicle}
          vehicleToEdit={editingVehicle}
        />
      )}
    </div>
  );
};
