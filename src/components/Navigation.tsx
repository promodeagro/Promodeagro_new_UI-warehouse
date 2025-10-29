import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  BarChart3, 
  Users, 
  Settings, 
  Menu, 
  X,
  Home,
  ClipboardList,
  PackageCheck,
  Route,
  TrendingUp,
  ShoppingCart,
  FileText,
  ChevronDown,
  ChevronRight,
  Calculator,
  Receipt,
  CreditCard,
  TrendingDown,
  BookOpen,
  FileSpreadsheet,
  BarChart,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationBell } from '@/contexts/NotificationContext';
import { ThemeToggle } from '@/components/theme-toggle';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/operations',
    icon: Home,
    description: 'Operations overview'
  },
  {
    title: 'Inventory',
    icon: Package,
    items: [
      { title: 'Products', href: '/inventory/products', icon: Package },
      { title: 'Categories', href: '/inventory/categories', icon: Package },
      { title: 'Stock Adjustment', href: '/stock-adjustment', icon: BarChart },
      // Temporarily commented out per request — enable later when needed
      // { title: 'Tasks', href: '/inventory/tasks', icon: ClipboardList },
      // { title: 'Receiving', href: '/inventory/receiving', icon: PackageCheck },
      // { title: 'Quality Check', href: '/inventory/quality', icon: PackageCheck },
      // { title: 'Quick Actions', href: '/inventory/quick-actions', icon: Package }
    ]
  },
  {
    title: 'Order Management',
    icon: ShoppingCart,
    items: [
      { title: 'Orders Details', href: '/order-management/orders', icon: FileText },
      { title: 'Packer Overview', href: '/order-management/packer-overview', icon: PackageCheck },
      { title: 'Pincodes', href: '/pincodes', icon: MapPin }
    ]
  },
  {
    title: 'Delivery',
    icon: Truck,
    items: [
      { title: 'Orders', href: '/delivery/orders', icon: ClipboardList },
      { title: 'History', href: '/delivery/history', icon: BarChart3 },
      { title: 'Runsheet Management', href: '/delivery/runsheets', icon: ClipboardList },
      { title: 'Analytics', href: '/delivery/analytics', icon: BarChart3 },
      { title: 'Rider Portal', href: '/delivery/rider-portal', icon: Users },
      { title: 'Rider Management', href: '/delivery/rider-management', icon: Users },
      { title: 'Rider Overview', href: '/delivery/rider-overview', icon: TrendingUp },
      { title: 'Cash Collection', href: '/delivery/cash-collection', icon: CreditCard },
      { title: 'Rider Onboarding', href: '/delivery/rider-onboarding-queue', icon: Users }
    ]
  },
  {
    title: 'Accounts',
    icon: Calculator,
    items: [
      { title: 'Dashboard', href: '/accounts/dashboard', icon: BarChart },
      { title: 'Sales', href: '/accounts/sales', icon: TrendingUp },
      { title: 'Cart Sales', href: '/accounts/cart-sales', icon: ShoppingCart },
      { title: 'Purchases', href: '/accounts/purchases', icon: Receipt },
      { title: 'Expenses', href: '/accounts/expenses', icon: TrendingDown },
      { title: 'Other Income', href: '/accounts/other-income', icon: CreditCard },
      { title: 'Chart of Accounts', href: '/accounts/chart-of-accounts', icon: BookOpen },
      { title: 'Journal Entries', href: '/accounts/journal-entries', icon: FileText },
      { title: 'Reports', href: '/accounts/reports', icon: FileSpreadsheet },
      { title: 'Customers', href: '/accounts/customers', icon: Users },
      { title: 'Analytics', href: '/accounts/analytics', icon: BarChart3 }
    ]
  }
  // COMMENTED OUT FOR FUTURE USE - Uncomment when needed
  // {
  //   title: 'Logistics',
  //   icon: Route,
  //   items: [
  //     { title: 'Fleet', href: '/logistics/fleet', icon: Truck },
  //     { title: 'Routes', href: '/logistics/routes', icon: Route },
  //     { title: 'Tracking', href: '/logistics/tracking', icon: BarChart3 },
  //     { title: 'Analytics', href: '/logistics/analytics', icon: TrendingUp }
  //   ]
  // },
  // {
  //   title: 'Analytics',
  //   href: '/analytics',
  //   icon: BarChart3,
  //   description: 'Performance metrics'
  // },
  // {
  //   title: 'Quality',
  //   href: '/quality-metrics',
  //   icon: PackageCheck,
  //   description: 'Quality metrics'
  // },
  // {
  //   title: 'Staff',
  //   href: '/staff',
  //   icon: Users,
  //   description: 'Staff management'
  // }
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isActive = (href: string) => {
    // Handle exact matches
    if (location.pathname === href) {
      return true;
    }
    
    // Handle nested routes for order management with context awareness
    if (location.pathname.startsWith('/order-management/orders/')) {
      const from = searchParams.get('from');
      
      // If came from packer overview, show packer overview as active
      if (from === 'packer-overview' && href === '/order-management/packer-overview') {
        return true;
      }
      
      // If came from packer overview, don't show orders details as active
      if (from === 'packer-overview' && href === '/order-management/orders') {
        return false;
      }
      
      // If came from orders details or no context, show orders details as active
      if (href === '/order-management/orders') {
        return true;
      }
    }
    
    // Handle packer-orders routes - always show packer overview as active
    if (location.pathname.startsWith('/order-management/packer-orders/')) {
      if (href === '/order-management/packer-overview') {
        return true;
      }
      // Don't show other items as active when on packer-orders
      return false;
    }
    
    // Handle packer-details routes - always show packer overview as active
    if (location.pathname.startsWith('/order-management/packer-details/')) {
      if (href === '/order-management/packer-overview') {
        return true;
      }
      // Don't show other items as active when on packer-details
      return false;
    }
    
    return false;
  };

  const isParentActive = (items: any[]) => {
    return items.some(item => {
      // Handle exact matches
      if (location.pathname === item.href) {
        return true;
      }
      
      // Handle nested routes for order management with context awareness
      if (location.pathname.startsWith('/order-management/orders/')) {
        const from = searchParams.get('from');
        
        // If came from packer overview, show packer overview as active
        if (from === 'packer-overview' && item.href === '/order-management/packer-overview') {
          return true;
        }
        
        // If came from orders details or no context, show orders details as active
        if (item.href === '/order-management/orders') {
          return true;
        }
      }
      
      // Handle packer-orders routes - always show packer overview as active
      if (location.pathname.startsWith('/order-management/packer-orders/')) {
        if (item.href === '/order-management/packer-overview') {
          return true;
        }
      }
      
      // Handle packer-details routes - always show packer overview as active
      if (location.pathname.startsWith('/order-management/packer-details/')) {
        if (item.href === '/order-management/packer-overview') {
          return true;
        }
      }
      
      return false;
    });
  };

  const toggleDropdown = (title: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gradient-primary">
              Warehouse Manager
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Operations Portal
            </p>
          </div>
          {/* Theme toggle removed from header as requested */}
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <div key={index}>
            {item.href ? (
              // Single page link (no dropdown)
              <Link
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            ) : (
              // Dropdown parent menu
              <div>
                <button
                  onClick={() => toggleDropdown(item.title)}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-lg font-medium transition-colors ${
                    isParentActive(item.items || []) 
                      ? 'text-primary bg-primary/5' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </div>
                  {openDropdowns.has(item.title) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {/* Child menu items - only show if dropdown is open */}
                {openDropdowns.has(item.title) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.items?.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.href}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                          isActive(subItem.href)
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-muted-foreground'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      <div className="p-3 border-t">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Notification</span>
            <NotificationBell />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Top Header icons removed per request */}

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-2 left-2 sm:top-4 sm:left-4 z-50">
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:w-80 p-0">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:fixed lg:top-0 lg:left-0 lg:block w-[299px] h-screen border-r bg-card/50 backdrop-blur z-40">
        <NavContent />
      </div>
    </>
  );
}
