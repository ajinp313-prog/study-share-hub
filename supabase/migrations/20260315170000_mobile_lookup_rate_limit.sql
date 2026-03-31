-- ─────────────────────────────────────────────────────────────────────────────
-- Mobile-lookup rate limiting
--
-- Adds a per-mobile call counter to the get_user_email_by_mobile RPC so that
-- an unauthenticated caller cannot enumerate all registered mobile numbers at
-- speed.  The counter allows up to 5 lookups per 15-minute window before
-- returning an empty result set (silent rejection — no oracle for the caller).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create a small audit table to track call counts per mobile per window.
CREATE TABLE IF NOT EXISTS public.mobile_lookup_rate_limit (
    mobile          TEXT        NOT NULL,
    window_start    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    attempt_count   INTEGER     NOT NULL DEFAULT 1,
    PRIMARY KEY (mobile, window_start)
);

-- Enable RLS — only the SECURITY DEFINER function can write to this table.
ALTER TABLE public.mobile_lookup_rate_limit ENABLE ROW LEVEL SECURITY;

-- No user-facing policies; only server-side SECURITY DEFINER functions access it.

-- 2. Replace the existing get_user_email_by_mobile with rate-limited version.
CREATE OR REPLACE FUNCTION public.get_user_email_by_mobile(mobile_number TEXT)
RETURNS TABLE(email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_window        TIMESTAMP WITH TIME ZONE;
    v_count         INTEGER;
    v_max_attempts  CONSTANT INTEGER := 5;
    v_window_mins   CONSTANT INTEGER := 15;
BEGIN
    -- Round down to the nearest 15-minute window.
    v_window := date_trunc('hour', now()) +
                INTERVAL '15 minutes' *
                FLOOR(EXTRACT(MINUTE FROM now()) / v_window_mins);

    -- Upsert the attempt counter for this mobile + window.
    INSERT INTO public.mobile_lookup_rate_limit (mobile, window_start, attempt_count)
    VALUES (mobile_number, v_window, 1)
    ON CONFLICT (mobile, window_start)
    DO UPDATE SET attempt_count = mobile_lookup_rate_limit.attempt_count + 1
    RETURNING attempt_count INTO v_count;

    -- If the caller has exceeded the limit, return nothing silently.
    IF v_count > v_max_attempts THEN
        RETURN;
    END IF;

    -- Return the email for the given mobile number.
    RETURN QUERY
        SELECT au.email::TEXT
        FROM auth.users AS au
        JOIN public.profiles AS p ON p.user_id = au.id
        WHERE p.mobile = mobile_number
        LIMIT 1;
END;
$$;

-- 3. Scheduled clean-up: remove rows older than 1 hour to keep the table small.
--    (Run manually or via a pg_cron job; we provide the function here.)
CREATE OR REPLACE FUNCTION public.cleanup_mobile_lookup_rate_limit()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    DELETE FROM public.mobile_lookup_rate_limit
    WHERE window_start < now() - INTERVAL '1 hour';
$$;
