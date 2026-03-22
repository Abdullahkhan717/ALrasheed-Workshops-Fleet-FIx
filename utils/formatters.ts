export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    // If it's the Excel/Google Sheets "zero" date (1899-12-30), it's likely just time
    if (date.getFullYear() === 1899 && date.getMonth() === 11 && date.getDate() === 30) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${day}-${month}-${year}`;
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  try {
    let date: Date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else {
      const parts = timeStr.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      date = new Date();
      date.setHours(hours, minutes, 0, 0);
    }
    
    if (isNaN(date.getTime())) return timeStr;
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

export const formatVehicleInfo = (vehicle: any, t: (key: string) => string, vehicleId?: string) => {
  if (!vehicle) return `${t('unknownVehicle')} ${vehicleId ? `(${vehicleId})` : ''}`;
  const type = t(vehicle.vehiclesType || '');
  const companyNum = vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : '';
  const number = vehicle.vehicleNumber || '';
  return `${type} ${companyNum}${number}`;
};
