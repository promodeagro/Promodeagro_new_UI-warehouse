import { useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Package, DollarSign, CheckCircle2 } from "lucide-react";
import { orders as dummyOrders, riders, runsheets as dummyRunsheets } from "@/data/dummyData";
import type { Runsheet, Order } from "@/data/dummyData";
import { downloadRunsheetReport } from "@/utils/runsheetReport";

const ClosedRunsheetSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get back path from location state or default
  const backPath = (location.state as any)?.from || '/delivery/runsheets';
  const activeTab = (location.state as any)?.activeTab || 'closed';

  // Load runsheet and orders dynamically
  const { runsheet, runsheetOrders, rider } = useMemo(() => {
    // Merge runsheets: overlay localStorage onto dummy by id
    let allRunsheets = [...dummyRunsheets];
    try {
      const storedRunsheets = localStorage.getItem('warehouse-runsheets');
      if (storedRunsheets) {
        const parsed: Runsheet[] = JSON.parse(storedRunsheets);
        const map = new Map(allRunsheets.map(r => [r.id, r]));
        parsed.forEach((r: Runsheet) => map.set(r.id, { ...map.get(r.id), ...r }));
        allRunsheets = Array.from(map.values());
      }
    } catch {}

    const currentRunsheet = allRunsheets.find(r => r.id === id) || null;

    // Merge orders: dummy + localStorage updates
    let allOrders = [...dummyOrders];
    try {
      const storedOrders = localStorage.getItem('warehouse-orders');
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders);
        const map = new Map(allOrders.map(o => [o.id, o]));
        parsed.forEach((o: Order) => map.set(o.id, o));
        allOrders = Array.from(map.values());
      }
    } catch {}

    const orderIds = currentRunsheet?.orders_assigned || [];
    const rsOrders = orderIds
      .map(oid => allOrders.find(o => o.id === oid))
      .filter(Boolean) as Order[];

    const riderDetails = currentRunsheet?.rider_id
      ? riders.find(r => r.id === currentRunsheet.rider_id)
      : undefined;

    return {
      runsheet: currentRunsheet,
      runsheetOrders: rsOrders,
      rider: riderDetails,
    };
  }, [id]);

  if (!runsheet) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Runsheet not found</p>
            <Button onClick={() => navigate(backPath)} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate totals
  const totalOrders = runsheetOrders.length;
  const deliveredOrders = runsheetOrders.filter(o => (o.status || '').toLowerCase() === 'delivered').length;
  const undeliveredOrders = runsheetOrders.filter(o => (o.status || '').toLowerCase() === 'undelivered');
  
  const expectedCODRaw = runsheetOrders
    .filter(o => o.payment_mode === 'COD')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalPrepaidRaw = runsheetOrders
    .filter(o => o.payment_mode === 'Online')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const undeliveredCOD = undeliveredOrders
    .filter(o => o.payment_mode === 'COD')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const undeliveredPrepaid = undeliveredOrders
    .filter(o => o.payment_mode === 'Online')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const undeliveredTotal = undeliveredCOD + undeliveredPrepaid;

  // Get saved collection data from runsheet
  const anyRs: any = runsheet as any;
  const codCollected = anyRs.cod_collected ?? 0;
  const onlineCollected = anyRs.online_collected ?? 0;
  const undeliveredCODAmount = anyRs.undelivered_cod ?? 0;
  const undeliveredPrepaidAmount = anyRs.undelivered_prepaid ?? 0;
  const undeliveredAmount = anyRs.undelivered_total ?? undeliveredTotal;
  const pendingAmount = anyRs.pending_amount ?? 0;
  const pendingReason = anyRs.pending_reason ?? '';
  const paymentMode = anyRs.collection_payment_mode ?? 'Cash';
  const verifiedAt = anyRs.collection_verified_at ? new Date(anyRs.collection_verified_at).toLocaleString('en-IN') : 'N/A';

  const expectedCOD = expectedCODRaw - undeliveredCODAmount;
  const totalPrepaid = totalPrepaidRaw - undeliveredPrepaidAmount;
  const grandTotal = expectedCODRaw + totalPrepaidRaw;

  const handleDownloadReport = () => {
    downloadRunsheetReport(runsheet, runsheetOrders, {
      filename: `${runsheet.id}-closed-report.csv`,
      riderPhone: rider?.phone,
      overrideCollected: {
        cod: codCollected,
        online: onlineCollected,
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={backPath} state={{ activeTab }}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Closed Runsheet Summary</h1>
                <p className="text-sm text-muted-foreground">View closed runsheet details and collection summary</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="text-sm px-4 py-2">
                Closed
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
              >
                Download Report
              </Button>
            </div>
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
                  <p className="font-medium text-foreground">{runsheet.rider_name || rider?.name || 'N/A'}</p>
                  <p className="text-xs text-muted-foreground">{rider?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created Date & Time</Label>
                  <p className="text-sm font-medium text-foreground">
                    {runsheet.created_at 
                      ? new Date(runsheet.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })
                      : runsheet.run_date || runsheet.date || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Closed At</Label>
                  <p className="text-sm font-medium text-foreground">{verifiedAt}</p>
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
                  <span className="text-sm text-muted-foreground">Undelivered:</span>
                  <span className="font-bold text-destructive">{undeliveredOrders.length}</span>
                </div>
                <Separator />
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
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">COD Expected:</span>
                  <span className="font-bold text-warning">₹{expectedCOD.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Prepaid Total:</span>
                  <span className="font-bold text-success">₹{totalPrepaid.toFixed(2)}</span>
                </div>
                {undeliveredAmount > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Undelivered Amount:</span>
                      <span className="font-bold text-destructive">₹{undeliveredAmount.toFixed(2)}</span>
                    </div>
                    <div className="pl-2 border-l-2 border-muted">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="text-muted-foreground">Split - COD:</span>
                        <span className="font-medium text-warning">₹{undeliveredCODAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-xs mt-1">
                        <span className="text-muted-foreground">Split - Prepaid:</span>
                        <span className="font-medium text-success">₹{undeliveredPrepaidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">COD Collected:</span>
                  <span className="font-bold text-success">₹{codCollected.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Online (UPI):</span>
                  <span className="font-bold text-success">₹{onlineCollected.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Payment Mode:</span>
                  <Badge variant="outline">{paymentMode}</Badge>
                </div>
                {pendingAmount > 0 && (
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Pending Amount:</span>
                      <span className="font-bold text-warning">₹{pendingAmount.toFixed(2)}</span>
                    </div>
                    {pendingReason && (
                      <p className="text-xs text-muted-foreground">{pendingReason}</p>
                    )}
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">Grand Total:</span>
                  <span className="font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Collection Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Section - Orders */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Details ({runsheetOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runsheetOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No orders found
                        </TableCell>
                      </TableRow>
                    ) : (
                      runsheetOrders.map((order) => {
                        const orderStatus = (order.status || '').toString().toLowerCase();
                        let deliveryStatus = 'Pending';
                        if (orderStatus === 'delivered') {
                          deliveryStatus = 'Delivered';
                        } else if (orderStatus === 'undelivered') {
                          deliveryStatus = 'Undelivered';
                        } else {
                          deliveryStatus = order.status || 'Pending';
                        }

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.order_number || order.id}</TableCell>
                            <TableCell>{order.customer_name}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={order.payment_mode === 'COD' ? 'secondary' : 'default'}
                                className={
                                  order.payment_mode === 'COD' 
                                    ? 'bg-black text-white' 
                                    : order.payment_mode === 'Online'
                                    ? 'bg-green-600 text-white'
                                    : ''
                                }
                              >
                                {order.payment_mode === 'Online' ? 'Prepaid' : order.payment_mode}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                className={
                                  deliveryStatus === 'Delivered' 
                                    ? 'bg-green-100 text-green-800 border-green-300' 
                                    : deliveryStatus === 'On the way'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : deliveryStatus === 'Undelivered'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : ''
                                }
                              >
                                {deliveryStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {deliveryStatus === 'Undelivered' ? (
                                <span className="text-sm text-red-700">
                                  {(() => {
                                    const map: Record<string, string> = {
                                      customer_cancelled: 'Customer Cancelled',
                                      wrong_address: 'Wrong Address',
                                      damaged_item: 'Damaged Item',
                                      payment_issue: 'Payment Issue',
                                      customer_not_available: 'Customer Not Available',
                                      others: 'Others',
                                    };
                                    const code = (order as any).undelivered_reason as string;
                                    const text = code ? (map[code] || code) : '';
                                    const notes = (order as any).undelivered_notes as string;
                                    return notes ? `${text}${text ? ' - ' : ''}${notes}` : text || '-';
                                  })()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{order.total_amount || 0}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClosedRunsheetSummary;

