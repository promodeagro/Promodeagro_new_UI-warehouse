import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, TrendingUp, Clock, Package, DollarSign, 
  FileText, Search, Phone, MapPin, Navigation, AlertCircle,
  UserX, RefreshCw, MoreVertical
} from "lucide-react";
import { Link } from "react-router-dom";
import { riders } from "@/data/dummyData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RiderManagementDashboard = () => {
  const [filteredRiders, setFilteredRiders] = useState(riders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"all" | "active" | "inactive">("all");

  const stats = {
    totalRiders: riders.length,
    activeRiders: riders.filter(r => r.current_status === 'On Trip').length,
    availableRiders: riders.filter(r => r.current_status === 'Available').length,
    ordersOutForDelivery: riders.reduce((sum, r) => sum + r.orders_out_for_delivery, 0),
    codOutstanding: riders.reduce((sum, r) => sum + r.cod_outstanding, 0),
    openRunsheets: riders.filter(r => r.current_runsheet_id).length,
    offlineRiders: riders.filter(r => r.current_status === 'Offline').length
  };

  useEffect(() => {
    let filtered = riders;

    if (viewMode === "active") {
      filtered = filtered.filter(r => r.active);
    } else if (viewMode === "inactive") {
      filtered = filtered.filter(r => !r.active);
    }

    if (searchQuery) {
      filtered = filtered.filter(rider => 
        rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.phone.includes(searchQuery) ||
        rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(rider => rider.current_status === statusFilter);
    }

    if (zoneFilter !== "all") {
      filtered = filtered.filter(rider => rider.zone === zoneFilter);
    }

    if (vehicleFilter !== "all") {
      filtered = filtered.filter(rider => rider.vehicle_type === vehicleFilter);
    }

    setFilteredRiders(filtered);
  }, [riders, searchQuery, statusFilter, zoneFilter, vehicleFilter, viewMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-success';
      case 'On Trip': return 'bg-accent';
      case 'Busy': return 'bg-warning';
      case 'Offline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const zones = Array.from(new Set(riders.map(r => r.zone))).sort();

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-6 py-8">
        {/* Page header (no white background container) */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Rider Management</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage delivery riders</p>
          </div>
          <div className="flex gap-3">
            <Link to="/delivery/rider-onboarding-queue">
              <Button variant="outline" className="gap-2">
                <Users className="h-4 w-4" />
                Onboarding Queue
              </Button>
            </Link>
            <Link to="/delivery/runsheets">
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Manage Runsheets
              </Button>
            </Link>
          </div>
        </div>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRiders}</p>
                  <p className="text-xs text-muted-foreground">Total Riders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeRiders}</p>
                  <p className="text-xs text-muted-foreground">Out for Delivery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-success" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.availableRiders}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Package className="h-5 w-5 text-warning" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.ordersOutForDelivery}</p>
                  <p className="text-xs text-muted-foreground">Orders Out</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-secondary" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{stats.codOutstanding.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">COD Outstanding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.openRunsheets}</p>
                  <p className="text-xs text-muted-foreground">Open Runsheets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <UserX className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.offlineRiders}</p>
                  <p className="text-xs text-muted-foreground">Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>
            </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "Available" ? "default" : "outline"}
                  onClick={() => setStatusFilter("Available")}
                  size="sm"
                >
                  Available
                </Button>
                <Button
                  variant={statusFilter === "On Trip" ? "default" : "outline"}
                  onClick={() => setStatusFilter("On Trip")}
                  size="sm"
                >
                  On Trip
                </Button>
                <Button
                  variant={statusFilter === "Busy" ? "default" : "outline"}
                  onClick={() => setStatusFilter("Busy")}
                  size="sm"
                >
                  Busy
                        </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRiders.map((rider) => (
            <Card key={rider.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rider.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rider.id.substring(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(rider.current_status)}`} />
                    <Badge variant="outline">{rider.current_status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{rider.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Vehicle: {rider.vehicle_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last seen: {rider.last_seen ? new Date(rider.last_seen).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>

                  <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-primary">{rider.orders_out_for_delivery || 0}</p>
                      <p className="text-xs text-muted-foreground">Out</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-yellow-500">{rider.orders_pending_pickup || 0}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-500">{rider.orders_delivered_today || 0}</p>
                      <p className="text-xs text-muted-foreground">Delivered</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Success: {(rider.delivery_success_rate || 0).toFixed(0)}%
                    </span>
                    <span className="text-muted-foreground">
                      Avg: {rider.avg_delivery_time_minutes || 0}min
                    </span>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                    <Link to={`/delivery/rider-runsheets/${rider.id}`} className="flex-1">
                      <Button size="sm" variant="default" className="w-full">
                        <FileText className="h-3 w-3 mr-1" />
                        Runsheet
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRiders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No riders found matching your filters</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default RiderManagementDashboard;


