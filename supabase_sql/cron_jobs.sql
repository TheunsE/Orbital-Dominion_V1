-- This function should be run on a schedule (e.g., every minute) by a cron job.
-- Supabase can be configured to run functions on a schedule.

CREATE OR REPLACE FUNCTION public.process_building_queue()
RETURNS void AS $$
BEGIN
  -- Update levels of all buildings that have finished construction
  -- It joins player_buildings with the building_queue on the building_id
  -- and filters for queue items that are done.
  UPDATE public.player_buildings pb
  SET level = bq.target_level
  FROM public.building_queue bq
  WHERE pb.id = bq.building_id AND bq.ends_at <= now();

  -- Delete all finished items from the queue
  -- This keeps the queue clean and prevents reprocessing.
  DELETE FROM public.building_queue
  WHERE ends_at <= now();
END;
$$ LANGUAGE plpgsql;
