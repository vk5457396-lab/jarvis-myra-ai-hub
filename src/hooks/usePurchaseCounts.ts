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
    // The route itself is now edge-cached for 2min (see /api/purchases/stats), so a short client
    // staleTime/interval no longer buys real freshness - it just re-hits an already-cached
    // response. Widened both; refetchOnWindowFocus stays on since that one's cheap (edge cache
    // absorbs it) and keeps the number current when someone tabs back in.
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  });
};
