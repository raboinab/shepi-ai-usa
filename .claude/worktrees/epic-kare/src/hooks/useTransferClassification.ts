import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TransferTotals {
  interbank: number;
  owner: number;
}

export interface ClassifiedTransaction {
  id: string;
  category: "interbank" | "owner" | "operating";
}

export interface PeriodClassification {
  interbank: number;
  owner: number;
  transactions: ClassifiedTransaction[];
}

export function useTransferClassification(projectId: string | undefined) {
  const [isClassifying, setIsClassifying] = useState(false);
  const queryClient = useQueryClient();

  const { data: rawData, isLoading } = useQuery({
    queryKey: ["transfer-classification", projectId],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "transfer_classification")
        .maybeSingle();

      if (error) {
        console.error("Error fetching transfer classifications:", error);
        throw error;
      }

      return (data?.data as unknown) as Record<string, PeriodClassification> | null;
    },
    enabled: !!projectId,
  });

  const classifications = useMemo(() => {
    if (!rawData) return null;
    const map = new Map<string, TransferTotals>();
    for (const [period, totals] of Object.entries(rawData)) {
      map.set(period, { interbank: totals.interbank, owner: totals.owner });
    }
    return map;
  }, [rawData]);

  const classify = async () => {
    if (!projectId || isClassifying) return;
    setIsClassifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("classify-transfers", {
        body: { project_id: projectId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await queryClient.invalidateQueries({
        queryKey: ["transfer-classification", projectId],
      });
    } catch (err) {
      console.error("Classification failed:", err);
      throw err;
    } finally {
      setIsClassifying(false);
    }
  };

  const updateClassifications = async (
    updated: Record<string, PeriodClassification>
  ) => {
    if (!projectId) return;

    // Find the existing record to get its id
    const { data: existing, error: fetchError } = await supabase
      .from("processed_data")
      .select("id")
      .eq("project_id", projectId)
      .eq("data_type", "transfer_classification")
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) throw new Error("No classification record found");

    const { error: updateError } = await supabase
      .from("processed_data")
      .update({ data: updated as unknown as Record<string, never> })
      .eq("id", existing.id);

    if (updateError) throw updateError;

    await queryClient.invalidateQueries({
      queryKey: ["transfer-classification", projectId],
    });
  };

  return {
    classifications,
    rawData,
    isLoading,
    classify,
    isClassifying,
    updateClassifications,
  };
}
