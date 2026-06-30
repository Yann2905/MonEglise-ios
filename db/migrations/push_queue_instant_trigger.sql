-- ============================================================
-- Trigger DB : invoke le worker process-push-queue
-- INSTANTANÉMENT à chaque INSERT de notification pending.
--
-- Appliqué en production via Supabase MCP le 2026-06-30.
-- Le cron toutes les minutes RESTE EN PLACE comme filet de
-- sécurité (catch les notifs ratées si pg_net échoue).
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_push_worker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  pending_count INT;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM new_rows
  WHERE push_status = 'pending';

  IF pending_count > 0 THEN
    PERFORM net.http_post(
      url := 'https://jjnggbkofkadtstxvteo.supabase.co/functions/v1/process-push-queue',
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_invoke_push_worker ON public.notifications;
CREATE TRIGGER trigger_invoke_push_worker
  AFTER INSERT ON public.notifications
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trigger_push_worker();

COMMENT ON TRIGGER trigger_invoke_push_worker ON public.notifications IS
  'Invoque process-push-queue instantanement apres chaque INSERT de notification pending. Le cron 1 min reste en place comme safety net.';
