import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { riders, orders, runsheets as allRunsheets } from "@/data/dummyData";
import type { Rider, Order, Runsheet } from "@/data/dummyData";
import { orders as dummyOrders, type OrderStatus } from "@/data/orderData";
import {
  FileText,
  Scan,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Send,
  PackagePlus,
  Package,
  Search
} from "lucide-react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

/**
 * ============================================================================
 * API INTEGRATION READY: Order Fetching Service
 * ============================================================================
 * 
 * TODO: When API is ready, replace this function with actual API call
 * 
 * Expected API Endpoint:
 * GET /api/orders?status=Packed
 * 
 * Expected Response Format:
 * {
 *   success: boolean,
 *   data: Order[],
 *   message?: string
 * }
 * 
 * Example API Implementation:
 * ```
 * const fetchPackedOrders = async (): Promise<Order[]> => {
 *   try {
 *     const response = await fetch('/api/orders?status=Packed', {
 *       method: 'GET',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'Authorization': `Bearer ${token}`
 *       }
 *     });
 *     const result = await response.json();
 *     if (result.success) {
 *       return result.data;
 *     }
 *     throw new Error(result.message || 'Failed to fetch packed orders');
 *   } catch (error) {
 *     console.error('Error fetching packed orders:', error);
 *     throw error;
 *   }
 * };
 * ```
 * 
 * This function should:
 * 1. Fetch orders with status = 'Packed' from the database
 * 2. Return an array of Order objects
 * 3. Handle errors gracefully
 * 4. Work with the existing lookup logic (order_number, id matching)
 */
const fetchPackedOrders = async (): Promise<Order[]> => {
  // TODO: Replace with actual API call
  // For now, return orders with packing_status === 'packed' from localStorage and dummy data
  return new Promise((resolve) => {
    // Simulate API delay
    setTimeout(() => {
      // Get orders from localStorage
      let allOrdersList: Order[] = [...dummyOrders as any];
      try {
        const storedOrders = localStorage.getItem('warehouse-orders');
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          const map = new Map(allOrdersList.map(o => [o.id, o]));
          parsed.forEach((o: Order) => map.set(o.id, o));
          allOrdersList = Array.from(map.values());
        }
      } catch (error) {
        console.error('Error loading orders from localStorage:', error);
      }
      
      // Filter orders with packing_status === 'packed' (completed by packer)
      // Only show orders that are:
      // 1. Packed by packer (packing_status === 'packed')
      // 2. Not yet assigned to a runsheet/rider (no assigned_rider_id)
      // 3. Ready to be added to a runsheet
      const packedOrders = allOrdersList.filter(o => {
        // Check if order is packed (completed by packer)
        const isPacked = (o as any).packing_status === 'packed';
        // Exclude orders that are already assigned to a rider/runsheet
        const isNotAssignedToRider = !(o as any).assigned_rider_id && !(o as any).assigned_rider_name;
        // Only show truly packed orders that are not yet in a runsheet
        return isPacked && isNotAssignedToRider;
      });
      resolve(packedOrders);
    }, 0);
  });
};

/**
 * Search packed order by order_number or id
 * This logic works with both dummy data and API data
 * 
 * @param orders - Array of packed orders
 * @param searchTerm - Order number or ID to search
 * @returns Found order or null
 */
const findOrderByNumberOrId = (orders: Order[], searchTerm: string): Order | null => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return null;

  return orders.find(o => {
    const orderNum = o.order_number?.toLowerCase() || '';
    const orderId = o.id?.toLowerCase() || '';
    // Exact match or partial match
    return orderNum === normalizedSearch ||
           orderId === normalizedSearch ||
           orderNum.includes(normalizedSearch) ||
           orderId.includes(normalizedSearch);
  }) || null;
};

/**
 * Get product unit from product name (fallback when item.unit is not available)
 * Syncs with OrderDetail component logic
 */
const getProductUnit = (productName: string): string => {
  const mockProducts = [
    { name: 'Organic Tomatoes', unit: 'kg' },
    { name: 'Fresh Potatoes', unit: 'kg' },
    { name: 'Red Onions', unit: 'kg' },
    { name: 'Shimla Apples', unit: 'kg' },
    { name: 'Farm Bananas', unit: 'dozen' },
    { name: 'Orange Carrots', unit: 'kg' },
    { name: 'Fresh Spinach', unit: 'bunch' },
    { name: 'Alphonso Mangoes', unit: 'kg' },
    { name: 'Product Name', unit: '1000unit' }, // For ORD-1762092299272
  ];
  const product = mockProducts.find(p => p.name === productName);
  return product?.unit || 'unit';
};

