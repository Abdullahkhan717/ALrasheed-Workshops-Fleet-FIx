export interface OilScheduleItem {
  id: string;
  nameKey: string;
  defaultName: string;
  nameAr: string;
  intervalKm: number;
  currentOdo: number;
  nextOdo: number;
  wasChanged: boolean;
  type: 'oil' | 'filter';
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
 * Calculates the exact next service odometer readings based on the current mileage
 * and services performed in the log.
 * - Engine Oil: +20,000 km
 * - Oil Filter: +20,000 km
 * - Fuel (Diesel) Filter: +40,000 km
 * - Gear Oil: +60,000 km
 * - Air Filter: +60,000 km
 * - Differential Oil: +80,000 km
 */
export const calculateOilSchedule = (
  mileageStr: string | number | undefined,
  oilTypes: string[] = [],
  filters: string[] = []
): OilScheduleItem[] => {
  const currentOdo = parseOdometer(mileageStr);

  const checkChanged = (list: string[], identifiers: string[]): boolean => {
    if (!Array.isArray(list)) return false;
    return list.some(item => {
      const lower = String(item || '').trim().toLowerCase();
      return identifiers.some(id => lower.includes(id.toLowerCase()));
    });
  };

  const isEngineOil = checkChanged(oilTypes, ['engineoil', 'engine', 'ماكينة', 'ماتور', 'محرك']);
  const isOilFilter = checkChanged(filters, ['oilfilter', 'oil filter', 'فلتر زيت', 'فلتر الزيت']);
  const isDieselFilter = checkChanged(filters, ['dieselfilter', 'diesel', 'fuel', 'ديزل', 'وقود']);
  const isGearOil = checkChanged(oilTypes, ['gearoil', 'gear', 'قير']);
  const isAirFilter = checkChanged(filters, ['airfilter', 'air', 'هواء', 'فلتر هواء', 'فلتر الهواء']);
  const isDeffranceOil = checkChanged(oilTypes, ['deffranceoil', 'differential', 'deffrance', 'دفرنش', 'دفريشن']);

  return [
    {
      id: 'engineOil',
      nameKey: 'oilLog_engineOil',
      defaultName: 'Engine Oil',
      nameAr: 'زيت الماكينة (الماتور)',
      intervalKm: 20000,
      currentOdo,
      nextOdo: currentOdo + 20000,
      wasChanged: isEngineOil,
      type: 'oil'
    },
    {
      id: 'oilFilter',
      nameKey: 'oilLog_oilFilter',
      defaultName: 'Oil Filter',
      nameAr: 'فلتر الزيت',
      intervalKm: 20000,
      currentOdo,
      nextOdo: currentOdo + 20000,
      wasChanged: isOilFilter,
      type: 'filter'
    },
    {
      id: 'dieselFilter',
      nameKey: 'oilLog_dieselFilter',
      defaultName: 'Fuel (Diesel) Filter',
      nameAr: 'فلتر الديزل (الوقود)',
      intervalKm: 40000,
      currentOdo,
      nextOdo: currentOdo + 40000,
      wasChanged: isDieselFilter,
      type: 'filter'
    },
    {
      id: 'gearOil',
      nameKey: 'oilLog_gearOil',
      defaultName: 'Gear Oil',
      nameAr: 'زيت القير',
      intervalKm: 60000,
      currentOdo,
      nextOdo: currentOdo + 60000,
      wasChanged: isGearOil,
      type: 'oil'
    },
    {
      id: 'airFilter',
      nameKey: 'oilLog_airFilter',
      defaultName: 'Air Filter',
      nameAr: 'فلتر الهواء',
      intervalKm: 60000,
      currentOdo,
      nextOdo: currentOdo + 60000,
      wasChanged: isAirFilter,
      type: 'filter'
    },
    {
      id: 'deffranceOil',
      nameKey: 'oilLog_deffranceOil',
      defaultName: 'Differential Oil',
      nameAr: 'زيت الدفرنش',
      intervalKm: 80000,
      currentOdo,
      nextOdo: currentOdo + 80000,
      wasChanged: isDeffranceOil,
      type: 'oil'
    }
  ];
};
