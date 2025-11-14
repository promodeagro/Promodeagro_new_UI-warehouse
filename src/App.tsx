import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigation } from '@/components/Navigation';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { ProductProvider } from '@/contexts/ProductContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { PincodeProvider } from '@/contexts/PincodeContext';
import { UnitsProvider } from '@/contexts/UnitsContext';

// Import components
import { OperationsOverview } from '@/components/warehouse/OperationsOverview';
import { ProductManagement } from '@/components/inventory/ProductManagement';
import { ProductVariants } from '@/components/inventory/ProductVariants';
import { InventoryTasks } from '@/components/inventory/InventoryTasks';
import { StockReceiving } from '@/components/inventory/StockReceiving';
import { QualityCheck } from '@/components/inventory/QualityCheck';
import { ProductCategoryManagement } from '@/components/inventory/ProductCategoryManagement';
import { QuickActions } from '@/components/inventory/QuickActions';
import UnitManagement from '@/components/inventory/UnitManagement';
import { FleetManagement } from '@/components/logistics/FleetManagement';
import { RouteOptimization } from '@/components/logistics/RouteOptimization';
import { DeliveryTracking } from '@/components/logistics/DeliveryTracking';
import { PerformanceAnalytics } from '@/components/logistics/PerformanceAnalytics';
import { InventoryAnalytics } from '@/components/warehouse/InventoryAnalytics';
import { QualityMetrics } from '@/components/warehouse/QualityMetrics';
import { StaffManagement } from '@/components/warehouse/StaffManagement';
import OrdersList from '@/components/order-management/OrdersList';
import OrderDetail from '@/components/order-management/OrderDetail';
import AddNewOrder from '@/components/order-management/AddNewOrder';
import PackerOverview from '@/components/order-management/PackerOverview';
import PackerDetails from '@/components/order-management/PackerDetails';
import PackerOrders from '@/components/order-management/PackerOrders';

// Import Pincode and Stock Adjustment components
import { PincodeManagement } from '@/components/pincode/PincodeManagement';
import StockAdjustment from '@/components/stock/StockAdjustment';
import NewStockAdjustment from '@/components/stock/NewStockAdjustment';

// Import Accounts components
import Dashboard from '@/components/accounts/Dashboard';
import Sales from '@/components/accounts/Sales';
import CartSales from '@/components/accounts/CartSales';
import Purchases from '@/components/accounts/Purchases';
import Expenses from '@/components/accounts/Expenses';
import OtherIncome from '@/components/accounts/OtherIncome';
import ChartOfAccounts from '@/components/accounts/ChartOfAccounts';
import JournalEntries from '@/components/accounts/JournalEntries';
import Reports from '@/components/accounts/Reports';
import Customers from '@/components/accounts/Customers';
import Analytics from '@/components/accounts/Analytics';

// Import Accounts sub-screens
import NewInvoice from '@/components/accounts/sales/NewInvoice';
import EditInvoice from '@/components/accounts/sales/EditInvoice';
import ViewInvoice from '@/components/accounts/sales/ViewInvoice';
import NewCartSale from '@/components/accounts/cart-sales/NewCartSale';
import EditCartSale from '@/components/accounts/cart-sales/EditCartSale';
import ViewCartSale from '@/components/accounts/cart-sales/ViewCartSale';
import NewPurchaseOrder from '@/components/accounts/purchases/NewPurchaseOrder';
import EditPurchaseOrder from '@/components/accounts/purchases/EditPurchaseOrder';
import ViewPurchaseOrder from '@/components/accounts/purchases/ViewPurchaseOrder';
import NewExpense from '@/components/accounts/expenses/NewExpense';
import EditExpense from '@/components/accounts/expenses/EditExpense';
import ViewExpense from '@/components/accounts/expenses/ViewExpense';
import NewIncome from '@/components/accounts/other-income/NewIncome';
import EditIncome from '@/components/accounts/other-income/EditIncome';
import ViewIncome from '@/components/accounts/other-income/ViewIncome';
import NewAccount from '@/components/accounts/chart-of-accounts/NewAccount';
import EditAccount from '@/components/accounts/chart-of-accounts/EditAccount';
import NewJournalEntry from '@/components/accounts/journal-entries/NewJournalEntry';
import EditJournalEntry from '@/components/accounts/journal-entries/EditJournalEntry';
import ViewJournalEntry from '@/components/accounts/journal-entries/ViewJournalEntry';
import ReportDetail from '@/components/accounts/reports/ReportDetail';

