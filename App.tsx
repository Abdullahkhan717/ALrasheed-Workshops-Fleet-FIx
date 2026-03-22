import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { VehicleList } from './components/VehicleList';
import { RepairRequestView } from './components/RepairRequestView';
import { HistoryView } from './components/HistoryView';

import type { Vehicle, Workshop, RepairRequest, User, TyreLog, AppLocation } from './types';
import { WrenchScrewdriverIcon, TruckIcon, BuildingStorefrontIcon, SearchIcon, Bars3Icon } from './components/Icons';
import { PendingRequestsList } from './components/PendingRequestsList';
import { WorkshopList } from './components/WorkshopList';
import { CompletedRequestsList } from './components/CompletedRequestsList';
import { JobCard } from './components/JobCard';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';

import { useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { formatVehicleInfo } from './utils/formatters';
import { useTranslation } from './hooks/useTranslation';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { OilLogView } from './components/OilLogView';
import { OilLogHistoryView } from './components/OilLogHistoryView';
import { OilChangeAlert } from './components/OilChangeAlert';
import { VehicleDetailsView } from './components/VehicleDetailsView';
import { LocationList } from './components/LocationList';
import { TransferFormModal } from './components/TransferFormModal';
import { TransferList } from './components/TransferList';
import { TransferHistory } from './components/TransferHistory';
import { TyreLogHistoryView } from './components/TyreLogHistoryView';
import { getAllData, createRecord, updateRecord, deleteRecord } from './services/googleSheetService';
import { generateId } from './utils/idGenerator';

type View = 'dashboard' | 'fleet' | 'request' | 'history' | 'pending' | 'workshops' | 'completed' | 'admin' | 'oilLog' | 'locations' | 'transfers' | 'outsourcedLog' | 'tyreLogs' | 'myVehicles' | 'oilChangeAlert';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [lastJobCardNumber, setLastJobCardNumber] = useState<string>('TR262000');

  const [searchVehicleQuery, setSearchVehicleQuery] = useState('');
  const [searchTyreQuery, setSearchTyreQuery] = useState('');
  const [tyreSearchHistoryQuery, setTyreSearchHistoryQuery] = useState('');
  const [initialLocationFilter, setInitialLocationFilter] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'details' | 'repair' | 'oil'>('details');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isTyreSearchFocused, setIsTyreSearchFocused] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [foundRequest, setFoundRequest] = useState<RepairRequest | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [transferVehicle, setTransferVehicle] = useState<Vehicle | null>(null);
  const [historyTab, setHistoryTab] = useState<'repair' | 'transfer' | 'oil' | 'tyre'>('repair');
  const [selectedHistoryVehicleId, setSelectedHistoryVehicleId] = useState('');
  const [searchHistoryVehicleQuery, setSearchHistoryVehicleQuery] = useState('');
  const [isHistorySearchFocused, setIsHistorySearchFocused] = useState(false);
  const [lastBackPressTime, setLastBackPressTime] = useState(0);
  const [prefilledTyreData, setPrefilledTyreData] = useState<{ id: string, condition: string, size: string, serialNumber: string, brand: string, fromVehicleId: string }[] | undefined>(undefined);
  const [prefilledRequestType, setPrefilledRequestType] = useState<'repair' | 'oil' | 'tyre' | undefined>(undefined);


  const { language } = useLanguage();
  const { t } = useTranslation();

  const handleSetActiveView = (view: View) => {
    if (view !== activeView) {
      window.history.pushState({ view }, '');
      setActiveView(view);
      if (view !== 'request') {
        setPrefilledTyreData(undefined);
        setPrefilledRequestType(undefined);
      }
    }
  };

  useEffect(() => {
    // Initial state
    window.history.replaceState({ view: 'dashboard' }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view);
      } else {
        // If we're at the root and user goes back, show warning
        if (activeView === 'dashboard') {
          const now = Date.now();
          if (now - lastBackPressTime < 2000) {
            // If double tapped within 2 seconds, exit (or just show final alert)
            if (window.confirm(t('confirmExit'))) {
              // In a real app, we might call an exit API
            }
          } else {
            setLastBackPressTime(now);
            alert(t('doubleTapToExit'));
            // Push state back to prevent exit
            window.history.pushState({ view: 'dashboard' }, '');
          }
        } else {
          setActiveView('dashboard');
          window.history.pushState({ view: 'dashboard' }, '');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, t]);

  const { users, setUsers, currentUser } = useAuth();
  const {
    vehicles,
    workshops,
    repairRequests,
    transferRequests,
    oilLogs,
    tyreLogs,
    locations,
    settings,
    loading,
    error,
    refetchData,
    createData,
    updateData,
    deleteData,
  } = useData();

  useEffect(() => {
    if (repairRequests.length > 0) {
      const getNum = (id: string) => parseInt(id.replace(/\D/g, '')) || 0;
      const maxIdNum = Math.max(...repairRequests.map(r => getNum(r.id)));
      const currentLastNum = getNum(lastJobCardNumber);
      
      if (maxIdNum > currentLastNum) {
        setLastJobCardNumber(`TR${maxIdNum}`);
      }
    }
    if (settings && settings.lastJobCardNumber) {
      const settingNum = parseInt(settings.lastJobCardNumber.replace(/\D/g, ''));
      const currentLastNum = parseInt(lastJobCardNumber.replace(/\D/g, ''));
      if (!isNaN(settingNum) && settingNum > currentLastNum) {
        setLastJobCardNumber(settings.lastJobCardNumber);
      }
    }
  }, [repairRequests, settings]);



  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const handleVehicleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchVehicleQuery.trim()) return;

    const found = vehicles.some(v => 
      String(v.vehicleNumber || '').toLowerCase().includes(String(searchVehicleQuery || '').toLowerCase()) ||
      String(v.vehicleCompanyNumber || '').toLowerCase().includes(String(searchVehicleQuery || '').toLowerCase()) ||
      String(v.serialNumber || '').toLowerCase().includes(String(searchVehicleQuery || '').toLowerCase())
    );

    if (found) {
        handleSetActiveView('fleet');
    } else {
        alert(t('alert_vehicleNotFound', { query: searchVehicleQuery }));
        setSearchVehicleQuery('');
    }
  };

  const handleTyreSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTyreQuery.trim()) return;

    const found = tyreLogs.some(log => 
      log.tyreDetails?.some(td => td.serialNumber?.toLowerCase().includes(searchTyreQuery.toLowerCase()))
    );

    if (found) {
        setTyreSearchHistoryQuery(searchTyreQuery);
        handleSetActiveView('tyreLogs');
    } else {
        alert(t('alert_tyreNotFound', { query: searchTyreQuery }));
        setSearchTyreQuery('');
    }
  };

  const requestDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      setVehicleToDelete(vehicle);
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    try {
      await deleteData('Vehicles', vehicleToDelete.id);
      alert(t('alert_vehicleDeleted', { vehicleNumber: vehicleToDelete.vehicleNumber }));
      setVehicleToDelete(null); // Close modal
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
      alert('Failed to delete vehicle.');
    }
  };

  const cancelDeleteVehicle = () => {
    setVehicleToDelete(null);
  };

  const handleCreateWorkshop = async (workshop: Omit<Workshop, 'id'>) => {
    const newWorkshop = { ...workshop, id: generateId() };
    await createData('Workshops', newWorkshop);
  };

  const handleCreateVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    if (vehicles.some(v => v.serialNumber === vehicle.serialNumber)) {
       alert(t('alert_serialExists'));
       throw new Error('Serial number exists');
    }
    const newVehicle: Vehicle = { ...vehicle, id: generateId() };
    return await createData('Vehicles', newVehicle);
  };

  const handleTransferRequest = async (request: any) => {
    await createData('TransferRequests', {
      ...request,
      id: generateId(),
      status: 'Pending',
      requestDate: new Date().toISOString()
    });
  };

  const handleEditTyre = (log: TyreLog, tyreIndex: number) => {
    const tyre = log.tyreDetails[tyreIndex];
    setPrefilledTyreData([{
      id: generateId(),
      condition: tyre.condition,
      size: tyre.size,
      serialNumber: tyre.serialNumber,
      brand: tyre.brand || '',
      fromVehicleId: tyre.fromVehicleId || ''
    }]);
    setPrefilledRequestType('tyre');
    handleSetActiveView('request');
  };

  const handleTransferTyre = (log: TyreLog, tyreIndex: number) => {
    const tyre = log.tyreDetails[tyreIndex];
    setPrefilledTyreData([{
      id: generateId(),
      condition: 'Used',
      size: tyre.size,
      serialNumber: tyre.serialNumber,
      brand: tyre.brand || '',
      fromVehicleId: log.vehicleId // The vehicle it's coming FROM
    }]);
    setPrefilledRequestType('tyre');
    handleSetActiveView('request');
  };

  const handleUpdateRequest = async (updatedRequest: RepairRequest) => {
    // Construct payload with explicit key order to match sheet headers
    const payload = {
      id: updatedRequest.id,
      vehicleId: updatedRequest.vehicleId,
      driverName: updatedRequest.driverName,
      mileage: updatedRequest.mileage || '',
      purpose: updatedRequest.purpose,
      faults: JSON.stringify(updatedRequest.faults),
      dateIn: updatedRequest.dateIn,
      timeIn: updatedRequest.timeIn,
      status: updatedRequest.status,
      workshopId: updatedRequest.workshopId || '',
      dateOut: updatedRequest.dateOut || '',
      timeOut: updatedRequest.timeOut || '',
      workDone: updatedRequest.faults.map(f => f.workDone || '').filter(Boolean).join('; '),
      partsUsed: updatedRequest.faults.flatMap(f => f.partsUsed || []).map(p => `${p.name} (${p.quantity})`).join(', ')
    };
    await updateData('RepairRequests', payload);
  };


  const renderView = () => {
    switch (activeView) {
      case 'fleet':
        return <VehicleList 
            vehicles={vehicles} 
            addVehicle={handleCreateVehicle} 
            deleteVehicle={requestDeleteVehicle} 
            updateVehicle={(vehicle) => updateData('Vehicles', vehicle)} 
            onTransfer={(v) => setTransferVehicle(v)}
            initialSearchQuery={searchVehicleQuery}
            initialLocationFilter={initialLocationFilter}
            onNewRepairRequest={(id) => handleSetActiveView('request')}
        />;
      case 'myVehicles':
        return <VehicleList 
            vehicles={vehicles} 
            addVehicle={handleCreateVehicle} 
            deleteVehicle={requestDeleteVehicle} 
            updateVehicle={(vehicle) => updateData('Vehicles', vehicle)} 
            onTransfer={(v) => setTransferVehicle(v)}
            initialSearchQuery={searchVehicleQuery}
            initialLocationFilter={currentUser?.location || ''}
            onNewRepairRequest={(id) => handleSetActiveView('request')}
        />;
      case 'request':
        return <RepairRequestView 
            vehicles={vehicles} 
            workshops={workshops} 
            repairRequests={repairRequests}
            lastJobCardNumber={lastJobCardNumber}
            setLastJobCardNumber={setLastJobCardNumber}
            onAddVehicle={handleCreateVehicle}
            onAddWorkshop={handleCreateWorkshop}
            initialRequestType={prefilledRequestType}
            initialTyreData={prefilledTyreData}
        />;
      case 'history':
        return (
          <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('history')}</h1>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex border-b">
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'repair' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('repair')}
                >
                  {t('repairHistory')}
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'transfer' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('transfer')}
                >
                  {t('transferHistory')}
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'oil' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('oil')}
                >
                  {t('oilLogHistory')}
                </button>
                <button 
                  className={`px-6 py-3 text-sm font-medium ${historyTab === 'tyre' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setHistoryTab('tyre')}
                >
                  {t('tyreLogHistory')}
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('selectVehicleToFilter')}</label>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder={t('searchByVehicleOrTyreSerial')}
                      value={searchHistoryVehicleQuery}
                      onChange={(e) => setSearchHistoryVehicleQuery(e.target.value)}
                      onFocus={() => setIsHistorySearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsHistorySearchFocused(false), 200)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                    {isHistorySearchFocused && searchHistoryVehicleQuery.trim() && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                        <div 
                          className="p-3 border-b hover:bg-green-50 cursor-pointer text-gray-500 italic"
                          onClick={() => {
                            setSelectedHistoryVehicleId('');
                            setSearchHistoryVehicleQuery('');
                          }}
                        >
                          {t('allVehicles')}
                        </div>
                        {vehicles
                          .filter(v => 
                            String(v.vehicleNumber || '').toLowerCase().includes(searchHistoryVehicleQuery.toLowerCase()) ||
                            String(v.vehicleCompanyNumber || '').toLowerCase().includes(searchHistoryVehicleQuery.toLowerCase()) ||
                            String(v.serialNumber || '').toLowerCase().includes(searchHistoryVehicleQuery.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((v, index) => (
                            <div 
                              key={`${v.id}-${index}`} 
                              onClick={() => {
                                setSelectedHistoryVehicleId(v.id);
                                setSearchHistoryVehicleQuery(`${t(v.vehiclesType)} ${v.vehicleCompanyNumber ? `${v.vehicleCompanyNumber}-` : ''}${v.vehicleNumber}`);
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
                </div>
                {historyTab === 'repair' && <HistoryView vehicles={vehicles} workshops={workshops} repairRequests={repairRequests} onUpdateRequest={handleUpdateRequest} selectedVehicleId={selectedHistoryVehicleId} />}
                {historyTab === 'transfer' && <TransferHistory selectedVehicleId={selectedHistoryVehicleId} />}
                {historyTab === 'oil' && <OilLogHistoryView selectedVehicleId={selectedHistoryVehicleId} />}
                {historyTab === 'tyre' && (
                  <TyreLogHistoryView 
                    tyreLogs={tyreLogs} 
                    vehicles={vehicles} 
                    selectedVehicleId={selectedHistoryVehicleId} 
                    initialSearchQuery={tyreSearchHistoryQuery} 
                    onEditTyre={handleEditTyre}
                    onTransferTyre={handleTransferTyre}
                  />
                )}
              </div>
            </div>
          </div>
        );
      case 'pending':
        return <PendingRequestsList repairRequests={repairRequests.filter(r => r.status === 'Pending')} onUpdateRequest={handleUpdateRequest} vehicles={vehicles} workshops={workshops} />;
      case 'completed':
        return <CompletedRequestsList repairRequests={repairRequests.filter(r => r.status === 'Completed')} vehicles={vehicles} workshops={workshops} />;
      case 'workshops':
        return <WorkshopList workshops={workshops} locations={locations} onAddWorkshop={handleCreateWorkshop} repairRequests={repairRequests} vehicles={vehicles} onUpdateWorkshop={(workshop) => updateData('Workshops', workshop)} onDeleteWorkshop={(id) => deleteData('Workshops', id)} />;
      case 'admin':
        return <AdminPanel users={users} />;
      case 'oilLog':
        return <OilLogView />;
      case 'oilChangeAlert':
        return <OilChangeAlert />;
      case 'locations':
        return <LocationList onSelectLocation={(locName) => {
            setInitialLocationFilter(locName);
            setSearchVehicleQuery('');
            setActiveView('fleet');
        }} />;
      case 'transfers':
        return <TransferList />;
      case 'outsourcedLog':
        return <PendingRequestsList 
            repairRequests={repairRequests.filter(r => 
                r.applicationType === 'Outsourced / External Service' && 
                r.fromLocation === currentUser?.location &&
                r.fromLocation !== r.toLocation &&
                r.status === 'Pending'
            )} 
            onUpdateRequest={handleUpdateRequest} 
            vehicles={vehicles} 
            workshops={workshops} 
            title={t('outsourcedRepairLog')}
        />;
      case 'tyreLogs':
        return (
          <TyreLogHistoryView 
            tyreLogs={tyreLogs} 
            vehicles={vehicles} 
            initialSearchQuery={tyreSearchHistoryQuery} 
            onEditTyre={handleEditTyre}
            onTransferTyre={handleTransferTyre}
          />
        );
      case 'dashboard':
      default:
        const pendingRequests = repairRequests.filter(r => r.status === 'Pending').length;
        const completedRequests = repairRequests.filter(r => r.status === 'Completed').length;

        const handleSelectVehicle = (v: Vehicle) => {
            setSelectedVehicle(v);
            setSearchVehicleQuery('');
            setIsSearchFocused(false);
        };

        const handleWhatsAppShare = (vehicle: Vehicle) => {
            const details = [
              `*Vehicle Details*`,
              `${t('type')}: ${language === 'ar' && vehicle.arabicName ? vehicle.arabicName : t(vehicle.vehiclesType)}`,
              `${t('vehicleNumber')}: ${vehicle.vehicleNumber}`,
              `${t('make')}: ${vehicle.make}`,
              `${t('model')}: ${vehicle.modelNumber}`,
              `${t('serialNumber')}: ${vehicle.serialNumber}`,
              `${t('location')}: ${vehicle.branchLocation}`
            ].join('\n');
        
            const encodedMessage = encodeURIComponent(details);
            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
        };

        const isHomeBranch = (branchLocation: string) => {
            if (!currentUser) return false;
            if (currentUser.role === 'admin') return true;
            // Allow all users to edit/transfer if branch is "To Be Determined/يُحدد لاحقاً"
            if (branchLocation === 'To Be Determined/يُحدد لاحقاً') return true;
            return currentUser.location === branchLocation;
        };

        const receivedRepairRequests = repairRequests.filter(r => 
            r.status === 'Pending' && 
            r.toLocation === currentUser?.location && 
            r.fromLocation !== currentUser?.location &&
            r.applicationType === 'Outsourced / External Service'
        );

        const outsourcedRepairRequests = repairRequests.filter(r =>
            r.fromLocation === currentUser?.location &&
            r.fromLocation !== r.toLocation &&
            r.status !== 'Completed'
        );

        const receivedTransferRequests = transferRequests.filter(r => 
            r.status === 'Pending' && 
            r.toLocation === currentUser?.location
        );

        return (
            <div className="p-4 md:p-8">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">{t('dashboard_title')}</h1>

                {/* Notifications for received requests */}
                {(receivedRepairRequests.length > 0 || receivedTransferRequests.length > 0) && (
                    <div className="mb-6 space-y-2">
                        {receivedRepairRequests.length > 0 && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm animate-fade-in-up">
                                <div className="flex items-center">
                                    <WrenchScrewdriverIcon className="h-5 w-5 text-green-500 me-3" />
                                    <p className="text-green-700 font-bold">
                                        {language === 'ar' 
                                            ? `لديك ${receivedRepairRequests.length} طلبات إصلاح واردة جديدة!` 
                                            : `You have ${receivedRepairRequests.length} new incoming repair requests!`}
                                    </p>
                                </div>
                            </div>
                        )}
                        {receivedTransferRequests.length > 0 && (
                            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg shadow-sm animate-fade-in-up">
                                <div className="flex items-center">
                                    <TruckIcon className="h-5 w-5 text-green-500 me-3" />
                                    <p className="text-green-700 font-bold">
                                        {language === 'ar' 
                                            ? `لديك ${receivedTransferRequests.length} طلبات تحويل واردة جديدة!` 
                                            : `You have ${receivedTransferRequests.length} new incoming transfer requests!`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mb-8 bg-white p-6 rounded-xl shadow-md grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {!selectedVehicle ? (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-green-600 mb-1">{t('dashboard_findVehicle')}</h2>
                                <p className="text-gray-500 mb-4 text-sm font-medium">Search by Vehicle number or company number</p>
                                <form onSubmit={handleVehicleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 relative">
                                <div className="relative w-full">
                                  <input 
                                      type="search" 
                                      placeholder="Search by Vehicle or Company Number"
                                      value={searchVehicleQuery} 
                                      onChange={(e) => setSearchVehicleQuery(e.target.value)}
                                      onFocus={() => setIsSearchFocused(true)}
                                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  />
                                  {isSearchFocused && searchVehicleQuery.trim() && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                      {vehicles
                                        .filter(v => 
                                          String(v.vehicleNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                                          String(v.vehicleCompanyNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                                          String(v.serialNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase())
                                        )
                                        .sort((a, b) => {
                                          const aV = String(a.vehicleNumber || '').toLowerCase();
                                          const bV = String(b.vehicleNumber || '').toLowerCase();
                                          const query = String(searchVehicleQuery || '').toLowerCase();
                                          if (aV === query && bV !== query) return -1;
                                          if (bV === query && aV !== query) return 1;
                                          if (aV.startsWith(query) && !bV.startsWith(query)) return -1;
                                          if (bV.startsWith(query) && !aV.startsWith(query)) return 1;
                                          return 0;
                                        })
                                        .slice(0, 10)
                                        .map((v, index) => (
                                          <div 
                                            key={`${v.id}-${index}`} 
                                            onClick={() => handleSelectVehicle(v)}
                                            className="p-3 border-b hover:bg-green-50 cursor-pointer"
                                          >
                                            <p className="font-semibold">
                                              {formatVehicleInfo(v, t)}
                                            </p>
                                            <p className="text-sm text-gray-500">{v.serialNumber}</p>
                                          </div>
                                        ))
                                      }
                                      {vehicles.filter(v => 
                                          String(v.vehicleNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                                          String(v.vehicleCompanyNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase()) ||
                                          String(v.serialNumber || '').toLowerCase().includes(searchVehicleQuery.toLowerCase())
                                        ).length === 0 && (
                                        <div className="p-3 text-center text-gray-500">
                                          {t('noVehicleFound')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button type="submit" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center shrink-0 font-bold">
                                    <SearchIcon className="h-5 w-5 me-2" />
                                    {t('search')}
                                </button>
                                </form>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold text-blue-600 mb-1">{t('dashboard_findTyre')}</h2>
                                <p className="text-gray-500 mb-4 text-sm font-medium">Search by Tyre Serial Number</p>
                                <form onSubmit={handleTyreSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 relative">
                                <div className="relative w-full">
                                  <input 
                                      type="search" 
                                      placeholder="Enter Tyre Serial Number"
                                      value={searchTyreQuery} 
                                      onChange={(e) => setSearchTyreQuery(e.target.value)}
                                      onFocus={() => setIsTyreSearchFocused(true)}
                                      onBlur={() => setTimeout(() => setIsTyreSearchFocused(false), 200)}
                                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  {isTyreSearchFocused && searchTyreQuery.trim() && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                      {tyreLogs
                                        .filter(log => 
                                          log.tyreDetails?.some(td => td.serialNumber?.toLowerCase().includes(searchTyreQuery.toLowerCase()))
                                        )
                                        .slice(0, 10)
                                        .map((log, index) => {
                                          const matchingTyre = log.tyreDetails.find(td => td.serialNumber?.toLowerCase().includes(searchTyreQuery.toLowerCase()));
                                          return (
                                            <div 
                                              key={`${log.id}-${index}`} 
                                              onClick={() => {
                                                  setSearchTyreQuery(matchingTyre?.serialNumber || '');
                                                  handleSetActiveView('tyreLogs');
                                              }}
                                              className="p-3 border-b hover:bg-blue-50 cursor-pointer"
                                            >
                                              <p className="font-semibold">
                                                {matchingTyre?.serialNumber}
                                              </p>
                                              <p className="text-sm text-gray-500">{matchingTyre?.size} - {matchingTyre?.condition}</p>
                                              <p className="text-[10px] text-gray-400">{log.vehicleNumber} - {log.date}</p>
                                            </div>
                                          );
                                        })
                                      }
                                      {tyreLogs.filter(log => 
                                          log.tyreDetails?.some(td => td.serialNumber?.toLowerCase().includes(searchTyreQuery.toLowerCase()))
                                        ).length === 0 && (
                                        <div className="p-3 text-center text-gray-500">
                                          {t('noTyreFound')}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center shrink-0 font-bold">
                                    <SearchIcon className="h-5 w-5 me-2" />
                                    {t('search')}
                                </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <VehicleDetailsView
                            vehicle={selectedVehicle}
                            repairRequests={repairRequests}
                            oilLogs={oilLogs}
                            onBack={() => setSelectedVehicle(null)}
                            onEdit={(v) => {
                                setSearchVehicleQuery(v.vehicleNumber);
                                handleSetActiveView('fleet');
                            }}
                            onTransfer={(v) => setTransferVehicle(v)}
                            onDelete={(id) => requestDeleteVehicle(id)}
                            onWhatsAppShare={handleWhatsAppShare}
                            onNewRepairRequest={() => handleSetActiveView('request')}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    <button onClick={() => handleSetActiveView('pending')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-green-600 mb-2">{t('receivedRepairRequest')}</h3>
                        <p className="text-3xl font-black text-gray-800">{receivedRepairRequests.length}</p>
                    </button>
                    <button onClick={() => handleSetActiveView('outsourcedLog')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-orange-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-orange-600 mb-2">{t('outsourcedRepairLog')}</h3>
                        <p className="text-3xl font-black text-gray-800">{outsourcedRepairRequests.length}</p>
                    </button>
                    <button onClick={() => handleSetActiveView('transfers')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-green-600 mb-2">{t('receivedTransferRequests')}</h3>
                        <p className="text-3xl font-black text-gray-800">{receivedTransferRequests.length}</p>
                    </button>
                    <button onClick={() => {
                        setHistoryTab('oil');
                        handleSetActiveView('history');
                    }} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-teal-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-teal-600 mb-2">{t('oilLogHistory')}</h3>
                        <p className="text-3xl font-black text-gray-800">{oilLogs.length}</p>
                    </button>
                    <button onClick={() => handleSetActiveView('oilChangeAlert')} className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500 hover:bg-gray-50 transition text-start">
                        <h3 className="font-bold text-red-600 mb-2">{t('oilChangeAlert')}</h3>
                        <p className="text-3xl font-black text-gray-800">
                          {vehicles.filter(vehicle => {
                            const vehicleLogs = oilLogs.filter(log => log.vehicleId === vehicle.id);
                            if (vehicleLogs.length === 0) return true;
                            const latestLog = [...vehicleLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            const logDate = new Date(latestLog.date);
                            const tenDaysAgo = new Date();
                            tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                            return logDate < tenDaysAgo;
                          }).length}
                        </p>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                    <button onClick={() => handleSetActiveView('fleet')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <TruckIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_totalVehicles')}</p>
                            <p className="text-2xl font-bold text-gray-800">{vehicles.length}</p>
                        </div>
                    </button>
                    <button onClick={() => handleSetActiveView('pending')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_pendingRequests')}</p>
                            <p className="text-2xl font-bold text-gray-800">{pendingRequests}</p>
                        </div>
                    </button>
                     <button onClick={() => handleSetActiveView('completed')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <WrenchScrewdriverIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_completedRequests')}</p>
                            <p className="text-2xl font-bold text-gray-800">{completedRequests}</p>
                        </div>
                    </button>
                    <button onClick={() => handleSetActiveView('workshops')} className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 w-full text-start hover:bg-gray-50 transition">
                        <div className="bg-green-100 p-3 rounded-full">
                            <BuildingStorefrontIcon className="h-8 w-8 text-green-500" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">{t('dashboard_totalWorkshops')}</p>
                            <p className="text-2xl font-bold text-gray-800">{workshops.length}</p>
                        </div>
                    </button>
                </div>
            </div>
        );
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Loading Data...</h1>
                <p className="text-gray-600">Please wait while we fetch the latest information from your workshop records.</p>
            </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="p-8 text-center bg-white rounded-xl shadow-lg max-w-lg mx-4">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
                <p className="mb-6 text-gray-700">{error.message}</p>
                <button 
                    onClick={() => refetchData()} 
                    className="bg-green-600 text-white px-8 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
                >
                    Try Again
                </button>
                <div className="mt-8 text-start bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="font-mono text-xs text-gray-500">
                        Please check your Google Sheet URL and ensure the following tabs exist: 
                        Vehicles, RepairRequests, Workshops, OilLogs, Users, Locations
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={(view) => {
          if (view !== 'fleet') {
            setInitialLocationFilter('');
          }
          handleSetActiveView(view);
          setIsSidebarOpen(false);
        }} 
        onChangePasswordClick={() => {
          setIsChangePasswordModalOpen(true);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white shadow-sm h-16 flex items-center px-4 shrink-0 z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-800 ms-4">{t('repairSystem')}</h1>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          {renderView()}
        </main>
      </div>
      {foundRequest && (
        <JobCard 
            request={foundRequest}
            vehicle={vehicles.find(v => v.id === foundRequest.vehicleId) as Vehicle}
            workshops={workshops}
            onClose={() => setFoundRequest(null)}
        />
      )}
      {/* Search Tyre in Tyre Logs */}
      {activeView === 'tyreLogs' && searchTyreQuery && (
        <div className="hidden">
            {/* Tyre Log History search is handled within TyreLogHistoryView */}
        </div>
      )}
      {vehicleToDelete && (
        <DeleteConfirmationModal
          vehicle={vehicleToDelete}
          onConfirm={confirmDeleteVehicle}
          onCancel={cancelDeleteVehicle}
          associatedRequestsCount={repairRequests.filter(r => r.vehicleId === vehicleToDelete.id).length}
        />
      )}
      {isChangePasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsChangePasswordModalOpen(false)} />
      )}
      
      {transferVehicle && (
        <TransferFormModal 
          vehicle={transferVehicle} 
          onClose={() => setTransferVehicle(null)} 
          onSave={handleTransferRequest} 
        />
      )}
    </div>
  );
};




const App: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;