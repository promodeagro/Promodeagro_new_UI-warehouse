import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Package, DollarSign, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orders as dummyOrders, riders, runsheets as dummyRunsheets } from "@/data/dummyData";
import type { Runsheet, Order } from "@/data/dummyData";
import type { OrderStatus } from "@/data/orderData";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const CloseRunsheet = () => {
  const { id, runsheetId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use id or runsheetId (for backward compatibility)
  const runsheetParam = id || runsheetId;

  // State declarations
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'mismatch'>('pending');
  const [isClosed, setIsClosed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when orders update
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [invalidOrderDialog, setInvalidOrderDialog] = useState(false);
  const [selectedOrderForInvalid, setSelectedOrderForInvalid] = useState<any>(null);
  const [invalidReason, setInvalidReason] = useState("");
  const [invalidNotes, setInvalidNotes] = useState("");
  const [pendingAmount, setPendingAmount] = useState<string>(""
  );
  const [pendingReason, setPendingReason] = useState<string>("");

  // Load runsheet and orders dynamically (dummy data + localStorage overrides)
  const { runsheet, runsheetOrders } = useMemo(() => {
    // Merge runsheets: overlay localStorage onto dummy by id (so edits replace dummy)
    let allRunsheets = [...dummyRunsheets];
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed: Runsheet[] = JSON.parse(storedRunsheets);
        const map = new Map(allRunsheets.map(r => [r.id, r]));
        parsed.forEach((r: Runsheet) => map.set(r.id, { ...map.get(r.id), ...r }));
        allRunsheets = Array.from(map.values());
      }
    } catch {}

    const currentRunsheet = allRunsheets.find(r => r.id === runsheetParam) || allRunsheets[0] || null;

    // Merge orders: dummy + localStorage updates
    let allOrders = [...dummyOrders];
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }
    } catch {}

    const orderIds = currentRunsheet?.orders_assigned || [];
    const rsOrders = orderIds
      .map(oid => allOrders.find(o => o.id === oid))
      .filter(Boolean) as Order[];

    return {
      runsheet: currentRunsheet,
      runsheetOrders: rsOrders,
    };
  }, [runsheetParam, refreshKey]); // Include refreshKey to force recalculation

  const rider = riders.find(r => r.id === runsheet?.rider_id);

  // Guard against missing runsheet
  if (!runsheet) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="container mx-auto">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Runsheet not found</p>
              <div className="mt-4 flex justify-center">
                <Link to="/delivery/runsheets">
                  <Button variant="outline">Back to Runsheets</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Determine back navigation path
  // Prefer the history push state path (so RunsheetManagement -> View Details -> Back returns correctly)
  const location = useLocation();
  const backPath = (() => {
    if ((location.state as any)?.from) {
      return (location.state as any).from as string;
    }
    if (location.pathname.includes("runsheet-management/closerunsheet")) {
      return "/delivery/runsheets";
    }
    if (runsheet?.rider_id) {
      return `/delivery/rider-overview/runsheets-history/${runsheet.rider_id}`;
    }
    return "/delivery/runsheets";
  })();

  /**
   * ============================================================================
   * MOBILE APP SYNC: Listen for order updates from rider mobile app
   * ============================================================================
   * When rider marks an order as completed via mobile app:
   * 1. Mobile app sends order update to backend API
   * 2. Backend updates order status to 'Delivered' in database
   * 3. This component listens for order update events and refreshes
   * 
   * TODO: When API is ready, replace this with actual event listener
   */
  useEffect(() => {
    const handleOrderUpdate = () => {
      // Force component to recalculate with updated orders
      setRefreshKey(prev => prev + 1);
    };
    
    // Listen for custom order update events
    window.addEventListener('orderStatusUpdated', handleOrderUpdate);
    window.addEventListener('riderOrderCompleted', handleOrderUpdate);
    window.addEventListener('runsheetUpdated', handleOrderUpdate);
    
    // Also listen for storage events (when localStorage is updated)
    window.addEventListener('storage', (e) => {
      if (e.key === 'warehouse-orders') {
        handleOrderUpdate();
      }
    });
    
    // Poll for updates (fallback - will be replaced with real-time sync via API)
    // TODO: Remove polling when API real-time sync is implemented
    const pollInterval = setInterval(() => {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        setRefreshKey(prev => prev + 1);
      }
    }, 5000); // Poll every 5 seconds
    
    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
      window.removeEventListener('riderOrderCompleted', handleOrderUpdate);
        window.removeEventListener('runsheetUpdated', handleOrderUpdate);
      clearInterval(pollInterval);
    };
  }, [runsheetParam]);

  // Calculate totals from actual order data
  const totalOrders = runsheetOrders.length;
  const deliveredOrders = runsheetOrders.filter(o => o.status && o.status.toLowerCase() === 'delivered').length;
  const codOrders = runsheetOrders.filter(o => o.payment_mode === 'COD');
  const prepaidOrders = runsheetOrders.filter(o => o.payment_mode === 'Online');
  const expectedCODRaw = codOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalPrepaidRaw = prepaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Auto undelivered totals
  const undeliveredOrders = runsheetOrders.filter(o => (o.status || '').toLowerCase() === 'undelivered');
  const autoUndeliveredTotal = undeliveredOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const autoUndeliveredCOD = undeliveredOrders.filter(o => o.payment_mode === 'COD').reduce((s, o) => s + (o.total_amount || 0), 0);
  const autoUndeliveredPrepaid = undeliveredOrders.filter(o => o.payment_mode === 'Online').reduce((s, o) => s + (o.total_amount || 0), 0);

  // Initialize input with auto-undelivered whenever recalculated (unless user is editing)
  const effectiveUndelivered = autoUndeliveredTotal;

  // Adjusted totals (subtract undelivered from components; manual override reduces grand total further if needed)
  const expectedCOD = Math.max(0, expectedCODRaw - autoUndeliveredCOD);
  const totalPrepaid = Math.max(0, totalPrepaidRaw - autoUndeliveredPrepaid);
  const grandTotal = Math.max(0, expectedCOD + totalPrepaid - Math.max(0, effectiveUndelivered - (autoUndeliveredCOD + autoUndeliveredPrepaid)));

  // Editable collection inputs (prefilled from auto totals)
  const [codCollectedInput, setCodCollectedInput] = useState<string>("");
  const [onlineCollectedInput, setOnlineCollectedInput] = useState<string>("");

  useEffect(() => {
    // Prefill COD with expected; Online (UPI) starts at 0 (separate from prepaid)
    setCodCollectedInput(expectedCOD.toFixed(2));
    setOnlineCollectedInput("0.00");
  }, [expectedCOD]);

  // Keep allocation between COD and Online in sync:
  // - When Online (UPI) increases, COD Collected decreases so that
  //   COD Collected + Online (UPI) = COD Expected (clamped at 0..COD Expected)
  useEffect(() => {
    const online = Math.max(0, Math.min(parseFloat(onlineCollectedInput || "0"), expectedCOD));
    const newCod = Math.max(0, expectedCOD - (isNaN(online) ? 0 : online));
    // Only set if different to avoid cursor jumps while typing
    const asFixed = newCod.toFixed(2);
    if (asFixed !== codCollectedInput) {
      setCodCollectedInput(asFixed);
    }
  }, [onlineCollectedInput, expectedCOD]); 

  // Grand Total should not change with allocation; it equals Prepaid + COD Expected
  const adjustedGrandTotal = useMemo(() => {
    return totalPrepaid + expectedCOD;
  }, [totalPrepaid, expectedCOD]);

  // Initialize pending fields from runsheet if present
  useEffect(() => {
    if (runsheet) {
      const anyRs: any = runsheet as any;
      if (anyRs.pending_amount !== undefined) {
        setPendingAmount(String(anyRs.pending_amount));
      }
      if (anyRs.pending_reason !== undefined) {
        setPendingReason(String(anyRs.pending_reason || ""));
      }
    }
  }, [runsheet, refreshKey]);

  const handleVerifyCollection = () => {
    const collected = parseFloat(collectedAmount);
    const pending = parseFloat(pendingAmount);
    
    if (isNaN(collected)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    // shortage is what rider still owes vs COD expected
    const shortage = expectedCOD - collected;

    if (Math.abs(collected - expectedCOD) < 0.01) {
      setVerificationStatus('verified');
      // Clear pending amount if rider paid back the full amount
      if (!isNaN(pending) && pending > 0) {
        setPendingAmount("");
        setPendingReason("");
        try {
          const storedRunsheets = localStorage.getItem('warehouse-runsheets');
          if (storedRunsheets) {
            const parsed = JSON.parse(storedRunsheets);
            const updated = parsed.map((r: any) => r.id === runsheet.id ? { ...r, pending_amount: 0, pending_reason: "" } : r);
            localStorage.setItem('warehouse-runsheets', JSON.stringify(updated));
          }
        } catch {}
      }
      toast({
        title: "✓ Collection Verified",
        description: `Amount matches expected COD: ₹${expectedCOD}${!isNaN(pending) && pending > 0 ? '. Pending amount cleared.' : ''}`,
      });
    } else {
      // If pending is recorded and equals the shortage (within rounding), accept with warning
      if (!isNaN(pending) && pending > 0 && Math.abs(shortage - pending) < 0.01) {
        setVerificationStatus('verified');
        // Persist pending to runsheet for future reconciliation
        try {
          const storedRunsheets = localStorage.getItem('warehouse-runsheets');
          if (storedRunsheets) {
            const parsed = JSON.parse(storedRunsheets);
            const updated = parsed.map((r: any) => r.id === runsheet.id ? { ...r, pending_amount: pending, pending_reason: pendingReason } : r);
            localStorage.setItem('warehouse-runsheets', JSON.stringify(updated));
          }
        } catch {}
        toast({
          title: "⚠ Verified with Pending",
          description: `Pending from rider: ₹${pending.toFixed(2)}`,
        });
      } else {
        setVerificationStatus('mismatch');
        toast({
          title: "⚠ Amount Mismatch",
          description: `Expected: ₹${expectedCOD}, Collected: ₹${collected}${!isNaN(pending) && pending > 0 ? `, Pending noted: ₹${pending.toFixed(2)}` : ''}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseRunsheet = () => {
    if (verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "Please verify collection before closing runsheet",
        variant: "destructive",
      });
      return;
    }

    // Mark any remaining "On the way" orders as "Undelivered" when closing runsheet
    // This handles the case where rider doesn't return to hub with all orders
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      let allOrders = [...dummyOrders];
      
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }

      // Get orders in this runsheet that are still "On the way"
      const runsheetOrderIds = runsheet.orders_assigned || [];
      const undeliveredOrders = allOrders.filter(o => 
        runsheetOrderIds.includes(o.id) && o.status === 'On the way'
      );

      // Update undelivered orders
      if (undeliveredOrders.length > 0) {
        const updatedOrders = allOrders.map(o => {
          if (runsheetOrderIds.includes(o.id) && o.status === 'On the way') {
            return {
              ...o,
              status: 'Undelivered' as OrderStatus,
              updated_at: new Date().toISOString()
            };
          }
          return o;
        });

        localStorage.setItem('warehouse-orders', JSON.stringify(updatedOrders));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
          detail: { 
            orderIds: undeliveredOrders.map(o => o.id), 
            status: 'Undelivered'
          }
        }));

        toast({
          title: "Undelivered Orders Marked",
          description: `${undeliveredOrders.length} order(s) marked as Undelivered`,
        });
      }
    } catch (error) {
      console.error('Error marking undelivered orders:', error);
    }

    // TODO: When API is ready, call API to close runsheet
    // Update runsheet status in localStorage (for now)
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed = JSON.parse(storedRunsheets);
        const updated = parsed.map((r: Runsheet) => 
          r.id === runsheet.id ? { ...r, status: 'Completed' } : r
        );
        localStorage.setItem('warehouse-runsheets', JSON.stringify(updated));
      }
    } catch {}

    setIsClosed(true);
    toast({
      title: "✓ Runsheet Closed",
      description: `${runsheet.id} has been closed successfully`,
    });

    setTimeout(() => {
      // Navigate back to runsheet history if rider_id exists, otherwise to runsheets management
      const redirectPath = runsheet.rider_id 
        ? `/delivery/rider-overview/runsheets-history/${runsheet.rider_id}`
        : '/delivery/runsheets';
      // When returning to rider history, open Closed tab by default
      if (runsheet.rider_id) {
        navigate(redirectPath, { state: { defaultTab: 'closed' } });
      } else {
        navigate(redirectPath);
      }
    }, 2000);
  };

  const difference = collectedAmount ? parseFloat(collectedAmount) - expectedCOD : 0;

  // Handle checkbox selection
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(runsheetOrders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedOrders.size === 0) return;

    if (status === 'Undelivered') {
      // Open dialog for first selected order
      const firstSelectedId = Array.from(selectedOrders)[0];
      const firstOrder = runsheetOrders.find(o => o.id === firstSelectedId);
      if (firstOrder) {
        setSelectedOrderForInvalid({ ...firstOrder, selectedIds: Array.from(selectedOrders) });
        setInvalidOrderDialog(true);
      }
      return;
    }

    // Update status for selected orders
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      let allOrders = [...dummyOrders];
      
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }

      // Update status for selected orders
      const updatedOrders = allOrders.map(o => {
        if (selectedOrders.has(o.id)) {
          const newStatus = status === 'On the way' ? 'On the way' : status === 'Delivered' ? 'Delivered' : status === 'Undelivered' ? 'Undelivered' : o.status;
          // Preserve rider info if available
          const riderInfo = runsheet?.rider_id && rider ? {
            assigned_rider_id: runsheet.rider_id,
            assigned_rider_name: rider.name
          } : {};
          return { 
            ...o, 
            status: newStatus,
            ...riderInfo,
            updated_at: new Date().toISOString()
          };
        }
        return o;
      });

      const updatedCount = selectedOrders.size;
      localStorage.setItem('warehouse-orders', JSON.stringify(updatedOrders));
      
      // Dispatch event to notify other components (like OrdersList) of the update
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: { orderIds: Array.from(selectedOrders), status }
      }));
      
      setRefreshKey(prev => prev + 1);
      setSelectedOrders(new Set());
      
      toast({
        title: "Status Updated",
        description: `${updatedCount} order(s) updated to ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  // Handle submit invalid order
  const handleSubmitInvalidOrder = () => {
    if (!invalidReason) {
      toast({
        title: "Error",
        description: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      let allOrders = [...dummyOrders];
      
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }

      const selectedIds = selectedOrderForInvalid?.selectedIds || [selectedOrderForInvalid?.id];
      const updatedOrders = allOrders.map(o => {
        if (selectedIds.includes(o.id)) {
          // Preserve rider info if available
          const riderInfo = runsheet?.rider_id && rider ? {
            assigned_rider_id: runsheet.rider_id,
            assigned_rider_name: rider.name
          } : {};
          return { 
            ...o, 
            status: 'Undelivered',
            undelivered_reason: invalidReason,
            undelivered_notes: invalidNotes,
            ...riderInfo,
            updated_at: new Date().toISOString()
          };
        }
        return o;
      });

      localStorage.setItem('warehouse-orders', JSON.stringify(updatedOrders));
      
      // Dispatch event to notify other components (like OrdersList) of the update
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: { orderIds: selectedIds, status: 'Undelivered' }
      }));
      
      setRefreshKey(prev => prev + 1);
      setSelectedOrders(new Set());
      setInvalidOrderDialog(false);
      setInvalidReason("");
      setInvalidNotes("");
      
      toast({
        title: "Order(s) Marked as Undelivered",
        description: `${selectedIds.length} order(s) marked as undelivered`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark order as undelivered",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={backPath}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Close Runsheet</h1>
                <p className="text-sm text-muted-foreground">Verify collections and close runsheet</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isClosed ? "default" : "secondary"} className="text-sm px-4 py-2">
                {isClosed ? "Closed" : (runsheet.status || 'Created')}
              </Badge>
               {/* Edit runsheet - navigates to CreateRunsheet with context to add orders */}
               <Link to={`/delivery/create-runsheet?edit=${runsheet.id}`} state={{ riderId: runsheet.rider_id, returnTo: location.pathname, orderIds: runsheet.orders_assigned }}>
                <Button size="sm" variant="outline" className="h-8">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Runsheet Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Runsheet Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Runsheet ID</Label>
                  <p className="font-mono font-bold text-foreground">{runsheet.id}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Rider</Label>
                  <p className="font-medium text-foreground">{runsheet.rider_name || rider?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{rider?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created Date & Time</Label>
                  <p className="text-sm font-medium text-foreground">
                    {runsheet.created_at 
                      ? new Date(runsheet.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : runsheet.run_date || runsheet.date || 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders:</span>
                  <span className="font-bold text-foreground">{totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivered:</span>
                  <span className="font-bold text-success">{deliveredOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate:</span>
                  <span className="font-bold text-primary">
                    {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Collection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">COD Expected:</span>
                  <span className="font-bold text-warning">₹{expectedCOD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Prepaid Total:</span>
                  <span className="font-bold text-success">₹{totalPrepaid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">COD Collected:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                      value={codCollectedInput}
                      onChange={(e) => setCodCollectedInput(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="h-8 w-28 text-right"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Online (UPI):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">₹</span>
                    <Input
                      value={onlineCollectedInput}
                      onChange={(e) => setOnlineCollectedInput(e.target.value.replace(/[^0-9.]/g, ''))}
                      className="h-8 w-28 text-right"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Grand Total:</span>
                  <span className="font-bold text-primary">₹{adjustedGrandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Orders & Verification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Order Details ({runsheetOrders.length})</CardTitle>
                  {selectedOrders.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Update Status ({selectedOrders.size})
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('On the way')}>
                          On the way
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('Delivered')}>
                          Delivered
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('Undelivered')}>
                          Undelivered
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.size === runsheetOrders.length && runsheetOrders.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runsheetOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      runsheetOrders.map((order) => {
                        // Derive delivery status:
                        // - If order is Delivered → 'Delivered'
                        // - Else if runsheet is not Completed (Created/In Transit) → 'On the way'
                        // - Else fallback to the order's status or 'Pending'
                        let deliveryStatus = 'Pending';
                        const orderStatus = (order.status || '').toString();
                        if (orderStatus.toLowerCase() === 'delivered') {
                          deliveryStatus = 'Delivered';
                        } else if (orderStatus.toLowerCase() === 'undelivered') {
                          deliveryStatus = 'Undelivered';
                        } else if (runsheet && (runsheet.status === 'Created' || runsheet.status === 'In Transit')) {
                          deliveryStatus = 'On the way';
                        } else if (orderStatus) {
                          deliveryStatus = orderStatus;
                        }

                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedOrders.has(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">{order.order_number || order.id}</TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={order.payment_mode === 'COD' ? 'secondary' : 'default'}
                                className={
                                  order.payment_mode === 'COD' 
                                    ? 'bg-black text-white' 
                                    : order.payment_mode === 'Online'
                                    ? 'bg-green-600 text-white'
                                    : ''
                                }
                              >
                                {order.payment_mode === 'Online' ? 'Prepaid' : order.payment_mode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  deliveryStatus === 'Delivered' 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : deliveryStatus === 'On the way'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : deliveryStatus === 'Undelivered'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : ''
                                }
                              >
                                {deliveryStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {deliveryStatus === 'Undelivered' ? (
                                <span className="text-sm text-red-700">
                                  {(() => {
                                    const map: Record<string, string> = {
                                      customer_cancelled: 'Customer Cancelled',
                                      wrong_address: 'Wrong Address',
                                      damaged_item: 'Damaged Item',
                                      payment_issue: 'Payment Issue',
                                      customer_not_available: 'Customer Not Available',
                                      others: 'Others',
                                    };
                                    const code = (order as any).undelivered_reason as string;
                                    const text = code ? (map[code] || code) : '';
                                    const notes = (order as any).undelivered_notes as string;
                                    return notes ? `${text}${text ? ' - ' : ''}${notes}` : text || '-';
                                  })()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{order.total_amount || 0}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cash Collection & Verification */}
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle>Cash Collection & Verification</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Expected COD Amount</Label>
                    <Input 
                      value={`₹${expectedCOD.toFixed(2)}`} 
                      disabled 
                      className="font-bold text-lg bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Collected Amount *</Label>
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(e.target.value)}
                      placeholder="Enter collected amount"
                      className="font-bold text-lg"
                      disabled={verificationStatus === 'verified'}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Mode</Label>
                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Pending Amount</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={pendingAmount}
                      onChange={(e) => setPendingAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                      placeholder="Enter pending amount (if any)"
                      className="font-bold text-lg"
                    />
                  </div>
                </div>

                <div>
                  <Label>Pending Reason</Label>
                  <Textarea
                    value={pendingReason}
                    onChange={(e) => setPendingReason(e.target.value)}
                    placeholder="Reason for pending amount (e.g., rider used cash for emergency)"
                    className="w-full resize-y max-h-[100px]"
                    rows={3}
                  />
                </div>

                {collectedAmount && (
                  <div className={`p-4 rounded-lg border ${
                    difference === 0 ? 'bg-success/10 border-success/20' : 
                    difference > 0 ? 'bg-warning/10 border-warning/20' : 
                    'bg-destructive/10 border-destructive/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {difference === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : difference > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-semibold text-foreground">
                        {difference === 0 ? 'Amount Match' : difference > 0 ? 'Excess Amount' : 'Shortage'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Difference: <span className="font-bold">₹{Math.abs(difference).toFixed(2)}</span>
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-3">
                  <Button 
                    onClick={handleVerifyCollection}
                    disabled={!collectedAmount || verificationStatus === 'verified'}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify Collection
                  </Button>
                  <Button 
                    onClick={handleCloseRunsheet}
                    disabled={verificationStatus !== 'verified' || isClosed}
                    variant="default"
                    className="flex-1"
                  >
                    Close Runsheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Undelivered Order Dialog */}
      <Dialog open={invalidOrderDialog} onOpenChange={setInvalidOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order(s) as Undelivered</DialogTitle>
            <DialogDescription>
              {selectedOrderForInvalid?.selectedIds && selectedOrderForInvalid.selectedIds.length > 1
                ? `${selectedOrderForInvalid.selectedIds.length} orders selected`
                : `Order: ${selectedOrderForInvalid?.order_number || selectedOrderForInvalid?.id} - ${selectedOrderForInvalid?.customer_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Display order amount */}
            {selectedOrderForInvalid?.selectedIds && selectedOrderForInvalid.selectedIds.length > 1 ? (
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-lg font-bold text-primary">
                    ₹{(() => {
                      const total = runsheetOrders
                        .filter(o => selectedOrderForInvalid.selectedIds.includes(o.id))
                        .reduce((sum, o) => sum + (o.total_amount || 0), 0);
                      return total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-lg font-bold text-primary">
                    ₹{(selectedOrderForInvalid?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            )}
            <div>
              <Label>Reason *</Label>
              <Select value={invalidReason} onValueChange={setInvalidReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_cancelled">Customer Cancelled</SelectItem>
                  <SelectItem value="wrong_address">Wrong Address</SelectItem>
                  <SelectItem value="damaged_item">Damaged Item</SelectItem>
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="customer_not_available">Customer Not Available</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add additional notes..."
                value={invalidNotes}
                onChange={(e) => setInvalidNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvalidOrderDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSubmitInvalidOrder}>
                <XCircle className="h-4 w-4 mr-2" />
                Mark Undelivered
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloseRunsheet;


