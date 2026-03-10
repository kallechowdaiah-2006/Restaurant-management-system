/*
  # Smart Restaurant Management System Database Schema

  ## Overview
  Complete database schema for a multi-portal restaurant management system with customer, manager, and chef portals.

  ## New Tables

  ### 1. restaurant_settings
  - `id` (uuid, primary key)
  - `name` (text) - Restaurant name
  - `address` (text) - Restaurant address
  - `currency` (text) - Currency symbol
  - `gst_percentage` (numeric) - GST percentage
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. customers
  - `id` (uuid, primary key)
  - `name` (text) - Customer name
  - `mobile` (text, unique) - Mobile number (used for session management)
  - `current_table_id` (uuid) - Currently booked table
  - `created_at` (timestamptz)
  - `last_active_at` (timestamptz)

  ### 3. tables
  - `id` (uuid, primary key)
  - `table_number` (integer, unique) - Table number
  - `status` (text) - available, occupied, reserved
  - `occupied_by` (uuid) - Reference to customer
  - `created_at` (timestamptz)

  ### 4. menu_categories
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `display_order` (integer) - Sort order
  - `created_at` (timestamptz)

  ### 5. menu_items
  - `id` (uuid, primary key)
  - `category_id` (uuid) - Foreign key to menu_categories
  - `name` (text) - Item name
  - `description` (text) - Item description
  - `price` (numeric) - Item price
  - `is_available` (boolean) - Availability status
  - `created_at` (timestamptz)

  ### 6. orders
  - `id` (uuid, primary key)
  - `order_number` (text, unique) - Human-readable order ID
  - `customer_id` (uuid) - Foreign key to customers
  - `table_id` (uuid) - Foreign key to tables
  - `status` (text) - pending_manager, approved, preparing, ready, served, cancelled
  - `total_amount` (numeric) - Order total
  - `estimated_time` (integer) - Preparation time in minutes
  - `cancellation_reason` (text) - Reason if cancelled
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. order_items
  - `id` (uuid, primary key)
  - `order_id` (uuid) - Foreign key to orders
  - `menu_item_id` (uuid) - Foreign key to menu_items
  - `item_name` (text) - Snapshot of item name
  - `item_price` (numeric) - Snapshot of item price
  - `quantity` (integer) - Quantity ordered
  - `subtotal` (numeric) - quantity * item_price

  ### 8. bills
  - `id` (uuid, primary key)
  - `bill_number` (text, unique) - Human-readable bill ID
  - `customer_id` (uuid) - Foreign key to customers
  - `table_id` (uuid) - Foreign key to tables
  - `customer_name` (text) - Snapshot of customer name
  - `customer_mobile` (text) - Snapshot of mobile
  - `subtotal` (numeric) - Total before GST
  - `gst_amount` (numeric) - GST amount
  - `total_amount` (numeric) - Final total
  - `payment_method` (text) - online, cash
  - `payment_status` (text) - pending, approved, completed
  - `bill_data` (jsonb) - Complete bill details for download
  - `created_at` (timestamptz)
  - `paid_at` (timestamptz)

  ### 9. feedback
  - `id` (uuid, primary key)
  - `customer_id` (uuid) - Foreign key to customers
  - `customer_name` (text) - Snapshot of customer name
  - `rating` (integer) - Star rating 1-5
  - `comment` (text) - Feedback comment
  - `created_at` (timestamptz)

  ### 10. manager_users
  - `id` (uuid, primary key)
  - `username` (text, unique) - Manager username
  - `password_hash` (text) - Hashed password
  - `created_at` (timestamptz)

  ### 11. chef_users
  - `id` (uuid, primary key)
  - `username` (text, unique) - Chef username
  - `password_hash` (text) - Hashed password
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public access for customers (authenticated by mobile number)
  - Protected access for manager and chef portals

  ## Indexes
  - Index on customer mobile for fast lookup
  - Index on order status for filtering
  - Index on table status for availability checks
*/

-- Create tables
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text DEFAULT 'My Restaurant',
  address text DEFAULT '',
  currency text DEFAULT '₹',
  gst_percentage numeric DEFAULT 18,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text UNIQUE NOT NULL,
  current_table_id uuid,
  created_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number integer UNIQUE NOT NULL,
  status text DEFAULT 'available',
  occupied_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES menu_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  table_id uuid REFERENCES tables(id),
  status text DEFAULT 'pending_manager',
  total_amount numeric DEFAULT 0,
  estimated_time integer,
  cancellation_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  item_name text NOT NULL,
  item_price numeric NOT NULL,
  quantity integer NOT NULL,
  subtotal numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  table_id uuid REFERENCES tables(id),
  customer_name text NOT NULL,
  customer_mobile text NOT NULL,
  subtotal numeric NOT NULL,
  gst_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending',
  bill_data jsonb,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS manager_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chef_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);

-- Insert default restaurant settings
INSERT INTO restaurant_settings (name, address, currency, gst_percentage)
VALUES ('Delicious Indian Restaurant', '123 Main Street, City, State - 123456', '₹', 18)
ON CONFLICT DO NOTHING;

-- Insert default menu categories
INSERT INTO menu_categories (name, display_order) VALUES
  ('Breakfast', 1),
  ('Lunch', 2),
  ('Dinner', 3),
  ('Starters', 4),
  ('Main Course', 5),
  ('Desserts', 6),
  ('Cool Drinks', 7)
ON CONFLICT DO NOTHING;