// Helper to convert onboarding rider application to Rider format
const convertOnboardingToRider = (onboardingRider: any): Rider => {
  return {
    id: onboardingRider.rider_id || `R${Date.now()}`,
    name: onboardingRider.rider_name || 'Unknown Rider',
    email: onboardingRider.email || `${onboardingRider.rider_id?.toLowerCase().replace(/\s+/g, '.')}@promode.com`,
    phone: onboardingRider.mobile || 'N/A',
    vehicle_number: onboardingRider.vehicle_number || onboardingRider.license_number || 'N/A',
    vehicle_type: (onboardingRider.vehicle_type === '2-Wheeler' ? 'Two-Wheeler' : 'Three-Wheeler') as 'Two-Wheeler' | 'Three-Wheeler',
    current_status: 'Available',
    zone: onboardingRider.zone || onboardingRider.city || 'Unassigned',
    rating: 0,
    total_deliveries: 0,
    orders_out_for_delivery: 0,
    orders_pending_pickup: 0,
    orders_delivered_today: 0,
    avg_delivery_time_minutes: 0,
    delivery_success_rate: 0,
    last_seen: new Date().toISOString(),
    last_location_lat: undefined,
    last_location_lng: undefined,
    current_runsheet_id: undefined,
    cod_outstanding: 0,
    active: onboardingRider.status === 'Active',
    date_joined: onboardingRider.joining_date || new Date().toISOString().split('T')[0],
  };
};

// Get approved riders from onboarding (status = 'Active')
// TODO: When API is ready, fetch approved riders from backend/database
const getApprovedRidersFromOnboarding = (): Rider[] => {
  try {
    // Get approved riders from localStorage (stored when approved from onboarding screen)
    // TODO: When API is ready, replace with API call
    const storedApprovedRiders = localStorage.getItem('approvedRidersFromOnboarding');
    if (!storedApprovedRiders) return [];
    
    const approvedRidersData = JSON.parse(storedApprovedRiders);
    return approvedRidersData.map((onboardingRider: any) => convertOnboardingToRider(onboardingRider));
  } catch (error) {
    console.error('Error loading approved riders:', error);
    return [];
  }
};

