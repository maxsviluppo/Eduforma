import type { ImportPreview } from "@/lib/calendar/CalendarProvider";
import type { Course, Lesson, Modality, Room, School, Student, Teacher } from "@/lib/calendar/types";
import { DEMO_SCHOOL_ID, generateId } from "@/lib/calendar/types";

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

function splitLines(text: string): string[][] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const sep = lines[0].includes(";") ? ";" : lines[0].includes("\t") ? "\t" : ",";
  return lines.map((line) =>
    line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
}

function parseModality(raw: string): Modality {
  const v = raw.toLowerCase();
  if (v.includes("dad") || v.includes("online") || v.includes("remoto")) return "dad";
  if (v.includes("ibrid")) return "ibrida";
  return "aula";
}

/** Parse CSV / TSV / pasted Excel text into an import preview */
export function parseCalendarSpreadsheet(text: string): ImportPreview {
  const rows = splitLines(text);
  const warnings: string[] = [];
  if (rows.length < 2) {
    return {
      schools: [],
      teachers: [],
      courses: [],
      lessons: [],
      rooms: [],
      students: [],
      warnings: ["File vuoto o senza righe dati."],
    };
  }

  const headers = rows[0].map(normalizeHeader);
  const idx = (names: string[]) => headers.findIndex((h) => names.includes(h));

  const col = {
    type: idx(["tipo", "type", "entita", "entity"]),
    school: idx(["scuola", "school", "centro", "sede"]),
    schoolAddress: idx(["indirizzo_scuola", "address", "indirizzo"]),
    schoolCity: idx(["citta", "city", "citta_scuola"]),
    teacher: idx(["docente", "teacher", "insegnante", "nome_docente"]),
    teacherEmail: idx(["email_docente", "teacher_email"]),
    specialty: idx(["specialita", "specialty", "materia"]),
    preferred: idx(["date_preferite", "preferred_dates", "disponibile"]),
    busy: idx(["date_occupate", "busy_dates", "occupato"]),
    course: idx(["corso", "course", "titolo", "nome_corso"]),
    description: idx(["descrizione", "description", "che_fa", "obiettivo"]),
    hours: idx(["ore", "hours", "totale_ore", "ore_totali"]),
    days: idx(["giorni", "days", "n_giorni", "giorni_corso"]),
    modality: idx(["modalita", "modality", "tipo_lezione", "aula_dad"]),
    room: idx(["aula", "room", "sala"]),
    capacity: idx(["capienza", "capacity", "posti"]),
    student: idx(["studente", "student", "alunno", "nome_studente"]),
    studentEmail: idx(["email_studente", "student_email"]),
    lesson: idx(["lezione", "lesson", "titolo_lezione"]),
    date: idx(["data", "date", "giorno"]),
    start: idx(["inizio", "start", "ora_inizio", "start_time"]),
    end: idx(["fine", "end", "ora_fine", "end_time"]),
  };

  const schools: School[] = [];
  const teachers: Teacher[] = [];
  const rooms: Room[] = [];
  const students: Student[] = [];
  const courses: Course[] = [];
  const lessons: Lesson[] = [];

  const schoolMap = new Map<string, School>();
  const teacherMap = new Map<string, Teacher>();
  const roomMap = new Map<string, Room>();
  const studentMap = new Map<string, Student>();
  const courseMap = new Map<string, Course>();

  const cell = (row: string[], i: number) => (i >= 0 ? row[i]?.trim() ?? "" : "");

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const type = cell(row, col.type) || "lezione";
    const typeNorm = normalizeHeader(type);

    const schoolName = cell(row, col.school);
    if (schoolName && !schoolMap.has(schoolName)) {
      const school: School = {
        id: generateId("school"),
        name: schoolName,
        address: cell(row, col.schoolAddress) || "—",
        city: cell(row, col.schoolCity) || "—",
      };
      schoolMap.set(schoolName, school);
      schools.push(school);
    }

    const teacherName = cell(row, col.teacher);
    if (teacherName && !teacherMap.has(teacherName)) {
      const teacher: Teacher = {
        id: generateId("doc"),
        name: teacherName,
        email: cell(row, col.teacherEmail) || `${normalizeHeader(teacherName)}@centro.it`,
        specialty: cell(row, col.specialty) || "Generale",
      };
      teacherMap.set(teacherName, teacher);
      teachers.push(teacher);
    }

    const preferred = cell(row, col.preferred)
      .split(/[|/]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const excluded = cell(row, col.busy)
      .split(/[|/]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const roomName = cell(row, col.room);
    if (roomName && !roomMap.has(roomName)) {
      const school = schoolName ? schoolMap.get(schoolName) : undefined;
      const room: Room = {
        id: generateId("room"),
        name: roomName,
        capacity: Number(cell(row, col.capacity) || 20),
        schoolId: school?.id ?? DEMO_SCHOOL_ID,
      };
      roomMap.set(roomName, room);
      rooms.push(room);
    }

    const studentName = cell(row, col.student);
    if (studentName && !studentMap.has(studentName)) {
      const student: Student = {
        id: generateId("stud"),
        name: studentName,
        email: cell(row, col.studentEmail) || `${normalizeHeader(studentName)}@email.it`,
      };
      studentMap.set(studentName, student);
      students.push(student);
    }

    const courseTitle = cell(row, col.course);
    if (courseTitle && !courseMap.has(courseTitle)) {
      const teacher = teacherName ? teacherMap.get(teacherName) : undefined;
      const school = schoolName ? schoolMap.get(schoolName) : undefined;
      const room = roomName ? roomMap.get(roomName) : undefined;
      const modality = parseModality(cell(row, col.modality));
      const course: Course = {
        id: generateId("course"),
        title: courseTitle,
        description: cell(row, col.description) || `Corso ${courseTitle}`,
        totalHours: Number(cell(row, col.hours) || 8),
        daysCount: Number(cell(row, col.days) || 1),
        teacherId: teacher?.id ?? generateId("doc"),
        studentIds: studentName && studentMap.has(studentName) ? [studentMap.get(studentName)!.id] : [],
        modality,
        roomId: modality === "dad" ? undefined : room?.id,
        schoolId: school?.id ?? DEMO_SCHOOL_ID,
        color: ["#0f8f8a", "#3b82c4", "#7c5cbf", "#d97706", "#e11d48"][courses.length % 5],
        status: "attivo",
        startDate: cell(row, col.date) || new Date().toISOString().slice(0, 10),
        endDate: cell(row, col.date) || new Date().toISOString().slice(0, 10),
        preferredDates: preferred.length ? preferred : undefined,
        excludedDates: excluded.length ? excluded : undefined,
      };
      if (!teacher) {
        warnings.push(`Riga ${r + 1}: corso "${courseTitle}" senza docente riconosciuto.`);
      }
      courseMap.set(courseTitle, course);
      courses.push(course);
    } else if (courseTitle && courseMap.has(courseTitle)) {
      const course = courseMap.get(courseTitle)!;
      if (preferred.length) {
        course.preferredDates = [...new Set([...(course.preferredDates ?? []), ...preferred])];
      }
      if (excluded.length) {
        course.excludedDates = [...new Set([...(course.excludedDates ?? []), ...excluded])];
      }
    }

    if (courseTitle && studentName && courseMap.has(courseTitle)) {
      const course = courseMap.get(courseTitle)!;
      const student = studentMap.get(studentName);
      if (student && !course.studentIds.includes(student.id)) {
        course.studentIds.push(student.id);
      }
    }

    const lessonTitle = cell(row, col.lesson);
    const date = cell(row, col.date);
    if ((typeNorm.includes("lez") || lessonTitle || date) && courseTitle && date) {
      const course = courseMap.get(courseTitle);
      const teacher = teacherName ? teacherMap.get(teacherName) : undefined;
      const room = roomName ? roomMap.get(roomName) : undefined;
      if (!course) {
        warnings.push(`Riga ${r + 1}: lezione senza corso valido.`);
        continue;
      }
      const modality = parseModality(cell(row, col.modality) || course.modality);
      const startTime = cell(row, col.start) || "09:00";
      const endTime = cell(row, col.end) || "12:00";
      const lesson: Lesson = {
        id: generateId("les"),
        courseId: course.id,
        title: lessonTitle || `Lezione ${lessons.length + 1}`,
        date: normalizeDate(date),
        startTime: normalizeTime(startTime),
        endTime: normalizeTime(endTime),
        modality,
        roomId: modality === "dad" ? undefined : room?.id ?? course.roomId,
        teacherId: teacher?.id ?? course.teacherId,
        dadLink:
          modality !== "aula"
            ? `https://meet.aulanova.it/${course.id}-${lessons.length + 1}`
            : undefined,
      };
      lessons.push(lesson);
    }
  }

  if (!schools.length && (teachers.length || courses.length)) {
    schools.push({
      id: DEMO_SCHOOL_ID,
      name: "Scuola importata",
      address: "—",
      city: "—",
    });
  }

  return { schools, teachers, courses, lessons, rooms, students, warnings };
}

function normalizeDate(raw: string): string {
  // Accept YYYY-MM-DD or DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return raw;
}

function normalizeTime(raw: string): string {
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return raw;
}

/** Read file as text; for xlsx use SheetJS if available */
export async function readSpreadsheetFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      return XLSX.utils.sheet_to_csv(sheet, { FS: ";" });
    } catch {
      throw new Error(
        "Per i file Excel installa il pacchetto xlsx, oppure esporta in CSV."
      );
    }
  }

  // csv, tsv, txt, doc (plain)
  return await file.text();
}
