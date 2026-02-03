-- Add explicit policies to deny unauthenticated access to support_tickets table
CREATE POLICY "Deny unauthenticated access to support_tickets"
ON public.support_tickets
FOR SELECT
TO anon
USING (false);

-- Add explicit policies to deny unauthenticated access to feedback table
CREATE POLICY "Deny unauthenticated access to feedback"
ON public.feedback
FOR SELECT
TO anon
USING (false);

-- Add explicit policies to deny unauthenticated access to user_roles table
CREATE POLICY "Deny unauthenticated access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);