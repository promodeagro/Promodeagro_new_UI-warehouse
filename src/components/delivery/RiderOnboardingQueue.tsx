import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Eye, CheckCircle, XCircle, UserX, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type RiderStatus = "Pending" | "Active" | "Inactive" | "Rejected";

interface RiderApplication {
  id: string;
  rider_name: string;
  rider_id: string;
  mobile: string;
  city: string;
  vehicle_type: "2-Wheeler" | "3-Wheeler";
  license_number: string;
  aadhaar_number: string;
  pan_card: string;
  joining_date: string;
  status: RiderStatus;
  email?: string;
  dob?: string;
  address?: string;
  emergency_contact?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
}

const RiderOnboardingQueue = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "active" | "inactive" | "rejected">("all");
  const [selectedRider, setSelectedRider] = useState<RiderApplication | null>(null);
  const [viewDialog, setViewDialog] = useState(false);

  // Dummy data
  const riders: RiderApplication[] = [
    {
      id: "1",
      rider_name: "Rajesh Kumar",
      rider_id: "RD001",
      mobile: "+91 98111 11111",
      city: "Delhi",
      vehicle_type: "2-Wheeler",
      license_number: "DL-01-12345678",
      aadhaar_number: "1234-5678-9012",
      pan_card: "ABCDE1234F",
      joining_date: "2025-01-10",
      status: "Pending",
      dob: "1995-05-15",
      address: "123 Main St, Delhi",
      emergency_contact: "+91 98111 22222",
      bank_name: "HDFC Bank",
      account_number: "50200012345678",
      ifsc_code: "HDFC0001234",
      account_holder_name: "Rajesh Kumar",
    },
    {
      id: "2",
      rider_name: "Suresh Kumar",
      rider_id: "R001",
      mobile: "+91 98111 11111",
      city: "Delhi",
      vehicle_type: "2-Wheeler",
      license_number: "DL-01-AB-1234",
      aadhaar_number: "2345-6789-0123",
      pan_card: "FGHIJ5678K",
      joining_date: "2025-01-05",
      status: "Active",
    },
    {
      id: "3",
      rider_name: "Amit Verma",
      rider_id: "RD003",
      mobile: "+91 98111 33333",
      city: "Mumbai",
      vehicle_type: "3-Wheeler",
      license_number: "MH-01-98765432",
      aadhaar_number: "3456-7890-1234",
      pan_card: "KLMNO9012P",
      joining_date: "2025-01-12",
      status: "Inactive",
    },
  ];

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.rider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.rider_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.mobile.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && rider.status.toLowerCase() === activeTab;
  });

  const handleViewRider = (rider: RiderApplication) => {
    setSelectedRider(rider);
    setViewDialog(true);
  };

  const handleApprove = (riderId: string) => {
    toast({ title: "Rider Approved", description: `Rider ${riderId} has been activated` });
    setViewDialog(false);
  };

  const handleReject = (riderId: string) => {
    toast({ title: "Rider Rejected", description: `Rider ${riderId} has been rejected`, variant: "destructive" });
    setViewDialog(false);
  };

  const handleDeactivate = (riderId: string) => {
    toast({ title: "Rider Deactivated", description: `Rider ${riderId} has been deactivated` });
    setViewDialog(false);
  };

  const getStatusBadgeVariant = (status: RiderStatus) => {
    switch (status) {
      case "Active":
        return "default";
      case "Pending":
        return "secondary";
      case "Inactive":
        return "outline";
      case "Rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  const stats = {
    total: riders.length,
    pending: riders.filter((r) => r.status === "Pending").length,
    active: riders.filter((r) => r.status === "Active").length,
    inactive: riders.filter((r) => r.status === "Inactive").length,
    rejected: riders.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rider Onboarding Queue</h1>
              <p className="text-sm text-muted-foreground">Manage and review rider applications</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">All Riders</p>
                  <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-warning">{stats.pending}</p>
                </div>
                <Calendar className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-success">{stats.active}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Inactive</p>
                  <p className="text-3xl font-bold text-muted-foreground">{stats.inactive}</p>
                </div>
                <UserX className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rejected</p>
                  <p className="text-3xl font-bold text-destructive">{stats.rejected}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant={activeTab === "all" ? "default" : "outline"} onClick={() => setActiveTab("all")} size="sm">All</Button>
                <Button variant={activeTab === "pending" ? "default" : "outline"} onClick={() => setActiveTab("pending")} size="sm">Pending</Button>
                <Button variant={activeTab === "active" ? "default" : "outline"} onClick={() => setActiveTab("active")} size="sm">Active</Button>
                <Button variant={activeTab === "inactive" ? "default" : "outline"} onClick={() => setActiveTab("inactive")} size="sm">Inactive</Button>
                <Button variant={activeTab === "rejected" ? "default" : "outline"} onClick={() => setActiveTab("rejected")} size="sm">Rejected</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Riders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Rider Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider Name</TableHead>
                  <TableHead>Rider ID</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Vehicle Type</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No riders found</TableCell>
                  </TableRow>
                ) : (
                  filteredRiders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell className="font-medium">{rider.rider_name}</TableCell>
                      <TableCell>{rider.rider_id}</TableCell>
                      <TableCell>{rider.mobile}</TableCell>
                      <TableCell>{rider.city}</TableCell>
                      <TableCell>{rider.vehicle_type}</TableCell>
                      <TableCell>{rider.joining_date}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(rider.status)}>{rider.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewRider(rider)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {rider.status === "Pending" && (
                            <>
                              <Button size="sm" variant="default" onClick={() => handleApprove(rider.rider_id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(rider.rider_id)}>
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {rider.status === "Active" && (
                            <Button size="sm" variant="outline" onClick={() => handleDeactivate(rider.rider_id)}>
                              <UserX className="h-3 w-3 mr-1" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* View Rider Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rider Profile</DialogTitle>
            <DialogDescription>
              {selectedRider?.rider_name} - {selectedRider?.rider_id}
            </DialogDescription>
          </DialogHeader>
          {selectedRider && (
            <div className="space-y-6">
              {/* Personal Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedRider.rider_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DOB</p>
                    <p className="font-medium">{selectedRider.dob || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-medium">{selectedRider.mobile}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Emergency Contact</p>
                    <p className="font-medium">{selectedRider.emergency_contact || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedRider.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedRider.address || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rider ID</p>
                    <p className="font-medium">{selectedRider.rider_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joining Date</p>
                    <p className="font-medium">{selectedRider.joining_date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Vehicle Type</p>
                    <p className="font-medium">{selectedRider.vehicle_type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">City/Zone</p>
                    <p className="font-medium">{selectedRider.city}</p>
                  </div>
                </div>
              </div>

              {/* Identity Documents */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Identity Documents</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">License Number</p>
                      <p className="font-medium">{selectedRider.license_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Aadhaar Number</p>
                      <p className="font-medium">{selectedRider.aadhaar_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">PAN Card</p>
                      <p className="font-medium">{selectedRider.pan_card}</p>
                    </div>
                  </div>

                  {/* Document Upload/View Section */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm mb-3">Document Files</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Aadhaar Card</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">PAN Card</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Driving License</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700">Uploaded</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">Upload New</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Bank Account Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{selectedRider.bank_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account Holder Name</p>
                    <p className="font-medium">{selectedRider.account_holder_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Account Number</p>
                    <p className="font-medium">{selectedRider.account_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IFSC Code</p>
                    <p className="font-medium">{selectedRider.ifsc_code || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
                {selectedRider.status === "Pending" && (
                  <>
                    <Button variant="default" onClick={() => handleApprove(selectedRider.rider_id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleReject(selectedRider.rider_id)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedRider.status === "Active" && (
                  <Button variant="outline" onClick={() => handleDeactivate(selectedRider.rider_id)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiderOnboardingQueue;


