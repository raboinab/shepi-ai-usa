DROP INDEX IF EXISTS idx_adjustment_proofs_adj_id_type;
CREATE UNIQUE INDEX idx_adjustment_proofs_adj_id_type
  ON public.adjustment_proofs (adjustment_id, verification_type)
  WHERE verification_type != 'document_attachment';