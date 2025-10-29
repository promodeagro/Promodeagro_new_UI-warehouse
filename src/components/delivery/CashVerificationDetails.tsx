import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  Package,
  Upload,
  FileText as FileTextIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const CashVerificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "rejected">("pending");

  // Dummy collection data
  const collectionData = {
    runsheetId: id || "RS-2025-001",
    collectionId: "CC-001",
    rider: {
      name: "Rajesh Kumar",
      id: "RD001",
      phone: "+91 98765 43210",
      zone: "Zone A"
    },
    date: "2025-01-11",
    expectedCOD: 32400,
    expectedPrepaid: 12000,
    totalOrders: 18,
    deliveredOrders: 12,
    codOrders: [
      {
        id: "ORD-001",
        customer: "Amit Singh",
        amount: 2400,
        status: "Delivered"
      },
      {
        id: "ORD-002",
        customer: "Priya Sharma",
        amount: 3200,
        status: "Delivered"
      },
      {
        id: "ORD-003",
        customer: "Vikram Yadav",
        amount: 4500,
        status: "Delivered"
      },
      {
        id: "ORD-004",
        customer: "Sneha Gupta",
        amount: 5600,
        status: "Delivered"
      },
      {
        id: "ORD-005",
        customer: "Rahul Verma",
        amount: 3800,
        status: "Delivered"
      },
    ]
  };

  const calculatedDifference = collectedAmount ? 
    Math.abs(collectionData.expectedCOD - parseFloat(collectedAmount)) : 0;

  const handleVerifyCollection = () => {
    if (!collectedAmount || !paymentMode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const collected = parseFloat(collectedAmount);
    const hasDiscrepancy = collected !== collectionData.expectedCOD;

    if (hasDiscrepancy && !discrepancyReason) {
      toast({
        title: "Discrepancy Reason Required",
        description: "Please provide a reason for the collection difference",
        variant: "destructive"
      });
      return;
    }

    setVerificationStatus("verified");
    
    toast({
      title: "✓ Collection Verified",
      description: `₹${collected.toLocaleString()} verified successfully`,
    });

    setTimeout(() => {
      navigate("/delivery/cash-collection");
    }, 2000);
  };

  const handleRejectCollection = () => {
    if (!verificationNotes) {
      toast({
        title: "Notes Required",
        description: "Please provide notes for rejection",
        variant: "destructive"
      });
      return;
    }

    setVerificationStatus("rejected");
    
    toast({
      title: "Collection Rejected",
      description: "Collection marked for review",
      variant: "destructive"
    });

    setTimeout(() => {
      navigate("/delivery/cash-collection");
    }, 2000);
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
                <h1 className="text-2xl font-bold text-foreground font-display">Verify Cash Collection</h1>
                <p className="text-sm text-muted-foreground">{collectionData.collectionId} - {collectionData.runsheetId}</p>
              </div>
            </div>
            <Badge 
              variant={
                verificationStatus === "verified" ? "default" :
                verificationStatus === "rejected" ? "destructive" :
                "outline"
              }
              className={
                verificationStatus === "verified" ? "bg-success text-success-foreground" :
                verificationStatus === "rejected" ? "bg-destructive text-destructive-foreground" :
                "bg-warning text-warning-foreground"
              }
            >
              {verificationStatus === "verified" ? "✓ Verified" :
               verificationStatus === "rejected" ? "✗ Rejected" :
               "⏳ Pending Verification"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Rider & Runsheet Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rider Details</p>
                  <p className="font-bold text-foreground">{collectionData.rider.name}</p>
                  <p className="text-sm text-muted-foreground">{collectionData.rider.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{collectionData.rider.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileTextIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Runsheet Info</p>
                  <p className="font-bold text-foreground">{collectionData.runsheetId}</p>
                  <p className="text-sm text-muted-foreground">Zone: {collectionData.rider.zone}</p>
                  <p className="text-xs text-muted-foreground mt-1">Date: {collectionData.date}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orders Delivered</p>
                  <p className="font-bold text-foreground">{collectionData.deliveredOrders}/{collectionData.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((collectionData.deliveredOrders / collectionData.totalOrders) * 100)}% completion
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Collection Verification Form */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <DollarSign className="h-5 w-5" />
              Cash Collection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Expected COD Amount</Label>
                <div className="text-3xl font-bold text-primary mt-2">
                  ₹{collectionData.expectedCOD.toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Expected Prepaid</Label>
                <div className="text-3xl font-bold text-success mt-2">
                  ₹{collectionData.expectedPrepaid.toLocaleString()}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Expected</Label>
                <div className="text-3xl font-bold text-foreground mt-2">
                  ₹{(collectionData.expectedCOD + collectionData.expectedPrepaid).toLocaleString()}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Collected COD Amount *</Label>
                <Input
                  type="number"
                  placeholder="Enter collected amount"
                  value={collectedAmount}
                  onChange={(e) => setCollectedAmount(e.target.value)}
                  className="mt-2 text-lg font-semibold"
                  disabled={verificationStatus !== "pending"}
                />
              </div>

              <div>
                <Label>Payment Mode *</Label>
                <Select 
                  value={paymentMode} 
                  onValueChange={setPaymentMode}
                  disabled={verificationStatus !== "pending"}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online Transfer</SelectItem>
                    <SelectItem value="mixed">Mixed (Cash + Online)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Transaction Reference (Optional)</Label>
                <Input
                  placeholder="Enter UPI/Bank reference"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="mt-2"
                  disabled={verificationStatus !== "pending"}
                />
              </div>

              <div>
                <Label>Upload Proof (Optional)</Label>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    className="w-full hover:border-primary/50" 
                    disabled={verificationStatus !== "pending"}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Screenshot/Receipt
                  </Button>
                </div>
              </div>
            </div>

            {calculatedDifference > 0 && collectedAmount && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <p className="font-bold text-foreground">Collection Discrepancy Detected</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Expected:</span>
                    <span className="font-bold text-foreground ml-2">₹{collectionData.expectedCOD.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Collected:</span>
                    <span className="font-bold text-foreground ml-2">₹{parseFloat(collectedAmount).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Difference:</span>
                    <span className="font-bold text-destructive ml-2">₹{calculatedDifference.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <Label>Discrepancy Reason *</Label>
                  <Textarea
                    placeholder="Explain the reason for the difference..."
                    value={discrepancyReason}
                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                    disabled={verificationStatus !== "pending"}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Verification Notes</Label>
              <Textarea
                placeholder="Add any additional notes about this verification..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="mt-2"
                rows={3}
                disabled={verificationStatus !== "pending"}
              />
            </div>
          </CardContent>
        </Card>

        {/* COD Orders Breakdown */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="font-display">COD Orders Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionData.codOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell className="font-bold">₹{order.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-success text-success-foreground">
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 sticky bottom-0 bg-gradient-background py-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => navigate("/delivery/cash-collection")}
            size="lg"
            className="hover:border-primary/50"
          >
            Cancel
          </Button>
          {verificationStatus === "pending" && (
            <>
              <Button 
                variant="destructive" 
                onClick={handleRejectCollection}
                size="lg"
                className="hover:bg-destructive/90"
              >
                Reject Collection
              </Button>
              <Button 
                onClick={handleVerifyCollection}
                size="lg"
                className="min-w-48 hover:shadow-lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify & Approve
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default CashVerificationDetails;

