import { useMutation } from "@tanstack/react-query";
import { analyzeProducts } from "../services/analyzer";
import { useProductStore } from "../stores/useProductStore";

export function useProductAnalysis() {
  const scannedProducts = useProductStore((s) => s.scannedProducts);
  const setAnalysisResult = useProductStore((s) => s.setAnalysisResult);
  const setIsAnalyzing = useProductStore((s) => s.setIsAnalyzing);

  return useMutation({
    mutationFn: async () => {
      if (scannedProducts.length < 2) {
        throw new Error("Necesitas al menos 2 productos para comparar");
      }
      return analyzeProducts(scannedProducts);
    },
    onMutate: () => setIsAnalyzing(true),
    onSuccess: (result) => setAnalysisResult(result),
    onSettled: () => setIsAnalyzing(false),
  });
}
