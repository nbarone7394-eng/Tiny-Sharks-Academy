"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Client = {
  id: string;
  child_name: string;
  parent_name: string | null;
  parent_email: string | null;
};

type ProgressNote = {
  id: string;
  note: string | null;
  created_at: string;
  package_id: string | null;
  client_id: string | null;
  skills_worked_on: string | null;
  progress_level: number | null;
  next_focus: string | null;
};

type LessonPackage = {
  id: string;
  client_id: string;
  package_name: string | null;
  lessons_total: number;
  lessons_used: number;
  payment_status: "paid" | "partial" | "unpaid" | null;
  package_price: number | null;
  purchase_date: string | null;
};

type Lesson = {
  id: string;
  client_id: string | null;
  package_id: string | null;
  lesson_date: string | null;
  status: string | null;
};

type NoteDraft = {
  skillsWorkedOn: string;
  progressLevel: string;
  notes: string;
  nextFocus: string;
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  is_active: boolean;
  created_at: string;
};

type PackageEditDraft = {
  packageName: string;
  lessonsTotal: string;
  paymentStatus: "paid" | "partial" | "unpaid";
  packagePrice: string;
  purchaseDate: string;
};

type NoteEditDraft = {
  skillsWorkedOn: string;
  progressLevel: string;
  notes: string;
  nextFocus: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<LessonPackage[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [notesByPackage, setNotesByPackage] = useState<
    Record<string, ProgressNote[]>
  >({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, NoteDraft>>({});

  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageEditDraft, setPackageEditDraft] = useState<PackageEditDraft>({
    packageName: "",
    lessonsTotal: "",
    paymentStatus: "unpaid",
    packagePrice: "",
    purchaseDate: "",
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditDraft, setNoteEditDraft] = useState<NoteEditDraft>({
    skillsWorkedOn: "",
    progressLevel: "",
    notes: "",
    nextFocus: "",
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");

  const [childName, setChildName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [packageName, setPackageName] = useState("");
  const [lessonsTotal, setLessonsTotal] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "partial" | "unpaid">(
    "unpaid"
  );
  const [search, setSearch] = useState("");

  async function fetchClients() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("child_name", { ascending: true });

    if (error) {
      alert("Error loading clients: " + error.message);
      return;
    }

    setClients((data as Client[]) || []);
  }

  async function fetchPackages() {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading packages: " + error.message);
      return;
    }

    setPackages((data as LessonPackage[]) || []);
  }

  async function fetchLessons() {
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .order("lesson_date", { ascending: false });

    if (error) {
      alert("Error loading lessons: " + error.message);
      return;
    }

    setLessons((data as Lesson[]) || []);
  }

  async function fetchNotes() {
    const { data, error } = await supabase
      .from("progress_notes")
      .select(
        "id, note, created_at, package_id, client_id, skills_worked_on, progress_level, next_focus"
      )
      .not("package_id", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading progress notes: " + error.message);
      return;
    }

    const grouped: Record<string, ProgressNote[]> = {};

    ((data as ProgressNote[]) || []).forEach((note) => {
      if (!note.package_id) return;
      if (!grouped[note.package_id]) grouped[note.package_id] = [];
      grouped[note.package_id].push(note);
    });

    setNotesByPackage(grouped);
  }

  async function fetchAnnouncements() {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Error loading announcements: " + error.message);
      return;
    }

    setAnnouncements((data as Announcement[]) || []);
  }

  async function refreshAll() {
    await Promise.all([
      fetchClients(),
      fetchPackages(),
      fetchLessons(),
      fetchNotes(),
      fetchAnnouncements(),
    ]);
  }

  async function addClient() {
    if (!childName.trim()) {
      alert("Child name required");
      return;
    }

    const { error } = await supabase.from("clients").insert([
      {
        child_name: childName.trim(),
        parent_name: parentName.trim() || null,
        parent_email: parentEmail.trim() || null,
      },
    ]);

    if (error) {
      alert("Error adding client: " + error.message);
      return;
    }

    setChildName("");
    setParentName("");
    setParentEmail("");
    fetchClients();
  }

  async function addPackage() {
    if (!selectedClientId) {
      alert("Please select a client");
      return;
    }

    if (!lessonsTotal || Number(lessonsTotal) <= 0) {
      alert("Please enter a valid number of lessons");
      return;
    }

    const { error } = await supabase.from("packages").insert([
      {
        client_id: selectedClientId,
        package_name: packageName.trim() || null,
        lessons_total: Number(lessonsTotal),
        lessons_used: 0,
        payment_status: paymentStatus,
        package_price: packagePrice ? Number(packagePrice) : null,
        purchase_date: purchaseDate || null,
      },
    ]);

    if (error) {
      alert("Error adding package: " + error.message);
      return;
    }

    setSelectedClientId("");
    setPackageName("");
    setLessonsTotal("");
    setPackagePrice("");
    setPurchaseDate("");
    setPaymentStatus("unpaid");
    fetchPackages();
  }

  async function postAnnouncement() {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      alert("Please add both a title and message.");
      return;
    }

    const { error } = await supabase.from("announcements").insert([
      {
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        is_active: true,
      },
    ]);

    if (error) {
      alert("Error posting announcement: " + error.message);
      return;
    }

    setAnnouncementTitle("");
    setAnnouncementMessage("");
    fetchAnnouncements();
  }

  async function deactivateAnnouncement(id: string) {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      alert("Error turning off announcement: " + error.message);
      return;
    }

    fetchAnnouncements();
  }

  async function completeLesson(pkg: LessonPackage) {
    const remaining = pkg.lessons_total - pkg.lessons_used;

    if (remaining <= 0) {
      alert("No lessons remaining");
      return;
    }

    const draft = noteDrafts[pkg.id] || {
      skillsWorkedOn: "",
      progressLevel: "",
      notes: "",
      nextFocus: "",
    };

    const { data: lessonData, error: lessonError } = await supabase
      .from("lessons")
      .insert([
        {
          client_id: pkg.client_id,
          package_id: pkg.id,
          lesson_date: new Date().toISOString(),
          status: "completed",
        },
      ])
      .select()
      .single();

    if (lessonError) {
      alert("Error saving lesson: " + lessonError.message);
      return;
    }

    const { error: packageError } = await supabase
      .from("packages")
      .update({
        lessons_used: pkg.lessons_used + 1,
      })
      .eq("id", pkg.id);

    if (packageError) {
      alert("Error updating package: " + packageError.message);
      return;
    }

    const hasAnyNoteContent =
      draft.skillsWorkedOn.trim() ||
      draft.progressLevel ||
      draft.notes.trim() ||
      draft.nextFocus.trim();

    if (hasAnyNoteContent) {
      const { error: progressNoteError } = await supabase
        .from("progress_notes")
        .insert([
          {
            client_id: pkg.client_id,
            package_id: pkg.id,
            lesson_id: lessonData.id,
            skills_worked_on: draft.skillsWorkedOn.trim() || null,
            progress_level: draft.progressLevel ? Number(draft.progressLevel) : null,
            note: draft.notes.trim() || null,
            next_focus: draft.nextFocus.trim() || null,
          },
        ]);

      if (progressNoteError) {
        alert("Lesson saved, but note failed: " + progressNoteError.message);
      }
    }

    setNoteDrafts((prev) => ({
      ...prev,
      [pkg.id]: {
        skillsWorkedOn: "",
        progressLevel: "",
        notes: "",
        nextFocus: "",
      },
    }));

    refreshAll();
  }

  function updateNoteDraft(
    packageId: string,
    field: keyof NoteDraft,
    value: string
  ) {
    setNoteDrafts((prev) => ({
      ...prev,
      [packageId]: {
        skillsWorkedOn: prev[packageId]?.skillsWorkedOn || "",
        progressLevel: prev[packageId]?.progressLevel || "",
        notes: prev[packageId]?.notes || "",
        nextFocus: prev[packageId]?.nextFocus || "",
        [field]: value,
      },
    }));
  }

  function getPackagesForClient(clientId: string) {
    return packages.filter((pkg) => pkg.client_id === clientId);
  }

  function getLessonsForPackage(packageId: string) {
    return lessons.filter((lesson) => lesson.package_id === packageId);
  }

  function renderStars(level: number | null) {
    if (!level) return "Not rated";
    return "⭐".repeat(level);
  }

  function getParentPortalStatus(client: Client) {
    if (client.parent_email && client.parent_email.trim()) {
      return {
        label: "Parent Portal Ready",
        color: "bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label: "Missing Parent Email",
      color: "bg-amber-100 text-amber-700",
    };
  }

  function paymentBadgeClasses(status: LessonPackage["payment_status"]) {
    if (status === "paid") return "bg-emerald-100 text-emerald-700";
    if (status === "partial") return "bg-amber-100 text-amber-700";
    return "bg-rose-100 text-rose-700";
  }

  function startEditPackage(pkg: LessonPackage) {
    setEditingPackageId(pkg.id);
    setPackageEditDraft({
      packageName: pkg.package_name || "",
      lessonsTotal: String(pkg.lessons_total),
      paymentStatus: pkg.payment_status || "unpaid",
      packagePrice:
        pkg.package_price === null || pkg.package_price === undefined
          ? ""
          : String(pkg.package_price),
      purchaseDate: pkg.purchase_date || "",
    });
  }

  async function savePackageEdit(packageId: string) {
    if (!packageEditDraft.lessonsTotal || Number(packageEditDraft.lessonsTotal) <= 0) {
      alert("Please enter a valid lesson total.");
      return;
    }

    const { error } = await supabase
      .from("packages")
      .update({
        package_name: packageEditDraft.packageName.trim() || null,
        lessons_total: Number(packageEditDraft.lessonsTotal),
        payment_status: packageEditDraft.paymentStatus,
        package_price: packageEditDraft.packagePrice
          ? Number(packageEditDraft.packagePrice)
          : null,
        purchase_date: packageEditDraft.purchaseDate || null,
      })
      .eq("id", packageId);

    if (error) {
      alert("Error updating package: " + error.message);
      return;
    }

    setEditingPackageId(null);
    fetchPackages();
  }

  async function deletePackage(packageId: string) {
    const confirmed = window.confirm(
      "Delete this package? This will not delete lesson rows automatically unless your database is set up for cascading deletes."
    );
    if (!confirmed) return;

    const { error } = await supabase.from("packages").delete().eq("id", packageId);

    if (error) {
      alert("Error deleting package: " + error.message);
      return;
    }

    if (editingPackageId === packageId) {
      setEditingPackageId(null);
    }

    refreshAll();
  }

  function startEditNote(note: ProgressNote) {
    setEditingNoteId(note.id);
    setNoteEditDraft({
      skillsWorkedOn: note.skills_worked_on || "",
      progressLevel: note.progress_level ? String(note.progress_level) : "",
      notes: note.note || "",
      nextFocus: note.next_focus || "",
    });
  }

  async function saveNoteEdit(noteId: string) {
    const { error } = await supabase
      .from("progress_notes")
      .update({
        skills_worked_on: noteEditDraft.skillsWorkedOn.trim() || null,
        progress_level: noteEditDraft.progressLevel
          ? Number(noteEditDraft.progressLevel)
          : null,
        note: noteEditDraft.notes.trim() || null,
        next_focus: noteEditDraft.nextFocus.trim() || null,
      })
      .eq("id", noteId);

    if (error) {
      alert("Error updating note: " + error.message);
      return;
    }

    setEditingNoteId(null);
    fetchNotes();
  }

  async function deleteNote(noteId: string) {
    const confirmed = window.confirm("Delete this progress note?");
    if (!confirmed) return;

    const { error } = await supabase.from("progress_notes").delete().eq("id", noteId);

    if (error) {
      alert("Error deleting note: " + error.message);
      return;
    }

    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }

    fetchNotes();
  }

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const term = search.toLowerCase();
      return (
        client.child_name.toLowerCase().includes(term) ||
        (client.parent_name || "").toLowerCase().includes(term) ||
        (client.parent_email || "").toLowerCase().includes(term)
      );
    });
  }, [clients, search]);

  useEffect(() => {
    refreshAll();
  }, []);

  const totalClients = clients.length;
  const totalPackages = packages.length;
  const lowLessonPackages = packages.filter(
    (pkg) => pkg.lessons_total - pkg.lessons_used <= 2
  ).length;
  const lessonsCompleted = packages.reduce((sum, pkg) => sum + pkg.lessons_used, 0);
  const parentPortalReadyCount = clients.filter(
    (client) => client.parent_email && client.parent_email.trim()
  ).length;
  const activeAnnouncements = announcements.filter((a) => a.is_active);

  return (
    <main className="min-h-screen bg-sky-50">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-6">
        <section className="mb-6 overflow-hidden rounded-[36px] bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-8 text-white shadow-lg">
          <div className="grid gap-6 md:grid-cols-[1.2fr_.8fr] md:items-center">
            <div>
              <div className="mb-3 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-bold">
                🌊 Swim • Learn • Grow
              </div>
              <h1
                className="text-4xl font-black md:text-6xl"
                style={{
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  textShadow:
                    "0 4px 0 rgba(18,78,165,0.55), 0 8px 22px rgba(0,0,0,0.16)",
                }}
              >
                Tiny Sharks Academy
              </h1>
              <div className="mt-3 inline-block rounded-full bg-blue-800/70 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow-lg">
                Swim Lesson Tracker
              </div>
              <p className="mt-4 max-w-xl text-base text-blue-50 md:text-lg">
                Track progress, celebrate growth, and make every lesson a splash.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="rounded-[30px] bg-white/15 px-8 py-6 text-center backdrop-blur-sm">
                <div className="text-7xl">🦈</div>
                <p className="mt-2 text-lg font-bold">Splash • Learn • Grow!</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-[28px] border border-sky-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl">👧</div>
            <p className="mt-2 text-sm font-bold text-slate-500">Clients</p>
            <p className="mt-1 text-4xl font-black text-sky-700">{totalClients}</p>
          </div>

          <div className="rounded-[28px] border border-emerald-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl">👜</div>
            <p className="mt-2 text-sm font-bold text-slate-500">Active Packages</p>
            <p className="mt-1 text-4xl font-black text-emerald-700">{totalPackages}</p>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl">⭐</div>
            <p className="mt-2 text-sm font-bold text-slate-500">Lessons Completed</p>
            <p className="mt-1 text-4xl font-black text-amber-600">{lessonsCompleted}</p>
          </div>

          <div className="rounded-[28px] border border-rose-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl">🦀</div>
            <p className="mt-2 text-sm font-bold text-slate-500">Low Lessons</p>
            <p className="mt-1 text-4xl font-black text-rose-500">{lowLessonPackages}</p>
          </div>

          <div className="rounded-[28px] border border-violet-200 bg-white p-5 text-center shadow-sm">
            <div className="text-3xl">🔐</div>
            <p className="mt-2 text-sm font-bold text-slate-500">Portal Ready</p>
            <p className="mt-1 text-4xl font-black text-violet-600">
              {parentPortalReadyCount}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="rounded-[30px] border border-rose-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-rose-600">📣 Parent Alert</h2>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Alert Title
                  </label>
                  <input
                    placeholder="e.g. Weather Cancellation"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Message to All Parents
                  </label>
                  <textarea
                    placeholder="e.g. Lessons are canceled today due to extreme weather. I will reach out about makeup options."
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    className="min-h-[120px] w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-rose-400"
                  />
                </div>

                <button
                  onClick={postAnnouncement}
                  className="w-full rounded-[18px] bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 font-black text-white shadow-lg"
                >
                  Post Alert
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-sky-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-sky-700">⭐ Add New Client</h2>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Child Name
                  </label>
                  <input
                    placeholder="e.g. Emma"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Parent Name
                  </label>
                  <input
                    placeholder="e.g. Sarah"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Parent Email
                  </label>
                  <input
                    placeholder="e.g. parent@email.com"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                  />
                </div>

                <button
                  onClick={addClient}
                  className="w-full rounded-[18px] bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-black text-white shadow-lg"
                >
                  🐟 Add Client
                </button>
              </div>
            </section>

            <section className="rounded-[30px] border border-emerald-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-emerald-700">🐚 Add Lesson Package</h2>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Select Client
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  >
                    <option value="">Choose a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.child_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Package Name
                  </label>
                  <input
                    placeholder="e.g. 8 Lesson Package"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Total Lessons
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8"
                    value={lessonsTotal}
                    onChange={(e) => setLessonsTotal(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Package Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 160"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Payment Status
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(
                        e.target.value as "paid" | "partial" | "unpaid"
                      )
                    }
                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-emerald-500"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <button
                  onClick={addPackage}
                  className="w-full rounded-[18px] bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 font-black text-white shadow-lg"
                >
                  🐢 Add Package
                </button>
              </div>
            </section>
          </aside>

          <section className="space-y-5">
            {activeAnnouncements.length > 0 && (
              <section className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
                <h2 className="text-xl font-black text-rose-700">Active Parent Alerts</h2>

                <div className="mt-4 space-y-3">
                  {activeAnnouncements.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-[20px] border border-rose-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-black text-rose-700">
                            {alert.title}
                          </h3>
                          <p className="mt-2 whitespace-pre-wrap text-slate-700">
                            {alert.message}
                          </p>
                          <p className="mt-3 text-xs text-slate-500">
                            Posted {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>

                        <button
                          onClick={() => deactivateAnnouncement(alert.id)}
                          className="rounded-[16px] bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                        >
                          Turn Off
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="relative">
              <input
                placeholder="Search by child, parent, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white p-4 pl-12 text-base text-black outline-none shadow-sm focus:border-sky-500"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔎</span>
            </div>

            {filteredClients.map((client) => {
              const clientPackages = getPackagesForClient(client.id);

              return (
                <section
                  key={client.id}
                  className="rounded-[32px] border border-sky-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-sky-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-100 to-pink-100 text-3xl">
                        🏊‍♀️
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-sky-800">
                          {client.child_name}
                        </h3>
                        <p className="text-slate-500">
                          Parent: {client.parent_name || "N/A"}
                        </p>
                        <p className="text-sm text-slate-500">
                          Email: {client.parent_email || "N/A"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {client.parent_email
                            ? "Parent can sign up at /parent-login using this email."
                            : "Add a parent email to enable portal signup."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full bg-blue-500 px-4 py-2 text-sm font-black text-white shadow">
                        {clientPackages.length} Package
                        {clientPackages.length === 1 ? "" : "s"}
                      </div>

                      <div
                        className={`rounded-full px-4 py-2 text-sm font-black ${getParentPortalStatus(
                          client
                        ).color}`}
                      >
                        {getParentPortalStatus(client).label}
                      </div>
                    </div>
                  </div>

                  {clientPackages.length > 0 ? (
                    <div className="space-y-5">
                      {clientPackages.map((pkg) => {
                        const remaining = pkg.lessons_total - pkg.lessons_used;
                        const packageNotes = notesByPackage[pkg.id] || [];
                        const packageLessons = getLessonsForPackage(pkg.id);
                        const draft = noteDrafts[pkg.id] || {
                          skillsWorkedOn: "",
                          progressLevel: "",
                          notes: "",
                          nextFocus: "",
                        };
                        const isEditingPackage = editingPackageId === pkg.id;

                        return (
                          <div
                            key={pkg.id}
                            className="rounded-[28px] border border-slate-200 bg-sky-50 p-4"
                          >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">🎯</span>
                                <div>
                                  <h4 className="text-2xl font-black text-sky-900">
                                    {pkg.package_name || "Lesson Package"}
                                  </h4>
                                  <p className="text-sm text-slate-500">Active package</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <div
                                  className={`rounded-full px-4 py-2 text-sm font-black ${paymentBadgeClasses(
                                    pkg.payment_status
                                  )}`}
                                >
                                  {(pkg.payment_status || "unpaid").toUpperCase()}
                                </div>

                                {!isEditingPackage ? (
                                  <>
                                    <button
                                      onClick={() => startEditPackage(pkg)}
                                      className="rounded-[16px] bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                                    >
                                      Edit Package
                                    </button>
                                    <button
                                      onClick={() => deletePackage(pkg.id)}
                                      className="rounded-[16px] bg-rose-500 px-4 py-2 text-sm font-bold text-white"
                                    >
                                      Delete Package
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => savePackageEdit(pkg.id)}
                                      className="rounded-[16px] bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingPackageId(null)}
                                      className="rounded-[16px] bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {isEditingPackage ? (
                              <div className="mb-5 rounded-[24px] border border-slate-200 bg-white p-4">
                                <h5 className="mb-4 text-lg font-black text-sky-700">
                                  Edit Package
                                </h5>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                      Package Name
                                    </label>
                                    <input
                                      value={packageEditDraft.packageName}
                                      onChange={(e) =>
                                        setPackageEditDraft((prev) => ({
                                          ...prev,
                                          packageName: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                      Total Lessons
                                    </label>
                                    <input
                                      type="number"
                                      value={packageEditDraft.lessonsTotal}
                                      onChange={(e) =>
                                        setPackageEditDraft((prev) => ({
                                          ...prev,
                                          lessonsTotal: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                      Payment Status
                                    </label>
                                    <select
                                      value={packageEditDraft.paymentStatus}
                                      onChange={(e) =>
                                        setPackageEditDraft((prev) => ({
                                          ...prev,
                                          paymentStatus: e.target.value as
                                            | "paid"
                                            | "partial"
                                            | "unpaid",
                                        }))
                                      }
                                      className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                    >
                                      <option value="unpaid">Unpaid</option>
                                      <option value="partial">Partial</option>
                                      <option value="paid">Paid</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                      Package Price
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={packageEditDraft.packagePrice}
                                      onChange={(e) =>
                                        setPackageEditDraft((prev) => ({
                                          ...prev,
                                          packagePrice: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                    />
                                  </div>

                                  <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">
                                      Purchase Date
                                    </label>
                                    <input
                                      type="date"
                                      value={packageEditDraft.purchaseDate}
                                      onChange={(e) =>
                                        setPackageEditDraft((prev) => ({
                                          ...prev,
                                          purchaseDate: e.target.value,
                                        }))
                                      }
                                      className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            <div className="mb-4 grid gap-3 md:grid-cols-4">
                              <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Total Lessons
                                </p>
                                <p className="mt-1 text-4xl font-black text-sky-700">
                                  {pkg.lessons_total}
                                </p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Lessons Used
                                </p>
                                <p className="mt-1 text-4xl font-black text-blue-700">
                                  {pkg.lessons_used}
                                </p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Lessons Remaining
                                </p>
                                <p
                                  className={`mt-1 text-4xl font-black ${
                                    remaining <= 2 ? "text-rose-500" : "text-amber-500"
                                  }`}
                                >
                                  {remaining}
                                </p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-white p-4 text-center">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Progress
                                </p>
                                <p className="mt-1 text-4xl font-black text-emerald-600">
                                  {pkg.lessons_total > 0
                                    ? `${Math.round(
                                        (pkg.lessons_used / pkg.lessons_total) * 100
                                      )}%`
                                    : "0%"}
                                </p>
                              </div>
                            </div>

                            <div className="mb-5 grid gap-3 md:grid-cols-3">
                              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Payment Status
                                </p>
                                <p className="mt-2 text-lg font-black text-slate-800">
                                  {pkg.payment_status || "unpaid"}
                                </p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Package Price
                                </p>
                                <p className="mt-2 text-lg font-black text-slate-800">
                                  {pkg.package_price !== null && pkg.package_price !== undefined
                                    ? `$${Number(pkg.package_price).toFixed(2)}`
                                    : "Not set"}
                                </p>
                              </div>

                              <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Purchase Date
                                </p>
                                <p className="mt-2 text-lg font-black text-slate-800">
                                  {pkg.purchase_date
                                    ? new Date(pkg.purchase_date).toLocaleDateString()
                                    : "Not set"}
                                </p>
                              </div>
                            </div>

                            <div className="mb-5 rounded-[26px] border border-sky-100 bg-white p-4">
                              <h5 className="mb-4 text-xl font-black text-sky-700">
                                🗓️ Lesson History
                              </h5>

                              {packageLessons.length > 0 ? (
                                <div className="space-y-3">
                                  {packageLessons.slice(0, 5).map((lesson) => (
                                    <div
                                      key={lesson.id}
                                      className="rounded-[20px] border border-slate-200 bg-sky-50 p-4"
                                    >
                                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div>
                                          <p className="text-sm font-bold text-slate-700">
                                            {lesson.lesson_date
                                              ? new Date(
                                                  lesson.lesson_date
                                                ).toLocaleString()
                                              : "No date"}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            Status: {lesson.status || "completed"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="rounded-[20px] bg-sky-50 p-4 text-sm text-slate-500">
                                  No lesson history yet.
                                </div>
                              )}
                            </div>

                            <div className="mt-5 rounded-[26px] border border-sky-100 bg-white p-4">
                              <h5 className="mb-4 text-xl font-black text-sky-700">
                                ✏️ Add Lesson Note
                              </h5>

                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Skills Worked On
                                  </label>
                                  <input
                                    value={draft.skillsWorkedOn}
                                    onChange={(e) =>
                                      updateNoteDraft(pkg.id, "skillsWorkedOn", e.target.value)
                                    }
                                    placeholder="e.g. Floating, Kicking, Breath Control"
                                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                                  />
                                </div>

                                <div>
                                  <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Progress Level
                                  </label>
                                  <select
                                    value={draft.progressLevel}
                                    onChange={(e) =>
                                      updateNoteDraft(pkg.id, "progressLevel", e.target.value)
                                    }
                                    className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                                  >
                                    <option value="">Select level</option>
                                    <option value="1">⭐ 1 - Getting Comfortable</option>
                                    <option value="2">⭐⭐ 2 - Trying Skills</option>
                                    <option value="3">⭐⭐⭐ 3 - Building Confidence</option>
                                    <option value="4">⭐⭐⭐⭐ 4 - Swimming Stronger</option>
                                    <option value="5">⭐⭐⭐⭐⭐ 5 - Almost Independent</option>
                                    <option value="6">⭐⭐⭐⭐⭐⭐ 6 - Swim Star</option>
                                  </select>
                                </div>
                              </div>

                              <div className="mt-4">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                  Notes
                                </label>
                                <textarea
                                  value={draft.notes}
                                  onChange={(e) =>
                                    updateNoteDraft(pkg.id, "notes", e.target.value)
                                  }
                                  placeholder="How did the lesson go? Any wins or challenges?"
                                  className="min-h-[110px] w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                                />
                              </div>

                              <div className="mt-4">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                  Next Focus
                                </label>
                                <input
                                  value={draft.nextFocus}
                                  onChange={(e) =>
                                    updateNoteDraft(pkg.id, "nextFocus", e.target.value)
                                  }
                                  placeholder="What should we work on next lesson?"
                                  className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none focus:border-sky-500"
                                />
                              </div>

                              <button
                                onClick={() => completeLesson(pkg)}
                                className="mt-4 rounded-[18px] bg-gradient-to-r from-violet-500 to-violet-600 px-5 py-3 font-black text-white shadow-lg"
                              >
                                ⭐ Complete Lesson
                              </button>
                            </div>

                            <div className="mt-6">
                              <h5 className="mb-3 text-xl font-black text-sky-700">
                                📚 Progress Notes History
                              </h5>

                              {packageNotes.length > 0 ? (
                                <div className="space-y-3">
                                  {packageNotes.map((note) => {
                                    const isEditingNote = editingNoteId === note.id;

                                    return (
                                      <div
                                        key={note.id}
                                        className="rounded-[24px] border border-slate-200 bg-white p-4"
                                      >
                                        <div className="mb-3 flex flex-wrap gap-2">
                                          {!isEditingNote ? (
                                            <>
                                              <button
                                                onClick={() => startEditNote(note)}
                                                className="rounded-[16px] bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                                              >
                                                Edit Note
                                              </button>
                                              <button
                                                onClick={() => deleteNote(note.id)}
                                                className="rounded-[16px] bg-rose-500 px-4 py-2 text-sm font-bold text-white"
                                              >
                                                Delete Note
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => saveNoteEdit(note.id)}
                                                className="rounded-[16px] bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
                                              >
                                                Save
                                              </button>
                                              <button
                                                onClick={() => setEditingNoteId(null)}
                                                className="rounded-[16px] bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          )}
                                        </div>

                                        {isEditingNote ? (
                                          <div className="grid gap-4">
                                            <div className="grid gap-4 md:grid-cols-2">
                                              <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                  Skills Worked On
                                                </label>
                                                <input
                                                  value={noteEditDraft.skillsWorkedOn}
                                                  onChange={(e) =>
                                                    setNoteEditDraft((prev) => ({
                                                      ...prev,
                                                      skillsWorkedOn: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                                />
                                              </div>

                                              <div>
                                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                                  Progress Level
                                                </label>
                                                <select
                                                  value={noteEditDraft.progressLevel}
                                                  onChange={(e) =>
                                                    setNoteEditDraft((prev) => ({
                                                      ...prev,
                                                      progressLevel: e.target.value,
                                                    }))
                                                  }
                                                  className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                                >
                                                  <option value="">Select level</option>
                                                  <option value="1">⭐ 1</option>
                                                  <option value="2">⭐⭐ 2</option>
                                                  <option value="3">⭐⭐⭐ 3</option>
                                                  <option value="4">⭐⭐⭐⭐ 4</option>
                                                  <option value="5">⭐⭐⭐⭐⭐ 5</option>
                                                  <option value="6">⭐⭐⭐⭐⭐⭐ 6</option>
                                                </select>
                                              </div>
                                            </div>

                                            <div>
                                              <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Notes
                                              </label>
                                              <textarea
                                                value={noteEditDraft.notes}
                                                onChange={(e) =>
                                                  setNoteEditDraft((prev) => ({
                                                    ...prev,
                                                    notes: e.target.value,
                                                  }))
                                                }
                                                className="min-h-[100px] w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                              />
                                            </div>

                                            <div>
                                              <label className="mb-2 block text-sm font-bold text-slate-700">
                                                Next Focus
                                              </label>
                                              <input
                                                value={noteEditDraft.nextFocus}
                                                onChange={(e) =>
                                                  setNoteEditDraft((prev) => ({
                                                    ...prev,
                                                    nextFocus: e.target.value,
                                                  }))
                                                }
                                                className="w-full rounded-[18px] border border-slate-200 bg-white p-3 text-black outline-none"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="grid gap-3 md:grid-cols-4">
                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Skills Worked On
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-800">
                                                  {note.skills_worked_on || "—"}
                                                </p>
                                              </div>

                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Progress
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-800">
                                                  {renderStars(note.progress_level)}
                                                </p>
                                              </div>

                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Notes
                                                </p>
                                                <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-800">
                                                  {note.note || "—"}
                                                </p>
                                              </div>

                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                                  Next Focus
                                                </p>
                                                <p className="mt-1 font-semibold text-slate-800">
                                                  {note.next_focus || "—"}
                                                </p>
                                              </div>
                                            </div>

                                            <p className="mt-3 text-xs font-medium text-slate-500">
                                              {new Date(note.created_at).toLocaleString()}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="rounded-[20px] bg-white p-4 text-sm text-slate-500">
                                  No progress notes yet.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[28px] bg-sky-50 p-5 text-slate-500">
                      No packages added yet for this client.
                    </div>
                  )}
                </section>
              );
            })}

            {filteredClients.length === 0 && (
              <section className="rounded-[32px] bg-white p-8 text-center shadow-sm">
                <p className="text-slate-500">No clients found.</p>
              </section>
            )}
          </section>
        </div>

        <footer className="mt-8 rounded-[28px] bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-center text-lg font-black text-white shadow-lg">
          💖 Every stroke is a step toward confidence! 🐠
        </footer>
      </div>
    </main>
  );
}