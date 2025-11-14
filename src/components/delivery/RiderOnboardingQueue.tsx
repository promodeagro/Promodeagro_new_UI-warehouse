import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Eye, CheckCircle, XCircle, UserX, Calendar, Hourglass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RiderStatus = "Pending" | "Active" | "Inactive" | "Rejected" | "Incompleted";

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
  rejection_reason?: string;
}

type RiderApplicationProgress = {
  detailsApproved?: boolean;
  documentsApproved?: boolean;
  bankApproved?: boolean;
  approvedDocs?: string[];
  pendingReuploads?: string[];
  pendingReuploadReasons?: Record<string, string>;
  bankReuploadReason?: string;
  incompleteReason?: string; // For storing incomplete/rejection reason
};

const RiderOnboardingQueue = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  type QueueTab = "pending" | "active" | "inactive" | "rejected" | "incompleted";
  const validTabs: QueueTab[] = ["pending", "active", "inactive", "rejected", "incompleted"];

  const normalizeTab = (value: unknown): QueueTab | undefined => {
    if (typeof value === "string" && (validTabs as string[]).includes(value)) {
      return value as QueueTab;
    }
    return undefined;
  };

  const [activeTab, setActiveTab] = useState<QueueTab>(() => {
    // Check if we came from rejection flow
    return normalizeTab((location.state as any)?.activeTab) || "pending";
  });
  const [selectedRider, setSelectedRider] = useState<RiderApplication | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [riders, setRiders] = useState<RiderApplication[]>([]);
  const [riderProgress, setRiderProgress] = useState<Record<string, RiderApplicationProgress>>({});

  // Load rider applications from localStorage (no hardcoded data)
  // Applications come from mobile/web app when riders apply
  useEffect(() => {
    const loadApplications = () => {
      try {
        const stored = localStorage.getItem('riderApplications');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRiders(parsed);
        } else {
          // No hardcoded data - start empty, wait for real applications from mobile/web
          setRiders([]);
        }
      } catch (error) {
        console.error('Error loading rider applications:', error);
        setRiders([]);
      }
    };

    const loadProgress = () => {
      try {
        const stored = localStorage.getItem('riderApplicationProgress');
        if (stored) {
          const parsed = JSON.parse(stored);
          setRiderProgress(parsed);
        } else {
          setRiderProgress({});
        }
      } catch (error) {
        console.error('Error loading rider application progress:', error);
        setRiderProgress({});
      }
    };

    loadApplications();
    loadProgress();

    // Listen for new application events (when rider applies from mobile/web)
    const handleNewApplication = (event?: CustomEvent) => {
      loadApplications();
      loadProgress();
      // Show notification with rider name if available
      const riderName = (event as CustomEvent)?.detail?.rider_name;
      toast({
        title: "New Rider Application",
        description: riderName 
          ? `${riderName} has submitted a new application` 
          : "A new rider has submitted an application",
      });
    };

    // Listen for custom event (when mobile/web app adds new application)
    window.addEventListener('newRiderApplication', handleNewApplication as EventListener);
    
    // Listen for document reuploads from rider
    const handleDocumentReuploaded = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { riderId, riderName, document } = customEvent.detail || {};
      
      if (riderId) {
        loadApplications();
        loadProgress();
        
        // Show notification when rider reuploads a document
        toast({
          title: "Document Reuploaded",
          description: `${riderName || 'Rider'} has reuploaded ${document || 'document'}. Please review.`,
        });
        
        // Move from Incompleted to Pending when rider reuploads
        try {
          const applications = JSON.parse(localStorage.getItem('riderApplications') || '[]');
          const progress = JSON.parse(localStorage.getItem('riderApplicationProgress') || '{}');
          
          const updatedApps = applications.map((r: any) => {
            if (r.rider_id === riderId) {
              // When rider reuploads, keep status as Pending (if not already Active or Rejected)
              // The isIncompleteApplication check will determine if it shows in Incompleted filter
              if (r.status !== 'Active' && r.status !== 'Rejected') {
                return { ...r, status: 'Pending' };
              }
            }
            return r;
          });
          localStorage.setItem('riderApplications', JSON.stringify(updatedApps));
          
          // Update progress to remove from pending reuploads
          if (progress[riderId]) {
            const updatedPending = (progress[riderId].pendingReuploads || []).filter((d: string) => d !== document);
            progress[riderId] = {
              ...progress[riderId],
              pendingReuploads: updatedPending
            };
            localStorage.setItem('riderApplicationProgress', JSON.stringify(progress));
          }
          
          window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { 
            detail: { riderId, status: 'Pending', activeTab: 'pending' } 
          }));
        } catch {}
      }
    };
    
    window.addEventListener('documentReuploaded', handleDocumentReuploaded as EventListener);
    
    // Listen for localStorage changes (cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'riderApplications') {
        loadApplications();
        // Show notification if new application was added
        if (e.newValue) {
          try {
            const newApps = JSON.parse(e.newValue);
            const oldApps = e.oldValue ? JSON.parse(e.oldValue) : [];
            if (newApps.length > oldApps.length) {
              const newApp = newApps[newApps.length - 1];
              toast({
                title: "New Rider Application",
                description: `${newApp.rider_name || 'A rider'} has submitted a new application`,
              });
            }
          } catch {}
        }
      }
      if (e.key === 'riderApplicationProgress') {
        loadProgress();
      }
    });

    // Poll for new applications (fallback for mobile app integration)
    // This checks localStorage periodically to detect new applications
    let previousCount = 0;
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('riderApplications');
        if (stored) {
          const parsed = JSON.parse(stored);
          const currentCount = parsed.length;
          if (currentCount > previousCount) {
            // New application detected
            const newRider = parsed[parsed.length - 1];
            loadApplications();
            loadProgress();
            toast({
              title: "New Rider Application",
              description: `${newRider.rider_name || 'A rider'} has submitted a new application`,
            });
          }
          previousCount = currentCount;
        } else {
          previousCount = 0;
        }
      } catch (error) {
        console.error('Error polling for new applications:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener('newRiderApplication', handleNewApplication as EventListener);
      window.removeEventListener('documentReuploaded', handleDocumentReuploaded as EventListener);
      clearInterval(pollInterval);
    };
  }, [toast]);

  useEffect(() => {
    const state = (location.state as any) || {};
    const desiredTab = normalizeTab(state.activeTab);
    const storedTab = normalizeTab(localStorage.getItem('riderQueueDefaultTab'));

    if (desiredTab && desiredTab !== activeTab) {
      setActiveTab(desiredTab);
      localStorage.removeItem('riderQueueDefaultTab');
    }

    if (desiredTab) {
      const { focusRider } = state;
      navigate(location.pathname, { replace: true, state: focusRider ? { focusRider } : null });
      return;
    }

    if (!desiredTab && storedTab && storedTab !== activeTab) {
      setActiveTab(storedTab);
      localStorage.removeItem('riderQueueDefaultTab');
    }
  }, [location.pathname, location.state, activeTab, navigate]);

  // Helper function to check if a rider application is incomplete
  // An application is incomplete ONLY if reupload has been requested
  // Incompleted: Single doc or bank doc, single or multiple docs that need reupload
  // New applications with unapproved sections should stay in Pending
  const isIncompleteApplication = useCallback((rider: RiderApplication): boolean => {
    // Don't mark Active or Rejected riders as incomplete
    if (rider.status === "Active" || rider.status === "Rejected") {
      return false;
    }
    
    const progress = riderProgress[rider.rider_id] || {};
    
    // Check for pending reuploads (single or multiple docs) - reupload was REQUESTED
    const hasPendingReuploads = (progress.pendingReuploads || []).length > 0;
    
    // Check for bank document reupload request - reupload was REQUESTED
    const hasBankReupload = !!progress.bankReuploadReason;
    
    // Check for incomplete reason (from rejection reason field)
    const hasIncompleteReason = !!progress.incompleteReason;
    
    // An application is incomplete if reupload has been requested OR incomplete reason exists
    // Unapproved sections alone don't make it incomplete - that's normal for new applications
    return hasPendingReuploads || hasBankReupload || hasIncompleteReason;
  }, [riderProgress]);

  const getIncompleteReason = useCallback((rider: RiderApplication): string => {
    const progress = riderProgress[rider.rider_id] || {};
    
    // Only return the incomplete reason (what user wrote in "Rejection Reason" field)
    // Don't show document reupload reasons here - those are handled separately
    if (progress.incompleteReason) {
      return progress.incompleteReason;
    }
    
    // If no incomplete reason, return empty string
    return '';
  }, [riderProgress]);

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.rider_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.mobile.includes(searchQuery);

    if (activeTab === "pending") {
      // Pending: New rider applications waiting for review (status is Pending AND not incomplete)
      return matchesSearch && rider.status === "Pending" && !isIncompleteApplication(rider);
    }
    if (activeTab === "incompleted") {
      // Incompleted: Has pending reuploads or unapproved sections (documents, bank, details)
      return matchesSearch && isIncompleteApplication(rider);
    }
    if (activeTab === "active") {
      // Active: Approved and onboarded riders (can get runsheets)
      return matchesSearch && rider.status === "Active";
    }
    if (activeTab === "inactive") {
      // Inactive: Riders not available (can toggle to active)
      return matchesSearch && rider.status === "Inactive";
    }
    if (activeTab === "rejected") {
      // Rejected: Multiple reupload requests, still issues, so rejected
      return matchesSearch && rider.status === "Rejected";
    }
    return false;
  });

  const handleTabChange = (value: string) => {
    const normalized = normalizeTab(value);
    if (!normalized) return;
    setActiveTab(normalized);
    localStorage.setItem('riderQueueDefaultTab', normalized);
  };

  const showIncompleteColumn = activeTab === "incompleted";
  const showRejectionColumn = activeTab === "rejected";
  const showActiveColumn = activeTab === "active" || activeTab === "inactive";
  const tableColumnCount = 6 + (showIncompleteColumn ? 1 : 0) + (showRejectionColumn ? 1 : 0) + (showActiveColumn ? 1 : 0);

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

  const handleViewRider = (rider: RiderApplication) => {
    // Navigate to details screen with short ID in URL
    const shortId = getShortRiderId(rider.rider_id);
    navigate(`/delivery/rider-onboarding-queue/${shortId}`, { state: { rider } });
  };

  const handleApprove = (riderId: string) => {
    // Find the rider to approve
    const riderToApprove = riders.find(r => r.rider_id === riderId);
    if (!riderToApprove) {
      toast({ title: "Error", description: "Rider not found", variant: "destructive" });
      return;
    }

    // Update application status in localStorage
    const updatedRiders = riders.map(r => 
      r.rider_id === riderId ? { ...r, status: "Active" as RiderStatus } : r
    );
    setRiders(updatedRiders);
    localStorage.setItem('riderApplications', JSON.stringify(updatedRiders));

    // Store approved rider in localStorage so it can be included in Total Riders count
    // TODO: When API is ready, approved riders will be automatically in the main riders table
    const approvedRiderData = {
      ...riderToApprove,
      status: "Active",
      zone: riderToApprove.city || "Unassigned"
    };
    
    // Get existing approved riders from localStorage
    const existingApprovedRiders = JSON.parse(localStorage.getItem('approvedRidersFromOnboarding') || '[]');
    
    // Add this rider if not already there (avoid duplicates)
    const riderExists = existingApprovedRiders.find((r: any) => r.rider_id === riderId);
    if (!riderExists) {
      existingApprovedRiders.push(approvedRiderData);
      localStorage.setItem('approvedRidersFromOnboarding', JSON.stringify(existingApprovedRiders));
    }
    
    toast({ 
      title: "Rider Approved", 
      description: `Rider ${riderToApprove.rider_name} (${riderId}) has been activated and added to Total Riders count` 
    });
    setViewDialog(false);
    setRefreshKey(k => k + 1);
    
    // Dispatch event to notify other components (like RiderOverview, CreateRunsheet) that a rider was approved
    window.dispatchEvent(new Event('riderApproved'));
    window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId, status: 'Active' } }));
  };

  const handleReject = (riderId: string) => {
    const updatedRiders = riders.map(r => 
      r.rider_id === riderId ? { ...r, status: "Rejected" as RiderStatus } : r
    );
    setRiders(updatedRiders);
    localStorage.setItem('riderApplications', JSON.stringify(updatedRiders));
    toast({ title: "Rider Rejected", description: `Rider ${riderId} has been rejected`, variant: "destructive" });
    setViewDialog(false);
    setRefreshKey(k => k + 1);
    window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId, status: 'Rejected' } }));
  };

  const handleDeactivate = (riderId: string) => {
    const updatedRiders = riders.map(r => 
      r.rider_id === riderId ? { ...r, status: "Inactive" as RiderStatus } : r
    );
    setRiders(updatedRiders);
    localStorage.setItem('riderApplications', JSON.stringify(updatedRiders));
    toast({ title: "Rider Deactivated", description: `Rider ${riderId} has been deactivated` });
    setViewDialog(false);
    setRefreshKey(k => k + 1);
    window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId, status: 'Inactive' } }));
  };

  const handleToggleActive = (rider: RiderApplication, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent row click navigation
    }
    
    const newStatus: RiderStatus = rider.status === "Active" ? "Inactive" : "Active";
    const updatedRiders = riders.map(r => 
      r.rider_id === rider.rider_id ? { ...r, status: newStatus } : r
    );
    setRiders(updatedRiders);
    localStorage.setItem('riderApplications', JSON.stringify(updatedRiders));
    
    // Also update approved riders if it's in that list
    try {
      const approvedRiders = JSON.parse(localStorage.getItem('approvedRidersFromOnboarding') || '[]');
      const updatedApproved = approvedRiders.map((r: any) => 
        r.rider_id === rider.rider_id ? { ...r, status: newStatus } : r
      );
      localStorage.setItem('approvedRidersFromOnboarding', JSON.stringify(updatedApproved));
    } catch {}
    
    toast({ 
      title: newStatus === "Active" ? "Rider Activated" : "Rider Deactivated", 
      description: `${rider.rider_name} is now ${newStatus.toLowerCase()}. ${newStatus === "Active" ? "Can receive runsheet assignments." : "Cannot receive runsheet assignments."}` 
    });
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('riderApplicationUpdated', { detail: { riderId: rider.rider_id, status: newStatus } }));
  };


