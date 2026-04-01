import React, { useRef } from 'react';
import type { RepairRequest, Vehicle, Workshop, Fault } from '../types';
import { XMarkIcon, PrinterIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { formatDate, formatTime } from '../utils/formatters?v=3';

interface FaultReceiptProps {
  request: RepairRequest;
  vehicle: Vehicle;
  fault: Fault;
  faultIndex: number;
  workshop?: Workshop;
  vehicles?: Vehicle[];
}

export const FaultReceipt: React.FC<FaultReceiptProps> = ({ 
  request, 
  vehicle, 
  fault, 
  faultIndex, 
  workshop,
  vehicles = []
}) => {
  const { t, language } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const vehicleInfo = `${vehicle.vehiclesType} - ${vehicle.vehicleNumber}`;
  
  const bodyVehicle = request.bodyid ? vehicles.find(v => v.id === request.bodyid) : null;
  const bodyInfo = bodyVehicle 
    ? `${bodyVehicle.vehiclesType} - ${bodyVehicle.vehicleNumber}`
    : (request.fultin === 'Body' ? request.bodyid : request.fultin);

  const workshopName = language === 'ar' && workshop?.arabicName ? workshop.arabicName : (workshop?.subName || '-');

  return (
    <div 
      ref={printRef}
      className="bg-white shadow-lg print:shadow-none mx-auto border border-black"
      style={{ 
        width: '210mm', 
        minHeight: '148mm', 
        padding: '5mm',
        boxSizing: 'border-box'
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <style>{`
        @media print {
          @page {
            size: 210mm 148mm landscape;
            margin: 5mm;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 100% !important;
            height: 100% !important;
            max-width: 200mm;
            border: none !important;
            page-break-after: always;
          }
          .print-container:last-child {
            page-break-after: auto;
          }
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid black;
          table-layout: fixed;
        }
        .receipt-table td, .receipt-table th {
          border: 1px solid black;
          padding: 3px 6px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
          font-size: 0.8rem;
        }
        .receipt-header {
          text-align: center;
          font-size: 1.1rem;
          font-weight: bold;
          padding: 6px;
          background-color: #f3f4f6;
        }
        .section-header {
          text-align: center;
          font-weight: bold;
          background-color: #f3f4f6;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 3px;
        }
        .label {
          font-weight: bold;
          width: 30%;
          background-color: #f9fafb;
        }
        .value {
          width: 70%;
        }
        .signature-line {
          border-bottom: 1px solid black;
          height: 18px;
          margin-top: 6px;
        }
      `}</style>

      <div className="print-container h-full flex flex-col">
        <table className="receipt-table">
          <thead>
            <tr>
              <th colSpan={4} className="receipt-header">
                Workshop Repair Request طلب اصلاح بالورشه
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="label">Request # / رقم الطلب:</td>
              <td colSpan={3} className="value font-bold text-base">
                {request.id}-{faultIndex}
              </td>
            </tr>
            <tr>
              <td className="label">تاریخ الدخول الورشۃ / Date of Enter:</td>
              <td className="value">{formatDate(request.dateIn)}</td>
              <td className="label">وقت الدخول الورشۃ / Time of Enter:</td>
              <td className="value">{formatTime(request.timeIn)}</td>
            </tr>
            <tr>
              <td className="label">Workshop / الورشة:</td>
              <td className="value">{workshopName}</td>
              <td className="label">Location / الموقع:</td>
              <td className="value">{workshop?.location || '-'}</td>
            </tr>
            <tr>
              <td className="label">Assigned Mechanic / الميكانيك:</td>
              <td colSpan={3} className="value font-bold">{fault.mechanicName || '-'}</td>
            </tr>
            <tr>
              <td className="label">Requester Name / اسم الطالب:</td>
              <td colSpan={3} className="value">{request.driverName}</td>
            </tr>
            <tr>
              <td className="label">Vehicle Info / معلومات المركبة:</td>
              <td colSpan={3} className="value font-bold">{vehicleInfo}</td>
            </tr>
            <tr>
              <td className="label">Work in / تصليح في:</td>
              <td colSpan={3} className="value font-bold">
                {bodyInfo || '-'}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                Complaints / الأعطال
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="min-h-[50px] h-[50px] align-top text-sm overflow-hidden">
                {fault.description}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                REMARKS & AUTHORIZATION / الملاحظات والاعتمادات
              </td>
            </tr>
            <tr>
              <td className="label">Remarks / ملاحظات:</td>
              <td colSpan={3} className="signature-line"></td>
            </tr>
            <tr className="text-center">
              <td className="pt-4">
                <div className="border-t border-black pt-1 text-[10px]">Requester Signature</div>
              </td>
              <td className="pt-4" colSpan={2}>
                <div className="border-t border-black pt-1 text-[10px]">Forman Signature</div>
              </td>
              <td className="pt-4">
                <div className="border-t border-black pt-1 text-[10px]">Workshop Manager</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
