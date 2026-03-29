import React, { useState } from 'react';
import type { Vehicle, Workshop, RepairRequest, Fault } from '../types';
import { NewVehicleForm } from './NewVehicleForm';
import { NewWorkshopForm } from './NewWorkshopForm';
import { NewLocationForm } from './NewLocationForm';
import { JobCard } from './JobCard';
import { DuplicateRequestModal } from './DuplicateRequestModal';
import { SearchableVehicleSelect } from './SearchableVehicleSelect';
import { FaultReceipt } from './FaultReceipt';
import { PlusIcon, TrashIcon, XMarkIcon, CheckIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { formatVehicleInfo } from '../utils/formatters';
import { generateId } from '../utils/idGenerator';

interface RepairRequestViewProps {
  vehicles: Vehicle[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  lastJobCardNumber: string;
  setLastJobCardNumber: React.Dispatch<React.SetStateAction<string>>;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | void>;
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => Promise<void>;
  initialRequestType?: 'repair' | 'oil' | 'tyre';
  initialTyreData?: { id: string, condition: string, size: string, serialNumber: string, brand: string, fromVehicleId: string }[];
}

export const RepairRequestView: React.FC<RepairRequestViewProps> = ({ 
  vehicles, 
  workshops, 
  repairRequests, 
  lastJobCardNumber, 
  setLastJobCardNumber, 
  onAddVehicle, 
  onAddWorkshop,
  initialRequestType,
  initialTyreData
}) => {
  const { createData, updateData, locations } = useData();
  const { currentUser } = useAuth();
  const { t, language } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [fultin, setFultin] = useState('Head');
  const [bodyid, setBodyid] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [mileage, setMileage] = useState('');
  const [purpose, setPurpose] = useState<'Repairing' | 'preparing for work' | 'General Checking' | 'Other' | 'Oil Change' | 'Tyre Change' | 'Passing'>(
    initialRequestType === 'tyre' ? 'Tyre Change' : (initialRequestType === 'oil' ? 'Oil Change' : 'Repairing')
  );
  const [requestType, setRequestType] = useState<'repair' | 'oil' | 'tyre'>(initialRequestType || 'repair');
  const [fromLocation, setFromLocation] = useState(currentUser?.location || '');
  const [toLocation, setToLocation] = useState(currentUser?.location || '');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [faults, setFaults] = useState<Fault[]>([{ id: generateId(), description: '', workshopId: '', mechanicName: '' }]);
  
  const [selectedOils, setSelectedOils] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [customOil, setCustomOil] = useState('');
  const [customFilter, setCustomFilter] = useState('');

  // Tyre Log specific state
  const [tyres, setTyres] = useState<{ id: string, condition: string, size: string, serialNumber: string, brand: string, fromVehicleId: string, remarks: string, isAddingNewBrand: boolean }[]>(
    initialTyreData?.map(t => ({ ...t, remarks: '', isAddingNewBrand: false })) || [{ id: generateId(), condition: '', size: '', serialNumber: '', brand: '', fromVehicleId: '', remarks: '', isAddingNewBrand: false }]
  );
  const [tyreMechanicName, setTyreMechanicName] = useState('');
  const [tyreWorkshopLocation, setTyreWorkshopLocation] = useState('');
  const [tyreRequesterName, setTyreRequesterName] = useState('');
  const [tyreMileage, setTyreMileage] = useState('');
  
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [jobCardRequest, setJobCardRequest] = useState<RepairRequest | null>(null);
  const [jobCardVehicle, setJobCardVehicle] = useState<Vehicle | null>(null);

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
  const [customTime, setCustomTime] = useState(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [pendingRequestForDupCheck, setPendingRequestForDupCheck] = useState<RepairRequest | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [receiptsToPrint, setReceiptsToPrint] = useState<{ request: RepairRequest, fault: Fault, index: number }[]>([]);
  
  const handleAddFault = () => {
    if (faults.length < 10) {
      setFaults([...faults, { id: generateId(), description: '', workshopId: '', mechanicName: '' }]);
    }
  };

  const handleRemoveFault = (id: string) => {
    if (faults.length > 1) {
      setFaults(faults.filter(fault => fault.id !== id));
    }
  };

  const handleFaultFieldChange = (id: string, field: 'description' | 'workshopId' | 'mechanicName', value: string) => {
    if (field === 'workshopId' && value === 'addNew') {
        setShowWorkshopModal(true);
        return;
    }
    
    setFaults(faults.map(fault => {
      if (fault.id === id) {
        const updatedFault = { ...fault, [field]: value };
        
        // If workshop is changed, automatically set the mechanic name from workshop foreman
        if (field === 'workshopId') {
          const selectedWorkshop = workshops.find(w => w.id === value);
          if (selectedWorkshop) {
            updatedFault.mechanicName = selectedWorkshop.mechanic || selectedWorkshop.foreman;
          }
        }
        
        return updatedFault;
      }
      return fault;
    }));
  };
  
  const handleAddTyre = () => {
    setTyres([...tyres, { id: generateId(), condition: '', size: '', serialNumber: '', brand: '', fromVehicleId: '', remarks: '', isAddingNewBrand: false }]);
  };

  const handleRemoveTyre = (id: string) => {
    if (tyres.length > 1) {
      setTyres(tyres.filter(tyre => tyre.id !== id));
    }
  };

  const handleTyreFieldChange = (id: string, field: string, value: string | boolean) => {
    setTyres(tyres.map(tyre => tyre.id === id ? { ...tyre, [field]: value } : tyre));
  };
  
  const handleAddVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    try {
      const newVehicle = await onAddVehicle(vehicle);
      if (newVehicle) {
        setSelectedVehicleId(newVehicle.id);
        setShowVehicleModal(false);
        alert(t('alert_newVehicleAdded'));
      }
    } catch (error) {
      // Error is already alerted in the parent component
      console.error(error);
    }
  };
  
  const handleAddWorkshop = async (workshop: Omit<Workshop, 'id'>) => {
    try {
      await onAddWorkshop(workshop);
      setShowWorkshopModal(false);
      alert(t('alert_workshopAdded'));
    } catch (error) {
      console.error(error);
    }
  };
  
  const resetForm = () => {
    setSelectedVehicleId('');
    setSearchQuery('');
    setDriverName('');
    setMileage('');
    setPurpose('Repairing');
    setFaults([{ id: generateId(), description: '', workshopId: '', mechanicName: '' }]);
    setSelectedOils([]);
    setSelectedFilters([]);
    setCustomOil('');
    setCustomFilter('');
    setTyres([{ id: generateId(), condition: '', size: '', serialNumber: '', brand: '', fromVehicleId: '', remarks: '', isAddingNewBrand: false }]);
    setTyreMechanicName('');
    setSelectedWorkshopId('');
    setTyreWorkshopLocation('');
    setTyreRequesterName('');
    setTyreMileage('');
    setFultin('Head');
    setBodyid('');
    setEditingRequestId(null);
    setCustomDate(new Date().toISOString().split('T')[0]);
    setCustomTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVehicleId) {
      alert(t('alert_selectVehicle'));
      return;
    }
    if (!driverName.trim()) {
      alert(t('alert_enterDriverName'));
      return;
    }

    let finalFaults: Fault[] = [];
    let finalPurpose = purpose;

    if (requestType === 'oil') {
      const oilList = selectedOils.map(o => o === 'Other' ? customOil : o).filter(Boolean);
      const filterList = selectedFilters.map(f => f === 'Other' ? customFilter : f).filter(Boolean);
      
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      const truckId = vehicle ? (vehicle.vehicleCompanyNumber || vehicle.vehicleNumber) : selectedVehicleId;
      
      const now = new Date(`${customDate}T${customTime}`);
      const oilLogPayload = {
        id: generateId(),
        vehicleId: selectedVehicleId, // Internal ID for app logic
        VehicleId: selectedVehicleId, // Save internal ID as requested
        'Vehicle ID': selectedVehicleId,
        'Truck ID': truckId,
        truckId: truckId,
        TruckID: truckId,
        vehicleNumber: vehicle?.vehicleNumber || '',
        driverName,
        mileage,
        location: fromLocation || currentUser?.location || '',
        oilTypes: JSON.stringify(oilList),
        filters: JSON.stringify(filterList),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString()
      };

      createData('OilLogs', oilLogPayload)
        .then(() => {
          alert(t('oilLog_success') || 'Oil change record saved successfully.');
          resetForm();
        })
        .catch(error => {
          console.error("Failed to save oil log:", error);
          alert(t('alert_oilLogSaveFailed'));
        });
      return;
    }

    if (requestType === 'tyre') {
      if (!driverName.trim()) {
        alert(t('alert_enterDriverName'));
        return;
      }
      if (!toLocation) {
        alert(t('alert_selectLocation'));
        return;
      }

      const invalidTyre = tyres.find(tyre => 
        !tyre.condition || !tyre.size || !tyre.serialNumber || 
        (tyre.condition === 'Used' && !tyre.fromVehicleId)
      );

      if (invalidTyre) {
        alert(t('fillAllFields'));
        return;
      }

      const now = new Date(`${customDate}T${customTime}`);
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      
      const promises = tyres.map(tyre => {
        const fromVehicle = vehicles.find(v => v.id === tyre.fromVehicleId);
        const tyreLogPayload = {
          id: generateId(),
          'Vehicle ID': selectedVehicleId,
          'Date': now.toLocaleDateString(),
          'Time': now.toLocaleTimeString(),
          'Mileage': mileage,
          'Driver Name': driverName,
          'Workshop Location': toLocation,
          'Tyre Type': tyre.condition,
          'Tyre Size': tyre.size,
          'brand': tyre.brand,
          'Serial Number': tyre.serialNumber,
          'From Vehicle': fromVehicle ? formatVehicleInfo(fromVehicle, t) : '',
          'remarks': tyre.remarks || '',
          'Mechanic Name': tyreMechanicName
        };
        return createData('TyreLogs', tyreLogPayload);
      });

      Promise.all(promises)
        .then(() => {
          alert(t('tyreLog_success') || 'Tyre change record saved successfully.');
          resetForm();
        })
        .catch(error => {
          console.error("Failed to save tyre log:", error);
          alert(t('alert_tyreLogSaveFailed') || 'Failed to save tyre log');
        });
      return;
    }

    const faultsWithDescription = faults.filter(f => f.description.trim());
    if (faultsWithDescription.length === 0) {
      alert(t('alert_addFault'));
      return;
    }
    const hasMissingWorkshop = faultsWithDescription.some(f => !f.workshopId);
    if (hasMissingWorkshop) {
      alert(t('alert_selectWorkshopForEachFault'));
      return;
    }
    finalFaults = faultsWithDescription;

    if (editingRequestId) {
        const updatedRequestData = {
            driverName,
            purpose: finalPurpose,
            mileage,
            faults: finalFaults,
        };
        const originalRequest = repairRequests.find(r => r.id === editingRequestId);
        if (originalRequest) {
            const updatedRequest = { ...originalRequest, ...updatedRequestData, workshopId: updatedRequestData.faults[0]?.workshopId || originalRequest.workshopId };
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
              applicationStatus: updatedRequest.applicationStatus || 'Pending',
              workshopId: updatedRequest.workshopId || '',
              createdBy: updatedRequest.createdBy || currentUser?.id || '',
              fromLocation: updatedRequest.fromLocation || '',
              toLocation: updatedRequest.toLocation || '',
              rejectionReason: updatedRequest.rejectionReason || '',
              dateOut: updatedRequest.dateOut || '',
              timeOut: updatedRequest.timeOut || '',
              workDone: updatedRequest.faults.map(f => f.workDone || '').filter(Boolean).join('; '),
              partsUsed: updatedRequest.faults.flatMap(f => f.partsUsed || []).map(p => `${p.name} (${p.quantity})`).join(', ')
            };
            updateData('RepairRequests', payload)
                .then(() => {
                    alert(t('alert_jobCardUpdated', { jobCardId: editingRequestId }));
                    
                    // Identify new faults
                    const newFaults = finalFaults.filter(f => !originalRequest.faults.some(of => of.id === f.id));
                    if (newFaults.length > 0) {
                        const receipts = newFaults.map(f => ({
                            request: updatedRequest,
                            fault: f,
                            index: updatedRequest.faults.findIndex(uf => uf.id === f.id)
                        }));
                        resetForm();
                        setReceiptsToPrint(receipts);
                    } else {
                        setJobCardVehicle(vehicles.find(v => v.id === updatedRequest.vehicleId) || null);
                        setJobCardRequest(updatedRequest);
                        resetForm();
                    }
                })
                .catch(error => {
                    console.error("Failed to update repair request:", error);
                    alert('Failed to save the updated request to Google Sheet.');
                });
        }
    } else {
        const lastNumStr = lastJobCardNumber.replace(/\D/g, '');
        const nextNum = parseInt(lastNumStr || '0') + 1;
        const newJobCardNumber = `TR${nextNum}`;
        setLastJobCardNumber(newJobCardNumber);

        const now = new Date(`${customDate}T${customTime}`);
        const appType = fromLocation === toLocation ? 'Internal Repair Order (IRO)' : 'Outsourced / External Service';
        const isIRO = appType === 'Internal Repair Order (IRO)';
        
        const newRequest: RepairRequest = {
          id: String(newJobCardNumber),
          vehicleId: selectedVehicleId,
          driverName,
          mileage,
          purpose: finalPurpose,
          faults: finalFaults,
          dateIn: now.toISOString(), // Use ISO for consistent parsing
          timeIn: now.toISOString(),
          status: 'Pending',
          applicationStatus: isIRO ? 'Accepted' : 'Pending',
          workshopId: finalFaults[0]?.workshopId || '',
          createdBy: currentUser?.id || '',
          fromLocation: fromLocation || currentUser?.location || '',
          toLocation: toLocation || '',
          applicationType: appType,
          acceptedBy: isIRO ? 'System' : '',
          approvalDate: isIRO ? now.toISOString() : '',
          fultin,
          bodyid: fultin === 'Body' ? bodyid : '',
        };
        
        const payload = {
          id: String(newJobCardNumber),
          vehicleId: selectedVehicleId,
          driverName,
          mileage: mileage || '',
          purpose: finalPurpose,
          faults: JSON.stringify(finalFaults),
          dateIn: now.toISOString(),
          timeIn: now.toISOString(),
          status: 'Pending',
          applicationStatus: isIRO ? 'Accepted' : 'Pending',
          workshopId: finalFaults[0]?.workshopId || '',
          createdBy: currentUser?.id || '',
          fromLocation: fromLocation || currentUser?.location || '',
          toLocation: toLocation || '',
          applicationType: appType,
          rejectionReason: '',
          dateOut: '',
          timeOut: '',
          workDone: '',
          partsUsed: '',
          acceptedBy: isIRO ? 'System' : '',
          approvalDate: isIRO ? now.toISOString() : '',
          fultin,
          bodyid: fultin === 'Body' ? bodyid : '',
        };
        createData('RepairRequests', payload)
          .then(() => {
            alert(t('alert_jobCardCreated', { jobCardId: newJobCardNumber }));
            
            const receipts = newRequest.faults.map((f, idx) => ({
                request: newRequest,
                fault: f,
                index: idx
            }));
            resetForm();
            setReceiptsToPrint(receipts);
          })
          .catch(error => {
            console.error("Failed to create repair request:", error);
            alert('Failed to save the new request to Google Sheet.');
            // Rollback the job card number if the save fails
            setLastJobCardNumber(prev => (parseInt(prev) - 1).toString());
          });
    }
  };
  
  const searchResults = vehicles
    .filter(v => {
        // Restriction: User can only request for their own branch vehicle
        if (currentUser?.role !== 'admin') {
            const mergedBranches = ['Marhaba/المرحبہ', 'Al hasa/الاحساء'];
            const userLoc = currentUser?.location || '';
            const eqLoc = v.branchLocation || '';
            
            const isMerged = mergedBranches.includes(userLoc) && mergedBranches.includes(eqLoc);
            const isSame = userLoc === eqLoc;
            const isTBD = eqLoc === 'To Be Determined/يُحدد لاحقاً';

            if (!isMerged && !isSame && !isTBD) return false;
        }

        return String(v.vehicleNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
               String(v.vehicleCompanyNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
               String(v.serialNumber || '').toLowerCase().includes(String(searchQuery || '').toLowerCase()) ||
               String(v.arabicName || '').toLowerCase().includes(String(searchQuery || '').toLowerCase());
    })
    .sort((a, b) => {
      const aEq = String(a.vehicleNumber || '').toLowerCase();
      const bEq = String(b.vehicleNumber || '').toLowerCase();
      const query = String(searchQuery || '').toLowerCase();
      
      if (aEq === query && bEq !== query) return -1;
      if (bEq === query && aEq !== query) return 1;
      if (aEq.startsWith(query) && !bEq.startsWith(query)) return -1;
      if (bEq.startsWith(query) && !aEq.startsWith(query)) return 1;
      return 0;
    });

  const handleSelectVehicle = (vehicleId: string) => {
    const pendingRequests = repairRequests.filter(r => r.vehicleId === vehicleId && r.status === 'Pending');
    if (pendingRequests.length > 0) {
        setPendingRequestForDupCheck(pendingRequests[0]);
        setShowDuplicateModal(true);
    } else {
        setSelectedVehicleId(vehicleId);
        setSearchQuery('');
    }
    setIsSearchFocused(false);
  };

  const handleCreateNewRequest = () => {
    if (pendingRequestForDupCheck) {
        setSelectedVehicleId(pendingRequestForDupCheck.vehicleId);
    }
    setShowDuplicateModal(false);
    setPendingRequestForDupCheck(null);
    setSearchQuery('');
  };

  const handleAddFaultToExisting = () => {
    if (pendingRequestForDupCheck) {
        setEditingRequestId(pendingRequestForDupCheck.id);
        setSelectedVehicleId(pendingRequestForDupCheck.vehicleId);
        setDriverName(pendingRequestForDupCheck.driverName);
        setPurpose(pendingRequestForDupCheck.purpose as any);
        setFaults(pendingRequestForDupCheck.faults);
        setMileage(pendingRequestForDupCheck.mileage || '');
        setFromLocation(pendingRequestForDupCheck.fromLocation || '');
        setToLocation(pendingRequestForDupCheck.toLocation || '');
    }
    setShowDuplicateModal(false);
    setPendingRequestForDupCheck(null);
    setSearchQuery('');
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('newRepairRequest')}</h1>
      </div>

      {jobCardRequest && jobCardVehicle && (
        <JobCard 
            request={jobCardRequest} 
            vehicle={jobCardVehicle}
            workshops={workshops}
            onClose={() => {
                setJobCardRequest(null);
                setJobCardVehicle(null);
            }}
        />
      )}

      {receiptsToPrint.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-lg w-full max-w-5xl p-6 relative">
                <button 
                    onClick={() => setReceiptsToPrint([])}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10 print:hidden"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <h2 className="text-2xl font-bold">{t('printFaultReceipts')}</h2>
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 me-2" />
                        <span className="font-bold">{t('printAll')}</span>
                    </button>
                </div>
                <div className="space-y-8 print:space-y-0">
                    {receiptsToPrint.map((item, idx) => (
                        <div key={idx} className="border-b pb-8 last:border-0 relative">
                            <div className="mb-4 flex justify-between items-center">
                                <h3 className="text-lg font-semibold">{t('fault')} {idx + 1}</h3>
                            </div>
                            <FaultReceipt 
                                request={item.request}
                                vehicle={vehicles.find(v => v.id === item.request.vehicleId)!}
                                fault={item.fault}
                                faultIndex={item.index}
                                workshop={workshops.find(w => w.id === item.fault.workshopId)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {showDuplicateModal && pendingRequestForDupCheck && (
        <DuplicateRequestModal
            request={pendingRequestForDupCheck}
            vehicle={vehicles.find(v => v.id === pendingRequestForDupCheck.vehicleId)!}
            onClose={() => setShowDuplicateModal(false)}
            onCreateNew={handleCreateNewRequest}
            onAddFault={handleAddFaultToExisting}
        />
       )}


      <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-xl shadow-md space-y-8">
        
        <div className="border-b pb-8">
            {!selectedVehicle ? (
                <div>
                    <h2 className="text-xl font-bold text-green-600 mb-1">{t('step1_findVehicle')}</h2>
                    <p className="text-gray-500 mb-4 text-sm font-medium">{t('searchByVehicleOrSerial')}</p>
                    <div className="relative">
                        <div className="relative">
                          <input
                              type="text"
                              id="vehicleSearch"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onFocus={() => setIsSearchFocused(true)}
                              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                              placeholder={t('searchByVehicleOrSerial')}
                              className="block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <div className="absolute inset-y-0 end-0 flex items-center pe-3 pointer-events-none">
                            <PlusIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        {isSearchFocused && searchQuery.trim() && (
                             <div className="absolute top-full start-0 w-full bg-white border border-gray-300 rounded-b-md shadow-lg z-20 max-h-60 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    searchResults.map((vehicle, index) => (
                                        <div 
                                            key={`${vehicle.id}-${index}`} 
                                            onClick={() => handleSelectVehicle(vehicle.id)}
                                            className="p-3 border-b hover:bg-green-50 cursor-pointer"
                                        >
                                            <p className="font-semibold">
                                                {formatVehicleInfo(vehicle, t)}
                                            </p>
                                            <p className="text-sm text-gray-500">{vehicle.serialNumber}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-gray-500">
                                        {t('noVehicleFound')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                     <div className="text-center mt-4">
                        <button type="button" onClick={() => setShowVehicleModal(true)} className="text-sm text-green-600 hover:underline font-semibold flex items-center justify-center mx-auto">
                            <PlusIcon className="h-4 w-4 me-1" />
                            {t('cantFindVehicleLink')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-green-100 rounded-xl p-4 md:p-6 bg-green-50">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <h3 className="font-bold text-xl text-green-600 mb-1">{t('step1_selectedVehicle')}</h3>
                          <p className="text-xl md:text-2xl font-black text-green-900 uppercase break-all">
                            {formatVehicleInfo(selectedVehicle, t)}
                          </p>
                        </div>
                        <button type="button" onClick={resetForm} className="w-full sm:w-auto bg-white text-green-600 px-4 py-2 rounded-lg border border-green-200 shadow-sm hover:bg-green-100 transition font-bold text-sm">{t('changeVehicle')}</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('type')}</span>
                            <span className="font-bold text-gray-800">{t(selectedVehicle.vehiclesType)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('make')}</span>
                            <span className="font-bold text-gray-800">{selectedVehicle.make}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('model')}</span>
                            <span className="font-bold text-gray-800">{selectedVehicle.modelNumber}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('serialNumber')}</span>
                            <span className="font-bold text-gray-800">{selectedVehicle.serialNumber}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{t('location')}</span>
                            <span className="font-bold text-gray-800">{selectedVehicle.branchLocation}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {selectedVehicle && (
            <div className="pt-6">
                <h2 className="text-xl font-bold text-green-600 mb-4">{t('step2_requestType')}</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition ${requestType === 'repair' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestType" value="repair" checked={requestType === 'repair'} onChange={() => setRequestType('repair')} className="hidden" />
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{t('repairRequest')}</p>
                        </div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition ${requestType === 'oil' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestType" value="oil" checked={requestType === 'oil'} onChange={() => setRequestType('oil')} className="hidden" />
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{t('oilChangeRequest')}</p>
                        </div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition ${requestType === 'tyre' ? 'bg-green-50 border-green-500 ring-2 ring-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input type="radio" name="requestType" value="tyre" checked={requestType === 'tyre'} onChange={() => setRequestType('tyre')} className="hidden" />
                        <div className="text-center">
                            <p className="font-bold text-gray-800">{t('tyreChangeRequest')}</p>
                        </div>
                    </label>
                </div>
            </div>
        )}

        {selectedVehicle && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('fromLocation')}</label>
                    <select
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        disabled={currentUser?.role !== 'admin'}
                        className={`w-full p-2 border border-gray-300 rounded-md ${currentUser?.role !== 'admin' ? 'bg-gray-100' : 'bg-white'}`}
                    >
                        <option value="">{t('selectLocation')}</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.name}>{l.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('toLocation')}</label>
                    <select
                        value={toLocation}
                        onChange={(e) => {
                            if (e.target.value === 'addNew') {
                                setShowLocationModal(true);
                            } else {
                                setToLocation(e.target.value);
                            }
                        }}
                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                    >
                        <option value="">{t('selectLocation')}</option>
                        {locations
                            .filter(l => l.hasWorkshop)
                            .map(l => (
                                <option key={l.id} value={l.name}>{l.name}</option>
                            ))
                        }
                        <option value="addNew" className="text-green-600 font-bold">+ {t('addNewLocation')}</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
                    <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('time')}</label>
                    <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                    />
                </div>
            </div>
        )}
        {selectedVehicle && requestType === 'repair' && (
            <div className="space-y-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="driverName" className="block text-sm font-medium text-gray-700">{t('driverName')}</label>
                        <input
                            type="text"
                            id="driverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="mileage" className="block text-sm font-medium text-gray-700">{t('mileage')}</label>
                        <input
                            type="number"
                            id="mileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                
                <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">{t('purpose')}</label>
                    <select
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value as any)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="Repairing">{t('purpose_repairing')}</option>
                        <option value="preparing for work">{t('purpose_preparing_for_work')}</option>
                        <option value="General Checking">{t('purpose_general_checking')}</option>
                        <option value="Other">{t('purpose_other')}</option>
                        <option value="Passing">{t('purpose_passing')}</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="fultin" className="block text-sm font-medium text-gray-700">{t('fultin')}</label>
                        <select
                            id="fultin"
                            value={fultin}
                            onChange={(e) => setFultin(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="Head">{t('head')}</option>
                            <option value="Body">{t('body')}</option>
                        </select>
                    </div>
                    {fultin === 'Body' && (
                        <div>
                            <SearchableVehicleSelect
                                vehicles={vehicles}
                                value={bodyid}
                                onChange={setBodyid}
                                label={t('selectBody')}
                                placeholder={t('selectBody')}
                            />
                        </div>
                    )}
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-green-600">{t('step3_faultsReported')}</h3>
                        <button
                            type="button"
                            onClick={handleAddFault}
                            className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-100 transition flex items-center"
                        >
                            <PlusIcon className="h-4 w-4 me-1" />
                            {t('addFault')}
                        </button>
                    </div>
                    
                    <div className="space-y-6">
                        {faults.map((fault, index) => (
                            <div key={`${fault.id}-${index}`} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                                <div className="flex items-center mb-4">
                                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold me-3">{index + 1}</span>
                                    <h4 className="font-bold text-gray-700">{t('faultDetails')}</h4>
                                    {faults.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFault(fault.id)}
                                            className="ms-auto text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('workshop')}</label>
                                        <select
                                            value={fault.workshopId}
                                            onChange={(e) => handleFaultFieldChange(fault.id, 'workshopId', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                            required
                                        >
                                            <option value="">{t('selectWorkshop')}</option>
                                            {workshops
                                                .filter(w => !toLocation || w.location === toLocation)
                                                .map(w => (
                                                    <option key={w.id} value={w.id}>{language === 'ar' && w.arabicName ? w.arabicName : w.subName}</option>
                                                ))
                                            }
                                            <option value="addNew" className="text-green-600 font-bold">+ {t('addNewWorkshop')}</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('complaintDescription')}</label>
                                        <textarea
                                            placeholder={t('faultDescriptionPlaceholder')}
                                            value={fault.description}
                                            onChange={(e) => handleFaultFieldChange(fault.id, 'description', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            rows={2}
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('mechanicName')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('mechanicName')}
                                            value={fault.mechanicName || ''}
                                            onChange={(e) => handleFaultFieldChange(fault.id, 'mechanicName', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {selectedVehicle && requestType === 'oil' && (
            <div className="pt-6 border-t space-y-8">
                <h2 className="text-xl font-bold text-green-600 mb-4">{t('step3_oilChangeDetails')}</h2>
                <div>
                    <h3 className="text-xl font-bold text-green-600 mb-4">{t('oilLog_oilTypes')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { id: 'engineOil', label: t('oilLog_engineOil') },
                            { id: 'gearOil', label: t('oilLog_gearOil') },
                            { id: 'deffranceOil', label: t('oilLog_deffranceOil') },
                            { id: 'Other', label: t('oilLog_other') }
                        ].map(oil => (
                            <label key={oil.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedOils.includes(oil.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedOils([...selectedOils, oil.id]);
                                        else setSelectedOils(selectedOils.filter(o => o !== oil.id));
                                    }}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="ms-3 font-medium text-gray-700">{oil.label}</span>
                            </label>
                        ))}
                    </div>
                    {selectedOils.includes('Other') && (
                        <input
                            type="text"
                            placeholder={t('oilLog_addNew')}
                            value={customOil}
                            onChange={(e) => setCustomOil(e.target.value)}
                            className="mt-3 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-green-600 mb-4">{t('oilLog_filters')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { id: 'oilFilter', label: t('oilLog_oilFilter') },
                            { id: 'gearOilFilter', label: t('oilLog_gearOilFilter') },
                            { id: 'airFilter', label: t('oilLog_airFilter') },
                            { id: 'dieselFilter', label: t('oilLog_dieselFilter') },
                            { id: 'hydraulicFilter', label: t('oilLog_hydraulicFilter') },
                            { id: 'Other', label: t('oilLog_other') }
                        ].map(filter => (
                            <label key={filter.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={selectedFilters.includes(filter.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedFilters([...selectedFilters, filter.id]);
                                        else setSelectedFilters(selectedFilters.filter(f => f !== filter.id));
                                    }}
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                />
                                <span className="ms-3 font-medium text-gray-700">{filter.label}</span>
                            </label>
                        ))}
                    </div>
                    {selectedFilters.includes('Other') && (
                        <input
                            type="text"
                            placeholder={t('oilLog_addNew')}
                            value={customFilter}
                            onChange={(e) => setCustomFilter(e.target.value)}
                            className="mt-3 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="oilDriverName" className="block text-sm font-medium text-gray-700">{t('driverName')}</label>
                        <input
                            type="text"
                            id="oilDriverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="oilMileage" className="block text-sm font-medium text-gray-700">{t('mileage')}</label>
                        <input
                            type="number"
                            id="oilMileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                </div>
            </div>
        )}

        {selectedVehicle && requestType === 'tyre' && (
            <div className="pt-6 border-t space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="tyreDriverName" className="block text-sm font-medium text-gray-700">{t('driverName')}</label>
                        <input
                            type="text"
                            id="tyreDriverName"
                            value={driverName}
                            onChange={(e) => setDriverName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="tyreMileage" className="block text-sm font-medium text-gray-700">{t('mileage')}</label>
                        <input
                            type="number"
                            id="tyreMileage"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="tyreWorkshop" className="block text-sm font-medium text-gray-700">{t('workshop')}</label>
                        <select
                            id="tyreWorkshop"
                            value={selectedWorkshopId}
                            onChange={(e) => {
                                const wsId = e.target.value;
                                if (wsId === 'addNew') {
                                    setShowWorkshopModal(true);
                                } else {
                                    setSelectedWorkshopId(wsId);
                                    const ws = workshops.find(w => w.id === wsId);
                                    if (ws) {
                                        setTyreMechanicName(ws.mechanic || ws.foreman || '');
                                    }
                                }
                            }}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">{t('selectWorkshop')}</option>
                            {workshops
                                .filter(w => !toLocation || w.location === toLocation)
                                .map(w => (
                                    <option key={w.id} value={w.id}>{language === 'ar' && w.arabicName ? w.arabicName : w.subName}</option>
                                ))
                            }
                            <option value="addNew" className="text-green-600 font-bold">+ {t('addNewWorkshop')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="tyreMechanicName" className="block text-sm font-medium text-gray-700">{t('mechanicName')}</label>
                        <input
                            type="text"
                            id="tyreMechanicName"
                            value={tyreMechanicName}
                            onChange={(e) => setTyreMechanicName(e.target.value)}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-green-600">{t('step3_tyreDetails')}</h3>
                        <button
                            type="button"
                            onClick={handleAddTyre}
                            className="bg-green-50 text-green-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-100 transition flex items-center"
                        >
                            <PlusIcon className="h-4 w-4 me-1" />
                            {t('addTyre')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {tyres.map((tyre, index) => (
                            <div key={tyre.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                                <div className="flex items-center mb-4">
                                    <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold me-3">{index + 1}</span>
                                    <h4 className="font-bold text-gray-700">{t('tyreDetails')}</h4>
                                    {tyres.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTyre(tyre.id)}
                                            className="ms-auto text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('condition')}</label>
                                        <select
                                            value={tyre.condition}
                                            onChange={(e) => handleTyreFieldChange(tyre.id, 'condition', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                            required
                                        >
                                            <option value="">{t('selectCondition')}</option>
                                            <option value="New">{t('tyreType_NEW')}</option>
                                            <option value="Used">{t('tyreType_Used')}</option>
                                            <option value="Repaired">{t('tyreType_Repaired')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('brand')}</label>
                                        {tyre.isAddingNewBrand ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    className="flex-1 p-2 border border-green-300 rounded-md text-sm"
                                                    placeholder={t('enterNewBrand')}
                                                    onBlur={(e) => {
                                                        if (!e.target.value) {
                                                            handleTyreFieldChange(tyre.id, 'isAddingNewBrand', false);
                                                        }
                                                    }}
                                                    onChange={(e) => handleTyreFieldChange(tyre.id, 'brand', e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleTyreFieldChange(tyre.id, 'isAddingNewBrand', false);
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleTyreFieldChange(tyre.id, 'isAddingNewBrand', false)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value={tyre.brand}
                                                onChange={(e) => {
                                                    if (e.target.value === 'addNew') {
                                                        handleTyreFieldChange(tyre.id, 'isAddingNewBrand', true);
                                                    } else {
                                                        handleTyreFieldChange(tyre.id, 'brand', e.target.value);
                                                    }
                                                }}
                                                className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm"
                                                required
                                            >
                                                <option value="">{t('selectBrand')}</option>
                                                <option value="Bridgestone">{t('Bridgestone')}</option>
                                                <option value="Continental">{t('Continental')}</option>
                                                <option value="Goodyear">{t('Goodyear')}</option>
                                                <option value="Pirelli">{t('Pirelli')}</option>
                                                <option value="Hankook">{t('Hankook')}</option>
                                                <option value="BFGoodrich">{t('BFGoodrich')}</option>
                                                <option value="Triangle">{t('Triangle')}</option>
                                                <option value="Yokohama">{t('Yokohama')}</option>
                                                <option value="Falken">{t('Falken')}</option>
                                                <option value="Michelin">{t('Michelin')}</option>
                                                <option value="addNew" className="text-green-600 font-bold">+ {t('addNew')}</option>
                                                {tyre.brand && !['Bridgestone', 'Continental', 'Goodyear', 'Pirelli', 'Hankook', 'BFGoodrich', 'Triangle', 'Yokohama', 'Falken', 'Michelin'].includes(tyre.brand) && (
                                                    <option value={tyre.brand}>{tyre.brand}</option>
                                                )}
                                            </select>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('size')}</label>
                                        <input
                                            type="text"
                                            value={tyre.size}
                                            onChange={(e) => handleTyreFieldChange(tyre.id, 'size', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            placeholder={t('size')}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('serial')}</label>
                                        <input
                                            type="text"
                                            value={tyre.serialNumber}
                                            onChange={(e) => handleTyreFieldChange(tyre.id, 'serialNumber', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            placeholder={t('serial')}
                                            required
                                        />
                                    </div>
                                    {tyre.condition === 'Used' && (
                                        <div>
                                            <SearchableVehicleSelect
                                                vehicles={vehicles}
                                                value={tyre.fromVehicleId}
                                                onChange={(val) => handleTyreFieldChange(tyre.id, 'fromVehicleId', val)}
                                                label={`${t('fromVehicle')} (${t('required')})`}
                                                placeholder={t('selectFromVehicle')}
                                            />
                                        </div>
                                    )}
                                    <div className="sm:col-span-2 md:col-span-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('remarks')}</label>
                                        <textarea
                                            value={tyre.remarks}
                                            onChange={(e) => handleTyreFieldChange(tyre.id, 'remarks', e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                            placeholder={t('remarks')}
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {selectedVehicle && (
            <div className="pt-8 flex justify-end">
                <button
                    type="submit"
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-green-700 transition"
                >
                    {requestType === 'tyre' ? t('addTyre') : (editingRequestId ? t('updateJobCard') : t('createJobCard'))}
                </button>
            </div>
        )}
      </form>
      
      {showVehicleModal && <NewVehicleForm onClose={() => setShowVehicleModal(false)} onAddVehicle={handleAddVehicle} onUpdateVehicle={() => {}} vehicleToEdit={null} />}
      {showWorkshopModal && <NewWorkshopForm onClose={() => setShowWorkshopModal(false)} onAddWorkshop={handleAddWorkshop} onUpdateWorkshop={() => {}} workshopToEdit={null} initialLocation={toLocation} />}
      {showLocationModal && (
        <NewLocationForm 
            onClose={() => setShowLocationModal(false)} 
            onAddLocation={async (loc) => {
                await createData('Locations', { ...loc, hasWorkshop: true });
                setShowLocationModal(false);
                setToLocation(loc.name);
            }} 
            onUpdateLocation={async () => {}} 
            locationToEdit={null} 
        />
      )}
    </div>
  );
};
