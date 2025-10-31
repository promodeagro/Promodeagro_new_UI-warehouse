import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Truck, 
  UserCheck, 
  UserX, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Search,
  Phone,
  MapPin,
  Eye,
  FileText,
  Wallet
} from "lucide-react";
import { riders } from "@/data/dummyData";
import { Link } from "react-router-dom";
import { KPICard } from "@/components/KPICard";

const RiderOverview = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalRiders = riders.length;
  const activeRiders = riders.filter(r => r.active).length;
  const onDutyRiders = riders.filter(r => r.current_status === 'On Trip' || r.current_status === 'Busy').length;
  const offlineRiders = riders.filter(r => r.current_status === 'Offline').length;
  const outForDelivery = riders.reduce((sum, r) => sum + r.orders_out_for_delivery, 0);
  const idleRiders = riders.filter(r => r.current_status === 'Available').length;
  const completedToday = riders.reduce((sum, r) => sum + r.orders_delivered_today, 0);
  const pendingCash = riders.reduce((sum, r) => sum + r.cod_outstanding, 0);

  const filteredRiders = riders.filter(rider => {
    const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rider.phone.includes(searchQuery) ||
                         rider.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && rider.active) ||
                         (statusFilter === 'on-trip' && rider.current_status === 'On Trip') ||
                         (statusFilter === 'available' && rider.current_status === 'Available') ||
                         (statusFilter === 'offline' && rider.current_status === 'Offline');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-success/10 text-success border-success/20';
      case 'On Trip': return 'bg-primary/10 text-primary border-primary/20';
      case 'Busy': return 'bg-warning/10 text-warning border-warning/20';
      case 'Offline': return 'bg-muted text-muted-foreground border-muted';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rider Overview</h1>
          <p className="text-muted-foreground">Monitor and manage delivery riders in real-time</p>
        </div>
        <Link to="/delivery/rider-onboarding-queue">
          <Button>
            <Users className="h-4 w-4 mr-2" />
            View Onboarding Queue
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Riders" value={totalRiders} icon={Users} trend="+2 this month" />
        <KPICard title="Active Riders" value={activeRiders} icon={UserCheck} subtitle={`${offlineRiders} offline`} />
        <KPICard title="On Duty" value={onDutyRiders} icon={Truck} subtitle={`${idleRiders} idle`} />
        <KPICard title="Out for Delivery" value={outForDelivery} icon={Package} subtitle="orders in transit" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Completed Today" value={completedToday} icon={CheckCircle} trend="+18% from yesterday" trendUp />
        <KPICard title="Pending Cash" value={`₹${pendingCash.toLocaleString()}`} icon={DollarSign} subtitle="COD outstanding" />
        <KPICard title="Idle Riders" value={idleRiders} icon={Clock} subtitle="waiting for runsheet" />
        <KPICard title="Delayed" value={2} icon={AlertCircle} subtitle="needs attention" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Rider List</CardTitle>
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-trip">On Trip</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Runsheet</TableHead>
                <TableHead>Orders Assigned</TableHead>
                <TableHead>COD Outstanding</TableHead>
                <TableHead>Delivered Today</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.map((rider) => (
                <TableRow key={rider.id}>
                  <TableCell className="font-mono font-medium">{rider.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{rider.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {rider.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {rider.zone}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(rider.current_status)}>
                      {rider.current_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rider.current_runsheet_id ? (
                      <Link to={`/delivery/runsheets/${rider.current_runsheet_id}`}>
                        <Button variant="link" size="sm" className="font-mono p-0 h-auto">
                          {rider.current_runsheet_id}
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-medium">{rider.orders_out_for_delivery}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${rider.cod_outstanding > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                      ₹{rider.cod_outstanding.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="font-medium">{rider.orders_delivered_today}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(rider.last_seen).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link to={`/delivery/rider-runsheets/${rider.id}`}>
                        <Button variant="ghost" size="icon" title="Runsheet History">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" title="Collections">
                        <Wallet className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredRiders.length === 0 && (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No riders found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiderOverview;


