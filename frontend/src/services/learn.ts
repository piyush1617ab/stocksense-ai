/**
 * 🔌 LEARN SERVICE — Backend integration point
 *
 * Endpoints:
 *   GET  /api/learn/lessons            → Lesson[]
 *   POST /api/learn/progress           → 200
 *
 * Currently lessons are hardcoded in components.
 * To go live: uncomment and call from Learn page / LearningPath.
 */

// import { apiFetch } from "@/lib/api";

// export interface Lesson {
//   id: string;
//   title: string;
//   description: string;
//   category: string;
//   difficulty: "beginner" | "intermediate" | "advanced";
//   content: string;
//   completed?: boolean;
// }

// export const getLessons = () => apiFetch<Lesson[]>("/api/learn/lessons");
// export const markProgress = (lessonId: string, completed: boolean) =>
//   apiFetch("/api/learn/progress", { method: "POST", body: { lessonId, completed } });
