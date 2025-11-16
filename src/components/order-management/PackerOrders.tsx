import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Package,
  Search,
  User,
  MapPin,
  ArrowLeft,
  Eye,
  Phone,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  Users,
  Award,
  Zap,
  UserPlus,
  Ban,
  Smartphone,
  AlertTriangle,
  PackagePlus,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { packers } from "@/data/packerData";
import { useOrders } from "@/contexts/OrderContext";

type FilterTab = 'all' | 'assigned' | 'pending' | 'packed' | 'out_of_stock';

export default function PackerOrders() {
  const { packerId } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrder, updateOrderStatus } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  // Read autoAssign from localStorage (controlled by PackerOverview)
  const [autoAssign, setAutoAssign] = useState<boolean>(() => {
    const saved = localStorage.getItem('packerAutoAssign');
    return saved !== null ? saved === 'true' : true;
  });
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showReassignDialog, setShowReassignDialog] = useState<boolean>(false);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState<boolean>(false);
  const [newPackingStatus, setNewPackingStatus] = useState<string>('');
  const [reassignPacker, setReassignPacker] = useState<string>('');
  
  // Pagination for orders table
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const ordersPerPage = 10;

  // Listen for autoAssign changes
  useEffect(() => {
    // Listen for autoAssign custom event
    const handleAutoAssignChange = (event: CustomEvent) => {
      setAutoAssign(event.detail.autoAssign);
      // Clear selections when switching modes
      setSelectedOrders(new Set());
    };

    // Listen for storage events (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'packerAutoAssign') {
        setAutoAssign(e.newValue === 'true');
        setSelectedOrders(new Set());
      }
    };

    window.addEventListener('packerAutoAssignChanged', handleAutoAssignChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('packerAutoAssignChanged', handleAutoAssignChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);



  // Helper function to get all packers (static + saved)
  const getAllPackers = useMemo(() => {
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      // Get list of deleted packers to exclude them
      const deletedPackers = JSON.parse(localStorage.getItem('deleted-packers') || '[]');
      const deletedIds = new Set(deletedPackers);
      
      const savedIds = new Set(savedPackers.map((p: any) => p.id));
      const staticPackers = packers.filter(p => !savedIds.has(p.id) && !deletedIds.has(p.id));
      const filteredSavedPackers = savedPackers.filter((p: any) => !deletedIds.has(p.id));
      
      return [...filteredSavedPackers, ...staticPackers];
    } catch (error) {
      console.error('Error loading packers:', error);
      return packers;
    }
  }, []);

  // Find the packer - check both static packers and saved packers
  const packer = useMemo(() => {
    return getAllPackers.find((p: any) => p.id === packerId) || null;
  }, [packerId, getAllPackers]);

  if (!packer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Packer not found</h2>
          <Button onClick={() => navigate('/order-management/packer-overview')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Packer Overview
          </Button>
        </div>
      </div>
    );
  }

  // Use orders directly from context - React will detect when orders array changes
  const enrichedOrders = useMemo(() => {
    return orders.map((order, index) => {
      // ALWAYS create a new object - this is critical for React to detect changes
      const enriched = { ...order };
      
      if (enriched.status === 'Cancelled' || enriched.status === 'Returned' || enriched.status === 'Failed' || enriched.packing_status === 'cancelled') {
        return {
          ...enriched,
          packing_status: 'cancelled',
          assigned_packer_id: undefined,
          assigned_packer_name: undefined
        };
      }

      if (!enriched.packing_status) {
        return {
          ...enriched,
          packing_status: 'pending',
          assigned_packer_id: undefined,
          assigned_packer_name: undefined
        };
      }

      if (enriched.assigned_packer_id && !enriched.assigned_packer_name) {
        const packer = getAllPackers.find((p: any) => p.id === enriched.assigned_packer_id);
        if (packer) {
          updateOrder(enriched.id, { assigned_packer_name: packer.name });
          return { ...enriched, assigned_packer_name: packer.name };
        }
      }

      // CRITICAL: Always return a new object, even if nothing changed
      return { ...enriched };
    });
  }, [orders, getAllPackers, updateOrder]);

  // Get orders for this packer - recalculate when enrichedOrders changes
  const packerOrders = useMemo(() => {
    return enrichedOrders.filter(order => order.assigned_packer_id === packerId);
  }, [enrichedOrders, packerId]);

  // Count orders by status
  const allCount = packerOrders.length;
  const assignedCount = packerOrders.filter(o => 
    o.packing_status === 'assigned' || o.packing_status === 'in_process'
  ).length;
  const pendingCount = packerOrders.filter(o => o.packing_status === 'pending').length;
  const packedCount = packerOrders.filter(o => o.packing_status === 'packed').length;
  const outOfStockCount = packerOrders.filter(o => o.packing_status === 'out_of_stock').length;

  // Filter based on active tab
  const filteredOrders = useMemo(() => {
    return packerOrders.filter(order => {
      const matchesSearch = 
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone.includes(searchQuery);

      let matchesFilter = true;
      if (activeFilter === 'assigned') {
        matchesFilter = order.packing_status === 'assigned' || order.packing_status === 'in_process';
      } else if (activeFilter === 'pending') {
        matchesFilter = order.packing_status === 'pending';
      } else if (activeFilter === 'packed') {
        matchesFilter = order.packing_status === 'packed';
      } else if (activeFilter === 'out_of_stock') {
        matchesFilter = order.packing_status === 'out_of_stock';
      }

      const matchesPincode = zoneFilter === 'all' || order.pincode === zoneFilter;

      return matchesSearch && matchesFilter && matchesPincode;
    });
  }, [packerOrders, searchQuery, activeFilter, zoneFilter]);

  // Pagination for orders table
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const ordersStartIndex = (ordersCurrentPage - 1) * ordersPerPage;
  const ordersEndIndex = ordersStartIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndex);

  // Reset pagination when filters change
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [searchQuery, activeFilter, zoneFilter]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'packed': return 'bg-success/10 text-success border-success/20';
      case 'in_process':
      case 'assigned': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'out_of_stock': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Handler functions for selection and actions
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleReassignOrder = () => {
    if (selectedOrders.size > 0) {
      setShowReassignDialog(true);
    }
  };

  const handleConfirmReassignment = () => {
    if (reassignPacker && selectedOrders.size > 0) {
      const newPacker = getAllPackers.find((p: any) => p.id === reassignPacker);
      selectedOrders.forEach(orderId => {
        updateOrder(orderId, {
          assigned_packer_id: reassignPacker,
          assigned_packer_name: newPacker?.name,
          packing_status: 'assigned'
        });
      });
      toast.success(`Reassigned ${selectedOrders.size} order${selectedOrders.size > 1 ? 's' : ''} to ${newPacker?.name}`);
      setSelectedOrders(new Set());
      setShowReassignDialog(false);
      setReassignPacker('');
    }
  };

  const handleChangeStatus = () => {
    if (selectedOrders.size > 0) {
      setShowStatusChangeDialog(true);
    }
  };

  const handleConfirmStatusChange = () => {
    if (newPackingStatus && selectedOrders.size > 0) {
      const orderIds = Array.from(selectedOrders);
      const statusToSet = newPackingStatus as 'pending' | 'assigned' | 'packed' | 'out_of_stock';
      
      // Map packing status to order status
      let orderStatus: 'Placed' | 'Accepted' | 'Packed' | 'Items No Stock';
      switch (statusToSet) {
        case 'pending': orderStatus = 'Placed'; break;
        case 'assigned': orderStatus = 'Accepted'; break;
        case 'packed': orderStatus = 'Packed'; break;
        case 'out_of_stock': orderStatus = 'Items No Stock'; break;
        default: orderStatus = 'Placed';
      }
      
      // Update all orders directly
      orderIds.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        updateOrder(orderId, {
          packing_status: statusToSet,
          status: orderStatus,
          updated_at: new Date().toISOString()
        });
        
        // Also call updateOrderStatus for consistency
        updateOrderStatus(orderId, orderStatus, statusToSet);
        
        // Dispatch event to notify OrderDetail and other components of the update
        window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
          detail: { 
            orderId, 
            status: orderStatus, 
            packingStatus: statusToSet,
            packerName: order?.assigned_packer_name 
          }
        }));
      });
      
      // Also trigger a custom event to force other components to refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('forceOrderRefresh'));
      }, 100);
      
      // Close dialog and clear selection
      setShowStatusChangeDialog(false);
      setNewPackingStatus('');
      setSelectedOrders(new Set());
      
      toast.success(`Updated status for ${orderIds.length} order${orderIds.length > 1 ? 's' : ''} to ${newPackingStatus.toUpperCase()}`);
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusChangeDialog(false);
    setNewPackingStatus('');
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-success/10 text-success border-success/20';
      case 'active': return 'bg-warning/10 text-warning border-warning/20';
      case 'offline': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSyncIcon = (status: string) => {
    switch (status) {
      case 'synced': return '🟢';
      case 'active': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/order-management/packer-overview')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{packer.name}'s Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track packer orders
            </p>
          </div>
        </div>
      </div>

      {/* Manual Assignment Banner */}
      {!autoAssign && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Manual Assignment Active</p>
            <p className="text-sm text-blue-700">Select orders and manage them manually using the action buttons.</p>
          </div>
        </div>
      )}

      {/* Packer Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-lg">{packer.name}</h3>
                  <Badge className={getSyncStatusColor(packer.sync_status)}>
                    {getSyncIcon(packer.sync_status)} {packer.sync_status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{packer.id}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Zone: Promode Agro
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {packer.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted border border-border">
                <p className="text-3xl font-bold text-foreground">{assignedCount}</p>
                <p className="text-sm text-muted-foreground">Assigned</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-3xl font-bold text-warning">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-3xl font-bold text-success">{packedCount}</p>
                <p className="text-sm text-muted-foreground">Packed</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground font-medium">Completion</span>
                <span className="font-bold text-foreground">
                  {allCount > 0 ? Math.round((packedCount / allCount) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${allCount > 0 ? Math.round((packedCount / allCount) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Management */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Orders Management ({String(allCount).padStart(2, '0')})
            </h2>
            {/* Action Buttons - Only show when orders are selected and autoAssign is off */}
            {!autoAssign && selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReassignOrder}
                >
                  Reassign ({selectedOrders.size})
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleChangeStatus}
                >
                  Change Status ({selectedOrders.size})
                </Button>
              </div>
            )}
          </div>
          
          {/* Search Bar and Filters */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-[612px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Order ID, Customer Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>
              <Select value={zoneFilter} onValueChange={setZoneFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="All Pincode Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pincode Zone</SelectItem>
                  <SelectItem value="110001">110001</SelectItem>
                  <SelectItem value="110016">110016</SelectItem>
                  <SelectItem value="110075">110075</SelectItem>
                  <SelectItem value="110024">110024</SelectItem>
                  <SelectItem value="110005">110005</SelectItem>
                  <SelectItem value="110017">110017</SelectItem>
                  <SelectItem value="110034">110034</SelectItem>
                  <SelectItem value="110048">110048</SelectItem>
                  <SelectItem value="110058">110058</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Pagination Controls - Right side with 24px margin */}
            <div className="flex items-center gap-2 mr-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrdersCurrentPage(Math.max(1, ordersCurrentPage - 1))}
                disabled={ordersCurrentPage === 1}
                className="h-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {ordersCurrentPage} of {totalOrdersPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOrdersCurrentPage(Math.min(totalOrdersPages, ordersCurrentPage + 1))}
                disabled={ordersCurrentPage === totalOrdersPages}
                className="h-10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Tabs - 5 tabs */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as FilterTab)}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {allCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="assigned" className="flex items-center gap-2">
                Assigned
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {assignedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {pendingCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="packed" className="flex items-center gap-2">
                Packed
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {packedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="out_of_stock" className="flex items-center gap-2">
                Items No Stock
                <Badge variant="destructive" className="ml-1 h-5 px-2 bg-red-500 text-white">
                  {outOfStockCount}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="mt-4">
              {/* Orders Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1200px]">
                    <TableHeader>
                      <TableRow>
                        {!autoAssign && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrders.has(o.id))}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                        )}
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Pincode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sync</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedOrders.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={!autoAssign ? 9 : 8} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                        </TableRow>
                      ) : (
                        paginatedOrders.map((order) => (
                          <TableRow 
                            key={`${order.id}-${order.packing_status}`}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/order-management/orders/${order.id}?from=packer-orders&packerId=${packerId}`)}
                          >
                            {!autoAssign && (
                              <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedOrders.has(order.id)}
                                  onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                />
                              </TableCell>
                            )}
                            <TableCell className="font-medium whitespace-nowrap">{order.order_number}</TableCell>
                            <TableCell className="whitespace-nowrap">{order.customer_name}</TableCell>
                            <TableCell className="text-sm whitespace-nowrap">{order.customer_phone}</TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              <span className="text-sm font-semibold">{order.items.length}</span>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap max-w-[200px] truncate">
                              {order.address || 'N/A'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                {order.pincode || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge className={getStatusColor(order.packing_status)}>
                                {order.packing_status === 'packed' && '✅ '}
                                {order.packing_status === 'assigned' && '📋 '}
                                {order.packing_status === 'in_process' && '📋 '}
                                {order.packing_status === 'pending' && '⏳ '}
                                {order.packing_status === 'out_of_stock' && '🔴 '}
                                {order.packing_status === 'out_of_stock' ? 'ITEMS NO STOCK' : 
                                 order.packing_status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <WifiOff className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-gray-700">Sync</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reassign Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Reassign Orders</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedOrders.size === 1 
                ? 'Select a packer to reassign this order to' 
                : `Reassigning ${selectedOrders.size} orders to a packer`
              }
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Packer</label>
              <Select value={reassignPacker} onValueChange={setReassignPacker}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a packer" />
                </SelectTrigger>
                <SelectContent>
                  {getAllPackers
                    .filter((p: any) => p.id !== packerId && (p.sync_status !== 'offline' || !p.sync_status))
                    .map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReassignDialog(false);
              setReassignPacker('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReassignment}
              disabled={!reassignPacker}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Reassign {selectedOrders.size} Order{selectedOrders.size !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Packing Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Packing Status</label>
              <Select value={newPackingStatus} onValueChange={setNewPackingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select packing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                  <SelectItem value="out_of_stock">Items No Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              This will update the packing status for {selectedOrders.size} selected order(s)
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancelStatusChange}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={!newPackingStatus}
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}