const CreateRunsheet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editRunsheetId = searchParams.get('edit');
  const returnTo = (location.state as any)?.returnTo as string | undefined;
  const preselectedOrderIds = (location.state as any)?.orderIds as string[] | undefined;
  const { toast } = useToast();
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  // Generate runsheet ID in format: RS001, RS002, etc.
  // TODO: When API is ready, runsheet ID will be generated by backend
  const [runsheetId] = useState(() => {
    // Get existing runsheets to determine next ID
    const storedRunsheets = localStorage.getItem('warehouse-runsheets');
    let maxId = 0;
    
    if (storedRunsheets) {
      try {
        const parsedRunsheets = JSON.parse(storedRunsheets);
        parsedRunsheets.forEach((rs: Runsheet) => {
          const match = rs.id.match(/^RS(\d+)$/);
          if (match) {
            const idNum = parseInt(match[1], 10);
            if (idNum > maxId) maxId = idNum;
          }
        });
      } catch (error) {
        console.error('Error parsing runsheets for ID generation:', error);
      }
    }
    
    // Check dummy data runsheets too
    allRunsheets.forEach(rs => {
      const match = rs.id.match(/^RS(\d+)$/);
      if (match) {
        const idNum = parseInt(match[1], 10);
        if (idNum > maxId) maxId = idNum;
      }
    });
    
    // Generate next ID (RS001, RS002, etc.)
    const nextId = maxId + 1;
    return `RS${String(nextId).padStart(3, '0')}`;
  });
  const [selectedRider, setSelectedRider] = useState("");
  const [runDate, setRunDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState("09:00");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [scannerValue, setScannerValue] = useState("");
  const [scannedOrders, setScannedOrders] = useState<Order[]>([]);
  const [scanMode, setScanMode] = useState(false);
  const [approvedRidersFromOnboarding, setApprovedRidersFromOnboarding] = useState<Rider[]>([]);
  
  // Packed orders fetched from API (or dummy data for now)
  // TODO: When API is ready, this will be fetched from the backend
  const [packedOrders, setPackedOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  
  // Dialog state for selecting packed orders
  const [showPackedOrdersDialog, setShowPackedOrdersDialog] = useState(false);
  const [selectedPackedOrders, setSelectedPackedOrders] = useState<Set<string>>(new Set());
  const [packedOrdersSearchQuery, setPackedOrdersSearchQuery] = useState("");
  const isEditMode = !!editRunsheetId;
  const [currentRunsheetId, setCurrentRunsheetId] = useState<string>(editRunsheetId || runsheetId);

  // Load approved riders on component mount and when rider approval event fires
  useEffect(() => {
    const loadApprovedRiders = () => {
      const approved = getApprovedRidersFromOnboarding();
      setApprovedRidersFromOnboarding(approved);
    };
    
    loadApprovedRiders();
    
    // Listen for rider approval events to refresh the list
    window.addEventListener('riderApproved', loadApprovedRiders);
    
    return () => {
      window.removeEventListener('riderApproved', loadApprovedRiders);
    };
  }, []);

  // Handler for selecting/deselecting packed orders in dialog
  const handleTogglePackedOrder = (orderId: string) => {
    setSelectedPackedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Filter packed orders based on search query (case-insensitive)
  const filteredPackedOrders = useMemo(() => {
    if (!packedOrdersSearchQuery.trim()) {
      return packedOrders;
    }

    const searchLower = packedOrdersSearchQuery.toLowerCase().trim();
    return packedOrders.filter(order => {
      const orderId = (order.order_number || '').toLowerCase();
      const customerName = (order.customer_name || '').toLowerCase();
      const phone = (order.customer_phone || '').toLowerCase();
      
      return orderId.includes(searchLower) || 
             customerName.includes(searchLower) || 
             phone.includes(searchLower);
    });
  }, [packedOrders, packedOrdersSearchQuery]);

  // Check if all available orders are selected
  const availablePackedOrders = useMemo(() => {
    return filteredPackedOrders.filter(order => 
      !scannedOrders.some(scanned => scanned.id === order.id)
    );
  }, [filteredPackedOrders, scannedOrders]);

  const isAllSelected = availablePackedOrders.length > 0 && 
    availablePackedOrders.every(order => selectedPackedOrders.has(order.id));

  // Handler for select all / deselect all
  const handleSelectAllPackedOrders = () => {
    const allIds = new Set<string>(availablePackedOrders.map(o => o.id));
    setSelectedPackedOrders(allIds);
  };

  const handleDeselectAllPackedOrders = () => {
    setSelectedPackedOrders(new Set());
  };

  // Handler for adding selected packed orders to runsheet
  const handleAddSelectedOrders = () => {
    if (selectedPackedOrders.size === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to add.",
        variant: "destructive"
      });
      return;
    }

    const ordersToAdd = packedOrders.filter(o => selectedPackedOrders.has(o.id));
    
    // Filter out orders that are already in scannedOrders
    const newOrders = ordersToAdd.filter(order => 
      !scannedOrders.some(scanned => scanned.id === order.id)
    );

    if (newOrders.length === 0) {
      toast({
        title: "All Orders Already Added",
        description: "Selected orders are already in the runsheet.",
        variant: "destructive"
      });
      return;
    }

    setScannedOrders(prev => [...prev, ...newOrders]);
    toast({
      title: "✓ Orders Added",
      description: `Added ${newOrders.length} order(s) to runsheet.`,
    });
    
    // Clear selection and close dialog
    setSelectedPackedOrders(new Set());
    setPackedOrdersSearchQuery("");
    setShowPackedOrdersDialog(false);
  };

  /**
   * ============================================================================
   * API INTEGRATION: Fetch Packed Orders on Component Mount and Dialog Open
   * ============================================================================
   * 
   * TODO: When API is ready, this useEffect will fetch packed orders from the backend
   * The fetchPackedOrders function above should be replaced with actual API call
   * 
   * This will:
   * 1. Fetch orders with packing_status = 'packed' from database
   * 2. Update packedOrders state
   * 3. Handle loading and error states
   * 4. Work seamlessly with existing scanning logic
   */
  useEffect(() => {
    const loadPackedOrders = async () => {
      setIsLoadingOrders(true);
      setOrdersError(null);
      try {
        // TODO: Replace with actual API call
        // For now, uses dummy data via fetchPackedOrders
        const orders = await fetchPackedOrders();
        setPackedOrders(orders);
      } catch (error) {
        console.error('Error fetching packed orders:', error);
        setOrdersError('Failed to load packed orders. Please try again.');
        toast({
          title: "Error Loading Orders",
          description: "Could not fetch packed orders. Please refresh the page.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingOrders(false);
      }
    };

    // Load on mount
    loadPackedOrders();
    
    // Reload when dialog opens to get latest packed orders
    if (showPackedOrdersDialog) {
      loadPackedOrders();
    }
  }, [showPackedOrdersDialog]);

  // Edit mode: preload existing runsheet and its orders (strict: only explicit ids when provided)
  useEffect(() => {
    if (!isEditMode) return;
    try {
      // Prefer runsheet from localStorage; fall back to dummy only if not found
      let rs: Runsheet | undefined;
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed: Runsheet[] = JSON.parse(storedRunsheets);
        rs = parsed.find(r => r.id === editRunsheetId);
      }
      if (!rs) {
        rs = allRunsheets.find(r => r.id === editRunsheetId);
      }
      if (!rs) return;
      setCurrentRunsheetId(rs.id);
      setSelectedRider(rs.rider_id || "");
      setRunDate(rs.run_date || runDate);
      setDepartureTime(rs.departure_time || departureTime);
      // Load orders for this runsheet (dummy + local)
      let allOrdersList: Order[] = [...dummyOrders as any];
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders);
        const mapOrders = new Map(allOrdersList.map(o => [o.id, o]));
        parsedOrders.forEach((o: Order) => mapOrders.set(o.id, o));
        allOrdersList = Array.from(mapOrders.values());
      }
      // If caller provides explicit orderIds, use ONLY those. Otherwise, use the runsheet's saved list.
      const sourceIds = (preselectedOrderIds && preselectedOrderIds.length > 0)
        ? preselectedOrderIds
        : (rs.orders_assigned || []);
      const preloaded = sourceIds.map((id:string) => allOrdersList.find(o => o.id === id)).filter(Boolean) as Order[];
      setScannedOrders(preloaded);
    } catch {}
  }, [isEditMode, editRunsheetId]);

  // Combine existing riders + newly approved riders from onboarding
  // TODO: When API is ready, this will be a single API call that returns all riders
  const allRiders: Rider[] = [
    ...riders, // Existing riders
    ...approvedRidersFromOnboarding // Newly approved riders from onboarding
  ];

  // Show all active riders for runsheet assignment
  // Only filter by active status, not current_status (rider can be assigned runsheet even if busy)
  const availableRiders = allRiders.filter(r => r.active);
  
  /**
   * ============================================================================
   * API INTEGRATION READY: Packed Orders
   * ============================================================================
   * 
   * This uses packedOrders state which is fetched from API (or dummy data for now)
   * When API is integrated, packedOrders will come from fetchPackedOrders() API call
   * 
   * Logic remains the same:
   * - Only orders with status = 'Packed' are available for runsheet
   * - These orders are marked as packed in Packer Management screen
   * - Same filtering and lookup logic works with API data
   */
  const availableOrders = packedOrders; // Already filtered by 'Packed' status from API

  useEffect(() => {
    if (scanMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scanMode]);

  /**
   * ============================================================================
   * API INTEGRATION READY: Order Scanning Logic
   * ============================================================================
   * 
   * This function works with both dummy data and API data
   * The logic remains the same when API is integrated:
   * 
   * 1. Validates order hasn't been scanned already
   * 2. Finds order using findOrderByNumberOrId helper (works with API data)
   * 3. Validates order status is 'Packed' (ready for dispatch)
   * 4. Adds order to scanned orders list
   * 
   * When API is integrated, availableOrders will come from packedOrders state
   * which is fetched from the backend. The logic remains identical.
   */
  const handleScanOrder = (orderId: string) => {
    const trimmedId = orderId.trim();
    if (!trimmedId) return;

    // Check if already scanned - uses same matching logic as findOrderByNumberOrId
    const isAlreadyScanned = scannedOrders.some(o => {
      const found = findOrderByNumberOrId([o], trimmedId);
      return found !== null;
    });

    if (isAlreadyScanned) {
      toast({
        title: "Duplicate Order",
        description: `Order ${trimmedId} already added to runsheet`,
        variant: "destructive"
      });
      setScannerValue("");
      return;
    }

    // Find order using helper function - works with both dummy data and API data
    // availableOrders is fetched from API (or dummy data) and filtered to 'Packed' status
    const order = findOrderByNumberOrId(availableOrders, trimmedId);

    if (order) {
      // Only add if order is packed (ready for dispatch)
      // When fetched from API, all orders in availableOrders should be 'Packed'
      // But we validate here for safety
      if (order.status === 'Packed') {
      setScannedOrders(prev => [...prev, order]);
        toast({
          title: "✓ Order Added",
          description: `${order.order_number} - ${order.customer_name}`,
        });
      setScannerValue("");
    } else {
        // This should rarely happen since availableOrders only contains 'Packed' orders
        // But we validate for safety (edge case if API returns wrong data)
        toast({
          title: "Order Not Ready",
          description: `Order ${trimmedId} is ${order.status}. Only packed orders can be added to runsheet.`,
          variant: "destructive"
        });
      setScannerValue("");
      }
    } else {
      // Order not found in packed orders
      // This means either:
      // 1. Order doesn't exist
      // 2. Order exists but is not yet packed (status != 'Packed')
      toast({
        title: "Invalid Order",
        description: `Order ${trimmedId} not found or not ready for dispatch. Only packed orders can be added.`,
        variant: "destructive"
      });
      setScannerValue("");
    }
  };

  const handleRemoveOrder = (orderId: string) => {
    setScannedOrders(prev => prev.filter(o => o.id !== orderId));
    toast({
      title: "Order Removed",
      description: "Order removed from runsheet"
    });
  };

  // Calculate COD and Prepaid order counts and amounts dynamically
  // These calculations work with both dummy data and API data
  const codOrders = scannedOrders.filter(o => o.payment_mode === 'COD');
  const prepaidOrders = scannedOrders.filter(o => o.payment_mode === 'Online');
  
  const codOrderCount = codOrders.length;
  const prepaidOrderCount = prepaidOrders.length;
  
  const totalCOD = codOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalPrepaid = prepaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const grandTotal = totalCOD + totalPrepaid;

  /**
   * ============================================================================
   * API INTEGRATION: Create Runsheet
   * ============================================================================
   * 
   * TODO: When API is ready, replace this with actual API call to create runsheet
   * 
   * Expected API Endpoint:
   * POST /api/runsheets
   * 
   * Expected Request Body:
   * {
   *   runsheet_id: string,
   *   rider_id: string,
   *   run_date: string (YYYY-MM-DD),
   *   departure_time: string (HH:MM),
   *   priority: string,
   *   notes?: string,
   *   orders: Order[] (array of order IDs or full order objects)
   * }
   * 
   * Expected Response:
   * {
   *   success: boolean,
   *   data: Runsheet,
   *   message?: string
   * }
   * 
   * Example API Implementation:
   * ```
   * const handleCreateRunsheet = async () => {
   *   if (!selectedRider || scannedOrders.length === 0) {
   *     // Validation logic (same as below)
   *     return;
   *   }
   * 
   *   try {
   *     const response = await fetch('/api/runsheets', {
   *       method: 'POST',
   *       headers: {
   *         'Content-Type': 'application/json',
   *         'Authorization': `Bearer ${token}`
   *       },
   *       body: JSON.stringify({
   *         runsheet_id: runsheetId,
   *         rider_id: selectedRider,
   *         run_date: runDate,
   *         departure_time: departureTime,
   *         priority: priority,
   *         notes: notes,
   *         orders: scannedOrders.map(o => o.id) // or full order objects
   *       })
   *     });
   * 
   *     const result = await response.json();
   *     if (result.success) {
   *       toast({
   *         title: "✓ Runsheet Created",
   *         description: `${runsheetId} assigned to rider with ${scannedOrders.length} orders`,
   *       });
   *       navigate('/delivery/runsheets');
   *     } else {
   *       throw new Error(result.message || 'Failed to create runsheet');
   *     }
   *   } catch (error) {
   *     console.error('Error creating runsheet:', error);
   *     toast({
   *       title: "Error",
   *       description: "Failed to create runsheet. Please try again.",
   *       variant: "destructive"
   *     });
   *   }
   * };
   * ```
   */
  const handleCreateRunsheet = () => {
    // Validation logic remains the same for API integration
    if (!selectedRider) {
      toast({
        title: "Validation Error",
        description: "Please select a rider",
        variant: "destructive"
      });
      return;
    }

    if (scannedOrders.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one order",
        variant: "destructive"
      });
      return;
    }

    // Find selected rider details
    const rider = allRiders.find(r => r.id === selectedRider);
    if (!rider) {
      toast({
        title: "Error",
        description: "Selected rider not found",
        variant: "destructive"
      });
      return;
    }

    // Create/edit runsheet object (preserve original fields in edit mode)
    let baseCreatedAt = new Date().toISOString();
    let baseStatus: Runsheet['status'] = 'Created';
    let baseZone = scannedOrders[0]?.zone || 'Zone A';

    if (isEditMode) {
      try {
        let all = [...allRunsheets];
        const storedRunsheets = localStorage.getItem('warehouse-runsheets');
        if (storedRunsheets) {
          const parsed = JSON.parse(storedRunsheets);
          const map = new Map(all.map((r:any) => [r.id, r]));
          parsed.forEach((r:any) => map.set(r.id, r));
          all = Array.from(map.values());
        }
        const existing = all.find(r => r.id === currentRunsheetId);
        if (existing) {
          baseCreatedAt = existing.created_at || baseCreatedAt;
          baseStatus = existing.status || baseStatus;
          baseZone = existing.route_zone || baseZone;
        }
      } catch {}
    }

    const newRunsheet: Runsheet = {
      id: currentRunsheetId,
      rider_id: selectedRider,
      rider_name: rider.name,
      run_date: runDate,
      departure_time: departureTime,
      created_at: baseCreatedAt,
      orders_assigned: scannedOrders.map(o => o.id),
      route_zone: baseZone,
      status: baseStatus,
      total_stops: scannedOrders.length,
      estimated_time: `${scannedOrders.length * 15} mins`
    };

    // TODO: Replace with actual API call (see example above)
    // For now, store runsheet in localStorage (will be replaced with API call)
    try {
      // Get existing runsheets from localStorage or use dummy data
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      let runsheetsList: Runsheet[] = [];
      
      if (storedRunsheets) {
        runsheetsList = JSON.parse(storedRunsheets);
      } else {
        // Initialize with dummy data runsheets
        runsheetsList = [...allRunsheets];
      }
      
      if (isEditMode) {
        // Update existing runsheet
        const idx = runsheetsList.findIndex((r) => r.id === currentRunsheetId);
        if (idx !== -1) {
          runsheetsList[idx] = { ...runsheetsList[idx], ...newRunsheet, total_stops: scannedOrders.length, orders_assigned: scannedOrders.map(o=>o.id) };
        } else {
          // If not in local storage yet, try updating dummy by pushing new version
          runsheetsList.push(newRunsheet);
        }
      } else {
        // Add new runsheet
        runsheetsList.push(newRunsheet);
      }
      localStorage.setItem('warehouse-runsheets', JSON.stringify(runsheetsList));
      // Notify other screens that runsheet totals and orders changed
      window.dispatchEvent(new CustomEvent('runsheetUpdated', { detail: { runsheetId: currentRunsheetId } }));

      // Update order statuses to "On the way" when runsheet is created
      // TODO: When API is ready, this will be handled by backend
      const storedOrders = localStorage.getItem('warehouse-orders');
      let allOrders = [...dummyOrders];
      
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: any) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }

      // Update status for all orders in the runsheet to "On the way" and add rider info
      const updatedOrders = allOrders.map(o => {
        if (scannedOrders.some(so => so.id === o.id)) {
          return { 
            ...o, 
            status: 'On the way' as OrderStatus,
            assigned_rider_id: selectedRider,
            assigned_rider_name: rider.name,
            updated_at: new Date().toISOString()
          };
        }
        return o;
      });

      // Save updated orders
      const savedOrders = updatedOrders.filter(order => {
        const isDummyOrder = dummyOrders.some(dummy => dummy.id === order.id);
        if (isDummyOrder) {
          return order.updated_at !== order.created_at;
        }
        return true;
      });
      localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));

      // Dispatch event to notify OrderDetail and other components of the update
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: { 
          orderIds: scannedOrders.map(o => o.id), 
          status: 'On the way',
          riderId: selectedRider,
          riderName: rider.name
        }
      }));

      // Update rider's current_runsheet_id (for dummy data, will be handled by API)
      // TODO: When API is ready, this will be handled by backend
      const storedRiders = localStorage.getItem('warehouse-riders');
      if (storedRiders) {
        const ridersList = JSON.parse(storedRiders);
        const riderIndex = ridersList.findIndex((r: Rider) => r.id === selectedRider);
        if (riderIndex !== -1) {
          ridersList[riderIndex].current_runsheet_id = runsheetId;
          localStorage.setItem('warehouse-riders', JSON.stringify(ridersList));
        }
      }

      /**
       * ============================================================================
       * API INTEGRATION: Notify Rider via Mobile App
       * ============================================================================
       * 
       * TODO: When API is ready, send notification to rider's mobile app
       * 
       * Expected API Endpoint:
       * POST /api/notifications/rider
       * 
       * Expected Request Body:
       * {
       *   rider_id: string,
       *   runsheet_id: string,
       *   message: string,
       *   type: 'runsheet_assigned'
       * }
       * 
       * Example API Implementation:
       * ```
       * const notifyRider = async (riderId: string, runsheetId: string) => {
       *   try {
       *     const response = await fetch('/api/notifications/rider', {
       *       method: 'POST',
       *       headers: {
       *         'Content-Type': 'application/json',
       *         'Authorization': `Bearer ${token}`
       *       },
       *       body: JSON.stringify({
       *         rider_id: riderId,
       *         runsheet_id: runsheetId,
       *         message: `You have a new assignment! Runsheet ${runsheetId} has been assigned to you.`,
       *         type: 'runsheet_assigned'
       *       })
       *     });
       *     const result = await response.json();
       *     if (result.success) {
       *       console.log('Rider notified successfully');
       *     }
       *   } catch (error) {
       *     console.error('Error notifying rider:', error);
       *   }
       * };
       * 
       * // Call after runsheet is created
       * await notifyRider(selectedRider, runsheetId);
       * ```
       * 
       * This will:
       * 1. Send push notification to rider's mobile app
       * 2. Display notification with runsheet ID and message
       * 3. Rider can tap notification to open runsheet details in app
       */
      
      // For now, log notification (will be replaced with API call)
      console.log('Notification to rider:', {
        rider_id: selectedRider,
        runsheet_id: currentRunsheetId,
        message: `You have a new assignment! Runsheet ${currentRunsheetId} has ${scannedOrders.length} order(s).`
      });

      toast({
        title: isEditMode ? "✓ Runsheet Updated" : "✓ Runsheet Created",
        description: `${currentRunsheetId} ${isEditMode ? 'updated' : 'assigned'} with ${scannedOrders.length} order(s).`,
      });

      // Navigate back to CloseRunsheet if editing, or to Runsheet Management with Pending tab for new runsheets
    setTimeout(() => {
        if (isEditMode && returnTo) {
          navigate(returnTo);
        } else if (isEditMode) {
          navigate(`/delivery/runsheets/${currentRunsheetId}`);
        } else {
          // Navigate to Runsheet Management with Pending tab selected
          navigate('/delivery/runsheets', { state: { activeTab: 'pending' } });
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating runsheet:', error);
      toast({
        title: "Error",
        description: "Failed to create runsheet. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={isEditMode && returnTo ? returnTo : "/delivery/runsheets"}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Runsheet' : 'Create Runsheet'}</h1>
                <p className="text-sm text-muted-foreground">Assign orders to rider for delivery</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={handleCreateRunsheet}>
                <Send className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Runsheet' : 'Create & Notify Rider'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
          {/* Left Section - Runsheet Details */}
          <div className="lg:col-span-1 space-y-6 overflow-visible">
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Runsheet Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-visible">
                <div>
                  <Label>Runsheet ID</Label>
                  <Input value={currentRunsheetId} disabled className="font-mono" />
                </div>

                <div className="relative">
                  <Label>Select Rider *</Label>
                  <Select value={selectedRider} onValueChange={setSelectedRider}>
                    <SelectTrigger>
                      <SelectValue placeholder={availableRiders.length > 0 ? "Choose rider" : "No riders available"} />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper" sideOffset={4}>
                      {availableRiders.length > 0 ? (
                        availableRiders.map(rider => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name} - {rider.vehicle_type}
                        </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No active riders available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {selectedRider && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {riders.find(r => r.id === selectedRider)?.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Departure Time</Label>
                    <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                  </div>
                </div>

                <div className="relative">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]" position="popper">
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Express">Express</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions for rider..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Runsheet Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders:</span>
                  <span className="font-bold text-foreground">{scannedOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">COD Orders:</span>
                  <span className="font-medium text-warning">{codOrderCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prepaid Orders:</span>
                  <span className="font-medium text-success">{prepaidOrderCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total COD:</span>
                  <span className="font-bold text-warning">₹{totalCOD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Prepaid:</span>
                  <span className="font-bold text-success">₹{totalPrepaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t">
                  <span className="font-medium text-foreground">Grand Total:</span>
                  <span className="font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Scanner & Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scanner Card */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-primary" />
                    Order Scanner
                  </CardTitle>
                  <Button 
                    variant={scanMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setScanMode(!scanMode)}
                  >
                    {scanMode ? "Scanner Active" : "Activate Scanner"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={scannerInputRef}
                        value={scannerValue}
                        onChange={(e) => setScannerValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleScanOrder(scannerValue);
                          }
                        }}
                        placeholder="Scan barcode or enter Order ID manually..."
                        className="pr-10 font-mono"
                      />
                      {scanMode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => setShowPackedOrdersDialog(true)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <PackagePlus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <Scan className="h-4 w-4 text-accent" />
                      <span className="text-foreground">Supports QR Code & 1D/2D Barcode</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-foreground">Real-time validation & feedback</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanned Orders List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scanned Orders ({scannedOrders.length})</CardTitle>
                  {scannedOrders.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setScannedOrders([])}>
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {scannedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Scan or enter Order IDs to add them to this runsheet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scannedOrders.map((order, index) => (
                      <div key={order.id} className="flex items-start gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                            {/* Payment Mode Badge:
                                - 'Online' → Display as "Prepaid" (customer paid online via mobile/web app) - Green/Success color
                                - 'COD' → Display as "COD" (customer will pay on delivery) - Purple/Secondary color
                            */}
                            <Badge 
                              variant="default"
                              className={`text-xs ${
                                order.payment_mode === 'Online'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-black text-white hover:bg-black/90'
                              }`}
                            >
                              {order.payment_mode === 'Online' ? 'Prepaid' : order.payment_mode}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                          
                          {/* Customer Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Customer:</span>
                              <span className="text-sm text-foreground">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Phone:</span>
                              <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-foreground">Address:</span>
                              <span className="text-xs text-muted-foreground">{order.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Items:</span>
                              <span className="text-xs text-foreground">{order.items?.length || 0} item(s)</span>
                          </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Slot:</span>
                              <span className="text-xs text-muted-foreground">{order.delivery_slot}</span>
                              </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Amount:</span>
                              <span className="text-sm font-bold text-foreground">₹{order.total_amount?.toLocaleString() || '0'}</span>
                          </div>
                            </div>
                          
                          {order.notes && (
                            <div className="bg-warning/10 p-2 rounded border border-warning/20">
                              <p className="text-xs text-foreground font-medium">Note: {order.notes}</p>
                          </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveOrder(order.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Packed Orders Selection Dialog */}
      <Dialog open={showPackedOrdersDialog} onOpenChange={setShowPackedOrdersDialog}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle>
                Select Packed Orders ({String(filteredPackedOrders.length).padStart(2, '0')})
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select orders that are packed and ready for delivery
              </p>
            </DialogHeader>
          </div>
          
          <div className="flex-shrink-0 px-6 space-y-4 pb-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Order ID, Customer Name, or Phone..."
                value={packedOrdersSearchQuery}
                onChange={(e) => setPackedOrdersSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Select All / Deselect All Checkbox */}
            <div className="flex items-center gap-2 pb-3 border-b">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    handleSelectAllPackedOrders();
                  } else {
                    handleDeselectAllPackedOrders();
                  }
                }}
                disabled={availablePackedOrders.length === 0}
              />
              <label 
                className="text-sm font-medium cursor-pointer"
                onClick={() => {
                  if (isAllSelected) {
                    handleDeselectAllPackedOrders();
                  } else {
                    handleSelectAllPackedOrders();
                  }
                }}
              >
                {`${isAllSelected ? 'Deselect All' : 'Select All'} (${selectedPackedOrders.size} selected)`}
              </label>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(85vh-320px)]">
            <div className="px-6">
              {isLoadingOrders ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading packed orders...</p>
                </div>
              ) : ordersError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                  <p className="text-destructive">{ordersError}</p>
                </div>
              ) : filteredPackedOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {packedOrdersSearchQuery ? 'No orders found matching your search' : 'No packed orders available'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {packedOrdersSearchQuery ? 'Try a different search term' : 'Orders need to be packed first before they can be added to a runsheet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {filteredPackedOrders.map((order) => {
                    const isSelected = selectedPackedOrders.has(order.id);
                    const isAlreadyAdded = scannedOrders.some(scanned => scanned.id === order.id);
                    
                    return (
                      <div
                        key={order.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : isAlreadyAdded
                            ? 'border-muted bg-muted/30 opacity-60'
                            : 'border-border hover:border-primary/50 bg-card'
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTogglePackedOrder(order.id)}
                          disabled={isAlreadyAdded}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                            <Badge 
                              variant="default"
                              className={`text-xs ${
                                order.payment_mode === 'Online'
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-black text-white hover:bg-black/90'
                              }`}
                            >
                              {order.payment_mode === 'Online' ? 'Prepaid' : order.payment_mode}
                            </Badge>
                            <Badge variant="outline" className="text-xs border-border">
                              Packed
                            </Badge>
                            {isAlreadyAdded && (
                              <Badge variant="outline" className="text-xs">
                                Already Added
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Customer:</span>
                              <span className="text-sm text-foreground">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Phone:</span>
                              <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-foreground">Address:</span>
                              <span className="text-xs text-muted-foreground flex-1">{order.address || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Items:</span>
                              <span className="text-xs text-foreground">{order.items?.length || 0} item(s)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Slot:</span>
                              <span className="text-xs text-muted-foreground">{order.delivery_slot || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Amount:</span>
                              <span className="text-sm font-bold text-foreground">₹{order.total_amount?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 gap-2 px-6 pb-6 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setShowPackedOrdersDialog(false);
              setSelectedPackedOrders(new Set());
              setPackedOrdersSearchQuery("");
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelectedOrders}
              disabled={selectedPackedOrders.size === 0 || isLoadingOrders}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {`Add Orders (${selectedPackedOrders.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateRunsheet;


