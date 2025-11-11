import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, Building2, CalendarDays, Phone, User2, XCircle, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

type RiderStatus = "Pending" | "Active" | "Inactive" | "Rejected";

interface RiderApplication {
  id: string;
  rider_name: string;
  rider_id: string;
  mobile: string;
  city: string;
  vehicle_type: "2-Wheeler" | "3-Wheeler";
  license_number: string;
  aadhaar_number: string;
  pan_card: string;
  joining_date: string;
  status: RiderStatus;
  email?: string;
  dob?: string;
  address?: string;
  emergency_contact?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
}

type ProgressState = {
  detailsApproved: boolean;
  documentsApproved: boolean;
  bankApproved?: boolean;
  approvedDocs?: string[];
  pendingReuploads?: string[];
  pendingReuploadReasons?: Record<string, string>;
  bankReuploadReason?: string;
  incompleteReason?: string; // For storing incomplete/rejection reason
};

const RiderApplicationDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { riderId } = useParams();
  const [rider, setRider] = useState<RiderApplication | null>(null);
  const { toast } = useToast();
  const [progress, setProgress] = useState<ProgressState>({ detailsApproved: false, documentsApproved: false, bankApproved: false, approvedDocs: [], pendingReuploads: [], pendingReuploadReasons: {}, bankReuploadReason: undefined, incompleteReason: undefined });
  const [approvedDocuments, setApprovedDocuments] = useState<string[]>([]);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ label: string; imageUrl: string } | null>(null);
  
  // Track which fields are editable
  const [editableFields, setEditableFields] = useState<Record<string, boolean>>({});
  
  // No need for useEffect - we'll control editing through state only

  // Function to get short rider ID (RD001, RD002, etc.)
  const getShortRiderId = (id: string | undefined): string => {
    if (!id) return 'RD000';
    try {
      const key = 'riderIdShortMap';
      const stored = localStorage.getItem(key);
      const map: Record<string, string> = stored ? JSON.parse(stored) : {};
      
      // Return existing mapping if present
      if (map[id]) return map[id];
      
      // If already short like RD001, keep as-is and store
      if (/^[A-Z]{1,3}\d{1,4}$/.test(id)) {
        map[id] = id;
        localStorage.setItem(key, JSON.stringify(map));
        return id;
      }
      
      // Generate next RD### value
      let max = 0;
      Object.values(map).forEach((val) => {
        const m = val.match(/^RD(\d{3,})$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n) && n > max) max = n;
        }
      });
      const next = max + 1;
      const code = `RD${String(next).padStart(3, '0')}`;
      map[id] = code;
      localStorage.setItem(key, JSON.stringify(map));
      return code;
    } catch {
      return 'RD000';
    }
  };

  // Function to get long rider ID from short ID
  const getLongRiderId = (shortId: string): string | null => {
    try {
      const key = 'riderIdShortMap';
      const stored = localStorage.getItem(key);
      const map: Record<string, string> = stored ? JSON.parse(stored) : {};
      
      // Find the long ID that maps to this short ID
      for (const [longId, short] of Object.entries(map)) {
        if (short === shortId) {
          return longId;
        }
      }
      
      // If not found in map, check if it's already a long ID
      if (shortId.length > 10) {
        return shortId;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // Load rider from localStorage (riderApplications) or approved riders
  useEffect(() => {
    // If URL has long ID, redirect to short ID
    if (riderId && riderId.length > 10 && !/^RD\d{3,}$/.test(riderId)) {
      // It's a long ID, convert to short ID and redirect
      const shortId = getShortRiderId(riderId);
      if (shortId && shortId !== riderId) {
        navigate(`/delivery/rider-onboarding-queue/${shortId}`, { replace: true, state });
        return;
      }
    }

    const loadRider = () => {
      // First try navigation state
      if (state?.rider) {
        setRider(state.rider);
        return;
      }

      // Convert short ID to long ID if needed
      let actualRiderId = riderId;
      if (riderId && /^RD\d{3,}$/.test(riderId)) {
        // It's a short ID, convert to long ID
        const longId = getLongRiderId(riderId);
        if (longId) {
          actualRiderId = longId;
        }
      }

      // Then try riderApplications localStorage
      if (actualRiderId) {
        try {
          const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
          const match = applications.find((r: RiderApplication) => r.rider_id === actualRiderId || r.rider_id === riderId);
          if (match) {
            setRider(match);
            return;
          }
        } catch {}

        // Fallback to approved riders
        try {
          const fromStorage = JSON.parse(localStorage.getItem('approvedRidersFromOnboarding') || '[]');
          const match = (fromStorage as any[]).find(r => r.rider_id === actualRiderId || r.rider_id === riderId);
          if (match) {
            setRider({
              id: match.id || match.rider_id,
              rider_name: match.rider_name,
              rider_id: match.rider_id,
              mobile: match.mobile || "",
              city: match.city || "",
              vehicle_type: match.vehicle_type || "2-Wheeler",
              license_number: match.license_number || "",
              aadhaar_number: match.aadhaar_number || "",
              pan_card: match.pan_card || "",
              joining_date: match.joining_date || "",
              status: "Active",
              email: match.email,
              address: match.address,
              dob: match.dob,
              emergency_contact: match.emergency_contact,
              bank_name: match.bank_name,
              account_number: match.account_number,
              ifsc_code: match.ifsc_code,
              account_holder_name: match.account_holder_name,
            });
          }
        } catch {}
      }
    };

    loadRider();

    // Load progress state
    try {
      if (riderId) {
        // Convert short ID to long ID if needed
        let actualRiderId = riderId;
        if (/^RD\d{3,}$/.test(riderId)) {
          const longId = getLongRiderId(riderId);
          if (longId) {
            actualRiderId = longId;
          }
        }
        
        const p = JSON.parse(localStorage.getItem('riderApplicationProgress') || '{}');
        const entry: ProgressState = p[actualRiderId] || p[riderId] || { detailsApproved: false, documentsApproved: false, bankApproved: false, approvedDocs: [], pendingReuploads: [], pendingReuploadReasons: {}, bankReuploadReason: undefined, incompleteReason: undefined };
        setProgress(entry);
        setApprovedDocuments(entry.approvedDocs || []);
        // Load incomplete reason from progress if exists
        if (entry.incompleteReason) {
          setRejectionReason(entry.incompleteReason);
        }
      }
    } catch {}

    // Listen for application updates
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      // Convert short ID to long ID for comparison
      let actualRiderId = riderId;
      if (riderId && /^RD\d{3,}$/.test(riderId)) {
        const longId = getLongRiderId(riderId);
        if (longId) {
          actualRiderId = longId;
        }
      }
      if (customEvent.detail?.riderId === actualRiderId || customEvent.detail?.riderId === riderId) {
        loadRider();
      }
    };

    window.addEventListener('riderApplicationUpdated', handleUpdate);
    window.addEventListener('storage', () => loadRider());

    return () => {
      window.removeEventListener('riderApplicationUpdated', handleUpdate);
    };
  }, [riderId, state]);

  const saveProgress = (next: Partial<ProgressState>) => {
    if (!riderId) return;
    // Convert short ID to long ID if needed
    let actualRiderId = riderId;
    if (/^RD\d{3,}$/.test(riderId)) {
      const longId = getLongRiderId(riderId);
      if (longId) {
        actualRiderId = longId;
      }
    }
    const merged = { ...progress, ...next };
    setProgress(merged);
    try {
      const store = JSON.parse(localStorage.getItem('riderApplicationProgress') || '{}');
      store[actualRiderId] = merged;
      localStorage.setItem('riderApplicationProgress', JSON.stringify(store));
    } catch {}
  window.dispatchEvent(new CustomEvent('riderApplicationProgressUpdated', { detail: { riderId: actualRiderId } }));
  };

  const clearProgress = () => {
    if (!riderId) return;
    // Convert short ID to long ID if needed
    let actualRiderId = riderId;
    if (/^RD\d{3,}$/.test(riderId)) {
      const longId = getLongRiderId(riderId);
      if (longId) {
        actualRiderId = longId;
      }
    }
    setProgress({ detailsApproved: true, documentsApproved: true, bankApproved: true, approvedDocs: [], pendingReuploads: [], pendingReuploadReasons: {}, bankReuploadReason: undefined, incompleteReason: undefined });
    setRejectionReason(""); // Clear rejection reason when clearing progress
    setApprovedDocuments([]);
    try {
      const store = JSON.parse(localStorage.getItem('riderApplicationProgress') || '{}');
      delete store[actualRiderId];
      localStorage.setItem('riderApplicationProgress', JSON.stringify(store));
    } catch {}
    window.dispatchEvent(new CustomEvent('riderApplicationProgressUpdated', { detail: { riderId: actualRiderId } }));
  };

  const handleApprove = () => {
    if (!rider) return;

    // Check if there are any pending reuploads (doc or bank) or incomplete reason
    const hasPendingReuploads = (progress.pendingReuploads || []).length > 0;
    const hasBankReupload = !!progress.bankReuploadReason;
    const hasIncompleteReason = !!progress.incompleteReason;

    // If there are pending reuploads or incomplete reason, navigate to Incompleted screen
    if (hasPendingReuploads || hasBankReupload || hasIncompleteReason) {
      // Keep status as Pending but mark as incomplete (will show in Incompleted filter)
      try {
        const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
        const updated = applications.map((r: RiderApplication) => {
          if (r.rider_id === rider.rider_id && r.status !== 'Active' && r.status !== 'Rejected') {
            return { ...r, status: 'Pending' };
          }
          return r;
        });
        localStorage.setItem('riderApplications', JSON.stringify(updated));
        localStorage.setItem('riderQueueDefaultTab', 'incompleted');
        window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { 
          detail: { riderId: rider.rider_id, status: 'Pending', activeTab: 'incompleted' } 
        }));
        
        toast({
          title: "Application Moved to Incompleted",
          description: `Rider ${rider.rider_name} has pending reuploads. Please wait for reupload before approving.`,
          variant: "default",
        });
        
        // Navigate to Incompleted screen
        setTimeout(() => {
          const shortId = getShortRiderId(rider.rider_id);
          navigate('/delivery/rider-onboarding-queue', { state: { activeTab: 'incompleted', focusRider: shortId } });
        }, 1000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process application",
          variant: "destructive",
        });
      }
      return;
    }

    // If no pending reuploads, approve and move to Active
    try {
      const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
      const updated = applications.map((r: RiderApplication) => 
        r.rider_id === rider.rider_id ? { ...r, status: "Active" as RiderStatus } : r
      );
      localStorage.setItem('riderApplications', JSON.stringify(updated));
      setRider({ ...rider, status: "Active" });

      // Add to approved riders
      const approvedRiderData = {
        ...rider,
        status: "Active",
        zone: rider.city || "Unassigned"
      };
      const existingApproved = JSON.parse(localStorage.getItem('approvedRidersFromOnboarding') || '[]');
      const exists = existingApproved.find((r: any) => r.rider_id === rider.rider_id);
      if (!exists) {
        existingApproved.push(approvedRiderData);
        localStorage.setItem('approvedRidersFromOnboarding', JSON.stringify(existingApproved));
      }

      toast({
        title: "Rider Approved",
        description: `Rider ${rider.rider_name} has been approved and onboarded`,
      });

      clearProgress();
      localStorage.setItem('riderQueueDefaultTab', 'active');
      window.dispatchEvent(new Event('riderApproved'));
      window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId: rider.rider_id, status: 'Active', activeTab: 'active' } }));
      
      // Navigate back to queue with Active tab selected
      setTimeout(() => {
        navigate('/delivery/rider-onboarding-queue', { state: { activeTab: 'active' } });
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve rider",
        variant: "destructive",
      });
    }
  };

  const [rejectionReason, setRejectionReason] = useState("");

  // Handle field edit - enable field on click or focus
  const handleFieldClick = (fieldName: string) => {
    // Only enable if field is not already editable
    if (!editableFields[fieldName]) {
      setEditableFields(prev => ({ ...prev, [fieldName]: true }));
    }
  };

  // Auto-save field changes - simplified version that always works
  const handleFieldChange = (fieldName: string, value: string) => {
    // Update local state immediately using functional update to avoid stale closure
    setRider(prev => {
      if (!prev) return null;
      const updated = { ...prev, [fieldName]: value };
      
      // Save to localStorage immediately
      try {
        const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
        const updatedApps = applications.map((r: RiderApplication) => 
          r.rider_id === prev.rider_id ? updated : r
        );
        localStorage.setItem('riderApplications', JSON.stringify(updatedApps));
        
        // Also update approved riders if exists
        const approvedRiders = JSON.parse(localStorage.getItem('approvedRidersFromOnboarding') || '[]');
        const approvedIndex = approvedRiders.findIndex((r: any) => r.rider_id === prev.rider_id);
        if (approvedIndex !== -1) {
          approvedRiders[approvedIndex] = { ...approvedRiders[approvedIndex], ...updated };
          localStorage.setItem('approvedRidersFromOnboarding', JSON.stringify(approvedRiders));
        }
      } catch (error) {
        console.error('Error saving field:', error);
      }
      
      return updated;
    });
  };

  // Handle blur - disable field when focus is lost
  const handleFieldBlur = (fieldName: string) => {
    // Small delay to allow any pending onChange events to complete
    setTimeout(() => {
      setEditableFields(prev => ({ ...prev, [fieldName]: false }));
    }, 100);
  };

  const handleReject = () => {
    if (!rider) return;

    // Require rejection reason
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
      const updated = applications.map((r: RiderApplication) => 
        r.rider_id === rider.rider_id ? { 
          ...r, 
          status: "Rejected" as RiderStatus,
          rejection_reason: rejectionReason.trim()
        } : r
      );
      localStorage.setItem('riderApplications', JSON.stringify(updated));
      setRider({ ...rider, status: "Rejected" });

      toast({
        title: "Rider Rejected",
        description: `Rider ${rider.rider_name} has been rejected`,
        variant: "destructive",
      });

      window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId: rider.rider_id, status: 'Rejected' } }));
      
      // Navigate back to queue after a short delay
      setTimeout(() => {
        navigate('/delivery/rider-onboarding-queue', { state: { activeTab: 'rejected' } });
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject rider",
        variant: "destructive",
      });
    }
  };

  // Approve Details step only (does not finalize onboarding)
  const handleApproveDetails = () => {
    saveProgress({ detailsApproved: true });
    toast({ title: "Details Approved", description: "Rider personal details approved. Proceed to Documents." });
  };

  // Approve single document
  const handleApproveDocument = (docLabel: string) => {
    if (!riderId) return;
    // Convert short ID to long ID if needed
    let actualRiderId = riderId;
    if (/^RD\d{3,}$/.test(riderId)) {
      const longId = getLongRiderId(riderId);
      if (longId) {
        actualRiderId = longId;
      }
    }
    
    const updated = Array.from(new Set([...approvedDocuments, docLabel]));
    setApprovedDocuments(updated);
    
    const allDocs = ['Aadhaar Card (Front)','Aadhaar Card (Back)','PAN Card','Driving License (Front)','Driving License (Back)','Vehicle Photo','RC Book (Front)','RC Book (Back)'];
    const allApproved = allDocs.every(doc => updated.includes(doc));
    
    const updatedPending = (progress.pendingReuploads || []).filter(d => d !== docLabel);
    const updatedReasons = { ...(progress.pendingReuploadReasons || {}) };
    delete updatedReasons[docLabel];
    
    // If all documents are approved and no pending reuploads, check if ready for Active
    if (allApproved && updatedPending.length === 0 && progress.detailsApproved && progress.bankApproved) {
      // All approved - move to Active
      if (rider) {
        handleApprove();
        return;
      }
    }

    saveProgress({ 
      approvedDocs: updated,
      documentsApproved: allApproved,
      pendingReuploads: updatedPending,
      pendingReuploadReasons: updatedReasons
    });
    
    toast({ 
      title: "Document Approved", 
      description: `${docLabel} has been approved` 
    });
  };

  // Approve all documents step
  const handleApproveAllDocuments = () => {
    const allDocs = ['Aadhaar Card (Front)','Aadhaar Card (Back)','PAN Card','Driving License (Front)','Driving License (Back)','Vehicle Photo','RC Book (Front)','RC Book (Back)'];
    setApprovedDocuments(allDocs);
    saveProgress({ documentsApproved: true, approvedDocs: allDocs, pendingReuploads: [], pendingReuploadReasons: {} });
    toast({ title: "All Documents Approved", description: "All documents approved. Proceed to Bank Details for final decision." });
  };

  // Request reupload for a specific document
  const handleRequestReupload = (docLabel: string) => {
    if (!rider) return;
    
    // Determine reason based on document type
    const reasons: Record<string, string> = {
      'PAN Card': 'PAN Card mismatch or blur, give me properly the image',
      'Aadhaar Card (Front)': 'Aadhaar Card (Front) mismatch or blur, give me properly the image',
      'Aadhaar Card (Back)': 'Aadhaar Card (Back) mismatch or blur, give me properly the image',
      'Driving License (Front)': 'Driving License (Front) mismatch or blur, give me properly the image',
      'Driving License (Back)': 'Driving License (Back) mismatch or blur, give me properly the image',
      'Vehicle Photo': 'Vehicle Photo mismatch or blur, give me properly the image',
      'RC Book (Front)': 'RC Book (Front) mismatch or blur, give me properly the image',
      'RC Book (Back)': 'RC Book (Back) mismatch or blur, give me properly the image',
    };
    
    const reason = reasons[docLabel] || `${docLabel} mismatch or blur, give me properly the image`;
    
    // Dispatch event to mobile app
    window.dispatchEvent(new CustomEvent('documentReuploadRequested', { 
      detail: { 
        riderId: rider.rider_id, 
        riderName: rider.rider_name, 
        document: docLabel,
        reason: reason
      } 
    }));
    
    // Mark this document as pending reupload and unapprove it
    const updatedApproved = approvedDocuments.filter(doc => doc !== docLabel);
    setApprovedDocuments(updatedApproved);
    const allDocs = ['Aadhaar Card (Front)','Aadhaar Card (Back)','PAN Card','Driving License (Front)','Driving License (Back)','Vehicle Photo','RC Book (Front)','RC Book (Back)'];
    const allApproved = allDocs.every(doc => updatedApproved.includes(doc));
    const updatedPending = Array.from(new Set([...(progress.pendingReuploads || []), docLabel]));
    const updatedReasons = {
      ...(progress.pendingReuploadReasons || {}),
      [docLabel]: reason
    };
    saveProgress({ 
      approvedDocs: updatedApproved,
      documentsApproved: allApproved,
      pendingReuploads: updatedPending,
      pendingReuploadReasons: updatedReasons
    });

    // Keep status as Pending but mark as incomplete (will show in Incompleted filter)
    // Don't change status to Inactive - keep it as Pending so it can still be reviewed
    // The isIncompleteApplication check will move it to Incompleted filter
    try {
      const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
      const updatedApps = applications.map((r: any) => {
        if (r.rider_id === rider.rider_id && r.status !== 'Active' && r.status !== 'Rejected') {
          // Keep as Pending but mark as incomplete (will show in Incompleted filter)
          return { ...r, status: 'Pending' };
        }
        return r;
      });
      localStorage.setItem('riderApplications', JSON.stringify(updatedApps));
      window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId: rider.rider_id, status: 'Pending', activeTab: 'incompleted' } }));
    } catch {}
    localStorage.setItem('riderQueueDefaultTab', 'incompleted');
    
    toast({ 
      title: "Reupload Requested", 
      description: `${docLabel} reupload requested from ${rider.rider_name}. Reason: ${reason}` 
    });
    
    // Don't navigate to Incompleted screen immediately - stay on current screen
    // User can continue reviewing other documents and bank details
  };

  // Approve bank document (Canceled Cheque / Passbook)
  const handleApproveBank = () => {
    const reasons = { ...(progress.pendingReuploadReasons || {}) };
    saveProgress({ bankApproved: true, bankReuploadReason: undefined, pendingReuploadReasons: reasons });
    toast({ title: "Bank Details Approved", description: "Bank document verified and approved." });
  };

  // Request reupload for bank document
  const handleRequestBankDocument = () => {
    if (!rider) return;
    const reason = 'Bank document mismatch or blur, give me properly the image';
    window.dispatchEvent(new CustomEvent('bankDocumentReuploadRequested', {
      detail: {
        riderId: rider.rider_id,
        riderName: rider.rider_name,
        document: 'Canceled Cheque / Bank Passbook',
        reason
      }
    }));
    saveProgress({ bankApproved: false, bankReuploadReason: reason });
    // Keep status as Pending but mark as incomplete (will show in Incompleted filter)
    // Don't change status to Inactive - keep it as Pending so it can still be reviewed
    // The isIncompleteApplication check will move it to Incompleted filter
    try {
      const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
      const updatedApps = applications.map((r: any) => {
        if (r.rider_id === rider.rider_id && r.status !== 'Active' && r.status !== 'Rejected') {
          // Keep as Pending but mark as incomplete (will show in Incompleted filter)
          return { ...r, status: 'Pending' };
        }
        return r;
      });
      localStorage.setItem('riderApplications', JSON.stringify(updatedApps));
      window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId: rider.rider_id, status: 'Pending', activeTab: 'incompleted' } }));
    } catch {}
    toast({ title: "Bank Reupload Requested", description: reason });
    
    // Don't navigate to Incompleted screen immediately - stay on current screen
    // User can continue reviewing other documents and details
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main>
        <div className="bg-card border-b shadow-sm mb-6">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-lg !text-white focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-colors shadow-sm border-0 !bg-[#10b981] hover:!bg-[hsl(142,86%,58%)]"
                style={{ backgroundColor: '#10b981', color: 'white' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.setProperty('background-color', 'hsl(142, 86%, 58%)', 'important');
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.setProperty('background-color', '#10b981', 'important');
                  e.currentTarget.style.color = 'white';
                }}
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Review Application: {rider ? rider.rider_name : riderId}</h1>
                <p className="text-sm text-muted-foreground">
                  Application ID: {getShortRiderId(rider?.rider_id || riderId)}
                </p>
              </div>
            </div>
            {rider && (
              <Badge 
                variant={
                  rider.status === 'Active' ? 'default' : 
                  rider.status === 'Pending' ? 'secondary' : 
                  rider.status === 'Rejected' ? 'destructive' : 
                  'outline'
                }
                className="px-4 py-2 text-sm"
              >
                {rider.status}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Approval Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className={`flex items-center gap-2 ${progress.detailsApproved || rider?.status === 'Active' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {progress.detailsApproved || rider?.status === 'Active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Personal Details</span>
                </div>
                <div className={`flex items-center gap-2 ${progress.documentsApproved || rider?.status === 'Active' ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {progress.documentsApproved || rider?.status === 'Active' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Documents Verified</span>
                </div>
                <div className={`flex items-center gap-2 ${(progress.bankApproved || rider?.status === 'Active') ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {(progress.bankApproved || rider?.status === 'Active') ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span>Bank Details</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-9">
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="details">Rider Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="bank">Bank Details</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rider ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div>
                            <label className="text-muted-foreground mb-2 block">Full Name</label>
                            <div className="flex items-center gap-2">
                              <User2 className="h-4 w-4 text-muted-foreground" />
                              <Input
                                name="rider_name"
                                value={rider.rider_name || ''}
                                readOnly={!editableFields.rider_name}
                                onClick={() => handleFieldClick('rider_name')}
                                onFocus={() => handleFieldClick('rider_name')}
                                onChange={(e) => handleFieldChange('rider_name', e.target.value)}
                                onBlur={() => handleFieldBlur('rider_name')}
                                className={`${!editableFields.rider_name ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">Date of Birth</label>
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-muted-foreground" />
                              <Input
                                name="dob"
                                type="date"
                                value={rider.dob || ''}
                                readOnly={!editableFields.dob}
                                onClick={() => handleFieldClick('dob')}
                                onFocus={() => handleFieldClick('dob')}
                                onChange={(e) => handleFieldChange('dob', e.target.value)}
                                onBlur={() => handleFieldBlur('dob')}
                                className={`${!editableFields.dob ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">Contact Number</label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <Input
                                name="mobile"
                                value={rider.mobile || ''}
                                readOnly={!editableFields.mobile}
                                onClick={() => handleFieldClick('mobile')}
                                onFocus={() => handleFieldClick('mobile')}
                                onChange={(e) => handleFieldChange('mobile', e.target.value)}
                                onBlur={() => handleFieldBlur('mobile')}
                                className={`${!editableFields.mobile ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">Alternate Contact</label>
                            <Input
                              name="emergency_contact"
                              value={rider.emergency_contact || ''}
                              readOnly={!editableFields.emergency_contact}
                              onClick={() => handleFieldClick('emergency_contact')}
                              onFocus={() => handleFieldClick('emergency_contact')}
                              onChange={(e) => handleFieldChange('emergency_contact', e.target.value)}
                              onBlur={() => handleFieldBlur('emergency_contact')}
                              className={`${!editableFields.emergency_contact ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-muted-foreground mb-2 block">Full Address</label>
                            <Textarea
                              name="address"
                              value={rider.address || ''}
                              readOnly={!editableFields.address}
                              onClick={() => handleFieldClick('address')}
                              onFocus={() => handleFieldClick('address')}
                              onChange={(e) => handleFieldChange('address', e.target.value)}
                              onBlur={() => handleFieldBlur('address')}
                              className={`${!editableFields.address ? 'bg-muted text-muted-foreground cursor-pointer resize-none' : 'bg-background'}`}
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">City/Zone</label>
                            <Input
                              name="city"
                              value={rider.city || ''}
                              readOnly={!editableFields.city}
                              onClick={() => handleFieldClick('city')}
                              onFocus={() => handleFieldClick('city')}
                              onChange={(e) => handleFieldChange('city', e.target.value)}
                              onBlur={() => handleFieldBlur('city')}
                              className={`${!editableFields.city ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Employment Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <label className="text-muted-foreground mb-2 block">Rider ID</label>
                              <Input
                                value={getShortRiderId(rider.rider_id)}
                                disabled
                                className="bg-muted text-muted-foreground"
                              />
                            </div>
                            <div>
                              <label className="text-muted-foreground mb-2 block">Joining Date</label>
                              <Input
                                name="joining_date"
                                type="date"
                                value={rider.joining_date || ''}
                                readOnly={!editableFields.joining_date}
                                onClick={() => handleFieldClick('joining_date')}
                                onFocus={() => handleFieldClick('joining_date')}
                                onChange={(e) => handleFieldChange('joining_date', e.target.value)}
                                onBlur={() => handleFieldBlur('joining_date')}
                                className={`${!editableFields.joining_date ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                            <div>
                              <label className="text-muted-foreground mb-2 block">Vehicle Type</label>
                              <Input
                                name="vehicle_type"
                                value={rider.vehicle_type || ''}
                                readOnly={!editableFields.vehicle_type}
                                onClick={() => handleFieldClick('vehicle_type')}
                                onFocus={() => handleFieldClick('vehicle_type')}
                                onChange={(e) => handleFieldChange('vehicle_type', e.target.value)}
                                onBlur={() => handleFieldBlur('vehicle_type')}
                                className={`${!editableFields.vehicle_type ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground mb-3">Identity Documents</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div>
                              <label className="text-muted-foreground mb-2 block">License Number</label>
                              <Input
                                name="license_number"
                                value={rider.license_number || ''}
                                readOnly={!editableFields.license_number}
                                onClick={() => handleFieldClick('license_number')}
                                onFocus={() => handleFieldClick('license_number')}
                                onChange={(e) => handleFieldChange('license_number', e.target.value)}
                                onBlur={() => handleFieldBlur('license_number')}
                                className={`${!editableFields.license_number ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                            <div>
                              <label className="text-muted-foreground mb-2 block">Aadhaar Number</label>
                              <Input
                                name="aadhaar_number"
                                value={rider.aadhaar_number || ''}
                                readOnly={!editableFields.aadhaar_number}
                                onClick={() => handleFieldClick('aadhaar_number')}
                                onFocus={() => handleFieldClick('aadhaar_number')}
                                onChange={(e) => handleFieldChange('aadhaar_number', e.target.value)}
                                onBlur={() => handleFieldBlur('aadhaar_number')}
                                className={`${!editableFields.aadhaar_number ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                            <div>
                              <label className="text-muted-foreground mb-2 block">PAN Card</label>
                              <Input
                                name="pan_card"
                                value={rider.pan_card || ''}
                                readOnly={!editableFields.pan_card}
                                onClick={() => handleFieldClick('pan_card')}
                                onFocus={() => handleFieldClick('pan_card')}
                                onChange={(e) => handleFieldChange('pan_card', e.target.value)}
                                onBlur={() => handleFieldBlur('pan_card')}
                                className={`${!editableFields.pan_card ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Approve Details (does not finalize) */}
                        <div className="border-t pt-4">
                          <Button 
                            className="w-full" 
                            variant="default"
                            onClick={handleApproveDetails}
                            disabled={progress.detailsApproved}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Rider details not found.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {['Aadhaar Card (Front)','Aadhaar Card (Back)','PAN Card','Driving License (Front)','Driving License (Back)','Vehicle Photo','RC Book (Front)','RC Book (Back)'].map((label) => {
                        const isApproved = approvedDocuments.includes(label);
                        const isRequested = (progress.pendingReuploads || []).includes(label);
                        return (
                          <div key={label} className="border rounded-lg p-4">
                            <p className="font-medium mb-3">{label}</p>
                            <div 
                              className="h-40 bg-muted rounded flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                              onClick={() => {
                                // In real implementation, this would be the actual document URL
                                // For now, using a placeholder - replace with actual document URL from rider data
                                const documentUrl = (rider as any)?.documents?.[label] || `https://via.placeholder.com/800x600?text=${encodeURIComponent(label)}`;
                                setSelectedDocument({ label, imageUrl: documentUrl });
                                setDocumentModalOpen(true);
                              }}
                            >
                              <Building2 className="h-8 w-8" />
                            </div>
                            <div className="flex gap-3 mt-3">
                              <Button 
                                size="sm" 
                                onClick={() => handleApproveDocument(label)}
                                disabled={isApproved}
                                className={`${isApproved ? "bg-green-600 hover:bg-green-700" : ""}${isRequested && !isApproved ? " border-warning text-warning" : ""}`}
                              >
                                {isApproved ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Approved
                                  </>
                                ) : isRequested ? (
                                  "Mark as Approved"
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleRequestReupload(label)}
                                disabled={isRequested}
                                className={isRequested ? "border-destructive text-destructive" : ""}
                              >
                                {isRequested ? 'Reupload Requested' : 'Request Reupload'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-6">
                      <Button className="w-full" onClick={handleApproveAllDocuments}>Approve All Documents</Button>
                      <div className="mt-2">
                        <Button className="w-full" variant="outline" onClick={() => ['Aadhaar Card (Front)','Aadhaar Card (Back)','PAN Card','Driving License (Front)','Driving License (Back)','Vehicle Photo','RC Book (Front)','RC Book (Back)'].forEach(d => handleRequestReupload(d))}>Request Reupload All Documents</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bank">
                <Card>
                  <CardHeader>
                    <CardTitle>Bank Account Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rider ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div>
                            <label className="text-muted-foreground mb-2 block">Bank Name</label>
                            <Input
                              name="bank_name"
                              value={rider.bank_name || ''}
                              readOnly={!editableFields.bank_name}
                              onClick={() => handleFieldClick('bank_name')}
                              onFocus={() => handleFieldClick('bank_name')}
                              onChange={(e) => handleFieldChange('bank_name', e.target.value)}
                              onBlur={() => handleFieldBlur('bank_name')}
                              className={`${!editableFields.bank_name ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">Account Holder Name</label>
                            <Input
                              name="account_holder_name"
                              value={rider.account_holder_name || ''}
                              readOnly={!editableFields.account_holder_name}
                              onClick={() => handleFieldClick('account_holder_name')}
                              onFocus={() => handleFieldClick('account_holder_name')}
                              onChange={(e) => handleFieldChange('account_holder_name', e.target.value)}
                              onBlur={() => handleFieldBlur('account_holder_name')}
                              className={`${!editableFields.account_holder_name ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">Account Number</label>
                            <Input
                              name="account_number"
                              value={rider.account_number || ''}
                              readOnly={!editableFields.account_number}
                              onClick={() => handleFieldClick('account_number')}
                              onFocus={() => handleFieldClick('account_number')}
                              onChange={(e) => handleFieldChange('account_number', e.target.value)}
                              onBlur={() => handleFieldBlur('account_number')}
                              className={`${!editableFields.account_number ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                          <div>
                            <label className="text-muted-foreground mb-2 block">IFSC Code</label>
                            <Input
                              name="ifsc_code"
                              value={rider.ifsc_code || ''}
                              readOnly={!editableFields.ifsc_code}
                              onClick={() => handleFieldClick('ifsc_code')}
                              onFocus={() => handleFieldClick('ifsc_code')}
                              onChange={(e) => handleFieldChange('ifsc_code', e.target.value)}
                              onBlur={() => handleFieldBlur('ifsc_code')}
                              className={`${!editableFields.ifsc_code ? 'bg-muted text-muted-foreground cursor-pointer' : 'bg-background'}`}
                            />
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold mb-2">Canceled Cheque / Bank Passbook</p>
                          <div 
                            className="h-48 bg-muted rounded flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => {
                              // In real implementation, this would be the actual bank document URL
                              // For now, using a placeholder - replace with actual document URL from rider data
                              const documentUrl = (rider as any)?.bank_document || `https://via.placeholder.com/800x600?text=${encodeURIComponent('Canceled Cheque / Bank Passbook')}`;
                              setSelectedDocument({ label: 'Canceled Cheque / Bank Passbook', imageUrl: documentUrl });
                              setDocumentModalOpen(true);
                            }}
                          >
                            <Building2 className="h-10 w-10" />
                          </div>
                          <div className="flex gap-3 mt-3">
                            <Button onClick={handleApproveBank} disabled={!!progress.bankApproved}>Verify & Approve Bank Details</Button>
                            <Button variant="outline" onClick={handleRequestBankDocument}>Request Bank Document</Button>
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <h3 className="font-semibold text-foreground mb-3">Final Decision</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-muted-foreground mb-2 block">Rejection Reason (if applicable)</label>
                              <Textarea 
                                placeholder="Enter reason for rejection or incomplete..." 
                                value={rejectionReason}
                                onChange={(e) => {
                                  setRejectionReason(e.target.value);
                                  // Save to progress immediately when changed
                                  if (e.target.value.trim() && riderId) {
                                    saveProgress({ incompleteReason: e.target.value.trim() });
                                  }
                                }}
                                rows={4}
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <Button 
                                className="flex-1" 
                                variant="default"
                                onClick={() => {
                                  // Check if there are pending reuploads or incomplete reason
                                  const hasPendingReuploads = (progress.pendingReuploads || []).length > 0;
                                  const hasBankReupload = !!progress.bankReuploadReason;
                                  const hasIncompleteReason = !!progress.incompleteReason;
                                  const hasPendingIssues = hasPendingReuploads || hasBankReupload || hasIncompleteReason;
                                  
                                  // If there are pending issues, allow clicking to navigate to Incompleted screen
                                  if (hasPendingIssues) {
                                    handleApprove();
                                    return;
                                  }
                                  
                                  // If no pending issues, check if all sections are approved
                                  const allApproved = progress.detailsApproved && progress.documentsApproved && !!progress.bankApproved;
                                  
                                  if (!allApproved) {
                                    toast({ 
                                      title: 'Complete Verification', 
                                      description: 'Please approve details, all documents, and bank details before onboarding.', 
                                      variant: 'destructive' 
                                    });
                                    return;
                                  }
                                  
                                  // All approved and no pending issues → Move to Active screen
                                  handleApprove();
                                }}
                                disabled={rider.status === 'Active'}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve & Onboard Rider
                              </Button>
                              <Button 
                                className="flex-1" 
                                variant="destructive"
                                onClick={handleReject}
                                disabled={rider.status === 'Rejected'}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject Application
                              </Button>
                              <Button className="flex-1" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Bank details not found.</div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Document View Modal */}
      <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0 h-auto">
          {selectedDocument && (
            <div className="relative">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">{selectedDocument.label}</h3>
                <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedDocument.imageUrl}
                    alt={selectedDocument.label}
                    className="w-full h-auto max-h-[80vh] object-contain"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/800x600?text=${encodeURIComponent(selectedDocument.label)}`;
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
  
export default RiderApplicationDetails;


