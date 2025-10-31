import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Search,
  Plus,
  Package,
  IndianRupee,
  TrendingUp,
  Filter,
  Eye,
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { runsheets, orders } from "@/data/dummyData";

const RunsheetManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "pending" | "invalid" | "cash-pending" | "completed" | "closed">("active");
  
  const filteredRunsheets = runsheets.filter(runsheet => {
    const matchesSearch = runsheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      runsheet.rider_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "active") return matchesSearch && runsheet.status === "In Transit";
    if (activeTab === "completed") return matchesSearch && runsheet.status === "Completed";
    if (activeTab === "pending") return matchesSearch && runsheet.status === "Created";
    if (activeTab === "closed") return matchesSearch && runsheet.status === "Completed";
    
    return matchesSearch;
  });

  const totalOrders = runsheets.reduce((sum, r) => sum + r.orders_assigned.length, 0);
  const allRunsheetOrders = runsheets.flatMap(r => 
    r.orders_assigned.map(orderId => orders.find(o => o.id === orderId)).filter(Boolean)
  );
  const totalPrepaid = allRunsheetOrders
    .filter(o => o?.payment_mode === 'Online')
    .reduce((sum, o) => sum + (o?.total_amount || 0), 0);
  const totalCOD = allRunsheetOrders
    .filter(o => o?.payment_mode === 'COD')
    .reduce((sum, o) => sum + (o?.total_amount || 0), 0);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Runsheet Management</h1>
              <p className="text-sm text-muted-foreground">Create and manage delivery batches</p>
            </div>
            <Link to="/delivery/create-runsheet">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Runsheet
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Runsheets</p>
                  <p className="text-3xl font-bold text-foreground">{runsheets.length}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-foreground">{totalOrders}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Prepaid Total</p>
                  <p className="text-2xl font-bold text-success">₹{totalPrepaid.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">COD Expected</p>
                  <p className="text-2xl font-bold text-warning">₹{totalCOD.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => setActiveTab("active")}
            className="gap-2"
          >
            🟢 Active Runsheets
          </Button>
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => setActiveTab("pending")}
            className="gap-2"
          >
            🟡 Pending Verification
          </Button>
          <Button
            variant={activeTab === "completed" ? "default" : "outline"}
            onClick={() => setActiveTab("completed")}
            className="gap-2"
          >
            ✅ Completed Runsheets
          </Button>
          <Button
            variant={activeTab === "closed" ? "default" : "outline"}
            onClick={() => setActiveTab("closed")}
            className="gap-2"
          >
            🔒 Closed Runsheets
          </Button>
        </div>

        {/* Runsheets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeTab === "active" && "Active Runsheets"}
                {activeTab === "pending" && "Pending Verification"}
                {activeTab === "completed" && "Completed Runsheets"}
                {activeTab === "closed" && "Closed Runsheets"}
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search runsheets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredRunsheets.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No runsheets found</p>
              </div>
            ) : (
              filteredRunsheets.map((runsheet) => {
                const runsheetOrders = runsheet.orders_assigned
                  .map(orderId => orders.find(o => o.id === orderId))
                  .filter(Boolean);
                const totalOrders = runsheetOrders.length;
                const deliveredOrders = runsheetOrders.filter(o => o?.status === 'Delivered').length;
                const progress = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
                const prepaidTotal = runsheetOrders.filter(o => o?.payment_mode === 'Online').reduce((sum, o) => sum + (o?.total_amount || 0), 0);
                const codTotal = runsheetOrders.filter(o => o?.payment_mode === 'COD').reduce((sum, o) => sum + (o?.total_amount || 0), 0);

                return (
                  <div key={runsheet.id} className="p-5 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Runsheet ID & Status */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground">{runsheet.id}</h3>
                            <Badge variant={runsheet.status === 'In Transit' ? 'default' : 'outline'}>
                              {runsheet.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Created: 09:30 AM</p>
                          <p className="text-sm text-muted-foreground">Date: {runsheet.run_date}</p>
                        </div>
                      </div>

                      {/* Middle: Rider Info */}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Assigned Rider</p>
                        <p className="font-semibold text-foreground mb-1">{runsheet.rider_name}</p>
                        <p className="text-sm text-muted-foreground">{runsheet.rider_id}</p>
                        <p className="text-sm text-muted-foreground">Zone: {runsheet.route_zone}</p>
                      </div>

                      {/* Progress */}
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-2">Order Progress</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Delivered: {deliveredOrders}/{totalOrders}</span>
                            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>

                      {/* Financial */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Prepaid:</p>
                        <p className="text-lg font-bold text-success mb-2">₹{prepaidTotal.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mb-1">COD:</p>
                        <p className="text-lg font-bold text-warning">₹{codTotal.toLocaleString()}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Link to={`/delivery/runsheets/${runsheet.id}`}>
                          <Button size="sm" variant="outline" className="w-full gap-2">
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                        </Link>
                        <Link to={`/delivery/close-runsheet/${runsheet.id}`}>
                          <Button size="sm" variant="default" className="w-full gap-2">
                            <XCircle className="h-3 w-3" />
                            Close Runsheet
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RunsheetManagement;


