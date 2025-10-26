import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Package,
  Search,
  User,
  Target,
  MapPin,
  Phone,
  Eye,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Users,
  Award,
  Zap,
  MoreVertical,
  Grid3X3,
  UserPlus,
  Ban,
  Smartphone,
  AlertTriangle,
  PackagePlus,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import { packers } from "@/data/packerData";
import { useOrders } from "@/contexts/OrderContext";

type FilterTab = 'all' | 'assigned' | 'pending' | 'packed' | 'items-Out-of-stock';

export default function PackerOverview() {
  const navigate = useNavigate();
  const { orders, updateOrder, addOrder, updateOrderStatus, simulateMobileAppUpdate } = useOrders();
  const [activePackerId, setActivePackerId] = useState<string>(packers[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [autoAssign, setAutoAssign] = useState<boolean>(true);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packerFilter, setPackerFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const cardsPerPage = 12;
  
  // Packer search and active/inactive filter states
  const [packerSearchQuery, setPackerSearchQuery] = useState<string>('');
  const [packerActiveFilter, setPackerActiveFilter] = useState<string>('active');
  
  // Packer state management
  const [packerStates, setPackerStates] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    packers.forEach(packer => {
      initialState[packer.id] = packer.active;
    });
    return initialState;
  });
  
  // Pagination for orders table
  const [ordersCurrentPage, setOrdersCurrentPage] = useState<number>(1);
  const ordersPerPage = 10;
  
  // Selection and assignment states
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showAssignDialog, setShowAssignDialog] = useState<boolean>(false);
  const [selectedPacker, setSelectedPacker] = useState<string>('');
  
  // Reassignment states
  const [showReassignDialog, setShowReassignDialog] = useState<boolean>(false);
  const [orderToReassign, setOrderToReassign] = useState<string>('');
  const [reassignPacker, setReassignPacker] = useState<string>('');
  
  // Manual status change states
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPackingStatus, setNewPackingStatus] = useState<string>('');

  const activePacker = useMemo(() => packers.find(p => p.id === activePackerId) || packers[0], [activePackerId]);

  // Reset packer filter when search query changes
  useEffect(() => {
    if (searchQuery) {
      setPackerFilter('all');
    }
  }, [searchQuery]);

  // Sound alert function for Items No Stock
  const playOutOfStockAlert = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Could not play sound alert:', error);
    }
  };


  // Mock orders data for testing - 20 orders
  const mockOrders = [
    {
      id: 'ORD-20251010-0001',
      order_number: 'ORD-20251010-0001',
      customer: { name: 'Rajesh Kumar', phone: '+91 98765 43210' },
      items: [{}, {}, {}, {}], // 4 items
      pincode: '110001',
      assigned_packer_id: 'PKR-001',
      assigned_packer_name: 'Ravi Kumar',
      packing_status: 'packed',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0002',
      order_number: 'ORD-20251010-0002',
      customer: { name: 'Priya Sharma', phone: '+91 98765 43211' },
      items: [{}, {}, {}], // 3 items
      pincode: '110016',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'in_process',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0003',
      order_number: 'ORD-20251010-0003',
      customer: { name: 'Amit Patel', phone: '+91 98765 43212' },
      items: [{}, {}], // 2 items
      pincode: '110075',
      assigned_packer_id: 'PKR-003',
      assigned_packer_name: 'Amit Verma',
      packing_status: 'out_of_stock',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0004',
      order_number: 'ORD-20251010-0004',
      customer: { name: 'Sneha Reddy', phone: '+91 98765 43213' },
      items: [{}, {}, {}], // 3 items
      pincode: '110016',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'pending',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0005',
      order_number: 'ORD-20251010-0005',
      customer: { name: 'Vikram Singh', phone: '+91 98765 43214' },
      items: [{}, {}, {}], // 3 items
      pincode: '110001',
      assigned_packer_id: 'PKR-005',
      assigned_packer_name: 'Rajesh Patel',
      packing_status: 'pending',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0006',
      order_number: 'ORD-20251010-0006',
      customer: { name: 'Anita Desai', phone: '+91 98765 43215' },
      items: [{}, {}, {}, {}, {}], // 5 items
      pincode: '110024',
      assigned_packer_id: 'PKR-002',
      assigned_packer_name: 'Priya Sharma',
      packing_status: 'packed',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0007',
      order_number: 'ORD-20251010-0007',
      customer: { name: 'Rohit Gupta', phone: '+91 98765 43216' },
      items: [{}, {}], // 2 items
      pincode: '110005',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'pending',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0008',
      order_number: 'ORD-20251010-0008',
      customer: { name: 'Meera Joshi', phone: '+91 98765 43217' },
      items: [{}, {}, {}], // 3 items
      pincode: '110017',
      assigned_packer_id: 'PKR-004',
      assigned_packer_name: 'Sneha Gupta',
      packing_status: 'in_process',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0009',
      order_number: 'ORD-20251010-0009',
      customer: { name: 'Karan Malhotra', phone: '+91 98765 43218' },
      items: [{}, {}, {}, {}], // 4 items
      pincode: '110034',
      assigned_packer_id: 'PKR-001',
      assigned_packer_name: 'Ravi Kumar',
      packing_status: 'packed',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0010',
      order_number: 'ORD-20251010-0010',
      customer: { name: 'Pooja Agarwal', phone: '+91 98765 43219' },
      items: [{}, {}], // 2 items
      pincode: '110048',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'out_of_stock',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0011',
      order_number: 'ORD-20251010-0011',
      customer: { name: 'Arjun Singh', phone: '+91 98765 43220' },
      items: [{}, {}, {}, {}, {}], // 5 items
      pincode: '110058',
      assigned_packer_id: 'PKR-005',
      assigned_packer_name: 'Rajesh Patel',
      packing_status: 'in_process',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0012',
      order_number: 'ORD-20251010-0012',
      customer: { name: 'Deepika Nair', phone: '+91 98765 43221' },
      items: [{}, {}, {}], // 3 items
      pincode: '110001',
      assigned_packer_id: 'PKR-003',
      assigned_packer_name: 'Amit Verma',
      packing_status: 'pending',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0013',
      order_number: 'ORD-20251010-0013',
      customer: { name: 'Suresh Kumar', phone: '+91 98765 43222' },
      items: [{}, {}], // 2 items
      pincode: '110016',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'packed',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0014',
      order_number: 'ORD-20251010-0014',
      customer: { name: 'Neha Sharma', phone: '+91 98765 43223' },
      items: [{}, {}, {}, {}], // 4 items
      pincode: '110075',
      assigned_packer_id: 'PKR-002',
      assigned_packer_name: 'Priya Sharma',
      packing_status: 'out_of_stock',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0015',
      order_number: 'ORD-20251010-0015',
      customer: { name: 'Manoj Tiwari', phone: '+91 98765 43224' },
      items: [{}, {}, {}], // 3 items
      pincode: '110024',
      assigned_packer_id: 'PKR-004',
      assigned_packer_name: 'Sneha Gupta',
      packing_status: 'in_process',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0016',
      order_number: 'ORD-20251010-0016',
      customer: { name: 'Sunita Reddy', phone: '+91 98765 43225' },
      items: [{}, {}], // 2 items
      pincode: '110005',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'pending',
      sync_status: 'not_synced'
    },
    {
      id: 'ORD-20251010-0017',
      order_number: 'ORD-20251010-0017',
      customer: { name: 'Rajesh Verma', phone: '+91 98765 43226' },
      items: [{}, {}, {}, {}, {}], // 5 items
      pincode: '110017',
      assigned_packer_id: 'PKR-001',
      assigned_packer_name: 'Ravi Kumar',
      packing_status: 'packed',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0018',
      order_number: 'ORD-20251010-0018',
      customer: { name: 'Kavita Patel', phone: '+91 98765 43227' },
      items: [{}, {}, {}], // 3 items
      pincode: '110034',
      assigned_packer_id: 'PKR-005',
      assigned_packer_name: 'Rajesh Patel',
      packing_status: 'in_process',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0019',
      order_number: 'ORD-20251010-0019',
      customer: { name: 'Vikash Kumar', phone: '+91 98765 43228' },
      items: [{}, {}, {}, {}], // 4 items
      pincode: '110048',
      assigned_packer_id: 'PKR-003',
      assigned_packer_name: 'Amit Verma',
      packing_status: 'out_of_stock',
      sync_status: 'synced'
    },
    {
      id: 'ORD-20251010-0020',
      order_number: 'ORD-20251010-0020',
      customer: { name: 'Ritu Agarwal', phone: '+91 98765 43229' },
      items: [{}, {}], // 2 items
      pincode: '110058',
      assigned_packer_id: null,
      assigned_packer_name: null,
      packing_status: 'pending',
      sync_status: 'not_synced'
    }
  ];

  const enrichedOrders = useMemo(() => {
    // Use real orders from OrderContext, but add packing status if missing
    const base = orders || [];
    
    return base.map(order => {
      // If order already has packing status, use it; otherwise assign default pending
      if (order.packing_status) {
        // Safeguard: If order has packer ID but no name, try to resolve it
        if (order.assigned_packer_id && !order.assigned_packer_name) {
          const packer = packers.find(p => p.id === order.assigned_packer_id);
          if (packer) {
            // Update the order with the resolved packer name
            updateOrder(order.id, { assigned_packer_name: packer.name });
            return { ...order, assigned_packer_name: packer.name };
          }
        }
        return order;
      }
      
      // For orders without packing status, set as pending and unassigned
      return {
        ...order,
        packing_status: 'pending',
        assigned_packer_id: undefined,
        assigned_packer_name: undefined,
      } as any;
    });
  }, [orders, packers, updateOrder]);

  // Calculate packer workloads for smart assignment
  const packerWorkloads = useMemo(() => {
    const workloads = packers.map(packer => {
      // Use the state management for active status
      const isActive = packerStates[packer.id] !== undefined ? packerStates[packer.id] : packer.active;
      
      const assignedCount = enrichedOrders.filter(order => 
        order.assigned_packer_id === packer.id && order.packing_status === 'assigned'
      ).length;
      
      const pendingCount = enrichedOrders.filter(order => 
        order.assigned_packer_id === packer.id && order.packing_status === 'pending'
      ).length;
      
      const packedCount = enrichedOrders.filter(order => 
        order.assigned_packer_id === packer.id && order.packing_status === 'packed'
      ).length;
      
      const outOfStockCount = enrichedOrders.filter(order => 
        order.assigned_packer_id === packer.id && order.packing_status === 'out_of_stock'
      ).length;
      
      // Include Items No Stock in pending count
      const totalPendingCount = pendingCount + outOfStockCount;
      
      const totalWorkload = assignedCount + pendingCount;
      const totalOrders = assignedCount + pendingCount + packedCount;
      const completionPercentage = totalOrders > 0 ? Math.round((packedCount / totalOrders) * 100) : 0;
      
      return {
        ...packer,
        active: isActive, // Use the state-managed active status
        assignedCount,
        pendingCount: totalPendingCount, // Include Items No Stock in pending count
        packedCount,
        outOfStockCount,
        totalWorkload,
        completionPercentage,
        hasOutOfStockItems: outOfStockCount > 0
      };
    });
    
    return workloads;
  }, [enrichedOrders, packers, packerStates]);

  // Filter packers based on search query and active/inactive status
  const filteredPackers = useMemo(() => {
    let filtered = packerWorkloads;
    
    // Filter by search query
    if (packerSearchQuery) {
      filtered = filtered.filter(packer => 
        packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.zone?.toLowerCase().includes(packerSearchQuery.toLowerCase())
      );
    }
    
    // Filter by active/inactive status
    if (packerActiveFilter === 'active') {
      filtered = filtered.filter(packer => packer.active === true);
    } else if (packerActiveFilter === 'inactive') {
      filtered = filtered.filter(packer => packer.active === false);
    }
    // If 'all', don't filter by active status
    
    return filtered.sort((a, b) => a.totalWorkload - b.totalWorkload); // Sort by workload (least first)
  }, [packerWorkloads, packerSearchQuery, packerActiveFilter]);

  // Filter packers for assignment dialog (only active packers)
  const assignmentPackers = useMemo(() => {
    if (!packerSearchQuery) return packerWorkloads.filter(p => p.active);
    return packerWorkloads.filter(packer => 
      packer.active && (
        packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.zone?.toLowerCase().includes(packerSearchQuery.toLowerCase())
      )
    ).sort((a, b) => a.totalWorkload - b.totalWorkload); // Sort by workload (least first)
  }, [packerWorkloads, packerSearchQuery]);

  const packerOrders = useMemo(() => enrichedOrders.filter(o => o.assigned_packer_id === activePacker?.id), [enrichedOrders, activePacker?.id]);

  const statusCounts = useMemo(() => {
    // Filter out dispatched orders since packers don't handle them
    const packerOrders = enrichedOrders.filter(o => o.packing_status !== 'dispatched');
    
    const pendingOrders = packerOrders.filter(o => o.packing_status === 'pending').length;
    const outOfStockOrders = packerOrders.filter(o => o.packing_status === 'out_of_stock').length;
    
    return {
      all: packerOrders.length,
      assigned: packerOrders.filter(o => o.packing_status === 'assigned').length,
      pending: pendingOrders + outOfStockOrders, // Include Items No Stock in pending count
      packed: packerOrders.filter(o => o.packing_status === 'packed').length,
      "items-Out-of-stock": outOfStockOrders,
    };
  }, [enrichedOrders]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter(order => {
      // Filter out dispatched orders since packers don't handle them
      if (order.packing_status === 'dispatched') return false;

      const matchesSearch =
        order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_phone?.includes(searchQuery) ||
        order.assigned_packer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeTab === 'all') {
        // Show all orders from the 4 main statuses: assigned, pending, packed, out_of_stock
        matchesFilter = ['assigned', 'pending', 'packed', 'out_of_stock'].includes(order.packing_status);
      } else if (activeTab === 'assigned') matchesFilter = order.packing_status === 'assigned';
      else if (activeTab === 'pending') matchesFilter = order.packing_status === 'pending' || order.packing_status === 'out_of_stock';
      else if (activeTab === 'packed') matchesFilter = order.packing_status === 'packed';
      else if (activeTab === 'items-Out-of-stock') matchesFilter = order.packing_status === 'out_of_stock';

      const matchesPincode = zoneFilter === 'all' || order.pincode === zoneFilter;
      const matchesStatus = statusFilter === 'all' || order.packing_status === statusFilter;
      const matchesPacker = packerFilter === 'all' || order.assigned_packer_id === packerFilter;

      return matchesSearch && matchesFilter && matchesPincode && matchesStatus && matchesPacker;
    });
  }, [packerOrders, activeTab, searchQuery, zoneFilter, statusFilter, packerFilter]);

  // Pagination for orders table
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const ordersStartIndex = (ordersCurrentPage - 1) * ordersPerPage;
  const ordersEndIndex = ordersStartIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndex);

  // Pagination logic for packer cards
  const totalPages = Math.ceil(filteredPackers.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const paginatedPackers = filteredPackers.slice(startIndex, endIndex);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'packed': return 'bg-success/10 text-success border-success/20';
      case 'assigned': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'out_of_stock': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'bg-green-100 text-green-700 border-green-200';
      case 'active': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'offline': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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

  // Handle auto assign toggle change
  const handleAutoAssignChange = (checked: boolean) => {
    setAutoAssign(checked);
    setShowNotification(true);
    
    if (checked) {
      toast.success("Auto-assignment enabled", {
        duration: 3000,
      });
    } else {
      toast.info("Manual assignment mode", {
        duration: 3000,
      });
    }
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Update packer last active time (for mobile sync simulation)
  const updatePackerLastActive = (packerId: string) => {
    const packer = packers.find(p => p.id === packerId);
    if (packer) {
      packer.last_active = new Date().toISOString();
      // Force re-render by updating a dummy state
      setCurrentPage(prev => prev);
    }
  };

  // Handle individual packer active/inactive toggle
  const handlePackerToggleChange = (packerId: string, checked: boolean) => {
    // Find the packer in the packers array
    const packer = packers.find(p => p.id === packerId);
    if (packer) {
      // Update the packer state
      setPackerStates(prev => ({
        ...prev,
        [packerId]: checked
      }));
      
      // Update last active time
      updatePackerLastActive(packerId);
      
      // Show status message
      if (!checked) {
        toast.success(`Packer ${packer.name} deactivated. Orders remain assigned for tracking.`);
        // Auto-switch to inactive tab if packer is deactivated
        if (packerActiveFilter === 'active') {
          setPackerActiveFilter('inactive');
        }
      } else {
        toast.success(`Packer ${packer.name} activated.`);
        // Auto-switch to active tab if packer is activated
        if (packerActiveFilter === 'inactive') {
          setPackerActiveFilter('active');
        }
      }
    }
  };

  // Show initial notification on component mount
  useEffect(() => {
    if (autoAssign) {
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  }, []);

  // Simulate mobile sync - update packer last active times periodically
  useEffect(() => {
    const mobileSyncInterval = setInterval(() => {
      // Randomly update some active packers' last active time to simulate mobile activity
      const activePackers = packers.filter(p => p.active && packerStates[p.id] !== false);
      if (activePackers.length > 0 && Math.random() > 0.7) { // 30% chance every 30 seconds
        const randomPacker = activePackers[Math.floor(Math.random() * activePackers.length)];
        updatePackerLastActive(randomPacker.id);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(mobileSyncInterval);
  }, [packers, packerStates]);

  // Reset pagination when filters change
  useEffect(() => {
    setOrdersCurrentPage(1);
  }, [searchQuery, activeTab, zoneFilter, statusFilter]);

  // Real-time sync effect - show notification when new orders arrive
  useEffect(() => {
    if (enrichedOrders.length > 0) {
      const latestOrder = enrichedOrders[0];
      const isNewOrder = new Date(latestOrder.created_at).getTime() > Date.now() - 5000; // Within last 5 seconds
      
      if (isNewOrder && latestOrder.packing_status === 'pending') {
        // Check if any packers are active before auto-assigning
        const activePackers = packers.filter(p => p.active);
        if (activePackers.length === 0) {
          toast.warning(`New order ${latestOrder.order_number} received but no active packers available for assignment!`);
        } else {
          toast.success(`New order ${latestOrder.order_number} received and ${latestOrder.assigned_packer_name ? 'auto-assigned' : 'pending assignment'}!`);
        }
      }
    }
  }, [enrichedOrders, packers]);

  // Listen for localStorage changes to update packer data
  useEffect(() => {
    const handleStorageChange = () => {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      if (savedPackers.length > 0) {
        // Update packerStates with saved data
        const updatedStates: Record<string, boolean> = {};
        savedPackers.forEach((p: any) => {
          if (p.id && typeof p.is_active === 'boolean') {
            updatedStates[p.id] = p.is_active;
          }
        });
        setPackerStates(prev => ({ ...prev, ...updatedStates }));
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on component mount
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(paginatedOrders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
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

  const handleUnassign = () => {
    // Update each selected order to remove packer assignment
    selectedOrders.forEach(orderId => {
      updateOrder(orderId, {
        assigned_packer_id: undefined,
        assigned_packer_name: undefined,
        packing_status: 'pending'
      });
    });
    
    toast.success(`Unassigned ${selectedOrders.size} orders`);
    setSelectedOrders(new Set());
  };

  const handleAssign = () => {
    setShowAssignDialog(true);
  };

  const handlePackerSelect = (packerId: string) => {
    setSelectedPacker(packerId);
  };

  // Handle order row click to navigate to order details
  const handleOrderClick = (orderId: string) => {
    // Pass the current route as previous route for context-aware back navigation
    navigate(`/order-management/orders/${orderId}?from=packer-overview`);
  };

  const handleConfirmAssignment = () => {
    if (selectedPacker) {
      const packer = packers.find(p => p.id === selectedPacker);
      
      console.log('🔧 Manual assignment:', {
        selectedOrders: Array.from(selectedOrders),
        selectedPacker,
        packerName: packer?.name
      });
      
      // Update each selected order with the assigned packer
      selectedOrders.forEach(orderId => {
        const order = orders.find(o => o.id === orderId);
        console.log('📝 Updating order:', {
          orderId,
          orderNumber: order?.order_number,
          fromPacker: order?.assigned_packer_name || 'Unassigned',
          toPacker: packer?.name
        });
        
        updateOrder(orderId, {
          assigned_packer_id: selectedPacker,
          assigned_packer_name: packer?.name || 'Unknown Packer',
          packing_status: 'assigned'
        });
      });
      
      toast.success(`Assigned ${selectedOrders.size} order${selectedOrders.size > 1 ? 's' : ''} to ${packer?.name}`);
      setSelectedOrders(new Set());
      setShowAssignDialog(false);
      setSelectedPacker('');
    }
  };

  const handleManualAssign = (orderId: string) => {
    // Set the single order for assignment
    setSelectedOrders(new Set([orderId]));
    setShowAssignDialog(true);
  };

  const handleReassignOrder = (orderId: string) => {
    setOrderToReassign(orderId);
    setShowReassignDialog(true);
  };

  const handleStartOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('🚀 Starting order:', orderId);
      updateOrderStatusCentralized(orderId, 'assigned');
      toast.success(`Order ${order.order_number} started`);
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('✅ Completing order:', orderId);
      updateOrderStatusCentralized(orderId, 'packed');
      toast.success(`Order ${order.order_number} completed`);
    }
  };

  const handleItemsNoStock = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('🔴 Marking order as out of stock:', orderId);
      updateOrderStatusCentralized(orderId, 'out_of_stock');
      toast.error(`Order ${order.order_number} marked as Items No Stock`);
    }
  };

  const handleConfirmReassignment = () => {
    if (reassignPacker && orderToReassign) {
      const packer = packers.find(p => p.id === reassignPacker);
      const order = orders.find(o => o.id === orderToReassign);
      
      if (packer && order) {
        console.log('🔄 Reassigning order:', {
          orderId: orderToReassign,
          orderNumber: order.order_number,
          fromPacker: order.assigned_packer_name,
          toPacker: packer.name
        });
        
        updateOrder(orderToReassign, {
          assigned_packer_id: packer.id,
          assigned_packer_name: packer.name || 'Unknown Packer',
          packing_status: 'assigned'
        });
        
        setShowReassignDialog(false);
        setOrderToReassign('');
        setReassignPacker('');
        setShowNotification(true);
        
        toast.success(`Order ${order.order_number} reassigned to ${packer.name}`);
        
        // Reset packer card styling by triggering a re-render
        console.log('🔄 Order reassigned - packer card styling will reset automatically');
      }
    }
  };

  // Centralized status update function - works with buttons and real-time updates
  const updateOrderStatusCentralized = (orderId: string, newStatus: 'pending' | 'assigned' | 'packed' | 'out_of_stock', source: 'button' | 'mobile' | 'api' = 'button') => {
    // Map packing status to order status
    let orderStatus: 'Placed' | 'Accepted' | 'Packed' | 'Delivered' | 'Items No Stock' | 'Cancelled' | 'Returned' | 'Failed';
    
    switch (newStatus) {
      case 'pending':
        orderStatus = 'Placed'; // Pending orders stay as Placed
        break;
      case 'assigned':
        orderStatus = 'Accepted'; // Assigned orders are Accepted
        break;
      case 'packed':
        orderStatus = 'Packed';
        break;
      case 'out_of_stock':
        orderStatus = 'Items No Stock';
        break;
      default:
        orderStatus = 'Placed';
    }
    
    // Update the order status
    updateOrderStatus(orderId, orderStatus, newStatus);
    
    // Get order details for notifications
    const order = orders.find(o => o.id === orderId);
    const orderNumber = order?.order_number || orderId;
    
    // Update packer last active time if order is assigned to a packer
    if (order?.assigned_packer_id) {
      updatePackerLastActive(order.assigned_packer_id);
    }
    
    // Show different notifications based on source
    if (source === 'button') {
    toast.success(`Order status updated to ${newStatus.replace('_', ' ').toUpperCase()}`);
    } else if (source === 'mobile') {
      toast.success(`📱 Mobile Update: Order ${orderNumber} - ${newStatus.replace('_', ' ').toUpperCase()}`);
    } else if (source === 'api') {
      toast.success(`🔄 Real-time Update: Order ${orderNumber} - ${newStatus.replace('_', ' ').toUpperCase()}`);
    }
    
    // Show special notification for out of stock
    if (newStatus === 'out_of_stock') {
      if (order) {
        // Play sound alert
        playOutOfStockAlert();
        
        // Enhanced notification with order ID and customer name
        toast.error(`🚨 ITEMS NO STOCK: Order ${orderNumber} - ${order.customer_name} - Product not available in warehouse`, {
          duration: 8000, // Show longer for important alerts
        });
      }
    }
    
    // Log for debugging
    console.log(`Status Update [${source}]: Order ${orderNumber} → ${newStatus} (${orderStatus})`);
  };

  // Legacy function for backward compatibility with buttons
  const handleStatusUpdate = (orderId: string, newStatus: 'pending' | 'assigned' | 'packed' | 'out_of_stock') => {
    updateOrderStatusCentralized(orderId, newStatus, 'button');
  };

  // Real-time update function - call this from mobile app or API
  const handleRealTimeUpdate = (orderId: string, newStatus: 'pending' | 'assigned' | 'packed' | 'out_of_stock') => {
    updateOrderStatusCentralized(orderId, newStatus, 'api');
  };

  // Mobile app update function - call this from mobile app sync
  const handleMobileAppUpdate = (orderId: string, newStatus: 'pending' | 'assigned' | 'packed' | 'out_of_stock') => {
    updateOrderStatusCentralized(orderId, newStatus, 'mobile');
  };

  // WebSocket simulation for testing real-time updates (remove this when you integrate real WebSocket)
  const simulateWebSocketUpdate = (orderId: string, newStatus: 'pending' | 'assigned' | 'packed' | 'out_of_stock') => {
    console.log(`🔌 WebSocket Simulation: Order ${orderId} → ${newStatus}`);
    handleRealTimeUpdate(orderId, newStatus);
  };

  // Manual status change functions
  const handleManualStatusChange = () => {
    if (selectedOrders.size > 0) {
      setShowStatusChangeDialog(true);
    }
  };

  const handleConfirmStatusChange = () => {
    if (newStatus && newPackingStatus && selectedOrders.size > 0) {
      selectedOrders.forEach(orderId => {
      const order = orders.find(o => o.id === orderId);
      if (order) {
          updateOrderStatus(orderId, newStatus as any, newPackingStatus as any);
          console.log(`📝 Manual Status Change: Order ${order.order_number} → ${newStatus} (${newPackingStatus})`);
        }
      });
      
      toast.success(`Updated status for ${selectedOrders.size} order(s)`);
      setSelectedOrders(new Set());
      setShowStatusChangeDialog(false);
      setNewStatus('');
      setNewPackingStatus('');
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusChangeDialog(false);
    setNewStatus('');
    setNewPackingStatus('');
  };

  // Auto-update simulation (for testing without buttons)
  // Commented out to prevent random status changes
  // useEffect(() => {
  //   // This simulates automatic status updates from mobile app
  //   // Remove this when you integrate real mobile app sync
  //   const autoUpdateInterval = setInterval(() => {
  //     // Find orders that can be auto-updated for testing
  //     const testOrders = orders.filter(order => 
  //       order.packing_status === 'in_process' && 
  //       Math.random() > 0.95 // 5% chance every 5 seconds
  //     );
  //     
  //     if (testOrders.length > 0) {
  //       const randomOrder = testOrders[Math.floor(Math.random() * testOrders.length)];
  //       const randomStatus = Math.random() > 0.5 ? 'packed' : 'out_of_stock';
  //       simulateWebSocketUpdate(randomOrder.id, randomStatus);
  //     }
  //   }, 5000); // Check every 5 seconds

  //   return () => clearInterval(autoUpdateInterval);
  // }, [orders]);

  /*
   * ========================================
   * REAL-TIME INTEGRATION GUIDE
   * ========================================
   * 
   * When you're ready to integrate with real mobile app:
   * 
   * 1. REMOVE THESE BUTTONS:
   *    - "Complete" button (line ~950)
   *    - "Items No Stock" button (line ~970)
   *    - All "📱" mobile simulation buttons (line ~980-1010)
   * 
   * 2. KEEP THESE FUNCTIONS:
   *    - updateOrderStatusCentralized() - Main status update logic
   *    - handleRealTimeUpdate() - For API/WebSocket updates
   *    - handleMobileAppUpdate() - For mobile app updates
   * 
   * 3. INTEGRATE REAL UPDATES:
   *    // WebSocket connection
   *    const ws = new WebSocket('ws://your-api/orders');
   *    ws.onmessage = (event) => {
   *      const data = JSON.parse(event.data);
   *      handleRealTimeUpdate(data.orderId, data.status);
   *    };
   * 
   *    // Or API polling
   *    setInterval(() => {
   *      fetch('/api/order-updates')
   *        .then(res => res.json())
   *        .then(updates => {
   *          updates.forEach(update => {
   *            handleRealTimeUpdate(update.orderId, update.status);
   *          });
   *        });
   *    }, 1000);
   * 
   * 4. STATUS MAPPING:
   *    Mobile App Status → Packing Status
   *    "started" → "in_process"
   *    "completed" → "packed" 
   *    "out_of_stock" → "out_of_stock"
   * 
   * 5. TEST WITHOUT BUTTONS:
   *    - The auto-update simulation will continue working
   *    - Status changes will happen automatically
   *    - All UI updates will work the same way
   *    - Packer assignments will work the same way
   * 
   * The system will work exactly the same way!
   */

  // Test function to simulate real-time updates (for testing without buttons)
  const testRealTimeUpdates = () => {
    console.log('🧪 Testing real-time updates without buttons...');
    
    // Find some test orders
    const testOrders = orders.filter(order => 
      order.packing_status === 'pending' && 
      order.assigned_packer_name
    );
    
    if (testOrders.length > 0) {
      const randomOrder = testOrders[Math.floor(Math.random() * testOrders.length)];
      const randomStatus = Math.random() > 0.5 ? 'packed' : 'out_of_stock';
      
      console.log(`🔄 Simulating mobile app update: Order ${randomOrder.order_number} → ${randomStatus}`);
      handleRealTimeUpdate(randomOrder.id, randomStatus);
    } else {
      console.log('ℹ️ No orders available for testing (need pending orders with packers)');
    }
  };

  // Test function to verify auto-assignment flow
  const testAutoAssignment = () => {
    console.log('🧪 Testing auto-assignment flow...');
    
    // Create a test order
    const testOrderData = {
      customer_id: `TEST${Date.now()}`,
      customer_name: 'Test Customer',
      customer_phone: '+91 98765 43299',
      address: '123 Test Street, Test Area, Test City, 110001',
      lat: 28.4595,
      lng: 77.0266,
      zone: 'Zone A',
      total_amount: 299,
      payment_mode: 'Online' as const,
      status: 'Placed' as const,
      items: [
        {
          id: `TEST_ITEM_${Date.now()}`,
          product_id: 'P001',
          product_name: 'Test Product',
          quantity: 2,
          price: 50,
          subtotal: 100,
          is_substituted: false
        }
      ],
      delivery_slot: '11:00 AM - 1:00 PM',
      notes: 'Test order for auto-assignment',
      discount: 0,
      shipping_charges: 0,
      pincode: '110001'
    };
    
    try {
      const newOrder = addOrder(testOrderData);
      console.log('✅ Test order created with auto-assignment:', {
        orderNumber: newOrder.order_number,
        packingStatus: newOrder.packing_status,
        assignedPacker: newOrder.assigned_packer_name,
        status: newOrder.status
      });
      
      // Verify it appears in the correct tab
      setTimeout(() => {
        const assignedOrders = orders.filter(o => o.packing_status === 'assigned');
        console.log(`📊 Total assigned orders: ${assignedOrders.length}`);
        console.log('🎯 Auto-assignment test completed!');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error in auto-assignment test:', error);
    }
  };

  // Test function to verify reassignment flow
  const testReassignment = () => {
    console.log('🧪 Testing reassignment flow...');
    
    // Find an assigned order
    const assignedOrder = orders.find(o => o.packing_status === 'assigned' && o.assigned_packer_name);
    
    if (!assignedOrder) {
      console.log('❌ No assigned orders found for testing');
      return;
    }
    
    // Find a different packer
    const currentPacker = packers.find(p => p.id === assignedOrder.assigned_packer_id);
    const differentPacker = packers.find(p => p.id !== assignedOrder.assigned_packer_id);
    
    if (!differentPacker) {
      console.log('❌ No different packer found for testing');
      return;
    }
    
    console.log('🔄 Testing reassignment:', {
      orderNumber: assignedOrder.order_number,
      fromPacker: currentPacker?.name,
      toPacker: differentPacker.name
    });
    
    // Simulate reassignment
    updateOrder(assignedOrder.id, {
      assigned_packer_id: differentPacker.id,
      assigned_packer_name: differentPacker.name,
      packing_status: 'assigned'
    });
    
    console.log('✅ Reassignment test completed! Check packer counts in console.');
  };

  // Validation function to check for missing packer names
  const validatePackerAssignments = () => {
    console.log('🔍 Validating packer assignments...');
    
    const issues = [];
    
    orders.forEach(order => {
      if (order.assigned_packer_id && !order.assigned_packer_name) {
        issues.push({
          orderId: order.id,
          orderNumber: order.order_number,
          packerId: order.assigned_packer_id,
          issue: 'Has packer ID but no packer name'
        });
      }
      
      if (order.packing_status === 'assigned' && !order.assigned_packer_id) {
        issues.push({
          orderId: order.id,
          orderNumber: order.order_number,
          issue: 'Status is assigned but no packer ID'
        });
      }
    });
    
    if (issues.length > 0) {
      console.warn('⚠️ Found assignment issues:', issues);
    } else {
      console.log('✅ All packer assignments are valid!');
    }
    
    return issues;
  };



  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packer Management</h1>
          <p className="text-sm text-muted-foreground">Warehouse packer assignment & order tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
            <span className="text-sm">Auto Assign</span>
            <Switch checked={autoAssign} onCheckedChange={handleAutoAssignChange} />
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              // Simulate a mobile app order
              const testOrder = {
                customer_id: `C${Date.now()}`,
                customer_name: 'Mobile Customer',
                customer_phone: '+91 98765 43299',
                address: '123 Mobile Street, Test Area, Test City, 110001',
                lat: 28.4595,
                lng: 77.0266,
                zone: 'Zone A',
                total_amount: 299,
                payment_mode: 'Online' as const,
                status: 'Placed' as const,
                items: [
                  {
                    id: `OI${Date.now()}-1`,
                    product_id: 'P001',
                    product_name: 'Test Product',
                    quantity: 2,
                    price: 149.5,
                    subtotal: 299,
                    is_substituted: false
                  }
                ],
                delivery_slot: '11:00 AM - 1:00 PM',
                notes: 'Mobile app order',
                discount: 0,
                shipping_charges: 0,
                pincode: '110001'
              };
              addOrder(testOrder);
              toast.success('📱 Mobile app order created and auto-assigned!');
            }}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            📱 Simulate Mobile Order
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Manual Assignment Banner */}
      {!autoAssign && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">Manual Assignment Active</p>
            <p className="text-sm text-blue-700">Select orders and assign to packers manually using the 'Assign to Packer' button.</p>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Active Packers</p>
          <p className="text-3xl font-bold">
            {packers.filter(p => 
              p.sync_status !== 'offline' && 
              enrichedOrders.some(o => o.assigned_packer_id === p.id)
            ).length}
          </p>
          <p className="text-xs text-muted-foreground">of {packers.length} total</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-bold">{enrichedOrders.filter(o => o.packing_status === 'pending').length}</p>
          <p className="text-xs text-muted-foreground">being packed</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Packed</p>
          <p className="text-3xl font-bold">{enrichedOrders.filter(o => o.packing_status === 'packed').length}</p>
          <p className="text-xs text-muted-foreground">completed today</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Items No Stock</p>
          <p className="text-3xl font-bold">{enrichedOrders.filter(o => o.packing_status === 'out_of_stock').length}</p>
          <p className="text-xs text-muted-foreground">needs attention</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Completion %</p>
          <p className="text-3xl font-bold text-primary">
            {enrichedOrders.length > 0 
              ? Math.round((enrichedOrders.filter(o => o.packing_status === 'packed').length / enrichedOrders.length) * 100)
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground">overall rate</p>
        </CardContent></Card>
      </div>

      {/* Orders Management */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Orders Management ({filteredOrders.length})</h2>
            {selectedOrders.size > 0 && (
              <div className="flex items-center gap-2">
                {!autoAssign && (
                  <>
                <Button variant="outline" size="sm" onClick={handleUnassign}>
                  Unassign ({selectedOrders.size})
                </Button>
                <Button size="sm" onClick={handleAssign}>
                  Assign to Packer
                    </Button>
                  </>
                )}
                <Button variant="secondary" size="sm" onClick={handleManualStatusChange}>
                  Change Status ({selectedOrders.size})
                </Button>
              </div>
            )}
          </div>

          {/* Search Bar and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-[612px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders, customers, or packers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10" />
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
            <Select value={packerFilter} onValueChange={setPackerFilter}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue placeholder="All Packers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Packers</SelectItem>
                {packers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
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

          {/* Tabs for Status Filtering */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as FilterTab)}>
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all" className="flex items-center gap-2">
                All
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="assigned" className="flex items-center gap-2">
                Assigned
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {statusCounts.assigned}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {statusCounts.pending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="packed" className="flex items-center gap-2">
                Packed
                <Badge variant="secondary" className="ml-1 h-5 px-2">
                  {statusCounts.packed}
                </Badge>
              </TabsTrigger>
            <TabsTrigger value="items-Out-of-stock" className="flex items-center gap-2">
              Items No Stock
              <Badge variant="destructive" className="ml-1 h-5 px-2 bg-red-500 text-white">
                {statusCounts["items-Out-of-stock"]}
              </Badge>
            </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
          {/* Orders Table */}
          <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  {!autoAssign && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
                      <TableHead>Packer</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Pincode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sync</TableHead>
                      <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={!autoAssign ? 11 : 10} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order: any) => (
                    <TableRow 
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOrderClick(order.id)}
                    >
                      {!autoAssign && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                          />
                        </TableCell>
                      )}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {order.assigned_packer_id ? (
                            // If we have packer ID, always try to show both ID and name
                            (() => {
                              const packerName = order.assigned_packer_name || 
                                packers.find(p => p.id === order.assigned_packer_id)?.name || 
                                'Unknown Packer';
                              
                              // If we found a name but it's not in the order, update it
                              if (!order.assigned_packer_name && packerName !== 'Unknown Packer') {
                                updateOrder(order.id, { assigned_packer_name: packerName });
                              }
                              
                              return (
                            <>
                              <User className="h-3 w-3 text-muted-foreground" />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{packerName}</span>
                                    <span className="text-xs text-muted-foreground">{order.assigned_packer_id}</span>
                                  </div>
                            </>
                              );
                            })()
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{order.order_number}</TableCell>
                      <TableCell className="whitespace-nowrap">{order.customer_name}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{order.customer_phone}</TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <span className="text-sm font-semibold">{order.items?.length || 0}</span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap max-w-[200px] truncate">
                        {order.address || 'N/A'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                          {order.pincode || 
                           (order.address ? order.address.split(',').pop()?.trim() : 'N/A') || 
                           'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge className={getStatusColor(order.packing_status)}>
                          {order.packing_status === 'packed' && '✅ '}
                          {order.packing_status === 'pending' && '⏳ '}
                          {order.packing_status === 'assigned' && '📋 '}
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
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReassignOrder(order.id);
                            }}
                          >
                            Reassign
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartOrder(order.id);
                            }}
                          >
                            <Grid3X3 className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs text-green-600 border-green-300 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteOrder(order.id);
                            }}
                          >
                            <Grid3X3 className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemsNoStock(order.id);
                            }}
                          >
                            <Grid3X3 className="h-3 w-3 mr-1" />
                            Items No Stock
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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

      {/* Packer Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {/* Search Bar - Left side with equal spacing */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search packers by name, ID, or zone..." 
                value={packerSearchQuery} 
                onChange={(e) => setPackerSearchQuery(e.target.value)} 
                className="pl-10 h-10" 
              />
            </div>
            
            {/* Right side controls - Right side with equal spacing */}
            <div className="flex items-center gap-4">
              {/* Active/Inactive Filter Dropdown */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Status:</span>
                <Select value={packerActiveFilter} onValueChange={(value) => {
                  setPackerActiveFilter(value);
                  setCurrentPage(1); // Reset to first page when filter changes
                }}>
                  <SelectTrigger className="w-[140px] h-10">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packers</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Results Count */}
              <div className="text-sm text-muted-foreground">
                {filteredPackers.length} packer{filteredPackers.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packer Overview cards */}
      <div className="grid grid-cols-3 gap-5">
        {paginatedPackers.map(p => {
          // p is already a workload object from packerWorkloads, no need to find it
          return (
          <Card key={p.id} className="w-[377px] h-[335px] flex-shrink-0 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-4">
              {/* Header Section with Avatar and Eye Icon */}
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Avatar Icon - Moved down 10px */}
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-[10px]">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                  
                  {/* Packer Info */}
                  <div>
                    <h3 className="font-semibold text-lg">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.id}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Phone className="h-3 w-3" />
                      <span>{p.phone}</span>
                    </div>
                  </div>
                </div>
                
                {/* Eye Icon - Navigate to PackerDetails */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => navigate(`/order-management/packer-details/${p.id}`)}
                >
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>

              {/* Status Boxes Section */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-gray-100 border border-gray-200">
                  <p className="text-2xl font-bold text-gray-800">{p.assignedCount || 0}</p>
                  <p className="text-xs text-gray-600">Assigned</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-100 border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{p.pendingCount || 0}</p>
                  <p className="text-xs text-orange-600">Pending</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-100 border border-green-200">
                  <p className="text-2xl font-bold text-green-600">{p.packedCount || 0}</p>
                  <p className="text-xs text-green-600">Packed</p>
                </div>
              </div>

              {/* Completion Section */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold text-foreground">{p.completionPercentage || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-success rounded-full transition-all duration-500" 
                    style={{ width: `${p.completionPercentage || 0}%` }} 
                  />
                </div>
              </div>

              {/* Footer Section with WiFi, View Details Button, Zone, and Active Toggle */}
              <div className="space-y-3">
                {/* Activity and Zone */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last active: {(() => {
                    const lastActive = new Date(p.last_active);
                    const now = new Date();
                    const diffInMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
                    
                    if (diffInMinutes < 1) return 'Just now';
                    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                    
                    const diffInHours = Math.floor(diffInMinutes / 60);
                    if (diffInHours < 24) return `${diffInHours}h ago`;
                    
                    const diffInDays = Math.floor(diffInHours / 24);
                    return `${diffInDays}d ago`;
                  })()}</span>
                  <span>Zone: Promode Agro</span>
                </div>
                
                {/* WiFi, View Details Button, and Active Toggle - Aligned in one row with increased spacing */}
                <div className="flex items-center justify-between pt-[4px]">
                  {/* WiFi Icon */}
                  <Wifi className="h-4 w-4 text-primary" />
                  
                  {/* View Details Button - Navigate to PackerOrders */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                    onClick={() => navigate(`/order-management/packer-orders/${p.id}`)}
                  >
                    <User className="h-4 w-4 mr-2 text-gray-700 hover:text-gray-900" />
                    View Details
                  </Button>
                  
                  {/* Active Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <Switch 
                      checked={p.active} 
                      onCheckedChange={(checked) => handlePackerToggleChange(p.id, checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}


      {/* Assign to Packer Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
              <DialogTitle className="text-xl">Assign to Packer</DialogTitle>
            <p className="text-sm text-muted-foreground">
                {selectedOrders.size === 1 
                  ? 'Select a packer to assign this order to' 
                  : `Assigning ${selectedOrders.size} orders to a packer`
                }
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or zone..."
                value={packerSearchQuery}
                onChange={(e) => setPackerSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

              {/* Packer List with ScrollArea */}
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-2">
                  {assignmentPackers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No active packers available for assignment
                    </div>
                  ) : (
                    assignmentPackers.map((packer) => (
                <div
                  key={packer.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPacker === packer.id
                            ? 'border-primary bg-primary/5'
                            : packer.hasOutOfStockItems
                            ? 'border-red-500 bg-red-500 text-white hover:bg-red-600'
                            : 'hover:bg-muted/50'
                        } ${packer.sync_status === 'offline' ? 'opacity-60' : ''}`}
                        onClick={() => packer.sync_status !== 'offline' && handlePackerSelect(packer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{packer.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {packer.id}
                              </Badge>
                              <Badge className={
                                packer.sync_status === 'synced' 
                                  ? 'bg-success/10 text-success border-success/20'
                                  : packer.sync_status === 'active'
                                  ? 'bg-warning/10 text-warning border-warning/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }>
                                {packer.sync_status === 'synced' ? '🟢' : packer.sync_status === 'active' ? '🟡' : '🔴'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Assigned: <span className="font-medium text-foreground">{packer.assignedCount}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Pending: <span className="font-medium text-warning">{packer.pendingCount}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Packed: <span className="font-medium text-success">{packer.packedCount}</span>
                                </span>
                              </div>
                              {packer.zone && (
                                <Badge variant="secondary" className="text-xs">
                                  {packer.zone}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className="bg-success h-2 rounded-full transition-all"
                                  style={{ width: `${packer.completionPercentage}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                {packer.completionPercentage}%
                              </span>
                            </div>
                          </div>

                          {selectedPacker === packer.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-4" />
                          )}
                        </div>

                        {packer.sync_status === 'offline' && (
                          <div className="mt-2 text-xs text-destructive">
                            Packer is offline - cannot assign orders
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAssignment}
                disabled={!selectedPacker || packers.find(p => p.id === selectedPacker)?.sync_status === 'offline'}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Assign {selectedOrders.size} Order{selectedOrders.size !== 1 ? 's' : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Reassign Order Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Assign to Packer</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Assign this order to a packer
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search packers by name or ID..."
                value={packerSearchQuery}
                onChange={(e) => setPackerSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Packer List with ScrollArea */}
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-2">
                {packers
                  .filter(packer => 
                    packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
                    packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase())
                  )
                  .length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No packers found
                    </div>
                  ) : (
                    packers
                      .filter(packer => 
                        packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
                        packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase())
                      )
                      .map((packer) => (
                      <div
                        key={packer.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          reassignPacker === packer.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        } ${packer.sync_status === 'offline' ? 'opacity-60' : ''}`}
                        onClick={() => packer.sync_status !== 'offline' && setReassignPacker(packer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{packer.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {packer.id}
                              </Badge>
                              <Badge className={
                                packer.sync_status === 'synced' 
                                  ? 'bg-success/10 text-success border-success/20'
                                  : packer.sync_status === 'active'
                                  ? 'bg-warning/10 text-warning border-warning/20'
                                  : 'bg-destructive/10 text-destructive border-destructive/20'
                              }>
                                {packer.sync_status === 'synced' ? '🟢' : packer.sync_status === 'active' ? '🟡' : '🔴'}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Package className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Assigned: <span className="font-medium text-foreground">0</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Pending: <span className="font-medium text-warning">0</span>
                                </span>
                              </div>
                              {packer.zone && (
                                <Badge variant="secondary" className="text-xs">
                                  {packer.zone}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div
                                  className="bg-success h-2 rounded-full transition-all"
                                  style={{ width: '0%' }}
                                />
                              </div>
                              <span className="text-xs font-medium text-muted-foreground">
                                0%
                              </span>
                            </div>
                          </div>

                          {reassignPacker === packer.id && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-4" />
                          )}
                        </div>

                        {packer.sync_status === 'offline' && (
                          <div className="mt-2 text-xs text-destructive">
                            Packer is offline - cannot assign orders
                          </div>
                        )}
                      </div>
                    ))
                  )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReassignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReassignment}
              disabled={!reassignPacker || packers.find(p => p.id === reassignPacker)?.sync_status === 'offline'}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Reassign Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Order Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Order Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select order status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Placed">Order Placed</SelectItem>
                  <SelectItem value="Accepted">Order In Process</SelectItem>
                  <SelectItem value="Packed">Packed</SelectItem>
                  <SelectItem value="Dispatched">On The Way</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Items No Stock">Items No Stock</SelectItem>
                  <SelectItem value="Failed">Undelivered</SelectItem>
                  <SelectItem value="Returned">Request for Cancellation</SelectItem>
                  <SelectItem value="Cancelled">Cancel Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              This will update {selectedOrders.size} selected order(s)
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancelStatusChange}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={!newStatus || !newPackingStatus}
            >
              Update Status
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3 z-50">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-900">
            {autoAssign ? "Auto-assignment enabled" : "Manual assignment mode"}
          </span>
        </div>
      )}
    </div>
  );
}
