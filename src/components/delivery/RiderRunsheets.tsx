import { useParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { riders, runsheets, orders } from "@/data/dummyData";
import type { Runsheet, Order } from "@/data/dummyData";

// Get all orders (from dummy data and localStorage)
// This ensures we get orders from edited runsheets too
const getAllOrders = (): Order[] => {
  let allOrdersList: Order[] = [...orders];
  
  // Get orders from localStorage (for edited/updated orders)
  const storedOrders = localStorage.getItem('warehouse-orders');
  if (storedOrders) {
    try {
      const parsedOrders = JSON.parse(storedOrders);
      // Merge: stored orders override dummy data orders with same ID
      const orderMap = new Map<string, Order>();
      
      // Add dummy data orders first
      orders.forEach(o => orderMap.set(o.id, o));
      
      // Override with stored orders (updated orders)
      parsedOrders.forEach((o: Order) => orderMap.set(o.id, o));
      
      allOrdersList = Array.from(orderMap.values());
    } catch (error) {
      console.error('Error parsing stored orders:', error);
    }
  }
  
  return allOrdersList;
};

// Get runsheets for a specific rider
// TODO: When API is ready, replace this with API call: getRunsheetsByRiderId(riderId)
const getRiderRunsheets = (riderId: string) => {
  // Get runsheets from localStorage (created/edited runsheets) or use dummy data
  let allRunsheetsList: Runsheet[] = [];
  const storedRunsheets = localStorage.getItem('warehouse-runsheets');
  
  if (storedRunsheets) {
    try {
      const parsedRunsheets = JSON.parse(storedRunsheets);
      // Merge with dummy data (dummy data takes precedence for existing IDs)
      const dummyRunsheetIds = new Set(runsheets.map(r => r.id));
      const newRunsheets = parsedRunsheets.filter((r: Runsheet) => !dummyRunsheetIds.has(r.id));
      allRunsheetsList = [...runsheets, ...newRunsheets];
    } catch (error) {
      console.error('Error parsing stored runsheets:', error);
      allRunsheetsList = [...runsheets];
    }
  } else {
    allRunsheetsList = [...runsheets];
  }
  
  // Filter runsheets by rider_id
  const riderRunsheets = allRunsheetsList.filter(r => r.rider_id === riderId);
  
  // Get all orders (including edited ones)
  const allOrders = getAllOrders();
  
  // Transform to the format expected by the component
  return riderRunsheets.map(rs => {
    // Calculate derived values from actual order data
    // This works with both dummy data and edited runsheets
    // TODO: When API is ready, these values will come from backend
    const orderIds = rs.orders_assigned || [];
    const runsheetOrders = orderIds.map(orderId => allOrders.find(o => o.id === orderId)).filter(Boolean) as Order[];
    
    const totalOrders = runsheetOrders.length;
    
    // Calculate delivered orders from actual order status
    // This counts delivered orders correctly, even if runsheet is edited
    // When rider updates order as completed via mobile app, order status changes to 'Delivered'
    // This will automatically sync and update the count here
    const delivered = runsheetOrders.filter(o => {
      // Check for 'Delivered' status (case-insensitive for safety)
      // Mobile app may send status in different cases, so we normalize it
      return o.status && o.status.toLowerCase() === 'delivered';
    }).length;
    
    // Calculate COD Expected from actual COD orders
    const codOrders = runsheetOrders.filter(o => o.payment_mode === 'COD');
    const codExpected = codOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    // Calculate COD Collected based on delivered COD orders only
    // Only counts COD amount from orders that are actually delivered
    // When rider completes delivery via mobile app, order status becomes 'Delivered'
    // This automatically updates the COD collected amount
    const deliveredCODOrders = codOrders.filter(o => {
      // Check for 'Delivered' status (case-insensitive for safety)
      return o.status && o.status.toLowerCase() === 'delivered';
    });
    const codCollected = deliveredCODOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    // Calculate Prepaid Total from actual Prepaid orders
    const prepaidOrders = runsheetOrders.filter(o => o.payment_mode === 'Online');
    const prepaidTotal = prepaidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    
    // Calculate completion rate for this runsheet
    const completionRate = totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;
    
    return {
      id: rs.id,
      date: rs.run_date,
      zone: rs.route_zone,
      status: rs.status === 'Completed' ? 'Completed' : rs.status === 'In Transit' ? 'In Transit' : 'Created',
      totalOrders,
      delivered,
      codExpected,
      codCollected,
      prepaidTotal,
      completionRate,
    };
  });
};

const RiderRunsheets = () => {
  const { riderId } = useParams();
  const rider = riders.find(r => r.id === riderId);
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render when orders update
  
  // Get runsheets (will recalculate when refreshKey changes)
  // refreshKey is used to force recalculation when orders are updated from mobile app
  const runsheets = getRiderRunsheets(riderId || '');
  
  /**
   * ============================================================================
   * MOBILE APP SYNC: Listen for order updates from rider mobile app
   * ============================================================================
   * 
   * When rider marks an order as completed via mobile app:
   * 1. Mobile app sends order update to backend API
   * 2. Backend updates order status to 'Delivered' in database
   * 3. Backend sends notification/event to warehouse portal
   * 4. This component listens for order update events and refreshes
   * 
   * TODO: When API is ready, replace this with actual event listener
   * 
   * Expected Event:
   * - Event name: 'orderStatusUpdated' or 'riderOrderCompleted'
   * - Event data: { orderId: string, status: 'Delivered', riderId: string }
   * 
   * Example API Implementation:
   * ```
   * useEffect(() => {
   *   const handleOrderUpdate = (event: CustomEvent) => {
   *     const { orderId, status, riderId: updatedRiderId } = event.detail;
   *     // Only refresh if this order belongs to current rider
   *     if (updatedRiderId === riderId) {
   *       // Refresh orders from API or localStorage
   *       setRefreshKey(prev => prev + 1);
   *     }
   *   };
   *   
   *   window.addEventListener('orderStatusUpdated', handleOrderUpdate);
   *   return () => window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
   * }, [riderId]);
   * ```
   * 
   * For now, we listen for localStorage changes (when orders are updated locally)
   * This will work when order updates are stored in localStorage
   */
  useEffect(() => {
    // Listen for order updates from localStorage or events
    const handleOrderUpdate = () => {
      // Force component to recalculate with updated orders
      setRefreshKey(prev => prev + 1);
    };
    
    // Listen for custom order update events
    window.addEventListener('orderStatusUpdated', handleOrderUpdate);
    window.addEventListener('riderOrderCompleted', handleOrderUpdate);
    
    // Also listen for storage events (when localStorage is updated)
    window.addEventListener('storage', (e) => {
      if (e.key === 'warehouse-orders') {
        handleOrderUpdate();
      }
    });
    
    // Poll for updates (fallback - will be replaced with real-time sync via API)
    // TODO: Remove polling when API real-time sync is implemented
    const pollInterval = setInterval(() => {
      // Check if orders have been updated
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        // Force refresh to recalculate with latest order data
        setRefreshKey(prev => prev + 1);
      }
    }, 5000); // Poll every 5 seconds (will be replaced with real-time sync)
    
    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
      window.removeEventListener('riderOrderCompleted', handleOrderUpdate);
      clearInterval(pollInterval);
    };
  }, [riderId]);

  // Tabs: Active / Closed
  const defaultTabFromState = (location.state as any)?.defaultTab as 'active' | 'closed' | undefined;
  const [tab, setTab] = useState<'active' | 'closed'>(defaultTabFromState || 'active');

  // Calculate summary statistics from all runsheets
  // These calculations work with actual order data and update when runsheets are edited
  const totalRunsheets = runsheets.length;
  
  // Total Delivered: Count delivered orders across all runsheets for this rider
  // This counts correctly even if runsheet is edited and orders are updated
  const totalDelivered = runsheets.reduce((sum, r) => sum + r.delivered, 0);
  
  // Total Orders: Count all orders across all runsheets for this rider
  // This includes orders added when editing runsheets
  const totalOrders = runsheets.reduce((sum, r) => sum + r.totalOrders, 0);
  
  // COD Expected: Sum COD expected amounts from all runsheets for this rider
  // This shows the total COD amount that should be collected from all COD orders
  // Includes COD from all orders (delivered and pending) across all runsheets
  const totalCODExpected = runsheets.reduce((sum, r) => sum + r.codExpected, 0);
  
  // COD Collected: Sum COD collected amounts from delivered COD orders only
  // This shows how much COD has actually been collected from delivered orders
  const totalCODCollected = runsheets.reduce((sum, r) => sum + r.codCollected, 0);
  
  // COD Pending: Sum COD expected amounts from active/incomplete runsheets only
  // When a runsheet is closed/completed, its COD amount is excluded from this card
  // This shows only pending COD from active runsheets (Created or In Transit)
  const activeRunsheets = runsheets.filter(r => r.status !== 'Completed');
  const pendingCOD = activeRunsheets.reduce((sum, r) => sum + r.codExpected, 0);
  
  // Avg Completion Rate: Calculate average completion rate across all runsheets
  // Formula: (Total Delivered / Total Orders) * 100
  // This gives accurate average completion rate for the rider
  const avgCompletionRate = totalOrders > 0 
    ? Math.round((totalDelivered / totalOrders) * 100) 
    : 0;

  // Runsheet closed count
  const closedRunsheets = runsheets.filter(r => r.status === 'Completed').length;

  if (!rider) {
    return <div className="p-6">Rider not found</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
      <div className="flex items-center gap-4">
        <Link to="/delivery/rider-overview">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Runsheet History</h1>
              <p className="text-sm text-muted-foreground">{rider.name} - {rider.id}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 space-y-6">

      {/* Rider Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runsheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{totalRunsheets}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-foreground">{totalDelivered}</span>
              <span className="text-sm text-muted-foreground">/ {totalOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">COD Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold text-foreground">₹{pendingCOD.toLocaleString()}</span>
            </div>
            {pendingCOD > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Collected: ₹{totalCODCollected.toLocaleString()} / Pending: ₹{pendingCOD.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{avgCompletionRate.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Runsheets Closed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Runsheets Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-foreground">{closedRunsheets}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runsheet List with Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">All Runsheets</h2>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {runsheets
          .filter((r) => (tab === 'active' ? r.status !== 'Completed' : r.status === 'Completed'))
          .map((runsheet) => (
          <Card key={runsheet.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Runsheet Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Runsheet ID</p>
                    <p className="font-mono font-bold text-foreground">{runsheet.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium text-foreground">{runsheet.date}</p>
                    </div>
                    {/* Zone removed as requested */}
                  </div>
                  <Badge variant="default">{runsheet.status}</Badge>
                </div>

                {/* Middle: Order Progress */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Order Progress</p>
                      <p className="text-sm font-bold text-foreground">
                        {runsheet.delivered} / {runsheet.totalOrders}
                      </p>
                    </div>
                    <Progress value={runsheet.completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {runsheet.completionRate}% completion rate
                    </p>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span className="font-medium text-foreground">{runsheet.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered:</span>
                      <span className="font-medium text-success">{runsheet.delivered}</span>
                    </div>
                  </div>
                </div>

                {/* Middle-Right: Collection Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Collection Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">COD Expected:</span>
                        <span className="font-medium text-foreground">₹{runsheet.codExpected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">COD Collected:</span>
                        <span className="font-bold text-warning">₹{runsheet.codCollected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prepaid:</span>
                        <span className="font-medium text-success">₹{runsheet.prepaidTotal.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">Total:</span>
                        <span className="font-bold text-primary">
                          ₹{(runsheet.codExpected + runsheet.prepaidTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 justify-center">
                  <Link to={`/delivery/runsheets/${runsheet.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    Download Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
};

export default RiderRunsheets;


