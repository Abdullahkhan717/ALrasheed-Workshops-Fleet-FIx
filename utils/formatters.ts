console.log('Formatters v3 loaded');

export const parseDate = (dateStr: any) => {
  if (!dateStr) return new Date(NaN);
  
  if (dateStr instanceof Date) return dateStr;
  
  const str = String(dateStr);
  
  try {
    // Try parsing as ISO or YYYY-MM-DD
    // Check for YYYY-MM-DD format specifically to avoid UTC shift
    const ymdMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1]);
      const month = parseInt(ymdMatch[2]) - 1;
      const day = parseInt(ymdMatch[3]);
      return new Date(year, month, day, 0, 0, 0, 0); // Local midnight
    }

    // Try parsing MM-DD-YYYY or DD-MM-YYYY specifically
    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const p1 = parseInt(dmyMatch[1]);
      const p2 = parseInt(dmyMatch[2]);
      const year = parseInt(dmyMatch[3]);
      
      // If p1 > 12, it must be DD-MM-YYYY
      if (p1 > 12) {
        return new Date(year, p2 - 1, p1, 0, 0, 0, 0);
      }
      // If p2 > 12, it must be MM-DD-YYYY
      if (p2 > 12) {
        return new Date(year, p1 - 1, p2, 0, 0, 0, 0);
      }
      // Ambiguous, default to DD-MM-YYYY
      return new Date(year, p2 - 1, p1, 0, 0, 0, 0);
    }
    
    // Try parsing as full ISO
    let date = new Date(str);
    if (!isNaN(date.getTime()) && str.includes('T')) return date;

    return date;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date(NaN);
  }
};

export const formatDate = (dateStr: any) => {
  if (!dateStr) return '-';
  
  if (dateStr instanceof Date) {
    const year = dateStr.getFullYear();
    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
    const day = String(dateStr.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const str = String(dateStr);
  
  // If it's already in DD/MM/YYYY format, return it
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  const date = parseDate(str);
  if (isNaN(date.getTime())) return dateStr;
    
  // If it's the Excel/Google Sheets "zero" date (1899-12-30), it's likely just time
  if (date.getFullYear() === 1899 && date.getMonth() === 11 && date.getDate() === 30) {
    return '';
  }

  // Use local time for everything to match user's expectation
  // parseDate already handles YYYY-MM-DD and MM-DD-YYYY as local midnight
  // For ISO strings with 'T', parseDate returns the Date object which we now format as local
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${day}/${month}/${year}`;
};

export const formatTime = (timeStr: any) => {
  if (!timeStr) return '-';
  
  if (timeStr instanceof Date) {
    let hours = timeStr.getHours();
    const minutes = String(timeStr.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  }

  const str = String(timeStr);
  try {
    let date: Date;
    if (str.includes('T')) {
      date = new Date(str);
    } else {
      const parts = str.split(':');
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      date = new Date();
      date.setHours(hours, minutes, 0, 0);
    }
    
    if (isNaN(date.getTime())) return str;
    
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
