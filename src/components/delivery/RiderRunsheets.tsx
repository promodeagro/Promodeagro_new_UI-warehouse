import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { riderRunsheets, riderOrders } from "@/data/riderData";

const RiderRunsheets = () => {
  const { riderId } = useParams();
  const navigate = useNavigate();

  const riderRunsheetsList = riderRunsheets.filter((r) => r.rider_id === riderId);

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Rider Runsheets</h1>
                <p className="text-sm text-muted-foreground">All runsheets assigned to this rider</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Runsheets</p>
                  <p className="text-3xl font-bold text-foreground">{riderRunsheetsList.length}</p>
                </div>
                <FileText className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active</p>
                  <p className="text-3xl font-bold text-accent">{riderRunsheetsList.filter(r => r.status === 'In Transit').length}</p>
                </div>
                <Package className="h-8 w-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold text-success">{riderRunsheetsList.filter(r => r.status === 'Completed').length}</p>
                </div>
                <FileText className="h-8 w-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Runsheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riderRunsheetsList.map((runsheet) => {
                const orders = riderOrders.filter(o => runsheet.orders_assigned.includes(o.id));
                return (
                  <div key={runsheet.id} className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">{runsheet.id}</h3>
                          <Badge variant={runsheet.status === 'In Transit' ? 'default' : 'outline'}>
                            {runsheet.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{runsheet.route_zone} • {orders.length} orders • {runsheet.estimated_time}</p>
                        <p className="text-xs text-muted-foreground mt-1">Date: {runsheet.run_date}</p>
                      </div>
                      <Link to={`/delivery/runsheets/${runsheet.id}`}>
                        <Button size="sm" variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
              {riderRunsheetsList.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No runsheets found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RiderRunsheets;

