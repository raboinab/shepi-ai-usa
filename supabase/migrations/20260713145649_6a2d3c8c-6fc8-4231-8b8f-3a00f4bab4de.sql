
CREATE POLICY "Admins can update all documents" ON public.documents FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all documents" ON public.documents FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all processed data" ON public.processed_data FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all processed data" ON public.processed_data FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert processed data" ON public.processed_data FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all docuclipper jobs" ON public.docuclipper_jobs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all docuclipper jobs" ON public.docuclipper_jobs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all adjustment proofs" ON public.adjustment_proofs FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all adjustment proofs" ON public.adjustment_proofs FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all canonical transactions" ON public.canonical_transactions FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
