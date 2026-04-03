import { create } from "zustand";
import type { ScannedProduct, AnalysisResult } from "../types/product";

interface ProductState {
  scannedProducts: ScannedProduct[];
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;

  addProduct: (product: ScannedProduct) => void;
  removeProduct: (id: string) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  reset: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  scannedProducts: [],
  analysisResult: null,
  isAnalyzing: false,

  addProduct: (product) =>
    set((state) => ({
      scannedProducts: [...state.scannedProducts, product],
    })),

  removeProduct: (id) =>
    set((state) => ({
      scannedProducts: state.scannedProducts.filter((p) => p.id !== id),
    })),

  setAnalysisResult: (result) => set({ analysisResult: result }),
  setIsAnalyzing: (value) => set({ isAnalyzing: value }),

  reset: () =>
    set({
      scannedProducts: [],
      analysisResult: null,
      isAnalyzing: false,
    }),
}));
