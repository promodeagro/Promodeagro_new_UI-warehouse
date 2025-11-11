// Minimal dummy data used by Delivery module for preview
export type OrderStatus = 'Placed' | 'Accepted' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled' | 'Returned' | 'Failed';
export type PaymentMode = 'COD' | 'Online';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit?: string; // Unit of measurement (e.g., "1000unit", "kg", "piece")
  price: number;
  subtotal: number;
  is_substituted: boolean;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  lat: number;
  lng: number;
  zone: string;
  total_amount: number;
  payment_mode: PaymentMode;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivery_slot: string;
  notes?: string;
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_number: string;
  vehicle_type: 'Two-Wheeler' | 'Three-Wheeler';
  current_status: 'Available' | 'On Trip' | 'Busy' | 'Offline';
  zone: string;
  rating: number;
  total_deliveries: number;
  orders_out_for_delivery: number;
  orders_pending_pickup: number;
  orders_delivered_today: number;
  avg_delivery_time_minutes: number;
  delivery_success_rate: number;
  last_seen: string;
  last_location_lat?: number;
  last_location_lng?: number;
  current_runsheet_id?: string;
  cod_outstanding: number;
  active: boolean;
  date_joined: string;
}

export interface Runsheet {
  id: string;
  rider_id: string;
  rider_name: string;
  run_date: string;
  departure_time?: string; // Time from Create Runsheet screen (e.g., "09:00" or "09:00 AM")
  created_at?: string; // Timestamp when runsheet was created (ISO string) - fixed at creation time
  orders_assigned: string[];
  route_zone: string;
  status: 'Created' | 'In Transit' | 'Completed';
  total_stops: number;
  estimated_time: string;
}

export const orders: Order[] = [
  {
    id: 'ORD001',
    order_number: 'ORD-20251010-0001',
    customer_id: 'C001',
    customer_name: 'Rajesh Kumar',
    customer_phone: '+91 98765 43210',
    address: '123, MG Road, Sector 15, Gurugram',
    lat: 28.4595,
    lng: 77.0266,
    zone: 'Zone A',
    total_amount: 485,
    payment_mode: 'Online',
    status: 'Packed',
    items: [
      { id: 'OI001', product_id: 'P001', product_name: 'Organic Tomatoes', quantity: 2, unit: 'kg', price: 45, subtotal: 90, is_substituted: false },
      { id: 'OI002', product_id: 'P004', product_name: 'Shimla Apples', quantity: 2, unit: 'kg', price: 120, subtotal: 240, is_substituted: false },
      { id: 'OI003', product_id: 'P007', product_name: 'Fresh Spinach', quantity: 3, unit: 'bunch', price: 25, subtotal: 75, is_substituted: false },
      { id: 'OI004', product_id: 'P006', product_name: 'Orange Carrots', quantity: 2, unit: 'kg', price: 40, subtotal: 80, is_substituted: false },
    ],
    created_at: '2025-01-10T08:30:00Z',
    updated_at: '2025-01-10T09:15:00Z',
    delivery_slot: '11:00 AM - 1:00 PM',
    notes: 'Please call before delivery'
  },
  {
    id: 'ORD002',
    order_number: 'ORD-20251010-0002',
    customer_id: 'C002',
    customer_name: 'Priya Sharma',
    customer_phone: '+91 98765 43211',
    address: '456, DLF Phase 2, Gurugram',
    lat: 28.4920,
    lng: 77.0900,
    zone: 'Zone A',
    total_amount: 330,
    payment_mode: 'COD',
    status: 'Packed', // Packed by packer - ready for runsheet assignment
    items: [
      { id: 'OI005', product_id: 'P002', product_name: 'Fresh Potatoes', quantity: 5, unit: 'kg', price: 30, subtotal: 150, is_substituted: false },
      { id: 'OI006', product_id: 'P003', product_name: 'Red Onions', quantity: 3, unit: 'kg', price: 35, subtotal: 105, is_substituted: false },
      { id: 'OI007', product_id: 'P005', product_name: 'Farm Bananas', quantity: 1, unit: 'dozen', price: 50, subtotal: 50, is_substituted: false },
    ],
    created_at: '2025-01-10T08:45:00Z',
    updated_at: '2025-01-10T10:00:00Z',
    delivery_slot: '11:00 AM - 1:00 PM',
    notes: 'Handle with care - fragile items' // Delivery instructions for rider
  },
  {
    id: 'ORD003',
    order_number: 'ORD-1762092299272',
    customer_id: 'C003',
    customer_name: 'Mobile Customer',
    customer_phone: '+91 98765 43299',
    address: '123 Mobile Street, Test Area, Test City, 110001', // Fixed: Added complete address with pincode
    lat: 28.4595,
    lng: 77.0266,
    zone: 'Zone A',
    total_amount: 299, // Updated to match Orders dashboard (₹299)
    payment_mode: 'Online', // Fixed: Customer paid online → Prepaid (was incorrectly 'COD')
    status: 'Packed', // Packed by packer - ready for runsheet assignment
    items: [
      { id: 'OI008', product_id: 'P001', product_name: 'Product Name', quantity: 1, unit: '1000unit', price: 299, subtotal: 299, is_substituted: false },
    ],
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-01-10T10:30:00Z',
    delivery_slot: '11:00 AM - 1:00 PM'
  },
];

export const riders: Rider[] = [
  { 
    id: 'R001', 
    name: 'Suresh Kumar',
    email: 'suresh.kumar@promode.com',
    phone: '+91 98111 11111',
    vehicle_number: 'DL-01-AB-1234',
    vehicle_type: 'Two-Wheeler',
    current_status: 'On Trip',
    zone: 'Zone A',
    rating: 4.8,
    total_deliveries: 1250,
    orders_out_for_delivery: 5,
    orders_pending_pickup: 2,
    orders_delivered_today: 12,
    avg_delivery_time_minutes: 28,
    delivery_success_rate: 96.5,
    last_seen: new Date(Date.now() - 5 * 60000).toISOString(),
    last_location_lat: 28.4595,
    last_location_lng: 77.0266,
    current_runsheet_id: 'RS001',
    cod_outstanding: 2450,
    active: true,
    date_joined: '2024-01-15'
  }
];

export const runsheets: Runsheet[] = [
  {
    id: 'RS001',
    rider_id: 'R001',
    rider_name: 'Suresh Kumar',
    run_date: '2025-01-10',
    departure_time: '09:00',
    created_at: '2025-01-10T09:00:00Z', // Fixed timestamp when runsheet was created
    orders_assigned: ['ORD002'],
    route_zone: 'Zone A',
    status: 'In Transit',
    total_stops: 1,
    estimated_time: '30 mins'
  },
  {
    id: 'RS002',
    rider_id: 'R001',
    rider_name: 'Suresh Kumar',
    run_date: '2025-01-09',
    departure_time: '09:00',
    created_at: '2025-01-09T09:00:00Z', // Fixed timestamp when runsheet was created
    orders_assigned: ['ORD001', 'ORD002'],
    route_zone: 'Zone A',
    status: 'Completed',
    total_stops: 2,
    estimated_time: '45 mins'
  },
  {
    id: 'RS003',
    rider_id: 'R001',
    rider_name: 'Suresh Kumar',
    run_date: '2025-01-08',
    departure_time: '09:00',
    created_at: '2025-01-08T09:00:00Z', // Fixed timestamp when runsheet was created
    orders_assigned: ['ORD001'],
    route_zone: 'Zone A',
    status: 'Completed',
    total_stops: 1,
    estimated_time: '25 mins'
  }
];


