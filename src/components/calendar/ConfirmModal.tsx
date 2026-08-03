"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm md:items-center"
      onClick={onCancel}
    >
      <div
        className="glass-strong w-full max-w-md rounded-[1.6rem] p-6 shadow-[0_30px_80px_rgba(15,28,46,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {danger && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </span>
            )}
            <div>
              <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{message}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="text-ink-soft hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-full px-4 py-3 text-sm font-bold text-white ${
              danger
                ? "bg-rose-600 shadow-[0_12px_28px_rgba(225,29,72,0.35)] hover:brightness-105"
                : "btn-primary !shadow-none"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OverlapWarningModal({
  open,
  teacherName,
  date,
  details,
  onProceed,
  onCancel,
}: {
  open: boolean;
  teacherName: string;
  date: string;
  details: string[];
  onProceed: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/30 p-4 backdrop-blur-sm md:items-center"
      onClick={onCancel}
    >
      <div
        className="glass-strong w-full max-w-md rounded-[1.6rem] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-xl font-bold text-ink">
              Accavallamento orari
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>{teacherName}</strong> ha già altre lezioni in conflitto il{" "}
              <strong>{date}</strong>.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink">
              {details.map((d) => (
                <li key={d} className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
                  {d}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              Puoi procedere comunque (con avviso) oppure annullare e modificare la data.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Modifica
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="flex-1 rounded-full bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(217,119,6,0.35)]"
          >
            Procedi comunque
          </button>
        </div>
      </div>
    </div>
  );
}