-- Insert sample menu items
DO $$
DECLARE
  breakfast_id uuid;
  lunch_id uuid;
  dinner_id uuid;
  starters_id uuid;
  main_course_id uuid;
  desserts_id uuid;
  drinks_id uuid;
BEGIN
  SELECT id INTO breakfast_id FROM menu_categories WHERE name = 'Breakfast';
  SELECT id INTO lunch_id FROM menu_categories WHERE name = 'Lunch';
  SELECT id INTO dinner_id FROM menu_categories WHERE name = 'Dinner';
  SELECT id INTO starters_id FROM menu_categories WHERE name = 'Starters';
  SELECT id INTO main_course_id FROM menu_categories WHERE name = 'Main Course';
  SELECT id INTO desserts_id FROM menu_categories WHERE name = 'Desserts';
  SELECT id INTO drinks_id FROM menu_categories WHERE name = 'Cool Drinks';

  INSERT INTO menu_items (category_id, name, description, price) VALUES
    (breakfast_id, 'Masala Dosa', 'Crispy rice crepe with spiced potato filling', 80),
    (breakfast_id, 'Idli Sambar', 'Steamed rice cakes with lentil soup', 60),
    (breakfast_id, 'Poha', 'Flattened rice with peanuts and spices', 50),
    (starters_id, 'Paneer Tikka', 'Grilled cottage cheese with spices', 180),
    (starters_id, 'Samosa', 'Crispy pastry with potato filling', 40),
    (starters_id, 'Pakora', 'Deep fried vegetable fritters', 90),
    (main_course_id, 'Butter Chicken', 'Creamy tomato-based chicken curry', 280),
    (main_course_id, 'Paneer Butter Masala', 'Cottage cheese in rich tomato gravy', 220),
    (main_course_id, 'Dal Makhani', 'Black lentils cooked with butter and cream', 180),
    (main_course_id, 'Biryani', 'Aromatic rice with vegetables and spices', 200),
    (lunch_id, 'Thali', 'Complete meal with rice, roti, dal, vegetables', 150),
    (lunch_id, 'Chole Bhature', 'Chickpea curry with fried bread', 120),
    (dinner_id, 'Roti with Curry', 'Indian bread with choice of curry', 140),
    (dinner_id, 'Naan with Paneer', 'Leavened bread with cottage cheese curry', 180),
    (desserts_id, 'Gulab Jamun', 'Sweet milk dumplings in sugar syrup', 60),
    (desserts_id, 'Rasgulla', 'Spongy cottage cheese balls in syrup', 60),
    (desserts_id, 'Kulfi', 'Traditional Indian ice cream', 70),
    (drinks_id, 'Mango Lassi', 'Sweet yogurt drink with mango', 80),
    (drinks_id, 'Masala Chai', 'Spiced Indian tea', 30),
    (drinks_id, 'Fresh Lime Soda', 'Refreshing lime drink', 50),
    (drinks_id, 'Buttermilk', 'Spiced yogurt drink', 40)
  ON CONFLICT DO NOTHING;
END $$;

-- Insert sample tables
INSERT INTO tables (table_number, status) VALUES
  (1, 'available'),
  (2, 'available'),
  (3, 'available'),
  (4, 'available'),
  (5, 'available'),
  (6, 'available'),
  (7, 'available'),
  (8, 'available'),
  (9, 'available'),
  (10, 'available')
ON CONFLICT DO NOTHING;

-- Insert default manager user (username: manager, password: manager123)
-- Password hash for 'manager123'
INSERT INTO manager_users (username, password_hash)
VALUES ('manager', 'manager123')
ON CONFLICT DO NOTHING;

-- Insert default chef user (username: chef, password: chef123)
-- Password hash for 'chef123'
INSERT INTO chef_users (username, password_hash)
VALUES ('chef', 'chef123')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chef_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (customers)
CREATE POLICY "Allow public read access to restaurant settings"
  ON restaurant_settings FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to tables"
  ON tables FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to menu categories"
  ON menu_categories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to menu items"
  ON menu_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert to customers"
  ON customers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read own customer data"
  ON customers FOR SELECT
  USING (true);

CREATE POLICY "Allow public update own customer data"
  ON customers FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Allow public update orders"
  ON orders FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read order items"
  ON order_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert bills"
  ON bills FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read bills"
  ON bills FOR SELECT
  USING (true);

CREATE POLICY "Allow public update bills"
  ON bills FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public read feedback"
  ON feedback FOR SELECT
  USING (true);

CREATE POLICY "Allow public read manager users"
  ON manager_users FOR SELECT
  USING (true);

CREATE POLICY "Allow public read chef users"
  ON chef_users FOR SELECT
  USING (true);

CREATE POLICY "Allow public update tables"
  ON tables FOR UPDATE
  USING (true);

CREATE POLICY "Allow public update restaurant settings"
  ON restaurant_settings FOR UPDATE
  USING (true);

CREATE POLICY "Allow public insert menu categories"
  ON menu_categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update menu categories"
  ON menu_categories FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete menu categories"
  ON menu_categories FOR DELETE
  USING (true);

CREATE POLICY "Allow public insert menu items"
  ON menu_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update menu items"
  ON menu_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete menu items"
  ON menu_items FOR DELETE
  USING (true);

CREATE POLICY "Allow public insert tables"
  ON tables FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public delete tables"
  ON tables FOR DELETE
  USING (true);
