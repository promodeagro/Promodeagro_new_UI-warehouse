import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orders, riders } from "@/data/dummyData";

const CloseRunsheet = () => {
  const { runsheetId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Dummy runsheet data
  const runsheet = {
    id: runsheetId || 'RS-2025-001',
    rider_id: 'R001',
    rider_name: 'Suresh Kumar',
    date: '2025-01-10',
    zone: 'Zone A',
    status: 'In Transit',
    orders: orders.slice(0, 3),
  };

  const rider = riders.find(r => r.id === runsheet.rider_id);

  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'mismatch'>('pending');
  const [isClosed, setIsClosed] = useState(false);

  // Calculate totals
  const totalOrders = runsheet.orders.length;
  const deliveredOrders = runsheet.orders.filter(o => o.status === 'Delivered').length;
  const codOrders = runsheet.orders.filter(o => o.payment_mode === 'COD');
  const prepaidOrders = runsheet.orders.filter(o => o.payment_mode === 'Online');
  const expectedCOD = codOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const totalPrepaid = prepaidOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const grandTotal = expectedCOD + totalPrepaid;

  const handleVerifyCollection = () => {
    const collected = parseFloat(collectedAmount);
    
    if (isNaN(collected)) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (Math.abs(collected - expectedCOD) < 0.01) {
      setVerificationStatus('verified');
      toast({
        title: "✓ Collection Verified",
        description: `Amount matches expected COD: ₹${expectedCOD}`,
      });
    } else {
      setVerificationStatus('mismatch');
      toast({
        title: "⚠ Amount Mismatch",
        description: `Expected: ₹${expectedCOD}, Collected: ₹${collected}`,
        variant: "destructive",
      });
    }
  };

  const handleCloseRunsheet = () => {
    if (verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "Please verify collection before closing runsheet",
        variant: "destructive",
      });
      return;
    }

    setIsClosed(true);
    toast({
      title: "✓ Runsheet Closed",
      description: `${runsheet.id} has been closed successfully`,
    });

    setTimeout(() => {
      navigate('/delivery/runsheets');
    }, 2000);
  };

  const difference = collectedAmount ? parseFloat(collectedAmount) - expectedCOD : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/delivery/runsheets">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Close Runsheet</h1>
                <p className="text-sm text-muted-foreground">Verify collections and close runsheet</p>
              </div>
            </div>
            <Badge variant={isClosed ? "default" : "secondary"} className="text-sm px-4 py-2">
              {isClosed ? "Closed" : runsheet.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Runsheet Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Runsheet Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Runsheet ID</Label>
                  <p className="font-mono font-bold text-foreground">{runsheet.id}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">Rider</Label>
                  <p className="font-medium text-foreground">{runsheet.rider_name}</p>
                  <p className="text-xs text-muted-foreground">{rider?.phone}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="text-sm font-medium text-foreground">{runsheet.date}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Zone</Label>
                    <p className="text-sm font-medium text-foreground">{runsheet.zone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Delivery Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders:</span>
                  <span className="font-bold text-foreground">{totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Delivered:</span>
                  <span className="font-bold text-success">{deliveredOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate:</span>
                  <span className="font-bold text-primary">
                    {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Collection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">COD Expected:</span>
                  <span className="font-bold text-warning">₹{expectedCOD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Prepaid Total:</span>
                  <span className="font-bold text-success">₹{totalPrepaid.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Grand Total:</span>
                  <span className="font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Orders & Verification */}
          <div className="lg:col-span-2 space-y-6">
            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runsheet.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>
                          <Badge variant={order.payment_mode === 'COD' ? 'secondary' : 'default'}>
                            {order.payment_mode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{order.total_amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Cash Collection & Verification */}
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle>Cash Collection & Verification</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Expected COD Amount</Label>
                    <Input 
                      value={`₹${expectedCOD.toFixed(2)}`} 
                      disabled 
                      className="font-bold text-lg bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Collected Amount *</Label>
                    <Input 
                      type="number"
                      value={collectedAmount}
                      onChange={(e) => setCollectedAmount(e.target.value)}
                      placeholder="Enter collected amount"
                      className="font-bold text-lg"
                      disabled={verificationStatus === 'verified'}
                    />
                  </div>
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {collectedAmount && (
                  <div className={`p-4 rounded-lg border ${
                    difference === 0 ? 'bg-success/10 border-success/20' : 
                    difference > 0 ? 'bg-warning/10 border-warning/20' : 
                    'bg-destructive/10 border-destructive/20'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {difference === 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : difference > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-semibold text-foreground">
                        {difference === 0 ? 'Amount Match' : difference > 0 ? 'Excess Amount' : 'Shortage'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Difference: <span className="font-bold">₹{Math.abs(difference).toFixed(2)}</span>
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-3">
                  <Button 
                    onClick={handleVerifyCollection}
                    disabled={!collectedAmount || verificationStatus === 'verified'}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify Collection
                  </Button>
                  <Button 
                    onClick={handleCloseRunsheet}
                    disabled={verificationStatus !== 'verified' || isClosed}
                    variant="default"
                    className="flex-1"
                  >
                    Close Runsheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CloseRunsheet;


