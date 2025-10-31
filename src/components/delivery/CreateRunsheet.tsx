import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { riders, orders } from "@/data/dummyData";
import {
  FileText,
  Scan,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowLeft,
  Send
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const CreateRunsheet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  const [runsheetId] = useState(`RS-${Date.now().toString().slice(-8)}`);
  const [selectedRider, setSelectedRider] = useState("");
  const [runDate, setRunDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureTime, setDepartureTime] = useState("09:00");
  const [zone, setZone] = useState("");
  const [hub, setHub] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [notes, setNotes] = useState("");
  const [scannerValue, setScannerValue] = useState("");
  const [scannedOrders, setScannedOrders] = useState<typeof orders>([]);
  const [scanMode, setScanMode] = useState(false);

  const availableRiders = riders.filter(r => r.active && r.current_status === 'Available');
  const availableOrders = orders.filter(o => o.status === 'Packed' || o.status === 'Accepted');
  const zones = Array.from(new Set(orders.map(o => o.zone))).sort();

  useEffect(() => {
    if (scanMode && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scanMode]);

  const handleScanOrder = (orderId: string) => {
    const trimmedId = orderId.trim();
    if (!trimmedId) return;

    // Check if already scanned
    if (scannedOrders.find(o => o.order_number === trimmedId || o.id === trimmedId)) {
      toast({
        title: "Duplicate Order",
        description: `Order ${trimmedId} already added to runsheet`,
        variant: "destructive"
      });
      setScannerValue("");
      return;
    }

    // Find order
    const order = availableOrders.find(o => o.order_number === trimmedId || o.id === trimmedId);
    if (order) {
      setScannedOrders(prev => [...prev, order]);
      toast({
        title: "✓ Order Added",
        description: `${order.order_number} - ${order.customer_name}`,
      });
      setScannerValue("");
    } else {
      toast({
        title: "Invalid Order",
        description: `Order ${trimmedId} not found or not ready for dispatch`,
        variant: "destructive"
      });
      setScannerValue("");
    }
  };

  const handleRemoveOrder = (orderId: string) => {
    setScannedOrders(prev => prev.filter(o => o.id !== orderId));
    toast({
      title: "Order Removed",
      description: "Order removed from runsheet"
    });
  };

  const totalCOD = scannedOrders.filter(o => o.payment_mode === 'COD').reduce((sum, o) => sum + o.total_amount, 0);
  const totalPrepaid = scannedOrders.filter(o => o.payment_mode === 'Online').reduce((sum, o) => sum + o.total_amount, 0);

  const handleCreateRunsheet = () => {
    if (!selectedRider) {
      toast({
        title: "Validation Error",
        description: "Please select a rider",
        variant: "destructive"
      });
      return;
    }

    if (scannedOrders.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one order",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "✓ Runsheet Created",
      description: `${runsheetId} assigned to rider with ${scannedOrders.length} orders`,
    });

    setTimeout(() => {
      navigate('/delivery/runsheets');
    }, 1500);
  };

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
                <h1 className="text-2xl font-bold text-foreground">Create Runsheet</h1>
                <p className="text-sm text-muted-foreground">Assign orders to rider for delivery</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={handleCreateRunsheet}>
                <Send className="h-4 w-4 mr-2" />
                Create & Notify Rider
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Runsheet Details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Runsheet Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Runsheet ID</Label>
                  <Input value={runsheetId} disabled className="font-mono" />
                </div>

                <div>
                  <Label>Select Rider *</Label>
                  <Select value={selectedRider} onValueChange={setSelectedRider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose rider" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRiders.map(rider => (
                        <SelectItem key={rider.id} value={rider.id}>
                          {rider.name} - {rider.vehicle_type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRider && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {riders.find(r => r.id === selectedRider)?.phone}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={runDate} onChange={(e) => setRunDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Departure Time</Label>
                    <Input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label>Zone / Route</Label>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Hub</Label>
                  <Input value={hub} onChange={(e) => setHub(e.target.value)} placeholder="e.g., Main Warehouse" />
                </div>

                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Express">Express</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions for rider..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Runsheet Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders:</span>
                  <span className="font-bold text-foreground">{scannedOrders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">COD Orders:</span>
                  <span className="font-medium text-warning">{scannedOrders.filter(o => o.payment_mode === 'COD').length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prepaid Orders:</span>
                  <span className="font-medium text-success">{scannedOrders.filter(o => o.payment_mode === 'Online').length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total COD:</span>
                  <span className="font-bold text-warning">₹{totalCOD.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Prepaid:</span>
                  <span className="font-bold text-success">₹{totalPrepaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t">
                  <span className="font-medium text-foreground">Grand Total:</span>
                  <span className="font-bold text-primary">₹{(totalCOD + totalPrepaid).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Scanner & Orders */}
          <div className="lg:col-span-2 space-y-6">
            {/* Scanner Card */}
            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Scan className="h-5 w-5 text-primary" />
                    Order Scanner
                  </CardTitle>
                  <Button 
                    variant={scanMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setScanMode(!scanMode)}
                  >
                    {scanMode ? "Scanner Active" : "Activate Scanner"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        ref={scannerInputRef}
                        value={scannerValue}
                        onChange={(e) => setScannerValue(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleScanOrder(scannerValue);
                          }
                        }}
                        placeholder="Scan barcode or enter Order ID manually..."
                        className="pr-10 font-mono"
                      />
                      {scanMode && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        </div>
                      )}
                    </div>
                    <Button onClick={() => handleScanOrder(scannerValue)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                      <Scan className="h-4 w-4 text-accent" />
                      <span className="text-foreground">Supports QR Code & 1D/2D Barcode</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-foreground">Real-time validation & feedback</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scanned Orders List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Scanned Orders ({scannedOrders.length})</CardTitle>
                  {scannedOrders.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setScannedOrders([])}>
                      Clear All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {scannedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No orders added yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Scan or enter Order IDs to add them to this runsheet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scannedOrders.map((order, index) => (
                      <div key={order.id} className="flex items-start gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors bg-card">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header Row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-mono text-sm font-bold text-foreground">{order.order_number}</p>
                            <Badge variant={order.payment_mode === 'COD' ? 'secondary' : 'default'} className="text-xs">
                              {order.payment_mode}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                          
                          {/* Customer Details */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Customer:</span>
                              <span className="text-sm text-foreground">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-foreground">Phone:</span>
                              <span className="text-xs text-muted-foreground">{order.customer_phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-foreground">Address:</span>
                              <span className="text-xs text-muted-foreground">{order.address}</span>
                            </div>
                          </div>

                          {/* Items List */}
                          <div className="bg-muted/30 p-2 rounded space-y-1">
                            <p className="text-xs font-semibold text-foreground mb-1">Items ({order.items.length}):</p>
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{item.product_name} x {item.quantity}</span>
                                <span className="font-medium text-foreground">₹{item.subtotal}</span>
                              </div>
                            ))}
                          </div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-between pt-1 border-t">
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground">Zone: {order.zone}</span>
                              <span className="text-muted-foreground">Slot: {order.delivery_slot}</span>
                            </div>
                            <span className="font-bold text-primary">₹{order.total_amount}</span>
                          </div>
                          
                          {order.notes && (
                            <div className="bg-warning/10 p-2 rounded border border-warning/20">
                              <p className="text-xs text-warning font-medium">Note: {order.notes}</p>
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveOrder(order.id)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateRunsheet;


