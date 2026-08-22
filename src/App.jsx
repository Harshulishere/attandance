import React, { useState, useEffect, useMemo } from "react";
import {
  Users, Shield, Plus, X, Trash2, LogOut, Banknote, Shirt, Cake,
  Calendar, ClipboardList, Search, Loader2, AlertCircle, CheckCircle2, Circle,
  ChevronRight, ChevronLeft, FileDown
} from "lucide-react";
import * as db from "./db.js";
import { exportAttendancePDF } from "./pdfExport.js";

/* ---------------- helpers ---------------- */

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

function calcAge(dob) {
  if (!dob) return null;
  const b = new Date(dob + "T00:00:00");
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

/* ---------------- small ui pieces ---------------- */

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap');
      .font-display { font-family: 'Bebas Neue', 'Inter', sans-serif; letter-spacing: 0.04em; }
      .font-body { font-family: 'Inter', sans-serif; }
    `}</style>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-10 px-4">
      <p className="text-slate-500 text-sm">{text}</p>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );
}

function ErrorToast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="fixed bottom-20 inset-x-4 bg-red-600 text-white rounded-lg px-4 py-3 flex items-center gap-2 shadow-lg z-20">
      <AlertCircle size={18} className="shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition relative shrink-0 ${checked ? "bg-emerald-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? "translate-x-5" : ""}`}
      />
    </button>
  );
}

