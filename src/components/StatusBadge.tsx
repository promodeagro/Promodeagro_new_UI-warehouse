import { Badge } from "@/components/ui/badge";
import { type OrderStatus } from "@/data/orderData";

interface StatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
  'Placed': { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
  'Accepted': { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
  'Pending': { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
  'Packed': { variant: "outline", className: "bg-orange-50 text-orange-700 border-orange-200" },
  'On the way': { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
  'Dispatched': { variant: "outline", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  'Delivered': { variant: "default", className: "bg-primary text-primary-foreground" },
  'Undelivered': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
  'Cancelled': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
  'Returned': { variant: "outline", className: "bg-amber-50 text-amber-700 border-amber-200" },
  'Failed': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
  'Out of Stock': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
  'Items out of Stock': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
  'Items No Stock': { variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" }
};

const getDisplayText = (status: OrderStatus): string => {
  switch (status) {
    case 'Placed': return 'Order Placed';
    case 'Accepted': return 'Order In Process';
    case 'Pending': return 'Pending';
    case 'Packed': return 'Packed';
    case 'On the way': return 'On The Way';
    case 'Dispatched': return 'Dispatched';
    case 'Delivered': return 'Delivered';
    case 'Undelivered': return 'Undelivered';
    case 'Cancelled': return 'Cancel order';
    case 'Returned': return 'Request for Cancellation';
    case 'Failed': return 'Failed';
    case 'Out of Stock': return 'Items No Stock';
    case 'Items out of Stock': return 'Items No Stock';
    case 'Items No Stock': return 'Items No Stock';
    default: return status;
  }
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status] || { variant: "outline" as const, className: "bg-gray-50 text-gray-700 border-gray-200" };
  return (
    <Badge variant={config.variant} className={config.className}>
      {getDisplayText(status)}
    </Badge>
  );
};
