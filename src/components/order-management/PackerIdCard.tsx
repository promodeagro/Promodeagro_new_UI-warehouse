import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PackerIdCardProps {
  packer: {
    id: string;
    name: string;
    date_of_birth?: string;
    role?: string;
    phone?: string;
    profile_image?: string | null;
  };
  onClose?: () => void;
}

export default function PackerIdCard({ packer, onClose }: PackerIdCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForDisplay = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${packer.name}_ID_Card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading ID card:', error);
      // Fallback: open in new window for manual save
      const newWindow = window.open();
      if (newWindow && cardRef.current) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${packer.name} - ID Card</title>
              <style>
                body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; }
                .card-container { background: white; padding: 20px; }
              </style>
            </head>
            <body>
              <div class="card-container">
                ${cardRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  // Extract employee ID number from packer ID (e.g., PKR-001 -> 001)
  const employeeIdNumber = packer.id.replace('PKR-', '');

  return (
    <div className="relative flex flex-col justify-center items-center min-h-[600px] p-8">
      {/* ID Card - Standard ID Card Size: 2.125" × 3.375" (255px × 405px at 120 DPI) */}
      <div 
        ref={cardRef} 
        className="w-[255px] h-[405px] bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col"
        style={{ fontFamily: 'Arial, sans-serif', borderRadius: '8px' }}
      >
        {/* Header - Dark Green */}
        <div className="bg-[#1a5f3f] text-white px-3 py-2.5 flex items-center justify-center gap-2.5 h-[55px] flex-shrink-0 rounded-t-lg">
          <div className="w-9 h-9 bg-white rounded flex items-center justify-center flex-shrink-0">
            {/* Person with hat pushing wheelbarrow icon */}
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Hat */}
              <path d="M12 10C12 8.5 13 7 14.5 7H17.5C19 7 20 8.5 20 10V11H12V10Z" fill="#1a5f3f"/>
              <path d="M11 11H21V12H11V11Z" fill="#1a5f3f"/>
              {/* Head */}
              <circle cx="16" cy="15" r="3.5" fill="#1a5f3f"/>
              {/* Body */}
              <path d="M16 18.5V24C16 24 14 26 12 26" stroke="#1a5f3f" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M16 18.5V24C16 24 18 26 20 26" stroke="#1a5f3f" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* Arms pushing */}
              <path d="M12 20L8 18" stroke="#1a5f3f" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M20 20L24 18" stroke="#1a5f3f" strokeWidth="2" strokeLinecap="round" fill="none"/>
              {/* Wheelbarrow */}
              <path d="M6 24L8 22L10 24L12 22L14 24L16 22L18 24L20 22L22 24L24 22L26 24" stroke="#1a5f3f" strokeWidth="1.5" fill="none"/>
              <path d="M6 24C6 24 8 26 10 26H22C24 26 26 24 26 24" stroke="#1a5f3f" strokeWidth="1.5" fill="none"/>
              <circle cx="8" cy="26" r="1.5" fill="#1a5f3f"/>
              <circle cx="24" cy="26" r="1.5" fill="#1a5f3f"/>
            </svg>
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold leading-tight">Promode Agro Farms</h2>
            <p className="text-[9px] text-white/90 leading-tight mt-0.5">Deliver Season's Best</p>
          </div>
        </div>

        {/* Middle Section - White */}
        <div className="px-4 py-3 bg-white flex-1 flex flex-col overflow-hidden">
          {/* Profile Photo - Square with rounded corners */}
          <div className="flex justify-center mb-2.5">
            <div className="rounded-md border border-[#1a5f3f] overflow-hidden bg-gray-100 flex items-center justify-center" style={{ width: '100px', height: '100px' }}>
              {packer.profile_image ? (
                <img 
                  src={packer.profile_image} 
                  alt={packer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-3xl text-gray-400 font-bold">
                  {packer.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Employee Name */}
          <h3 className="text-lg font-bold text-center mb-2 text-black leading-tight" style={{ fontSize: '18px', fontWeight: '700' }}>
            {packer.name}
          </h3>

          {/* Employee ID Badge */}
          <div className="flex justify-center mb-2">
            <div className="bg-[#d4edda] px-3 py-1.5 rounded-md">
              <span className="text-xs font-semibold text-black" style={{ fontSize: '11px', fontWeight: '600' }}>
                Employee ID : {employeeIdNumber}
              </span>
            </div>
          </div>

          {/* Date of Birth */}
          <p className="text-center text-xs text-black mb-1 leading-tight" style={{ fontSize: '11px', fontWeight: '400' }}>
            D.O.B : {packer.date_of_birth ? formatDateForDisplay(packer.date_of_birth) : 'N/A'}
          </p>

          {/* Role */}
          <p className="text-center text-xs text-black mb-2 leading-tight" style={{ fontSize: '11px', fontWeight: '400' }}>
            Role : {packer.role || 'Packer Boy'}
          </p>

          {/* Director Signature */}
          <div className="flex justify-end items-end mt-auto">
            <div className="text-right">
              <div className="text-[10px] text-black mb-0.5" style={{ fontFamily: 'cursive', fontWeight: 'normal' }}>
                Bhattach
              </div>
              <div className="text-[9px] text-black">Director signature</div>
            </div>
          </div>
        </div>

        {/* Footer - Dark Green */}
        <div className="bg-[#1a5f3f] text-white px-3 py-2.5 h-[70px] flex flex-col justify-center items-center text-center flex-shrink-0 mt-auto rounded-b-lg">
          <p className="text-[9px] leading-tight mb-1">
            Building.No: 6-100, Darga Khaliz Khan Guda
          </p>
          <p className="text-[9px] leading-tight mb-1.5">
            GaganPahad, Kismatpur Hyderabad -500030
          </p>
          <div className="flex items-center justify-center gap-2">
            {/* Phone icon */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white"/>
            </svg>
            <span className="text-[9px]">{packer.phone || '+91 93814 08569'}</span>
          </div>
        </div>
      </div>

      {/* Download Button - Bottom */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownload} 
        className="mt-6 gap-2"
      >
        <Download className="h-4 w-4" />
        Download ID Card
      </Button>
    </div>
  );
}

