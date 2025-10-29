import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Package } from "lucide-react";
import { riders, riderOrders } from "@/data/riderData";

const CreateRunsheet = () => {
  const navigate = useNavigate();
  const [selectedRider, setSelectedRider] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [zone, setZone] = useState("");

  const availableOrders = riderOrders.filter(o => o.status === 'Packed' || o.status === 'Accepted');

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreate = () => {
    // TODO: Integrate with API when backend is ready
    console.log({ selectedRider, selectedOrders, zone });
    navigate("/delivery/runsheets");
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Runsheet</h1>
              <p className="text-sm text-muted-foreground">Assign orders to a rider for delivery</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <Card className="mb-6 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Runsheet Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rider">Select Rider</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger id="rider" className="mt-2">
                  <SelectValue placeholder="Choose a rider" />
                </SelectTrigger>
                <SelectContent>
                  {riders.filter(r => r.current_status === 'Available').map(rider => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.name} ({rider.zone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zone">Zone</Label>
              <Input
                id="zone"
                placeholder="Enter delivery zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Select Orders</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose orders to include in this runsheet ({selectedOrders.length} selected)
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {availableOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => handleToggleOrder(order.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedOrders.includes(order.id)
                      ? 'border-primary bg-primary/5'
                      : 'bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mt-0.5 ${
                        selectedOrders.includes(order.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedOrders.includes(order.id) && (
                          <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.order_number}</p>
                        <p className="text-sm text-foreground mt-1">{order.address}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.items.length} items • ₹{order.total_amount} • {order.payment_mode}
                        </p>
                      </div>
                    </div>
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {availableOrders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No available orders</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!selectedRider || selectedOrders.length === 0 || !zone}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Runsheet
          </Button>
        </div>
      </main>
    </div>
  );
};

export default CreateRunsheet;

