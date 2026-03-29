import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { Vehicle, Workshop, RepairRequest, OilLog, TyreLog, User, Settings, AppLocation, TransferRequest } from '../types';
import { getAllData, createRecord, updateRecord, deleteRecord } from '../services/googleSheetService';
import { generateId } from '../utils/idGenerator';

interface DataContextType {
  vehicles: Vehicle[];
  workshops: Workshop[];
  repairRequests: RepairRequest[];
  transferRequests: TransferRequest[];
  oilLogs: OilLog[];
  tyreLogs: TyreLog[];
  users: User[];
  locations: AppLocation[];
  settings: Settings | null;
  loading: boolean;
  error: Error | null;
  refetchData: () => Promise<void>;
  createData: (sheetName: string, payload: any) => Promise<any>;
  updateData: (sheetName: string, payload: any) => Promise<any>;
  deleteData: (sheetName: string, id: string) => Promise<any>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [oilLogs, setOilLogs] = useState<OilLog[]>([]);
  const [tyreLogs, setTyreLogs] = useState<TyreLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllData();
      
      const findKey = (search: string) => {
        const keys = Object.keys(data);
        const exact = keys.find(k => k === search);
        if (exact) return exact;
        const caseInsensitive = keys.find(k => k.toLowerCase() === search.toLowerCase());
        if (caseInsensitive) return caseInsensitive;
        const singularPlural = keys.find(k => k.toLowerCase().replace(/s$/, '') === search.toLowerCase().replace(/s$/, ''));
        if (singularPlural) return singularPlural;
        return null;
      };

      const vKey = findKey('Vehicles') || 'Vehicles';
      const wsKey = findKey('Workshops') || 'Workshops';
      const rrKey = findKey('RepairRequests') || 'RepairRequests';
      const olKey = findKey('OilLogs') || 'OilLogs';
      const tlKey = findKey('TyreLogs') || 'TyreLogs';
      const trKey = findKey('TransferRequests') || 'TransferRequests';
      const usKey = findKey('Users') || 'Users';
      const locKey = findKey('Locations') || 'Locations';
      const stKey = findKey('setting') || 'setting';

      console.log('Detected Keys:', { vKey, wsKey, rrKey, olKey, tlKey, trKey, usKey, locKey, stKey });
      console.log('Available Sheets in Data:', Object.keys(data));

      const rawVehicles = data[vKey] || [];
      const parsedVehicles = rawVehicles.map((v: any) => ({
        id: String(v.id || ''),
        vehiclesType: v.VehiclesType || v.vehiclesType || '',
        vehicleCompanyNumber: v.VehicleCompanyNumber || v.vehicleCompanyNumber || '',
        vehicleNumber: v.VehicleNumber || v.vehicleNumber || '',
        make: v.make || '',
        modelNumber: v.modelNumber || '',
        serialNumber: v.serialNumber || '',
        branchLocation: v.branchLocation || '',
        arabicName: v.arabicName || '',
        condition: v.condition || ''
      }));
      setVehicles(parsedVehicles);

      const rawWorkshops = data[wsKey] || [];
      const parsedWorkshops = rawWorkshops.map((w: any) => ({
        id: String(w.id || w.WorkshopID || w.workshopId || ''),
        subName: w.subName || w.SubName || '',
        foreman: w.foreman || w.Foreman || '',
        location: w.location || w.Location || '',
        mechanic: w.mechanic || w.Mechanic || '',
        arabicName: w.arabicName || w.ArabicName || ''
      }));
      setWorkshops(parsedWorkshops);
      
      const safeJsonParse = (str: string) => {
          if (!str) return [];
          try {
              return JSON.parse(str);
          } catch (e) {
              // Try to fix common malformed JSON from Google Sheets (doubled quotes)
              try {
                  // 1. Double quotes at the start of a string value: :""Text -> :"\"Text
                  let fixed = str.replace(/([:\[,])""([^,}\]])/g, '$1"\\"$2');
                  // 2. Double quotes at the end of a string value: Text"" -> Text\""
                  fixed = fixed.replace(/([^:\[,])""([,}\]])/g, '$1\\""$2');
                  // 3. Double quotes in the middle of a string value: Text""Text -> Text\"Text
                  fixed = fixed.replace(/([^:\[,])""([^,}\]])/g, '$1\\"$2');
                  
