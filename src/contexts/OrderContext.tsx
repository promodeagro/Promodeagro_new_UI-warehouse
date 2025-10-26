import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, OrderItem, OrderStatus, PaymentMode, orders as dummyOrders } from '@/data/orderData';
import { packers } from '@/data/packerData';
import { useNotifications } from './NotificationContext';

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  resetOrders: () => void;
  updateOrderStatus: (id: string, status: Order['status'], packingStatus?: Order['packing_status']) => void;
  simulateMobileAppUpdate: (orderId: string, mobileStatus: 'started' | 'completed' | 'out_of_stock') => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orders, setOrders] = useState<Order[]>(dummyOrders);
  const { addNotification } = useNotifications();

  // Utility function to remove duplicates based on order ID
  const removeDuplicates = (ordersList: Order[]): Order[] => {
    const seen = new Set();
    return ordersList.filter(order => {
      if (seen.has(order.id)) {
        return false;
      }
      seen.add(order.id);
      return true;
    });
  };

  // Load orders from localStorage on mount, merge with dummy data
  useEffect(() => {
    const savedOrders = localStorage.getItem('warehouse-orders');
    if (savedOrders) {
      try {
        const parsedOrders = JSON.parse(savedOrders);
        // Create a map to track existing order IDs
        const orderMap = new Map();
        
        // Add dummy orders first
        dummyOrders.forEach(order => {
          orderMap.set(order.id, order);
        });
        
        // Add saved orders (these will override dummy orders if same ID)
        parsedOrders.forEach(order => {
          orderMap.set(order.id, order);
        });
        
        // Convert map back to array and remove any duplicates
        const allOrders = removeDuplicates(Array.from(orderMap.values()));
        setOrders(allOrders);
      } catch (error) {
        console.error('Error loading orders from localStorage:', error);
        // Clear corrupted localStorage and use dummy orders
        localStorage.removeItem('warehouse-orders');
        setOrders(dummyOrders);
      }
    } else {
      // If no saved orders, use dummy orders
      setOrders(dummyOrders);
    }
  }, []);

  // Note: localStorage saving is handled manually in addOrder, updateOrder, and deleteOrder functions

  const addOrder = (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('OrderContext addOrder called with:', orderData);
      const now = new Date().toISOString();
      const orderNumber = `ORD-${Date.now()}`;
      
      // Smart auto-assignment logic - assign to active packer with least pending orders
      const activePackers = packers.filter(packer => packer.active);
      
      if (activePackers.length === 0) {
        console.log('⚠️ No active packers available for auto-assignment');
        // No auto-assignment if no active packers
        const shouldAutoAssign = false;
        const selectedPacker = null;
        
        const enrichedOrderData = {
          ...orderData,
          id: orderId,
          order_number: orderNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          packing_status: 'pending', // No auto-assignment
          assigned_packer_id: undefined,
          assigned_packer_name: undefined,
          status: 'Placed', // Stay as Placed
        };
        
        const newOrder = enrichedOrderData as Order;
        setOrders(prev => [...prev, newOrder]);
        localStorage.setItem('warehouse-orders', JSON.stringify([...orders, newOrder]));
        
        console.log('Created new order without auto-assignment (no active packers):', newOrder);
        return newOrder;
      }
      
      // Count pending orders for each active packer
      const packerWorkloads = activePackers.map(packer => {
        const pendingCount = orders.filter(order => 
          order.assigned_packer_id === packer.id && 
          (order.packing_status === 'pending' || order.packing_status === 'assigned')
        ).length;
        return { ...packer, pendingCount };
      });
      
      // Sort by pending count (ascending) and select packer with least workload
      const sortedPackers = packerWorkloads.sort((a, b) => a.pendingCount - b.pendingCount);
      const selectedPacker = sortedPackers[0];
      
      // Always auto-assign for better workflow (can be made configurable later)
      const shouldAutoAssign = true; // 100% auto-assignment for now
      
      // Ensure all required fields are present
      const enrichedOrderData = {
        ...orderData,
        // Ensure pincode is extracted from address if not provided
        pincode: orderData.pincode || (orderData.address ? orderData.address.split(',').pop()?.trim() : 'N/A'),
        // Ensure zone is set if not provided
        zone: orderData.zone || 'Zone A',
        // Ensure coordinates are set if not provided
        lat: orderData.lat || 28.4595,
        lng: orderData.lng || 77.0266,
      };
      
      const newOrder: Order = {
        ...enrichedOrderData,
        id: `ORD${Date.now()}`,
        order_number: orderNumber,
        created_at: now,
        updated_at: now,
        packing_status: shouldAutoAssign ? 'assigned' : 'pending', // If auto-assigned, set to "assigned", otherwise "pending"
        assigned_packer_id: shouldAutoAssign ? selectedPacker.id : undefined,
        assigned_packer_name: shouldAutoAssign ? selectedPacker.name : undefined,
        // Auto-assign status based on packer assignment
        status: shouldAutoAssign ? 'Accepted' : 'Placed', // If auto-assigned, go to "Accepted", otherwise stay "Placed"
      };
      
      console.log('Created new order with auto-assignment:', newOrder);

      setOrders(prev => {
        // Add new order at the beginning, keep existing orders
        const newOrders = [newOrder, ...prev];
        // Remove duplicates and save only the new orders (excluding dummy data) to localStorage
        const uniqueOrders = removeDuplicates(newOrders);
        const savedOrders = uniqueOrders.filter(order => !dummyOrders.some(dummy => dummy.id === order.id));
        localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));
        
        // Send notification for new order
        addNotification({
          type: 'new_order',
          title: 'New Order Created',
          message: `Order ${orderNumber} has been created and auto-assigned to ${selectedPacker.name}`,
          priority: 'medium',
          orderId: newOrder.id
        });
        
        return uniqueOrders;
      });
      return newOrder;
    } catch (error) {
      console.error('Error in addOrder:', error);
      throw error;
    }
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => {
      const updatedOrders = prev.map(order => 
        order.id === id 
          ? { ...order, ...updates, updated_at: new Date().toISOString() }
          : order
      );
      // Save only the new orders (excluding dummy data) to localStorage
      const savedOrders = updatedOrders.filter(order => !dummyOrders.some(dummy => dummy.id === order.id));
      localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));
      return updatedOrders;
    });
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => {
      const filteredOrders = prev.filter(order => order.id !== id);
      // Save only the new orders (excluding dummy data) to localStorage
      const savedOrders = filteredOrders.filter(order => !dummyOrders.some(dummy => dummy.id === order.id));
      localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));
      return filteredOrders;
    });
  };

  const resetOrders = () => {
    // Clear localStorage and reset to dummy orders only
    localStorage.removeItem('warehouse-orders');
    setOrders(dummyOrders);
  };

  const updateOrderStatus = (id: string, status: Order['status'], packingStatus?: Order['packing_status']) => {
    const updates: Partial<Order> = { status };
    if (packingStatus) {
      updates.packing_status = packingStatus;
    }
    updateOrder(id, updates);
    
    // Show notification for out of stock
    if (status === 'Out of Stock' as OrderStatus) {
      const order = orders.find(o => o.id === id);
      if (order) {
        // This would trigger a notification in the UI
        console.log(`🚨 OUT OF STOCK: Order ${order.order_number} - Product not available in warehouse`);
      }
    }
  };

  // Simulate mobile app order updates (for testing)
  const simulateMobileAppUpdate = (orderId: string, mobileStatus: 'started' | 'completed' | 'out_of_stock') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let newPackingStatus: Order['packing_status'];
    let newOrderStatus: Order['status'];

    switch (mobileStatus) {
      case 'started':
        newPackingStatus = 'pending';
        newOrderStatus = 'Placed'; // Pending
        break;
      case 'completed':
        newPackingStatus = 'packed';
        newOrderStatus = 'Packed';
        break;
      case 'out_of_stock':
        newPackingStatus = 'out_of_stock';
        newOrderStatus = 'Items No Stock';
        break;
      default:
        return;
    }

    updateOrderStatus(orderId, newOrderStatus, newPackingStatus);
    console.log(`📱 Mobile App Update: Order ${order.order_number} - ${mobileStatus} → ${newPackingStatus}`);
    
    // Send notification for mobile app updates
    let notificationTitle = '';
    let notificationMessage = '';
    
    switch (mobileStatus) {
      case 'started':
        notificationTitle = 'Order Started';
        notificationMessage = `Order ${order.order_number} has been started by ${order.assigned_packer_name || 'packer'}`;
        break;
      case 'completed':
        notificationTitle = 'Order Completed';
        notificationMessage = `Order ${order.order_number} has been completed by ${order.assigned_packer_name || 'packer'}`;
        break;
      case 'out_of_stock':
        notificationTitle = 'Items No Stock';
        notificationMessage = `Order ${order.order_number} - Some items are out of stock. Please check and adjust.`;
        break;
    }
    
    addNotification({
      type: 'order_update',
      title: notificationTitle,
      message: notificationMessage,
      priority: mobileStatus === 'out_of_stock' ? 'high' : 'medium',
      orderId: orderId
    });
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrder, deleteOrder, resetOrders, updateOrderStatus, simulateMobileAppUpdate }}>
      {children}
    </OrderContext.Provider>
  );
};
