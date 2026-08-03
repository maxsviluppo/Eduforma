import type { LearningAsset, LearningCategory, LearningCourse } from "./types";

const CATEGORY_GRADIENT: Record<LearningCategory, string> = {
  sicurezza: "linear-gradient(135deg, #fb7185 0%, #f97316 100%)",
  haccp: "linear-gradient(135deg, #34d399 0%, #0f8f8a 100%)",
  lingua: "linear-gradient(135deg, #60a5fa 0%, #6366f1 100%)",
  informatica: "linear-gradient(135deg, #38bdf8 0%, #3b82c4 100%)",
  "soft-skill": "linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)",
  tecnico: "linear-gradient(135deg, #0f8f8a 0%, #0a6f6b 100%)",
  altro: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
};

export function categoryGradient(category: LearningCategory): string {
  return CATEGORY_GRADIENT[category];
}

export function excerpt(text: string, max = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "Nessuna descrizione ancora.";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

export function courseCoverImageUrl(course: LearningCourse): string | undefined {
  if (course.coverImageUrl) return course.coverImageUrl;
  const asset = courseCoverAsset(course);
  if (asset?.type === "image" && asset.url) return asset.url;
  return undefined;
}

export function courseCoverAsset(course: LearningCourse): LearningAsset | null {
  const withUrl = course.assets.filter((a) => a.url);
  return (
    withUrl.find((a) => a.type === "image") ??
    withUrl.find((a) => a.type === "video") ??
    withUrl[0] ??
    null
  );
}

export function courseStats(course: LearningCourse) {
  const moduleContents = course.modules.reduce((n, m) => n + m.items.length, 0);
  return {
    modules: course.modules.length,
    assets: course.assets.length,
    moduleContents,
    unassigned: course.unassignedAssetIds.length,
  };
}

export function orderedCourseContents(course: LearningCourse): LearningAsset[] {
  const fromModules = course.modules.flatMap((mod) =>
    mod.items
      .map((item) => course.assets.find((a) => a.id === item.assetId))
      .filter((a): a is LearningAsset => Boolean(a))
  );
  const unassigned = course.unassignedAssetIds
    .map((id) => course.assets.find((a) => a.id === id))
    .filter((a): a is LearningAsset => Boolean(a));
  return [...fromModules, ...unassigned];
}
