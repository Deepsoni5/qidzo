import { create } from "zustand";

interface Exam {
  exam_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  duration_minutes: number;
  total_marks: number;
  pass_marks: number;
  is_free: boolean;
  price: number | string;
  total_questions: number;
  suggested_age_min: number | null;
  suggested_age_max: number | null;
  school: {
    school_id: string;
    name: string;
    logo_url: string | null;
  };
}

interface ExamStore {
  exams: Exam[];
  isLoading: boolean;
  lastFetched: number | null;
  setExams: (exams: Exam[]) => void;
  setLoading: (loading: boolean) => void;
  clearExams: () => void;
}

export const useExamStore = create<ExamStore>((set) => ({
  exams: [],
  isLoading: false,
  lastFetched: null,
  setExams: (exams) =>
    set({
      exams,
      lastFetched: Date.now(),
      isLoading: false,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearExams: () =>
    set({
      exams: [],
      lastFetched: null,
      isLoading: false,
    }),
}));
