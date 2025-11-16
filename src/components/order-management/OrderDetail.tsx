import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { useProducts } from "@/contexts/ProductContext";
import { useOrders } from "@/contexts/OrderContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { type OrderStatus, type OrderItem } from "@/data/orderData";
import { ArrowLeft, Phone, MapPin, Clock, CreditCard, Package, User, Trash2, Plus, Printer, X, RotateCcw, Calendar, Search } from "lucide-react";
import { Link, useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo, useEffect } from "react";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { orders, updateOrderStatus, updateOrder, addOrder } = useOrders();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Auto-assign state from localStorage
  const [autoAssign, setAutoAssign] = useState<boolean>(() => {
    const saved = localStorage.getItem('packerAutoAssign');
    return saved !== null ? saved === 'true' : true;
  });
  
  
  // Get the current order - will update when orders change
  // Try to find by id first, then by order_number (in case URL uses order_number)
  const order = useMemo(() => {
    if (!orders || !id) {
      console.log('OrderDetail: No orders or id', { orders: orders?.length, id });
      return undefined;
    }
    try {
      const found = orders.find(o => {
        // Try matching by id
        if (o.id === id) return true;
        // Try matching by order_number
        if (o.order_number === id) return true;
        // Try matching order_number without dashes (in case URL has different format)
        if (o.order_number?.replace(/-/g, '') === id.replace(/-/g, '')) return true;
        return false;
      });
      if (!found) {
        console.log('OrderDetail: Order not found', { id, orderNumbers: orders.map(o => o.order_number).slice(0, 5) });
      }
      return found;
    } catch (error) {
      console.error('Error finding order:', error);
      return undefined;
    }
  }, [orders, id]);
  
  const { products, searchProducts: searchProductsContext } = useProducts();

  // Listen for order updates from PackerOverview, runsheet operations, or other components
  useEffect(() => {
    const handleOrderUpdate = (event?: CustomEvent | Event) => {
      // Force re-render to get latest order data
      setRefreshKey(prev => prev + 1);
      
      // If event has orderIds and one matches current order, force immediate refresh
      if (event && 'detail' in event && event.detail) {
        const detail = event.detail as any;
        if (detail.orderIds && Array.isArray(detail.orderIds) && detail.orderIds.includes(id)) {
          // Current order was updated - force immediate refresh
          setTimeout(() => {
            setRefreshKey(prev => prev + 1);
          }, 100);
        } else if (detail.orderId === id) {
          // Current order was updated - force immediate refresh
          setTimeout(() => {
            setRefreshKey(prev => prev + 1);
          }, 100);
        }
      }
    };
    
    const handleCustomEvent = (e: Event) => handleOrderUpdate(e as CustomEvent);
    
    window.addEventListener('orderStatusUpdated', handleCustomEvent);
    window.addEventListener('riderOrderCompleted', handleCustomEvent);
    window.addEventListener('storage', (e) => {
      if (e.key === 'warehouse-orders') {
        handleOrderUpdate(e);
      }
    });
    
    // Poll for updates (fallback) - more frequent for runsheet sync
    const pollInterval = setInterval(() => {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        handleOrderUpdate();
      }
    }, 2000); // Poll every 2 seconds for faster sync
    
    return () => {
      window.removeEventListener('orderStatusUpdated', handleCustomEvent);
      window.removeEventListener('riderOrderCompleted', handleCustomEvent);
      clearInterval(pollInterval);
    };
  }, [id]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This is a React requirement - hooks must be called in the same order every render
  
  // State declarations - use default values that work even if order is undefined
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [removedItems, setRemovedItems] = useState<OrderItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: number}>({});
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('Placed');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [addShipping, setAddShipping] = useState<string>('0');
  const [subtractShipping, setSubtractShipping] = useState<string>('0');
  
  // Auto-save functionality - no need for hasUnsavedChanges state
  const { addNotification } = useNotifications();
  
  // Auto-open cancel dialog when navigated from cancellation processing
  useEffect(() => {
    const state = location.state as { openCancelDialog?: boolean } | null;
    if (state?.openCancelDialog && order) {
      setShowCancelDialog(true);
      if (order.cancellation_reason) {
        setCancelReason(order.cancellation_reason);
      }
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location.state, location.pathname, location.search, order?.cancellation_reason, navigate, order]);

  // Keep cancellation reason in sync with order updates
  useEffect(() => {
    if (order?.cancellation_reason) {
      setCancelReason(order.cancellation_reason);
    }
  }, [order?.cancellation_reason]);

  // Update local state when order changes (from PackerOverview or other sources)
  useEffect(() => {
    if (order) {
      setOrderItems(order.items || []);
      setOrderStatus(order.status || 'Placed');
      setDiscountAmount(order.discount || 0);
      setCancelReason(order.cancellation_reason || '');
      setShippingCharges(order.shipping_charges || 0);
    }
  }, [order?.id, order?.status, order?.items, order?.discount, order?.cancellation_reason, order?.shipping_charges]);

  // Auto-save function that updates the order in context
  const autoSaveOrder = () => {
    if (order) {
      const subtotal = orderItems
        .filter(item => !item.is_out_of_stock)
        .reduce((sum, item) => sum + item.subtotal, 0);
      updateOrder(order.id, {
        items: orderItems,
        total_amount: subtotal + shippingCharges - discountAmount,
        updated_at: new Date().toISOString()
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const item = orderItems.find(i => i.id === itemId);
    if (item) {
      setRemovedItems([...removedItems, item]);
      const newOrderItems = orderItems.filter(i => i.id !== itemId);
      setOrderItems(newOrderItems);
      // Auto-save immediately
      setTimeout(() => autoSaveOrder(), 0);
    }
  };

  const handleToggleProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts({...selectedProducts, [productId]: 0});
    } else {
      const newSelected = {...selectedProducts};
      delete newSelected[productId];
      setSelectedProducts(newSelected);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts({...selectedProducts, [productId]: quantity});
  };

  // Text truncation functions for table columns
  const splitItemName = (name: string): { first: string; second: string; ellipsis: boolean } => {
    if (!name) return { first: "", second: "", ellipsis: false };
    const first = name.slice(0, 20);
    const remainder = name.slice(20);
    const second = remainder.slice(0, 17);
    return { first, second, ellipsis: remainder.length > 17 };
  };

  const splitCategoryText = (text: string): { first: string; second: string; ellipsis: boolean } => {
    if (!text) return { first: "", second: "", ellipsis: false };
    const first = text.slice(0, 15);
    const remainder = text.slice(15);
    const second = remainder.slice(0, 12);
    return { first, second, ellipsis: remainder.length > 12 };
  };

  // Filtered products - show all products as individual items (synced with inventory)
  const filteredProducts = useMemo(() => {
    return searchProductsContext(searchTerm, categoryFilter, statusFilter);
  }, [searchProductsContext, searchTerm, categoryFilter, statusFilter]);

  const handleAddItems = () => {
    const newItems = Object.entries(selectedProducts)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      if (product) {
        return {
          id: `OI${Date.now()}_${productId}`,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          price: product.price,
          subtotal: product.price * quantity,
          is_substituted: false
        };
      }
      return null;
    }).filter(item => item !== null);
    
    const updatedOrderItems = [...orderItems, ...newItems as any];
    setOrderItems(updatedOrderItems);
    // Auto-save immediately
    setTimeout(() => autoSaveOrder(), 0);
    setShowAddItemDialog(false);
    setSelectedProducts({});
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
  };

  const handleRestoreItem = (itemId: string) => {
    const item = removedItems.find(i => i.id === itemId);
    if (item) {
      const updatedOrderItems = [...orderItems, item];
      setOrderItems(updatedOrderItems);
      setRemovedItems(removedItems.filter(i => i.id !== itemId));
      // Auto-save immediately
      setTimeout(() => autoSaveOrder(), 0);
    }
  };

  const handleDeleteRemovedItem = (itemId: string) => {
    setRemovedItems(removedItems.filter(i => i.id !== itemId));
  };

  // Revert out-of-stock item back to in-stock
  const handleRevertOutOfStock = (itemId: string) => {
    const updatedOrderItems = orderItems.map(item => 
      item.id === itemId 
        ? { ...item, is_out_of_stock: false }
        : item
    );
    setOrderItems(updatedOrderItems);
    // Auto-save immediately
    setTimeout(() => autoSaveOrder(), 0);
    toast.success('Item reverted to in-stock status');
  };

  // Permanently delete out-of-stock item
  const handleDeleteOutOfStock = (itemId: string) => {
    const updatedOrderItems = orderItems.filter(item => item.id !== itemId);
    setOrderItems(updatedOrderItems);
    // Auto-save immediately
    setTimeout(() => autoSaveOrder(), 0);
    toast.success('Item permanently removed from order');
  };

  const handleApplyDiscount = () => {
    toast.success('Discount applied successfully');
    setShowDiscountDialog(false);
  };

  const handleCancelOrder = () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    if (!order) return;

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      toast.error('Please enter a cancellation reason');
      return;
    }

    setOrderStatus('Cancelled');
    setShowCancelDialog(false);
    updateOrderStatus(order.id, 'Cancelled');
    updateOrder(order.id, {
      status: 'Cancelled',
      cancellation_reason: trimmedReason,
      cancellation_requested: false,
      assigned_packer_id: undefined,
      assigned_packer_name: undefined,
      packing_status: 'cancelled',
      updated_at: new Date().toISOString()
    });
    toast.success('Order cancelled successfully');
  };

  const handleReAttempt = () => {
    if (!order) return;

    setShowCancelDialog(false);
    setCancelReason('');
    setOrderStatus('Placed');
    updateOrderStatus(order.id, 'Placed', 'pending');
    updateOrder(order.id, {
      status: 'Placed',
      cancellation_reason: '',
      cancellation_requested: false,
      updated_at: new Date().toISOString()
    });
    toast.success('Order re-attempted successfully');
  };

  const handlePrintBill = () => {
    window.print();
    toast.success('Printing bill...');
  };

  const handleResumeOrder = () => {
    if (!order) return;
    
    // Resume order - change status back to pending and assign to same packer
    setOrderStatus('Placed');
    
    // Update order in context to change packing status from 'out_of_stock' to 'pending'
    // This will move the order from "Items No Stock" tab to "Pending" tab
    updateOrderStatus(order.id, 'Placed', 'pending');
    
    // Also update the order items and total in context to ensure consistency
    updateOrder(order.id, {
      items: orderItems,
      total_amount: subtotal + shippingCharges - discountAmount,
      status: 'Placed',
      packing_status: 'pending',
      updated_at: new Date().toISOString()
    });
    
    toast.success(`Order resumed successfully - assigned back to ${order.assigned_packer_name || 'packer'}`);
    
    // Send notification to packer
    addNotification({
      type: 'order_update',
      title: 'Order Resumed',
      message: `Order ${order.order_number} has been resumed and assigned back to ${order.assigned_packer_name || 'packer'}. Please continue packing.`,
      priority: 'high',
      orderId: order.id
    });
    
    // Navigate back to Packer Overview screen
    navigate('/order-management/packer-overview');
  };

  const getProductUnit = (productName: string) => {
    const mockProducts = [
      { name: 'Organic Tomatoes', unit: 'kg' },
      { name: 'Fresh Potatoes', unit: 'kg' },
      { name: 'Red Onions', unit: 'kg' },
      { name: 'Shimla Apples', unit: 'kg' },
      { name: 'Farm Bananas', unit: 'dozen' },
      { name: 'Orange Carrots', unit: 'kg' },
      { name: 'Fresh Spinach', unit: 'bundle' },
      { name: 'Alphonso Mangoes', unit: 'kg' },
    ];
    const product = mockProducts.find(p => p.name === productName);
    return product?.unit || 'unit';
  };

  // Calculate subtotal excluding out-of-stock items
  const subtotal = orderItems
    .filter(item => !item.is_out_of_stock)
    .reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = subtotal + shippingCharges - discountAmount;
  
  // Handle context-aware back navigation
  const handleBackNavigation = () => {
    const from = searchParams.get('from');
    
    if (from === 'packer-overview') {
      // If came from packer overview, go back to packer overview
      navigate('/order-management/packer-overview');
    } else if (from === 'packer-orders') {
      const packerId = searchParams.get('packerId');
      if (packerId) {
        navigate(`/order-management/packer-orders/${packerId}`);
      } else {
        navigate('/order-management/packer-overview');
      }
    } else {
      // Default: go back to orders list
      navigate('/order-management/orders');
    }
  };

  // Add loading state while orders are being fetched
  if (!orders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  // If order not found, show error message
  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-muted-foreground">Order with ID "{id}" could not be found.</p>
          <Button onClick={handleBackNavigation} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getPaymentStatus = (): 'Paid' | 'Pending' | 'Failed' => {
    if (order.payment_mode === 'Online') {
      // Online payment - check if failed
      if (order.status === 'Failed') return 'Failed';
      // Online payment successful
      return 'Paid';
    }
    // COD orders - always Pending until delivered
    if (order.status === 'Delivered') return 'Paid';
    return 'Pending';
  };

  const getPackingStatusVariant = (status: string) => {
    switch (status) {
      case 'packed': return 'default';
      case 'assigned': return 'outline';
      case 'pending': return 'secondary';
      case 'out_of_stock': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPackingStatusIcon = (status: string) => {
    switch (status) {
      case 'packed': return '✅';
      case 'assigned': return '📋';
      case 'pending': return '⏳';
      case 'out_of_stock': return '🔴';
      case 'cancelled': return '❌';
      default: return '⏳';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={handleBackNavigation}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{order?.order_number || id || 'Order'}</h1>
                <p className="text-sm text-muted-foreground">Order Details</p>
              </div>
            </div>
            {/* Action buttons moved to header right */}
            <div className="flex items-center gap-5">
              {/* Show different buttons for Items No Stock orders */}
              {order?.packing_status === 'out_of_stock' ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleResumeOrder()}
                  className="font-semibold"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resume Order
                </Button>
              ) : (
                <Dialog open={showCancelDialog} onOpenChange={(open) => { setShowCancelDialog(open); if (!open) setCancelReason(''); }}>
                <DialogTrigger asChild>
                  {orderStatus === 'Cancelled' ? (
                      <Button variant="outline" className="hover:bg-success/10" onClick={() => setShowCancelDialog(true)}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Re Attempt
                    </Button>
                  ) : (
                      <Button variant="outline" className="text-red-800 border-red-800 border-[1.5px] font-semibold hover:bg-transparent hover:text-red-800">
                      Cancel Order
                    </Button>
                  )}
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {orderStatus === 'Cancelled' ? 'Confirm Action' : 'Order Cancel Reason'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {orderStatus === 'Cancelled' ? (
                    <>
                      <p className="text-center text-muted-foreground">
                        Are you sure you want to Reattempt This Order?
                      </p>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleReAttempt} className="bg-success hover:bg-success/90">
                          Confirm
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 border-b pb-4">
                        <p className="text-sm font-medium text-primary">Order ID: {order.order_number}</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{order.customer_name}</p>
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
                        <p className="text-sm text-muted-foreground">{order.address}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                      </div>
                      <div className="flex justify-between items-center border-b pb-4">
                        <p className="font-medium">Payment: <span className="text-primary">₹{order.total_amount}</span></p>
                        <p className="text-sm text-muted-foreground">{order.items.length} Items</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Reason</label>
                        <Textarea
                          placeholder="Enter cancellation reason"
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button 
                          variant="destructive"
                          onClick={handleCancelOrder}
                          disabled={!cancelReason.trim()}
                        >
                          Confirm Cancel
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
              )}
            <Button 
              variant="default"
              onClick={handlePrintBill}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Bill
            </Button>
          </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 sm:gap-6 lg:gap-7">
          <div className="space-y-6">
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items - {String(orderItems.length).padStart(2, '0')}
                </CardTitle>
                <Dialog open={showAddItemDialog} onOpenChange={(open) => { setShowAddItemDialog(open); if (!open) { setSelectedProducts({}); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Items
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl h-[calc(80vh+50px)] flex flex-col w-[95vw] sm:w-full">
                    <DialogHeader className="flex-shrink-0">
                      <DialogTitle>Add Items - Sync with Inventory</DialogTitle>
                    </DialogHeader>
                    
                    {/* Fixed Search and Filters Section */}
                    <div className="flex-shrink-0 mb-1">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input 
                            placeholder="Search by name, ID, category, or tags..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10" 
                          />
                        </div>
                        <div className="flex gap-2 sm:gap-4">
                          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full sm:w-48">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {Array.from(new Set(products.map(p => p.category))).map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-32">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="low-stock">Low Stock</SelectItem>
                              <SelectItem value="out-of-stock">Items No Stock</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
         {/* Flexible Table Section - Grows upward from bottom */}
         <div className="flex-1 min-h-0 flex flex-col">
           <div className="border rounded-lg overflow-hidden flex-1 overflow-y-auto py-1">
                        <div className="overflow-x-auto">
                          <Table className="min-w-full">
                            <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                              <TableHead className="w-12"></TableHead>
                                <TableHead className="hidden sm:table-cell">Item ID</TableHead>
                              <TableHead>Item Name</TableHead>
                                <TableHead className="hidden md:table-cell">Category</TableHead>
                                <TableHead className="hidden lg:table-cell">Sub Category</TableHead>
                                <TableHead className="hidden sm:table-cell">Unit</TableHead>
                                <TableHead className="hidden md:table-cell">Stock</TableHead>
                                <TableHead className="hidden sm:table-cell">Price</TableHead>
                                <TableHead className="w-20 sm:w-32">Qty</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                              {filteredProducts.map((product) => (
                                <TableRow 
                                  key={product.id}
                                  className={`${selectedProducts[product.id] !== undefined ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'} transition-colors`}
                                >
                                <TableCell>
                                  <Checkbox
                                      checked={selectedProducts[product.id] !== undefined}
                                    onCheckedChange={(checked) => handleToggleProduct(product.id, checked as boolean)}
                                  />
                                </TableCell>
                                  <TableCell className="hidden sm:table-cell font-mono text-sm text-muted-foreground">
                                    {product.id}
                                  </TableCell>
                       <TableCell className="font-medium">
                         <div className="space-y-1">
                           <div className="leading-tight">
                             {(() => {
                               const displayName = product.isVariant && product.parentProductId ? 
                                 // For variants, extract the base product name (remove size indicators)
                                 product.name
                                   .replace(/\s*-\s*(Large|Small|Medium|Extra Large|XL|L|M|S|XS)\s*$/i, '')
                                   .replace(/\s*\([^)]*\)\s*$/, '') // Remove any parenthetical info
                                   .trim() : 
                                 product.name;
                               
                               const { first, second, ellipsis } = splitItemName(displayName);
                               return (
                                 <>
                                   <span className="block whitespace-nowrap">{first}</span>
                                   {second && (
                                     <span className="block">{ellipsis ? `${second}...` : second}</span>
                                   )}
                                 </>
                               );
                             })()}
                           </div>
                           <div className="sm:hidden text-xs text-muted-foreground">
                             {product.id} • {product.category}
                           </div>
                         </div>
                       </TableCell>
                                  <TableCell className="hidden md:table-cell">
                         {(() => {
                           const { first, second, ellipsis } = splitCategoryText(product.category);
                           return (
                             <div className="leading-tight">
                               <span className="block whitespace-nowrap">{first}</span>
                               {second && (
                                 <span className="block">{ellipsis ? `${second}...` : second}</span>
                               )}
                             </div>
                           );
                         })()}
                       </TableCell>
                                  <TableCell className="hidden lg:table-cell">
                         {(() => {
                           const { first, second, ellipsis } = splitCategoryText(product.subcategory);
                           return (
                             <div className="leading-tight">
                               <span className="block whitespace-nowrap">{first}</span>
                               {second && (
                                 <span className="block">{ellipsis ? `${second}...` : second}</span>
                               )}
                             </div>
                           );
                         })()}
                       </TableCell>
                                  <TableCell className="hidden sm:table-cell">{product.unit}</TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <Badge 
                                      variant={product.status === 'active' ? 'default' : product.status === 'low-stock' ? 'secondary' : 'destructive'}
                                    >
                                      {product.stock} {product.unit}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">₹{product.price}</TableCell>
                                <TableCell>
                                    {selectedProducts[product.id] !== undefined && (
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={selectedProducts[product.id] === 0 ? '' : selectedProducts[product.id]}
                                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        className="w-16 sm:w-20 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/50 transition-colors"
                                        autoFocus
                                    />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      </div>
                    </div>
                    
         {/* Fixed Action Buttons Section */}
         <div className="flex-shrink-0 pt-2">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-between sm:items-center">
                        <Button 
                          variant="outline" 
                          onClick={() => { setShowAddItemDialog(false); setSelectedProducts({}); }}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddItems} 
                          disabled={Object.keys(selectedProducts).length === 0}
                          className="w-full sm:w-auto"
                        >
                          Done ({Object.keys(selectedProducts).length} items selected)
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* In-Stock Items */}
                  {orderItems.filter(item => !item.is_out_of_stock).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • {item.quantity * 500}{getProductUnit(item.product_name)} • ₹{item.price} each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-semibold text-foreground">₹{item.subtotal}</p>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Out of Stock Items - Only show if order has Items No Stock status */}
                  {order.packing_status === 'out_of_stock' && orderItems.filter(item => item.is_out_of_stock).length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-red-600 text-base">Out Of Stock</h4>
                      {orderItems.filter(item => item.is_out_of_stock).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-red-800">{item.product_name}</p>
                              <p className="text-sm text-red-600">
                                Qty: {item.quantity} • {item.quantity * 500}{getProductUnit(item.product_name)} • ₹{item.price} each
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                              Out Of Stock
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevertOutOfStock(item.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-100"
                              title="Revert to in-stock"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteOutOfStock(item.id)}
                              className="h-8 w-8 text-red-600 hover:bg-red-100"
                              title="Permanently delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {removedItems.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-foreground mb-3">Out Of Stock</h4>
                      {removedItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5 mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} • {item.quantity * 500}{getProductUnit(item.product_name)} • ₹{item.price} each
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Out Of Stock</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRestoreItem(item.id)}
                              title="Restore item"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteRemovedItem(item.id)}
                              title="Delete item permanently"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">Sub Total:</p>
                      <p className="font-medium text-foreground">₹{subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
                        <DialogTrigger asChild>
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary">Shipping Charges</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Shipping Charges</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Are you sure you want to apply this Shipping charges to your order?
                            </p>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Final Amount</label>
                              <p className="text-lg font-bold">₹{(subtotal + shippingCharges + (parseFloat(addShipping) || 0) - (parseFloat(subtractShipping) || 0) - discountAmount).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-sm text-muted-foreground">Adding charges</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">₹ +</span>
                                <Input
                                  value={addShipping}
                                  onChange={(e) => setAddShipping(e.target.value)}
                                  className="pl-10 w-[120px] text-right"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-sm text-muted-foreground">Subtract charges</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">₹ -</span>
                                <Input
                                  value={subtractShipping}
                                  onChange={(e) => setSubtractShipping(e.target.value)}
                                  className="pl-10 w-[120px] text-right"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="h-[0.1px]" />
                            <div className="flex justify-end gap-[20px] mt-0">
                              <Button variant="outline" onClick={() => { setShowShippingDialog(false); setAddShipping('0'); setSubtractShipping('0'); }}>Cancel</Button>
                              <Button onClick={() => {
                                const add = parseFloat(addShipping) || 0;
                                const sub = parseFloat(subtractShipping) || 0;
                                const next = shippingCharges + add - sub;
                                setShippingCharges(next);
                                setAddShipping('0');
                                setSubtractShipping('0');
                                setShowShippingDialog(false);
                              }}>Confirm</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <div className="flex items-center gap-2">
                        {shippingCharges !== 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title="Clear shipping charges"
                            onClick={() => setShippingCharges(0)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <p className="font-medium text-primary">
                          <span className="mr-[1px]">{shippingCharges > 0 ? '+' : shippingCharges < 0 ? '-' : ''}</span>
                          <span className="mr-[1px]">₹</span>
                          <span>{Math.abs(shippingCharges).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
                          <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                              Add Discount
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Add Discount</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Are you sure you want to apply this discount to your order?
                              </p>
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Final Amount</label>
                                <p className="text-lg font-bold">₹{(subtotal + shippingCharges - (discountAmount || 0)).toFixed(2)}</p>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <label className="text-sm text-muted-foreground">Discount</label>
                                <div className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*[.]?[0-9]*"
                                    value={String(discountAmount)}
                                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                                    className="pl-6 w-[120px] text-right"
                                    placeholder="0"
                                />
                                </div>
                              </div>
                              <div className="h-[0.1px]" />
                              <div className="flex justify-end gap-[20px] mt-0">
                                <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleApplyDiscount}>
                                  Confirm
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="flex items-center gap-2">
                        {discountAmount > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            title="Clear discount"
                            onClick={() => setDiscountAmount(0)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <p className="font-medium text-primary">₹{discountAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <p className="text-lg font-semibold text-foreground">Total Amount:</p>
                      <p className="text-2xl font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full lg:w-[450px]">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 whitespace-nowrap">
                  <User className="h-5 w-5" />
                  Customer Details
                </CardTitle>
                <div className="ml-6 flex flex-col items-end">
                  {/* Determine display status based on order flow */}
                  {(() => {
                    let displayStatus: OrderStatus = order.status;
                    
                    // Don't override Failed, Returned, Cancelled, or delivery statuses
                    if (order.status === 'Failed' || 
                        order.status === 'Returned' || 
                        order.status === 'Cancelled' ||
                        order.status === 'On the way' ||
                        order.status === 'Delivered' ||
                        order.status === 'Undelivered' ||
                        order.status === 'Items No Stock') {
                      return <StatusBadge status={displayStatus} />;
                    }
                    
                    // Status flow:
                    // - "Placed" status → shows "Order Placed" tag (StatusBadge handles this)
                    // - "Accepted" status → shows "Order In Process" tag (StatusBadge handles this)
                    // - "Pending" status with packer assigned → shows "Order In Process" tag (treat as auto-assigned)
                    // - "Packed" status → shows "Packed" tag
                    
                    // If status is "Pending" but order is assigned to a packer, show as "Order In Process"
                    if (order.status === 'Pending' && 
                        (order.assigned_packer_id || order.assigned_packer_name) &&
                        (order.packing_status === 'pending' || order.packing_status === 'assigned' || order.packing_status === 'in_process')) {
                      displayStatus = 'Accepted'; // This will show "Order In Process" via StatusBadge
                    }
                    
                    return <StatusBadge status={displayStatus} />;
                  })()}
                  
                  {/* Show appropriate text based on status and assignment */}
                  {(() => {
                    // Failed - prepaid order payment failed (bank issues, refund not received)
                    if (order.status === 'Failed') {
                      return (
                        <span className="text-xs text-muted-foreground mt-1">
                          Failed
                        </span>
                      );
                    }
                    
                    // Items No Stock - show packer name with "To" prefix
                    if (order.status === 'Items No Stock' || order.packing_status === 'out_of_stock') {
                      return order.assigned_packer_name ? (
                        <span className="text-xs text-muted-foreground mt-1">
                          To {order.assigned_packer_name}
                        </span>
                      ) : null;
                    }
                    
                    // Request for Cancellation (Returned status)
                    if (order.status === 'Returned') {
                      return (
                        <span className="text-xs text-muted-foreground mt-1">
                          Request for Cancellation
                        </span>
                      );
                    }
                    
                    // Cancelled - show "Cancel order by User"
                    if (order.status === 'Cancelled') {
                      return (
                        <span className="text-xs text-muted-foreground mt-1">
                          Cancel order by User
                        </span>
                      );
                    }
                    
                    // Delivery statuses - show rider name with "By" prefix
                    if (order.status === 'On the way' || order.status === 'Delivered' || order.status === 'Undelivered') {
                      if ((order as any).assigned_rider_name) {
                        return (
                          <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                            By {(order as any).assigned_rider_name}
                          </span>
                        );
                      }
                      return null;
                    }
                    
                    // Packing statuses - show packer name with "To" prefix
                    if (order.assigned_packer_name && 
                        order.status !== 'On the way' && 
                        order.status !== 'Delivered' && 
                        order.status !== 'Undelivered' &&
                        order.status !== 'Failed' &&
                        order.status !== 'Returned' &&
                        order.status !== 'Cancelled') {
                      // Order Placed + assigned → "To [packer]" (manual assignment while still Placed)
                      if (order.status === 'Placed' && order.assigned_packer_name) {
                        return (
                          <span className="text-xs text-muted-foreground mt-1">
                            To {order.assigned_packer_name}
                          </span>
                        );
                      }
                      
                      // Order In Process (Accepted) + pending/assigned/in_process → "To [packer name]"
                      // Also show for Accepted status even if packing_status is not set (to handle edge cases)
                      if (order.status === 'Accepted' || 
                          (order.status === 'Pending' && 
                           (order.packing_status === 'pending' || order.packing_status === 'assigned' || order.packing_status === 'in_process'))) {
                        return (
                          <span className="text-xs text-muted-foreground mt-1">
                            To {order.assigned_packer_name}
                          </span>
                        );
                      }
                      
                      // Packed → "To [packer name]"
                      if (order.status === 'Packed' || order.packing_status === 'packed') {
                        return (
                          <span className="text-xs text-muted-foreground mt-1">
                            To {order.assigned_packer_name}
                          </span>
                        );
                      }
                      
                      // Default for other packing statuses - use "To"
                      return (
                        <span className="text-xs text-muted-foreground mt-1">
                          To {order.assigned_packer_name}
                        </span>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Name</p>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-foreground">{order.customer_name}</p>
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
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{order.customer_phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm font-semibold text-foreground leading-snug max-w-[400px]">{order.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full lg:w-[450px]">
              <CardHeader>
                <CardTitle>Order Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}, {new Date(order.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Delivery Slot</p>
                    <p className="font-medium text-foreground">{order.delivery_slot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Total Price</p>
                    <p className="font-bold text-lg text-foreground">₹{totalAmount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Payment Type</p>
                    <p className="font-medium text-foreground">{order.payment_mode === 'Online' ? 'Prepaid' : 'COD'}</p>
                  </div>
                </div>
                {order?.packing_status && (
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Packing Status</p>
                      <Badge variant={getPackingStatusVariant(order.packing_status)}>
                        {getPackingStatusIcon(order.packing_status)} {order.packing_status === 'out_of_stock' ? 'ITEMS NO STOCK' : (order.packing_status || '').replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}
                {order.assigned_packer_name && (order.status === 'Packed' || order.packing_status === 'packed' || order.packing_status === 'assigned' || order.packing_status === 'pending') && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Assigned Packer</p>
                      <p className="font-medium text-foreground">{order.assigned_packer_name}</p>
                    </div>
                  </div>
                )}
                {/* Show rider information for delivery statuses */}
                {(order.status === 'On the way' || order.status === 'Delivered' || order.status === 'Undelivered') && (order as any).assigned_rider_name && (
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {order.status === 'On the way' ? 'Assigned Rider' : order.status === 'Delivered' ? 'Delivered by Rider' : 'By Rider'}
                      </p>
                      <p className="font-medium text-foreground">{(order as any).assigned_rider_name}</p>
                      {/* Show undelivered reason if status is Undelivered */}
                      {order.status === 'Undelivered' && (order as any).undelivered_reason && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Undelivered Reason</p>
                          <p className="text-sm font-medium text-red-600">
                            {(() => {
                              const reasonMap: Record<string, string> = {
                                'customer_cancelled': 'Customer Cancelled',
                                'wrong_address': 'Wrong Address',
                                'damaged_item': 'Damaged Item',
                                'payment_issue': 'Payment Issue',
                                'customer_not_available': 'Customer Not Available',
                                'others': 'Others'
                              };
                              return reasonMap[(order as any).undelivered_reason] || (order as any).undelivered_reason;
                            })()}
                          </p>
                          {(order as any).undelivered_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {(order as any).undelivered_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant={getPaymentStatus() === 'Paid' ? 'default' : getPaymentStatus() === 'Failed' ? 'destructive' : 'secondary'}>
                      {getPaymentStatus()}
                    </Badge>
                  </div>
                </div>
                {order.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-foreground">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default OrderDetail;
