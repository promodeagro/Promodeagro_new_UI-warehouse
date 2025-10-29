import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Package,
  Phone,
  MapPin,
  FileText as FileTextIcon,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const CollectionDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Dummy collection detail data
  const collectionDetail = {
    runsheetId: id || "RS-2025-001",
    collectionId: "CC-001",
    status: "Collected",
    verified: true,
    verifiedBy: "Admin User",
    verifiedAt: "2025-01-11 15:45:00",
    rider: {
      name: "Rajesh Kumar",
      id: "RD001",
      phone: "+91 98765 43210",
      zone: "Zone A",
      vehicleNumber: "DL-01-AB-1234"
    },
    runsheet: {
      date: "2025-01-11",
      departureTime: "09:00 AM",
      completionTime: "14:30 PM",
      totalOrders: 18,
      deliveredOrders: 12,
      pendingOrders: 3,
      returnedOrders: 3
    },
    collection: {
      expectedCOD: 32400,
      collectedCOD: 32400,
      expectedPrepaid: 12000,
      difference: 0,
      paymentMode: "CASH",
      transactionRef: "N/A",
      discrepancyReason: null
    },
    orders: [
      {
        id: "ORD-001",
        customer: "Amit Singh",
        address: "123 MG Road, Delhi - 110001",
        paymentMode: "COD",
        amount: 2400,
        status: "Delivered",
        deliveryTime: "10:15 AM"
      },
      {
        id: "ORD-002",
        customer: "Priya Sharma",
        address: "456 Park Street, Delhi - 110002",
        paymentMode: "COD",
        amount: 3200,
        status: "Delivered",
        deliveryTime: "10:45 AM"
      },
      {
        id: "ORD-003",
        customer: "Vikram Yadav",
        address: "789 Ring Road, Delhi - 110003",
        paymentMode: "Online",
        amount: 4500,
        status: "Delivered",
        deliveryTime: "11:20 AM"
      },
      {
        id: "ORD-004",
        customer: "Sneha Gupta",
        address: "321 Mall Road, Delhi - 110004",
        paymentMode: "COD",
        amount: 5600,
        status: "Returned",
        deliveryTime: "N/A"
      },
      {
        id: "ORD-005",
        customer: "Rahul Verma",
        address: "654 South Ex, Delhi - 110005",
        paymentMode: "COD",
        amount: 3800,
        status: "Delivered",
        deliveryTime: "12:10 PM"
      },
    ],
    timeline: [
      { time: "09:00 AM", event: "Runsheet Created", status: "completed" },
      { time: "09:15 AM", event: "Rider Departed", status: "completed" },
      { time: "10:15 AM", event: "First Delivery Completed", status: "completed" },
      { time: "14:30 PM", event: "All Deliveries Completed", status: "completed" },
      { time: "15:00 PM", event: "Returned to Hub", status: "completed" },
      { time: "15:45 PM", event: "Collection Verified", status: "completed" }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/delivery/cash-collection")}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground font-display">Collection Details</h1>
                <p className="text-sm text-muted-foreground">
                  {collectionDetail.collectionId} - {collectionDetail.runsheetId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {collectionDetail.verified && (
                <Badge variant="default" className="bg-success text-success-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline">
                {collectionDetail.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expected COD</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{collectionDetail.collection.expectedCOD.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-warning opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collected COD</p>
                  <p className="text-2xl font-bold text-success">
                    ₹{collectionDetail.collection.collectedCOD.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Orders Delivered</p>
                  <p className="text-2xl font-bold text-foreground">
                    {collectionDetail.runsheet.deliveredOrders}/{collectionDetail.runsheet.totalOrders}
                  </p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold text-foreground">
                    {Math.round((collectionDetail.runsheet.deliveredOrders / collectionDetail.runsheet.totalOrders) * 100)}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rider & Runsheet Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <User className="h-5 w-5" />
                Rider Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rider Name:</span>
                <span className="font-bold text-foreground">{collectionDetail.rider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rider ID:</span>
                <span className="font-mono text-foreground">{collectionDetail.rider.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="text-foreground">{collectionDetail.rider.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zone:</span>
                <span className="text-foreground">{collectionDetail.rider.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Number:</span>
                <span className="font-mono text-foreground">{collectionDetail.rider.vehicleNumber}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <FileTextIcon className="h-5 w-5" />
                Runsheet Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Runsheet ID:</span>
                <span className="font-mono font-bold text-foreground">{collectionDetail.runsheetId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">{collectionDetail.runsheet.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departure Time:</span>
                <span className="text-foreground">{collectionDetail.runsheet.departureTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Time:</span>
                <span className="text-foreground">{collectionDetail.runsheet.completionTime}</span>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Delivered</p>
                  <p className="font-bold text-success">{collectionDetail.runsheet.deliveredOrders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending</p>
                  <p className="font-bold text-warning">{collectionDetail.runsheet.pendingOrders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Returned</p>
                  <p className="font-bold text-destructive">{collectionDetail.runsheet.returnedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Details */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <DollarSign className="h-5 w-5" />
              Collection Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected COD:</span>
                  <span className="font-bold text-foreground">₹{collectionDetail.collection.expectedCOD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Collected COD:</span>
                  <span className="font-bold text-success">₹{collectionDetail.collection.collectedCOD.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Expected Prepaid:</span>
                  <span className="font-bold text-foreground">₹{collectionDetail.collection.expectedPrepaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground font-medium">Difference:</span>
                  <span className={`font-bold ${collectionDetail.collection.difference === 0 ? 'text-success' : 'text-destructive'}`}>
                    ₹{collectionDetail.collection.difference.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <Badge variant="outline">{collectionDetail.collection.paymentMode}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction Ref:</span>
                  <span className="font-mono text-foreground">{collectionDetail.collection.transactionRef}</span>
                </div>
                {collectionDetail.verified && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Verified By:</span>
                      <span className="text-foreground">{collectionDetail.verifiedBy}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Verified At:</span>
                      <span className="text-foreground">{collectionDetail.verifiedAt}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Breakdown */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-display">Orders Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionDetail.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{order.address}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={order.paymentMode === "COD" ? "bg-warning/10 text-warning border-warning/20" : "bg-primary/10 text-primary border-primary/20"}
                      >
                        {order.paymentMode}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">₹{order.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={order.status === "Delivered" ? "default" : "destructive"}
                        className={order.status === "Delivered" ? "bg-success text-success-foreground" : ""}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{order.deliveryTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Clock className="h-5 w-5" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {collectionDetail.timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-success-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{event.event}</p>
                    <p className="text-sm text-muted-foreground">{event.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate("/delivery/cash-collection")}
            className="hover:border-primary/50"
          >
            Back to Collections
          </Button>
          <Button onClick={() => window.print()} className="hover:shadow-md">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Print Details
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CollectionDetailsView;