const getStatusBadgeStyles = (status: RiderStatus, isIncomplete: boolean) => {
  // Always show "Pending" for incomplete applications or if status is "Incompleted"
  if (status === "Incompleted" || isIncomplete) {
    return {
      className: "bg-amber-100 text-amber-600 border-amber-200",
      icon: Hourglass,
      label: "Pending"
    };
  }

  switch (status) {
    case "Active":
      return {
        className: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle,
        label: "Active"
      };
    case "Pending":
      return {
        className: "bg-amber-100 text-amber-600 border-amber-200",
        icon: Hourglass,
        label: "Pending"
      };
    case "Inactive":
      return {
        className: "bg-slate-100 text-slate-600 border-slate-200",
        icon: UserX,
        label: "Inactive"
      };
    case "Rejected":
      return {
        className: "bg-red-100 text-red-600 border-red-200",
        icon: XCircle,
        label: "Rejected"
      };
    default:
      // Default case handles any other status (including "Incompleted" which is already handled above)
      return {
        className: "bg-muted text-muted-foreground border-muted",
        icon: Hourglass,
        label: "Pending"
      };
  }
};

  // Stable short ID mapping: maps any long riderId to RD### (persisted)
  const getShortRiderId = (riderId: string): string => {
    try {
      const key = 'riderIdShortMap';
      const stored = localStorage.getItem(key);
      const map: Record<string, string> = stored ? JSON.parse(stored) : {};
      // Return existing mapping if present
      if (map[riderId]) return map[riderId];

      // If already short like RD001/R001, keep as-is and store
      if (/^[A-Z]{1,3}\d{1,4}$/.test(riderId)) {
        map[riderId] = riderId;
        localStorage.setItem(key, JSON.stringify(map));
        return riderId;
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
      map[riderId] = code;
      localStorage.setItem(key, JSON.stringify(map));
      return code;
    } catch {
      // Fallback if storage not available
      return riderId;
    }
  };

  // Compute stats from current riders state
  const mergedRiders = useMemo(() => {
    // Use current riders state (loaded from localStorage)
    return riders;
  }, [riders, refreshKey]);

  const stats = useMemo(() => ({
    total: mergedRiders.length,
    // Pending: New applications waiting for review (status is Pending AND not incomplete)
    pending: mergedRiders.filter((r) => r.status === "Pending" && !isIncompleteApplication(r)).length,
    // Active: Approved and onboarded riders (can get runsheets)
    active: mergedRiders.filter((r) => r.status === "Active").length,
    // Inactive: Riders not available (can toggle to active)
    inactive: mergedRiders.filter((r) => r.status === "Inactive").length,
    // Rejected: Multiple reupload requests, still issues
    rejected: mergedRiders.filter((r) => r.status === "Rejected").length,
    // Incompleted: Has pending reuploads or unapproved sections
    incompleted: mergedRiders.filter((r) => isIncompleteApplication(r)).length,
  }), [mergedRiders, isIncompleteApplication]);

  // Refresh counts when a rider is approved/rejected or when localStorage changes (e.g., across tabs)
  useEffect(() => {
    const refreshRiders = () => {
      const stored = localStorage.getItem('riderApplications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRiders(parsed);
          return;
        } catch {}
      }
      setRiders([]);
    };

    const refreshProgress = () => {
      const stored = localStorage.getItem('riderApplicationProgress');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRiderProgress(parsed);
          return;
        } catch {}
      }
      setRiderProgress({});
    };

    const onApproved = () => {
      setRefreshKey((k) => k + 1);
      refreshRiders();
      refreshProgress();
    };
    const onUpdated = (event?: Event) => {
      setRefreshKey((k) => k + 1);
      refreshRiders();
      refreshProgress();
      const nextTab = (event as CustomEvent)?.detail?.activeTab as typeof activeTab | undefined;
      if (nextTab && nextTab !== activeTab) {
        setActiveTab(nextTab);
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'approvedRidersFromOnboarding' || e.key === 'riderApplications') {
        setRefreshKey((k) => k + 1);
        if (e.key === 'riderApplications' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            setRiders(parsed);
          } catch {}
        }
      }
      if (e.key === 'riderApplicationProgress' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setRiderProgress(parsed);
        } catch {}
      }
    };
    window.addEventListener('riderApproved', onApproved);
    window.addEventListener('riderApplicationUpdated', onUpdated);
    window.addEventListener('riderApplicationProgressUpdated', onUpdated as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('riderApproved', onApproved);
      window.removeEventListener('riderApplicationUpdated', onUpdated);
      window.removeEventListener('riderApplicationProgressUpdated', onUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Page header - matches Rider Overview */}
      <main>
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Rider Onboarding Queue</h1>
            <p className="text-sm text-muted-foreground">Manage and review rider applications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">All Riders</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-warning">{stats.pending}</p>
                </div>
                <Calendar className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-success">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={activeTab} onValueChange={handleTabChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="incompleted">Incompleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Riders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rider Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rider Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Status</TableHead>
                  {showIncompleteColumn && <TableHead>Incomplete Reason</TableHead>}
                  {showRejectionColumn && <TableHead>Rejection Reason</TableHead>}
                  {showActiveColumn && <TableHead>Active</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tableColumnCount} className="text-center py-8 text-muted-foreground">No riders found</TableCell>
                  </TableRow>
                ) : (
                  filteredRiders.map((rider) => (
                    <TableRow
                      key={rider.id}
                      onClick={() => handleViewRider(rider)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleViewRider(rider);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      className="cursor-pointer hover:bg-muted/40 focus:bg-muted/40 focus:outline-none transition-colors"
                    >
                      <TableCell>{rider.joining_date}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{rider.rider_name}</span>
                          {rider.status === 'Active' && (
                            <span className="text-xs text-muted-foreground">{getShortRiderId(rider.rider_id)}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{rider.mobile}</TableCell>
                      <TableCell>{rider.city}</TableCell>
                      <TableCell>{rider.vehicle_type}</TableCell>
                      <TableCell>
                        {(() => {
                          const isIncomplete = isIncompleteApplication(rider);
                          // Always show "Pending" for incomplete applications, regardless of rider.status
                          // Also handle case where rider.status might be "Incompleted" (from old data)
                          const effectiveStatus = (isIncomplete || rider.status === "Incompleted") ? "Pending" : rider.status;
                          const { className, icon: Icon } = getStatusBadgeStyles(effectiveStatus, isIncomplete);
                          // Always use "Pending" label for incomplete applications - never show "Incompleted"
                          const displayLabel = (isIncomplete || rider.status === "Incompleted") ? "Pending" : 
                                             (rider.status === "Active" ? "Active" :
                                              rider.status === "Inactive" ? "Inactive" :
                                              rider.status === "Rejected" ? "Rejected" : "Pending");
                          return (
                            <Badge className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold border ${className}`}>
                              <Icon className="h-3.5 w-3.5" />
                              <span className="uppercase tracking-wide">{displayLabel}</span>
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      {showIncompleteColumn && (
                        <TableCell>
                          {isIncompleteApplication(rider) && getIncompleteReason(rider) ? (
                            <span className="text-sm text-destructive italic">{getIncompleteReason(rider)}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {showRejectionColumn && (
                        <TableCell>
                          {rider.status === 'Rejected' && rider.rejection_reason ? (
                            <span className="text-sm text-destructive italic">{rider.rejection_reason}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      )}
                      {showActiveColumn && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={rider.status === "Active"}
                            onCheckedChange={() => handleToggleActive(rider)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* View Rider Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rider Profile</DialogTitle>
            <DialogDescription>
              {selectedRider?.rider_name} - {selectedRider?.rider_id}
            </DialogDescription>
          </DialogHeader>
          {selectedRider && (
            <div className="space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedRider.rider_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DOB</p>
                    <p className="font-medium">{selectedRider.dob || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium">{selectedRider.mobile}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{selectedRider.emergency_contact || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRider.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedRider.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rider ID</p>
                    <p className="font-medium">{selectedRider.rider_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{selectedRider.joining_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vehicle Type</p>
                    <p className="font-medium">{selectedRider.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City/Zone</p>
                    <p className="font-medium">{selectedRider.city}</p>
                  </div>
                </div>
              </div>

              {/* Identity Documents */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Identity Documents</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">License Number</p>
                      <p className="font-medium">{selectedRider.license_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aadhaar Number</p>
                      <p className="font-medium">{selectedRider.aadhaar_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PAN Card</p>
                      <p className="font-medium">{selectedRider.pan_card}</p>
                    </div>
                  </div>

                  {/* Document Upload/View Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm mb-3">Document Files</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Aadhaar Card</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">PAN Card</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Driving License</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Bank Account Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{selectedRider.bank_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account Holder Name</p>
                    <p className="font-medium">{selectedRider.account_holder_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account Number</p>
                    <p className="font-medium">{selectedRider.account_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IFSC Code</p>
                    <p className="font-medium">{selectedRider.ifsc_code || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
                {selectedRider.status === "Pending" && (
                  <>
                    <Button variant="default" onClick={() => handleApprove(selectedRider.rider_id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleReject(selectedRider.rider_id)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedRider.status === "Active" && (
                  <Button variant="outline" onClick={() => handleDeactivate(selectedRider.rider_id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderOnboardingQueue;


