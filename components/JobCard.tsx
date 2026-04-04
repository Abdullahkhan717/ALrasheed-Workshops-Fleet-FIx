import React, { useRef, useEffect } from 'react';
import type { RepairRequest, Vehicle, Workshop } from '../types';
import { XMarkIcon, PrinterIcon, DownloadIcon, ShareIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

import { useData } from '../context/DataContext';

declare const jspdf: any;
declare const html2canvas: any;

import { formatDate, formatTime } from '../utils/formatters';

interface JobCardProps {
  request: RepairRequest;
  vehicle: Vehicle;
  workshops: Workshop[];
  onClose: () => void;
  onShare?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ request, vehicle: propVehicle, workshops, onClose, onShare }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();
  const { locations: allLocations, vehicles } = useData();
  
  // Try to find vehicle if not provided or use a placeholder
  const vehicle = propVehicle || vehicles.find(v => String(v.id) === String(request.vehicleId)) || {
    id: request.vehicleId,
    vehicleNumber: 'Unknown',
    vehiclesType: 'Unknown',
    make: 'Unknown',
    modelNumber: 'Unknown',
    serialNumber: 'Unknown',
    branchLocation: 'Unknown',
    arabicName: 'غير معروف'
  } as Vehicle;
  const handlePrint = () => {
    window.print();
  };

  const generatePdfBlob = async (): Promise<{ blob: Blob; pdf: any } | null> => {
    if (!printRef.current) return null;
    try {
      const element = printRef.current;
      
      // Get jsPDF from global window.jspdf or jspdf
      const jsPDFLib = (window as any).jspdf?.jsPDF || (window as any).jsPDF || (typeof jspdf !== 'undefined' ? jspdf.jsPDF : null);
      
      if (!jsPDFLib) {
        console.error("jsPDF library not found");
        return null;
      }

      // Get html2canvas from global
      const h2c = (window as any).html2canvas || (typeof html2canvas !== 'undefined' ? html2canvas : null);
      
      if (!h2c) {
        console.error("html2canvas library not found");
        return null;
      }
      
      // Use html2canvas to capture the element
      // We use onclone to ensure we don't have oklch colors which html2canvas can't parse
      const canvas = await h2c(element, { 
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
        onclone: (clonedDoc: Document) => {
          const el = clonedDoc.getElementById('print-section');
          if (el) {
            // Force hex colors for common tailwind classes to avoid oklch issues
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              #print-section {
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              #print-section * {
                border-color: #000000 !important;
              }
              .bg-gray-50 { background-color: #f9fafb !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              .bg-gray-200 { background-color: #e5e7eb !important; }
              .text-gray-300 { color: #d1d5db !important; }
              .text-gray-400 { color: #9ca3af !important; }
              .text-gray-500 { color: #6b7280 !important; }
              .text-red-600 { color: #dc2626 !important; }
              .text-green-600 { color: #16a34a !important; }
              .text-orange-600 { color: #ea580c !important; }
              .border-gray-200 { border-color: #e5e7eb !important; }
              .border-gray-300 { border-color: #d1d5db !important; }
            `;
            clonedDoc.head.appendChild(style);
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDFLib({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      return { blob: pdf.output('blob'), pdf };
    } catch (error) {
      console.error("Error generating PDF blob", error);
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    const result = await generatePdfBlob();
    if (result) {
      result.pdf.save(`JobCard-${request.id}.pdf`);
    } else {
      alert(t('alert_pdfError'));
    }
  };

  const handleShare = async () => {
    const vehicleInfo = `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`;
    
    const message = `${t('shareMessage')} ${vehicleInfo}. \n${t('jobCardNo')}: ${request.id}`;
    
    try {
      // Try Web Share API first (better for mobile)
      if (navigator.share) {
        const result = await generatePdfBlob();
        if (result) {
          const file = new File([result.blob], `JobCard-${request.id}.pdf`, { type: 'application/pdf' });
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `Job Card ${request.id}`,
              text: message,
            });
            return;
          }
        }
        
        // If file sharing not supported but text sharing is
        await navigator.share({
          title: `Job Card ${request.id}`,
          text: message,
        });
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (error) {
      // Fallback to WhatsApp
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
      
      // If they wanted to share, they probably want the PDF too
      const result = await generatePdfBlob();
      if (result) {
        result.pdf.save(`JobCard-${request.id}.pdf`);
      }
    }
  };

  useEffect(() => {
    if (onShare) {
        handleShare();
    }
  }, [onShare]);

  const toLocationData = allLocations.find(l => l.name === request.toLocation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-0 md:p-4">
      <div className="bg-gray-100 rounded-none md:rounded-lg w-full max-w-4xl h-full md:max-h-[90vh] flex flex-col">
        <div className="p-4 bg-white sticky top-0 z-10 flex justify-between items-center print:hidden border-b shrink-0">
            <h2 className="text-sm md:text-lg font-bold truncate mr-2">{t('jobCardPreview')}</h2>
            <div className="flex items-center gap-1 md:gap-2">
                 <button 
                  onClick={handleDownloadPdf} 
                  className="flex items-center bg-green-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-green-700 transition-colors"
                  title={t('downloadPDF')}
                >
                    <DownloadIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('downloadPDF')}</span>
                </button>
                <button 
                  onClick={handleShare} 
                  className="flex items-center bg-teal-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  title={t('shareOnWhatsApp')}
                >
                    <ShareIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('shareOnWhatsApp')}</span>
                </button>
                <button 
                  onClick={handlePrint} 
                  className="hidden sm:flex items-center bg-gray-600 text-white p-2 md:px-4 md:py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  title={t('print')}
                >
                    <PrinterIcon className="h-5 w-5 md:me-2" />
                    <span className="hidden md:inline text-sm font-medium">{t('print')}</span>
                </button>
                <button onClick={onClose} className="bg-gray-200 text-gray-700 p-2 rounded-full hover:bg-gray-300 transition-colors ml-1">
                    <XMarkIcon className="h-5 w-5 md:h-6 md:w-6" />
                </button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-200 p-0 md:p-4 flex justify-center">
          <div 
            id="print-section" 
            className="p-4 md:p-8 bg-white shadow-lg origin-top scale-[0.45] sm:scale-75 md:scale-100" 
            style={{ width: '800px', minHeight: '1123px', flexShrink: 0 }} 
            ref={printRef} 
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
          <div className="border-4 border-double border-black p-6 mb-6">
            <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
              <div className="text-start">
                <h1 className="text-3xl font-black uppercase tracking-tighter">{t('alRasheedCo')}</h1>
                <p className="text-sm font-bold uppercase">{t('workshopManagementSystem')}</p>
                <p className="text-xs">{t('vehicleMaintenanceRepair')}</p>
              </div>
              <div className="text-end">
                <h2 className="text-4xl font-black text-gray-300">{t('jobCardTitle')}</h2>
                <p className="text-sm font-bold">{t('jobNumber')} <span className="text-red-600">{request.id}</span></p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="space-y-2 text-start">
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('dateIn')}</span>
                  <span className="font-semibold text-sm">{formatDate(request.dateIn)}</span>
                </div>
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('timeIn')}</span>
                  <span className="font-semibold text-sm">{formatTime(request.timeIn)}</span>
                </div>
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">From</span>
                  <span className="font-semibold text-sm">{request.fromLocation || '-'}</span>
                </div>
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">To Workshop</span>
                  <span className="font-semibold text-sm">{request.toLocation || '-'}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-start">
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('jobStatus')}</span>
                  <span className={`font-bold text-sm uppercase ${request.status === 'Completed' ? 'text-green-600' : request.status === 'Outsourced' ? 'text-purple-600' : 'text-orange-600'}`}>
                    {t(request.status.toLowerCase() as any)}
                  </span>
                </div>
                {request.status === 'Outsourced' && request.outsourcedWorkshopName && (
                  <div className="flex border-b border-gray-200 py-1">
                    <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('outsourced')}</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm italic">{request.outsourcedWorkshopName}</span>
                    </div>
                  </div>
                )}
                <div className="flex border-b border-gray-200 py-1">
                  <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('purpose')}</span>
                  <span className="font-semibold text-sm">{t(`purpose_${request.purpose.toLowerCase().replace(/ /g, '_')}`)}</span>
                </div>
                {(request.status === 'Completed' || request.status === 'Cancelled' || request.status === 'Outsourced') && request.dateOut && (
                  <>
                    <div className="flex border-b border-gray-200 py-1">
                      <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('dateOut')}</span>
                      <span className="font-semibold text-sm">{formatDate(request.dateOut || '')}</span>
                    </div>
                    <div className="flex border-b border-gray-200 py-1">
                      <span className="w-32 font-bold text-xs uppercase text-gray-500">{t('timeOut')}</span>
                      <span className="font-semibold text-sm">{formatTime(request.timeOut || '')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-300 pb-1">{t('vehicleDetails')}</h3>
              <div className="grid grid-cols-3 gap-4 text-start">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('type')}</p>
                  <p className="font-bold text-sm">{language === 'ar' && vehicle.arabicName ? vehicle.arabicName : t(vehicle.vehiclesType)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('vehicleNumber')}</p>
                  <p className="font-bold text-sm">{vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}{vehicle.vehicleNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('serialNumber')}</p>
                  <p className="font-bold text-sm">{vehicle.serialNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('make')} / {t('model')}</p>
                  <p className="font-bold text-sm">{vehicle.make} / {vehicle.modelNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('mileage')}</p>
                  <p className="font-bold text-sm">{request.mileage || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('complainerOperatorName')}</p>
                  <p className="font-bold text-sm">{request.driverName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('fultin')}</p>
                  <p className="font-bold text-sm">{request.fultin ? t(request.fultin.toLowerCase() as any) : t('head')}</p>
                </div>
                {request.fultin === 'Body' && request.bodyid && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('selectBody')}</p>
                    <p className="font-bold text-sm">
                      {(() => {
                        const bodyVeh = vehicles.find(v => String(v.id) === String(request.bodyid));
                        if (bodyVeh) {
                          const type = language === 'ar' && bodyVeh.arabicName ? bodyVeh.arabicName : t(bodyVeh.vehiclesType);
                          return `${type} - ${bodyVeh.vehicleNumber}`;
                        }
                        return request.bodyid;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-300 pb-1">{t('jobCard_faultsReported')}</h3>
              <table className="w-full border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black p-2 text-xs font-bold uppercase w-12">{t('sr')}</th>
                    <th className="border border-black p-2 text-xs font-bold uppercase w-1/4">{t('workshop')}</th>
                    <th className="border border-black p-2 text-xs font-bold uppercase w-1/4">{t('mechanic')}</th>
                    <th className="border border-black p-2 text-xs font-bold uppercase">{t('faultDescription')}</th>
                  </tr>
                </thead>
                <tbody>
                  {request.faults.map((fault, index) => {
                    const workshop = workshops.find(w => String(w.id) === String(fault.workshopId));
                    return (
                      <tr key={`${fault.id}-${index}`}>
                        <td className="border border-black p-2 text-center text-sm">{index + 1}</td>
                        <td className="border border-black p-2 text-sm">{workshop?.subName || '-'}</td>
                        <td className="border border-black p-2 text-sm">{fault.mechanicName || '-'}</td>
                        <td className="border border-black p-2 text-sm">{fault.description}</td>
                      </tr>
                    );
                  })}
                  {request.status === 'Pending' && Array.from({ length: Math.max(0, 8 - request.faults.length) }).map((_, index) => (
                    <tr key={`empty-${index}`}>
                      <td className="border border-black p-2 h-8"></td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {request.status === 'Completed' && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-300 pb-1">{t('workDone_and_parts_used')}</h3>
                <div className="space-y-4">
                  {request.faults.map((fault, index) => (
                    <div key={`${fault.id}-${index}`} className="border border-gray-200 p-3 rounded">
                      <div className="flex justify-between mb-2">
                        <p className="text-xs font-bold uppercase text-gray-500">Fault #{index + 1}</p>
                        <p className="text-sm font-semibold">{fault.description}</p>
                      </div>
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Work Performed</p>
                        <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded border border-gray-100">{fault.workDone || 'N/A'}</p>
                      </div>
                      {fault.partsUsed && fault.partsUsed.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Parts Replaced</p>
                          <div className="grid grid-cols-2 gap-2">
                            {fault.partsUsed.map((part, pIndex) => (
                              <div key={`${part.id}-${pIndex}`} className="flex justify-between text-xs border-b border-gray-100 pb-1">
                                <span>{part.name}</span>
                                <span className="font-bold">Qty: {part.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {request.status === 'Outsourced' && request.rejectionReason && (
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-300 pb-1">{t('workDone')}</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap font-semibold">{request.rejectionReason}</p>
                </div>
              </div>
            )}

            <div className="mt-12 grid grid-cols-3 gap-12">
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase">{t('driverSignature')}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase">{t('foremanSignature')}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-2">
                  <p className="text-[10px] font-bold uppercase">{t('managerSignature')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center text-[8px] text-gray-400 uppercase tracking-[0.2em]">
              Computer Generated Document - No Signature Required for Validation
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
