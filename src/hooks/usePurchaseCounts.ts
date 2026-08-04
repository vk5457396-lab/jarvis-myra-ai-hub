import { useQuery } from "@tanstack/react-query";

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
      const counts = { jarvis: 0, myra: 0, bundle: 0, total: 0, totalRevenue: 0 };

      const res = await fetch("/api/purchases/stats");
      const json = await res.json();
      if (!json.success) return counts;

      (json.data.counts as Array<{ product_type: string; count: number; revenue: number }>).forEach((row) => {
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
