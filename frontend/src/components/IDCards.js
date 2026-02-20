import React, { useState } from 'react';
import { cardsService } from '../services/api';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const IDCards = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState(null);
  const [cardType, setCardType] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateIDCard = async () => {
    try {
      setLoading(true);
      const response = await cardsService.getIdCard(user.employee_id);
      setCardData(response.data);
      setCardType('id');
      toast.success('ID Card generated!');
    } catch (error) {
      toast.error('Failed to generate ID card');
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessCard = async () => {
    try {
      setLoading(true);
      const response = await cardsService.getBusinessCard(user.employee_id);
      setCardData(response.data);
      setCardType('business');
      
      // Generate QR code for vCard
      const qrUrl = await QRCode.toDataURL(response.data.vcard, {
        width: 200,
        margin: 1
      });
      setQrCodeUrl(qrUrl);
      
      toast.success('Business Card generated!');
    } catch (error) {
      toast.error('Failed to generate business card');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPNG = async (elementId, filename) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Downloaded as PNG!');
    } catch (error) {
      toast.error('Failed to download PNG');
    }
  };

  const downloadAsPDF = async (elementId, filename, width, height) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true
      });
      
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [width, height]
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${filename}.pdf`);
      
      toast.success('Downloaded as PDF!');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  // Determine which photo to use based on employee
  const getEmployeePhoto = () => {
    if (!cardData) return null;
    
    // Director photo
    if (cardData.employee_id === 'DLLC001') {
      return '/assets/director-photo.png';
    }
    // John Doe employee photo
    if (cardData.employee_id === 'DLLC101') {
      return '/assets/employee-photo.jpg';
    }
    // Default placeholder for others
    return null;
  };

  return (
    <div className="space-y-6 fade-in" data-testid="id-cards-page">
      <h2 className="text-2xl sm:text-3xl font-heading font-bold">ID & Business Cards</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🪪</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Personal ID Card</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Generate your employee ID card with photo and company details
          </p>
          <button
            onClick={generateIDCard}
            disabled={loading}
            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {loading && cardType === 'id' ? 'Generating...' : 'Generate ID Card'}
          </button>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border shadow-sm hover-lift">
          <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">💼</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Business Card</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Generate your professional business card with QR code
          </p>
          <button
            onClick={generateBusinessCard}
            disabled={loading}
            className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 disabled:opacity-50"
          >
            {loading && cardType === 'business' ? 'Generating...' : 'Generate Business Card'}
          </button>
        </div>
      </div>

      {/* ID Card Preview */}
      {cardData && cardType === 'id' && (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Personal ID Card</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => downloadAsPNG('id-card', `${cardData.employee_id}-id-card`)}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90"
              >
                Download PNG
              </button>
              <button
                onClick={() => downloadAsPDF('id-card', `${cardData.employee_id}-id-card`, 85.6, 53.98)}
                className="w-full sm:w-auto bg-secondary text-secondary-foreground px-4 py-2 rounded text-sm hover:bg-secondary/80"
              >
                Download PDF
              </button>
            </div>
          </div>
          
          <div className="flex justify-center overflow-x-auto pb-2">
            <div
              id="id-card"
              className="w-[350px] h-[550px] bg-white border-4 border-primary rounded-lg p-6 text-black"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              {/* Header */}
              <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                <div className="flex justify-center mb-3">
                  <img 
                    src="/assets/dllc-logo-v2.png" 
                    alt="DLLC Logo" 
                    className="h-20 w-auto object-contain" 
                    crossOrigin="anonymous" 
                  />
                </div>
                <h1 className="text-xl font-bold text-primary mt-2">IDENTITY CARD</h1>
              </div>
              
              {/* Photo */}
              <div className="flex flex-col items-center mb-4">
                {getEmployeePhoto() ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden mb-3 border-4 border-primary">
                    <img 
                      src={getEmployeePhoto()} 
                      alt={cardData.full_name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-3 border-4 border-primary">
                    <span className="text-5xl text-gray-400">👤</span>
                  </div>
                )}
                <div className="w-full bg-primary text-white px-4 py-2 text-center rounded">
                  <p className="text-lg font-bold">{cardData.full_name}</p>
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold w-32">ID Number:</span>
                  <span>{cardData.employee_id}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Department:</span>
                  <span>{cardData.department}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Email:</span>
                  <span className="text-xs">{cardData.email}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Phone:</span>
                  <span>{cardData.phone}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold w-32">Join Date:</span>
                  <span>{new Date(cardData.join_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-xs text-center text-gray-600">
                <p className="font-semibold mb-1">AUTHORIZED ACCESS</p>
                <p className="text-[10px] leading-tight">{cardData.company_address}</p>
              </div>
              
              <div className="mt-4 text-center text-xs">
                <p className="border-t border-gray-400 pt-2 inline-block px-8">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Card Preview */}
      {cardData && cardType === 'business' && (
        <div className="bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
            <h3 className="text-xl font-semibold">Business Card</h3>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => downloadAsPNG('business-card-front', `${cardData.employee_id}-business-card`)}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90"
              >
                Download PNG
              </button>
              <button
                onClick={() => downloadAsPDF('business-card-front', `${cardData.employee_id}-business-card`, 85.6, 53.98)}
                className="w-full sm:w-auto bg-secondary text-secondary-foreground px-4 py-2 rounded text-sm hover:bg-secondary/80"
              >
                Download PDF
              </button>
            </div>
          </div>
          
          <div className="flex justify-center overflow-x-auto pb-2">
            {/* Business Card Front */}
            <div
              id="business-card-front"
              className="w-[400px] h-[240px] bg-white p-6 text-black shadow-xl relative"
              style={{ fontFamily: 'Arial, sans-serif' }}
            >
              <div className="flex h-full">
                {/* Left Column */}
                <div className="flex-1 pr-4 border-r border-gray-200">
                  {/* Logo */}
                  <div className="mb-4">
                    <img 
                      src="/assets/dllc-logo-v2.png" 
                      alt="DLLC" 
                      className="h-16 w-auto object-contain" 
                      crossOrigin="anonymous" 
                    />
                  </div>
                  
                  {/* Employee Info */}
                  <div className="space-y-1 mt-3">
                    <h3 className="text-xl font-bold text-black">{cardData.full_name}</h3>
                    <p className="text-sm font-semibold text-gray-700">{cardData.role}</p>
                    <p className="text-xs text-gray-600">{cardData.department}</p>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-700">
                    <p>{cardData.email}</p>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="w-48 pl-4 text-xs">
                  <div className="space-y-1 text-gray-700">
                    <p className="text-[10px] leading-tight">{cardData.company_address}</p>
                    <p className="text-blue-600">{cardData.company_website}</p>
                  </div>
                  
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="font-semibold text-black text-[11px]">Corporate/Disputes</p>
                      <p className="text-[10px] text-gray-700">{cardData.company_phone}</p>
                      <p className="text-[10px] text-gray-700">{cardData.company_fax}</p>
                    </div>
                  </div>
                  
                  {qrCodeUrl && (
                    <div className="mt-3 flex justify-center">
                      <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IDCards;