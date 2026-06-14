-- Allow users to delete their own safety reports
CREATE POLICY "reports_delete_own" ON public.safety_reports
  FOR DELETE USING (auth.uid() = user_id);
