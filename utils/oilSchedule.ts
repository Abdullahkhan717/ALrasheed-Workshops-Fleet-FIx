import type { OilLog, Vehicle } from '../types';
import { parseDate } from './formatters';

export interface OilScheduleItem {
  id: 'engineOil' | 'gearOil' | 'deffranceOil' | 'oilFilter' | 'dieselFilter' | 'airFilter';
  nameKey: string;
  defaultName: string;
  nameAr: string;
  intervalKm: number;
  currentOdo: number;
  nextOdo: number;
  wasChanged: boolean;
  type: 'oil' | 'filter';
  note?: string;
}

/**
 * Parses raw mileage string into a clean positive integer.
 * e.g., "100", "20,000 KM", "100250" -> 100, 20000, 100250
 */
export const parseOdometer = (mileageStr: string | number | undefined): number => {
  if (typeof mileageStr === 'number') return Math.max(0, Math.floor(mileageStr));
  if (!mileageStr) return 0;
  const cleaned = String(mileageStr).replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
};

/**
 * Normalizes vehicle identification string for fuzzy matching
 */
export const normalizeVehicleKey = (val: string | undefined): string => {
  if (!val) return '';
  return String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Checks if two vehicle identifiers or log vehicleIds belong to the same vehicle.
 */
export const areSameVehicle = (
  vehIdA: string | undefined,
  vehIdB: string | undefined,
  vehicles: Vehicle[] = []
): boolean => {
  if (!vehIdA || !vehIdB) return false;
  if (vehIdA === vehIdB) return true;

  const keyA = normalizeVehicleKey(vehIdA);
  const keyB = normalizeVehicleKey(vehIdB);
  if (keyA && keyB && keyA === keyB) return true;

  const findMatch = (key: string, raw: string) => {
    return vehicles.find(v => {
      if (v.id === raw || normalizeVehicleKey(v.id) === key) return true;
      if (v.vehicleNumber && normalizeVehicleKey(v.vehicleNumber) === key) return true;
      if (v.vehicleCompanyNumber && normalizeVehicleKey(v.vehicleCompanyNumber) === key) return true;
      const combined = normalizeVehicleKey(`${v.vehicleCompanyNumber || ''}${v.vehicleNumber || ''}`);
      if (combined && combined === key) return true;
      const full = normalizeVehicleKey(`${v.vehiclesType || ''}${v.vehicleCompanyNumber || ''}${v.vehicleNumber || ''}`);
      if (full && (full === key || key.includes(combined) || combined.includes(key))) return true;
      return false;
    });
  };

  const vA = findMatch(keyA, vehIdA);
  const vB = findMatch(keyB, vehIdB);

  if (vA && vB && vA.id === vB.id) return true;
  if (vA && (vA.id === vehIdB || normalizeVehicleKey(vA.id) === keyB || normalizeVehicleKey(vA.vehicleNumber) === keyB)) return true;
  if (vB && (vB.id === vehIdA || normalizeVehicleKey(vB.id) === keyA || normalizeVehicleKey(vB.vehicleNumber) === keyA)) return true;

  return false;
};

/**
 * Checks if a specific oil or filter item was serviced in a log.
 */
export const checkServiceChanged = (
  itemId: 'engineOil' | 'gearOil' | 'deffranceOil' | 'oilFilter' | 'dieselFilter' | 'airFilter',
  oilTypes: string[] = [],
  filters: string[] = []
): boolean => {
  const check = (list: string[], ids: string[]) => {
    if (!Array.isArray(list)) return false;
    return list.some(item => {
      const lower = String(item || '').trim().toLowerCase();
      if (lower === 'nooil' || lower === 'nooilchange' || lower === 'no oil') return false;
      return ids.some(id => lower.includes(id.toLowerCase()));
    });
  };

  switch (itemId) {
    case 'engineOil':
      return check(oilTypes, ['engineoil', 'engine', 'ماكينة', 'ماتور', 'محرك']);
    case 'gearOil':
      return check(oilTypes, ['gearoil', 'gear', 'قير']);
    case 'deffranceOil':
      return check(oilTypes, ['deffranceoil', 'differential', 'deffrance', 'دفرنش', 'دفريشن']);
    case 'oilFilter':
      return check(filters, ['oilfilter', 'oil filter', 'فلتر زيت', 'فلتر الزيت']);
    case 'dieselFilter':
      return check(filters, ['dieselfilter', 'diesel', 'fuel', 'ديزل', 'وقود']);
    case 'airFilter':
      return check(filters, ['airfilter', 'air', 'هواء', 'فلتر هواء', 'فلتر الهواء']);
    default:
      return false;
  }
};

/**
 * Calculates the exact next service odometer readings based on the current mileage,
 * services performed in this log, and prior historical records of the same vehicle.
 *
 * Rules:
 * - When an item IS changed in the current service:
 *   Next Odometer = currentOdo + intervalKm.
 * - When an item IS NOT changed in the current service:
 *   Next Odometer stays fixed according to the PREVIOUS service where it WAS changed!
 *   (e.g., if Gear Oil was changed at 20,100 KM, its next due remains 80,100 KM,
 *   even if later at 22,100 KM only Engine Oil is changed).
 */
export const calculateOilSchedule = (
  mileageStr: string | number | undefined,
  oilTypes: string[] = [],
  filters: string[] = [],
  vehicleId?: string,
  allLogs: OilLog[] = [],
  vehicles: Vehicle[] = [],
  currentLogId?: string,
  currentDate?: string
): OilScheduleItem[] => {
  const currentOdo = parseOdometer(mileageStr);

  const isEngineOil = checkServiceChanged('engineOil', oilTypes, filters);
  const isOilFilter = checkServiceChanged('oilFilter', oilTypes, filters);
  const isDieselFilter = checkServiceChanged('dieselFilter', oilTypes, filters);
  const isGearOil = checkServiceChanged('gearOil', oilTypes, filters);
  const isAirFilter = checkServiceChanged('airFilter', oilTypes, filters);
  const isDeffranceOil = checkServiceChanged('deffranceOil', oilTypes, filters);

  // Filter and sort vehicle historical logs
  let vehicleLogs: OilLog[] = [];
  if (vehicleId && Array.isArray(allLogs) && allLogs.length > 0) {
    vehicleLogs = allLogs.filter(log => areSameVehicle(log.vehicleId, vehicleId, vehicles));
  }

  const sortedLogs = [...vehicleLogs].sort((a, b) => {
    const odoA = parseOdometer(a.mileage);
    const odoB = parseOdometer(b.mileage);
    if (odoA !== odoB) return odoA - odoB;
    const dateA = parseDate(a.date).getTime() || 0;
    const dateB = parseDate(b.date).getTime() || 0;
    return dateA - dateB;
  });

  const getNextOdo = (
    itemId: 'engineOil' | 'gearOil' | 'deffranceOil' | 'oilFilter' | 'dieselFilter' | 'airFilter',
    intervalKm: number,
    wasChangedInCurrent: boolean
  ): { nextOdo: number; wasChanged: boolean; note?: string } => {
    // 1. If changed in THIS service, next reading is currentOdo + intervalKm
    if (wasChangedInCurrent) {
      return {
        nextOdo: currentOdo + intervalKm,
        wasChanged: true
      };
    }

    // 2. If NOT changed, look back in prior logs for this vehicle
    const targetDate = currentDate ? (parseDate(currentDate).getTime() || Infinity) : Infinity;
    const priorLogs = sortedLogs.filter(log => {
      if (currentLogId && log.id === currentLogId) return false;
      const logOdo = parseOdometer(log.mileage);
      if (currentOdo > 0 && logOdo > currentOdo) return false;
      if (logOdo === currentOdo && currentLogId && log.id !== currentLogId) {
        const lDate = parseDate(log.date).getTime() || 0;
        if (lDate > targetDate) return false;
      }
      return true;
    });

    // Traverse backwards from most recent prior log
    for (let i = priorLogs.length - 1; i >= 0; i--) {
      const prior = priorLogs[i];
      const changedInPrior = checkServiceChanged(itemId, prior.oilTypes, prior.filters);
      if (changedInPrior) {
        const priorOdo = parseOdometer(prior.mileage);
        if (priorOdo > 0) {
          return {
            nextOdo: priorOdo + intervalKm,
            wasChanged: false,
            note: `Previous service at ${priorOdo.toLocaleString()} KM`
          };
        }
      }
    }

    // 3. If never changed in prior logs, but there is an initial base log for this vehicle
    if (priorLogs.length > 0) {
      const baseLog = priorLogs[0];
      const baseOdo = parseOdometer(baseLog.mileage);
      if (baseOdo > 0) {
        return {
          nextOdo: baseOdo + intervalKm,
          wasChanged: false,
          note: `Base initial at ${baseOdo.toLocaleString()} KM`
        };
      }
    }

    // 4. Fallback (initial first entry for vehicle)
    return {
      nextOdo: currentOdo + intervalKm,
      wasChanged: false
    };
  };

  const engineOilData = getNextOdo('engineOil', 20000, isEngineOil);
  const oilFilterData = getNextOdo('oilFilter', 20000, isOilFilter);
  const dieselFilterData = getNextOdo('dieselFilter', 40000, isDieselFilter);
  const gearOilData = getNextOdo('gearOil', 60000, isGearOil);
  const airFilterData = getNextOdo('airFilter', 60000, isAirFilter);
  const deffranceOilData = getNextOdo('deffranceOil', 100000, isDeffranceOil);

  return [
    {
      id: 'engineOil',
      nameKey: 'oilLog_engineOil',
      defaultName: 'Engine Oil',
      nameAr: 'زيت الماكينة (الماتور)',
      intervalKm: 20000,
      currentOdo,
      nextOdo: engineOilData.nextOdo,
      wasChanged: engineOilData.wasChanged,
      type: 'oil',
      note: engineOilData.note
    },
    {
      id: 'oilFilter',
      nameKey: 'oilLog_oilFilter',
      defaultName: 'Oil Filter',
      nameAr: 'فلتر الزيت',
      intervalKm: 20000,
      currentOdo,
      nextOdo: oilFilterData.nextOdo,
      wasChanged: oilFilterData.wasChanged,
      type: 'filter',
      note: oilFilterData.note
    },
    {
      id: 'dieselFilter',
      nameKey: 'oilLog_dieselFilter',
      defaultName: 'Fuel (Diesel) Filter',
      nameAr: 'فلتر الديزل (الوقود)',
      intervalKm: 40000,
      currentOdo,
      nextOdo: dieselFilterData.nextOdo,
      wasChanged: dieselFilterData.wasChanged,
      type: 'filter',
      note: dieselFilterData.note
    },
    {
      id: 'gearOil',
      nameKey: 'oilLog_gearOil',
      defaultName: 'Gear Oil',
      nameAr: 'زيت القير',
      intervalKm: 60000,
      currentOdo,
      nextOdo: gearOilData.nextOdo,
      wasChanged: gearOilData.wasChanged,
      type: 'oil',
      note: gearOilData.note
    },
    {
      id: 'airFilter',
      nameKey: 'oilLog_airFilter',
      defaultName: 'Air Filter',
      nameAr: 'فلتر الهواء',
      intervalKm: 60000,
      currentOdo,
      nextOdo: airFilterData.nextOdo,
      wasChanged: airFilterData.wasChanged,
      type: 'filter',
      note: airFilterData.note
    },
    {
      id: 'deffranceOil',
      nameKey: 'oilLog_deffranceOil',
      defaultName: 'Differential Oil',
      nameAr: 'زيت الدفرنش',
      intervalKm: 100000,
      currentOdo,
      nextOdo: deffranceOilData.nextOdo,
      wasChanged: deffranceOilData.wasChanged,
      type: 'oil',
      note: deffranceOilData.note
    }
  ];
};
