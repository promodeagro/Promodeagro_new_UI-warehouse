import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
import { riders } from "@/data/dummyData";

// Dummy runsheet data for a specific rider
const getRiderRunsheets = (riderId: string) => {
  return [
    {
      id: 'RS-2025-001',
      date: '2025-01-10',
      zone: 'Zone A',
      status: 'Completed',
      totalOrders: 8,
      delivered: 8,
      codExpected: 2400,
      codCollected: 2400,
      prepaidTotal: 1850,
      completionRate: 100,
    },
    {
      id: 'RS-2025-002',
      date: '2025-01-09',
      zone: 'Zone A',
      status: 'Completed',
      totalOrders: 10,
      delivered: 9,
      codExpected: 3200,
      codCollected: 2900,
      prepaidTotal: 2100,
      completionRate: 90,
    },
    {
      id: 'RS-2025-003',
      date: '2025-01-08',
      zone: 'Zone A',
      status: 'Completed',
      totalOrders: 12,
      delivered: 12,
      codExpected: 4100,
      codCollected: 4100,
      prepaidTotal: 2800,
      completionRate: 100,
    },
  ];
};

const RiderRunsheets = () => {
  const { riderId } = useParams();
  const rider = riders.find(r => r.id === riderId);
  const runsheets = getRiderRunsheets(riderId || '');

  const totalRunsheets = runsheets.length;
  const totalDelivered = runsheets.reduce((sum, r) => sum + r.delivered, 0);
  const totalOrders = runsheets.reduce((sum, r) => sum + r.totalOrders, 0);
  const totalCODCollected = runsheets.reduce((sum, r) => sum + r.codCollected, 0);
  const avgCompletionRate = runsheets.reduce((sum, r) => sum + r.completionRate, 0) / runsheets.length;

  if (!rider) {
    return <div className="p-6">Rider not found</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/delivery/rider-overview">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">Runsheet History</h1>
          <p className="text-muted-foreground">{rider.name} - {rider.id}</p>
        </div>
      </div>

      {/* Rider Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runsheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{totalRunsheets}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-success" />
              <span className="text-2xl font-bold text-foreground">{totalDelivered}</span>
              <span className="text-sm text-muted-foreground">/ {totalOrders}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">COD Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold text-foreground">₹{totalCODCollected.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{avgCompletionRate.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Runsheet List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">All Runsheets</h2>
        {runsheets.map((runsheet) => (
          <Card key={runsheet.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left: Runsheet Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Runsheet ID</p>
                    <p className="font-mono font-bold text-foreground">{runsheet.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium text-foreground">{runsheet.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Zone</p>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {runsheet.zone}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant="default">{runsheet.status}</Badge>
                </div>

                {/* Middle: Order Progress */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Order Progress</p>
                      <p className="text-sm font-bold text-foreground">
                        {runsheet.delivered} / {runsheet.totalOrders}
                      </p>
                    </div>
                    <Progress value={runsheet.completionRate} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {runsheet.completionRate}% completion rate
                    </p>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Orders:</span>
                      <span className="font-medium text-foreground">{runsheet.totalOrders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivered:</span>
                      <span className="font-medium text-success">{runsheet.delivered}</span>
                    </div>
                  </div>
                </div>

                {/* Middle-Right: Collection Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Collection Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">COD Expected:</span>
                        <span className="font-medium text-foreground">₹{runsheet.codExpected}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">COD Collected:</span>
                        <span className="font-bold text-warning">₹{runsheet.codCollected}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prepaid:</span>
                        <span className="font-medium text-success">₹{runsheet.prepaidTotal}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">Total:</span>
                        <span className="font-bold text-primary">
                          ₹{runsheet.codCollected + runsheet.prepaidTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col gap-2 justify-center">
                  <Link to={`/delivery/runsheets/${runsheet.id}`}>
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm">
                    Download Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RiderRunsheets;


