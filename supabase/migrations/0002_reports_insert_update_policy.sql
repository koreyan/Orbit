CREATE POLICY "reports_insert_owner" ON public.reports FOR INSERT
WITH CHECK ( EXISTS (SELECT 1 FROM orders WHERE orders.id = reports.order_id AND orders.user_id = auth.uid()) );

CREATE POLICY "reports_update_owner" ON public.reports FOR UPDATE
USING ( EXISTS (SELECT 1 FROM orders WHERE orders.id = reports.order_id AND orders.user_id = auth.uid()) );
