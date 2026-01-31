import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PurchaseCounts {
  jarvis: number;
  myra: number;
  bundle: number;
  total: number;
}

export const usePurchaseCounts = () => {
  return useQuery({
    queryKey: ["purchase-counts"],
    queryFn: async (): Promise<PurchaseCounts> => {
      const { data, error } = await supabase
        .from("purchases")
        .select("product_type");

      if (error) {
        console.error("Error fetching purchase counts:", error);
        return { jarvis: 0, myra: 0, bundle: 0, total: 0 };
      }

      const counts = {
        jarvis: 0,
        myra: 0,
        bundle: 0,
        total: 0,
      };

      data?.forEach((purchase) => {
        counts.total++;
        if (purchase.product_type === "jarvis" || purchase.product_type === "jarvis_source") {
          counts.jarvis++;
        } else if (purchase.product_type === "myra" || purchase.product_type === "myra_source") {
          counts.myra++;
        } else if (purchase.product_type === "bundle" || purchase.product_type === "bundle_source") {
          counts.bundle++;
          // Bundle counts towards both products
          counts.jarvis++;
          counts.myra++;
        }
      });

      return counts;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
