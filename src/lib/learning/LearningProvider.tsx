"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MAX_COVER_IMAGE_BYTES,
  MAX_EMBED_BYTES,
  detectMediaType,
  generateLearningId,
  type LearningAsset,
  type LearningCategory,
  type LearningCourse,
  type LearningMediaType,
  type LearningModule,
  type LearningState,
} from "./types";

const STORAGE_KEY = "aulanova-learning-v1";

const EMPTY_STATE: LearningState = { courses: [] };

function loadState(): LearningState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as LearningState;
    if (!parsed?.courses || !Array.isArray(parsed.courses)) return EMPTY_STATE;
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type LearningContextValue = {
  courses: LearningCourse[];
  hydrated: boolean;
  createCourse: (input: {
    title: string;
    category: LearningCategory;
    presentation?: string;
  }) => string;
  updateCourse: (
    id: string,
    patch: Partial<
      Pick<
        LearningCourse,
        "title" | "category" | "presentation" | "published" | "coverImageUrl"
      >
    >
  ) => void;
  setCourseCoverImage: (courseId: string, file: File) => Promise<boolean>;
  removeCourseCoverImage: (courseId: string) => void;
  deleteCourse: (id: string) => void;
  addLinkAsset: (
    courseId: string,
    input: { title: string; url: string; type?: LearningMediaType; notes?: string }
  ) => string | null;
  addFileAssets: (courseId: string, files: FileList | File[]) => Promise<string[]>;
  removeAsset: (courseId: string, assetId: string) => void;
  updateAsset: (
    courseId: string,
    assetId: string,
    patch: Partial<Pick<LearningAsset, "title" | "notes" | "type">>
  ) => void;
  addModule: (courseId: string, title: string) => string | null;
  updateModule: (
    courseId: string,
    moduleId: string,
    patch: Partial<Pick<LearningModule, "title" | "description">>
  ) => void;
  removeModule: (courseId: string, moduleId: string) => void;
  moveModule: (courseId: string, moduleId: string, direction: -1 | 1) => void;
  assignAssetToModule: (
    courseId: string,
    assetId: string,
    moduleId: string | null
  ) => void;
  moveAssetInModule: (
    courseId: string,
    moduleId: string,
    assetId: string,
    direction: -1 | 1
  ) => void;
  getCourse: (id: string) => LearningCourse | undefined;
};

const LearningContext = createContext<LearningContextValue | null>(null);