// Delivery components
import RunsheetManagement from '@/components/delivery/RunsheetManagement';
import RiderOverview from '@/components/delivery/RiderOverview';
import CashCollectionManagement from '@/components/delivery/CashCollectionManagement';
import RiderRunsheets from '@/components/delivery/RiderRunsheets';
import RunsheetDetails from '@/components/delivery/RunsheetDetails';
import CreateRunsheet from '@/components/delivery/CreateRunsheet';
import DeliveryAction from '@/components/delivery/DeliveryAction';
import CashVerificationDetails from '@/components/delivery/CashVerificationDetails';
import CollectionDetailsView from '@/components/delivery/CollectionDetailsView';
import CloseRunsheet from '@/components/delivery/CloseRunsheet';
import ClosedRunsheetSummary from '@/components/delivery/ClosedRunsheetSummary';
import RiderOnboardingQueue from '@/components/delivery/RiderOnboardingQueue';
import RiderApplicationDetails from '@/components/delivery/RiderApplicationDetails';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="warehouse-ui-theme">
        <CategoryProvider>
          <ProductProvider>
            <NotificationProvider>
              <OrderProvider>
                <PincodeProvider>
                <UnitsProvider>
                <Router>
            <div className="min-h-screen bg-gradient-background flex">
              <Navigation />
              <main className="flex-1 overflow-auto lg:ml-[299px]">
                <div className="container mx-auto p-3 sm:p-4 md:p-6">
                  <Routes>
                  {/* Default route - redirect to operations overview */}
                  <Route path="/" element={<Navigate to="/operations" replace />} />
                  
                  {/* Warehouse Operations */}
                  <Route path="/operations" element={<OperationsOverview />} />
                  <Route path="/analytics" element={<InventoryAnalytics />} />
                  <Route path="/quality-metrics" element={<QualityMetrics />} />
                  <Route path="/staff" element={<StaffManagement />} />
                  
                  {/* Inventory Management */}
                  <Route path="/inventory/products" element={<ProductManagement />} />
                  <Route path="/inventory/variants" element={<ProductVariants />} />
                  <Route path="/inventory/tasks" element={<InventoryTasks />} />
                  <Route path="/inventory/receiving" element={<StockReceiving />} />
                  <Route path="/inventory/quality" element={<QualityCheck />} />
                  <Route path="/inventory/categories" element={<ProductCategoryManagement />} />
                  <Route path="/inventory/units" element={<UnitManagement />} />
                  <Route path="/inventory/quick-actions" element={<QuickActions />} />
                  <Route path="/stock-adjustment" element={<StockAdjustment />} />
                  <Route path="/stock-adjustment/new" element={<NewStockAdjustment />} />
                  
                  {/* Order Management */}
                  <Route path="/order-management/orders" element={<OrdersList />} />
                  <Route path="/order-management/orders/:id" element={<OrderDetail />} />
                  <Route path="/order-management/add-order" element={<AddNewOrder />} />
                  <Route path="/order-management/packer-overview" element={<PackerOverview />} />
                  <Route path="/order-management/packer-details/:packerId" element={<PackerDetails />} />
                  <Route path="/order-management/packer-orders/:packerId" element={<PackerOrders />} />
                  <Route path="/pincodes" element={<PincodeManagement />} />
                  
                  {/* Delivery Management */}
                  <Route path="/delivery/rider-overview" element={<RiderOverview />} />
                  <Route path="/delivery/runsheets" element={<RunsheetManagement />} />
                  <Route path="/delivery/runsheets/:id" element={<CloseRunsheet />} />
                  <Route path="/delivery/runsheets/:id/closed" element={<ClosedRunsheetSummary />} />
                  <Route path="/delivery/runsheets/view/:id" element={<CloseRunsheet />} />
                  <Route path="/delivery/runsheet-management/closerunsheet/:id" element={<CloseRunsheet />} />
                  <Route path="/delivery/create-runsheet" element={<CreateRunsheet />} />
                  <Route path="/delivery/rider-onboarding-queue" element={<RiderOnboardingQueue />} />
                  <Route path="/delivery/rider-onboarding-queue/:riderId" element={<RiderApplicationDetails />} />
                  <Route path="/delivery/cash-collection" element={<CashCollectionManagement />} />
                  <Route path="/delivery/cash-verification/:id" element={<CashVerificationDetails />} />
                  <Route path="/delivery/collection-details/:id" element={<CollectionDetailsView />} />
                  <Route path="/delivery/close-runsheet/:runsheetId" element={<CloseRunsheet />} />
                  <Route path="/delivery/rider/delivery/:id" element={<DeliveryAction />} />
                  {/* New route alias per requirement */}
                  <Route path="/delivery/rider-overview/runsheets-history/:riderId" element={<RiderRunsheets />} />
                  {/* Backward compatibility */}
                  <Route path="/delivery/rider-runsheets/:riderId" element={<RiderRunsheets />} />
                  
                  {/* Logistics */}
                  <Route path="/logistics/fleet" element={<FleetManagement />} />
                  <Route path="/logistics/routes" element={<RouteOptimization />} />
                  <Route path="/logistics/tracking" element={<DeliveryTracking />} />
                  <Route path="/logistics/analytics" element={<PerformanceAnalytics />} />
                  
                  {/* Accounts Management */}
                  <Route path="/accounts/dashboard" element={<Dashboard />} />
                  <Route path="/accounts/sales" element={<Sales />} />
                  <Route path="/accounts/sales/new" element={<NewInvoice />} />
                  <Route path="/accounts/sales/:id" element={<ViewInvoice />} />
                  <Route path="/accounts/sales/:id/edit" element={<EditInvoice />} />
                  <Route path="/accounts/cart-sales" element={<CartSales />} />
                  <Route path="/accounts/cart-sales/new" element={<NewCartSale />} />
                  <Route path="/accounts/cart-sales/:id" element={<ViewCartSale />} />
                  <Route path="/accounts/cart-sales/:id/edit" element={<EditCartSale />} />
                  <Route path="/accounts/purchases" element={<Purchases />} />
                  <Route path="/accounts/purchases/new" element={<NewPurchaseOrder />} />
                  <Route path="/accounts/purchases/:id" element={<ViewPurchaseOrder />} />
                  <Route path="/accounts/purchases/:id/edit" element={<EditPurchaseOrder />} />
                  <Route path="/accounts/expenses" element={<Expenses />} />
                  <Route path="/accounts/expenses/new" element={<NewExpense />} />
                  <Route path="/accounts/expenses/:id" element={<ViewExpense />} />
                  <Route path="/accounts/expenses/:id/edit" element={<EditExpense />} />
                  <Route path="/accounts/other-income" element={<OtherIncome />} />
                  <Route path="/accounts/other-income/new" element={<NewIncome />} />
                  <Route path="/accounts/other-income/:id" element={<ViewIncome />} />
                  <Route path="/accounts/other-income/:id/edit" element={<EditIncome />} />
                  <Route path="/accounts/chart-of-accounts" element={<ChartOfAccounts />} />
                  <Route path="/accounts/chart-of-accounts/new" element={<NewAccount />} />
                  <Route path="/accounts/chart-of-accounts/:code/edit" element={<EditAccount />} />
                  <Route path="/accounts/journal-entries" element={<JournalEntries />} />
                  <Route path="/accounts/journal-entries/new" element={<NewJournalEntry />} />
                  <Route path="/accounts/journal-entries/:id" element={<ViewJournalEntry />} />
                  <Route path="/accounts/journal-entries/:id/edit" element={<EditJournalEntry />} />
                  <Route path="/accounts/reports" element={<Reports />} />
                  <Route path="/accounts/reports/:reportName" element={<ReportDetail />} />
                  <Route path="/accounts/customers" element={<Customers />} />
                  <Route path="/accounts/analytics" element={<Analytics />} />
                  
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/operations" replace />} />
                  </Routes>
                </div>
              </main>
            </div>
                </Router>
                <Toaster />
                </UnitsProvider>
                </PincodeProvider>
              </OrderProvider>
            </NotificationProvider>
          </ProductProvider>
        </CategoryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
