(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const byId = (id) => document.getElementById(id);

  // --- Defaults ---
  const defaultProfile = {
    name: "Souvik Das",
    studentId: "S12345",
    email: "souvik.d@example.com",
    phone: "+91 98765 43210",
    dob: "2005-08-15",
    address: "123, Academic Rd, Kolkata, India",
    major: "Computer Science",
    year: "3rd Year",
    enrollmentDate: "2023-08-01",
    careerGoal: "Software Developer",
    interests: "Web Development, AI/ML, Cybersecurity",
    studyPoints: 1250,
    achievements: [
      {
        id: "att_streak_5",
        title: "5-Day Attendance Streak",
        date: "2025-09-05",
      },
      {
        id: "task_master_10",
        title: "Task Master",
        description: "Complete 10 suggested tasks.",
        date: "2025-09-04",
      },
    ],
  };

  const defaultCourses = [
    {
      id: "c1",
      code: "CS201",
      title: "Data Structures & Algorithms",
      progress: 88,
      credits: 4,
    },
    {
      id: "c2",
      code: "CS310",
      title: "Database Management Systems",
      progress: 72,
      credits: 3,
    },
    {
      id: "c3",
      code: "MA101",
      title: "Linear Algebra",
      progress: 95,
      credits: 3,
    },
    {
      id: "c4",
      code: "CS450",
      title: "Machine Learning",
      progress: 64,
      credits: 4,
    },
  ];

  const defaultAttendance = [
    { subject: "Data Structures & Algorithms", total: 40, attended: 36 },
    { subject: "Database Management Systems", total: 42, attended: 32 },
    { subject: "Linear Algebra", total: 38, attended: 35 },
    { subject: "Machine Learning", total: 30, attended: 22 },
    { subject: "Physics", total: 28, attended: 20 },
  ];

  const defaultTimetable = [
    {
      time: "09:00 - 10:00",
      type: "class",
      subject: "Data Structures & Algorithms",
    },
    { time: "10:00 - 11:00", type: "class", subject: "Operating Systems" },
    { time: "11:00 - 12:00", type: "free" },
    { time: "12:00 - 13:00", type: "lunch" },
    { time: "13:00 - 14:00", type: "class", subject: "Machine Learning" },
    { time: "14:00 - 16:00", type: "free" },
  ];

  const allPossibleAchievements = [
    {
      id: "task_master_10",
      icon: "checklist",
      title: "Task Master",
      description: "Complete 10 suggested tasks.",
    },
    {
      id: "att_streak_5",
      icon: "calendar_month",
      title: "5-Day Attendance Streak",
      description: "Maintain perfect attendance for 5 days in a row.",
    },
    {
      id: "sp_1500",
      icon: "star",
      title: "Point Collector",
      description: "Earn over 1,500 Study Points.",
    },
    {
      id: "early_bird",
      icon: "wb_sunny",
      title: "Early Bird",
      description: "Mark attendance before 9:05 AM.",
    },
  ];

  // --- State ---
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, v) {
    localStorage.setItem(key, JSON.stringify(v));
  }

  const state = {
    profile: load("studentProfile", defaultProfile),
    courses: load("studentCourses", defaultCourses),
    attendance: load("studentAttendance", defaultAttendance),
    theme: localStorage.getItem("theme") || "light",
    notifCount: 3,
    completedTasks: load("studentCompletedTasks", []),
  };
  document.documentElement.dataset.theme = state.theme;

  // --- Utils ---
  const API_BASE_URL = "http://localhost:5000/api";
  function getToken() {
    return localStorage.getItem("token");
  }
  async function api(path, options = {}) {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        let msg = "Request failed";
        try {
          const j = await res.json();
          msg = j.message || msg;
        } catch {}
        throw new Error(msg);
      }
      if (res.status === 204) return null;
      return res.json();
    } catch (e) {
      // Surface error to caller; many callers have local fallback
      throw e;
    }
  }
  function toast(msg, type = "primary") {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    t.style.borderLeftColor =
      type === "danger"
        ? "var(--danger)"
        : type === "accent"
        ? "var(--accent)"
        : "var(--primary)";
    $("#toastStack").appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
  function getChartTextColor() {
    return document.documentElement.dataset.theme === "dark"
      ? "#f9fafb"
      : "#111827";
  }

  function getPersonalizedSuggestion(profile, courses) {
    const courseWithLowestProgress = courses.reduce(
      (lowest, course) => (course.progress < lowest.progress ? course : lowest),
      courses[0]
    );
    if (courseWithLowestProgress.progress < 75) {
      return `Your progress in <strong>${courseWithLowestProgress.title}</strong> is ${courseWithLowestProgress.progress}%. Try reviewing the latest lecture notes.`;
    }
    if (profile.careerGoal.toLowerCase().includes("developer")) {
      return `To advance your <strong>${profile.careerGoal}</strong> goal, try solving a daily coding challenge on LeetCode.`;
    }
    return "Review your notes from today's classes.";
  }

  // --- RENDERERS ---
  function renderSidebar() {
    $("#sidebar-avatar").textContent = state.profile.name.charAt(0);
    $("#sidebar-name").textContent = state.profile.name;
    $(
      "#sidebar-points"
    ).innerHTML = `<span class="material-icons-outlined" style="font-size: 1.1rem;">stars</span> ${state.profile.studyPoints} SP`;
  }

  function renderProfile() {
    $("#pageTitle").textContent = "My Profile";
    $("#contentArea").innerHTML = `
      <div class="grid">
        <div class="card profile-card">
          <div class="profile-hero"><div class="avatar xl">${state.profile.name.charAt(
            0
          )}</div><div class="presence"></div></div>
          <div class="profile-meta">
            <h2 class="profile-name">${state.profile.name}</h2>
            <span class="chip" id="copyId">ID: ${state.profile.studentId}</span>
            <div class="profile-actions"><button class="btn primary" id="editProfileBtn">Edit Profile</button></div>
          </div>
        </div>
        <div class="card"><h3 class="card-title">Personal Information</h3><div class="info-list"><div class="info-row"><div class="label">Email</div><div class="value">${
          state.profile.email
        }</div></div><div class="info-row"><div class="label">Phone</div><div class="value">${
      state.profile.phone
    }</div></div><div class="info-row"><div class="label">Date of Birth</div><div class="value">${
      state.profile.dob
    }</div></div><div class="info-row"><div class="label">Address</div><div class="value">${
      state.profile.address
    }</div></div></div></div>
        <div class="card"><h3 class="card-title">Academic Information</h3><div class="info-list"><div class="info-row"><div class="label">Major</div><div class="value">${
          state.profile.major
        }</div></div><div class="info-row"><div class="label">Year</div><div class="value">${
      state.profile.year
    }</div></div><div class="info-row"><div class="label">Enrollment Date</div><div class="value">${
      state.profile.enrollmentDate
    }</div></div></div></div>
        <div class="card"><h3 class="card-title">Career Goals & Interests</h3><div class="info-list"><div class="info-row"><div class="label">Goal</div><div class="value">${
          state.profile.careerGoal
        }</div></div><div class="info-row"><div class="label">Interests</div><div class="value">${
      state.profile.interests
    }</div></div></div></div>
      </div>
    `;
    $("#editProfileBtn").onclick = openEditModal;
    $("#copyId").onclick = () => {
      navigator.clipboard.writeText(state.profile.studentId);
      toast("Copied ID");
    };
    renderSidebar();
  }

  function renderDashboard() {
    $("#pageTitle").textContent = "My Agenda";
    let agendaHTML = defaultTimetable
      .map((slot, index) => {
        if (slot.type === "class") {
          return `<div class="timeslot"><span class="time">${slot.time}</span><div class="event class"><span class="material-icons-outlined">book</span><span>${slot.subject}</span></div></div>`;
        }
        if (slot.type === "free") {
          const suggestion = getPersonalizedSuggestion(
            state.profile,
            state.courses
          );
          const isCompleted =
            Array.isArray(state.completedTasks) &&
            state.completedTasks.includes(index);
          const doneButton = isCompleted
            ? `<button class="btn-done" data-task-id="${index}" data-points="50" disabled><span class="material-icons-outlined">check_circle</span>Completed</button>`
            : `<button class="btn-done" data-task-id="${index}" data-points="50"><span class="material-icons-outlined">check</span>Done</button>`;
          return `<div class="timeslot"><span class="time">${slot.time}</span><div class="event free-period"><div style="flex-grow: 1;"><span class="material-icons-outlined">self_improvement</span><div><strong>Free Period</strong><p class="suggestion">${suggestion}</p></div></div>${doneButton}</div></div>`;
        }
        return `<div class="timeslot"><span class="time">${slot.time}</span><div class="event break"><span class="material-icons-outlined">restaurant</span><span>Lunch Break</span></div></div>`;
      })
      .join("");

    $(
      "#contentArea"
    ).innerHTML = `<div class="card" style="grid-column: 1 / -1;"><h3 class="card-title">Today's Agenda for ${new Date().toLocaleDateString(
      "en-IN",
      { weekday: "long", day: "numeric", month: "long" }
    )}</h3><div class="daily-schedule">${agendaHTML}</div></div>`;

    $("#contentArea").addEventListener("click", (e) => {
      const doneBtn = e.target.closest(".btn-done");
      if (doneBtn && !doneBtn.disabled) {
        const points = parseInt(doneBtn.dataset.points, 10);
        const taskId = parseInt(doneBtn.dataset.taskId, 10);
        state.profile.studyPoints += points;
        save("studentProfile", state.profile);
        if (!Array.isArray(state.completedTasks)) {
          state.completedTasks = [];
        }
        if (!state.completedTasks.includes(taskId)) {
          state.completedTasks.push(taskId);
          save("studentCompletedTasks", state.completedTasks);
        }
        renderSidebar();
        toast(`+${points} Study Points Earned!`, "accent");
        doneBtn.disabled = true;
        doneBtn.innerHTML = `<span class="material-icons-outlined">check_circle</span>Completed`;
      }
    });
  }

  function renderAchievements() {
    $("#pageTitle").textContent = "Achievements & Progress";
    const hasAchievement = (id) =>
      state.profile.achievements.some((a) => a.id === id);
    let achievementsHTML = allPossibleAchievements
      .map((ach) => {
        const earned = hasAchievement(ach.id);
        const userAchievement = earned
          ? state.profile.achievements.find((a) => a.id === ach.id)
          : null;
        return `
            <div class="achievement-badge ${earned ? "earned" : "locked"}">
                <div class="icon"><span class="material-icons-outlined">${
                  ach.icon
                }</span></div>
                <div class="title">${ach.title}</div>
                <div class="description">${ach.description}</div>
                ${
                  earned
                    ? `<div class="date">Unlocked: ${new Date(
                        userAchievement.date
                      ).toLocaleDateString("en-IN")}</div>`
                    : ""
                }
            </div>
        `;
      })
      .join("");
    $("#contentArea").innerHTML = `
        <div class="card">
            <div class="points-summary">
                <div class="points-value">${state.profile.studyPoints}</div>
                <div class="points-label">Total Study Points</div>
            </div>
            <h3 class="card-title">Badges</h3>
            <div class="achievements-grid">${achievementsHTML}</div>
        </div>
    `;
  }

  function renderCourses() {
    $("#pageTitle").textContent = "My Courses";
    $("#contentArea").innerHTML = `<div class="grid">${state.courses
      .map(
        (c) =>
          `<div class="card"><h3>${c.title}</h3><p class="small">${c.code} — ${c.credits} credits</p><div class="progress"><i style="width:${c.progress}%"></i></div><p>${c.progress}% completed</p></div>`
      )
      .join("")}</div>`;
  }
  function renderAnalytics() {
    $("#pageTitle").textContent = "Analytics";
    $(
      "#contentArea"
    ).innerHTML = `<div class="grid"><div class="card"><canvas id="attChart"></canvas></div><div class="card"><canvas id="courseChart"></canvas></div></div>`;
    new Chart($("#attChart"), {
      type: "line",
      data: {
        labels: state.attendance.map((a) => a.subject),
        datasets: [
          {
            label: "Attendance %",
            data: state.attendance.map((a) =>
              Math.round((a.attended / a.total) * 100)
            ),
            borderColor: "#4f46e5",
            backgroundColor: "#6366f1",
            tension: 0.3,
            pointBackgroundColor: [
              "#4f46e5",
              "#22c55e",
              "#f59e0b",
              "#ef4444",
              "#06b6d4",
            ],
            pointBorderColor: "#fff",
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: getChartTextColor() } } },
        scales: {
          x: { ticks: { color: getChartTextColor() } },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: getChartTextColor() },
          },
        },
      },
    });
    new Chart($("#courseChart"), {
      type: "bar",
      data: {
        labels: state.courses.map((c) => c.title),
        datasets: [
          {
            label: "Progress %",
            data: state.courses.map((c) => c.progress),
            backgroundColor: [
              "#4f46e5",
              "#22c55e",
              "#f59e0b",
              "#ef4444",
              "#06b6d4",
            ],
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: getChartTextColor() } } },
        scales: {
          x: { ticks: { color: getChartTextColor() } },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: getChartTextColor() },
          },
        },
      },
    });
  }
  function renderAttendance() {
    $("#pageTitle").textContent = "Attendance";
    const rows = state.attendance
      .map((a) => {
        const pct = Math.round((a.attended / a.total) * 100);
        return `<tr><td>${a.subject}</td><td>${a.total}</td><td>${
          a.attended
        }</td><td class="${
          pct >= 75 ? "status-good" : "status-bad"
        }">${pct}%</td></tr>`;
      })
      .join("");
    $(
      "#contentArea"
    ).innerHTML = `<div class="controls"><button class="btn primary" id="pdfBtn">Export PDF</button></div><div class="card"><h3 class="card-title">My Attendance Overview</h3><canvas id="attendancePie"></canvas></div><table class="table"><thead><tr><th>Subject</th><th>Total</th><th>Attended</th><th>%</th></tr></thead><tbody>${rows}</tbody></table>`;
    new Chart($("#attendancePie"), {
      type: "pie",
      data: {
        labels: state.attendance.map((a) => a.subject),
        datasets: [
          {
            data: state.attendance.map((a) =>
              Math.round((a.attended / a.total) * 100)
            ),
            backgroundColor: [
              "#4f46e5",
              "#22c55e",
              "#f59e0b",
              "#ef4444",
              "#06b6d4",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: getChartTextColor() },
          },
        },
      },
    });
    $("#pdfBtn").onclick = () => exportPDF();
  }
  async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(
      `Attendance Report — ${state.profile.name} (${state.profile.studentId})`,
      14,
      15
    );
    const canvas = document.getElementById("attendancePie");
    const chartImg = canvas.toDataURL("image/png", 1.0);
    doc.addImage(chartImg, "PNG", 14, 25, 120, 90);
    doc.autoTable({
      startY: 120,
      head: [["Subject", "Total", "Attended", "%"]],
      body: state.attendance.map((a) => [
        a.subject,
        a.total,
        a.attended,
        Math.round((a.attended / a.total) * 100) + "%",
      ]),
    });
    doc.save("attendance.pdf");
  }
  function renderSettings() {
    $("#pageTitle").textContent = "Settings";
    $(
      "#contentArea"
    ).innerHTML = `<div class="grid"><div class="card"><h3>Theme</h3><button class="btn" id="themeToggle2">Toggle Dark/Light</button></div><div class="card"><h3>Reset</h3><button class="btn danger" id="resetBtn">Reset All</button></div></div>`;
    $("#themeToggle2").onclick = toggleTheme;
    $("#resetBtn").onclick = () => {
      localStorage.clear();
      location.reload();
    };
  }

  // --- MODALS & CAMERA ---
  function openModal(selector) {
    $(selector)?.classList.add("open");
  }
  function closeModal(selector) {
    $(selector)?.classList.remove("open");
  }
  function openEditModal() {
    $("#f_name").value = state.profile.name;
    $("#f_id").value = state.profile.studentId;
    $("#f_email").value = state.profile.email;
    $("#f_phone").value = state.profile.phone;
    $("#f_dob").value = state.profile.dob;
    $("#f_address").value = state.profile.address;
    $("#f_major").value = state.profile.major;
    $("#f_year").value = state.profile.year;
    $("#f_enrollmentDate").value = state.profile.enrollmentDate;
    $("#f_careerGoal").value = state.profile.careerGoal;
    $("#f_interests").value = state.profile.interests;
    openModal("#editModal");
  }

  let cameraStream = null;
  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      cameraStream = null;
    }
  }
  async function openQRScanner() {
    const video = byId("qr-video");
    const canvasElement = byId("qr-canvas");
    const canvas = canvasElement.getContext("2d");
    const scannerUI = byId("scanner-ui");
    const successUI = byId("scanner-success");
    const errorUI = byId("scanner-error");
    const statusEl = byId("scanner-status");
    const successMessageEl = successUI.querySelector("p:nth-of-type(1)");

    // Reset UI
    scannerUI.style.display = "block";
    successUI.style.display = "none";
    errorUI.style.display = "none";
    statusEl.textContent = "Requesting camera access...";
    openModal("#scannerModal");

    // Security hint
    const hostIsLocal =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";
    if (!window.isSecureContext && !hostIsLocal) {
      errorUI.style.display = "block";
      scannerUI.style.display = "none";
      byId("error-message").textContent =
        "Camera requires HTTPS or localhost. Please serve the site locally (http://localhost) or use HTTPS.";
      return;
    }

    // Prefer rear camera with decent resolution
    const constraints = {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = cameraStream;
      video.setAttribute("playsinline", true);
      await video.play();
    } catch (err) {
      console.error(err);
      scannerUI.style.display = "none";
      errorUI.style.display = "block";
      byId("error-message").textContent =
        "Could not access camera. Check permissions and that no other app is using it.";
      return;
    }

    statusEl.textContent = "Scanning for QR code...";

    // Use fast native BarcodeDetector if available; fallback to jsQR
    const useBarcodeDetector = "BarcodeDetector" in window;
    let detector = null;
    if (useBarcodeDetector) {
      try {
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        detector = null;
      }
    }

    let lastScanTs = 0;
    const SCAN_INTERVAL_MS = 120; // throttle for performance

    async function tick(ts) {
      if (!cameraStream) return;
      if (ts && ts - lastScanTs < SCAN_INTERVAL_MS) {
        requestAnimationFrame(tick);
        return;
      }
      lastScanTs = ts || performance.now();

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Downscale for faster CPU processing on fallback
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const targetW = 640;
        const scale = Math.min(1, targetW / vw);
        const dw = Math.max(1, Math.floor(vw * scale));
        const dh = Math.max(1, Math.floor(vh * scale));
        canvasElement.width = dw;
        canvasElement.height = dh;
        canvas.drawImage(video, 0, 0, dw, dh);

        try {
          let qrText = null;
          if (detector) {
            const barcodes = await detector.detect(canvasElement);
            if (barcodes && barcodes.length)
              qrText = barcodes[0].rawValue || barcodes[0].rawValue;
          }
          if (!qrText) {
            const imageData = canvas.getImageData(0, 0, dw, dh);
            const result = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              { inversionAttempts: "dontInvert" }
            );
            if (result) qrText = result.data;
          }

          if (qrText) {
            stopCamera();
            if (qrText.startsWith("SMARTAPP_ATTENDANCE::")) {
              const parts = qrText.split("::");
              const courseId = parts[1];
              const course = state.courses.find((c) => c.id === courseId);
              if (course) {
                try {
                  await api("/student/attendance/credit", {
                    method: "POST",
                    body: JSON.stringify({ courseId }),
                  });
                } catch (e) {
                  const attendanceRecord = state.attendance.find(
                    (a) => a.subject === course.title
                  );
                  if (attendanceRecord) {
                    attendanceRecord.attended += 1;
                    attendanceRecord.total += 1;
                    save("studentAttendance", state.attendance);
                  }
                }
                successMessageEl.innerHTML = `You have been successfully marked present for <strong>${course.title} (${course.code})</strong>.`;
                byId("scan-timestamp").textContent = new Date().toLocaleString(
                  "en-IN"
                );
                scannerUI.style.display = "none";
                successUI.style.display = "block";
                toast("Attendance marked successfully!");
                if ($("#pageTitle").textContent === "Attendance") {
                  renderAttendance();
                }
                if (navigator.vibrate) navigator.vibrate(200);
              } else {
                statusEl.textContent =
                  "Error: You are not enrolled in this course.";
                toast("Error: Course not found in your schedule.", "danger");
                setTimeout(() => closeModal("#scannerModal"), 2000);
              }
            } else {
              statusEl.textContent =
                "Invalid QR Code. Please scan the one for SmartApp.";
              toast("This is not a valid attendance QR code.", "danger");
              setTimeout(() => closeModal("#scannerModal"), 2000);
            }
            return;
          }
        } catch (err) {
          console.error("Scan error", err);
        }
      }
      if (cameraStream) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // --- NAVIGATION & EVENTS ---
  const navMap = {
    dashboard: renderDashboard,
    profile: renderProfile,
    courses: renderCourses,
    analytics: renderAnalytics,
    attendance: renderAttendance,
    achievements: renderAchievements,
    settings: renderSettings,
  };
  function activateNav(name) {
    localStorage.setItem("studentLastTab", name);
    $$(".nav-item").forEach((b) =>
      b.classList.toggle("active", b.dataset.nav === name)
    );
    navMap[name]();
  }

  function toggleTheme() {
    state.theme = state.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem("theme", state.theme);
  }
  function toggleSidebar() {
    $(".sidebar").classList.toggle("open");
  }

  $("#mainNav").addEventListener("click", (e) => {
    const b = e.target.closest(".nav-item");
    if (!b) return;
    activateNav(b.dataset.nav);
  });
  $("#themeToggle").onclick = toggleTheme;
  $("#notifyBtn").onclick = () => toast("No new notifications");

  document.addEventListener("click", (e) => {
    // Handle close buttons and overlay clicks
    if (e.target.dataset.close || e.target.closest('[data-close="true"]')) {
      const openModal = e.target.closest(".modal.open");
      if (openModal) {
        if (openModal.id === "scannerModal") {
          stopCamera();
        }
        openModal.classList.remove("open");
      }
    }
    
    // Handle modal overlay clicks (clicking outside the modal)
    if (e.target.classList.contains('modal-overlay')) {
      const modal = e.target.closest('.modal');
      if (modal && modal.classList.contains('open')) {
        if (modal.id === "scannerModal") {
          stopCamera();
        }
        modal.classList.remove("open");
      }
    }
  });
  $("#scanQRBtn").onclick = openQRScanner;
  // Test QR simulation (marks attendance for first course)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("#testQRBtn");
    if (!btn) return;
    const course = state.courses[0];
    if (!course) {
      toast("No course found", "danger");
      return;
    }
    try {
      await api("/student/attendance/credit", {
        method: "POST",
        body: JSON.stringify({ courseId: course.id }),
      });
    } catch (e) {
      const attendanceRecord = state.attendance.find(
        (a) => a.subject === course.title
      );
      if (attendanceRecord) {
        attendanceRecord.attended += 1;
        attendanceRecord.total += 1;
        save("studentAttendance", state.attendance);
      }
    }
    byId("scanner-ui").style.display = "none";
    byId("scanner-success").style.display = "block";
    byId("scan-timestamp").textContent = new Date().toLocaleString("en-IN");
    toast("Attendance marked (test)");
    if ($("#pageTitle").textContent === "Attendance") {
      renderAttendance();
    }
  });

  $("#editForm").onsubmit = async (ev) => {
    ev.preventDefault();
    const updated = {
      ...state.profile,
      name: $("#f_name").value,
      email: $("#f_email").value,
      phone: $("#f_phone").value,
      dob: $("#f_dob").value,
      address: $("#f_address").value,
      major: $("#f_major").value,
      year: $("#f_year").value,
      enrollmentDate: $("#f_enrollmentDate").value,
      careerGoal: $("#f_careerGoal").value,
      interests: $("#f_interests").value,
    };
    try {
      await api("/student/profile", {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch {}
    state.profile = updated;
    save("studentProfile", state.profile);
    closeModal("#editModal");
    renderProfile();
    toast("Profile updated");
  };
  $("#sidebarToggle").onclick = toggleSidebar;

  // --- INIT ---
  async function hydrateFromAPI() {
    try {
      const [profile, courses, attendance] = await Promise.all([
        api("/student/profile"),
        api("/student/courses"),
        api("/student/attendance"),
      ]);
      state.profile = profile;
      state.courses = courses;
      state.attendance = attendance;
      save("studentProfile", state.profile);
      save("studentCourses", state.courses);
      save("studentAttendance", state.attendance);
    } catch (e) {
      console.warn("API failed, using local fallback:", e.message);
    }
  }

  (async () => {
    await hydrateFromAPI();
    renderSidebar();
    const last = localStorage.getItem("studentLastTab") || "dashboard";
    activateNav(last);
  })();
})();
