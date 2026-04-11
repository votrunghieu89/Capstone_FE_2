import { create } from 'zustand';

interface DiagnosisResult {
  diagnosis: string;
  severity: string;
  severity_score: number;
  estimated_cost_min: number;
  estimated_cost_max: number;
  recommended_category: string;
  safety_warning?: string;
  suggested_actions: string[];
}

interface RequestState {
  currentDiagnosis: DiagnosisResult | null;
  isLoading: boolean;
  error: string | null;
  setDiagnosis: (diagnosis: DiagnosisResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  currentDiagnosis: null,
  isLoading: false,
  error: null,
  setDiagnosis: (diagnosis) => set({ currentDiagnosis: diagnosis }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
