import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Package, DollarSign, ShoppingCart } from "lucide-react";
import { riderOrders } from "@/data/riderData";

// Dummy products data for top products calculation
const products = [
  { id: 'P001', name: 'Organic Tomatoes', category: 'Vegetables', price: 45 },
  { id: 'P002', name: 'Fresh Potatoes', category: 'Vegetables', price: 30 },
  { id: 'P003', name: 'Red Onions', category: 'Vegetables', price: 35 },
  { id: 'P004', name: 'Shimla Apples', category: 'Fruits', price: 120 },
  { id: 'P005', name: 'Farm Bananas', category: 'Fruits', price: 50 },
  { id: 'P006', name: 'Orange Carrots', category: 'Vegetables', price: 40 },
  { id: 'P007', name: 'Fresh Spinach', category: 'Greens', price: 25 },
  { id: 'P008', name: 'Alphonso Mangoes', category: 'Fruits', price: 180 },
];

const DeliveryAnalytics = () => {
  const totalSales = riderOrders
    .filter(o => o.status === 'Delivered')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const topProducts = products
    .map(p => ({
      ...p,
      soldQty: riderOrders
        .filter(o => o.status === 'Delivered')
        .flatMap(o => o.items)
        .filter(i => i.product_id === p.id)
        .reduce((sum, i) => sum + i.quantity, 0)
    }))
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, 5);

  const statusCounts = {
    placed: riderOrders.filter(o => o.status === 'Placed').length,
    packed: riderOrders.filter(o => o.status === 'Packed').length,
    dispatched: riderOrders.filter(o => o.status === 'Dispatched').length,
    delivered: riderOrders.filter(o => o.status === 'Delivered').length,
    returned: riderOrders.filter(o => o.status === 'Returned').length,
  };

  const handleExportCSV = () => {
    // Create CSV content
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Sales', `₹${totalSales}`],
      ['Total Orders', riderOrders.length],
      ['Average Order Value', `₹${Math.round(totalSales / riderOrders.length)}`],
      ['Completed Orders', statusCounts.delivered],
      ['Placed', statusCounts.placed],
      ['Packed', statusCounts.packed],
      ['Dispatched', statusCounts.dispatched],
      ['Returned', statusCounts.returned],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">Reports & Analytics</h1>
              <p className="text-sm text-muted-foreground">Sales and performance insights</p>
            </div>
            <Button onClick={handleExportCSV} className="hover:shadow-md">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">₹{totalSales.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{riderOrders.length}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{riderOrders.length > 0 ? Math.round(totalSales / riderOrders.length) : 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{statusCounts.delivered}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-display">Order Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Placed</span>
                  <span className="font-medium text-foreground">{statusCounts.placed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Packed</span>
                  <span className="font-medium text-foreground">{statusCounts.packed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Dispatched</span>
                  <span className="font-medium text-foreground">{statusCounts.dispatched}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Delivered</span>
                  <span className="font-medium text-primary">{statusCounts.delivered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Returned</span>
                  <span className="font-medium text-destructive">{statusCounts.returned}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="font-display">Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{product.soldQty} units</p>
                      <p className="text-xs text-muted-foreground">₹{product.soldQty * product.price}</p>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No products sold yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DeliveryAnalytics;

