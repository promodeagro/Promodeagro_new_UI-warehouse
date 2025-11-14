import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Package, 
  Clock, 
  CheckCircle, 
  DollarSign,
  Search,
  Phone,
  MapPin,
  Plus,
  Calendar
} from "lucide-react";
import { riders, runsheets, orders } from "@/data/dummyData";
import { Link, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/KPICard";
import type { Rider } from "@/data/dummyData";

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

const RiderOverview = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvedRidersFromOnboarding, setApprovedRidersFromOnboarding] = useState<Rider[]>([]);
  // State to track rider active status (when toggled)
  // TODO: When API is ready, this will be managed by backend
  const [riderActiveStatus, setRiderActiveStatus] = useState<Record<string, boolean>>({});

  // Load approved riders on component mount and when rider approval event fires
  useEffect(() => {
    const loadApprovedRiders = () => {
      const approved = getApprovedRidersFromOnboarding();
      setApprovedRidersFromOnboarding(approved);
    };
    
    loadApprovedRiders();
    
    // Listen for rider approval events to refresh the list
    window.addEventListener('riderApproved', loadApprovedRiders);
    
    // Listen for runsheet closed event to refresh rider status
    const handleRunsheetClosed = () => {
      // Force re-render by creating a new object reference
      setApprovedRidersFromOnboarding([...getApprovedRidersFromOnboarding()]);
    };
    window.addEventListener('runsheetClosed', handleRunsheetClosed);
    
    return () => {
      window.removeEventListener('riderApproved', loadApprovedRiders);
      window.removeEventListener('runsheetClosed', handleRunsheetClosed);
    };
  }, []);

  // Combine existing riders + newly approved riders from onboarding
  // This ensures Total Riders count includes both existing and newly approved riders
  // Load updated rider data from localStorage to get latest current_runsheet_id and status
  // TODO: When API is ready, this will be a single API call that returns all riders
  const allRiders: Rider[] = (() => {
    let baseRiders = [
      ...riders, // Existing riders
      ...approvedRidersFromOnboarding // Newly approved riders from onboarding
    ];
    
    // Merge with localStorage data to get updated current_runsheet_id and current_status
    try {
      const storedRiders = localStorage.getItem('warehouse-riders');
      if (storedRiders) {
        const parsed = JSON.parse(storedRiders);
        baseRiders = baseRiders.map(rider => {
          const stored = parsed.find((sr: any) => sr.id === rider.id);
          return stored ? { ...rider, ...stored } : rider;
        });
      }
    } catch (error) {
      console.error('Error merging rider data from localStorage:', error);
    }
    
    return baseRiders.map(rider => ({
      ...rider,
      // Use toggled status if exists, otherwise use rider's original active status
      active: riderActiveStatus[rider.id] !== undefined ? riderActiveStatus[rider.id] : rider.active
    }));
  })();

  // Handler to toggle rider active/inactive status
  // When inactive, rider cannot be assigned runsheets
  // TODO: When API is ready, this will update rider status in backend
  const handleToggleRiderActive = (riderId: string, isActive: boolean) => {
    setRiderActiveStatus(prev => ({
      ...prev,
      [riderId]: isActive
    }));
    
    // TODO: When API is ready, call API to update rider active status
    // If inactive, also remove any assigned runsheet (current_runsheet_id = null)
    if (!isActive) {
      // Remove runsheet assignment when rider is made inactive
      // TODO: When API is ready, call API to unassign runsheet
      console.log(`Rider ${riderId} made inactive - runsheet assignment should be removed`);
    }
  };

  // Calculate stats from actual data - all dynamic, no hardcoded values
  // Count includes both existing riders and newly approved riders from onboarding
  // TODO: Replace with real API data when backend is ready
  
  // Helper function to count orders from all runsheets assigned to all riders
  // This counts all orders (both COD and Prepaid) from all runsheets
  // TODO: When API is ready, replace this with API call: getAllRunsheets()
  const getAllRunsheetsOrdersCount = () => {
    return runsheets.reduce((sum, rs) => {
      return sum + (rs.orders_assigned?.length || 0);
    }, 0);
  };
  
  // Helper function to count completed orders from all completed runsheets
  // Counts all orders (both COD and Prepaid) from runsheets with status = 'Completed'
  // This will be synced automatically from rider mobile app when rider marks orders as completed
  // TODO: When API is ready, replace this with API call: getCompletedRunsheets()
  const getCompletedOrdersCount = () => {
    const completedRunsheets = runsheets.filter(rs => rs.status === 'Completed');
    return completedRunsheets.reduce((sum, rs) => {
      return sum + (rs.orders_assigned?.length || 0);
    }, 0);
  };
  
  // Helper function to calculate total pending cash (COD orders only, not Prepaid)
  // This calculates COD amount from the CURRENT runsheet assigned to each rider
  // Each rider has ONE runsheet assigned (via current_runsheet_id)
  // We count COD orders from the runsheet currently assigned to each rider
  // When orders are edited/added to a runsheet, the amount updates automatically
  // Only counts COD orders, excludes Prepaid/Online orders
  // TODO: When API is ready, replace this with API call: getPendingCODAmount()
  const getPendingCashTotal = () => {
    let totalPendingCOD = 0;
    
    // Iterate through all riders (both existing and newly approved)
    allRiders.forEach(rider => {
      // Check if this rider has a current runsheet assigned
      if (rider.current_runsheet_id) {
        // Find the runsheet assigned to this rider
        const currentRunsheet = runsheets.find(rs => rs.id === rider.current_runsheet_id);
        
        if (currentRunsheet) {
          // Get all order IDs from this rider's current runsheet
          const orderIds = currentRunsheet.orders_assigned || [];
          
          // For each order in this runsheet, check if it's COD and add its amount
          orderIds.forEach(orderId => {
            const order = orders.find(o => o.id === orderId);
            
            // Only count COD orders, exclude Prepaid/Online orders
            if (order && order.payment_mode === 'COD') {
              // Add the total amount of this COD order to the total
              totalPendingCOD += order.total_amount || 0;
            }
          });
        }
      }
    });
    
    // Return the total amount of all COD orders from all currently assigned runsheets
    return totalPendingCOD;
  };
  
  // Helper function to get the current runsheet assigned to a rider
  // A rider can only have ONE runsheet assigned at a time (via current_runsheet_id)
  // Checks both dummyData and localStorage to get the latest runsheet data
  // TODO: When API is ready, replace this with API call: getRunsheetById(runsheetId)
  const getRiderCurrentRunsheet = (rider: Rider) => {
    if (!rider.current_runsheet_id) return null;
    
    // First check localStorage for updated runsheets
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed = JSON.parse(storedRunsheets);
        const found = parsed.find((r: Runsheet) => r.id === rider.current_runsheet_id);
        if (found) return found;
      }
    } catch (error) {
      console.error('Error reading runsheets from localStorage:', error);
    }
    
    // Fall back to dummyData
    return runsheets.find(r => r.id === rider.current_runsheet_id) || null;
  };
  
  // Helper function to count orders from the current runsheet for a specific rider
  // A rider has only ONE runsheet assigned at a time
  // Count orders from that single runsheet (which may have multiple orders that can be edited before pickup)
  // TODO: When API is ready, replace this with API call: getRunsheetById(rider.current_runsheet_id)
  const getRiderCurrentRunsheetOrdersCount = (rider: Rider) => {
    const currentRunsheet = getRiderCurrentRunsheet(rider);
    if (!currentRunsheet) return 0;
    return currentRunsheet.orders_assigned?.length || 0;
  };
  
  // Helper function to calculate total amount from the current runsheet for a specific rider
  // A rider has only ONE runsheet assigned at a time
  // Amount = COD orders total + Prepaid orders total (both counts)
  // This calculates from actual order data, not placeholder calculations
  // TODO: When API is ready, replace this with API call: getRunsheetById(rider.current_runsheet_id)
  const getRiderCurrentRunsheetTotalAmount = (rider: Rider) => {
    const currentRunsheet = getRiderCurrentRunsheet(rider);
    if (!currentRunsheet) return 0;
    
    let codTotal = 0;
    let prepaidTotal = 0;
    
    // Get all order IDs from this rider's current runsheet
    const orderIds = currentRunsheet.orders_assigned || [];
    
    // For each order in this runsheet, calculate amounts from actual order data
    orderIds.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      
      if (order) {
        if (order.payment_mode === 'COD') {
          // Sum COD order amounts
          codTotal += order.total_amount || 0;
        } else if (order.payment_mode === 'Online') {
          // Sum Prepaid/Online order amounts
          prepaidTotal += order.total_amount || 0;
        }
      }
    });
    
    // Return total: COD + Prepaid (both counts)
    return codTotal + prepaidTotal;
  };
  
  // Helper function to count delivered orders from the current runsheet for a specific rider
  // A rider has only ONE runsheet assigned at a time
  // Counts all delivered orders (both COD and Prepaid) from the rider's current runsheet
  // This will sync automatically from rider mobile app when rider marks orders as completed
  // TODO: When API is ready, replace this with API call: getDeliveredOrdersCount(rider.current_runsheet_id)
  const getRiderDeliveredOrdersCount = (rider: Rider) => {
    const currentRunsheet = getRiderCurrentRunsheet(rider);
    if (!currentRunsheet) return 0;
    
    // Get all order IDs from this rider's current runsheet
    const orderIds = currentRunsheet.orders_assigned || [];
    
    // Count orders with status = 'Delivered' (both COD and Prepaid)
    let deliveredCount = 0;
    orderIds.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      
      // Count all delivered orders, regardless of payment mode (COD + Prepaid both)
      if (order && order.status === 'Delivered') {
        deliveredCount++;
      }
    });
    
    return deliveredCount;
  };
  
  const totalRiders = allRiders.length;
  const activeRiders = allRiders.filter(r => r.active).length;
  const onDutyRiders = allRiders.filter(r => r.current_status === 'On Trip' || r.current_status === 'Busy').length;
  const offlineRiders = allRiders.filter(r => r.current_status === 'Offline').length;
  
  // Out for Delivery: Count ALL orders from ALL runsheets across ALL riders
  // This counts every order in every runsheet assigned to any rider
  const outForDelivery = getAllRunsheetsOrdersCount();
  
  const idleRiders = allRiders.filter(r => r.current_status === 'Available').length;
  
  // Completed Today: Count all completed orders from all completed runsheets (both COD and Prepaid)
  // This will be automatically synced from rider mobile app when rider marks orders as completed
  // TODO: When API is ready, this will be synced in real-time from backend
  const completedToday = getCompletedOrdersCount();
  
  // Pending Cash: Calculate total amount of COD orders only (not Prepaid) from all runsheets
  // This matches the logic used in runsheet history screen
  // TODO: When API is ready, this will be calculated from backend
  const pendingCash = getPendingCashTotal();
  
  // Calculate delayed riders - riders with orders out but haven't delivered in expected time
  // This checks for riders with pending deliveries that may be delayed
  // TODO: When API is ready, use actual delivery time vs expected time from backend
  const delayedRiders = allRiders.filter(rider => {
    // Consider delayed if:
    // 1. Has orders out for delivery
    // 2. Is on trip or busy (actively delivering)
    // 3. Has pending orders that haven't been delivered (orders_out_for_delivery > orders_delivered_today)
    const hasPendingOrders = (rider.orders_out_for_delivery || 0) > 0;
    const isActivelyDelivering = rider.current_status === 'On Trip' || rider.current_status === 'Busy';
    const hasUndeliveredOrders = (rider.orders_out_for_delivery || 0) > (rider.orders_delivered_today || 0);
    
    // If rider is on trip/busy and has pending orders that exceed delivered, they may be delayed
    // This is a simplified logic - will be enhanced with actual delivery timestamps when API is ready
    return hasPendingOrders && isActivelyDelivering && hasUndeliveredOrders;
  }).length;

  // Check if rider is newly approved (from onboarding)
  const isNewRider = (rider: Rider) => {
    return approvedRidersFromOnboarding.some(ar => ar.id === rider.id);
  };

  // Get display status - show "New" for newly approved riders, "Inactive" for inactive riders, otherwise show actual status
  const getDisplayStatus = (rider: Rider) => {
    // If rider is inactive (toggled to inactive), show "Inactive"
    if (!rider.active) {
      return 'Inactive';
    }
    // If rider is newly approved and has no runsheet assigned, show "New"
    if (isNewRider(rider) && !rider.current_runsheet_id) {
      return 'New';
    }
    // Otherwise show the actual current status
    return rider.current_status;
  };

  const filteredRiders = allRiders.filter(rider => {
    // Search functionality - searches by name, phone, or ID
    const matchesSearch = searchQuery === '' ||
                         rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rider.phone.includes(searchQuery) ||
                         rider.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter functionality - filters by rider active status or current_status
    // Note: For "New" status, check if rider is newly approved and has no runsheet
    // For "inactive", check if rider.active is false (toggled to inactive)
    const displayStatus = getDisplayStatus(rider);
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rider.active) ||
                         (statusFilter === 'inactive' && !rider.active) ||
                         (statusFilter === 'new' && displayStatus === 'New') ||
                         (statusFilter === 'on-trip' && rider.current_status === 'On Trip') ||
                         (statusFilter === 'available' && rider.current_status === 'Available') ||
                         (statusFilter === 'busy' && rider.current_status === 'Busy');
    
    return matchesSearch && matchesStatus;
  });

  // Map long rider IDs to short codes like RD001 for display consistency
  const getShortRiderId = (riderId: string): string => {
    try {
      const key = 'riderIdShortMap';
      const stored = localStorage.getItem(key);
      const map: Record<string, string> = stored ? JSON.parse(stored) : {};
      if (map[riderId]) return map[riderId];
      if (/^[A-Z]{1,3}\d{1,4}$/.test(riderId)) {
        map[riderId] = riderId;
        localStorage.setItem(key, JSON.stringify(map));
        return riderId;
      }
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
      return riderId;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-info/10 text-info border-info/20';
      case 'Available': return 'bg-success/10 text-success border-success/20';
      case 'On Trip': return 'bg-primary/10 text-primary border-primary/20';
      case 'Busy': return 'bg-warning/10 text-warning border-warning/20';
      case 'Inactive': return 'bg-muted text-muted-foreground border-muted';
      case 'Offline': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <main>
        {/* Page header - matches Rider Management screen style */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Rider Overview</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage delivery riders in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/delivery/create-runsheet">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Runsheet
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KPICard title="Total Riders" value={totalRiders} icon={Users} trend="+2 this month" />
          <KPICard title="Active Riders" value={activeRiders} icon={UserCheck} subtitle={`${offlineRiders} offline`} />
          <KPICard title="Out for Delivery" value={outForDelivery} icon={Package} subtitle="orders in transit" />
          <KPICard title="Completed Today" value={completedToday} icon={CheckCircle} trend="+18% from yesterday" trendUp />
          <KPICard title="Pending Cash" value={`₹${pendingCash.toLocaleString()}`} icon={DollarSign} subtitle="COD outstanding" />
        </div>

        {/* Rider List Table */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Rider List ({filteredRiders.length})</CardTitle>
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="on-trip">On Trip</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Rider ID</TableHead>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                 <TableHead className="whitespace-nowrap">Runsheet ID</TableHead>
                <TableHead className="whitespace-nowrap">Orders</TableHead>
                <TableHead className="whitespace-nowrap">Amounts</TableHead>
                <TableHead className="whitespace-nowrap">Delivered</TableHead>
                <TableHead className="whitespace-nowrap">
                  {statusFilter === 'active' ? 'Active' : statusFilter === 'inactive' ? 'Inactive' : 'Active/Inactive'}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow 
                  key={rider.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/delivery/rider-overview/runsheets-history/${rider.id}`)}
                >
                  <TableCell className="font-mono font-medium">{getShortRiderId(rider.id)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{rider.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-[4px]">
                        <Phone className="h-3 w-3" />
                        {rider.phone}
                      </p>
                      {(() => {
                        // Get the rider's current runsheet to show date and time
                        const currentRunsheet = getRiderCurrentRunsheet(rider);
                        
                        if (currentRunsheet && currentRunsheet.run_date) {
                          // Format date as DD-MM-YYYY (e.g., "02-11-2025")
                          const dateObj = new Date(currentRunsheet.run_date);
                          const day = String(dateObj.getDate()).padStart(2, '0');
                          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const year = dateObj.getFullYear();
                          const formattedDate = `${day}-${month}-${year}`;
                          
                          // Format time from created_at (the time when runsheet was created - fixed time)
                          // This is the timestamp when the runsheet was created, not departure time
                          let formattedTime = '';
                          if (currentRunsheet.created_at) {
                            // Use created_at timestamp to show when runsheet was created
                            const createdDate = new Date(currentRunsheet.created_at);
                            formattedTime = createdDate.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: true
                            });
                          }
                          
                          return (
                            <>
                              {currentRunsheet.run_date && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-[4px]">
                                  <Calendar className="h-3 w-3" />
                                  {formattedDate}
                                </p>
                              )}
                              {currentRunsheet.created_at && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-[4px]">
                                  <Clock className="h-3 w-3" />
                                  {formattedTime}
                                </p>
                              )}
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(getDisplayStatus(rider))}>
                      {getDisplayStatus(rider)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // A rider can only have ONE runsheet assigned at a time
                      // Show the runsheet ID/number instead of count (e.g., "RS001", "RS002")
                      // TODO: When API is ready, replace this with API call: checkRiderCurrentRunsheet(rider.id)
                      const currentRunsheet = getRiderCurrentRunsheet(rider);
                      
                      if (currentRunsheet) {
                        // Show the runsheet ID (e.g., "RS001")
                        return (
                          <Link to={`/delivery/rider-overview/runsheets-history/${rider.id}`}>
                            <Button variant="link" size="sm" className="font-mono p-0 h-auto">
                              {currentRunsheet.id}
                            </Button>
                          </Link>
                        );
                      } else {
                        return <span className="text-muted-foreground text-sm">-</span>;
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // A rider has only ONE runsheet assigned at a time
                      // Count orders from that single runsheet (which may have multiple orders that can be edited before pickup)
                      // TODO: When API is ready, replace this with API call: getRunsheetOrdersCount(rider.current_runsheet_id)
                      const totalOrders = getRiderCurrentRunsheetOrdersCount(rider);
                      
                      return (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="font-medium">{totalOrders}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // A rider has only ONE runsheet assigned at a time
                      // Calculate total amount from that single runsheet
                      // Amount = codCollected + prepaidTotal for that runsheet
                      // TODO: When API is ready, replace this with API call: getRunsheetTotalAmount(rider.current_runsheet_id)
                      const totalAmount = getRiderCurrentRunsheetTotalAmount(rider);
                      
                      return (
                        <span className="font-bold text-primary">
                          ₹{totalAmount.toLocaleString()}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Count delivered orders from the rider's current runsheet (both COD and Prepaid)
                      // This will sync automatically from rider mobile app when rider marks orders as completed
                      // TODO: When API is ready, replace this with API call: getDeliveredOrdersCount(rider.current_runsheet_id)
                      const deliveredCount = getRiderDeliveredOrdersCount(rider);
                      
                      return (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="font-medium">{deliveredCount}</span>
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={rider.active}
                        onCheckedChange={(checked) => handleToggleRiderActive(rider.id, checked)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRiders.length === 0 && (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No riders found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  );
};

export default RiderOverview;


