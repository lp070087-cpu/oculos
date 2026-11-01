-- Esquema inicial para Neon PostgreSQL (modo produção). Não é usado pela demonstração.
CREATE TABLE categories (id text PRIMARY KEY, label text NOT NULL, image_url text);
CREATE TABLE products (
  slug text PRIMARY KEY, name text NOT NULL, family text NOT NULL, variant text,
  category_id text REFERENCES categories(id), price_cents int NOT NULL, old_price_cents int,
  image_url text NOT NULL, stock int NOT NULL DEFAULT 0, hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, business text, email text UNIQUE, phone text,
  city text, segment text NOT NULL DEFAULT 'Novo', notes text,
  marketing_consent boolean NOT NULL DEFAULT false, consent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE addresses (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES customers(id) ON DELETE CASCADE, label text, line text, city text, zip text);
CREATE TABLE orders (
  id text PRIMARY KEY, customer_id uuid REFERENCES customers(id), status text NOT NULL, payment_method text,
  payment_status text NOT NULL, delivery text NOT NULL, address text, subtotal_cents int NOT NULL,
  discount_cents int NOT NULL DEFAULT 0, shipping_cents int NOT NULL, total_cents int NOT NULL,
  coupon text, tracking text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE order_items (order_id text REFERENCES orders(id) ON DELETE CASCADE, product_slug text REFERENCES products(slug), name text NOT NULL, qty int NOT NULL, price_cents int NOT NULL, PRIMARY KEY (order_id, product_slug));
CREATE TABLE order_events (id bigserial PRIMARY KEY, order_id text REFERENCES orders(id) ON DELETE CASCADE, text text NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE coupons (code text PRIMARY KEY, kind text NOT NULL, value numeric NOT NULL, active boolean NOT NULL DEFAULT true, uses int NOT NULL DEFAULT 0);
CREATE TABLE conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), customer_id uuid REFERENCES customers(id), wa_id text UNIQUE, mode text NOT NULL DEFAULT 'humano', tags text[] NOT NULL DEFAULT '{}', assignee text);
CREATE TABLE messages (id text PRIMARY KEY, conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE, author text NOT NULL, body text NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE campaigns (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, template_name text, audience text, status text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
