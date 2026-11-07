CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(320) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    balance NUMERIC(20, 2) NOT NULL DEFAULT 100000 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(32) NOT NULL DEFAULT 'crypto',
    current_price NUMERIC(20, 8) NOT NULL CHECK (current_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    average_buy_price NUMERIC(20, 8) NOT NULL CHECK (average_buy_price > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, asset_id)
);

CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    type VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    price NUMERIC(20, 8) NOT NULL CHECK (price > 0),
    total NUMERIC(20, 2) NOT NULL CHECK (total > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
    type VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
    quantity NUMERIC(20, 8) NOT NULL CHECK (quantity > 0),
    status VARCHAR(10) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_asset_id ON trades(asset_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_holdings_user_id ON holdings(user_id);
CREATE INDEX IF NOT EXISTS idx_holdings_asset_id ON holdings(asset_id);

-- Preserve legacy simulation data for manual review and migrate safe rows.
DO $$
BEGIN
    IF to_regclass('public.simulation_states') IS NOT NULL THEN
        INSERT INTO users (id, name, email)
        SELECT user_id::uuid, NULL, user_id::text || '@legacy.invalid'
        FROM simulation_states
        WHERE user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO wallets (user_id, balance)
        SELECT user_id::uuid, GREATEST(COALESCE(wallet_balance, 100000), 0)
        FROM simulation_states
        WHERE user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        ON CONFLICT (user_id) DO UPDATE SET balance = EXCLUDED.balance;
    END IF;
END $$;

DO $$
DECLARE
    legacy_row RECORD;
    holding_row JSONB;
    normalized_symbol VARCHAR(32);
    holding_quantity NUMERIC;
    holding_price NUMERIC;
    asset_uuid UUID;
BEGIN
    IF to_regclass('public.simulation_states') IS NOT NULL THEN
        FOR legacy_row IN
            SELECT user_id::uuid AS user_uuid, portfolio_holdings
            FROM simulation_states
            WHERE user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        LOOP
            FOR holding_row IN
                SELECT value FROM jsonb_array_elements(CASE
                    WHEN jsonb_typeof(legacy_row.portfolio_holdings) = 'array'
                    THEN legacy_row.portfolio_holdings ELSE '[]'::jsonb END)
            LOOP
                normalized_symbol := upper(regexp_replace(COALESCE(holding_row->>'symbol', ''), 'USDT$', ''));
                holding_quantity := NULL;
                holding_price := NULL;
                IF (holding_row->>'quantity') ~ '^[0-9]+(\.[0-9]+)?$' THEN
                    holding_quantity := (holding_row->>'quantity')::numeric;
                END IF;
                IF (holding_row->>'buyPrice') ~ '^[0-9]+(\.[0-9]+)?$' THEN
                    holding_price := (holding_row->>'buyPrice')::numeric;
                ELSIF (holding_row->>'averageBuyPrice') ~ '^[0-9]+(\.[0-9]+)?$' THEN
                    holding_price := (holding_row->>'averageBuyPrice')::numeric;
                END IF;
                IF normalized_symbol ~ '^[A-Z0-9]{2,15}$'
                   AND holding_quantity > 0
                   AND holding_price > 0 THEN
                    INSERT INTO assets (symbol, name, asset_type, current_price)
                    VALUES (normalized_symbol, normalized_symbol, 'crypto', holding_price)
                    ON CONFLICT (symbol) DO UPDATE SET updated_at = NOW()
                    RETURNING id INTO asset_uuid;

                    INSERT INTO holdings (user_id, asset_id, quantity, average_buy_price)
                    VALUES (legacy_row.user_uuid, asset_uuid, holding_quantity, holding_price)
                    ON CONFLICT (user_id, asset_id) DO NOTHING;
                END IF;
            END LOOP;
        END LOOP;
    END IF;
END $$;
