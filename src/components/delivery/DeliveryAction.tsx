import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { riderOrders } from "@/data/riderData";
import { ArrowLeft, Upload, CheckCircle2, XCircle, Camera } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// StatusBadge component inline since OrderStatus types differ
const StatusBadge = ({ status }: { status: string }) => {
  const statusColors: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
    'Placed': { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    'Accepted': { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    'Packed': { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
    'Dispatched': { variant: "outline", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    'Delivered': { variant: "default", className: "bg-primary text-primary-foreground" },
    'Cancelled': { variant: "destructive", className: "" },
    'Returned': { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    'Failed': { variant: "destructive", className: "" }
  };
  const config = statusColors[status] || { variant: "outline" as const, className: "" };
  return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
};

const DeliveryAction = () => {
  const { id } = useParams();
  const order = riderOrders.find(o => o.id === id);
  const [deliveryStatus, setDeliveryStatus] = useState<"delivered" | "failed" | "rescheduled">("delivered");
  const [codAmount, setCodAmount] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    // TODO: Integrate with API when backend is ready
    console.log({
      orderId: order.id,
      status: deliveryStatus,
      codAmount: order.payment_mode === 'COD' ? codAmount : null,
      failureReason,
      proofImage
    });
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/delivery/rider-portal">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Update Delivery Status</h1>
              <p className="text-sm text-muted-foreground">{order.order_number}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <Card className="mb-6 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium text-foreground">{order.customer_name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium text-foreground">₹{order.total_amount}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Payment Mode</p>
              <p className="font-medium text-foreground">{order.payment_mode}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Current Status</p>
              <StatusBadge status={order.status} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={deliveryStatus} onValueChange={(v) => setDeliveryStatus(v as any)}>
              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors">
                <RadioGroupItem value="delivered" id="delivered" />
                <Label htmlFor="delivered" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Delivered Successfully</p>
                      <p className="text-sm text-muted-foreground">Order was delivered to customer</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors mt-3">
                <RadioGroupItem value="failed" id="failed" />
                <Label htmlFor="failed" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="font-medium text-foreground">Failed Delivery</p>
                      <p className="text-sm text-muted-foreground">Customer not available or refused</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:border-primary transition-colors mt-3">
                <RadioGroupItem value="rescheduled" id="rescheduled" />
                <Label htmlFor="rescheduled" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Reschedule</p>
                      <p className="text-sm text-muted-foreground">Need to attempt delivery later</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {deliveryStatus === "delivered" && (
          <>
            <Card className="mb-6 hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>Delivery Proof</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proof">Upload Photo or Signature</Label>
                    <div className="mt-2 flex items-center gap-3">
                      <Input
                        id="proof"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                        className="flex-1"
                      />
                      <Button variant="outline" size="icon">
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Take a photo of delivered items or customer signature
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.payment_mode === 'COD' && (
              <Card className="mb-6 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>COD Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="cod">Amount Collected</Label>
                    <Input
                      id="cod"
                      type="number"
                      placeholder="Enter collected amount"
                      value={codAmount}
                      onChange={(e) => setCodAmount(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Expected: ₹{order.total_amount}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {(deliveryStatus === "failed" || deliveryStatus === "rescheduled") && (
          <Card className="mb-6 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Reason</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter reason for failed/rescheduled delivery"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Provide details about why delivery couldn't be completed
              </p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Link to="/delivery/rider-portal" className="flex-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button className="flex-1" onClick={handleSubmit}>
            Submit Update
          </Button>
        </div>
      </main>
    </div>
  );
};

export default DeliveryAction;

