import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MoreVertical,
  UserPlus,
  Ban,
  Smartphone,
  AlertTriangle,
  PackagePlus,
  Wifi,
  WifiOff,
  Grid3X3,
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
  const { orders } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Find the packer
  const packer = packers.find(p => p.id === packerId);

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

  // Get orders for this packer
  const packerOrders = orders.filter(order => order.assigned_packer_id === packerId);

  // Count orders by status
  const allCount = packerOrders.length;
  const assignedCount = packerOrders.filter(o => 
    o.packing_status === 'assigned' || o.packing_status === 'in_process'
  ).length;
  const pendingCount = packerOrders.filter(o => o.packing_status === 'pending').length;
  const packedCount = packerOrders.filter(o => o.packing_status === 'packed').length;
  const outOfStockCount = packerOrders.filter(o => o.packing_status === 'out_of_stock').length;

  // Filter based on active tab
  const filteredOrders = packerOrders.filter(order => {
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

    return matchesSearch && matchesFilter;
  });

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

  // Handler functions for action buttons
  const handleReassignOrder = (orderId: string) => {
    console.log('🔄 Reassigning order:', orderId);
    // TODO: Implement reassign functionality
  };

  const handleStartOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('🚀 Starting order:', orderId);
      // TODO: Implement start functionality
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('✅ Completing order:', orderId);
      // TODO: Implement complete functionality
    }
  };

  const handleItemsNoStock = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log('🔴 Marking order as out of stock:', orderId);
      // TODO: Implement items no stock functionality
    }
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
            <h2 className="text-lg font-semibold">Orders Management</h2>
            <p className="text-sm text-muted-foreground">Packer: {packer.name}</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, Customer Name, or Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Pincode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sync</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No orders found
                        </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow 
                            key={order.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/order-management/orders/${order.id}?from=packer-orders&packerId=${packerId}`)}
                          >
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
                            <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleReassignOrder(order.id)}
                                >
                                  Reassign
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleStartOrder(order.id)}
                                >
                                  <Grid3X3 className="h-3 w-3 mr-1" />
                                  Start
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs text-green-600 border-green-300 hover:bg-green-50"
                                  onClick={() => handleCompleteOrder(order.id)}
                                >
                                  <Grid3X3 className="h-3 w-3 mr-1" />
                                  Complete
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={() => handleItemsNoStock(order.id)}
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
    </div>
  );
}