import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  // Load orders from localStorage on mount and listen for updates
  const loadOrders = useCallback(() => {
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

  useEffect(() => {
    // Load orders on mount
    loadOrders();

    // Listen for localStorage changes (when CloseRunsheet or other components update orders)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'warehouse-orders') {
        loadOrders();
      }
    };

    // Listen for custom events (when same-tab components update orders)
    const handleOrderUpdate = () => {
      loadOrders();
    };

    const handleCustomerCancellation = (event: Event) => {
      if (!('detail' in event)) return;
      const detail = (event as CustomEvent).detail || {};
      const orderId: string | undefined = detail.orderId || detail.order_id || detail.id;
      if (!orderId) return;

      let notificationPayload: { orderNumber: string; reason?: string } | null = null;

      setOrders(prev => {
        let changed = false;
        let orderNumber = '';

        const updatedOrders = prev.map(order => {
          if (order.id === orderId) {
            changed = true;
            orderNumber = order.order_number;
            return {
              ...order,
              status: 'Returned',
              cancellation_requested: true,
              cancellation_reason: detail.reason || order.cancellation_reason,
              cancellation_requested_at: detail.requestedAt || detail.requested_at || new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
          return order;
        });

        if (changed) {
          notificationPayload = {
            orderNumber,
            reason: detail.reason
          };

          const savedOrders = updatedOrders.filter(order => {
            const isDummyOrder = dummyOrders.some(dummy => dummy.id === order.id);
            if (isDummyOrder) {
              return order.updated_at !== order.created_at;
            }
            return true;
          });
          localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));

          window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
            detail: {
              orderIds: [orderId],
              orderId,
              status: 'Returned',
              reason: detail.reason
            }
          }));
        }

        return updatedOrders;
      });

      if (notificationPayload) {
        const message = notificationPayload.reason
          ? `Customer requested cancellation for order ${notificationPayload.orderNumber} - ${notificationPayload.reason}`
          : `Customer requested cancellation for order ${notificationPayload.orderNumber}`;

        addNotification({
          type: 'order_update',
          title: 'Cancellation Requested',
          message,
          priority: 'high',
          orderId
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('orderStatusUpdated', handleOrderUpdate);
    window.addEventListener('riderOrderCompleted', handleOrderUpdate);
    window.addEventListener('orderCancellationRequested', handleCustomerCancellation);

    // Poll for updates (fallback - will be replaced with real-time sync via API)
    // TODO: Remove polling when API real-time sync is implemented
    const pollInterval = setInterval(() => {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        loadOrders();
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
      window.removeEventListener('riderOrderCompleted', handleOrderUpdate);
      window.removeEventListener('orderCancellationRequested', handleCustomerCancellation);
      clearInterval(pollInterval);
    };
  }, [loadOrders, addNotification]);

  // Note: localStorage saving is handled manually in addOrder, updateOrder, and deleteOrder functions

  const addOrder = (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    try {
      console.log('OrderContext addOrder called with:', orderData);
      const now = new Date().toISOString();
      const orderNumber = `ORD-${Date.now()}`;
      
      // Check auto-assign toggle from localStorage
      const savedAutoAssign = localStorage.getItem('packerAutoAssign');
      const shouldAutoAssign = savedAutoAssign !== null ? savedAutoAssign === 'true' : true; // Default to true if not set
      
      // Get selected packers for auto-assignment from localStorage
      let selectedPackerIds: Set<string> = new Set();
      if (shouldAutoAssign) {
        try {
          const saved = localStorage.getItem('selectedPackersForAutoAssign');
          if (saved) {
            selectedPackerIds = new Set(JSON.parse(saved));
          }
        } catch (error) {
          console.error('Error loading selected packers:', error);
        }
      }
      
      // Get all packers (static + saved from localStorage)
      let allPackersList: any[] = [];
      try {
        const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
        const savedIds = new Set(savedPackers.map((p: any) => p.id));
        const staticPackers = packers.filter(p => !savedIds.has(p.id));
        allPackersList = [...savedPackers, ...staticPackers];
      } catch (error) {
        console.error('Error loading packers:', error);
        allPackersList = packers;
      }
      
      // Filter to active packers, and if auto-assign is ON, only use selected packers
      let eligiblePackers = allPackersList.filter(packer => packer.active);
      if (shouldAutoAssign && selectedPackerIds.size > 0) {
        // Only use selected packers for auto-assignment
        eligiblePackers = eligiblePackers.filter((p: any) => selectedPackerIds.has(p.id));
      }
      
      // Sort eligible packers by ID for consistent ordering in round-robin
      eligiblePackers.sort((a: any, b: any) => (a.id || '').localeCompare(b.id || ''));
      
      if (eligiblePackers.length === 0) {
        console.log('⚠️ No eligible packers available for auto-assignment');
        // No auto-assignment if no eligible packers
        const enrichedOrderData = {
          ...orderData,
          pincode: orderData.pincode || (orderData.address ? orderData.address.split(',').pop()?.trim() : 'N/A'),
          zone: orderData.zone || 'Zone A',
          lat: orderData.lat || 28.4595,
          lng: orderData.lng || 77.0266,
        };
        
        const newOrder: Order = {
          ...enrichedOrderData,
          id: `ORD${Date.now()}`,
          order_number: orderNumber,
          created_at: now,
          updated_at: now,
          packing_status: 'pending',
          assigned_packer_id: undefined,
          assigned_packer_name: undefined,
          status: 'Placed',
        };
        
        setOrders(prev => {
          const newOrders = [newOrder, ...prev];
          const uniqueOrders = removeDuplicates(newOrders);
          const savedOrders = uniqueOrders.filter(order => !dummyOrders.some(dummy => dummy.id === order.id));
          localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));
          return uniqueOrders;
        });
        
        console.log('Created new order without auto-assignment (no eligible packers):', newOrder);
        return newOrder;
      }
      
      // Round-robin distribution: Get the last assigned packer ID from localStorage
      let lastPackerId = '';
      try {
        const savedId = localStorage.getItem('lastPackerId');
        if (savedId !== null) {
          lastPackerId = savedId;
        }
      } catch (error) {
        console.error('Error loading last packer ID:', error);
      }
      
      // Find the index of the last assigned packer, or start from 0
      let lastPackerIndex = 0;
      if (lastPackerId) {
        const foundIndex = eligiblePackers.findIndex((p: any) => p.id === lastPackerId);
        if (foundIndex >= 0) {
          lastPackerIndex = foundIndex;
        }
      }
      
      // Get next packer in round-robin fashion
      const nextPackerIndex = (lastPackerIndex + 1) % eligiblePackers.length;
      const selectedPacker = eligiblePackers[nextPackerIndex];
      
      // Save the next packer ID for round-robin
      localStorage.setItem('lastPackerId', selectedPacker.id);
      
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
      
      // Save ALL updated orders to localStorage (including dummy data that has been modified)
      // This ensures that when we update a dummy order, it gets saved and persists
      const savedOrders = updatedOrders.map(order => {
        // If this order was originally from dummy data but has been modified, save it
        const isDummyOrder = dummyOrders.some(dummy => dummy.id === order.id);
        if (isDummyOrder) {
          // Mark this as a modified dummy order so it gets saved
          return order;
        }
        return order;
      }).filter(order => {
        // Only save orders that are either new or modified dummy orders
        const isDummyOrder = dummyOrders.some(dummy => dummy.id === order.id);
        // If it's a dummy order, check if it has been modified (has updated_at different from created_at)
        if (isDummyOrder) {
          return order.updated_at !== order.created_at;
        }
        // Save all non-dummy orders
        return true;
      });
      
      localStorage.setItem('warehouse-orders', JSON.stringify(savedOrders));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
        detail: { orderId: id, updates }
      }));
      
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
    const updates: Partial<Order> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (typeof packingStatus !== 'undefined') {
      updates.packing_status = packingStatus;
    }

    if (status === 'Cancelled' || status === 'Returned' || status === 'Failed') {
      updates.packing_status = 'cancelled';
      updates.assigned_packer_id = undefined;
      updates.assigned_packer_name = undefined;
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
