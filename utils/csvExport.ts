import type { RepairRequest, Vehicle, Workshop } from '../types';

type TFunction = (key: string) => string;

export const downloadHistoryCSV = (
  requests: RepairRequest[],
  vehicles: Vehicle[],
  workshops: Workshop[],
  fileName: string = 'repair-history.csv',
  workshopId?: string,
  t?: TFunction
) => {
  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return (t ? t('unknown') : 'Unknown');
    const type = t ? t(vehicle.vehiclesType) : vehicle.vehiclesType;
    const company = vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : '';
    return `${type} ${company}${vehicle.vehicleNumber}`;
  };

  const csvRows: string[] = [];

  // Headers
  const headers = t ? [t('csv_job'), t('csv_vehicle'), t('csv_dateIn'), t('csv_mileage'), t('csv_status'), t('csv_workshop'), t('csv_mechanic'), t('csv_fault')] : ["Job #", "Vehicle", "Date In", "Mileage", "Status", "Workshop", "Mechanic", "Fault"];
  csvRows.push(headers.join(","));

  // Rows
  requests.forEach(req => {
    const vehicleInfo = getVehicleInfo(req.vehicleId);
    
    let faultsToExport = req.faults;
    if (workshopId) {
        faultsToExport = req.faults.filter(fault => fault.workshopId === workshopId);
    }
    
    if (faultsToExport.length === 0) {
      const row = [
        req.id,
        `"${vehicleInfo}"`,
        req.dateIn,
        req.mileage || '',
        req.status,
        '', // Workshop
        '', // Mechanic
        ''  // Fault
      ].join(",");
      csvRows.push(row);
    } else {
      faultsToExport.forEach(fault => {
        const workshop = workshops.find(w => w.id === fault.workshopId);
        const workshopName = workshop ? workshop.subName : 'N/A';
        const mechanicName = fault.mechanicName || '';

        const row = [
          req.id,
          `"${vehicleInfo}"`,
          req.dateIn,
          req.mileage || '',
          req.status,
          `"${workshopName}"`,
          `"${mechanicName}"`,
          `"${fault.description.replace(/"/g, '""')}"`
        ].join(",");
        csvRows.push(row);
      });
    }
  });

  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
