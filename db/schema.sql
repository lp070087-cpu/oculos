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
  marketing_consent boolean NOT NULL DEFAULT false, consent_at timestamptz, opt_out_at timestamptz,
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

-- Configuração de integrações. Tokens do Melhor Envio ficam cifrados em AES-256-GCM.
CREATE TABLE integration_settings (key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());

-- Recuperação de carrinhos. LGPD: só o necessário, consentimento registrado, descadastro respeitado.
-- O link de retomada guarda apenas o hash do token; o carrinho se liga ao cliente pela sessão autenticada.
CREATE TABLE carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), resume_token_hash text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL, total_cents int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), last_activity_at timestamptz NOT NULL DEFAULT now(),
  abandoned_at timestamptz, order_id text REFERENCES orders(id), converted_at timestamptz
);
CREATE INDEX carts_open ON carts (last_activity_at) WHERE order_id IS NULL;
CREATE TABLE cart_items (cart_id uuid REFERENCES carts(id) ON DELETE CASCADE, product_slug text REFERENCES products(slug), qty int NOT NULL CHECK (qty > 0), price_cents int NOT NULL, PRIMARY KEY (cart_id, product_slug));
CREATE TABLE recovery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid REFERENCES carts(id) ON DELETE CASCADE,
  channel text NOT NULL DEFAULT 'whatsapp', mode text NOT NULL, template_name text, body text NOT NULL,
  result text NOT NULL, provider_message_id text, error text,
  sent_on date NOT NULL DEFAULT current_date, created_at timestamptz NOT NULL DEFAULT now()
);
-- No máximo um envio por carrinho por dia, mesmo com cliques repetidos ou duas abas abertas.
CREATE UNIQUE INDEX recovery_once_per_day ON recovery_attempts (cart_id, sent_on) WHERE result IN ('enviando', 'enviada');
CREATE TABLE consent_log (id bigserial PRIMARY KEY, customer_id uuid REFERENCES customers(id) ON DELETE CASCADE, channel text NOT NULL, granted boolean NOT NULL, source text NOT NULL, at timestamptz NOT NULL DEFAULT now());