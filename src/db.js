import { supabase } from "./supabaseClient.js";

/* ---------- auth ---------- */

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.session) return { needsConfirmation: true };
  await createProfileIfMissing(data.user.id, name);
  return { needsConfirmation: false };
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function createProfileIfMissing(userId, name) {
  const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
  const { error } = await supabase.from("profiles").insert({ id: userId, name, is_admin: !count });
  if (error) throw error;
}

/* ---------- profiles & permissions ---------- */

export async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw error;
  return data.map((p) => ({ id: p.id, name: p.name, isAdmin: p.is_admin }));
}

export async function fetchPermissions() {
  const { data, error } = await supabase.from("permissions").select("*");
  if (error) throw error;
  return data.map((p) => ({ ownerId: p.owner_id, granteeId: p.grantee_id }));
}

export async function toggleAdmin(userId, makeAdmin) {
  const { error } = await supabase.from("profiles").update({ is_admin: makeAdmin }).eq("id", userId);
  if (error) throw error;
}

export async function removeProfile(userId) {
  const { error } = await supabase.from("profiles").delete().eq("id", userId);
  if (error) throw error;
}

export async function grantPermission(ownerId, granteeId) {
  const { error } = await supabase.from("permissions").insert({ owner_id: ownerId, grantee_id: granteeId });
  if (error) throw error;
}

export async function revokePermission(ownerId, granteeId) {
  const { error } = await supabase.from("permissions").delete().eq("owner_id", ownerId).eq("grantee_id", granteeId);
  if (error) throw error;
}

/* ---------- owner data: classes, students, sessions ---------- */

export async function loadOwnerData(ownerId) {
  const [classesRes, studentsRes, sessionsRes, feesRes] = await Promise.all([
    supabase.from("classes").select("id,name,class_students(student_id)").eq("owner_id", ownerId),
    supabase.from("students").select("*").eq("owner_id", ownerId),
    supabase
      .from("sessions")
      .select("id,class_id,date,session_report,session_attendance(student_id)")
      .eq("owner_id", ownerId),
    supabase.from("student_fees").select("*").eq("owner_id", ownerId),
  ]);
  if (classesRes.error) throw classesRes.error;
  if (studentsRes.error) throw studentsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (feesRes.error) throw feesRes.error;

  const classes = classesRes.data.map((c) => ({
    id: c.id,
    name: c.name,
    studentIds: (c.class_students || []).map((cs) => cs.student_id),
  }));
  const students = studentsRes.data.map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position || "",
    dob: s.dob || "",
  }));
  const records = sessionsRes.data.map((r) => ({
    id: r.id,
    classId: r.class_id,
    date: r.date,
    sessionReport: r.session_report || "",
    presentIds: (r.session_attendance || []).map((a) => a.student_id),
  }));
  const fees = feesRes.data.map((f) => ({
    id: f.id,
    studentId: f.student_id,
    year: f.year,
    month: f.month,
    feeStatus: f.fee_status || "Unpaid",
    feeAmount: f.fee_amount ?? "",
    feeNotes: f.fee_notes || "",
  }));

  return { classes, students, records, fees };
}

export async function createClass(ownerId, name) {
  const { error } = await supabase.from("classes").insert({ owner_id: ownerId, name });
  if (error) throw error;
}
export async function deleteClass(classId) {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}
export async function addStudentToClass(classId, studentId) {
  const { error } = await supabase.from("class_students").insert({ class_id: classId, student_id: studentId });
  if (error) throw error;
}
export async function removeStudentFromClass(classId, studentId) {
  const { error } = await supabase
    .from("class_students")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId);
  if (error) throw error;
}
export async function createSession(ownerId, classId, date) {
  const { error } = await supabase.from("sessions").insert({ owner_id: ownerId, class_id: classId, date });
  if (error && error.code !== "23505") throw error; // 23505 = already exists for that date, fine
}
export async function updateSessionReport(sessionId, sessionReport) {
  const { error } = await supabase.from("sessions").update({ session_report: sessionReport }).eq("id", sessionId);
  if (error) throw error;
}
export async function deleteSession(sessionId) {
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw error;
}
export async function togglePresence(sessionId, studentId, currentlyPresent) {
  if (currentlyPresent) {
    const { error } = await supabase
      .from("session_attendance")
      .delete()
      .eq("session_id", sessionId)
      .eq("student_id", studentId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("session_attendance").insert({ session_id: sessionId, student_id: studentId });
    if (error) throw error;
  }
}
export async function createStudent(ownerId, data) {
  const { error } = await supabase.from("students").insert({
    owner_id: ownerId,
    name: data.name,
    position: data.position || "",
    dob: data.dob || null,
  });
  if (error) throw error;
}
export async function updateStudent(studentId, patch) {
  const dbPatch = {};
  if ("name" in patch) dbPatch.name = patch.name;
  if ("position" in patch) dbPatch.position = patch.position;
  if ("dob" in patch) dbPatch.dob = patch.dob || null;
  const { error } = await supabase.from("students").update(dbPatch).eq("id", studentId);
  if (error) throw error;
}
export async function deleteStudent(studentId) {
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throw error;
}

export async function upsertFee(ownerId, studentId, year, month, patch) {
  const payload = {
    owner_id: ownerId,
    student_id: studentId,
    year,
    month,
    fee_status: patch.feeStatus || "Unpaid",
    fee_amount: patch.feeAmount === "" || patch.feeAmount == null ? null : patch.feeAmount,
    fee_notes: patch.feeNotes || "",
  };
  const { error } = await supabase.from("student_fees").upsert(payload, { onConflict: "student_id,year,month" });
  if (error) throw error;
}
