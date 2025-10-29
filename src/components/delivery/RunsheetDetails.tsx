import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, MapPin, Phone, Navigation } from "lucide-react";
import { Link } from "react-router-dom";
import { riderRunsheets, riderOrders } from "@/data/riderData";

const RunsheetDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const runsheet = riderRunsheets.find(r => r.id === id);

  if (!runsheet) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Runsheet not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedOrders = riderOrders.filter(o => runsheet.orders_assigned.includes(o.id));

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{runsheet.id}</h1>
              <p className="text-sm text-muted-foreground">{runsheet.rider_name} • {runsheet.route_zone}</p>
            </div>
            <Badge variant={runsheet.status === 'In Transit' ? 'default' : 'outline'} className="ml-auto">
              {runsheet.status}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{assignedOrders.length}</p>
                </div>
                <Package className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Time</p>
                  <p className="text-2xl font-bold text-foreground">{runsheet.estimated_time}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Zone</p>
                  <p className="text-2xl font-bold text-foreground">{runsheet.route_zone}</p>
                </div>
                <MapPin className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Orders in Runsheet</CardTitle>
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

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                    <Link to={`/delivery/rider/delivery/${order.id}`} className="flex-1">
                      <Button size="sm" variant="default" className="w-full">
                        Mark Status
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RunsheetDetails;

