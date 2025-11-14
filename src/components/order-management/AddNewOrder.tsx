import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '@/contexts/OrderContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProducts } from '@/contexts/ProductContext';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  X, 
  IndianRupee, 
  Package, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Clock,
  ShoppingCart,
  Trash2,
  CreditCard
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  quantity: number;
  total: number;
}

interface CustomerInfo {
  phone: string;
  name: string;
  flatNo: string;
  area: string;
  landmark: string;
  pincode: string;
  setAsDefault: boolean;
}

const AddNewOrder = () => {
  const navigate = useNavigate();
  const { addOrder, orders } = useOrders();
  const { products } = useProducts();
  
  // Debug: Check if useOrders is working
  console.log('useOrders hook result:', { addOrder: typeof addOrder, ordersCount: orders?.length });
  
  // Customer Information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    phone: '',
    name: '',
    flatNo: '',
    area: '',
    landmark: '',
    pincode: '',
    setAsDefault: true // Set as default by default
  });

  // Customer lookup states
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [customerLookupMessage, setCustomerLookupMessage] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  
  // Order creation states
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderCreationError, setOrderCreationError] = useState('');
  
  // Payment confirmation states
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);
  const [pendingPaymentMode, setPendingPaymentMode] = useState<'Online' | 'COD'>('COD');
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  const [customerAddresses, setCustomerAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    phone: '',
    name: '',
    flatNo: '',
    area: '',
    landmark: '',
    pincode: ''
  });

  // Order Items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Order Details
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(() => {
    // Initialize with today's date immediately
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [deliveryTime, setDeliveryTime] = useState('');
  const [paymentMode, setPaymentMode] = useState<'Online' | 'COD'>('COD');

  // Set today's date when component mounts
  useEffect(() => {
    const today = new Date();
    console.log('Raw date object:', today);
    console.log('Timezone offset:', today.getTimezoneOffset());
    
    // Use local date instead of UTC to avoid timezone issues
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    console.log('Setting delivery date to:', todayString);
    console.log('Current date object:', today);
    console.log('Local date string:', today.toLocaleDateString());
    console.log('ISO string:', today.toISOString());
    console.log('Date parts:', { year, month, day });
    
    setDeliveryDate(todayString);
  }, []);

  // Ensure date is always correct (fallback)
  useEffect(() => {
    if (!deliveryDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      setDeliveryDate(todayString);
      console.log('Fallback: Setting delivery date to:', todayString);
    }
  }, [deliveryDate]);

  // Pricing
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Get categories from products
  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filtered products for add items dialog
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate totals
  React.useEffect(() => {
    const newSubtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const newGrandTotal = newSubtotal - discountAmount + shippingCharges;
    
    setSubtotal(newSubtotal);
    setGrandTotal(newGrandTotal);
  }, [orderItems, discountAmount, shippingCharges]);

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

  // Real-time inventory sync - Update products when inventory changes
  React.useEffect(() => {
    console.log('Inventory sync: Products updated', products.length);
    // The products are already coming from the ProductContext which syncs with inventory
    // This ensures all changes from inventory module are reflected here
  }, [products]);

  // Customer lookup function
  const lookupCustomer = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setCustomerLookupMessage('');
      setIsNewCustomer(false);
      return;
    }

    setIsLookingUpCustomer(true);
    setCustomerLookupMessage('');

    try {
      // TODO: Replace with real API when backend is ready
      // For now, using mock data for development
      
      // 🔄 MOCK MODE - Remove this when API is ready
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockCustomers = [
        {
          id: 'C001',
          phone: '7097797410',
          name: 'John Doe',
          flatNo: '123',
          area: 'Downtown',
          landmark: 'Near Mall',
          pincode: '500001',
          addresses: [
            { id: 'A001', flatNo: '123', area: 'Downtown', landmark: 'Near Mall', pincode: '500001' },
            { id: 'A002', flatNo: '456', area: 'Uptown', landmark: 'Near Park', pincode: '500002' }
          ]
        },
        {
          id: 'C002',
          phone: '9876543210',
          name: 'Jane Smith',
          flatNo: '789',
          area: 'Suburb',
          landmark: 'Near School',
          pincode: '500003',
          addresses: [
            { id: 'A003', flatNo: '789', area: 'Suburb', landmark: 'Near School', pincode: '500003' }
          ]
        },
        {
          id: 'C003',
          phone: '9999999999',
          name: 'Test Customer',
          flatNo: '25',
          area: 'gg',
          landmark: 'grw',
          pincode: '500086',
          addresses: [
            { id: 'A004', flatNo: '25', area: 'gg', landmark: 'grw', pincode: '500086' }
          ]
        },
        {
          id: 'C004',
          phone: '1234567890',
          name: 'Demo Customer',
          flatNo: '100',
          area: 'Demo Area',
          landmark: 'Demo Landmark',
          pincode: '123456',
          addresses: [
            { id: 'A005', flatNo: '100', area: 'Demo Area', landmark: 'Demo Landmark', pincode: '123456' }
          ]
        }
      ];
      
      const customerData = mockCustomers.find(customer => customer.phone === phoneNumber);
      
      // 🚀 REAL API MODE - Uncomment when backend is ready
      /*
      const response = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(phoneNumber)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Add auth if needed
        }
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const customerData = await response.json();
      */
      
      if (customerData) {
        // Customer found - auto-fill all details
        setCustomerInfo({
          phone: customerData.phone,
          name: customerData.name,
          flatNo: customerData.flatNo || '',
          area: customerData.area || '',
          landmark: customerData.landmark || '',
          pincode: customerData.pincode || '',
          setAsDefault: true // Set as default by default
        });
        setCustomerId(customerData.id);
        setIsNewCustomer(false);
        setCustomerLookupMessage('✅ Customer found! Details loaded from database.');
        
        // Fetch customer addresses
        if (customerData.addresses) {
          setCustomerAddresses(customerData.addresses);
          // Set the first address as selected if available
          if (customerData.addresses.length > 0) {
            setSelectedAddressId(customerData.addresses[0].id);
          }
        }
      } else {
        // Customer not found
        setIsNewCustomer(true);
        setCustomerLookupMessage('❌ New customer - Enter details manually');
        setCustomerId(null);
      }
    } catch (error) {
      // Enhanced error handling for both mock and real API
      console.error('Customer lookup error:', error);
      setIsNewCustomer(true);
      setCustomerId(null);
      
      // Different error messages based on error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error (no internet, server down)
        setCustomerLookupMessage('❌ Network error. Please check your connection.');
      } else if (error.message.includes('API Error')) {
        // API error (404, 500, etc.)
        setCustomerLookupMessage('❌ Server error. Please try again later.');
      } else {
        // Other errors (JSON parsing, etc.)
        setCustomerLookupMessage('❌ Unable to connect - Enter details manually');
      }
    } finally {
      setIsLookingUpCustomer(false);
    }
  };

  // Debounced phone number lookup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (customerInfo.phone && customerInfo.phone.length >= 10) {
        lookupCustomer(customerInfo.phone);
      } else {
        setCustomerLookupMessage('');
        setIsNewCustomer(false);
        setCustomerId(null);
      }
    }, 1000); // 1 second delay

    return () => clearTimeout(timeoutId);
  }, [customerInfo.phone]);

  // Update customer data when fields are edited (for existing customers)
  const updateCustomerData = async (updatedData: Partial<CustomerInfo>) => {
    if (!customerId) return;

    try {
      await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  // Handle customer info changes with auto-update
  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string | boolean) => {
    const updatedInfo = { ...customerInfo, [field]: value };
    setCustomerInfo(updatedInfo);
    
    // Auto-update database for existing customers
    if (customerId && field !== 'phone') {
      updateCustomerData({ [field]: value });
    }
  };

  // Handle adding new address
  const handleAddNewAddress = () => {
    // Validate all fields are filled
    if (!newAddress.phone || !newAddress.name || !newAddress.flatNo || !newAddress.area || !newAddress.landmark || !newAddress.pincode) {
      alert('Please fill in all address fields');
      return;
    }

    // Add the new address to the list with a unique ID
    const addressWithId = {
      id: `addr_${Date.now()}`,
      ...newAddress
    };
    
    // Add to customerAddresses list
    setCustomerAddresses([...customerAddresses, addressWithId]);
    
    // Also update the current customer info with the new address (set as current address)
    setCustomerInfo({
      ...customerInfo,
      phone: newAddress.phone,
      name: newAddress.name,
      flatNo: newAddress.flatNo,
      area: newAddress.area,
      landmark: newAddress.landmark,
      pincode: newAddress.pincode
    });
    
    // Reset form
    setNewAddress({
      phone: '',
      name: '',
      flatNo: '',
      area: '',
      landmark: '',
      pincode: ''
    });
    
    setShowAddAddressDialog(false);
    console.log('Address added successfully');
  };

  const handleAddItem = (productId: string, quantity: number) => {
    if (quantity <= 0) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    console.log('Adding item:', product.name, 'Quantity:', quantity);

    const existingItemIndex = orderItems.findIndex(item => item.id === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * product.price;
      setOrderItems(updatedItems);
      console.log('Updated existing item:', updatedItems[existingItemIndex]);
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: productId,
        name: product.name,
        category: product.category,
        unit: product.unit,
        price: product.price,
        quantity,
        total: quantity * product.price
      };
      setOrderItems([...orderItems, newItem]);
      console.log('Added new item:', newItem);
    }
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    // Allow 0 or empty values - don't auto-fill to 1
    const updatedItems = orderItems.map(item => 
      item.id === productId 
        ? { ...item, quantity, total: quantity * item.price }
        : item
    );
    setOrderItems(updatedItems);
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

  const handleAddSelectedItems = () => {
    const selectedCount = Object.keys(selectedProducts).length;
    console.log('Adding selected items:', selectedProducts);
    console.log('Current orderItems before adding:', orderItems);
    console.log('Available products:', products.length);
    
    // Add all selected items to the order at once
    const updatedItems = [...orderItems];
    
    Object.entries(selectedProducts).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        const product = products.find(p => p.id === productId);
        console.log(`Processing product ${productId}:`, product);
        
        if (product) {
          const existingItemIndex = updatedItems.findIndex(item => item.id === productId);
          
          if (existingItemIndex >= 0) {
            // Update existing item
            updatedItems[existingItemIndex].quantity += quantity;
            updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * product.price;
            console.log('Updated existing item:', updatedItems[existingItemIndex]);
          } else {
            // Add new item
            const newItem: OrderItem = {
              id: productId,
              name: product.name,
              category: product.category,
              unit: product.unit,
              price: product.price,
              quantity,
              total: quantity * product.price
            };
            updatedItems.push(newItem);
            console.log('Added new item:', newItem);
          }
        } else {
          console.error('Product not found for ID:', productId);
        }
      }
    });
    
    console.log('Final updatedItems:', updatedItems);
    
    // Update state with all items at once
    setOrderItems(updatedItems);
    
    // Clear selections and close dialog
    setSelectedProducts({});
    setShowAddItemDialog(false);
    console.log(`Added ${selectedCount} items to order`);
  };

  const handlePaymentModeChange = (value: 'Online' | 'COD') => {
    if (value === 'Online') {
      // Show confirmation dialog for online payment
      setPendingPaymentMode('Online');
      setShowPaymentConfirmDialog(true);
    } else {
      // Directly set to COD
      setPaymentMode('COD');
    }
  };

  const handlePaymentConfirm = (hasPaid: boolean) => {
    if (hasPaid) {
      // Customer has paid, proceed with online payment
      setPaymentMode('Online');
    } else {
      // Customer hasn't paid, switch to COD
      setPaymentMode('COD');
    }
    setShowPaymentConfirmDialog(false);
  };

  const handleCreateOrder = async () => {
    setIsCreatingOrder(true);
    setOrderCreationError('');
    
    // Validate required fields
    if (!customerInfo.phone || !customerInfo.name || !customerInfo.flatNo || !customerInfo.area || !customerInfo.landmark || !customerInfo.pincode) {
      setOrderCreationError('Please fill in all required customer information fields.');
      setIsCreatingOrder(false);
      return;
    }
    
    if (orderItems.length === 0) {
      setOrderCreationError('Please add at least one item to the order.');
      setIsCreatingOrder(false);
      return;
    }
    
    try {
      console.log('Starting order creation...');
      console.log('Customer Info:', customerInfo);
      console.log('Order Items:', orderItems);
      console.log('Discount:', discountAmount);
      console.log('Shipping Charges:', shippingCharges);
      console.log('Payment Mode:', paymentMode);
      console.log('Delivery Time:', deliveryTime);
      
      // Test if addOrder function exists
      console.log('addOrder function:', typeof addOrder);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create order items in the required format
      const orderItemsFormatted = orderItems.map((item, index) => ({
        id: `OI${Date.now()}-${index}`,
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.total,
        is_substituted: false
      }));

      console.log('Creating order with data:', {
        customer_id: customerId || `C${Date.now()}`,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        address: `${customerInfo.flatNo}, ${customerInfo.area}, ${customerInfo.landmark}, ${customerInfo.pincode}`,
        lat: 28.4595,
        lng: 77.0266,
        zone: 'Zone A',
        total_amount: grandTotal,
        payment_mode: paymentMode as 'COD' | 'Online',
        status: 'Placed' as const,
        items: orderItemsFormatted,
        delivery_slot: deliveryTime || '11:00 AM - 1:00 PM',
        notes: orderNotes,
        discount: discountAmount,
        shipping_charges: shippingCharges
      });

      // Create the order using OrderContext
      const orderData = {
        customer_id: customerId || `C${Date.now()}`,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        address: `${customerInfo.flatNo}, ${customerInfo.area}, ${customerInfo.landmark}, ${customerInfo.pincode}`,
        lat: 28.4595, // Default coordinates (can be enhanced later)
        lng: 77.0266,
        zone: 'Zone A', // Default zone (can be enhanced later)
        total_amount: grandTotal,
        payment_mode: paymentMode as 'COD' | 'Online',
        status: 'Placed' as const,
        items: orderItemsFormatted,
        delivery_slot: deliveryTime || '11:00 AM - 1:00 PM',
        notes: orderNotes,
        discount: discountAmount || 0,
        shipping_charges: shippingCharges || 0,
        pincode: customerInfo.pincode
      };
      
      console.log('Final order data being sent to addOrder:', orderData);
      
      // Test the addOrder function call
      let newOrder;
      try {
        console.log('Calling addOrder function...');
        newOrder = addOrder(orderData);
        console.log('addOrder returned:', newOrder);
      } catch (addOrderError) {
        console.error('Error in addOrder call:', addOrderError);
        throw addOrderError;
      }
      
      console.log('Order created successfully:', newOrder);
      
      // Show success message
      alert(`Order created successfully! Order ID: ${newOrder.order_number}`);
      
      // Navigate to main orders list screen
      navigate('/order-management/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      });
      setOrderCreationError('Failed to create order. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Debug: Log current delivery date
  console.log('Current deliveryDate state:', deliveryDate);
  console.log('Current date for comparison:', new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/order-management/orders')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Order</h1>
          <p className="text-muted-foreground">Create a new customer order</p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info & Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                  {customerId && (
                    <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Existing Customer
                    </span>
                  )}
                  {isNewCustomer && (
                    <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      New Customer
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddAddressDialog(true)}
                  className="text-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <div className="relative">
                    <Input
                      id="customerPhone"
                      value={customerInfo.phone}
                      onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      className="pr-10"
                    />
                    {isLookingUpCustomer && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>
                  {customerLookupMessage && (
                    <div className={`text-sm p-2 rounded-md ${
                      customerLookupMessage.includes('✅') 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {customerLookupMessage}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={customerInfo.name}
                    onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flatNo">Flat No./ House No./ Building No *</Label>
                  <Input
                    id="flatNo"
                    value={customerInfo.flatNo}
                    onChange={(e) => handleCustomerInfoChange('flatNo', e.target.value)}
                    placeholder="Enter flat/house/building number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area/Locality *</Label>
                  <Input
                    id="area"
                    value={customerInfo.area}
                    onChange={(e) => handleCustomerInfoChange('area', e.target.value)}
                    placeholder="Enter area or locality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark *</Label>
                  <Input
                    id="landmark"
                    value={customerInfo.landmark}
                    onChange={(e) => handleCustomerInfoChange('landmark', e.target.value)}
                    placeholder="Enter landmark"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={customerInfo.pincode}
                    onChange={(e) => handleCustomerInfoChange('pincode', e.target.value)}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="setAsDefault"
                  checked={customerInfo.setAsDefault}
                  onCheckedChange={(checked) => handleCustomerInfoChange('setAsDefault', checked as boolean)}
                />
                <Label htmlFor="setAsDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Set this address as default
                </Label>
              </div>

              {/* Existing Addresses */}
              {customerAddresses.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Existing Addresses</h4>
                  <div className="space-y-2">
                    {customerAddresses.map((address, index) => (
                      <div key={address.id || index} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{address.name}</p>
                            <p className="text-xs text-muted-foreground">{address.phone}</p>
                            <p className="text-sm mt-1">
                              {address.flatNo}, {address.area}, {address.landmark} - {address.pincode}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCustomerInfo({
                                  ...customerInfo,
                                  name: address.name,
                                  phone: address.phone,
                                  flatNo: address.flatNo,
                                  area: address.area,
                                  landmark: address.landmark,
                                  pincode: address.pincode
                                });
                              }}
                              className="text-xs"
                            >
                              Use
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement delete address
                                console.log('Delete address:', address.id);
                              }}
                              className="text-xs text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items {orderItems.length}
                  </div>
                <Dialog open={showAddItemDialog} onOpenChange={(open) => { setShowAddItemDialog(open); if (!open) { setSelectedProducts({}); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
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
                              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
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
                                <TableHead className="w-20 sm:w-32">Quantity</TableHead>
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
                          onClick={handleAddSelectedItems} 
                          disabled={Object.keys(selectedProducts).length === 0}
                          className="w-full sm:w-auto"
                        >
                          Done ({Object.keys(selectedProducts).length} items selected)
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items added yet. Click "Add Items" to start building your order.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="hidden sm:table-cell">Category</TableHead>
                          <TableHead className="hidden sm:table-cell">Unit</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{item.category}</TableCell>
                            <TableCell className="hidden sm:table-cell">{item.unit}</TableCell>
                            <TableCell className="text-right">₹{item.price}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const quantity = value === '' ? 0 : parseInt(value) || 0;
                                  handleUpdateQuantity(item.id, quantity);
                                }}
                                className="w-[60px] text-left [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary transition-colors bg-primary/10 border-primary/60 ring-1 ring-primary/30"
                                placeholder="0"
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{item.total}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Add any special instructions or notes for this order..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary & Delivery */}
        <div className="space-y-6">
          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={(() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Delivery Time *</Label>
                <Select value={deliveryTime} onValueChange={setDeliveryTime}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12:00 PM - 3:00 PM)</SelectItem>
                    <SelectItem value="evening">Evening (3:00 PM - 6:00 PM)</SelectItem>
                    <SelectItem value="anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode *</Label>
                <Select value={paymentMode} onValueChange={handlePaymentModeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="Online">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      className="w-[60px] text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={shippingCharges || ''}
                      onChange={(e) => setShippingCharges(parseFloat(e.target.value) || 0)}
                      className="w-[60px] text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Grand Total</span>
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      {grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                {orderCreationError && (
                  <div className="text-sm text-red-600 bg-red-100 p-2 rounded-md border border-red-200">
                    {orderCreationError}
                  </div>
                )}
                <Button 
                  onClick={handleCreateOrder}
                  className="w-full"
                  disabled={!customerInfo.phone || !customerInfo.name || !customerInfo.flatNo || !customerInfo.area || !customerInfo.landmark || !customerInfo.pincode || orderItems.length === 0 || isCreatingOrder}
                >
                  {isCreatingOrder ? 'Creating Order...' : 'Create Order'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/order-management/orders')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Address Dialog */}
      <Dialog open={showAddAddressDialog} onOpenChange={setShowAddAddressDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPhone">Phone Number *</Label>
                <Input
                  id="newPhone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newName">Customer Name *</Label>
                <Input
                  id="newName"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress({...newAddress, name: e.target.value})}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newFlatNo">Flat No./ House No./ Building No *</Label>
                <Input
                  id="newFlatNo"
                  value={newAddress.flatNo}
                  onChange={(e) => setNewAddress({...newAddress, flatNo: e.target.value})}
                  placeholder="Enter flat/house/building number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newArea">Area/Locality *</Label>
                <Input
                  id="newArea"
                  value={newAddress.area}
                  onChange={(e) => setNewAddress({...newAddress, area: e.target.value})}
                  placeholder="Enter area or locality"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newLandmark">Landmark *</Label>
                <Input
                  id="newLandmark"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})}
                  placeholder="Enter landmark"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPincode">Pincode *</Label>
                <Input
                  id="newPincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})}
                  placeholder="Enter pincode"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddAddressDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddNewAddress}
                disabled={!newAddress.phone || !newAddress.name || !newAddress.flatNo || !newAddress.area || !newAddress.landmark || !newAddress.pincode}
              >
                Add Address
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentConfirmDialog} onOpenChange={setShowPaymentConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Online Payment Confirmation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You are selecting <strong>Online Payment</strong> option.
              </p>
              <p className="text-sm font-medium mb-4">
                Has the customer already paid through the online app?
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => handlePaymentConfirm(false)}
                className="flex-1"
              >
                No, Switch to COD
              </Button>
              <Button
                onClick={() => handlePaymentConfirm(true)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Yes, Proceed
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewOrder;