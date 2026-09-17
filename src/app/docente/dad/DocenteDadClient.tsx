"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Cast,
  Check,
  Clock3,
  Copy,
  Hand,
  HandMetal,
  Laptop,
  Maximize2,
  Mic,
  MicOff,
  MoreVertical,
  PhoneOff,
  Radio,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Smile,
  Sparkles,
  UserCheck,
  Users,
  Video,
  VideoOff,
  Volume2,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";
import { COURSE_CATEGORY_LABELS, type Lesson } from "@/lib/calendar/types";
import { ModalityBadge } from "@/components/calendar/ModalityBadge";

type StudentParticipant = {
  id: string;
  name: string;
  avatarColor: string;
  isMicOn: boolean;
  isCamOn: boolean;
  isHandRaised: boolean;
  connectionQuality: "ottima" | "buona";
};

const DEFAULT_STUDENTS: StudentParticipant[] = [
  {
    id: "st-1",
    name: "Marco Rossi",
    avatarColor: "#0284c7",
    isMicOn: false,
    isCamOn: true,
    isHandRaised: false,
    connectionQuality: "ottima",
  },
  {
    id: "st-2",
    name: "Sara De Luca",
    avatarColor: "#ec4899",
    isMicOn: false,
    isCamOn: true,
    isHandRaised: true,
    connectionQuality: "ottima",
  },
  {
    id: "st-3",
    name: "Luca Bianchi",
    avatarColor: "#8b5cf6",
    isMicOn: true,
    isCamOn: true,
    isHandRaised: false,
    connectionQuality: "buona",
  },
  {
    id: "st-4",
    name: "Chiara Esposito",
    avatarColor: "#10b981",
    isMicOn: false,
    isCamOn: false,
    isHandRaised: false,
    connectionQuality: "ottima",
  },
  {
    id: "st-5",
    name: "Giovanni Russo",
    avatarColor: "#f59e0b",
    isMicOn: false,
    isCamOn: true,
    isHandRaised: false,
    connectionQuality: "ottima",
  },
  {
    id: "st-6",
    name: "Elena Moretti",
    avatarColor: "#6366f1",
    isMicOn: false,
    isCamOn: true,
    isHandRaised: false,
    connectionQuality: "buona",
  },
];

type ChatMessage = {
  id: string;
  sender: string;
  role: "docente" | "studente";
  text: string;
  time: string;
};

export default function DocenteDadClient() {
  const searchParams = useSearchParams();
  const preselectedLessonId = searchParams.get("lesson");

  const {
    currentTeacherId,
    getTeacher,
    getLessonsForTeacher,
    getCourse,
    state,
  } = useCalendar();

  const teacher = getTeacher(currentTeacherId);
  const myLessons = useMemo(
    () => getLessonsForTeacher(currentTeacherId),
    [currentTeacherId, getLessonsForTeacher]
  );

  // Filter lessons that can be held via DAD (dad or ibrida, or any lesson)
  const dadLessons = useMemo(() => {
    const remote = myLessons.filter((l) => l.modality !== "aula");
    return remote.length > 0 ? remote : myLessons;
  }, [myLessons]);

  const [selectedLessonId, setSelectedLessonId] = useState<string>(() => {
    if (preselectedLessonId && myLessons.some((l) => l.id === preselectedLessonId)) {
      return preselectedLessonId;
    }
    return dadLessons[0]?.id ?? myLessons[0]?.id ?? "";
  });

  const activeLesson = useMemo(() => {
    return (
      myLessons.find((l) => l.id === selectedLessonId) ??
      dadLessons[0] ??
      myLessons[0]
    );
  }, [myLessons, dadLessons, selectedLessonId]);

  const activeCourse = activeLesson ? getCourse(activeLesson.courseId) : undefined;

  // DAD Live state
  const [isLive, setIsLive] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);

  // Teacher media controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sidebar drawers in Live room
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | null>(null);

  // Students in room
  const [students, setStudents] = useState<StudentParticipant[]>(DEFAULT_STUDENTS);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "Marco Rossi",
      role: "studente",
      text: "Buongiorno professore, l'audio si sente chiarissimo!",
      time: "09:02",
    },
    {
      id: "m-2",
      sender: "Sara De Luca",
      role: "studente",
      text: "Presente! Ho aperto anche le slide di supporto.",
      time: "09:03",
    },
  ]);
  const [inputText, setInputText] = useState("");

  // Video element ref for real webcam (pre-flight and live)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [hasCamPermission, setHasCamPermission] = useState<boolean | null>(null);
  const [blurBackground, setBlurBackground] = useState(false);

  // Timer when live
  useEffect(() => {
    if (!isLive) {
      setLiveDuration(0);
      return;
    }
    const interval = setInterval(() => {
      setLiveDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Request actual webcam if available (runs in pre-flight AND in live if isCamOn)
  useEffect(() => {
    if (!isCamOn) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
      if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
      return;
    }

    let isSubscribed = true;

    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        .then((stream) => {
          if (!isSubscribed) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          setHasCamPermission(true);

          if (previewVideoRef.current) {
            previewVideoRef.current.srcObject = stream;
          }
          if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          if (isSubscribed) {
            setHasCamPermission(false);
          }
        });
    }

    return () => {
      isSubscribed = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isCamOn]);

  // Keep video ref updated when transitioning between pre-flight and live
  useEffect(() => {
    if (mediaStreamRef.current && isCamOn) {
      if (!isLive && previewVideoRef.current) {
        previewVideoRef.current.srcObject = mediaStreamRef.current;
      } else if (isLive && liveVideoRef.current) {
        liveVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  }, [isLive, isCamOn]);

  // Enrolled students list for the selected course
  const enrolledStudents = useMemo(() => {
    if (!activeCourse) return [];
    const courseStudentIds = activeCourse.studentIds ?? [];
    const allStudents = state.students ?? [];
    const matched = allStudents.filter((s) => courseStudentIds.includes(s.id));
    if (matched.length > 0) return matched;
    // If studentIds is empty or demo data has generic count, generate roster entries from studentCount
    const count = activeCourse.studentCount || 3;
    return Array.from({ length: count }, (_, idx) => {
      const demoFallback = DEFAULT_STUDENTS[idx % DEFAULT_STUDENTS.length];
      return {
        id: `enrolled-${idx + 1}`,
        name: demoFallback?.name ?? `Studente ${idx + 1}`,
        email: `studente.${idx + 1}@corso.it`,
      };
    });
  }, [activeCourse, state.students]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const handleCopyLink = () => {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/studente?room=${activeLesson?.id ?? "live"}`
        : `https://meet.aulanova.it/room/${activeLesson?.id ?? "live"}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: teacher?.name ?? "Docente",
        role: "docente",
        text: inputText.trim(),
        time: timeStr,
      },
    ]);
    setInputText("");
  };

  const toggleStudentHand = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, isHandRaised: !s.isHandRaised } : s
      )
    );
  };

  const toggleStudentMic = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, isMicOn: !s.isMicOn } : s
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-deep">
            <Link
              href="/docente"
              className="inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard Docente
            </Link>
            <span>·</span>
            <span>Aula Virtuale DAD</span>
          </div>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
            {isLive ? "Room DAD in Diretta" : "Gestione Sessione DAD Live"}
          </h1>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
              LIVE DAD ATTIVA ({formatTimer(liveDuration)})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Room offline · pronta all&apos;avvio
            </span>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODE 1: ROOM PRE-FLIGHT / SETUP SCREEN (When DAD is NOT active)
          ========================================================================= */}
      {!isLive && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Lesson Selector & Configuration (7 cols) */}
          <div className="space-y-5 lg:col-span-7">
            <div className="glass rounded-[1.8rem] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-deep">
                  1. Seleziona Lezione per la DAD
                </span>
                {activeLesson && (
                  <ModalityBadge modality={activeLesson.modality} compact />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-ink-soft mb-1">
                  Lezione in programma
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-ink shadow-2xs focus:border-teal"
                >
                  {dadLessons.map((lesson) => {
                    const c = getCourse(lesson.courseId);
                    return (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.date} · {lesson.startTime}–{lesson.endTime} ·{" "}
                        {lesson.title} ({c?.title ?? "Corso"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Active Lesson details summary */}
              {activeLesson && activeCourse && (
                <div
                  className="rounded-2xl border p-4 bg-white/90 shadow-2xs space-y-3"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: activeCourse.color ?? "#0f8f8a",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: activeCourse.color }}
                      >
                        {COURSE_CATEGORY_LABELS[activeCourse.category] ??
                          activeCourse.category}
                      </span>
                      <h3 className="mt-1 font-display text-base font-bold text-ink">
                        {activeCourse.title}
                      </h3>
                      <p className="text-xs text-ink-soft">
                        {activeLesson.title}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal/10 px-2.5 py-1 text-xs font-bold text-teal-deep">
                      👥 {activeCourse.studentCount ?? 0} iscritti
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-line/60 pt-2 text-ink-soft">
                    <div className="flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-teal-deep" />
                      <span>
                        Data: <strong>{activeLesson.date}</strong> (
                        {activeLesson.startTime} – {activeLesson.endTime})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Radio className="h-3.5 w-3.5 text-teal-deep" />
                      <span>
                        Modalità:{" "}
                        <strong className="capitalize">
                          {activeLesson.modality}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Accesso Riservato alla Piattaforma */}
              <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-deep flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Accesso Riservato alla Piattaforma
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Solo Iscritti
                  </span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  L&apos;accesso alle aule virtuali è protetto: solo gli studenti iscritti possono accedere autenticandosi dalla propria <strong>Area Studente</strong>. I link esterni grezzi non consentono l&apos;accesso ad utenti non censiti.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={`https://meet.aulanova.it/studente?room=${activeLesson?.id ?? "dad-live"}`}
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono text-ink-soft select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-teal/40 bg-teal/10 px-3.5 py-2 text-xs font-bold text-teal-deep hover:bg-teal hover:text-white transition"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copia link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Lista Alunni Iscritti al Corso */}
              <div className="rounded-2xl border border-line/70 bg-white/95 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-deep flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    Alunni Iscritti alla Room ({enrolledStudents.length})
                  </span>
                  <span className="text-[11px] font-semibold text-ink-soft">
                    Registro classe
                  </span>
                </div>

                <div className="divide-y divide-line/50 rounded-xl border border-line/60 bg-slate-50/50 max-h-56 overflow-y-auto">
                  {enrolledStudents.map((st, idx) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 hover:bg-white transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                          style={{
                            backgroundColor: [
                              "#0284c7",
                              "#ec4899",
                              "#8b5cf6",
                              "#10b981",
                              "#f59e0b",
                              "#0f8f8a",
                            ][idx % 6],
                          }}
                        >
                          {st.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-ink truncate">
                            {st.name}
                          </p>
                          <p className="text-[10px] text-ink-soft truncate">
                            {st.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          <UserCheck className="h-3 w-3" />
                          Pronto
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Device pre-check & Start Button (5 cols) */}
          <div className="space-y-5 lg:col-span-5">
            <div className="glass rounded-[1.8rem] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-deep">
                  2. Collaudo Dispositivi & Cam
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-ink-soft">
                  Anteprima Live
                </span>
              </div>

              {/* Camera Preview Box with real webcam & background blur */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 border-2 border-line flex items-center justify-center text-white shadow-inner">
                {isCamOn ? (
                  <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                    <video
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`h-full w-full object-cover transition duration-300 ${
                        blurBackground ? "blur-md scale-105" : ""
                      }`}
                    />

                    {/* Teacher overlay placeholder if browser webcam track isn't permitted or active */}
                    {!mediaStreamRef.current && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800/60 to-slate-950/80 p-4 text-center">
                        <div className="h-14 w-14 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center text-teal-300 font-display font-bold text-xl shadow-lg mb-1">
                          {teacher?.name ? teacher.name.charAt(0) : "D"}
                        </div>
                        <p className="text-sm font-bold text-white">{teacher?.name ?? "Docente"}</p>
                        {hasCamPermission === false ? (
                          <span className="mt-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            ⚠ Permesso webcam negato dal browser
                          </span>
                        ) : (
                          <span className="mt-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            ✓ Webcam connessa
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bokeh Blur Indicator Badge */}
                    {blurBackground && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-teal-900/80 border border-teal-500/50 px-2 py-0.5 text-[10px] font-bold text-teal-200 backdrop-blur-sm shadow-sm">
                        <Wand2 className="h-3 w-3" />
                        <span>Sfondo Sfocato (Bokeh)</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400 p-6">
                    <VideoOff className="h-9 w-9 text-slate-500" />
                    <p className="text-xs font-semibold">Webcam disattivata</p>
                    <p className="text-[10px] text-slate-500">Attiva la cam per testare l&apos;inquadratura</p>
                  </div>
                )}

                {/* Status overlay (Mic indicator) */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-[10px] text-white backdrop-blur-sm border border-white/10">
                  {isMicOn ? (
                    <Mic className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <MicOff className="h-3 w-3 text-red-400" />
                  )}
                  <span>{isMicOn ? "Microfono ON" : "Microfono Muto"}</span>
                </div>
              </div>

              {/* Pre-flight Toggle Buttons: Mic, Cam & Sfondo Sfocato */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsMicOn((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    isMicOn
                      ? "border-line bg-white text-ink shadow-2xs hover:bg-slate-50"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {isMicOn ? (
                    <Mic className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <MicOff className="h-4 w-4" />
                  )}
                  <span>{isMicOn ? "Microfono Attivo" : "Disattivato"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCamOn((prev) => !prev)}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    isCamOn
                      ? "border-line bg-white text-ink shadow-2xs hover:bg-slate-50"
                      : "border-red-300 bg-red-50 text-red-700"
                  }`}
                >
                  {isCamOn ? (
                    <Video className="h-4 w-4 text-teal-deep" />
                  ) : (
                    <VideoOff className="h-4 w-4" />
                  )}
                  <span>{isCamOn ? "Webcam Attiva" : "Disattivata"}</span>
                </button>

                {/* Pulsante Sfocatura Sfondo (Bokeh Blur) */}
                <button
                  type="button"
                  onClick={() => setBlurBackground((prev) => !prev)}
                  className={`col-span-2 flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    blurBackground
                      ? "border-teal bg-teal/10 text-teal-deep shadow-xs ring-1 ring-teal/30"
                      : "border-line bg-white text-ink-soft hover:text-ink hover:bg-slate-50"
                  }`}
                >
                  <Wand2 className="h-4 w-4 text-teal-deep" />
                  <span>
                    {blurBackground
                      ? "✓ Sfondo Sfocato Attivo (Privacy & Bokeh)"
                      : "Sfoca Sfondo Webcam (Effetto Bokeh)"}
                  </span>
                </button>
              </div>

              {/* Master Start DAD Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsLive(true)}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal to-teal-deep p-4 text-center text-white shadow-[0_12px_30px_rgba(15,143,138,0.4)] transition hover:brightness-105 active:scale-[0.99] space-y-1"
                >
                  <div className="flex items-center justify-center gap-2 font-display text-base font-bold">
                    <Radio className="h-5 w-5 animate-pulse" />
                    <span>AVVIA SESSIONE DAD LIVE</span>
                  </div>
                  <p className="text-[11px] text-white/80">
                    Apre la stanza virtuale e connette la classe in tempo reale
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODE 2: LIVE DAD CLASSROOM ROOM (When DAD IS active)
          ========================================================================= */}
      {isLive && (
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl border border-slate-800 flex flex-col min-h-[750px]">
          {/* Room Top Navigation / Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/90 px-6 py-3.5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                LIVE
              </span>
              <span className="font-mono text-sm font-bold text-slate-300">
                {formatTimer(liveDuration)}
              </span>
              <div className="hidden h-4 w-px bg-slate-700 sm:block" />
              <div>
                <h3 className="font-display text-sm font-bold text-white sm:text-base leading-tight">
                  {activeLesson?.title ?? "Lezione DAD"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {activeCourse?.title ?? "Corso"} · {teacher?.name}
                </p>
              </div>
            </div>

            {/* Top right actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> Copiato
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" /> Invita alunni
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLive(false)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95"
              >
                <PhoneOff className="h-3.5 w-3.5" />
                Termina DAD
              </button>
            </div>
          </div>

          {/* Room Main Stage */}
          <div className="flex flex-1 min-h-0 overflow-hidden relative">
            {/* Center Video Area (Teacher Cam large on top, Students cams below) */}
            <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* -------------------------------------------------------------
                  1. CAM DOCENTE (IN ALTO AL CENTRO, PIÙ GRANDE)
                  ------------------------------------------------------------- */}
              <div className="w-full max-w-4xl mx-auto">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-2 border-teal/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-teal/30">
                  {isScreenSharing ? (
                    // Screen sharing display
                    <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-slate-900/90 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-teal/20 border border-teal/40 flex items-center justify-center text-teal-300 mb-3">
                        <Cast className="h-8 w-8 animate-pulse" />
                      </div>
                      <h4 className="font-display text-lg font-bold text-white">
                        Stai condividendo lo schermo
                      </h4>
                      <p className="mt-1 max-w-md text-xs text-slate-300">
                        Gli alunni stanno visualizzando le slide e il tuo desktop in diretta streaming ad alta risoluzione.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsScreenSharing(false)}
                        className="mt-4 rounded-xl bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700"
                      >
                        Interrompi condivisione
                      </button>
                    </div>
                  ) : isCamOn ? (
                    // Real webcam feed with simulated fallback & bokeh blur
                    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
                      <video
                        ref={liveVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover transition duration-300 ${
                          blurBackground ? "blur-md scale-105" : ""
                        }`}
                      />
                      {/* Realistic teacher overlay if video track is not active */}
                      {!mediaStreamRef.current && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800/40 to-slate-950/80 p-6 text-center">
                          <div className="relative mb-3">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-teal to-teal-deep border-4 border-teal/50 flex items-center justify-center text-3xl font-display font-bold text-white shadow-xl">
                              {teacher?.name ? teacher.name.charAt(0) : "D"}
                            </div>
                            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                          </div>
                          <h4 className="font-display text-xl font-bold text-white">
                            {teacher?.name ?? "Docente"}
                          </h4>
                          <p className="text-xs text-teal-300 font-medium">
                            {teacher?.specialty ?? "Docente Titolare"} · Host Live
                          </p>

                          {/* Dynamic audio waves indicator */}
                          {isMicOn && (
                            <div className="mt-3 flex items-center gap-1">
                              {[3, 6, 9, 5, 8, 4, 7, 3].map((h, i) => (
                                <span
                                  key={i}
                                  className="w-1 bg-teal-400 rounded-full animate-pulse"
                                  style={{
                                    height: `${h * 2.5}px`,
                                    animationDuration: `${0.4 + i * 0.15}s`,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Camera OFF state
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                      <VideoOff className="h-12 w-12 mb-2" />
                      <p className="text-sm font-bold text-white">
                        La tua webcam è disattivata
                      </p>
                      <p className="text-xs text-slate-400">
                        Gli alunni possono sentire solo la tua voce
                      </p>
                    </div>
                  )}

                  {/* Overlays on Teacher Cam */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-teal-400" />
                      Docente: {teacher?.name ?? "Docente"} (Host)
                    </span>
                    <span className="rounded-lg bg-teal/20 px-2 py-0.5 text-[10px] font-bold text-teal-300 border border-teal/30">
                      HD 1080p
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span
                      className={`rounded-lg px-2 py-1 text-xs font-bold backdrop-blur-md ${
                        isMicOn
                          ? "bg-black/60 text-emerald-400 border border-white/10"
                          : "bg-red-500/80 text-white"
                      }`}
                    >
                      {isMicOn ? "Microfono ON" : "Muto"}
                    </span>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  2. CAM DEGLI ALUNNI (SOTTO, FORMATO PIÙ PICCOLO)
                  ------------------------------------------------------------- */}
              <div className="w-full max-w-4xl mx-auto pt-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  <span>Alunni Partecipanti ({students.length})</span>
                  <span className="text-[11px] font-normal lowercase text-slate-500">
                    clicca su uno studente per mutare o gestire
                  </span>
                </div>

                {/* Horizontal scrollable or wrapped grid of student camera tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className={`group relative aspect-video rounded-xl bg-slate-900 border p-2 flex flex-col justify-between overflow-hidden transition hover:border-teal/60 ${
                        student.isHandRaised
                          ? "border-amber-400 ring-2 ring-amber-400/30"
                          : "border-slate-800"
                      }`}
                    >
                      {/* Top student indicators */}
                      <div className="flex items-center justify-between z-10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {student.isHandRaised && (
                          <span
                            onClick={() => toggleStudentHand(student.id)}
                            className="cursor-pointer rounded-md bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-black text-amber-300 border border-amber-400/40 animate-bounce"
                            title="Mano alzata! Clicca per abbassare"
                          >
                            ✋ Alzata
                          </span>
                        )}
                      </div>

                      {/* Center Avatar / Video representation */}
                      <div className="flex items-center justify-center my-auto">
                        {student.isCamOn ? (
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md transition transform group-hover:scale-110"
                            style={{ backgroundColor: student.avatarColor }}
                          >
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                            <VideoOff className="h-4 w-4" />
                          </div>
                        )}
                      </div>

                      {/* Bottom Name & Mic status */}
                      <div className="flex items-center justify-between z-10 text-[10px] font-bold text-slate-300">
                        <span className="truncate max-w-[80px]">
                          {student.name.split(" ")[0]}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleStudentMic(student.id)}
                          className={`p-0.5 rounded transition ${
                            student.isMicOn
                              ? "text-emerald-400 hover:text-red-400"
                              : "text-slate-500 hover:text-emerald-400"
                          }`}
                          title={
                            student.isMicOn
                              ? "Muta microfono alunno"
                              : "Smuta microfono alunno"
                          }
                        >
                          {student.isMicOn ? (
                            <Mic className="h-3 w-3" />
                          ) : (
                            <MicOff className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Drawer (Chat or Participants) */}
            {activeTab && (
              <div className="w-80 border-l border-slate-800 bg-slate-900/95 flex flex-col z-20">
                <div className="flex items-center justify-between border-b border-slate-800 p-3.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                    {activeTab === "chat"
                      ? "Chat Lezione"
                      : "Registro Presenze"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab(null)}
                    className="rounded p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tab Content: Chat */}
                {activeTab === "chat" && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`rounded-xl p-2.5 text-xs ${
                            m.role === "docente"
                              ? "bg-teal-900/40 border border-teal-700/50 ml-4"
                              : "bg-slate-800/80 border border-slate-700 mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-bold text-slate-200">
                              {m.sender} {m.role === "docente" ? "(Tu)" : ""}
                            </span>
                            <span>{m.time}</span>
                          </div>
                          <p className="text-slate-100">{m.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 border-t border-slate-800 flex gap-2">
                      <input
                        type="text"
                        placeholder="Invia messaggio agli studenti..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendMessage();
                        }}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-teal focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        className="rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-deep"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content: Participants */}
                {activeTab === "participants" && (
                  <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                    <div className="rounded-xl border border-teal/40 bg-teal/10 p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">
                          {teacher?.name} (Docente)
                        </p>
                        <p className="text-[10px] text-teal-300">Host sessione</p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400">
                        Online
                      </span>
                    </div>

                    {students.map((st) => (
                      <div
                        key={st.id}
                        className="rounded-xl border border-slate-800 bg-slate-800/60 p-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: st.avatarColor }}
                          />
                          <span>{st.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {st.isHandRaised && (
                            <span className="text-[11px]" title="Mano alzata">
                              ✋
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleStudentMic(st.id)}
                            className={
                              st.isMicOn
                                ? "text-emerald-400"
                                : "text-slate-500"
                            }
                          >
                            {st.isMicOn ? (
                              <Mic className="h-3.5 w-3.5" />
                            ) : (
                              <MicOff className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Docked Teacher Control Bar */}
          <div className="border-t border-slate-800/80 bg-slate-900/90 px-6 py-3 flex items-center justify-between gap-3 backdrop-blur-md">
            {/* Left: Quick room info */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Qualità connessione: Ottima</span>
            </div>

            {/* Center controls */}
            <div className="flex items-center gap-2 mx-auto sm:mx-0">
              {/* Mic toggle */}
              <button
                type="button"
                onClick={() => setIsMicOn((prev) => !prev)}
                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                  isMicOn
                    ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    : "border-red-500 bg-red-600 text-white"
                }`}
                title={isMicOn ? "Disattiva microfono" : "Attiva microfono"}
              >
                {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>

              {/* Cam toggle */}
              <button
                type="button"
                onClick={() => setIsCamOn((prev) => !prev)}
                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                  isCamOn
                    ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                    : "border-red-500 bg-red-600 text-white"
                }`}
                title={isCamOn ? "Disattiva telecamera" : "Attiva telecamera"}
              >
                {isCamOn ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <VideoOff className="h-4 w-4" />
                )}
              </button>

              {/* Screen share toggle */}
              <button
                type="button"
                onClick={() => setIsScreenSharing((prev) => !prev)}
                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                  isScreenSharing
                    ? "border-teal bg-teal text-white"
                    : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                }`}
                title={
                  isScreenSharing
                    ? "Interrompi condivisione schermo"
                    : "Condividi schermo"
                }
              >
                <Cast className="h-4 w-4" />
              </button>

              <div className="h-6 w-px bg-slate-800" />

              {/* Chat toggle */}
              <button
                type="button"
                onClick={() =>
                  setActiveTab((cur) => (cur === "chat" ? null : "chat"))
                }
                className={`relative h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                  activeTab === "chat"
                    ? "border-teal bg-teal text-white"
                    : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                }`}
                title="Apri chat live"
              >
                <Send className="h-4 w-4" />
                {messages.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-teal text-[9px] font-bold flex items-center justify-center text-white">
                    {messages.length}
                  </span>
                )}
              </button>

              {/* Participants list toggle */}
              <button
                type="button"
                onClick={() =>
                  setActiveTab((cur) =>
                    cur === "participants" ? null : "participants"
                  )
                }
                className={`h-10 w-10 rounded-xl border flex items-center justify-center transition ${
                  activeTab === "participants"
                    ? "border-teal bg-teal text-white"
                    : "border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                }`}
                title="Elenco alunni"
              >
                <Users className="h-4 w-4" />
              </button>

              {/* Simulate hand raise trigger */}
              <button
                type="button"
                onClick={() => toggleStudentHand("st-2")}
                className="h-10 w-10 rounded-xl border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center transition"
                title="Simula alzata di mano studente"
              >
                <Hand className="h-4 w-4 text-amber-300" />
              </button>
            </div>

            {/* Right: Termina DAD button */}
            <div>
              <button
                type="button"
                onClick={() => setIsLive(false)}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-red-700 active:scale-95 flex items-center gap-1.5"
              >
                <PhoneOff className="h-4 w-4" />
                <span>Termina DAD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