function touch(course: LearningCourse): LearningCourse {
  return { ...course, updatedAt: new Date().toISOString() };
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearningState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const getCourse = useCallback(
    (id: string) => state.courses.find((c) => c.id === id),
    [state.courses]
  );

  const createCourse = useCallback(
    (input: {
      title: string;
      category: LearningCategory;
      presentation?: string;
    }) => {
      const id = generateLearningId("learn");
      const now = new Date().toISOString();
      const course: LearningCourse = {
        id,
        title: input.title.trim(),
        category: input.category,
        presentation: input.presentation?.trim() ?? "",
        assets: [],
        modules: [],
        unassignedAssetIds: [],
        published: false,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ courses: [course, ...prev.courses] }));
      return id;
    },
    []
  );

  const updateCourse = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          LearningCourse,
          "title" | "category" | "presentation" | "published" | "coverImageUrl"
        >
      >
    ) => {
      setState((prev) => ({
        courses: prev.courses.map((c) =>
          c.id === id
            ? touch({
                ...c,
                ...patch,
                title: patch.title !== undefined ? patch.title.trim() : c.title,
                presentation:
                  patch.presentation !== undefined
                    ? patch.presentation
                    : c.presentation,
              })
            : c
        ),
      }));
    },
    []
  );

  const setCourseCoverImage = useCallback(
    async (courseId: string, file: File) => {
      if (!file.type.startsWith("image/")) return false;
      if (file.size > MAX_COVER_IMAGE_BYTES) return false;
      let dataUrl: string;
      try {
        dataUrl = await readFileAsDataUrl(file);
      } catch {
        return false;
      }
      setState((prev) => ({
        courses: prev.courses.map((c) =>
          c.id === courseId
            ? touch({ ...c, coverImageUrl: dataUrl })
            : c
        ),
      }));
      return true;
    },
    []
  );

  const removeCourseCoverImage = useCallback((courseId: string) => {
    setState((prev) => ({
      courses: prev.courses.map((c) =>
        c.id === courseId
          ? touch({ ...c, coverImageUrl: undefined })
          : c
      ),
    }));
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setState((prev) => ({
      courses: prev.courses.filter((c) => c.id !== id),
    }));
  }, []);

  const addLinkAsset = useCallback(
    (
      courseId: string,
      input: {
        title: string;
        url: string;
        type?: LearningMediaType;
        notes?: string;
      }
    ) => {
      const assetId = generateLearningId("asset");
      let created: string | null = null;
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          const asset: LearningAsset = {
            id: assetId,
            type: input.type ?? "link",
            title: input.title.trim() || input.url,
            url: input.url.trim(),
            notes: input.notes?.trim() || undefined,
            createdAt: new Date().toISOString(),
          };
          created = assetId;
          return touch({
            ...c,
            assets: [...c.assets, asset],
            unassignedAssetIds: [...c.unassignedAssetIds, assetId],
          });
        }),
      }));
      return created;
    },
    []
  );

  const addFileAssets = useCallback(
    async (courseId: string, files: FileList | File[]) => {
      const list = Array.from(files);
      const createdIds: string[] = [];
      const newAssets: LearningAsset[] = [];

      for (const file of list) {
        const id = generateLearningId("asset");
        let url: string | undefined;
        if (file.size <= MAX_EMBED_BYTES) {
          try {
            url = await readFileAsDataUrl(file);
          } catch {
            url = undefined;
          }
        }
        newAssets.push({
          id,
          type: detectMediaType(file),
          title: file.name.replace(/\.[^.]+$/, "") || file.name,
          fileName: file.name,
          mimeType: file.type || undefined,
          size: file.size,
          url,
          notes:
            !url && file.size > MAX_EMBED_BYTES
              ? "File troppo grande per l’anteprima locale (max 1,5 MB). Metadati salvati."
              : undefined,
          createdAt: new Date().toISOString(),
        });
        createdIds.push(id);
      }

      if (!newAssets.length) return createdIds;

      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return touch({
            ...c,
            assets: [...c.assets, ...newAssets],
            unassignedAssetIds: [
              ...c.unassignedAssetIds,
              ...newAssets.map((a) => a.id),
            ],
          });
        }),
      }));
      return createdIds;
    },
    []
  );

  const removeAsset = useCallback((courseId: string, assetId: string) => {
    setState((prev) => ({
      courses: prev.courses.map((c) => {
        if (c.id !== courseId) return c;
        return touch({
          ...c,
          assets: c.assets.filter((a) => a.id !== assetId),
          unassignedAssetIds: c.unassignedAssetIds.filter((id) => id !== assetId),
          modules: c.modules.map((m) => ({
            ...m,
            items: m.items.filter((i) => i.assetId !== assetId),
          })),
        });
      }),
    }));
  }, []);

  const updateAsset = useCallback(
    (
      courseId: string,
      assetId: string,
      patch: Partial<Pick<LearningAsset, "title" | "notes" | "type">>
    ) => {
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return touch({
            ...c,
            assets: c.assets.map((a) =>
              a.id === assetId ? { ...a, ...patch } : a
            ),
          });
        }),
      }));
    },
    []
  );

  const addModule = useCallback((courseId: string, title: string) => {
    const moduleId = generateLearningId("mod");
    let created: string | null = null;
    setState((prev) => ({
      courses: prev.courses.map((c) => {
        if (c.id !== courseId) return c;
        created = moduleId;
        return touch({
          ...c,
          modules: [
            ...c.modules,
            {
              id: moduleId,
              title: title.trim() || `Modulo ${c.modules.length + 1}`,
              items: [],
            },
          ],
        });
      }),
    }));
    return created;
  }, []);

  const updateModule = useCallback(
    (
      courseId: string,
      moduleId: string,
      patch: Partial<Pick<LearningModule, "title" | "description">>
    ) => {
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return touch({
            ...c,
            modules: c.modules.map((m) =>
              m.id === moduleId ? { ...m, ...patch } : m
            ),
          });
        }),
      }));
    },
    []
  );

  const removeModule = useCallback((courseId: string, moduleId: string) => {
    setState((prev) => ({
      courses: prev.courses.map((c) => {
        if (c.id !== courseId) return c;
        const mod = c.modules.find((m) => m.id === moduleId);
        const released = mod?.items.map((i) => i.assetId) ?? [];
        return touch({
          ...c,
          modules: c.modules.filter((m) => m.id !== moduleId),
          unassignedAssetIds: [
            ...c.unassignedAssetIds,
            ...released.filter((id) => !c.unassignedAssetIds.includes(id)),
          ],
        });
      }),
    }));
  }, []);

  const moveModule = useCallback(
    (courseId: string, moduleId: string, direction: -1 | 1) => {
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          const index = c.modules.findIndex((m) => m.id === moduleId);
          const next = index + direction;
          if (index < 0 || next < 0 || next >= c.modules.length) return c;
          const modules = [...c.modules];
          [modules[index], modules[next]] = [modules[next], modules[index]];
          return touch({ ...c, modules });
        }),
      }));
    },
    []
  );

  const assignAssetToModule = useCallback(
    (courseId: string, assetId: string, moduleId: string | null) => {
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          let modules = c.modules.map((m) => ({
            ...m,
            items: m.items.filter((i) => i.assetId !== assetId),
          }));
          let unassigned = c.unassignedAssetIds.filter((id) => id !== assetId);

          if (moduleId) {
            modules = modules.map((m) =>
              m.id === moduleId
                ? { ...m, items: [...m.items, { assetId }] }
                : m
            );
          } else {
            unassigned = [...unassigned, assetId];
          }

          return touch({ ...c, modules, unassignedAssetIds: unassigned });
        }),
      }));
    },
    []
  );

  const moveAssetInModule = useCallback(
    (
      courseId: string,
      moduleId: string,
      assetId: string,
      direction: -1 | 1
    ) => {
      setState((prev) => ({
        courses: prev.courses.map((c) => {
          if (c.id !== courseId) return c;
          return touch({
            ...c,
            modules: c.modules.map((m) => {
              if (m.id !== moduleId) return m;
              const index = m.items.findIndex((i) => i.assetId === assetId);
              const next = index + direction;
              if (index < 0 || next < 0 || next >= m.items.length) return m;
              const items = [...m.items];
              [items[index], items[next]] = [items[next], items[index]];
              return { ...m, items };
            }),
          });
        }),
      }));
    },
    []
  );

  const value = useMemo<LearningContextValue>(
    () => ({
      courses: state.courses,
      hydrated,
      createCourse,
      updateCourse,
      setCourseCoverImage,
      removeCourseCoverImage,
      deleteCourse,
      addLinkAsset,
      addFileAssets,
      removeAsset,
      updateAsset,
      addModule,
      updateModule,
      removeModule,
      moveModule,
      assignAssetToModule,
      moveAssetInModule,
      getCourse,
    }),
    [
      state.courses,
      hydrated,
      createCourse,
      updateCourse,
      setCourseCoverImage,
      removeCourseCoverImage,
      deleteCourse,
      addLinkAsset,
      addFileAssets,
      removeAsset,
      updateAsset,
      addModule,
      updateModule,
      removeModule,
      moveModule,
      assignAssetToModule,
      moveAssetInModule,
      getCourse,
    ]
  );

  return (
    <LearningContext.Provider value={value}>{children}</LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error("useLearning must be used within LearningProvider");
  return ctx;
}
