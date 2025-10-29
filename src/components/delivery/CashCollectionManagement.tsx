import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, AlertTriangle, CheckCircle, DollarSign, Clock, FileText } from "lucide-react";

const CashCollectionManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const codCollections = [
    {
      id: "RS-2025-001",
      collectionId: "CC-001",
      rider: { name: "Rajesh Kumar", id: "RD001" },
      date: "2025-01-11",
      expected: 32400,
      collected: 32400,
      difference: 0,
      mode: "CASH",
      status: "Collected",
      orders: { total: 18, delivered: 12 },
      verified: false,
    },
    {
      id: "RS-2025-002",
      collectionId: "CC-002",
      rider: { name: "Amit Singh", id: "RD002" },
      date: "2025-01-11",
      expected: 28900,
      collected: 27500,
      difference: -1400,
      mode: "CASH",
      status: "Partial",
      orders: { total: 22, delivered: 20 },
      verified: false,
      discrepancy: true,
    },
    {
      id: "RS-2025-003",
      collectionId: "CC-003",
      rider: { name: "Vikram Yadav", id: "RD004" },
      date: "2025-01-11",
      expected: 12500,
      collected: 12500,
      difference: 0,
      mode: "UPI",
      status: "Collected",
      orders: { total: 15, delivered: 8 },
      verified: true,
      reference: "REF: UPI-20250111454678",
    },
  ];

  const filteredCollections = codCollections.filter((collection) => {
    const matchesSearch =
      collection.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.rider.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All Status" || collection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalExpected = codCollections.reduce((sum, c) => sum + c.expected, 0);
  const totalCollected = codCollections.reduce((sum, c) => sum + c.collected, 0);
  const totalDiscrepancy = codCollections.reduce((sum, c) => sum + Math.abs(c.difference), 0);
  const pendingVerification = codCollections.filter((c) => !c.verified).length;

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground font-display">Cash Collection & Settlement</h1>
          <p className="text-sm text-muted-foreground">Verify and manage COD collections from riders</p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected COD</p>
                  <p className="text-2xl font-bold text-foreground">₹{totalExpected.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                  <p className="text-2xl font-bold text-success">₹{totalCollected.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Discrepancy</p>
                  <p className="text-2xl font-bold text-destructive">₹{totalDiscrepancy.toLocaleString()}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="text-2xl font-bold text-warning">{pendingVerification}</p>
                </div>
                <Clock className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search runsheet, rider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Collections List */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground font-display">COD Collections ({filteredCollections.length})</h2>
        </div>

        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Runsheet Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-foreground">{collection.id}</h3>
                      </div>
                      <Badge
                        variant={
                          collection.status === "Collected" ? "default" :
                          collection.status === "Partial" ? "secondary" : "outline"
                        }
                      >
                        {collection.status}
                      </Badge>
                      {collection.verified && (
                        <Badge variant="default" className="bg-success">
                          Verified
                        </Badge>
                      )}
                      {collection.discrepancy && (
                        <Badge variant="destructive">Discrepancy</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{collection.collectionId}</p>
                  </div>

                  {/* Rider Details */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Rider Details</p>
                    <p className="font-medium text-foreground">{collection.rider.name}</p>
                    <p className="text-sm text-muted-foreground">{collection.rider.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">Date: {collection.date}</p>
                  </div>

                  {/* Collection Details */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Collection Details</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected:</span>
                        <span className="font-medium text-foreground">₹{collection.expected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Collected:</span>
                        <span className="font-medium text-success">₹{collection.collected.toLocaleString()}</span>
                      </div>
                      {collection.difference !== 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Difference:</span>
                          <span className="font-medium text-destructive">₹{Math.abs(collection.difference).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mode:</span>
                        <span className="font-medium text-foreground">{collection.mode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Orders Info */}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Orders</p>
                    <p className="font-medium text-foreground">
                      Delivered: {collection.orders.delivered}/{collection.orders.total}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round((collection.orders.delivered / collection.orders.total) * 100)}% completion
                    </p>
                    {collection.reference && (
                      <p className="text-xs text-muted-foreground mt-2">{collection.reference}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      className="whitespace-nowrap hover:shadow-md"
                      onClick={() => navigate(`/delivery/cash-verification/${collection.id}`)}
                    >
                      <CheckCircle className="h-3 w-3 mr-2" />
                      Verify
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="whitespace-nowrap hover:border-primary/50"
                      onClick={() => navigate(`/delivery/collection-details/${collection.id}`)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CashCollectionManagement;

