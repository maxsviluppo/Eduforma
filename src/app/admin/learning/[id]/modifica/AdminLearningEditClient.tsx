"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  ImagePlus,
  Link2,
  Plus,
  Presentation,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { LearningCourseCover } from "@/components/learning/LearningAssetPreview";
import { useLearning } from "@/lib/learning/LearningProvider";
import { categoryGradient } from "@/lib/learning/helpers";
import {
  LEARNING_CATEGORY_LABELS,
  LEARNING_MEDIA_LABELS,
  MAX_COVER_IMAGE_BYTES,
  formatBytes,
  type LearningAsset,
  type LearningCategory,
  type LearningMediaType,
} from "@/lib/learning/types";

type Tab = "presentazione" | "contenuti" | "organizza";

const MEDIA_ICON: Record<LearningMediaType, typeof FileText> = {
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  slide: Presentation,
  image: FileImage,
  link: Link2,
  other: FolderOpen,
};

function MediaIcon({ type }: { type: LearningMediaType }) {
  const Icon = MEDIA_ICON[type];
  return <Icon className="h-4 w-4" />;
}

export default function AdminLearningEditClient({ courseId }: { courseId: string }) {
  const {
    courses,
    hydrated,
    updateCourse,
    deleteCourse,
    setCourseCoverImage,
    removeCourseCoverImage,
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
  } = useLearning();

  const [tab, setTab] = useState<Tab>("presentazione");
  const [savedFlash, setSavedFlash] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const selected = courses.find((c) => c.id === courseId);

  const [draft, setDraft] = useState({
    title: "",
    category: "tecnico" as LearningCategory,
    presentation: "",
    published: false,
  });

  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    type: "link" as LearningMediaType,
  });
  const [newModuleTitle, setNewModuleTitle] = useState("");

  useEffect(() => {
    if (!selected) return;
    setDraft({
      title: selected.title,
      category: selected.category,
      presentation: selected.presentation,
      published: selected.published,
    });
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const assetMap = useMemo(() => {
    const map = new Map<string, LearningAsset>();
    selected?.assets.forEach((a) => map.set(a.id, a));
    return map;
  }, [selected]);

  const savePresentation = () => {
    if (!selected) return;
    if (!draft.title.trim()) return;
    updateCourse(selected.id, {
      title: draft.title,
      category: draft.category,
      presentation: draft.presentation,
      published: draft.published,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  const onUpload = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    setUploading(true);
    try {
      await addFileAssets(selected.id, files);
      setTab("contenuti");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addLink = () => {
    if (!selected || !linkForm.url.trim()) return;
    addLinkAsset(selected.id, {
      title: linkForm.title || linkForm.url,
      url: linkForm.url,
      type: linkForm.type,
    });
    setLinkForm({ title: "", url: "", type: "link" });
  };

  const onCoverUpload = async (files: FileList | null) => {
    if (!selected || !files?.[0]) return;
    const file = files[0];
    setCoverError("");
    if (!file.type.startsWith("image/")) {
      setCoverError("Seleziona un file immagine (JPG, PNG, WebP…).");
      return;
    }
    if (file.size > MAX_COVER_IMAGE_BYTES) {
      setCoverError(
        `Immagine troppo grande (max ${formatBytes(MAX_COVER_IMAGE_BYTES)}).`
      );
      return;
    }
    setCoverUploading(true);
    try {
      const ok = await setCourseCoverImage(selected.id, file);
      if (!ok) setCoverError("Caricamento non riuscito. Riprova.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white/50 p-8 text-sm text-ink-soft">
        Caricamento…
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="glass rounded-3xl px-6 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">Corso non trovato</p>
        <Link href="/admin/learning" className="btn-primary mt-6 inline-flex">
          Torna alla dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/learning/${selected.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-teal-deep hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Anteprima corso
        </Link>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Eliminare questo percorso learning e tutti i contenuti?"
              )
            ) {
              deleteCourse(selected.id);
              window.location.href = "/admin/learning";
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Elimina corso
        </button>
      </div>

      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-deep">
          Modifica corso
        </p>
        <h1 className="font-display text-3xl font-bold text-ink">{selected.title}</h1>
      </header>

      <section className="glass rounded-3xl p-5 md:p-6">
        <div className="flex flex-wrap gap-2 border-b border-line/70 pb-4">
          {(
            [
              ["presentazione", "Presentazione"],
              ["contenuti", "Contenuti"],
              ["organizza", "Organizza"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                tab === id
                  ? "bg-teal text-white"
                  : "bg-white/60 text-ink-soft hover:bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "presentazione" && (
          <div className="mt-5 space-y-4">
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Immagine anteprima corso
              </span>
              <div
                className="overflow-hidden rounded-2xl border border-line/70 bg-white/40"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onCoverUpload(e.dataTransfer.files);
                }}
              >
                <div className="relative aspect-[16/10] max-h-56 w-full max-w-xl overflow-hidden">
                  <LearningCourseCover
                    coverImageUrl={selected.coverImageUrl}
                    cover={null}
                    categoryGradient={categoryGradient(draft.category)}
                    title={draft.title || "Anteprima corso"}
                    className="absolute inset-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-line/60 p-3">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void onCoverUpload(e.target.files)}
                  />
                  <button
                    type="button"
                    disabled={coverUploading}
                    onClick={() => coverInputRef.current?.click()}
                    className="btn-primary gap-2 !py-2 text-sm"
                  >
                    <ImagePlus className="h-4 w-4" />
                    {coverUploading ? "Caricamento…" : "Carica immagine"}
                  </button>
                  {selected.coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => removeCourseCoverImage(selected.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-bold text-ink-soft hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-3.5 w-3.5" />
                      Rimuovi
                    </button>
                  )}
                  <span className="text-[11px] text-ink-soft">
                    JPG, PNG, WebP · max {formatBytes(MAX_COVER_IMAGE_BYTES)}
                  </span>
                </div>
                {coverError && (
                  <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {coverError}
                  </p>
                )}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Nome corso
              </span>
              <input
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-teal"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Categoria corso
              </span>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    category: e.target.value as LearningCategory,
                  }))
                }
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-teal"
              >
                {(
                  Object.keys(LEARNING_CATEGORY_LABELS) as LearningCategory[]
                ).map((key) => (
                  <option key={key} value={key}>
                    {LEARNING_CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
                Presentazione
              </span>
              <textarea
                value={draft.presentation}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, presentation: e.target.value }))
                }
                rows={8}
                className="w-full rounded-2xl border border-line bg-white/70 px-4 py-3 text-sm leading-relaxed text-ink outline-none focus:border-teal"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, published: e.target.checked }))
                }
                className="h-4 w-4 accent-[var(--teal)]"
              />
              Pubblica per gli studenti (demo locale)
            </label>

            <button
              type="button"
              onClick={savePresentation}
              className="btn-primary gap-2"
            >
              <Save className="h-4 w-4" />
              Salva presentazione
            </button>
            {savedFlash && (
              <span className="ml-3 text-sm font-bold text-teal-deep">Salvato</span>
            )}
          </div>
        )}

        {tab === "contenuti" && (
          <div className="mt-5 space-y-5">
            <div
              className="rounded-3xl border border-dashed border-teal/40 bg-teal/[0.04] px-5 py-8 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void onUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="mx-auto h-8 w-8 text-teal-deep" />
              <p className="mt-2 font-display text-lg font-bold text-ink">
                Carica contenuti multimediali
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*,.pdf,.ppt,.pptx,.key,.odp,.doc,.docx,.xls,.xlsx,.zip"
                className="hidden"
                onChange={(e) => void onUpload(e.target.files)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary mt-4 gap-2"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Caricamento…" : "Seleziona file"}
              </button>
            </div>

            <div className="rounded-2xl border border-line/70 bg-white/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Oppure aggiungi un link
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.4fr_auto_auto]">
                <input
                  value={linkForm.title}
                  onChange={(e) =>
                    setLinkForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Titolo"
                  className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-teal"
                />
                <input
                  value={linkForm.url}
                  onChange={(e) =>
                    setLinkForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://…"
                  className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-teal"
                />
                <select
                  value={linkForm.type}
                  onChange={(e) =>
                    setLinkForm((f) => ({
                      ...f,
                      type: e.target.value as LearningMediaType,
                    }))
                  }
                  className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none focus:border-teal"
                >
                  {(
                    Object.keys(LEARNING_MEDIA_LABELS) as LearningMediaType[]
                  ).map((t) => (
                    <option key={t} value={t}>
                      {LEARNING_MEDIA_LABELS[t]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addLink}
                  className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white hover:bg-teal-deep"
                >
                  Aggiungi
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {selected.assets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-line/60 bg-white/45 px-4 py-3"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal/10 text-teal-deep">
                    <MediaIcon type={asset.type} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={asset.title}
                      onChange={(e) =>
                        updateAsset(selected.id, asset.id, {
                          title: e.target.value,
                        })
                      }
                      className="w-full bg-transparent text-sm font-bold text-ink outline-none"
                    />
                    <p className="text-[11px] text-ink-soft">
                      {LEARNING_MEDIA_LABELS[asset.type]}
                      {asset.fileName ? ` · ${asset.fileName}` : ""}
                      {asset.size ? ` · ${formatBytes(asset.size)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAsset(selected.id, asset.id)}
                    className="rounded-full p-2 text-ink-soft hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "organizza" && (
          <div className="mt-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Titolo nuovo modulo"
                className="min-w-[220px] flex-1 rounded-xl border border-line bg-white/70 px-3 py-2 text-sm outline-none focus:border-teal"
              />
              <button
                type="button"
                onClick={() => {
                  addModule(selected.id, newModuleTitle);
                  setNewModuleTitle("");
                }}
                className="btn-primary gap-2"
              >
                <Plus className="h-4 w-4" />
                Aggiungi modulo
              </button>
            </div>

            <div className="rounded-2xl border border-line/70 bg-white/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                Libreria non assegnata ({selected.unassignedAssetIds.length})
              </p>
              <ul className="mt-3 space-y-2">
                {selected.unassignedAssetIds.map((assetId) => {
                  const asset = assetMap.get(assetId);
                  if (!asset) return null;
                  return (
                    <li
                      key={assetId}
                      className="flex flex-wrap items-center gap-2 rounded-xl bg-white/60 px-3 py-2"
                    >
                      <MediaIcon type={asset.type} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {asset.title}
                      </span>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const moduleId = e.target.value;
                          if (!moduleId) return;
                          assignAssetToModule(selected.id, assetId, moduleId);
                          e.currentTarget.value = "";
                        }}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-semibold"
                      >
                        <option value="">Assegna a…</option>
                        {selected.modules.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.title}
                          </option>
                        ))}
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="space-y-4">
              {selected.modules.map((mod, modIndex) => (
                <div
                  key={mod.id}
                  className="rounded-2xl border border-line/70 bg-white/50 p-4"
                >
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <input
                        value={mod.title}
                        onChange={(e) =>
                          updateModule(selected.id, mod.id, {
                            title: e.target.value,
                          })
                        }
                        className="w-full bg-transparent font-display text-lg font-bold text-ink outline-none"
                      />
                      <input
                        value={mod.description ?? ""}
                        onChange={(e) =>
                          updateModule(selected.id, mod.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Descrizione modulo (opzionale)"
                        className="mt-1 w-full bg-transparent text-xs text-ink-soft outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={modIndex === 0}
                        onClick={() => moveModule(selected.id, mod.id, -1)}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-white disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={modIndex === selected.modules.length - 1}
                        onClick={() => moveModule(selected.id, mod.id, 1)}
                        className="rounded-lg p-1.5 text-ink-soft hover:bg-white disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeModule(selected.id, mod.id)}
                        className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1.5">
                    {mod.items.map((item, itemIndex) => {
                      const asset = assetMap.get(item.assetId);
                      if (!asset) return null;
                      return (
                        <li
                          key={item.assetId}
                          className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2"
                        >
                          <span className="text-[10px] font-bold text-ink-soft">
                            {itemIndex + 1}.
                          </span>
                          <MediaIcon type={asset.type} />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                            {asset.title}
                          </span>
                          <button
                            type="button"
                            disabled={itemIndex === 0}
                            onClick={() =>
                              moveAssetInModule(
                                selected.id,
                                mod.id,
                                item.assetId,
                                -1
                              )
                            }
                            className="rounded p-1 text-ink-soft hover:bg-white disabled:opacity-30"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={itemIndex === mod.items.length - 1}
                            onClick={() =>
                              moveAssetInModule(
                                selected.id,
                                mod.id,
                                item.assetId,
                                1
                              )
                            }
                            className="rounded p-1 text-ink-soft hover:bg-white disabled:opacity-30"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              assignAssetToModule(
                                selected.id,
                                item.assetId,
                                null
                              )
                            }
                            className="text-[10px] font-bold uppercase text-ink-soft hover:text-red-600"
                          >
                            Togli
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
