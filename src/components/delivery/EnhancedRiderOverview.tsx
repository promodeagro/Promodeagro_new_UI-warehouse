import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Truck,
  Search,
  TrendingUp,
  Clock,
  Package,
  IndianRupee,
  FileText,
  Phone,
  MapPin,
  UserX,
  UserCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { riders, riderRunsheets } from "@/data/riderData";

const EnhancedRiderOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");

  // Filter riders based on search and filters
  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "on-duty" && rider.current_status === "On Trip") ||
      (statusFilter === "available" && rider.current_status === "Available") ||
      (statusFilter === "offline" && rider.current_status === "Offline");
    
    const matchesZone = zoneFilter === "all" || rider.zone.toLowerCase().includes(zoneFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesZone;
  });

  const stats = {
    totalRiders: riders.length,
    activeRiders: riders.filter(r => r.current_status === 'On Trip').length,
    availableRiders: riders.filter(r => r.current_status === 'Available').length,
    ordersOut: riders.reduce((sum, r) => sum + r.orders_out_for_delivery, 0),
    codOutstanding: riders.reduce((sum, r) => sum + r.cod_outstanding, 0),
    openRunsheets: riderRunsheets.filter(r => r.status !== 'Completed').length
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "On Trip": "bg-success text-success-foreground",
      "Available": "bg-accent text-accent-foreground",
      "Busy": "bg-warning text-warning-foreground",
      "Offline": "bg-muted text-muted-foreground"
    };
    return colors[status] || "bg-muted";
  };

  return (
    <div className="min-h-screen bg-gradient-background p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Rider Overview</h1>
        <p className="text-muted-foreground">Monitor and manage delivery riders in real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Riders</p>
                <p className="text-2xl font-bold">{stats.totalRiders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Riders</p>
                <p className="text-2xl font-bold text-success">{stats.activeRiders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available</p>
                <p className="text-2xl font-bold text-accent">{stats.availableRiders}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Orders Out</p>
                <p className="text-2xl font-bold text-warning">{stats.ordersOut}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">COD Outstanding</p>
                <p className="text-xl font-bold">₹{stats.codOutstanding.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <IndianRupee className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Open Runsheets</p>
                <p className="text-2xl font-bold">{stats.openRunsheets}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on-duty">On Duty</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="zone-a">Zone A</SelectItem>
                <SelectItem value="zone-b">Zone B</SelectItem>
                <SelectItem value="zone-c">Zone C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Riders List */}
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Active Riders ({filteredRiders.length})</h2>
            
            {filteredRiders.map((rider) => {
              const riderRunsheet = riderRunsheets.find(r => r.rider_id === rider.id);
              return (
                <div key={rider.id} className="p-6 rounded-lg border bg-card hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Rider Info */}
                    <div className="lg:col-span-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-bold text-primary">{rider.name.substring(0, 2)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{rider.name}</h3>
                          <p className="text-sm text-muted-foreground">{rider.id}</p>
                          <Badge className={`mt-2 ${getStatusColor(rider.current_status)}`}>
                            {rider.current_status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Current Runsheet */}
                    <div className="lg:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Current Runsheet</p>
                      {riderRunsheet ? (
                        <>
                          <p className="font-semibold text-foreground">{riderRunsheet.id}</p>
                          <p className="text-sm text-muted-foreground">Assigned: {riderRunsheet.orders_assigned.length}</p>
                          <p className="text-sm text-success">Status: {riderRunsheet.status}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No active runsheet</p>
                      )}
                    </div>

                    {/* Location & Contact */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Zone</p>
                          <p className="text-sm font-medium">{rider.zone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{rider.phone}</p>
                      </div>
                    </div>

                    {/* Performance */}
                    <div className="lg:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Performance</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivery Rate:</span>
                          <span className="font-semibold text-success">{rider.delivery_success_rate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Time:</span>
                          <span className="font-semibold">{rider.avg_delivery_time_minutes} mins</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Delivered Today:</span>
                          <span className="font-semibold">{rider.orders_delivered_today}</span>
                        </div>
                      </div>
                    </div>

                    {/* COD */}
                    <div className="lg:col-span-2">
                      <p className="text-xs text-muted-foreground mb-2">Collection</p>
                      <div className="space-y-1">
                        <div>
                          <p className="text-xs text-muted-foreground">COD Pending:</p>
                          <p className="text-lg font-bold text-warning">₹{rider.cod_outstanding.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Out for Delivery:</p>
                          <p className="text-base font-semibold text-primary">{rider.orders_out_for_delivery}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="lg:col-span-1 flex flex-col gap-2">
                      <Button size="sm" variant="outline" className="gap-2 justify-start">
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 justify-start">
                        <MapPin className="h-3 w-3" />
                        Track
                      </Button>
                      {riderRunsheet && (
                        <Link to={`/delivery/runsheets/${riderRunsheet.id}`}>
                          <Button size="sm" variant="default" className="w-full gap-2 justify-start">
                            <FileText className="h-3 w-3" />
                            Runsheet
                          </Button>
                        </Link>
                      )}
                      <Button size="sm" variant="outline" className="gap-2 justify-start">
                        <UserCheck className="h-3 w-3" />
                        Reassign
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-2 justify-start">
                        <UserX className="h-3 w-3" />
                        Suspend
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedRiderOverview;

