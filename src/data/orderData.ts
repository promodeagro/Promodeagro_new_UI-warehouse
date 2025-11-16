// Order Management Data Types and Dummy Data

export type OrderStatus = 'Placed' | 'Accepted' | 'Pending' | 'Packed' | 'On the way' | 'Delivered' | 'Undelivered' | 'Cancelled' | 'Returned' | 'Failed' | 'Out of Stock' | 'Items out of Stock' | 'Items No Stock';
export type PaymentMode = 'COD' | 'Online';

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  is_substituted: boolean;
  substituted_with?: string;
  is_out_of_stock?: boolean;
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
  discount?: number;
  shipping_charges?: number;
  packing_status?: 'pending' | 'assigned' | 'in_process' | 'packed' | 'out_of_stock' | 'cancelled';
  assigned_packer_id?: string;
  assigned_packer_name?: string;
  pincode?: string;
  cancellation_requested?: boolean;
  cancellation_reason?: string;
  cancellation_requested_at?: string;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  vehicle_number: string;
  current_status: 'Available' | 'On Delivery' | 'Off Duty';
  rating: number;
  total_deliveries: number;
}

export interface Runsheet {
  id: string;
  rider_id: string;
  rider_name: string;
  run_date: string;
  orders_assigned: string[];
  route_zone: string;
  status: 'Created' | 'In Transit' | 'Completed';
  total_stops: number;
  estimated_time: string;
}

