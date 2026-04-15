"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Bioimpedance, Demographics, Prediction } from "./types";

interface DemoState {
  demographics: Demographics | null;
  bioimpedance: Bioimpedance | null;
  prediction: Prediction | null;
  setDemographics: (d: Demographics) => void;
  setBioimpedance: (b: Bioimpedance) => void;
  setPrediction: (p: Prediction) => void;
  reset: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      demographics: null,
      bioimpedance: null,
      prediction: null,
      setDemographics: (demographics) => set({ demographics }),
      setBioimpedance: (bioimpedance) => set({ bioimpedance }),
      setPrediction: (prediction) => set({ prediction }),
      reset: () =>
        set({ demographics: null, bioimpedance: null, prediction: null }),
    }),
    {
      name: "gallstone-demo",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? (undefined as never) : sessionStorage,
      ),
    },
  ),
);
