import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { type OrderStatus, type PaymentMode } from "@/data/orderData";
import { useOrders } from "@/contexts/OrderContext";
import { ArrowLeft, Search, Package, CheckCircle, XCircle, Clock, Calendar, MapPin, User, Phone, Filter, ChevronDown, ChevronUp, IndianRupee, Plus, Printer, CreditCard, CheckCircle2, XCircle as XCircleIcon, Truck, RotateCcw, AlertTriangle, Check, ArrowUpDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const OrdersList = () => {
  const navigate = useNavigate();
  const { orders, resetOrders, updateOrderStatus } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMode | "all">("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<"all" | "Paid" | "Pending" | "Failed">("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all");
  const [deliverySlotFilter, setDeliverySlotFilter] = useState<string>("all");
  const [pincodeFilter, setPincodeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Helper function to check date range
  const checkDateRange = (createdAt: string, range: string): boolean => {
    const orderDate = new Date(createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last14Days = new Date(today);
    last14Days.setDate(last14Days.getDate() - 14);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const last2Months = new Date(today);
    last2Months.setMonth(last2Months.getMonth() - 2);

    switch (range) {
      case 'today':
        return orderDate.toDateString() === today.toDateString();
      case 'yesterday':
        return orderDate.toDateString() === yesterday.toDateString();
      case 'last14days':
        return orderDate >= last14Days;
      case 'last1month':
        return orderDate >= lastMonth;
      case 'last2months':
        return orderDate >= last2Months;
      case 'older':
        return orderDate < last2Months;
      default:
        return true;
    }
  };

  // Helper function to check delivery slot
  const checkDeliverySlot = (deliverySlot: string, slot: string): boolean => {
    const slotLower = deliverySlot.toLowerCase().trim();
    
    switch (slot) {
      case 'morning':
        return slotLower.includes('morning') || slotLower.includes('9:00') || slotLower.includes('10:00') || slotLower.includes('11:00');
      case 'afternoon':
        return slotLower.includes('afternoon') || slotLower.includes('1:00') || slotLower.includes('2:00') || slotLower.includes('3:00') || slotLower.includes('4:00');
      case 'evening':
        return slotLower.includes('evening') || slotLower.includes('5:00') || slotLower.includes('6:00') || slotLower.includes('7:00') || slotLower.includes('8:00');
      default:
        return true;
    }
  };

  // Helper function to extract pincode from address
  const extractPincode = (address: string): string | null => {
    const pincodeMatch = address.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : null;
  };

  // Helper function to check pincode
  const checkPincode = (address: string, pincode: string): boolean => {
    if (pincode === "all") return true;
    const extractedPincode = extractPincode(address);
    return extractedPincode === pincode;
  };

  // Helper function to get payment status
  const getPaymentStatus = (order: typeof orders[0]): 'Paid' | 'Pending' | 'Failed' => {
    if (order.payment_mode === 'Online') {
      // Check if payment failed
      if (order.status === 'Failed') return 'Failed';
      // Online payment successful
      return 'Paid';
    }
    // COD orders - always Pending until delivered
    if (order.status === 'Delivered') return 'Paid';
    return 'Pending';
  };
  
  const filteredOrders = (orders || []).filter(order => {
    try {
      const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.payment_mode === paymentFilter;
      const matchesPaymentStatus = paymentStatusFilter === "all" || getPaymentStatus(order) === paymentStatusFilter;
      const matchesDateRange = dateRangeFilter === "all" || checkDateRange(order.created_at, dateRangeFilter);
      const matchesDeliverySlot = deliverySlotFilter === "all" || checkDeliverySlot(order.delivery_slot, deliverySlotFilter);
      const matchesPincode = pincodeFilter === "all" || checkPincode(order.address, pincodeFilter);
      
      // Debug logging for Payment Status and Date Range filters
      if (paymentStatusFilter !== "all" || dateRangeFilter !== "all") {
        console.log('Filter Debug:', {
          orderId: order.id,
          paymentStatus: getPaymentStatus(order),
          paymentStatusFilter,
          matchesPaymentStatus,
          created_at: order.created_at,
          dateRangeFilter,
          matchesDateRange,
          orderDate: new Date(order.created_at).toDateString()
        });
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesPaymentStatus && matchesDateRange && matchesDeliverySlot && matchesPincode;
    } catch (error) {
      console.error('Error filtering order:', error, order);
      return false;
    }
  });

  // TODO: Replace with pincode module integration
  // This will be replaced with dynamic pincode data from the pincode module
  const pincodes = Array.from(new Set((orders || []).map(o => extractPincode(o.address)))).filter(Boolean);
  
  // Future pincode module integration points:
  // 1. Fetch pincodes from pincode module API
  // 2. Display added/removed/active pincodes in the filter
  // 3. Show pincode statistics (total, active, inactive, etc.)
  // 4. Allow pincode management from this interface

  // Debug: Log filter results
  console.log('Filter Results:', {
    totalOrders: orders?.length || 0,
    filteredOrders: filteredOrders.length,
    statusFilter,
    paymentStatusFilter,
    dateRangeFilter,
    deliverySlotFilter,
    pincodeFilter
  });

  const orderStats = useMemo(() => {
    const ordersList = orders || [];
    return {
      total: ordersList.length,
      placed: ordersList.filter(o => o.status === 'Placed').length,
      accepted: ordersList.filter(o => o.status === 'Accepted').length,
      packed: ordersList.filter(o => o.status === 'Packed').length,
      dispatched: ordersList.filter(o => o.status === 'Dispatched').length,
      delivered: ordersList.filter(o => o.status === 'Delivered').length,
      cancelled: ordersList.filter(o => o.status === 'Cancelled').length,
      returned: ordersList.filter(o => o.status === 'Returned').length,
    };
  }, [orders]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Placed':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'Accepted':
        return <CheckCircle2 className="h-4 w-4 text-purple-600" />;
      case 'Packed':
        return <Package className="h-4 w-4 text-orange-600" />;
      case 'On the way':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'Dispatched':
        return <Truck className="h-4 w-4 text-indigo-600" />;
      case 'Delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Undelivered':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'Cancelled':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'Returned':
        return <RotateCcw className="h-4 w-4 text-yellow-600" />;
      case 'Failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDeliverySlot = (deliverySlot: string) => {
    // Handle different formats of delivery slot
    const slot = deliverySlot.toLowerCase().trim();
    
    // If it already contains time range format like "11:00 AM - 1:00 PM"
    if (slot.includes('am') || slot.includes('pm')) {
      // Extract time range and determine shift
      const timeRange = deliverySlot;
      let shiftName = '';
      
      // Determine shift based on time
      if (slot.includes('9:00') || slot.includes('10:00') || slot.includes('11:00')) {
        shiftName = 'Morning';
      } else if (slot.includes('1:00') || slot.includes('2:00') || slot.includes('3:00') || slot.includes('4:00')) {
        shiftName = 'Afternoon';
      } else if (slot.includes('5:00') || slot.includes('6:00') || slot.includes('7:00') || slot.includes('8:00')) {
        shiftName = 'Evening';
      } else {
        shiftName = 'Afternoon'; // Default fallback
      }
      
      return `${timeRange} (${shiftName})`;
    }
    
    // Handle shift-only formats like "morning", "afternoon", "evening"
    if (slot === 'morning') {
      return '09:00 AM - 11:00 AM (Morning)';
    } else if (slot === 'afternoon') {
      return '11:00 AM - 1:00 PM (Afternoon)';
    } else if (slot === 'evening') {
      return '05:00 PM - 07:00 PM (Evening)';
    }
    
    // Default fallback - return as is with Afternoon
    return `${deliverySlot} (Afternoon)`;
  };

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
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  // Show loading state if orders are not loaded
  if (!orders) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  const selectedOrdersData = useMemo(() => {
    return (orders || []).filter(order => selectedOrders.has(order.id));
  }, [orders, selectedOrders]);

  const firstCancellationRequest = useMemo(() => {
    return selectedOrdersData.find(order => order.status === 'Returned');
  }, [selectedOrdersData]);

  const statusOptions: { value: OrderStatus; label: string; packingStatus?: 'pending' | 'assigned' | 'packed' | 'out_of_stock' }[] = useMemo(() => ([
    { value: 'Placed', label: 'Order Placed', packingStatus: 'pending' },
    { value: 'Accepted', label: 'Order In Process', packingStatus: 'assigned' },
    { value: 'Packed', label: 'Packed', packingStatus: 'packed' },
    { value: 'On the way', label: 'On The Way' },
    { value: 'Dispatched', label: 'Dispatched' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Undelivered', label: 'Undelivered' },
    { value: 'Cancelled', label: 'Cancelled' },
    { value: 'Returned', label: 'Request for Cancellation' },
    { value: 'Failed', label: 'Failed' }
  ]), []);

  const handleBulkStatusChange = (status: OrderStatus, packingStatus?: 'pending' | 'assigned' | 'packed' | 'out_of_stock') => {
    const ids = Array.from(selectedOrders);
    if (ids.length === 0) return;

    ids.forEach(orderId => {
      updateOrderStatus(orderId, status, packingStatus);
    });

    setSelectedOrders(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground">{filteredOrders.length} orders found</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Multiple Print
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={resetOrders}
          >
            <XCircle className="h-4 w-4" />
            Reset Orders
          </Button>
          {firstCancellationRequest && (
            <Button
              variant="outline"
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                const targetOrder = firstCancellationRequest;
                setSelectedOrders(new Set());
                navigate(`/order-management/orders/${targetOrder.id}`, {
                  state: {
                    openCancelDialog: true
                  }
                });
              }}
            >
              <AlertTriangle className="h-4 w-4" />
              Process Cancellation
            </Button>
          )}
          {selectedOrders.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Change Status ({selectedOrders.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[220px]">
                {statusOptions.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => handleBulkStatusChange(option.value, option.packingStatus)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => navigate('/order-management/add-order')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Order
          </Button>
        </div>
      </div>
      {/* Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-3xl font-bold">{orderStats.total}</p>
            <p className="text-xs text-muted-foreground">all orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Placed</p>
            <p className="text-3xl font-bold">{orderStats.placed}</p>
            <p className="text-xs text-muted-foreground">new orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-3xl font-bold">{orderStats.accepted}</p>
            <p className="text-xs text-muted-foreground">processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-3xl font-bold">{orderStats.delivered}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Cancelled</p>
            <p className="text-3xl font-bold">{orderStats.cancelled}</p>
            <p className="text-xs text-muted-foreground">cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Returned</p>
            <p className="text-3xl font-bold">{orderStats.returned}</p>
            <p className="text-xs text-muted-foreground">returned</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <Checkbox 
          id="select-all"
          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <label htmlFor="select-all" className="text-sm font-medium text-foreground cursor-pointer">
          Total Selected Items: {selectedOrders.size}
        </label>
      </div>

      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 min-w-[120px]"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Enhanced Filter Section */}
        {showFilters && (
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                {/* Order Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Order Status</label>
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Placed">Order Placed</SelectItem>
                      <SelectItem value="Accepted">Order In Process</SelectItem>
                      <SelectItem value="Packed">Packed</SelectItem>
                      <SelectItem value="On the way">On The Way</SelectItem>
                      <SelectItem value="Dispatched">Dispatched</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                      <SelectItem value="Undelivered">Undelivered</SelectItem>
                      <SelectItem value="Items No Stock">Items No Stock</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                      <SelectItem value="Returned">Request for Cancellation</SelectItem>
                      <SelectItem value="Cancelled">Cancel Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                  {/* Payment Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Payment Type</label>
                  <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as any)}>
                      <SelectTrigger className="h-10">
                      <SelectValue placeholder="All Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment</SelectItem>
                        <SelectItem value="COD">Cash on Delivery</SelectItem>
                        <SelectItem value="Online">Online Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Payment Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                    <Select value={paymentStatusFilter} onValueChange={(v) => setPaymentStatusFilter(v as any)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Date Range</label>
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today's Orders</SelectItem>
                        <SelectItem value="yesterday">Yesterday's Orders</SelectItem>
                        <SelectItem value="last14days">Last 14 Days</SelectItem>
                        <SelectItem value="last1month">Last 1 Month</SelectItem>
                        <SelectItem value="last2months">Last 2 Months</SelectItem>
                        <SelectItem value="older">Older</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delivery Slot Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Delivery Slot</label>
                    <Select value={deliverySlotFilter} onValueChange={setDeliverySlotFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Slots" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Slots</SelectItem>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>

                  {/* Pincode Zone Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Pincode Zone</label>
                    <Select value={pincodeFilter} onValueChange={setPincodeFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="All Pincode Zones" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Pincode Zones</SelectItem>
                        {pincodes.map(pincode => (
                          <SelectItem key={pincode} value={pincode}>{pincode}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setPaymentFilter("all");
                      setPaymentStatusFilter("all");
                      setDateRangeFilter("all");
                      setDeliverySlotFilter("all");
                      setPincodeFilter("all");
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const isSelected = selectedOrders.has(order.id);
            return (
            <Card
              key={order.id}
              className={`transition-all border-l-4 hover:border-l-\[#16a249\]`}
              style={{ borderLeftColor: isSelected ? '#16a249' : 'hsl(var(--muted))' }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <Checkbox 
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Link to={`/order-management/orders/${order.id}`} className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-bold text-lg text-foreground">{order.order_number}</h3>
                          <span
                            className={`inline-flex items-center justify-center rounded-full px-3 h-6 text-xs font-medium leading-none ${
                              order.payment_mode === 'Online'
                                ? 'bg-[#16a249] text-white'
                                : 'bg-[#000000] text-white'
                            }`}
                        >
                          {order.payment_mode === 'Online' ? 'Prepaid' : 'COD'}
                          </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{order.customer_phone}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Oct 10, 2025</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                            <p className="font-bold text-lg text-foreground">₹{order.total_amount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm py-3 border-t border-b mt-[10px] my-0.5">
                        <div className="flex items-center gap-2 flex-1 pr-2 border-r border-gray-200">
                          <div className="rounded-full p-2 bg-orange-100 flex-shrink-0">
                            <Package className="h-4 w-4 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Items</p>
                            <p className="font-semibold text-foreground mt-1">{order.items.length} Items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 px-2 border-r border-gray-200">
                          <div className="rounded-full p-2 bg-blue-100 flex-shrink-0">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Delivery Slot</p>
                            <p className="font-semibold text-foreground mt-1 break-words">{formatDeliverySlot(order.delivery_slot)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 px-2 border-r border-gray-200">
                          <div className="rounded-full p-2 bg-green-100 flex-shrink-0">
                            <CreditCard className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Payment Status</p>
                            <div className="mt-1">
                            <Badge variant={getPaymentStatus(order) === 'Paid' ? 'default' : getPaymentStatus(order) === 'Failed' ? 'destructive' : 'secondary'}
                              className={getPaymentStatus(order) === 'Paid' ? 'bg-green-100 text-green-700' : ''}
                            >
                              {getPaymentStatus(order)}
                            </Badge>
                          </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 pl-2">
                          <div className="rounded-full p-2 bg-purple-100 flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground">Status</p>
                            <div className="mt-1">
                              <StatusBadge status={order.status} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {order.address}
                        </p>
                      </div>
                    </Link>
                  </div>
                </CardContent>
              </Card>
          )})}
        </div>
    </div>
  );
};

export default OrdersList;