// Dummy Orders Data
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
      { id: 'OI001', product_id: 'P001', product_name: 'Organic Tomatoes', quantity: 2, price: 45, subtotal: 90, is_substituted: false },
      { id: 'OI002', product_id: 'P004', product_name: 'Shimla Apples', quantity: 2, price: 120, subtotal: 240, is_substituted: false },
      { id: 'OI003', product_id: 'P007', product_name: 'Fresh Spinach', quantity: 3, price: 25, subtotal: 75, is_substituted: false },
      { id: 'OI004', product_id: 'P006', product_name: 'Orange Carrots', quantity: 2, price: 40, subtotal: 80, is_substituted: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: '2025-01-10T09:15:00Z',
    delivery_slot: 'afternoon',
    notes: 'Please call before delivery',
    packing_status: 'packed',
    assigned_packer_id: 'PKR-001',
    assigned_packer_name: 'Ravi Kumar',
    pincode: '110001'
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
    status: 'Packed',
    items: [
      { id: 'OI005', product_id: 'P002', product_name: 'Fresh Potatoes', quantity: 5, price: 30, subtotal: 150, is_substituted: false },
      { id: 'OI006', product_id: 'P003', product_name: 'Red Onions', quantity: 3, price: 35, subtotal: 105, is_substituted: false },
      { id: 'OI007', product_id: 'P005', product_name: 'Farm Bananas', quantity: 1, price: 50, subtotal: 50, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    updated_at: '2025-01-10T10:00:00Z',
    delivery_slot: '11:00 AM - 1:00 PM',
    packing_status: 'packed',
    assigned_packer_id: 'PKR-002',
    assigned_packer_name: 'Priya Sharma',
    pincode: '110016'
  },
  {
    id: 'ORD003',
    order_number: 'ORD-20251010-0003',
    customer_id: 'C003',
    customer_name: 'Amit Patel',
    customer_phone: '+91 98765 43212',
    address: '789, Sohna Road, Sector 49, Gurugram',
    lat: 28.4089,
    lng: 77.0531,
    zone: 'Zone B',
    total_amount: 595,
    payment_mode: 'Online',
    status: 'Placed',
    items: [
      { id: 'OI008', product_id: 'P008', product_name: 'Alphonso Mangoes', quantity: 3, price: 180, subtotal: 540, is_substituted: false },
      { id: 'OI009', product_id: 'P007', product_name: 'Fresh Spinach', quantity: 2, price: 25, subtotal: 50, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updated_at: '2025-01-10T09:00:00Z',
    delivery_slot: 'morning',
    packing_status: 'pending',
    assigned_packer_id: 'PKR-010',
    assigned_packer_name: 'Meera Agarwal',
    pincode: '110075'
  },
  {
    id: 'ORD005',
    order_number: 'ORD-20251010-0005',
    customer_id: 'C005',
    customer_name: 'Vikram Singh',
    customer_phone: '+91 98765 43214',
    address: '555, Cyber City, DLF Phase 3, Gurugram',
    lat: 28.4940,
    lng: 77.0890,
    zone: 'Zone A',
    total_amount: 265,
    payment_mode: 'Online',
    status: 'Failed',
    items: [
      { id: 'OI013', product_id: 'P005', product_name: 'Farm Bananas', quantity: 2, price: 50, subtotal: 100, is_substituted: false },
      { id: 'OI014', product_id: 'P003', product_name: 'Red Onions', quantity: 3, price: 35, subtotal: 105, is_substituted: false },
      { id: 'OI015', product_id: 'P006', product_name: 'Orange Carrots', quantity: 1, price: 40, subtotal: 40, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    updated_at: '2025-01-10T09:45:00Z',
    delivery_slot: 'evening',
    packing_status: 'pending',
    assigned_packer_id: 'PKR-001',
    assigned_packer_name: 'Ravi Kumar',
    pincode: '110024'
  },
  {
    id: 'ORD006',
    order_number: 'ORD-20251010-0006',
    customer_id: 'C006',
    customer_name: 'Amit Verma',
    customer_phone: '+91 98765 43213',
    address: '789, Cyber City, Gurugram',
    lat: 28.4960,
    lng: 77.0950,
    zone: 'Zone B',
    total_amount: 185, // 90 + 60 + 35 = 185 (excluding out-of-stock item)
    payment_mode: 'Online',
    status: 'Out of Stock',
    items: [
      { id: 'OI010', product_id: 'P001', product_name: 'Organic Tomatoes', quantity: 2, price: 45, subtotal: 90, is_substituted: false, is_out_of_stock: false },
      { id: 'OI011', product_id: 'P002', product_name: 'Fresh Potatoes', quantity: 2, price: 30, subtotal: 60, is_substituted: false, is_out_of_stock: false },
      { id: 'OI012', product_id: 'P003', product_name: 'Red Onions', quantity: 1, price: 35, subtotal: 35, is_substituted: false, is_out_of_stock: false },
      { id: 'OI013', product_id: 'P004', product_name: 'Orange Carrots', quantity: 2, price: 40, subtotal: 80, is_substituted: false, is_out_of_stock: true },
    ],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    delivery_slot: 'morning',
    packing_status: 'out_of_stock',
    assigned_packer_id: 'PKR-002',
    assigned_packer_name: 'Priya Sharma',
    pincode: '110016'
  },
  {
    id: 'ORD006',
    order_number: 'ORD-20251010-0006',
    customer_id: 'C006',
    customer_name: 'Sunil Gupta',
    customer_phone: '+91 98765 43215',
    address: '789, Sector 14, Gurugram',
    lat: 28.4595,
    lng: 77.0266,
    zone: 'Zone A',
    total_amount: 250,
    payment_mode: 'Online',
    status: 'Accepted',
    items: [
      { id: 'OI010', product_id: 'P001', product_name: 'Organic Tomatoes', quantity: 3, price: 45, subtotal: 135, is_substituted: false },
      { id: 'OI011', product_id: 'P002', product_name: 'Fresh Potatoes', quantity: 2, price: 30, subtotal: 60, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updated_at: '2025-01-10T11:00:00Z',
    delivery_slot: 'evening',
    packing_status: 'assigned',
    assigned_packer_id: 'PKR-003',
    assigned_packer_name: 'Amit Verma',
    pincode: '110075'
  },
  {
    id: 'ORD007',
    order_number: 'ORD-20251010-0007',
    customer_id: 'C007',
    customer_name: 'Neha Singh',
    customer_phone: '+91 98765 43216',
    address: '456, Vasant Kunj, Delhi',
    lat: 28.4920,
    lng: 77.0900,
    zone: 'Zone B',
    total_amount: 180,
    payment_mode: 'COD',
    status: 'Placed',
    items: [
      { id: 'OI012', product_id: 'P007', product_name: 'Fresh Spinach', quantity: 4, price: 25, subtotal: 100, is_substituted: false },
      { id: 'OI013', product_id: 'P006', product_name: 'Orange Carrots', quantity: 2, price: 40, subtotal: 80, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    updated_at: '2025-01-10T12:00:00Z',
    delivery_slot: 'morning',
    packing_status: 'pending',
    assigned_packer_id: 'PKR-004',
    assigned_packer_name: 'Sneha Gupta',
    pincode: '110070'
  },
  {
    id: 'ORD008',
    order_number: 'ORD-20251010-0008',
    customer_id: 'C008',
    customer_name: 'Rajesh Patel',
    customer_phone: '+91 98765 43217',
    address: '123, Rohini Sector 15, Delhi',
    lat: 28.4089,
    lng: 77.0531,
    zone: 'Zone C',
    total_amount: 320,
    payment_mode: 'Online',
    status: 'Accepted',
    items: [
      { id: 'OI014', product_id: 'P004', product_name: 'Shimla Apples', quantity: 2, price: 120, subtotal: 240, is_substituted: false },
      { id: 'OI015', product_id: 'P005', product_name: 'Farm Bananas', quantity: 2, price: 50, subtotal: 100, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    updated_at: '2025-01-10T10:00:00Z',
    delivery_slot: 'afternoon',
    packing_status: 'assigned',
    assigned_packer_id: 'PKR-005',
    assigned_packer_name: 'Rajesh Patel',
    pincode: '110089'
  },
  {
    id: 'ORD009',
    order_number: 'ORD-20251010-0009',
    customer_id: 'C009',
    customer_name: 'Kavita Singh',
    customer_phone: '+91 98765 43218',
    address: '789, Lajpat Nagar, Delhi',
    lat: 28.4595,
    lng: 77.0266,
    zone: 'Zone A',
    total_amount: 150,
    payment_mode: 'COD',
    status: 'Placed',
    items: [
      { id: 'OI016', product_id: 'P002', product_name: 'Fresh Potatoes', quantity: 3, price: 30, subtotal: 90, is_substituted: false },
      { id: 'OI017', product_id: 'P003', product_name: 'Red Onions', quantity: 2, price: 35, subtotal: 70, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    updated_at: '2025-01-10T12:30:00Z',
    delivery_slot: 'evening',
    packing_status: 'out_of_stock',
    assigned_packer_id: 'PKR-006',
    assigned_packer_name: 'Kavita Singh',
    pincode: '110024'
  },
  {
    id: 'ORD010',
    order_number: 'ORD-20251010-0010',
    customer_id: 'C010',
    customer_name: 'Vikram Yadav',
    customer_phone: '+91 98765 43219',
    address: '456, Karol Bagh, Delhi',
    lat: 28.4920,
    lng: 77.0900,
    zone: 'Zone B',
    total_amount: 280,
    payment_mode: 'Online',
    status: 'Accepted',
    items: [
      { id: 'OI018', product_id: 'P008', product_name: 'Alphonso Mangoes', quantity: 1, price: 180, subtotal: 180, is_substituted: false },
      { id: 'OI019', product_id: 'P001', product_name: 'Organic Tomatoes', quantity: 2, price: 45, subtotal: 90, is_substituted: false },
    ],
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    updated_at: '2025-01-10T09:00:00Z',
    delivery_slot: 'morning',
    packing_status: 'packed',
    assigned_packer_id: 'PKR-007',
    assigned_packer_name: 'Vikram Yadav',
    pincode: '110005'
  }
];

// Riders Data
export const riders: Rider[] = [
  { id: 'R001', name: 'Suresh Kumar', phone: '+91 98111 11111', vehicle_number: 'DL-01-AB-1234', current_status: 'On Delivery', rating: 4.8, total_deliveries: 1250 },
  { id: 'R002', name: 'Ramesh Yadav', phone: '+91 98111 11112', vehicle_number: 'DL-01-AB-5678', current_status: 'Available', rating: 4.6, total_deliveries: 980 },
  { id: 'R003', name: 'Manoj Singh', phone: '+91 98111 11113', vehicle_number: 'DL-01-AB-9012', current_status: 'On Delivery', rating: 4.9, total_deliveries: 1420 },
  { id: 'R004', name: 'Deepak Verma', phone: '+91 98111 11114', vehicle_number: 'DL-01-AB-3456', current_status: 'Available', rating: 4.7, total_deliveries: 1100 },
];

// Runsheets Data
export const runsheets: Runsheet[] = [
  {
    id: 'RS001',
    rider_id: 'R001',
    rider_name: 'Suresh Kumar',
    run_date: '2025-01-10',
    orders_assigned: ['ORD002'],
    route_zone: 'Zone A',
    status: 'In Transit',
    total_stops: 1,
    estimated_time: '30 mins'
  },
  {
    id: 'RS002',
    rider_id: 'R003',
    rider_name: 'Manoj Singh',
    run_date: '2025-01-10',
    orders_assigned: ['ORD001'],
    route_zone: 'Zone A',
    status: 'Created',
    total_stops: 1,
    estimated_time: '25 mins'
  }
];
