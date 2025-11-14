import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Search,
  Plus,
  Package,
  IndianRupee,
  TrendingUp,
  Filter,
  Eye,
  XCircle
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { runsheets as dummyRunsheets, orders as dummyOrders, riders as dummyRiders } from "@/data/dummyData";
import type { Runsheet, Order, Rider } from "@/data/dummyData";
import { downloadRunsheetReport } from "@/utils/runsheetReport";

const RunsheetManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "invalid" | "cash-pending" | "completed" | "closed">("pending");
  const [refreshKey, setRefreshKey] = useState(0);

  const getRiderDetails = (riderId?: string): Rider | undefined => {
    if (!riderId) return undefined;
    try {
      const storedRiders = localStorage.getItem('warehouse-riders');
      if (storedRiders) {
        const parsed: Rider[] = JSON.parse(storedRiders);
        const found = parsed.find((r) => r.id === riderId);
        if (found) {
          return found;
        }
      }
    } catch (error) {
      console.error('Error loading riders from localStorage:', error);
    }
    return dummyRiders.find((r) => r.id === riderId);
  };

  const handleDownloadReport = (runsheet: Runsheet) => {
    const runsheetOrders = (runsheet.orders_assigned || [])
      .map((orderId) => allOrders.find((order) => order.id === orderId))
      .filter(Boolean) as Order[];

    const riderDetails = getRiderDetails(runsheet.rider_id);

    downloadRunsheetReport(runsheet, runsheetOrders, {
      filename: `${runsheet.id}-report.csv`,
      riderPhone: riderDetails?.phone,
    });
  };

  // Handle navigation state to set active tab
  useEffect(() => {
    const state = (location.state as any) || {};
    if (state.activeTab && state.activeTab !== activeTab) {
      setActiveTab(state.activeTab);
      // Clear the state after using it
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, activeTab]);

  // Load runsheets dynamically (dummy data + localStorage overrides)
  const allRunsheets = useMemo(() => {
    // Merge runsheets: overlay localStorage onto dummy by id (so edits replace dummy)
    let runsheetsList = [...dummyRunsheets];
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed: Runsheet[] = JSON.parse(storedRunsheets);
        const map = new Map(runsheetsList.map(r => [r.id, r]));
        parsed.forEach((r: Runsheet) => map.set(r.id, { ...map.get(r.id), ...r }));
        runsheetsList = Array.from(map.values());
      }
    } catch (error) {
      console.error('Error loading runsheets from localStorage:', error);
    }
    return runsheetsList;
  }, [refreshKey]);

  // Load orders dynamically (dummy data + localStorage overrides)
  const allOrders = useMemo(() => {
    // Merge orders: dummy + localStorage updates
    let ordersList = [...dummyOrders];
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(ordersList.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        ordersList = Array.from(map.values());
      }
    } catch (error) {
      console.error('Error loading orders from localStorage:', error);
    }
    return ordersList;
  }, [refreshKey]);

  // Listen for runsheet updates and order status changes
  // This ensures runsheets move to "Completed" tab when:
  // 1. Rider updates delivery status via mobile app
  // 2. Manual status changes in warehouse portal
  useEffect(() => {
    const handleRunsheetUpdated = () => {
      setRefreshKey(prev => prev + 1);
    };

    const handleStorageChange = (e: StorageEvent) => {
      // Refresh when orders are updated in localStorage
      if (e.key === 'warehouse-orders') {
        setRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('runsheetUpdated', handleRunsheetUpdated);
    window.addEventListener('orderStatusUpdated', handleRunsheetUpdated);
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes (fallback for same-window updates)
    // Events handle most cases, but polling ensures we catch any missed updates
    const pollInterval = setInterval(() => {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        setRefreshKey(prev => prev + 1);
      }
    }, 3000); // Poll every 3 seconds (events handle immediate updates)
    
    return () => {
      window.removeEventListener('runsheetUpdated', handleRunsheetUpdated);
      window.removeEventListener('orderStatusUpdated', handleRunsheetUpdated);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const filteredRunsheets = useMemo(() => {
    return allRunsheets.filter(runsheet => {
      // Search filter: matches Runsheet ID, Rider Name, or Rider ID
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        runsheet.id.toLowerCase().includes(query) ||
        (runsheet.rider_name && runsheet.rider_name.toLowerCase().includes(query)) ||
        (runsheet.rider_id && runsheet.rider_id.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;
      
      // Get orders for this runsheet
      const runsheetOrders = (runsheet.orders_assigned || [])
        .map(orderId => allOrders.find(o => o.id === orderId))
        .filter(Boolean) as Order[];
      
      // Check if all orders are delivered (case-insensitive check)
      // Works for both rider updates and manual status changes
      const allOrdersDelivered = runsheetOrders.length > 0 && 
        runsheetOrders.every(order => {
          const status = (order?.status || '').toString().toLowerCase();
          return status === 'delivered';
        });
      
      if (activeTab === "pending") {
        // Pending: Newly created runsheets (status = "Created")
        return runsheet.status === "Created";
      }
      
      if (activeTab === "completed") {
        // Completed runsheets: all orders delivered, but runsheet not yet closed
        return allOrdersDelivered && runsheet.status !== "Completed";
      }
      
      if (activeTab === "closed") {
        // Closed: Runsheet has been explicitly closed (status = "Completed")
        return runsheet.status === "Completed";
      }
      
      return true;
    });
  }, [allRunsheets, allOrders, searchQuery, activeTab]);

  // Calculate stats from actual data - ready for API integration
  // TODO: Replace with real API data when backend is ready
  // When API is ready, replace allRunsheets and allOrders with API call results
  const totalOrders = useMemo(() => {
    return allRunsheets.reduce((sum, r) => sum + (r.orders_assigned?.length || 0), 0);
  }, [allRunsheets]);

  const allRunsheetOrders = useMemo(() => {
    return allRunsheets.flatMap(r => 
      (r.orders_assigned || []).map(orderId => allOrders.find(o => o.id === orderId)).filter(Boolean) as Order[]
    );
  }, [allRunsheets, allOrders]);

  const totalPrepaid = useMemo(() => {
    return allRunsheetOrders
      .filter(o => o?.payment_mode === 'Online')
      .reduce((sum, o) => sum + (o?.total_amount || 0), 0);
  }, [allRunsheetOrders]);

  const totalCOD = useMemo(() => {
    return allRunsheetOrders
      .filter(o => o?.payment_mode === 'COD')
      .reduce((sum, o) => sum + (o?.total_amount || 0), 0);
  }, [allRunsheetOrders]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Runsheet Management</h1>
          <p className="text-sm text-muted-foreground">{filteredRunsheets.length} runsheets found</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/delivery/create-runsheet">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Runsheet
            </Button>
          </Link>
        </div>
      </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Runsheets</p>
                  <p className="text-3xl font-bold text-foreground">{allRunsheets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prepaid Total</p>
                  <p className="text-2xl font-bold text-success">₹{totalPrepaid.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">COD Expected</p>
                  <p className="text-2xl font-bold text-warning">₹{totalCOD.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="gap-2"
          >
            🟡 Pending Verification
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className="gap-2"
          >
            ✅ Completed Runsheets
          </Button>
          <Button
            variant={activeTab === "closed" ? "default" : "outline"}
            onClick={() => setActiveTab("closed")}
            className="gap-2"
          >
            🔒 Closed Runsheets
          </Button>
        </div>

        {/* Runsheets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === "pending" && "Pending Verification"}
                {activeTab === "completed" && "Completed Runsheets"}
                {activeTab === "closed" && "Closed Runsheets"}
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search runsheets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredRunsheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No runsheets found</p>
              </div>
            ) : (
              filteredRunsheets.map((runsheet) => {
                const runsheetOrders = (runsheet.orders_assigned || [])
                  .map(orderId => allOrders.find(o => o.id === orderId))
                  .filter(Boolean) as Order[];
                const totalOrders = runsheetOrders.length;
                const deliveredOrders = runsheetOrders.filter(o => o?.status === 'Delivered').length;
                const progress = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
                const prepaidTotal = runsheetOrders.filter(o => o?.payment_mode === 'Online').reduce((sum, o) => sum + (o?.total_amount || 0), 0);
                const codTotal = runsheetOrders.filter(o => o?.payment_mode === 'COD').reduce((sum, o) => sum + (o?.total_amount || 0), 0);

                const totalAmount = prepaidTotal + codTotal;
                return (
                  <Card key={runsheet.id}>
                    <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
                      {/* Left column */}
                      <div className="md:col-span-3 flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Runsheet ID</p>
                          <h3 className="text-lg font-semibold text-foreground">{runsheet.id}</h3>
                          <p className="text-xs text-muted-foreground mt-4">Date</p>
                          <p className="text-sm font-medium text-foreground">{runsheet.run_date}</p>
                          <div className="mt-4">
                            <Badge variant={runsheet.status === 'In Transit' ? 'default' : 'outline'}>
                              {runsheet.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Middle column - order progress */}
                      <div className="md:col-span-5">
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span className="text-muted-foreground">Order Progress</span>
                          <span className="text-foreground">{deliveredOrders} / {totalOrders}</span>
                        </div>
                        <Progress value={progress} className="h-2 mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">{Math.round(progress)}% completion rate</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total Orders:</p>
                            <p className="font-semibold">{totalOrders}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Delivered:</p>
                            <p className="font-semibold text-success">{deliveredOrders}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Prepaid:</p>
                            <p className="font-semibold text-success">₹{prepaidTotal.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">COD:</p>
                            <p className="font-semibold text-warning">₹{codTotal.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Assigned Rider</p>
                            <p className="font-semibold text-foreground">{runsheet.rider_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rider ID</p>
                            <p className="font-semibold text-foreground">{runsheet.rider_id}</p>
                          </div>
                        </div>
                      </div>

                      {/* Right column - collection details */}
                      <div className="md:col-span-4 flex flex-col md:items-end gap-4">
                        <div className="w-full md:w-auto text-sm">
                          <p className="font-semibold text-muted-foreground mb-2">Collection Details</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            <span className="text-muted-foreground">COD Expected:</span>
                            <span className="font-semibold text-warning">₹{codTotal.toLocaleString()}</span>
                            <span className="text-muted-foreground">COD Collected:</span>
                            <span className="font-semibold text-success">₹0</span>
                            <span className="text-muted-foreground">Prepaid:</span>
                            <span className="font-semibold text-success">₹{prepaidTotal.toLocaleString()}</span>
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold text-primary">₹{totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <Link 
                            to={activeTab === 'closed' 
                              ? `/delivery/runsheets/${runsheet.id}/closed`
                              : `/delivery/runsheet-management/closerunsheet/${runsheet.id}`
                            } 
                            state={{ from: '/delivery/runsheets', activeTab }}
                          >
                            <Button size="sm" variant="outline" className="gap-2">
                              <Eye className="h-3 w-3" />
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground"
                            onClick={() => handleDownloadReport(runsheet)}
                          >
                            Download Report
                          </Button>
                        </div>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </CardContent>
        </Card>
    </div>
  );
};

export default RunsheetManagement;