                  return JSON.parse(fixed);
              } catch (e2) {
                  // Fallback for very broken strings
                  try {
                      const fallback = str.replace(/""/g, '\\"').replace(/:\\"/g, ':""');
                      return JSON.parse(fallback);
                  } catch (e3) {
                      throw e;
                  }
              }
          }
      };

      const rawRequests = data[rrKey] || [];
      const parsedRequests = rawRequests.map((req: any) => {
          try {
            let faults = [];
            const rawFaults = req.faults;
            if (typeof rawFaults === 'string') {
                const trimmed = rawFaults.trim();
                if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                    faults = safeJsonParse(trimmed);
                } else if (trimmed) {
                    faults = [{ id: generateId(), description: trimmed, workshopId: req.workshopId || '' }];
                }
            } else if (Array.isArray(rawFaults)) {
                faults = rawFaults;
            }
            
            const finalFaults = Array.isArray(faults) ? faults : [faults];
            return { 
              ...req, 
              id: String(req.id || ''),
              vehicleId: String(req.vehicleId || req['Vehicle ID'] || ''),
              faults: finalFaults 
            } as RepairRequest;
          } catch (e) {
            console.error(`Failed to parse faults for request ${req.id}:`, req.faults);
            return { ...req, faults: [] } as RepairRequest; 
          }
        });
      setRepairRequests(parsedRequests);
      setTransferRequests(data[trKey] || []);
      
      const rawOilLogs = data[olKey] || [];
      const parsedOilLogs = rawOilLogs.map((log: any) => {
          try {
              let oilTypes = [];
              if (typeof log.oilTypes === 'string') {
                  const trimmed = log.oilTypes.trim();
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                      oilTypes = safeJsonParse(trimmed);
                  } else if (trimmed) {
                      oilTypes = [trimmed];
                  }
              } else if (Array.isArray(log.oilTypes)) {
                  oilTypes = log.oilTypes;
              }

              let filters = [];
              if (typeof log.filters === 'string') {
                  const trimmed = log.filters.trim();
                  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                      filters = safeJsonParse(trimmed);
                  } else if (trimmed) {
                      filters = [trimmed];
                  }
              } else if (Array.isArray(log.filters)) {
                  filters = log.filters;
              }

              return {
                  ...log,
                  id: String(log.id || ''),
                  vehicleId: String(log.vehicleId || log.VehicleId || log['Vehicle ID'] || log.TruckID || log['Truck ID'] || ''),
                  oilTypes: Array.isArray(oilTypes) ? oilTypes : [oilTypes],
                  filters: Array.isArray(filters) ? filters : [filters]
              } as OilLog;
          } catch (e) {
              console.error(`Failed to parse oil log ${log.id}:`, e);
              return { ...log, oilTypes: [], filters: [] } as OilLog;
          }
      }).filter((log, index, self) => index === self.findIndex((l) => l.id === log.id && l.id !== ''));
      setOilLogs(parsedOilLogs);
      
      const rawTyreLogs = data[tlKey] || [];
      const parsedTyreLogs = rawTyreLogs.map((log: any) => {
        let tyreDetails = [];
        const rawDetails = log.tyreDetails || log['Tyre Details'];
        if (typeof rawDetails === 'string') {
            const trimmed = rawDetails.trim();
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    tyreDetails = safeJsonParse(trimmed);
                } catch (e) {
                    console.error("Failed to parse tyreDetails JSON:", e);
                }
            }
        } else if (Array.isArray(rawDetails)) {
            tyreDetails = rawDetails;
        }

        // If no tyreDetails but we have flat fields, create a single detail entry
        if (tyreDetails.length === 0 && (log.tyreType || log['Tyre Type'] || log.serialNumber || log['Serial Number'])) {
          tyreDetails = [{
            id: generateId(),
            condition: log.tyreType || log['Tyre Type'] || '',
            size: log.tyreSize || log['Tyre Size'] || '',
            serialNumber: log.serialNumber || log['Serial Number'] || '',
            brand: log.brand || '',
            fromVehicle: log.fromVehicle || log['From Vehicle'] || '',
            remarks: log.remarks || ''
          }];
        }

        return {
          id: String(log.id || ''),
          vehicleId: String(log['Vehicle ID'] || log.vehicleId || ''),
          vehicleNumber: log['Vehicle Number'] || log.vehicleNumber,
          date: log.Date || log.date,
          time: log.Time || log.time,
          mileage: log.Mileage || log.mileage,
          driverName: log['Driver Name'] || log.driverName,
          workshopLocation: log['Workshop Location'] || log.workshopLocation,
          tyreDetails,
          mechanicName: log.mechanicName || log['Mechanic Name'] || ''
        } as TyreLog;
      });
      setTyreLogs(parsedTyreLogs);
      
      const rawUsers = data[usKey] || [];
      const parsedUsers = rawUsers.map((u: any) => {
        const id = String(u.id || u.userId || u['User ID'] || u.name || '').trim();
        const password = String(u.password || u.Password || u.pass || '').trim();
        const role = String(u.role || u.Role || 'user').trim();
        const status = String(u.status || u.Status || 'pending').trim();
        const location = u.location || u.Location || '';
        const fullName = u.fullName || u.FullName || '';
        return { id, password, role, status: status.toLowerCase(), location, fullName };
      });
      setUsers(parsedUsers);
      
      const rawLocations = data[locKey] || [];
      const parsedLocations = rawLocations.map((loc: any): AppLocation => ({
          ...loc,
          hasWorkshop: String(loc.hasWorkshop).toUpperCase() === 'TRUE' || loc.hasWorkshop === true || loc.hasWorkshop === 1 || loc.hasWorkshop === '1'
      }));
      setLocations(parsedLocations);
      
      // Handle setting tab (singular)
      const settingsData = data[stKey];
      if (Array.isArray(settingsData)) {
          const settingsObj: any = {};
          settingsData.forEach((item: any) => {
              if (item.Key) settingsObj[item.Key] = item.Value;
          });
          setSettings(settingsObj);
      } else {
          setSettings(settingsData || null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createData = async (sheetName: string, payload: any) => {
    const result = await createRecord(payload, sheetName);
    await fetchData();
    return result;
  };

  const updateData = async (sheetName: string, payload: any) => {
    const result = await updateRecord(payload, sheetName);
    await fetchData();
    return result;
  };

  const deleteData = async (sheetName: string, id: string) => {
    const result = await deleteRecord(id, sheetName);
    await fetchData();
    return result;
  };

  const value = {
    vehicles,
    workshops,
    repairRequests,
    transferRequests,
    oilLogs,
    tyreLogs,
    users,
    locations,
    settings,
    loading,
    error,
    refetchData: fetchData,
    createData,
    updateData,
    deleteData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
