export interface Database {
  public: {
    Tables: {
      restaurant_settings: {
        Row: RestaurantSettings;
        Insert: Omit<Partial<RestaurantSettings>, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<RestaurantSettings>;
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: { name: string; mobile: string; current_table_id?: string | null; last_active_at?: string };
        Update: Partial<Customer>;
        Relationships: [];
      };
      tables: {
        Row: Table;
        Insert: { table_number: number; status?: string; occupied_by?: string | null };
        Update: Partial<Table>;
        Relationships: [];
      };
      menu_categories: {
        Row: MenuCategory;
        Insert: { name: string; display_order?: number };
        Update: Partial<MenuCategory>;
        Relationships: [];
      };
      menu_items: {
        Row: MenuItem;
        Insert: { category_id: string; name: string; description?: string; price: number; is_available?: boolean };
        Update: Partial<MenuItem>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: { order_number: string; customer_id: string; table_id: string; status?: string; total_amount?: number; estimated_time?: number | null; cancellation_reason?: string | null };
        Update: Partial<Order>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: { order_id: string; menu_item_id: string; item_name: string; item_price: number; quantity: number; subtotal: number };
        Update: Partial<OrderItem>;
        Relationships: [];
      };
      bills: {
        Row: Bill;
        Insert: { bill_number: string; customer_id: string; table_id: string; customer_name: string; customer_mobile: string; subtotal: number; gst_amount: number; total_amount: number; payment_method?: string | null; payment_status?: string; bill_data?: BillData | null; paid_at?: string | null };
        Update: Partial<Bill>;
        Relationships: [];
      };
      feedback: {
        Row: Feedback;
        Insert: { customer_id: string; customer_name: string; rating: number; comment?: string };
        Update: Partial<Feedback>;
        Relationships: [];
      };
      manager_users: {
        Row: ManagerUser;
        Insert: { username: string; password_hash: string };
        Update: Partial<ManagerUser>;
        Relationships: [];
      };
      chef_users: {
        Row: ChefUser;
        Insert: { username: string; password_hash: string };
        Update: Partial<ChefUser>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}


export interface RestaurantSettings {
  id: string;
  name: string;
  address: string;
  currency: string;
  gst_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  current_table_id: string | null;
  created_at: string;
  last_active_at: string;
}

export interface Table {
  id: string;
  table_number: number;
  status: 'available' | 'occupied' | 'reserved';
  occupied_by: string | null;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  table_id: string;
  status: 'pending_manager' | 'approved' | 'preparing' | 'ready' | 'served' | 'cancelled';
  total_amount: number;
  estimated_time: number | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_id: string;
  table_id: string;
  customer_name: string;
  customer_mobile: string;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  payment_method: 'online' | 'cash' | null;
  payment_status: 'pending' | 'approved' | 'completed';
  bill_data: BillData | null;
  created_at: string;
  paid_at: string | null;
}

export interface BillData {
  restaurantName: string;
  restaurantAddress: string;
  customerName: string;
  customerMobile: string;
  tableNumber: number;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  date: string;
  time: string;
}

export interface Feedback {
  id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ManagerUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface ChefUser {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}
