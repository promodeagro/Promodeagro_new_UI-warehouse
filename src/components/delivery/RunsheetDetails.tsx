import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Package,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orders as dummyOrders, runsheets as dummyRunsheets, riders } from "@/data/dummyData";

const RunsheetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [invalidOrderDialog, setInvalidOrderDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [invalidReason, setInvalidReason] = useState("");
  const [invalidNotes, setInvalidNotes] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  // Load runsheet and orders dynamically (dummy data + localStorage overrides)
  const { runsheet, runsheetOrders } = useMemo(() => {
    // Merge runsheets: dummy + localStorage (created runsheets)
    let allRunsheets = [...dummyRunsheets];
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed = JSON.parse(storedRunsheets);
        const existingIds = new Set(allRunsheets.map(r => r.id));
        const onlyNew = Array.isArray(parsed) ? parsed.filter((r: any) => !existingIds.has(r.id)) : [];
        allRunsheets = [...allRunsheets, ...onlyNew];
      }
    } catch {}

    const currentRunsheet = allRunsheets.find(r => r.id === id) || allRunsheets[0] || null;

    // Merge orders: dummy + localStorage updates
    let allOrders = [...dummyOrders];
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: any) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }
    } catch {}

    const orderIds = currentRunsheet?.orders_assigned || [];
    const rsOrders = orderIds
      .map(oid => allOrders.find(o => o.id === oid))
      .filter(Boolean)
      .map(o => {
        // Derive delivery status:
        // - If order is Delivered → 'Delivered'
        // - Else if runsheet is not Completed (Created/In Transit) → 'On the way'
        // - Else fallback to the order's status or 'Pending'
        let deliveryStatus = 'Pending';
        const orderStatus = (o!.status || '').toString();
        if (orderStatus.toLowerCase() === 'delivered') {
          deliveryStatus = 'Delivered';
        } else if ((currentRunsheet?.status || '').toString().toLowerCase() !== 'completed') {
          deliveryStatus = 'On the way';
        } else if (orderStatus) {
          deliveryStatus = orderStatus;
        }

        return {
          id: o!.order_number || o!.id,
          customer_name: o!.customer_name,
          address: o!.address,
          pincode: (o!.address || '').match(/(\d{6})/)?.[1] || '',
          payment_mode: o!.payment_mode === 'Online' ? 'Online' : 'COD',
          delivery_status: deliveryStatus,
          amount: o!.total_amount || 0,
        };
      });

    return { runsheet: currentRunsheet, runsheetOrders: rsOrders };
  }, [id]);

  const riderInfo = useMemo(() => riders.find(r => r.id === runsheet?.rider_id), [runsheet]);

  // Defensive guards to avoid blank screen
  const safeRunsheetId = runsheet?.id || id || 'RS-UNKNOWN';
  const safeRunDate = runsheet?.run_date || new Date().toISOString().split('T')[0];
  const ordersList = Array.isArray(runsheetOrders) ? runsheetOrders : [];

  const expectedPrepaid = runsheetOrders
    .filter(o => o.payment_mode === "Online")
    .reduce((sum, o) => sum + o.amount, 0);

  const expectedCOD = runsheetOrders
    .filter(o => o.payment_mode === "COD")
    .reduce((sum, o) => sum + o.amount, 0);

  const handleMarkInvalid = (order: any) => {
    setSelectedOrder(order);
    setInvalidOrderDialog(true);
  };

  const handleSubmitInvalidOrder = () => {
    if (!invalidReason) {
      toast({
        title: "Error",
        description: "Please select a reason",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Order Marked Invalid",
      description: `${selectedOrder.id} has been marked as invalid`,
    });

    setInvalidOrderDialog(false);
    setInvalidReason("");
    setInvalidNotes("");
  };

  const handleVerifyCollection = () => {
    if (!collectedAmount || !paymentMode) {
      toast({
        title: "Missing Information",
        description: "Please enter collected amount and payment mode",
        variant: "destructive",
      });
      return;
    }

    const collected = parseFloat(collectedAmount);
    const difference = Math.abs(expectedCOD - collected);

    if (difference > 0) {
      toast({
        title: "Collection Mismatch",
        description: `Difference of ₹${difference}. Verification completed with discrepancy.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Collection Verified",
        description: `₹${collected} verified successfully`,
      });
    }

    setIsVerified(true);
  };

  const handleCloseRunsheet = () => {
    if (!isVerified) {
      toast({
        title: "Cannot Close",
        description: "Please verify collection first",
        variant: "destructive",
      });
      return;
    }

    setIsClosed(true);
    toast({
      title: "Runsheet Closed",
      description: "Runsheet has been closed successfully",
    });
    
    // Navigate back after a short delay
    setTimeout(() => navigate(-1), 1500);
  };

  const handleSaveRunsheet = () => {
    toast({
      title: "Runsheet Saved",
      description: "All changes have been saved successfully",
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{safeRunsheetId}</h1>
                <p className="text-sm text-muted-foreground">Runsheet Details & Verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{riderInfo?.name}</span>
                  <span className="text-muted-foreground">({riderInfo?.id})</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{safeRunDate}</span>
                </div>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {runsheet?.status === 'In Transit' ? 'In Progress' : runsheet?.status || 'Created'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Order List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Delivery Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No orders found for this runsheet
                    </TableCell>
                  </TableRow>
                ) : ordersList.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{order.address}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="default"
                        className={
                          order.payment_mode === "Online"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-black text-white hover:bg-black/90"
                        }
                      >
                        {order.payment_mode === "Online" ? "Prepaid" : "COD"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.delivery_status === "Delivered"
                            ? "default"
                            : order.delivery_status === "Returned"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          order.delivery_status === "Delivered"
                            ? "bg-green-600"
                            : order.delivery_status === "On the way"
                            ? "bg-blue-600 text-white"
                            : order.delivery_status === "Pending"
                            ? "bg-amber-600 text-white"
                            : ""
                        }
                      >
                        {order.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">₹{order.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkInvalid(order)}
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Mark Invalid
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cash Collection Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cash Collection & Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Expected COD Amount</Label>
                <div className="text-2xl font-bold text-primary mt-2">
                  ₹{expectedCOD.toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Collected Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter collected amount"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="partial">Partial (Cash + Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {collectedAmount && expectedCOD !== parseFloat(collectedAmount) && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <p className="font-medium text-amber-900">Collection Mismatch</p>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Difference: ₹{Math.abs(expectedCOD - parseFloat(collectedAmount || "0")).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex justify-between items-end pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Expected Prepaid</p>
                <p className="text-lg font-bold text-green-600">₹{expectedPrepaid.toLocaleString()}</p>
              </div>
              
              {/* 3 Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  View Details
                </Button>
                <Button 
                  onClick={handleVerifyCollection}
                  disabled={isVerified || isClosed}
                  className={isVerified ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isVerified ? "✓ Verified" : "Verify Collection"}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCloseRunsheet}
                  disabled={!isVerified || isClosed}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isClosed ? "Runsheet Closed" : "Close Runsheet"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Invalid Order Dialog */}
      <Dialog open={invalidOrderDialog} onOpenChange={setInvalidOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Invalid</DialogTitle>
            <DialogDescription>
              Order: {selectedOrder?.id} - {selectedOrder?.customer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Reason</Label>
              <Select value={invalidReason} onValueChange={setInvalidReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_cancelled">Customer Cancelled</SelectItem>
                  <SelectItem value="wrong_address">Wrong Address</SelectItem>
                  <SelectItem value="damaged_item">Damaged Item</SelectItem>
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add additional notes..."
                value={invalidNotes}
                onChange={(e) => setInvalidNotes(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setInvalidOrderDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSubmitInvalidOrder}>
                <XCircle className="h-4 w-4 mr-2" />
                Mark Invalid
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RunsheetDetails;


