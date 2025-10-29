import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { riderRunsheets, riderOrders, riders } from "@/data/riderData";
import { MapPin, Phone, Package, Navigation, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

const RiderPortal = () => {
  // Simulate logged-in rider (in real app, get from auth)
  const currentRiderId = "R001";
  const rider = riders.find(r => r.id === currentRiderId);
  const assignedRunsheets = riderRunsheets.filter(r => r.rider_id === currentRiderId);

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rider Portal</h1>
            <p className="text-sm text-muted-foreground">Welcome, {rider?.name}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{assignedRunsheets.length}</p>
                  <p className="text-sm text-muted-foreground">Assigned Runsheets</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{rider?.rating}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{rider?.total_deliveries}</p>
                  <p className="text-sm text-muted-foreground">Total Deliveries</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">Today's Deliveries</h2>
          
          {assignedRunsheets.map((runsheet) => {
            const assignedOrders = riderOrders.filter(o => runsheet.orders_assigned.includes(o.id));
            
            return (
              <Card key={runsheet.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{runsheet.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">{runsheet.route_zone} • {runsheet.total_stops} stops • Est. {runsheet.estimated_time}</p>
                    </div>
                    <Badge variant={runsheet.status === 'In Transit' ? 'secondary' : 'outline'}>
                      {runsheet.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignedOrders.map((order, index) => (
                      <div key={order.id} className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{order.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{order.order_number}</p>
                            </div>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm text-foreground">{order.address}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-foreground">{order.customer_phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-foreground">{order.items.length} items • ₹{order.total_amount} ({order.payment_mode})</p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mb-4 p-3 bg-muted/50 rounded text-sm">
                            <p className="text-muted-foreground">Note: {order.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                          </Button>
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                          <Link to={`/delivery/rider/delivery/${order.id}`} className="flex-1">
                            <Button size="sm" variant="secondary" className="w-full">
                              Mark Status
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default RiderPortal;

