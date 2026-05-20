import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseCounts {
  jarvis: number;
  myra: number;
  bundle: number;
  total: number;
  totalRevenue: number;
}

export const usePurchaseCounts = () => {
  return useQuery({
    queryKey: ["purchase-counts"],
    queryFn: async (): Promise<PurchaseCounts> => {
      const { data, error } = await supabase.rpc("get_purchase_counts");

      if (error) {
        return { jarvis: 0, myra: 0, bundle: 0, total: 0, totalRevenue: 0 };
      }

      const counts = { jarvis: 0, myra: 0, bundle: 0, total: 0, totalRevenue: 0 };

      (data as Array<{ product_type: string; count: number; revenue: number }> | null)?.forEach((row) => {
        const c = Number(row.count) || 0;
        const r = Number(row.revenue) || 0;
        counts.total += c;
        counts.totalRevenue += r;
        if (row.product_type === "jarvis" || row.product_type === "jarvis_source") {
          counts.jarvis += c;
        } else if (row.product_type === "myra" || row.product_type === "myra_source") {
          counts.myra += c;
        } else if (row.product_type === "bundle" || row.product_type === "bundle_source") {
          counts.bundle += c;
          counts.jarvis += c;
          counts.myra += c;
        }
      });

      return counts;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - refresh more often
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });
};