function PositionPicker({ value, onChange }) {
  const presets = ["Goalkeeper", "Defender", "Midfielder", "Forward", "Winger"];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              value === p ? "bg-blue-600 text-white border-blue-600" : "border-slate-300 text-slate-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type a custom position"
        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* ---------------- login ---------------- */

function LoginScreen() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit() {
    setError("");
    setNotice("");
    if (!email.trim() || !password) { setError("Enter your email and password."); return; }
    if (mode === "signup" && !name.trim()) { setError("Enter your name."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        const result = await db.signUp(email.trim(), password, name.trim());
        if (result.needsConfirmation) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        await db.signIn(email.trim(), password);
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center px-6 font-body">
      <FontStyles />
      <div className="text-center mb-8">
        <div className="font-display text-5xl text-blue-600">TOUCHLINE</div>
        <p className="text-slate-500 mt-1 text-sm">Squad registers &amp; session tracking</p>
      </div>

      <div className="flex bg-white border border-slate-200 rounded-lg p-1 mb-4">
        {["signin", "signup"].map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); setNotice(""); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${mode === m ? "bg-blue-600 text-white" : "text-slate-400"}`}
          >
            {m === "signin" ? "Sign In" : "New Coach"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {mode === "signup" && (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {notice && <p className="text-emerald-600 text-sm">{notice}</p>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-40 flex items-center justify-center"
        >
          {busy ? <Loader2 size={18} className="animate-spin" /> : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </div>
    </div>
  );
}

function CompleteProfileScreen({ userId, onDone }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await db.createProfileIfMissing(userId, name.trim());
      await onDone();
    } catch (e) {
      setError(e.message || "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center px-6 font-body">
      <FontStyles />
      <div className="text-center mb-8">
        <div className="font-display text-3xl text-blue-600">One more step</div>
        <p className="text-slate-500 mt-1 text-sm">What should we call you?</p>
      </div>
      <div className="space-y-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Your name"
          className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || busy} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-40 flex items-center justify-center">
          {busy ? <Loader2 size={18} className="animate-spin" /> : "Continue"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- top bar & nav ---------------- */

function TopBar({ currentUser, accessibleOwners, viewingOwnerId, setViewingOwnerId, onSwitchUser }) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 pt-4 pb-3 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-2xl text-blue-600 leading-none">TOUCHLINE</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Hey, {currentUser.name}{currentUser.isAdmin ? " · Admin" : ""}
          </div>
        </div>
        <button onClick={onSwitchUser} className="text-slate-500 hover:text-slate-700 p-2" title="Switch coach">
          <LogOut size={18} />
        </button>
      </div>
      {accessibleOwners.length > 1 && (
        <select
          value={viewingOwnerId}
          onChange={(e) => setViewingOwnerId(e.target.value)}
          className="mt-3 w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900"
        >
          {accessibleOwners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id === currentUser.id ? "My squads" : `${o.name}'s squads`}
            </option>
          ))}
        </select>
      )}
    </header>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "classes", label: "Classes", icon: ClipboardList },
    { id: "students", label: "Players", icon: Users },
    { id: "admin", label: "Admin", icon: Shield },
  ];
  return (
    <nav
      className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex z-10"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition ${active ? "text-blue-600" : "text-slate-500"}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-xs font-medium tracking-wide">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ---------------- add student modal ---------------- */

function AddStudentModal({ allStudents, excludeIds, onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const available = allStudents.filter(
    (s) => !excludeIds.includes(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-end z-30" onClick={onClose}>
      <div
        className="bg-white border-t border-slate-200 rounded-t-2xl w-full flex flex-col"
        style={{ maxHeight: "75vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-display text-xl">Add Player</h3>
          <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players"
              className="w-full bg-slate-100 border border-slate-300 rounded-lg pl-9 pr-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {available.length === 0 ? (
            <EmptyState text={allStudents.length === 0 ? "No players yet — add some in the Players tab first." : "No matching players."} />
          ) : (
            available.map((s) => (
              <button
                key={s.id}
                onClick={() => onAdd(s.id)}
                className="w-full flex items-center gap-3 bg-slate-100 rounded-lg p-3 text-left"
              >
                <span className="flex-1 font-medium">{s.name}</span>
                {s.position && <span className="text-xs text-slate-500">{s.position}</span>}
                <Plus size={16} className="text-blue-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- classes tab ---------------- */

function MonthCalendar({ year, month, markedDates, onPrevMonth, onNextMonth, onSelectDate }) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = firstDay.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayStr = new Date().toISOString().slice(0, 10);

  function dateStrFor(d) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onPrevMonth} className="p-1.5 text-slate-400 hover:text-slate-700">
          <ChevronLeft size={18} />
        </button>
        <div className="font-display text-lg tracking-wide">{monthLabel}</div>
        <button onClick={onNextMonth} className="p-1.5 text-slate-400 hover:text-slate-700">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const ds = dateStrFor(d);
          const marked = markedDates.has(ds);
          const isToday = ds === todayStr;
          return (
            <button
              key={i}
              onClick={() => onSelectDate(ds)}
              className={`aspect-square rounded-lg flex items-center justify-center text-sm border ${
                marked
                  ? "bg-emerald-50 text-emerald-700 font-semibold border-emerald-400"
                  : "text-slate-700 hover:bg-slate-100 border-transparent"
              } ${isToday ? "ring-1 ring-blue-500" : ""}`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClassesTab({ ownerData, mutations }) {
  const [view, setView] = useState("list"); // list | class | session
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [sessionSubTab, setSessionSubTab] = useState("report");
  const [newClassName, setNewClassName] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [reportDraft, setReportDraft] = useState("");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const selectedClass = ownerData.classes.find((c) => c.id === selectedClassId) || null;
  const selectedRecord = selectedClass
    ? ownerData.records.find((r) => r.classId === selectedClass.id && r.date === selectedDate) || null
    : null;

  useEffect(() => {
    if (selectedRecord) setReportDraft(selectedRecord.sessionReport || "");
  }, [selectedDate]); // eslint-disable-line

  function handleCreateClass() {
    if (!newClassName.trim()) return;
    mutations.createClass(newClassName.trim());
    setNewClassName("");
  }

  function openClass(id) { setSelectedClassId(id); setView("class"); }
  function backToList() { setView("list"); setSelectedClassId(null); }
  function backToClass() { setView("class"); setSelectedDate(null); }

  function openDate(dateStr) {
    if (!selectedClass) return;
    const exists = ownerData.records.some((r) => r.classId === selectedClass.id && r.date === dateStr);
    if (!exists) mutations.createSession(selectedClass.id, dateStr);
    setSelectedDate(dateStr);
    setSessionSubTab("report");
    setView("session");
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else { setCalMonth((m) => m - 1); }
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else { setCalMonth((m) => m + 1); }
  }
  function jumpToToday() {
    const t = new Date();
    setCalYear(t.getFullYear());
    setCalMonth(t.getMonth());
  }

  if (view === "session" && selectedClass) {
    if (!selectedRecord) {
      return (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      );
    }
    const roster = selectedClass.studentIds.map((id) => ownerData.students.find((s) => s.id === id)).filter(Boolean);
    const presentCount = selectedRecord.presentIds.length;
    return (
      <div className="p-4 space-y-4">
        <button onClick={backToClass} className="flex items-center gap-1 text-slate-400 text-sm">
          <ChevronLeft size={16} /> {selectedClass.name}
        </button>
        <h2 className="font-display text-2xl">{formatDate(selectedRecord.date)}</h2>

        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          {["report", "present"].map((t) => (
            <button
              key={t}
              onClick={() => setSessionSubTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
                sessionSubTab === t ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              {t === "report" ? "Session Report" : "Total Present"}
            </button>
          ))}
        </div>

        {sessionSubTab === "report" ? (
          <div className="space-y-2">
            <textarea
              value={reportDraft}
              onChange={(e) => setReportDraft(e.target.value)}
              rows={8}
              placeholder="What did the squad work on today? Any notes on players?"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => mutations.updateSession(selectedRecord.id, { sessionReport: reportDraft })}
              className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg w-full"
            >
              Save Report
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <div className="font-display text-4xl text-blue-600">{presentCount} / {roster.length}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Players present</div>
            </div>
            {roster.length === 0 ? (
              <EmptyState text="Add players to this class to take attendance." />
            ) : (
              <div className="space-y-1.5">
                {roster.map((s) => {
                  const present = selectedRecord.presentIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => mutations.togglePresence(selectedRecord.id, s.id)}
                      className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
                    >
                      {present ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Circle size={20} className="text-slate-400 shrink-0" />
                      )}
                      <span className="flex-1 text-left font-medium">{s.name}</span>
                      {s.position && <span className="text-xs text-slate-500">{s.position}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => { mutations.deleteSession(selectedRecord.id); backToClass(); }}
          className="text-red-600 text-sm w-full text-center py-2"
        >
          Delete this session
        </button>
      </div>
    );
  }

  if (view === "class" && selectedClass) {
    const roster = selectedClass.studentIds.map((id) => ownerData.students.find((s) => s.id === id)).filter(Boolean);
    const sessions = ownerData.records.filter((r) => r.classId === selectedClass.id).sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="p-4 space-y-5">
        <button onClick={backToList} className="flex items-center gap-1 text-slate-400 text-sm">
          <ChevronLeft size={16} /> Classes
        </button>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">{selectedClass.name}</h2>
          <button
            onClick={() => { if (confirm(`Delete ${selectedClass.name}? This removes its sessions too.`)) { mutations.deleteClass(selectedClass.id); backToList(); } }}
            className="text-red-600 p-2"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm uppercase tracking-wide text-slate-500">Roster · {roster.length}</h3>
            <button onClick={() => setShowAddStudent(true)} className="text-blue-600 text-sm font-medium flex items-center gap-1">
              <Plus size={16} /> Add player
            </button>
          </div>
          {roster.length === 0 ? (
            <EmptyState text="No players added yet." />
          ) : (
            <div className="space-y-1.5">
              {roster.map((s) => (
                <div key={s.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
                  <span className="flex-1 font-medium">{s.name}</span>
                  {s.position && <span className="text-xs text-slate-500">{s.position}</span>}
                  <button onClick={() => mutations.removeStudentFromClass(selectedClass.id, s.id)} className="text-slate-400 hover:text-red-600 p-1">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm uppercase tracking-wide text-slate-500">Sessions</h3>
          <MonthCalendar
            year={calYear}
            month={calMonth}
            markedDates={new Set(sessions.map((r) => r.date))}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onSelectDate={openDate}
          />
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-slate-500">Tap any date to log or view that session.</p>
            <button onClick={jumpToToday} className="text-xs text-blue-600 font-medium shrink-0">Today</button>
          </div>
          <button
            onClick={() =>
              exportAttendancePDF({
                className: selectedClass.name,
                year: calYear,
                month: calMonth + 1,
                roster,
                sessions,
              })
            }
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-blue-600 font-semibold py-2.5 rounded-lg"
          >
            <FileDown size={16} /> Export this month as PDF
          </button>
        </section>

        {showAddStudent && (
          <AddStudentModal
            allStudents={ownerData.students}
            excludeIds={selectedClass.studentIds}
            onAdd={(sid) => mutations.addStudentToClass(selectedClass.id, sid)}
            onClose={() => setShowAddStudent(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="font-display text-3xl text-blue-600">Classes</h2>
      <div className="flex gap-2">
        <input
          value={newClassName}
          onChange={(e) => setNewClassName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
          placeholder="New class name, e.g. U12 Boys"
          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={handleCreateClass} disabled={!newClassName.trim()} className="bg-blue-600 text-white font-semibold px-4 rounded-lg disabled:opacity-40">
          <Plus size={18} />
        </button>
      </div>
      {ownerData.classes.length === 0 ? (
        <EmptyState text="No classes yet. Add one above — classes are how you group players for training and matches." />
      ) : (
        <div className="space-y-2">
          {ownerData.classes.map((c, i) => (
            <button key={c.id} onClick={() => openClass(c.id)} className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-blue-400 transition text-left">
              <span className="font-display text-lg text-white bg-blue-600 w-9 h-9 rounded-full flex items-center justify-center shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-sm text-slate-500">{c.studentIds.length} player{c.studentIds.length !== 1 ? "s" : ""}</div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- students tab ---------------- */

function StudentsTab({ ownerData, mutations }) {
  const [view, setView] = useState("list"); // list | detail | new
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [subTab, setSubTab] = useState("fees");
  const [search, setSearch] = useState("");

  const [formName, setFormName] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formDob, setFormDob] = useState("");

  const selectedStudent = ownerData.students.find((s) => s.id === selectedStudentId) || null;

  const [positionDraft, setPositionDraft] = useState("");
  const [dobDraft, setDobDraft] = useState("");

  const [feeYear, setFeeYear] = useState(() => new Date().getFullYear());
  const [feeMonth, setFeeMonth] = useState(() => new Date().getMonth() + 1); // 1-12

  const currentFee = selectedStudent
    ? ownerData.fees.find((f) => f.studentId === selectedStudent.id && f.year === feeYear && f.month === feeMonth) || null
    : null;

  const [feeStatusDraft, setFeeStatusDraft] = useState("Unpaid");
  const [feeAmountDraft, setFeeAmountDraft] = useState("");
  const [feeNotesDraft, setFeeNotesDraft] = useState("");

  useEffect(() => {
    if (selectedStudent) {
      setPositionDraft(selectedStudent.position || "");
      setDobDraft(selectedStudent.dob || "");
    }
  }, [selectedStudentId]); // eslint-disable-line

  useEffect(() => {
    setFeeStatusDraft(currentFee ? currentFee.feeStatus : "Unpaid");
    setFeeAmountDraft(currentFee ? currentFee.feeAmount : "");
    setFeeNotesDraft(currentFee ? currentFee.feeNotes : "");
  }, [selectedStudentId, feeYear, feeMonth]); // eslint-disable-line

  function resetForm() {
    setFormName(""); setFormPosition(""); setFormDob("");
  }

  function handleCreate() {
    if (!formName.trim()) return;
    mutations.createStudent({ name: formName.trim(), position: formPosition, dob: formDob });
    resetForm();
    setView("list");
  }

  function openStudent(id) {
    setSelectedStudentId(id);
    setSubTab("fees");
    const t = new Date();
    setFeeYear(t.getFullYear());
    setFeeMonth(t.getMonth() + 1);
    setView("detail");
  }

  function prevFeeMonth() {
    if (feeMonth === 1) { setFeeMonth(12); setFeeYear((y) => y - 1); } else { setFeeMonth((m) => m - 1); }
  }
  function nextFeeMonth() {
    if (feeMonth === 12) { setFeeMonth(1); setFeeYear((y) => y + 1); } else { setFeeMonth((m) => m + 1); }
  }

  const feeMonthLabel = new Date(feeYear, feeMonth - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const filtered = ownerData.students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  function currentMonthFeeStatus(studentId) {
    const t = new Date();
    const f = ownerData.fees.find((x) => x.studentId === studentId && x.year === t.getFullYear() && x.month === t.getMonth() + 1);
    return f ? f.feeStatus : "Unpaid";
  }
  const feeDot = (status) => (status === "Paid" ? "bg-emerald-600" : status === "Partial" ? "bg-amber-500" : "bg-red-600");

  if (view === "new") {
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => { resetForm(); setView("list"); }} className="flex items-center gap-1 text-slate-400 text-sm">
          <ChevronLeft size={16} /> Players
        </button>
        <h2 className="font-display text-3xl">New Player</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500">Name</label>
            <input autoFocus value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Player name" className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500">Position</label>
            <PositionPicker value={formPosition} onChange={setFormPosition} />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-slate-500">Date of birth</label>
            <input type="date" value={formDob} onChange={(e) => setFormDob(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2" />
          </div>
          <p className="text-xs text-slate-500">Fees are tracked month by month from the player's page after you add them.</p>
          <button onClick={handleCreate} disabled={!formName.trim()} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg disabled:opacity-40">Add Player</button>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedStudent) {
    const age = calcAge(selectedStudent.dob);
    return (
      <div className="p-4 space-y-4">
        <button onClick={() => setView("list")} className="flex items-center gap-1 text-slate-400 text-sm">
          <ChevronLeft size={16} /> Players
        </button>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">{selectedStudent.name}</h2>
          <button
            onClick={() => { if (confirm(`Remove ${selectedStudent.name}? This also removes them from any classes.`)) { mutations.deleteStudent(selectedStudent.id); setView("list"); } }}
            className="text-red-600 p-2"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="flex bg-white border border-slate-200 rounded-lg p-1">
          {[{ k: "fees", l: "Fees", I: Banknote }, { k: "position", l: "Position", I: Shirt }, { k: "dob", l: "Date of Birth", I: Cake }].map((t) => (
            <button
              key={t.k}
              onClick={() => setSubTab(t.k)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition flex flex-col items-center gap-1 ${subTab === t.k ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >
              <t.I size={15} /> {t.l}
            </button>
          ))}
        </div>

        {subTab === "fees" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2 py-2">
              <button onClick={prevFeeMonth} className="p-1.5 text-slate-400 hover:text-slate-700">
                <ChevronLeft size={18} />
              </button>
              <span className="font-display text-lg tracking-wide">{feeMonthLabel}</span>
              <button onClick={nextFeeMonth} className="p-1.5 text-slate-400 hover:text-slate-700">
                <ChevronRight size={18} />
              </button>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Status</label>
              <select value={feeStatusDraft} onChange={(e) => setFeeStatusDraft(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <option>Unpaid</option><option>Partial</option><option>Paid</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Amount (£)</label>
              <input type="number" value={feeAmountDraft} onChange={(e) => setFeeAmountDraft(e.target.value)} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Notes</label>
              <textarea value={feeNotesDraft} onChange={(e) => setFeeNotesDraft(e.target.value)} rows={3} className="w-full mt-1 bg-white border border-slate-200 rounded-lg px-3 py-2" />
            </div>
            <button
              onClick={() => mutations.saveFee(selectedStudent.id, feeYear, feeMonth, { feeStatus: feeStatusDraft, feeAmount: feeAmountDraft, feeNotes: feeNotesDraft })}
              className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg"
            >
              Save
            </button>
          </div>
        )}

        {subTab === "position" && (
          <div className="space-y-3">
            <PositionPicker value={positionDraft} onChange={setPositionDraft} />
            <button onClick={() => mutations.updateStudent(selectedStudent.id, { position: positionDraft })} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg">Save</button>
          </div>
        )}

        {subTab === "dob" && (
          <div className="space-y-3">
            <input type="date" value={dobDraft} onChange={(e) => setDobDraft(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2" />
            {age !== null && <p className="text-sm text-slate-500">Age: {age}</p>}
            <button onClick={() => mutations.updateStudent(selectedStudent.id, { dob: dobDraft })} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-lg">Save</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl text-blue-600">Players</h2>
        <button onClick={() => setView("new")} className="bg-blue-600 text-white font-semibold px-3 py-2 rounded-lg flex items-center gap-1 text-sm">
          <Plus size={16} /> Add
        </button>
      </div>
      {ownerData.students.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players" className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 placeholder-slate-400" />
        </div>
      )}
      {ownerData.students.length === 0 ? (
        <EmptyState text="No players yet. Add your first player to build your roster." />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((s) => (
            <button key={s.id} onClick={() => openStudent(s.id)} className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3 text-left">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${feeDot(currentMonthFeeStatus(s.id))}`} title="This month's fee status" />
              <span className="flex-1 font-medium">{s.name}</span>
              {s.position && <span className="text-xs text-slate-500">{s.position}</span>}
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- admin tab ---------------- */

function AdminTab({ currentUser, users, permissions, onToggleAdmin, onRemoveUser, onTogglePermission }) {
  const others = users.filter((u) => u.id !== currentUser.id);

  return (
    <div className="p-4 space-y-6">
      <h2 className="font-display text-3xl text-blue-600">Admin</h2>

      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-wide text-slate-500">Coaches</h3>
        <p className="text-xs text-slate-500">Coaches join by creating their own account from the sign-in screen.</p>
        <div className="space-y-1.5">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <span className="font-display text-base text-white bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </span>
              <span className="flex-1 font-medium">
                {u.name}{u.id === currentUser.id && <span className="text-slate-500 font-normal"> · you</span>}
              </span>
              {u.isAdmin && (
                <span className="text-xs text-blue-600 border border-blue-600 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Shield size={11} /> Admin
                </span>
              )}
              {currentUser.isAdmin && (
                <div className="flex items-center gap-1">
                  <button onClick={() => onToggleAdmin(u.id)} className="text-slate-500 hover:text-blue-600 p-1.5" title={u.isAdmin ? "Remove admin" : "Make admin"}>
                    <Shield size={16} />
                  </button>
                  {u.id !== currentUser.id && (
                    <button onClick={() => { if (confirm(`Remove ${u.name} from the coach list? Their login will still exist, but they'll lose access to shared data.`)) onRemoveUser(u.id); }} className="text-slate-500 hover:text-red-600 p-1.5">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm uppercase tracking-wide text-slate-500">Share my squads</h3>
        <p className="text-xs text-slate-500">Turn this on for a coach to let them view and edit your classes and players.</p>
        {others.length === 0 ? (
          <EmptyState text="Once another coach signs up, they'll appear here to share access with." />
        ) : (
          <div className="space-y-1.5">
            {others.map((u) => {
              const granted = permissions.some((p) => p.ownerId === currentUser.id && p.granteeId === u.id);
              return (
                <div key={u.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <span className="flex-1 font-medium">{u.name}</span>
                  <ToggleSwitch checked={granted} onChange={() => onTogglePermission(u.id)} />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- app ---------------- */

function App() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = signed out
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("classes");
  const [viewingOwnerId, setViewingOwnerId] = useState(null);
  const [ownerData, setOwnerData] = useState({ classes: [], students: [], records: [], fees: [] });

  // watch auth state
  useEffect(() => {
    db.getSession().then(setSession);
    const unsubscribe = db.onAuthChange(setSession);
    return unsubscribe;
  }, []);

  // once signed in, load coaches + this account's profile
  async function refreshUsers() {
    try {
      const [u, p] = await Promise.all([db.fetchProfiles(), db.fetchPermissions()]);
      setUsers(u);
      setPermissions(p);
      return u;
    } catch (e) {
      setError("Could not load coaches.");
      return [];
    }
  }

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { setCurrentUser(null); setUsers([]); setPermissions([]); setViewingOwnerId(null); return; }
    (async () => {
      const u = await refreshUsers();
      const mine = u.find((x) => x.id === session.user.id) || null;
      setCurrentUser(mine);
      if (mine) setViewingOwnerId(mine.id);
    })();
  }, [session]);

  // load the currently-viewed owner's classes/students/sessions
  async function refreshOwnerData() {
    if (!viewingOwnerId) return;
    try {
      const data = await db.loadOwnerData(viewingOwnerId);
      setOwnerData(data);
    } catch (e) {
      setError("Could not load that data. Check your connection.");
    }
  }

  useEffect(() => { refreshOwnerData(); }, [viewingOwnerId]); // eslint-disable-line

  async function runMutation(fn) {
    try {
      await fn();
      await refreshOwnerData();
    } catch (e) {
      setError(e.message || "Could not save that change.");
    }
  }

  const mutations = {
    createClass: (name) => runMutation(() => db.createClass(viewingOwnerId, name)),
    deleteClass: (id) => runMutation(() => db.deleteClass(id)),
    addStudentToClass: (classId, studentId) => runMutation(() => db.addStudentToClass(classId, studentId)),
    removeStudentFromClass: (classId, studentId) => runMutation(() => db.removeStudentFromClass(classId, studentId)),
    createSession: (classId, date) => runMutation(() => db.createSession(viewingOwnerId, classId, date)),
    updateSession: (id, patch) => runMutation(() => db.updateSessionReport(id, patch.sessionReport)),
    deleteSession: (id) => runMutation(() => db.deleteSession(id)),
    togglePresence: (recordId, studentId) =>
      runMutation(() => {
        const record = ownerData.records.find((r) => r.id === recordId);
        const currentlyPresent = record ? record.presentIds.includes(studentId) : false;
        return db.togglePresence(recordId, studentId, currentlyPresent);
      }),
    createStudent: (data) => runMutation(() => db.createStudent(viewingOwnerId, data)),
    updateStudent: (id, patch) => runMutation(() => db.updateStudent(id, patch)),
    deleteStudent: (id) => runMutation(() => db.deleteStudent(id)),
    saveFee: (studentId, year, month, patch) => runMutation(() => db.upsertFee(viewingOwnerId, studentId, year, month, patch)),
  };

  function handleSwitchUser() {
    db.signOut();
  }

  async function handleToggleAdmin(userId) {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.isAdmin && users.filter((u) => u.isAdmin).length <= 1) {
      setError("At least one admin is required.");
      return;
    }
    try {
      await db.toggleAdmin(userId, !target.isAdmin);
      const u = await refreshUsers();
      if (currentUser && currentUser.id === userId) setCurrentUser(u.find((x) => x.id === userId) || null);
    } catch (e) {
      setError(e.message || "Could not update.");
    }
  }

  async function handleRemoveUser(userId) {
    if (currentUser && userId === currentUser.id) { setError("Switch to another coach before removing your own account."); return; }
    try {
      await db.removeProfile(userId);
      await refreshUsers();
      if (viewingOwnerId === userId && currentUser) setViewingOwnerId(currentUser.id);
    } catch (e) {
      setError(e.message || "Could not remove that coach.");
    }
  }

  async function handleTogglePermission(granteeId) {
    if (!currentUser) return;
    const exists = permissions.some((p) => p.ownerId === currentUser.id && p.granteeId === granteeId);
    try {
      if (exists) await db.revokePermission(currentUser.id, granteeId);
      else await db.grantPermission(currentUser.id, granteeId);
      await refreshUsers();
    } catch (e) {
      setError(e.message || "Could not update sharing.");
    }
  }

  const accessibleOwners = useMemo(() => {
    if (!currentUser) return [];
    const granted = users.filter((u) => u.id !== currentUser.id && permissions.some((p) => p.ownerId === u.id && p.granteeId === currentUser.id));
    return [currentUser, ...granted];
  }, [users, permissions, currentUser]);

  if (session === undefined) return <LoadingScreen />;
  if (!session) return <LoginScreen />;
  if (!currentUser) {
    return (
      <CompleteProfileScreen
        userId={session.user.id}
        onDone={async () => {
          const u = await refreshUsers();
          const mine = u.find((x) => x.id === session.user.id) || null;
          setCurrentUser(mine);
          if (mine) setViewingOwnerId(mine.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-body">
      <FontStyles />
      <TopBar
        currentUser={currentUser}
        accessibleOwners={accessibleOwners}
        viewingOwnerId={viewingOwnerId}
        setViewingOwnerId={setViewingOwnerId}
        onSwitchUser={handleSwitchUser}
      />
      <main className="flex-1 overflow-y-auto pb-20">
        {tab === "classes" && <ClassesTab ownerData={ownerData} mutations={mutations} />}
        {tab === "students" && <StudentsTab ownerData={ownerData} mutations={mutations} />}
        {tab === "admin" && (
          <AdminTab
            currentUser={currentUser}
            users={users}
            permissions={permissions}
            onToggleAdmin={handleToggleAdmin}
            onRemoveUser={handleRemoveUser}
            onTogglePermission={handleTogglePermission}
          />
        )}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
      {error && <ErrorToast message={error} onClose={() => setError(null)} />}
    </div>
  );
}

export default App;
