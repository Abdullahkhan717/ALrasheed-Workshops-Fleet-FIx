export interface Vehicle {
  id: string;
  vehiclesType: string;
  vehicleCompanyNumber: string;
  vehicleNumber: string;
  make: string;
  modelNumber: string;
  serialNumber: string;
  branchLocation: string;
  arabicName?: string;
  condition?: string;
}

export interface TyreDetail {
  id: string;
  condition: string;
  size: string;
  serialNumber: string;
  brand?: string;
  fromVehicle?: string;
  fromVehicleId?: string;
  remarks?: string;
}

export interface TyreLog {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  date: string;
  time: string;
  mileage: string;
  driverName: string;
  workshopLocation: string;
  tyreDetails: TyreDetail[];
  mechanicName?: string;
}

export interface OilLog {
  id: string;
  vehicleId: string;
  driverName: string;
  mileage: string;
  location: string;
  oilTypes: string[];
  filters: string[];
  date: string;
  time: string;
}

export interface Workshop {
  id: string;
  subName: string;
  foreman: string;
  location: string;
  mechanic?: string;
  arabicName?: string;
}

export interface Fault {
  id: string;
  description: string;
  workshopId: string;
  mechanicName?: string;
  workDone?: string;
  partsUsed?: { id: string; name: string; quantity: string }[];
}

export interface RepairRequest {
  id: string;
  vehicleId: string;
  driverName: string;
  mileage?: string;
  purpose: string;
  faults: Fault[];
  dateIn: string;
  timeIn: string;
  dateOut?: string;
  timeOut?: string;
  status: 'Pending' | 'Completed' | 'Cancelled' | 'Rejected' | 'Outsourced';
  applicationStatus: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  workshopId?: string;
  createdBy?: string;
  workDone?: string;
  partsUsed?: string;
  fromLocation?: string;
  toLocation?: string;
  applicationType?: string;
  rejectionReason?: string;
  acceptedBy?: string;
  approvalDate?: string;
  fultin?: string;
  bodyid?: string;
  outsourcedWorkshopName?: string;
}

export interface TransferRequest {
  id: string;
  vehicleId: string;
  fromLocation: string;
  toLocation: string;
  requesterName: string;
  reason: string;
  remarks: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Cancelled';
  dateRequested: string;
  dateAccepted?: string;
  acceptedBy?: string;
  rejectionReason?: string;
  requesterId?: string;
}

export interface AppLocation {
  id: string;
  name: string;
  type: string;
  siteManager: string;
  workshopManager: string;
  hasWorkshop: boolean;
}

export interface User {
  id: string;
  password: string;
  role: string;
  location?: string;
  status: string;
  fullName?: string;
}

export interface Settings {
  lastJobCardNumber?: string;
}
