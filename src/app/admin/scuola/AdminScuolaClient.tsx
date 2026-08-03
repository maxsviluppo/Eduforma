"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Save } from "lucide-react";
import { useCalendar } from "@/lib/calendar/CalendarProvider";

const emptySchool = {
  name: "",
  address: "",
  city: "",
  province: "",
  zip: "",
  phone: "",
  email: "",
  vat: "",
  notes: "",
};

export default function AdminScuolaClient() {
  const { state, demoSchoolId, getSchool, updateSchool, addSchool, addRoom, removeRoom } =
    useCalendar();
  const primary = getSchool(demoSchoolId) ?? state.schools[0];
  const [selectedId, setSelectedId] = useState(primary?.id ?? "");
  const selected = state.schools.find((s) => s.id === selectedId) ?? primary;
  const [form, setForm] = useState(emptySchool);
  const [roomName, setRoomName] = useState("");
  const [roomCap, setRoomCap] = useState(20);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setForm({
      name: selected.name,
      address: selected.address,
      city: selected.city,
      province: selected.province ?? "",
      zip: selected.zip ?? "",
      phone: selected.phone ?? "",
      email: selected.email ?? "",
      vat: selected.vat ?? "",
      notes: selected.notes ?? "",
    });
  }, [selected?.id]);

  const schoolRooms = state.rooms.filter((r) => r.schoolId === selected?.id);
  const schoolTeachers = state.teachers.filter((t) => t.schoolId === selected?.id);
  const schoolCourses = state.courses.filter((c) => c.schoolId === selected?.id);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    updateSchool(selected.id, {
      ...form,
      roomsCount: schoolRooms.length,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const createNew = () => {
    const id = addSchool({
      name: "Nuova scuola",
      address: "",
      city: "",
      province: "",
      zip: "",
      phone: "",
      email: "",
      vat: "",
      roomsCount: 0,
      notes: "",
    });
    setSelectedId(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-deep">
            Anagrafe
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Profilo scuola</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Dati sede usati per corsi, aule e assegnazione docenti.
          </p>
        </div>
        <button type="button" onClick={createNew} className="btn-ghost text-sm">
          <Plus className="h-4 w-4" /> Nuova scuola
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {state.schools.map((school) => (
          <button
            key={school.id}
            type="button"
            onClick={() => setSelectedId(school.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              selected?.id === school.id
                ? "bg-teal text-white"
                : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {school.name}
          </button>
        ))}
      </div>

      {selected && (
        <form onSubmit={save} className="glass-strong grid gap-5 rounded-[1.6rem] p-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Ragione sociale
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">
                Indirizzo
              </span>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="Città"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="rounded-2xl border border-line bg-white px-3 py-3 text-sm"
              />
              <input
                placeholder="Prov."
                value={form.province}
                onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                className="rounded-2xl border border-line bg-white px-3 py-3 text-sm"
              />
              <input
                placeholder="CAP"
                value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                className="rounded-2xl border border-line bg-white px-3 py-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Telefono"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="rounded-2xl border border-line bg-white px-3 py-3 text-sm"
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-2xl border border-line bg-white px-3 py-3 text-sm"
              />
            </div>
            <input
              placeholder="P. IVA"
              value={form.vat}
              onChange={(e) => setForm((f) => ({ ...f, vat: e.target.value }))}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
            <textarea
              placeholder="Note"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="min-h-[90px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm"
            />
            <button type="submit" className="btn-primary w-full">
              <Save className="h-4 w-4" />
              {saved ? "Salvato" : "Salva profilo scuola"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/80 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-ink-soft">Aule</p>
                <p className="font-display text-2xl font-bold text-ink">{schoolRooms.length}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-ink-soft">Docenti</p>
                <p className="font-display text-2xl font-bold text-ink">{schoolTeachers.length}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-ink-soft">Corsi</p>
                <p className="font-display text-2xl font-bold text-ink">{schoolCourses.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-deep" />
                <h3 className="font-display text-lg font-bold text-ink">Aule della sede</h3>
              </div>
              <ul className="space-y-2">
                {schoolRooms.map((room) => (
                  <li
                    key={room.id}
                    className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                  >
                    <span>
                      <span className="font-semibold text-ink">{room.name}</span>
                      <span className="text-ink-soft"> · {room.capacity} posti</span>
                    </span>
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600"
                      onClick={() => removeRoom(room.id)}
                    >
                      Rimuovi
                    </button>
                  </li>
                ))}
                {schoolRooms.length === 0 && (
                  <p className="text-xs text-ink-soft">Nessuna aula. Aggiungine una sotto.</p>
                )}
              </ul>
              <div className="mt-3 grid grid-cols-[1fr_90px_auto] gap-2">
                <input
                  placeholder="Nome aula"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="rounded-xl border border-line px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  min={4}
                  value={roomCap}
                  onChange={(e) => setRoomCap(Number(e.target.value))}
                  className="rounded-xl border border-line px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-2 text-xs"
                  onClick={() => {
                    if (!roomName.trim() || !selected) return;
                    addRoom(roomName.trim(), roomCap, selected.id);
                    setRoomName("");
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-teal/25 bg-teal/5 p-4 text-xs text-ink-soft">
              I docenti collegati a questa scuola e le aule compaiono nel generatore calendario
              per l&apos;incrocio automatico sede → docente → corso → lezione.
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
