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
  // Initialize autoAssign from localStorage, default to true
  const [autoAssign, setAutoAssign] = useState<boolean>(() => {
    const saved = localStorage.getItem('packerAutoAssign');
    return saved !== null ? saved === 'true' : true;
  });
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
    // Initialize from static packers
    packers.forEach(packer => {
      initialState[packer.id] = packer.active;
    });
    // Also initialize from saved packers
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      savedPackers.forEach((packer: any) => {
        if (packer.id && typeof packer.active === 'boolean') {
          initialState[packer.id] = packer.active;
        }
      });
    } catch (error) {
      console.error('Error loading packer states:', error);
    }
    return initialState;
  });
  
  // Refresh key to force re-renders when orders are updated
  const [refreshKey, setRefreshKey] = useState(0);
  
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
  const [newPackingStatus, setNewPackingStatus] = useState<string>('');
  
  // Auto-assign packer selection dialog states
  const [showPackerSelectionDialog, setShowPackerSelectionDialog] = useState<boolean>(false);
  const [selectedPackersForAutoAssign, setSelectedPackersForAutoAssign] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('selectedPackersForAutoAssign');
      if (saved) {
        return new Set(JSON.parse(saved));
      }
      // Default: select all active packers
      return new Set();
    } catch (error) {
      return new Set();
    }
  });
  const [pendingAutoAssignToggle, setPendingAutoAssignToggle] = useState<boolean>(false);

  // Get packers from localStorage (for newly created ones) and merge with static packers
  const allPackers = useMemo(() => {
    try {
      const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
      // Get list of deleted packers to exclude them
      const deletedPackers = JSON.parse(localStorage.getItem('deleted-packers') || '[]');
      const deletedIds = new Set(deletedPackers);
      
      // Merge saved packers with static packers, prioritizing saved ones
      const savedIds = new Set(savedPackers.map((p: any) => p.id));
      const staticPackers = packers.filter(p => !savedIds.has(p.id) && !deletedIds.has(p.id));
      const filteredSavedPackers = savedPackers.filter((p: any) => !deletedIds.has(p.id));
      
      return [...filteredSavedPackers, ...staticPackers];
    } catch (error) {
      console.error('Error loading packers:', error);
      return packers;
    }
  }, [refreshKey]);

  const activePacker = useMemo(() => allPackers.find((p: any) => p.id === activePackerId) || allPackers[0], [activePackerId, allPackers]);

  // Reset packer filter when search query changes
  useEffect(() => {
    if (searchQuery) {
      setPackerFilter('all');
    }
  }, [searchQuery]);

  // Reset packer card pagination when packer search filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packerSearchQuery, packerActiveFilter]);

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

  // Use orders directly from context - React will detect when orders array changes
  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
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
        const packer = packers.find(p => p.id === enriched.assigned_packer_id);
        if (packer) {
          updateOrder(enriched.id, { assigned_packer_name: packer.name });
          return { ...enriched, assigned_packer_name: packer.name };
        }
      }

      // CRITICAL: Always return a new object, even if nothing changed
      return { ...enriched };
    });
  }, [orders, packers, updateOrder]);

  // Calculate packer workloads for smart assignment
  const packerWorkloads = useMemo(() => {
    const workloads = allPackers.map((packer: any) => {
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
  }, [enrichedOrders, allPackers, packerStates]);

  // Map packers that have orders matching the current search query (order id/customer name)
  const packerMatchesOrderSearch = useMemo(() => {
    if (!packerSearchQuery) return {};
    const query = packerSearchQuery.toLowerCase();
    const matches: Record<string, boolean> = {};
    
    enrichedOrders.forEach(order => {
      if (!order.assigned_packer_id) return;
      const orderIdMatch = order.order_number?.toLowerCase().includes(query);
      const customerMatch = order.customer_name?.toLowerCase().includes(query);
      if (orderIdMatch || customerMatch) {
        matches[order.assigned_packer_id] = true;
      }
    });
    
    return matches;
  }, [packerSearchQuery, enrichedOrders]);

  // Filter packers based on search query and active/inactive status
  const filteredPackers = useMemo(() => {
    let filtered = packerWorkloads;
    const query = packerSearchQuery.toLowerCase();
    
    // Filter by search query (name/id/zone or order/customer match)
    if (packerSearchQuery) {
      filtered = filtered.filter(packer => 
        packer.name.toLowerCase().includes(query) ||
        packer.id.toLowerCase().includes(query) ||
        packer.zone?.toLowerCase().includes(query) ||
        packerMatchesOrderSearch[packer.id]
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
    if (!packerSearchQuery) return packerWorkloads.filter((p: any) => p.active);
    return packerWorkloads.filter((packer: any) => 
      packer.active && (
        packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
        packer.zone?.toLowerCase().includes(packerSearchQuery.toLowerCase())
      )
    ).sort((a: any, b: any) => a.totalWorkload - b.totalWorkload); // Sort by workload (least first)
  }, [packerWorkloads, packerSearchQuery]);

  const packerOrders = useMemo(() => enrichedOrders.filter(o => o.assigned_packer_id === activePacker?.id), [enrichedOrders, activePacker?.id]);

  const statusCounts = useMemo(() => {
    // Filter out dispatched orders since packers don't handle them
    const packerOrders = enrichedOrders.filter(o => o.packing_status !== 'dispatched');
    
    const pendingOrders = packerOrders.filter(o => o.packing_status === 'pending').length;
    const outOfStockOrders = packerOrders.filter(o => o.packing_status === 'out_of_stock').length;
    const assignedOrders = packerOrders.filter(o => 
      o.packing_status === 'assigned' || o.packing_status === 'in_process'
    ).length;
    
    return {
      all: packerOrders.length,
      assigned: assignedOrders,
      pending: pendingOrders + outOfStockOrders, // Include Items No Stock in pending count
      packed: packerOrders.filter(o => o.packing_status === 'packed').length,
      "items-Out-of-stock": outOfStockOrders,
    };
  }, [enrichedOrders, refreshKey]);

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
        // Show all orders from the main statuses including cancelled
        matchesFilter = ['assigned', 'pending', 'packed', 'out_of_stock', 'cancelled', 'in_process'].includes(order.packing_status);
      } else if (activeTab === 'assigned') {
        matchesFilter = order.packing_status === 'assigned' || order.packing_status === 'in_process';
      } else if (activeTab === 'pending') {
        matchesFilter = order.packing_status === 'pending' || order.packing_status === 'out_of_stock';
      } else if (activeTab === 'packed') {
        matchesFilter = order.packing_status === 'packed';
      } else if (activeTab === 'items-Out-of-stock') {
        matchesFilter = order.packing_status === 'out_of_stock';
      }

      const matchesPincode = zoneFilter === 'all' || order.pincode === zoneFilter;
      const matchesStatus = statusFilter === 'all' || order.packing_status === statusFilter;
      const matchesPacker = packerFilter === 'all' || order.assigned_packer_id === packerFilter;

      return matchesSearch && matchesFilter && matchesPincode && matchesStatus && matchesPacker;
    });
  }, [enrichedOrders, activeTab, searchQuery, zoneFilter, statusFilter, packerFilter, refreshKey]);

  // Pagination for orders table
  const totalOrdersPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const ordersStartIndex = (ordersCurrentPage - 1) * ordersPerPage;
  const ordersEndIndex = ordersStartIndex + ordersPerPage;
  const paginatedOrders = filteredOrders.slice(ordersStartIndex, ordersEndIndex);

  // Pagination logic for packer cards
  const totalPages = Math.max(1, Math.ceil(filteredPackers.length / cardsPerPage));
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const paginatedPackers = filteredPackers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(prev => Math.min(prev, totalPages));
  }, [totalPages]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'packed': return 'bg-success/10 text-success border-success/20';
      case 'assigned': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-warning/10 text-warning border-warning/20';
      case 'out_of_stock': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/40';
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
    if (checked) {
      // When turning ON, open the packer selection dialog
      setPendingAutoAssignToggle(true);
      setShowPackerSelectionDialog(true);
    } else {
      // When turning OFF, immediately disable
      setAutoAssign(false);
      localStorage.setItem('packerAutoAssign', 'false');
      window.dispatchEvent(new CustomEvent('packerAutoAssignChanged', { detail: { autoAssign: false } }));
      setShowNotification(true);
      toast.info("Manual assignment mode", {
        duration: 3000,
      });
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);
    }
  };
  
  // Handle packer selection for auto-assign
  const handleConfirmPackerSelection = () => {
    if (selectedPackersForAutoAssign.size === 0) {
      toast.error('Please select at least one packer for auto-assignment');
      return;
    }
    
    // Save selected packers to localStorage
    localStorage.setItem('selectedPackersForAutoAssign', JSON.stringify(Array.from(selectedPackersForAutoAssign)));
    
    // Enable auto-assign
    setAutoAssign(true);
    localStorage.setItem('packerAutoAssign', 'true');
    window.dispatchEvent(new CustomEvent('packerAutoAssignChanged', { detail: { autoAssign: true } }));
    
    setShowPackerSelectionDialog(false);
    setPendingAutoAssignToggle(false);
    setShowNotification(true);
    
    toast.success(`Auto-assignment enabled for ${selectedPackersForAutoAssign.size} packer(s)`, {
      duration: 3000,
    });
    
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };
  
  // Handle cancel packer selection
  const handleCancelPackerSelection = () => {
    setShowPackerSelectionDialog(false);
    setPendingAutoAssignToggle(false);
    // Reset selected packers to saved state
    try {
      const saved = localStorage.getItem('selectedPackersForAutoAssign');
      if (saved) {
        setSelectedPackersForAutoAssign(new Set(JSON.parse(saved)));
      } else {
        setSelectedPackersForAutoAssign(new Set());
      }
    } catch (error) {
      setSelectedPackersForAutoAssign(new Set());
    }
  };
  
  // Load selected packers when dialog opens and filter out deleted packers
  useEffect(() => {
    if (showPackerSelectionDialog) {
      try {
        // Get deleted packers list
        const deletedPackers = JSON.parse(localStorage.getItem('deleted-packers') || '[]');
        const deletedIds = new Set(deletedPackers);
        
        const saved = localStorage.getItem('selectedPackersForAutoAssign');
        if (saved) {
          const savedSelected = JSON.parse(saved);
          // Filter out deleted packers from selection
          const filteredSelected = savedSelected.filter((id: string) => !deletedIds.has(id));
          setSelectedPackersForAutoAssign(new Set(filteredSelected));
          
          // Update localStorage if any deleted packers were removed
          if (filteredSelected.length !== savedSelected.length) {
            localStorage.setItem('selectedPackersForAutoAssign', JSON.stringify(filteredSelected));
          }
        } else {
          // If no saved selection and auto-assign is being turned on, select all active packers by default
          if (pendingAutoAssignToggle) {
            const activePackers = allPackers.filter((p: any) => p.active !== false && p.sync_status !== 'offline');
            setSelectedPackersForAutoAssign(new Set(activePackers.map((p: any) => p.id)));
          }
        }
      } catch (error) {
        console.error('Error loading selected packers:', error);
      }
    }
  }, [showPackerSelectionDialog, pendingAutoAssignToggle, allPackers, refreshKey]);
  
  // Handle select/deselect individual packer
  const handleTogglePackerForAutoAssign = (packerId: string, checked: boolean) => {
    const newSelected = new Set(selectedPackersForAutoAssign);
    if (checked) {
      newSelected.add(packerId);
    } else {
      newSelected.delete(packerId);
    }
    setSelectedPackersForAutoAssign(newSelected);
  };
  
  // Handle select all packers
  const handleSelectAllPackers = (checked: boolean) => {
    if (checked) {
      // Select all active packers only (exclude inactive)
      const activePackers = allPackers.filter((p: any) => p.active !== false && p.sync_status !== 'offline');
      setSelectedPackersForAutoAssign(new Set(activePackers.map((p: any) => p.id)));
    } else {
      setSelectedPackersForAutoAssign(new Set());
    }
  };
  
  // Get active packers count for select all checkbox
  const activePackersCount = useMemo(() => {
    return allPackers.filter((p: any) => p.active !== false && p.sync_status !== 'offline').length;
  }, [allPackers]);

  // Update packer last active time (for mobile sync simulation)
  const updatePackerLastActive = (packerId: string) => {
    const packer = allPackers.find((p: any) => p.id === packerId);
    if (packer) {
      packer.last_active = new Date().toISOString();
      // Save to localStorage if it's a saved packer
      try {
        const savedPackers = JSON.parse(localStorage.getItem('warehouse-packers') || '[]');
        const updatedPackers = savedPackers.map((p: any) => 
          p.id === packerId ? { ...p, last_active: packer.last_active } : p
        );
        localStorage.setItem('warehouse-packers', JSON.stringify(updatedPackers));
      } catch (error) {
        console.error('Error updating packer last active:', error);
      }
      // Force re-render by updating a dummy state
      setCurrentPage(prev => prev);
    }
  };

  // Handle individual packer active/inactive toggle
  const handlePackerToggleChange = (packerId: string, checked: boolean) => {
    // Find the packer in the allPackers array
    const packer = allPackers.find((p: any) => p.id === packerId);
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
      const activePackers = allPackers.filter((p: any) => p.active && packerStates[p.id] !== false);
      if (activePackers.length > 0 && Math.random() > 0.7) { // 30% chance every 30 seconds
        const randomPacker = activePackers[Math.floor(Math.random() * activePackers.length)];
        updatePackerLastActive(randomPacker.id);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(mobileSyncInterval);
  }, [allPackers, packerStates]);

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
      const activePackers = allPackers.filter((p: any) => p.active);
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
  
  // Listen for order status updates and refresh the UI
  useEffect(() => {
    let lastSignature = '';
    
    const checkForUpdates = () => {
      try {
        const storedOrders = localStorage.getItem('warehouse-orders');
        if (storedOrders) {
          // Check if orders have changed by comparing a signature
          const parsedOrders = JSON.parse(storedOrders);
          const statusSignature = parsedOrders
            .map((o: any) => `${o.id}:${o.packing_status}:${o.status}:${o.updated_at || ''}`)
            .join('|');
          
          if (lastSignature !== statusSignature) {
            // Status changed in localStorage, force refresh
            console.log('📊 Status signature changed in localStorage, forcing refresh');
            console.log(`   Previous: ${lastSignature.substring(0, 100)}...`);
            console.log(`   Current:  ${statusSignature.substring(0, 100)}...`);
            setRefreshKey(prev => prev + 1);
            lastSignature = statusSignature;
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    };
    
    const handleOrderUpdate = () => {
      // Multiple refreshes to ensure UI updates after context state changes
      setRefreshKey(prev => prev + 1);
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 50);
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 150);
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 300);
      // Also check localStorage after a delay
      setTimeout(() => {
        checkForUpdates();
      }, 100);
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'warehouse-orders') {
        handleOrderUpdate();
      }
    };
    
    // Initial signature check
    checkForUpdates();
    
    const handleForceRefresh = () => {
      console.log('🔄 Force refresh event received');
      setRefreshKey(prev => prev + 1);
      setTimeout(() => {
        checkForUpdates();
      }, 50);
    };
    
    const handlePackerRefresh = () => {
      console.log('🔄 Packer refresh event received');
      setRefreshKey(prev => prev + 1);
      
      // Also clean up selected packers for auto-assign to remove deleted packers
      try {
        const deletedPackers = JSON.parse(localStorage.getItem('deleted-packers') || '[]');
        const deletedIds = new Set(deletedPackers);
        const savedSelected = JSON.parse(localStorage.getItem('selectedPackersForAutoAssign') || '[]');
        const filteredSelected = savedSelected.filter((id: string) => !deletedIds.has(id));
        
        if (filteredSelected.length !== savedSelected.length) {
          localStorage.setItem('selectedPackersForAutoAssign', JSON.stringify(filteredSelected));
          // Update state - the useEffect watching showPackerSelectionDialog will handle updating if dialog is open
          setSelectedPackersForAutoAssign(prev => {
            const newSet = new Set(filteredSelected);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error cleaning up selected packers:', error);
      }
    };
    
    window.addEventListener('orderStatusUpdated', handleOrderUpdate);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('forceOrderRefresh', handleForceRefresh);
    window.addEventListener('forcePackerRefresh', handlePackerRefresh);
    
    // Poll for updates (fallback) - check localStorage for changes
    const pollInterval = setInterval(checkForUpdates, 300); // Poll every 300ms for faster updates
    
    return () => {
      window.removeEventListener('orderStatusUpdated', handleOrderUpdate);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('forceOrderRefresh', handleForceRefresh);
      window.removeEventListener('forcePackerRefresh', handlePackerRefresh);
      clearInterval(pollInterval);
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
      const packer = allPackers.find((p: any) => p.id === selectedPacker);
      
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


  const handleConfirmReassignment = () => {
    if (reassignPacker && orderToReassign) {
      const packer = allPackers.find((p: any) => p.id === reassignPacker);
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
    // Get order details first - try localStorage for latest data, then fallback to context
    let order = orders.find(o => o.id === orderId);
    
    // If not found in context, try localStorage
    if (!order) {
      try {
        const storedOrders = localStorage.getItem('warehouse-orders');
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders);
          order = parsedOrders.find((o: any) => o.id === orderId);
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }
    
    if (!order) {
      console.error(`Order ${orderId} not found`);
      toast.error(`Order ${orderId} not found`);
      return;
    }
    
    console.log('🔄 Updating order status:', {
      orderId,
      orderNumber: order.order_number,
      currentStatus: order.status,
      currentPackingStatus: order.packing_status,
      newStatus,
      source
    });
    
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
    
    // Ensure packer name is preserved when marking as packed
    // If order has packer ID but no name, resolve it from packers list
    let packerName = order.assigned_packer_name;
    if (order.assigned_packer_id && !packerName) {
      const packer = allPackers.find((p: any) => p.id === order.assigned_packer_id);
      if (packer) {
        packerName = packer.name;
      }
    }
    
    // Update the order with both status and packing_status
    // Use updateOrder directly to ensure both fields are updated
    console.log(`📝 Calling updateOrder for ${orderId}:`, {
      status: orderStatus,
      packing_status: newStatus,
      packerName: order.assigned_packer_id && packerName ? packerName : order.assigned_packer_name
    });
    
    updateOrder(orderId, {
      status: orderStatus,
      packing_status: newStatus,
      assigned_packer_name: order.assigned_packer_id && packerName ? packerName : order.assigned_packer_name,
      updated_at: new Date().toISOString()
    });
    
    // Also call updateOrderStatus for consistency
    updateOrderStatus(orderId, orderStatus, newStatus);
    
    // Verify the update was saved to localStorage
    setTimeout(() => {
      try {
        const storedOrders = localStorage.getItem('warehouse-orders');
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders);
          const updatedOrder = parsedOrders.find((o: any) => o.id === orderId);
          if (updatedOrder) {
            console.log(`✅ Verified update in localStorage for ${orderId}:`, {
              packing_status: updatedOrder.packing_status,
              status: updatedOrder.status
            });
          } else {
            console.warn(`⚠️ Order ${orderId} not found in localStorage after update`);
          }
        }
      } catch (error) {
        console.error('Error verifying localStorage update:', error);
      }
    }, 100);
    
    // Dispatch event to notify OrderDetail and other components of the update
    window.dispatchEvent(new CustomEvent('orderStatusUpdated', {
      detail: { orderId, status: orderStatus, packingStatus: newStatus, packerName: packerName || order.assigned_packer_name }
    }));
    
    // Force immediate refresh - update refreshKey multiple times to ensure UI updates
    setRefreshKey(prev => prev + 1);
    
    // Force multiple refreshes with delays to ensure UI updates after localStorage write and context update
    // Small delays to ensure localStorage write completes and context updates
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 50);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 150);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 300);
    
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
    
    // Final refresh after context has definitely updated
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 1000);
    
    // Also trigger a custom event to force other components to refresh
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('forceOrderRefresh'));
    }, 100);
    
    const orderNumber = order.order_number || orderId;
    
    // Update packer last active time if order is assigned to a packer
    if (order.assigned_packer_id) {
      updatePackerLastActive(order.assigned_packer_id);
    }
    
    // Show different notifications based on source
    if (source === 'mobile') {
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
    console.log(`✅ Status Update [${source}]: Order ${orderNumber} → ${newStatus} (${orderStatus})`);
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
        updateOrder(orderId, {
          packing_status: statusToSet,
          status: orderStatus,
          updated_at: new Date().toISOString()
        });
      });
      
      toast.success(`Updated status for ${orderIds.length} order${orderIds.length > 1 ? 's' : ''} to ${newPackingStatus.toUpperCase()}`);
      setSelectedOrders(new Set());
      setShowStatusChangeDialog(false);
      setNewPackingStatus('');
    }
  };

  const handleCancelStatusChange = () => {
    setShowStatusChangeDialog(false);
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
          <Button onClick={() => navigate('/order-management/create-packer')} className="gap-2">
            <UserPlus className="h-4 w-4" />
            New Packer
          </Button>
        </div>
      </div>

      {/* Packer Selection Dialog for Auto-Assign */}
      <Dialog open={showPackerSelectionDialog} onOpenChange={(open) => {
        if (!open) {
          handleCancelPackerSelection();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Packers for Auto-Assignment</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose which packers should receive new orders automatically. Orders will be distributed one by one among selected packers.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 pb-3 border-b">
              <Checkbox
                id="select-all-packers"
                checked={activePackersCount > 0 && selectedPackersForAutoAssign.size === activePackersCount}
                onCheckedChange={handleSelectAllPackers}
              />
              <label htmlFor="select-all-packers" className="text-sm font-medium cursor-pointer">
                Select All Active Packers ({activePackersCount})
              </label>
            </div>

            {/* Packer List */}
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-2">
                {allPackers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No packers available
                  </div>
                ) : (
                  allPackers.map((packer: any) => {
                    const isActive = packer.active !== false && packer.sync_status !== 'offline';
                    const isSelected = selectedPackersForAutoAssign.has(packer.id);
                    
                    return (
                      <div
                        key={packer.id}
                        className={`p-4 rounded-lg border transition-all ${
                          !isActive 
                            ? 'opacity-50 cursor-not-allowed bg-muted/30' 
                            : isSelected
                            ? 'border-primary bg-primary/5 cursor-pointer'
                            : 'hover:bg-muted/50 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isActive) {
                            handleTogglePackerForAutoAssign(packer.id, !isSelected);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (isActive) {
                                handleTogglePackerForAutoAssign(packer.id, checked as boolean);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!isActive}
                          />
                          <div className="flex-1 flex items-center justify-between">
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
                              {!isActive && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{packer.phone}</span>
                              </div>
                              {packer.zone && (
                                <Badge variant="secondary" className="text-xs">
                                  {packer.zone}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPackerSelection}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPackerSelection}
              disabled={selectedPackersForAutoAssign.size === 0}
            >
              Confirm Selection ({selectedPackersForAutoAssign.size} packer{selectedPackersForAutoAssign.size !== 1 ? 's' : ''})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {allPackers.filter((p: any) => 
              p.sync_status !== 'offline' && 
              enrichedOrders.some(o => o.assigned_packer_id === p.id)
            ).length}
          </p>
          <p className="text-xs text-muted-foreground">of {allPackers.length} total</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-1">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="text-3xl font-bold">{enrichedOrders.filter(o => o.packing_status === 'assigned' || o.packing_status === 'in_process').length}</p>
          <p className="text-xs text-muted-foreground">currently assigned</p>
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
                <div 
                  className="text-center p-3 rounded-lg bg-green-100 border border-green-200 cursor-pointer hover:bg-green-200 transition-colors"
                  onClick={() => navigate(`/order-management/packer-orders/${p.id}`)}
                >
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
                  {p.zone && <span>Zone: {p.zone}</span>}
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

      {/* Pagination Controls - Only show when there are more than 12 cards */}
      {filteredPackers.length > cardsPerPage && (
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} &middot; Showing {startIndex + 1}-{Math.min(endIndex, filteredPackers.length)} of {filteredPackers.length} packers
          </div>
          <div className="flex items-center justify-center gap-2">
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
                            ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
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
                disabled={!selectedPacker || allPackers.find((p: any) => p.id === selectedPacker)?.sync_status === 'offline'}
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
                {allPackers
                  .filter((packer: any) => 
                    packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
                    packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase())
                  )
                  .length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No packers found
                    </div>
                  ) : (
                    allPackers
                      .filter((packer: any) => 
                        packer.name.toLowerCase().includes(packerSearchQuery.toLowerCase()) ||
                        packer.id.toLowerCase().includes(packerSearchQuery.toLowerCase())
                      )
                      .map((packer: any) => (
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
                disabled={!reassignPacker || allPackers.find((p: any) => p.id === reassignPacker)?.sync_status === 'offline'}
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
