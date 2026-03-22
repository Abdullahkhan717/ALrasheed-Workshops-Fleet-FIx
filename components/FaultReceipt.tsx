import React, { useRef } from 'react';
import type { RepairRequest, Vehicle, Workshop, Fault } from '../types';
import { XMarkIcon, PrinterIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { formatDate, formatTime } from '../utils/formatters';

interface FaultReceiptProps {
  request: RepairRequest;
  vehicle: Vehicle;
  fault: Fault;
  faultIndex: number;
  workshop?: Workshop;
}

export const FaultReceipt: React.FC<FaultReceiptProps> = ({ 
  request, 
  vehicle, 
  fault, 
  faultIndex, 
  workshop
}) => {
  const { t, language } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const vehicleInfo = `${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`;

  return (
    <div 
      ref={printRef}
      className="bg-white shadow-lg print:shadow-none mx-auto border border-black"
      style={{ 
        width: '229.1mm', 
        height: '162.1mm', 
        padding: '10mm',
        boxSizing: 'border-box',
      }}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <style>{`
        @media print {
          @page {
            size: 229.1mm 162.1mm landscape;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
          }
          .print-container {
            width: 229.1mm !important;
            height: 162.1mm !important;
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
        }
        .receipt-table td, .receipt-table th {
          border: 1px solid black;
          padding: 4px 8px;
          vertical-align: middle;
        }
        .receipt-header {
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
          padding: 8px;
        }
        .section-header {
          text-align: center;
          font-weight: bold;
          background-color: #f3f4f6;
          text-transform: uppercase;
        }
        .label {
          font-weight: bold;
          width: 30%;
        }
        .value {
          width: 70%;
        }
        .signature-line {
          border-bottom: 1px solid black;
          height: 20px;
          margin-top: 10px;
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
              <td className="label">Request #-{request.id}-{faultIndex + 1}</td>
              <td colSpan={2}></td>
              <td className="text-end">الرقم الطلب-{request.id}-{faultIndex + 1}</td>
            </tr>
            <tr>
              <td className="label">Forman: {workshop?.foreman || 'Waseem khan'}</td>
              <td colSpan={2}></td>
              <td className="text-end">{formatDate(request.dateIn)} date of enter/تاريخ الدخول الورشة</td>
            </tr>
            <tr>
              <td className="label">Workshops: {workshop?.subName || request.toLocation}</td>
              <td colSpan={2}></td>
              <td className="text-end">{formatTime(request.timeIn)} Time of enter/وقت الدخول الورشة</td>
            </tr>
            <tr>
              <td className="label">{workshop?.subName || 'Workshop Service'}</td>
              <td colSpan={3}>
                <div className="flex justify-between">
                  <span>Assigned Mechanic / الميكانيك:</span>
                  <span className="font-bold">{fault.mechanicName || '-'}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                VEHICLE & REQUESTER DETAILS / تفاصيل المركبة والطالب
              </td>
            </tr>
            <tr>
              <td className="label">Requester Name / اسم الطالب:</td>
              <td colSpan={3} className="value">{request.driverName}</td>
            </tr>
            <tr>
              <td className="label">Vehicle Info / معلومات المركبة:</td>
              <td colSpan={3} className="value">{vehicleInfo}</td>
            </tr>
            <tr>
              <td className="label">Work in / تصليح في:</td>
              <td colSpan={3} className="value">{vehicleInfo}</td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                Reported Problem / الأعطال:
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="h-16 align-top">
                {fault.description}
              </td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                REMARKS & PARTS / ملاحظات وقطع الغيار
              </td>
            </tr>
            <tr>
              <td className="label">Remarks / ملاحظات:</td>
              <td colSpan={3} className="signature-line"></td>
            </tr>
            <tr>
              <td className="label">Parts Used:</td>
              <td colSpan={3} className="signature-line"></td>
            </tr>
            <tr>
              <td colSpan={4} className="section-header">
                AUTHORIZATION / الاعتمادات
              </td>
            </tr>
            <tr className="text-center">
              <td className="pt-8">
                <div className="border-t border-black pt-1">Requester Signature</div>
              </td>
              <td className="pt-8" colSpan={2}>
                <div className="border-t border-black pt-1">Forman Signature</div>
              </td>
              <td className="pt-8">
                <div className="border-t border-black pt-1">Workshop Manager</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
