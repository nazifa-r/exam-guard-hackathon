// ==========================================================================
// ExamGuard Frontend Controller — AUST CSE Carnival Hackathon Edition
// ==========================================================================

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const engineStatusEl = document.getElementById("engineStatus");
  const engineTextEl = document.getElementById("engineText");
  const losInput = document.getElementById("los");
  const questionsInput = document.getElementById("questions");
  const courseNameInput = document.getElementById("course_name");
  const examTitleInput = document.getElementById("exam_title");
  const loCountPill = document.getElementById("loCount");
  const questionCountPill = document.getElementById("questionCount");

  const analyzeBtn = document.getElementById("analyzeBtn");
  const statusNotice = document.getElementById("statusNotice");
  const forceDemoToggle = document.getElementById("forceDemoToggle");

  const emptyState = document.getElementById("emptyState");
  const resultsDashboard = document.getElementById("resultsDashboard");

  // Presets
  const presetFlawedBtn = document.getElementById("presetFlawed");
  const presetBalancedBtn = document.getElementById("presetBalanced");
  const presetDatabaseBtn = document.getElementById("presetDatabase");

  // Ingestion Mode Switching
  const modePasteBtn = document.getElementById("modePasteBtn");
  const modeUploadBtn = document.getElementById("modeUploadBtn");
  const textModeContainer = document.getElementById("textModeContainer");
  const uploadModeContainer = document.getElementById("uploadModeContainer");
  const dropZone = document.getElementById("dropZone");
  const docFileInput = document.getElementById("docFileInput");
  const browseFileBtn = document.getElementById("browseFileBtn");
  const uploadFeedback = document.getElementById("uploadFeedback");

  // Export Buttons
  const printRubricBtn = document.getElementById("printRubricBtn");
  const exportAuditBtn = document.getElementById("exportAuditBtn");

  // Modal
  const suggestionModal = document.getElementById("suggestionModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalApplyBtn = document.getElementById("modalApplyBtn");

  let currentReportData = null;
  let pendingModalAction = null;

  // ------------------------------------------------------------------------
  // 1. Initial Status Check
  // ------------------------------------------------------------------------
  async function checkEngineStatus() {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      const dot = engineStatusEl.querySelector(".status-dot");
      if (data.gemini_configured) {
        dot.classList.add("active");
        engineTextEl.textContent = data.model || "Google Gemini AI (Live)";
        engineStatusEl.title = "Connected to live Google GenAI API";
      } else {
        dot.classList.remove("active");
        engineTextEl.textContent = "Simulation Demo Mode (Ready)";
        engineStatusEl.title = "GEMINI_API_KEY not yet detected. Using realistic high-fidelity simulation.";
      }
    } catch (e) {
      engineTextEl.textContent = "Offline Mode";
    }
  }
  checkEngineStatus();

  // ------------------------------------------------------------------------
  // 2. Input Counters
  // ------------------------------------------------------------------------
  function updateCounts() {
    const loLines = losInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const qLines = questionsInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    loCountPill.textContent = `${loLines.length} LO${loLines.length === 1 ? "" : "s"}`;
    questionCountPill.textContent = `${qLines.length} Question${qLines.length === 1 ? "" : "s"}`;
  }
  losInput.addEventListener("input", updateCounts);
  questionsInput.addEventListener("input", updateCounts);

  // ------------------------------------------------------------------------
  // 3. Demo Presets
  // ------------------------------------------------------------------------
  const PRESETS = {
    flawed: {
      course: "CSE220 — Data Structures & Algorithms",
      title: "Midterm Examination 2026 (Draft v1)",
      los: [
        "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs",
        "LO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms",
        "LO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems",
        "LO4: Design graph traversal and shortest-path algorithms for network applications"
      ],
      questions: [
        "Define a stack and give two real-world computing use cases.",
        "Given an array, implement binary search and analyze its worst-case time complexity.",
        "Explain how a hash table resolves collisions using open addressing with linear probing."
      ]
    },
    balanced: {
      course: "CSE220 — Data Structures & Algorithms",
      title: "Comprehensive Final Assessment (Accredited)",
      los: [
        "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs",
        "LO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms",
        "LO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems",
        "LO4: Design graph traversal and shortest-path algorithms for network applications"
      ],
      questions: [
        "Compare the memory locality and cache performance tradeoffs of an array-backed contiguous list versus a doubly linked list.",
        "Implement a randomized Quicksort partition function and mathematically prove why average-case time complexity is O(n log n).",
        "Design an in-memory caching system using an LRU eviction policy with strict O(1) lookup and insertion using a hash map and doubly-linked list.",
        "Given a weighted directed network topology, analyze and implement Dijkstra's algorithm to compute shortest paths with a min-heap."
      ]
    },
    database: {
      course: "CSE311 — Database Management Systems",
      title: "Midterm Assessment 2026",
      los: [
        "LO1: Formulate complex relational algebra and declarative SQL queries",
        "LO2: Apply functional dependency theory to normalize relations up to BCNF",
        "LO3: Evaluate transaction concurrency schedules under ACID isolation levels"
      ],
      questions: [
        "Given a relational schema R(A, B, C, D) with functional dependencies {A -> B, B -> C, C -> D}, determine all candidate keys and decompose R into BCNF preserving dependencies.",
        "Write a relational algebra query to retrieve all student names who have enrolled in every required 300-level course.",
        "Analyze a multi-transaction interleaved schedule, construct its precedence graph, and determine whether the schedule is conflict serializable."
      ]
    }
  };

  function loadPreset(key, autoRun = true) {
    const p = PRESETS[key];
    if (!p) return;
    courseNameInput.value = p.course;
    examTitleInput.value = p.title;
    losInput.value = p.los.join("\n");
    questionsInput.value = p.questions.join("\n");
    updateCounts();

    setMode("paste");

    if (autoRun) {
      runAnalysis();
    }
  }

  presetFlawedBtn.addEventListener("click", () => loadPreset("flawed"));
  presetBalancedBtn.addEventListener("click", () => loadPreset("balanced"));
  presetDatabaseBtn.addEventListener("click", () => loadPreset("database"));

  // ------------------------------------------------------------------------
  // 4. Ingestion Mode (Paste vs Upload)
  // ------------------------------------------------------------------------
  function setMode(mode) {
    if (mode === "paste") {
      modePasteBtn.classList.add("active");
      modeUploadBtn.classList.remove("active");
      textModeContainer.classList.remove("hidden");
      uploadModeContainer.classList.add("hidden");
    } else {
      modeUploadBtn.classList.add("active");
      modePasteBtn.classList.remove("active");
      uploadModeContainer.classList.remove("hidden");
      textModeContainer.classList.add("hidden");
    }
  }
  modePasteBtn.addEventListener("click", () => setMode("paste"));
  modeUploadBtn.addEventListener("click", () => setMode("upload"));

  browseFileBtn.addEventListener("click", () => docFileInput.click());
  docFileInput.addEventListener("change", (e) => {
    if (e.target.files.length) handleFileUpload(e.target.files[0]);
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files[0]);
  });

  async function handleFileUpload(file) {
    uploadFeedback.innerHTML = `<span class="badge badge-info">Parsing ${file.name}...</span>`;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse-document", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      const text = data.text;
      if (text.toLowerCase().includes("question") || text.toLowerCase().includes("q1") || text.toLowerCase().includes("marks")) {
        questionsInput.value = text;
        uploadFeedback.innerHTML = `<span class="badge badge-success">Extracted ${data.line_count} lines into Draft Questions</span>`;
      } else {
        losInput.value = text;
        uploadFeedback.innerHTML = `<span class="badge badge-success">Extracted ${data.line_count} lines into Learning Outcomes</span>`;
      }
      updateCounts();
      setMode("paste");
    } catch (err) {
      uploadFeedback.innerHTML = `<span class="badge badge-danger">Error: ${err.message}</span>`;
    }
  }

  // ------------------------------------------------------------------------
  // 5. Core Analysis Pipeline
  // ------------------------------------------------------------------------
  async function runAnalysis() {
    const los = losInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const questions = questionsInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const course_name = courseNameInput.value.trim() || "Course Assessment";
    const force_demo = forceDemoToggle.checked;

    if (los.length === 0 || questions.length === 0) {
      showStatus("Please provide at least one learning outcome and one draft question.", "error");
      return;
    }

    // Dynamic loading UI
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<span class="btn-spinner"></span> <span>Auditing with Gemini AI...</span>`;
    showStatus("✨ Contacting Google Gemini AI: Auditing curriculum alignment, Bloom's cognitive tiers, similarity archives, and rubrics...", "loading");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learning_outcomes: los,
          questions: questions,
          course_name: course_name,
          force_demo: force_demo
        })
      });

      const data = await res.json();
      if (!res.ok && !data.coverage_report) {
        throw new Error(data.error || "Analysis failed");
      }

      currentReportData = data;
      renderDashboard(data, los, questions);

      if (data.warning) {
        showStatus(`⚠️ ${data.warning}`, "loading");
      } else {
        const engineLabel = data.simulated ? "Simulation Engine" : `Live Google Gemini (${data.model_used || 'Active'})`;
        showStatus(`✅ Academic Audit Complete via ${engineLabel}! Quality Score: ${data.health_index.overall_score}/100`, "success");
      }

      // Smoothly scroll to results so the user immediately sees the entire report!
      setTimeout(() => {
        resultsDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);

    } catch (err) {
      showStatus(`Request failed: ${err.message}`, "error");
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span>Analyze Exam Quality</span>
      `;
    }
  }
  analyzeBtn.addEventListener("click", runAnalysis);

  function showStatus(msg, type = "loading") {
    statusNotice.innerHTML = `<span>${msg}</span>`;
    statusNotice.className = `status-notice ${type}`;
    statusNotice.classList.remove("hidden");
  }
  function hideStatus() {
    statusNotice.classList.add("hidden");
  }

  // ------------------------------------------------------------------------
  // 6. Dashboard Rendering
  // ------------------------------------------------------------------------
  function renderDashboard(data, los, questions) {
    emptyState.classList.add("hidden");
    resultsDashboard.classList.remove("hidden");

    const hi = data.health_index;
    const course = data.course_name || courseNameInput.value || "Assessment";

    // Header Stamp & Model Badge
    document.getElementById("resultsCourseStamp").textContent = `${course} — ${examTitleInput.value || 'Exam Audit'}`;

    const modelBadge = document.getElementById("resultsModelBadge");
    if (modelBadge) {
      if (data.simulated) {
        modelBadge.textContent = "⚡ Simulation Engine";
        modelBadge.className = "badge badge-warning";
      } else {
        modelBadge.textContent = `✨ Live AI: ${data.model_used || 'Gemini 3.7 Flash'}`;
        modelBadge.className = "badge badge-success";
      }
    }

    // Executive KPI Cards
    const healthScoreEl = document.getElementById("healthScore");
    const healthRatingEl = document.getElementById("healthRatingBadge");
    const healthBarEl = document.getElementById("healthBar");

    // Animate score counter
    animateNumber(healthScoreEl, 0, hi.overall_score, 600);
    healthRatingEl.textContent = hi.rating;
    healthRatingEl.style.backgroundColor = hi.color;
    healthBarEl.style.width = `${hi.overall_score}%`;
    healthBarEl.style.backgroundColor = hi.color;

    // Coverage KPI
    document.getElementById("coverageScoreRatio").textContent = `${hi.covered_los_count} / ${hi.total_los_count}`;
    const covPct = Math.round((hi.covered_los_count / hi.total_los_count) * 100);
    document.getElementById("coverageScoreSub").textContent = `${covPct}% outcomes covered by exam`;

    // Rigor KPI
    document.getElementById("rigorRatio").textContent = `${hi.higher_order_ratio}%`;
    document.getElementById("rigorSub").textContent = hi.higher_order_ratio >= 40 ? "Healthy cognitive diversity" : "Low higher-order testing";

    // Leak Risk KPI
    const flags = data.similarity_flags || [];
    document.getElementById("leakCount").textContent = flags.length;
    document.getElementById("leakSub").textContent = flags.length === 0 ? "No historical overlap" : `${flags.length} past exam match detected`;

    // Render Sub-Sections
    renderOBECoverage(data.coverage_report, los);
    renderBloomsHierarchy(data.coverage_report.bloom_distribution);
    renderSimilarityFlags(flags);
    // Update bank size inline if the clean-state message was rendered
    const bankInline = document.getElementById("bankSizeInline");
    if (bankInline && data.bank_size !== undefined) bankInline.textContent = data.bank_size;
    renderRubrics(data.rubrics);
    renderQuestionAudit(data.question_analysis, questions);
  }

  function animateNumber(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      element.textContent = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = end;
      }
    };
    window.requestAnimationFrame(step);
  }

  // 6a. OBE Coverage
  function renderOBECoverage(coverage, los) {
    const el = document.getElementById("coverageContent");
    el.innerHTML = "";

    Object.entries(coverage.lo_coverage).forEach(([key, info]) => {
      const card = document.createElement("div");
      const isUncovered = info.count === 0;
      card.className = `lo-item-card ${isUncovered ? "uncovered" : ""}`;

      let questionsBadge = "";
      if (isUncovered) {
        questionsBadge = `<span class="badge badge-danger">0 Questions (GAP)</span>`;
      } else {
        questionsBadge = `<span class="badge badge-success">${info.count} Question${info.count > 1 ? "s" : ""}</span>`;
      }

      card.innerHTML = `
        <div class="lo-card-top">
          <span class="lo-index">${key}</span>
          <span class="lo-text">${info.text}</span>
          ${questionsBadge}
        </div>
        <div class="lo-meta">
          <span>${info.questions.length ? `Addressed in: <strong>${info.questions.join(", ")}</strong>` : `<strong style="color:var(--danger-text)">⚠️ Missing from exam</strong>`}</span>
          ${isUncovered ? `<button type="button" class="btn btn-secondary btn-xs suggest-lo-btn" data-lo="${encodeURIComponent(info.text)}">✨ Suggest Question</button>` : ""}
        </div>
      `;
      el.appendChild(card);
    });

    el.querySelectorAll(".suggest-lo-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const loText = decodeURIComponent(btn.dataset.lo);
        triggerSuggestLO(loText);
      });
    });
  }

  // 6b. Bloom's Taxonomy
  function renderBloomsHierarchy(dist) {
    const el = document.getElementById("bloomContent");
    const diag = document.getElementById("bloomDiagnostic");
    el.innerHTML = "";

    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    const levels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

    levels.forEach(lvl => {
      const count = dist[lvl] || 0;
      const pct = Math.round((count / total) * 100);
      const row = document.createElement("div");
      row.className = "bloom-bar-row";
      row.innerHTML = `
        <div class="bloom-label-col">
          <span>${lvl}</span>
        </div>
        <div class="bloom-track">
          <div class="bloom-fill bloom-${lvl.toLowerCase()}" style="width: ${pct}%"></div>
        </div>
        <div class="bloom-count-col">${count} (${pct}%)</div>
      `;
      el.appendChild(row);
    });

    const lower = (dist["Remember"] || 0) + (dist["Understand"] || 0);
    const higher = (dist["Analyze"] || 0) + (dist["Evaluate"] || 0) + (dist["Create"] || 0);

    if (higher === 0) {
      diag.className = "diagnostic-box warn";
      diag.innerHTML = "⚠️ <strong>Cognitive Alert:</strong> 100% of questions are in lower-order recall (Remember/Understand). Students are not tested on analysis, system design, or evaluation.";
    } else if (higher / total >= 0.4) {
      diag.className = "diagnostic-box good";
      diag.innerHTML = `✅ <strong>Cognitive Rigor Confirmed:</strong> ${Math.round((higher/total)*100)}% of the exam tests higher-order thinking (Analyze/Evaluate/Create), exceeding standard accreditation guidelines.`;
    } else {
      diag.className = "diagnostic-box warn";
      diag.innerHTML = `ℹ️ <strong>Moderate Diversity:</strong> ${Math.round((higher/total)*100)}% higher-order questions. Consider adding an application or scenario-based problem.`;
    }
  }

  // 6c. Similarity & Leaks (Enhanced)
  function renderSimilarityFlags(flags) {
    const el = document.getElementById("similarityContent");
    el.innerHTML = "";

    if (!flags || flags.length === 0) {
      el.innerHTML = `
        <div class="similarity-clean">
          <div class="similarity-clean-icon">🛡️</div>
          <strong>Integrity Verified</strong>
          <p>No high-confidence duplicates detected against past semester question archives. All <span id="bankSizeInline">—</span> archived questions were checked.</p>
        </div>`;
      return;
    }

    // Summary bar
    const highCount = flags.filter(f => (f.similarity||"").toLowerCase() === "high").length;
    const medCount = flags.length - highCount;
    const summaryBar = document.createElement("div");
    summaryBar.className = "similarity-summary-bar";
    summaryBar.innerHTML = `
      <div class="sim-summary-item">
        <span class="sim-summary-count danger">${highCount}</span>
        <span class="sim-summary-label">Exact / Near-Exact Duplicates</span>
      </div>
      <div class="sim-summary-divider"></div>
      <div class="sim-summary-item">
        <span class="sim-summary-count warn">${medCount}</span>
        <span class="sim-summary-label">Conceptual Paraphrases</span>
      </div>
      <div class="sim-summary-divider"></div>
      <div class="sim-summary-item">
        <span class="sim-summary-count neutral">${flags.length}</span>
        <span class="sim-summary-label">Total Flags Raised</span>
      </div>
    `;
    el.appendChild(summaryBar);

    flags.forEach(flag => {
      const card = document.createElement("div");
      const isHigh = (flag.similarity || "").toLowerCase() === "high";
      card.className = `flag-card ${isHigh ? "flag-high" : "flag-medium"}`;

      const overlapLabel = flag.overlap_type || (isHigh ? "Exact Duplicate" : "Conceptual Paraphrase");
      const concept = flag.concept_repeated || "";
      const recommendation = flag.recommendation || "";

      card.innerHTML = `
        <div class="flag-header">
          <div class="flag-header-left">
            <span class="flag-q-badge">${flag.question_index}</span>
            <span class="flag-overlap-type ${isHigh ? 'type-high' : 'type-medium'}">${overlapLabel}</span>
            ${concept ? `<span class="flag-concept-pill">📌 ${concept}</span>` : ""}
          </div>
          <span class="badge ${isHigh ? 'badge-danger' : 'badge-warning'}">${isHigh ? '🚨 HIGH RISK' : '⚠️ MEDIUM RISK'}</span>
        </div>

        <div class="flag-questions-grid">
          <div class="flag-question-block draft-block">
            <div class="flag-block-label">📝 Draft Question</div>
            <div class="flag-question-text">${flag.draft_question || flag.question_index}</div>
          </div>
          <div class="flag-vs-divider">VS</div>
          <div class="flag-question-block archive-block">
            <div class="flag-block-label">🗄️ Matched Archive Question</div>
            <div class="flag-question-text archive-text">${flag.matched_with}</div>
          </div>
        </div>

        ${flag.note ? `
        <div class="flag-note-row">
          <span class="flag-note-icon">ℹ️</span>
          <span class="flag-note-text">${flag.note}</span>
        </div>` : ""}

        ${recommendation ? `
        <div class="flag-recommendation-row">
          <span class="flag-rec-icon">💡</span>
          <div>
            <span class="flag-rec-label">AI Recommendation:</span>
            <span class="flag-rec-text">${recommendation}</span>
          </div>
        </div>` : ""}

        <div class="flag-action-row">
          <button type="button" class="btn btn-primary btn-xs generate-alt-btn"
            data-qidx="${flag.question_index}"
            data-match="${encodeURIComponent(flag.matched_with)}">
            ✨ Generate Leak-Free Variant
          </button>
        </div>
      `;
      el.appendChild(card);
    });

    el.querySelectorAll(".generate-alt-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const qidx = btn.dataset.qidx;
        const match = decodeURIComponent(btn.dataset.match);
        triggerGenerateAlternative(qidx, match);
      });
    });
  }

  // 6d. Standardized Rubrics
  function renderRubrics(rubrics) {
    const el = document.getElementById("rubricsContent");
    el.innerHTML = "";

    if (!rubrics || rubrics.length === 0) {
      el.innerHTML = "<p>No rubrics generated.</p>";
      return;
    }

    rubrics.forEach(r => {
      const card = document.createElement("div");
      card.className = "rubric-card";

      const rows = (r.criteria || []).map(c => `
        <tr>
          <td>${c.description}</td>
          <td style="width:70px;text-align:right;font-weight:700;">${c.points} pts</td>
        </tr>
      `).join("");

      const mistakes = (r.common_mistakes || []).map(m => `<li>${m}</li>`).join("");

      card.innerHTML = `
        <div class="rubric-header">
          <span class="rubric-q-num">Question ${r.question_index}</span>
          <span class="rubric-points-badge">${r.total_points || 10} Total Points</span>
        </div>
        <table class="rubric-table">
          <thead>
            <tr>
              <th>Evaluation Criterion</th>
              <th style="text-align:right;">Allotted</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        ${mistakes ? `
          <div class="rubric-mistakes">
            <strong>Standard Penalty Guidance for TAs:</strong>
            <ul>${mistakes}</ul>
          </div>
        ` : ""}
      `;
      el.appendChild(card);
    });
  }

  // 6e. Detailed Question Audit
  function renderQuestionAudit(analysis, originalQuestions) {
    const el = document.getElementById("questionAuditContent");
    el.innerHTML = "";

    if (!analysis || analysis.length === 0) {
      el.innerHTML = "<p>No question analysis available.</p>";
      return;
    }

    analysis.forEach((qa, idx) => {
      const card = document.createElement("div");
      card.className = "q-audit-card";
      const qText = originalQuestions[idx] || `Question ${qa.question_index}`;

      const bloomBadgeClass = `bloom-${(qa.bloom_level || "remember").toLowerCase()}`;
      const isLowBloom = ["Remember", "Understand"].includes(qa.bloom_level);

      card.innerHTML = `
        <div class="q-audit-top">
          <strong>${qa.question_index}</strong>
          <div>
            <span class="badge ${bloomBadgeClass}" style="color:white;">${qa.bloom_level}</span>
            <span class="badge badge-neutral">${qa.mapped_los.join(", ") || "No LO Fit"}</span>
          </div>
        </div>
        <div class="q-audit-text">${qText}</div>
        <div class="q-audit-meta">
          <span style="font-size:0.75rem;color:var(--text-muted);">${qa.justification || ''}</span>
          ${isLowBloom ? `<button type="button" class="btn btn-secondary btn-xs elevate-q-btn" data-qidx="${qa.question_index}" data-q="${encodeURIComponent(qText)}">⚡ Elevate to Analyze</button>` : ""}
        </div>
      `;
      el.appendChild(card);
    });

    el.querySelectorAll(".elevate-q-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const qText = decodeURIComponent(btn.dataset.q);
        triggerElevateQuestion(qText);
      });
    });
  }

  // ------------------------------------------------------------------------
  // 7. Interactive Faculty Suggestions (Modal Dialogs)
  // ------------------------------------------------------------------------
  async function triggerSuggestLO(loText) {
    modalTitle.textContent = "✨ AI Question Suggestion for Uncovered LO";
    modalBody.innerHTML = `<p>Generating high-alignment question for <strong>${loText}</strong>...</p>`;
    suggestionModal.classList.remove("hidden");

    try {
      const res = await fetch("/api/suggest-lo-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lo_text: loText,
          course_name: courseNameInput.value,
          target_bloom: "Apply"
        })
      });
      const data = await res.json();

      modalBody.innerHTML = `
        <p style="margin-bottom:0.75rem;"><strong>Learning Outcome:</strong> ${loText}</p>
        <div style="background:var(--surface-subtle);padding:0.85rem;border-radius:var(--radius-md);border-left:4px solid var(--primary);margin-bottom:0.75rem;">
          <p style="font-weight:600;font-size:0.95rem;">${data.suggested_question}</p>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);">${data.rationale || ''}</p>
      `;

      pendingModalAction = () => {
        questionsInput.value = questionsInput.value.trim() + "\n" + data.suggested_question;
        updateCounts();
        runAnalysis();
      };
      modalApplyBtn.textContent = "Append to Draft Exam";
    } catch (e) {
      modalBody.innerHTML = `<p style="color:var(--danger-text)">Failed to generate suggestion: ${e.message}</p>`;
    }
  }

  async function triggerElevateQuestion(qText) {
    modalTitle.textContent = "⚡ Elevate Question Cognitive Level";
    modalBody.innerHTML = `<p>Elevating question from rote recall to Analyze tier...</p>`;
    suggestionModal.classList.remove("hidden");

    try {
      const res = await fetch("/api/elevate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qText, target_bloom: "Analyze" })
      });
      const data = await res.json();

      modalBody.innerHTML = `
        <p style="margin-bottom:0.4rem;font-size:0.8rem;color:var(--text-muted);"><strong>Original Question:</strong></p>
        <p style="margin-bottom:0.8rem;opacity:0.8;">${qText}</p>
        <p style="margin-bottom:0.4rem;font-size:0.8rem;color:var(--primary);font-weight:700;"><strong>Elevated (Analyze Tier) Question:</strong></p>
        <div style="background:var(--surface-subtle);padding:0.85rem;border-radius:var(--radius-md);border-left:4px solid var(--accent-violet);margin-bottom:0.75rem;">
          <p style="font-weight:600;font-size:0.95rem;">${data.elevated_question}</p>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);">${data.improvement_note || ''}</p>
      `;

      pendingModalAction = () => {
        questionsInput.value = questionsInput.value.replace(qText, data.elevated_question);
        updateCounts();
        runAnalysis();
      };
      modalApplyBtn.textContent = "Replace in Exam";
    } catch (e) {
      modalBody.innerHTML = `<p style="color:var(--danger-text)">Failed to elevate question: ${e.message}</p>`;
    }
  }

  async function triggerGenerateAlternative(qidx, matchText) {
    const qLines = questionsInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const qNum = parseInt(qidx.replace(/\D/g, ""), 10) - 1;
    const qText = qLines[qNum] || qidx;

    modalTitle.textContent = "✨ Generate Leak-Free Question Variant";
    modalBody.innerHTML = `<p>Synthesizing alternative problem context to avoid historical leak...</p>`;
    suggestionModal.classList.remove("hidden");

    try {
      const res = await fetch("/api/generate-alternative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qText, matched_with: matchText })
      });
      const data = await res.json();

      modalBody.innerHTML = `
        <p style="margin-bottom:0.4rem;font-size:0.8rem;color:var(--danger-text);"><strong>Flagged Historical Match:</strong></p>
        <p style="margin-bottom:0.8rem;font-size:0.85rem;">${matchText}</p>
        <p style="margin-bottom:0.4rem;font-size:0.8rem;color:var(--success-text);font-weight:700;"><strong>Fresh Variant Question:</strong></p>
        <div style="background:var(--surface-subtle);padding:0.85rem;border-radius:var(--radius-md);border-left:4px solid var(--success);margin-bottom:0.75rem;">
          <p style="font-weight:600;font-size:0.95rem;">${data.alternative_question}</p>
        </div>
        <p style="font-size:0.8rem;color:var(--text-muted);">${data.explanation || ''}</p>
      `;

      pendingModalAction = () => {
        questionsInput.value = questionsInput.value.replace(qText, data.alternative_question);
        updateCounts();
        runAnalysis();
      };
      modalApplyBtn.textContent = "Replace in Exam";
    } catch (e) {
      modalBody.innerHTML = `<p style="color:var(--danger-text)">Failed to generate alternative: ${e.message}</p>`;
    }
  }

  modalCloseBtn.addEventListener("click", () => suggestionModal.classList.add("hidden"));
  modalCancelBtn.addEventListener("click", () => suggestionModal.classList.add("hidden"));
  modalApplyBtn.addEventListener("click", () => {
    if (pendingModalAction) pendingModalAction();
    suggestionModal.classList.add("hidden");
  });

  // ------------------------------------------------------------------------
  // 8. Exports & Print
  // ------------------------------------------------------------------------
  printRubricBtn.addEventListener("click", () => {
    window.print();
  });

  exportAuditBtn.addEventListener("click", () => {
    if (!currentReportData) return;
    const blob = new Blob([JSON.stringify(currentReportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ExamGuard_Audit_${(currentReportData.course_name || 'Exam').replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Archive This Exam button
  const archiveExamBtn = document.getElementById("archiveExamBtn");
  archiveExamBtn.addEventListener("click", async () => {
    const questions = questionsInput.value.split("\n").map(s => s.trim()).filter(Boolean);
    const course = courseNameInput.value.trim() || "Academic Course";
    if (!questions.length) {
      showToast("No questions to archive. Please enter exam questions first.", true);
      return;
    }

    archiveExamBtn.disabled = true;
    archiveExamBtn.innerHTML = `<span class="btn-spinner"></span> Archiving...`;
    try {
      const res = await fetch("/api/archive-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_name: course, year: new Date().getFullYear(), questions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Archive failed");
      showToast(`✅ ${data.added} question${data.added !== 1 ? 's' : ''} archived! Bank now has ${data.total_bank_size} questions.`);
      loadBankPanel(); // refresh bank display
    } catch (err) {
      showToast(`Archive failed: ${err.message}`, true);
    } finally {
      archiveExamBtn.disabled = false;
      archiveExamBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="m10 12 2 2 4-4"/></svg>
        Archive This Exam`;
    }
  });

  // ------------------------------------------------------------------------
  // 9. Question Bank Management Panel
  // ------------------------------------------------------------------------
  let bankData = [];
  let bankOpen = false;

  window.toggleBankPanel = function() {
    bankOpen = !bankOpen;
    const body = document.getElementById("bankPanelBody");
    const chevron = document.getElementById("bankChevron");
    if (bankOpen) {
      body.classList.remove("hidden");
      chevron.style.transform = "rotate(180deg)";
      loadBankPanel();
    } else {
      body.classList.add("hidden");
      chevron.style.transform = "rotate(0deg)";
    }
  };

  async function loadBankPanel() {
    try {
      const res = await fetch("/api/question-bank");
      const data = await res.json();
      bankData = data.questions || [];
      const total = data.total || 0;
      document.getElementById("bankCountBadge").textContent = `${total} Questions`;

      // Populate course filter
      const courseFilter = document.getElementById("bankCourseFilter");
      const currentFilter = courseFilter.value;
      courseFilter.innerHTML = `<option value="">All Courses</option>`;
      (data.courses || []).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c; opt.textContent = c;
        courseFilter.appendChild(opt);
      });
      courseFilter.value = currentFilter;

      // Update bankSizeInline in similarity section if it's visible
      const bankInline = document.getElementById("bankSizeInline");
      if (bankInline) bankInline.textContent = total;

      renderBankList();
    } catch(e) {
      document.getElementById("bankCountBadge").textContent = "Error loading";
    }
  }

  function renderBankList() {
    const listEl = document.getElementById("bankQuestionsList");
    const searchVal = (document.getElementById("bankSearchInput")?.value || "").toLowerCase().trim();
    const courseVal = (document.getElementById("bankCourseFilter")?.value || "").toLowerCase().trim();

    const filtered = bankData.filter((item, idx) => {
      const textMatch = !searchVal || (item.text || "").toLowerCase().includes(searchVal);
      const courseMatch = !courseVal || (item.course || "").toLowerCase() === courseVal;
      return textMatch && courseMatch;
    });

    const countEl = document.getElementById("bankFilterCount");
    if (countEl) countEl.textContent = filtered.length !== bankData.length ? `${filtered.length} shown` : "";

    if (!filtered.length) {
      listEl.innerHTML = `<div class="bank-empty">No questions match your search.</div>`;
      return;
    }

    listEl.innerHTML = "";
    filtered.forEach((item) => {
      // Find original index in bankData for deletion
      const origIdx = bankData.indexOf(item);
      const row = document.createElement("div");
      row.className = "bank-q-row";
      row.innerHTML = `
        <div class="bank-q-meta">
          <span class="bank-q-year">${item.year || '?'}</span>
          <span class="bank-q-course">${item.course || 'General'}</span>
        </div>
        <div class="bank-q-text">${item.text}</div>
        <button type="button" class="btn btn-danger-sm bank-delete-btn" data-idx="${origIdx}" title="Remove from bank">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      `;
      listEl.appendChild(row);
    });

    listEl.querySelectorAll(".bank-delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const idx = parseInt(btn.dataset.idx, 10);
        btn.disabled = true;
        try {
          const res = await fetch(`/api/question-bank/${idx}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Delete failed");
          showToast(`Removed 1 question. Bank now has ${data.total} questions.`);
          loadBankPanel();
        } catch(e) {
          showToast(`Delete failed: ${e.message}`, true);
          btn.disabled = false;
        }
      });
    });
  }

  // Bank search & filter
  document.getElementById("bankSearchInput")?.addEventListener("input", renderBankList);
  document.getElementById("bankCourseFilter")?.addEventListener("change", renderBankList);

  // Add question to bank
  document.getElementById("bankAddBtn")?.addEventListener("click", async () => {
    const year = parseInt(document.getElementById("bankAddYear").value, 10) || new Date().getFullYear();
    const course = document.getElementById("bankAddCourse").value.trim();
    const text = document.getElementById("bankAddText").value.trim();
    const feedbackEl = document.getElementById("bankAddFeedback");

    if (!text) {
      feedbackEl.innerHTML = `<span class="badge badge-danger">Please enter a question text.</span>`;
      return;
    }

    const addBtn = document.getElementById("bankAddBtn");
    addBtn.disabled = true;
    try {
      const res = await fetch("/api/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, course: course || "General", text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Add failed");
      feedbackEl.innerHTML = `<span class="badge badge-success">Added! Bank now has ${data.total} questions.</span>`;
      document.getElementById("bankAddText").value = "";
      loadBankPanel();
    } catch(e) {
      feedbackEl.innerHTML = `<span class="badge badge-danger">${e.message}</span>`;
    } finally {
      addBtn.disabled = false;
    }
  });

  // Bank tab switching
  window.switchBankTab = function(tab) {
    const textTab = document.getElementById("bankTabText");
    const docTab  = document.getElementById("bankTabDoc");
    const textBody = document.getElementById("bankTabTextBody");
    const docBody  = document.getElementById("bankTabDocBody");
    const feedbackEl = document.getElementById("bankAddFeedback");
    feedbackEl.innerHTML = "";

    if (tab === "text") {
      textTab.classList.add("active");
      docTab.classList.remove("active");
      textBody.classList.remove("hidden");
      docBody.classList.add("hidden");
    } else {
      docTab.classList.add("active");
      textTab.classList.remove("active");
      docBody.classList.remove("hidden");
      textBody.classList.add("hidden");
    }
  };

  // Document upload tab: dropzone
  let bankDocSelectedFile = null;
  const bankDocDropzone   = document.getElementById("bankDocDropzone");
  const bankDocFileInput  = document.getElementById("bankDocFileInput");
  const bankDocBrowseBtn  = document.getElementById("bankDocBrowseBtn");
  const bankDocUploadBtn  = document.getElementById("bankDocUploadBtn");
  const bankDocDropzoneInner = document.getElementById("bankDocDropzoneInner");

  function setDocFile(file) {
    bankDocSelectedFile = file;
    bankDocDropzoneInner.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p class="bank-doc-main-text" style="color:var(--primary);font-weight:600;">${file.name}</p>
      <p class="bank-doc-sub-text">${(file.size / 1024).toFixed(1)} KB — ready to extract</p>
    `;
    bankDocUploadBtn.disabled = false;
  }

  bankDocBrowseBtn?.addEventListener("click", () => bankDocFileInput?.click());
  bankDocFileInput?.addEventListener("change", (e) => {
    if (e.target.files.length) setDocFile(e.target.files[0]);
  });
  bankDocDropzone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    bankDocDropzone.classList.add("bank-doc-drag-over");
  });
  bankDocDropzone?.addEventListener("dragleave", () => {
    bankDocDropzone.classList.remove("bank-doc-drag-over");
  });
  bankDocDropzone?.addEventListener("drop", (e) => {
    e.preventDefault();
    bankDocDropzone.classList.remove("bank-doc-drag-over");
    if (e.dataTransfer.files.length) setDocFile(e.dataTransfer.files[0]);
  });

  // Upload & extract handler
  bankDocUploadBtn?.addEventListener("click", async () => {
    if (!bankDocSelectedFile) return;
    const year   = document.getElementById("bankDocYear")?.value   || "2024";
    const course = document.getElementById("bankDocCourse")?.value || "Academic Course";
    const feedbackEl = document.getElementById("bankAddFeedback");

    bankDocUploadBtn.disabled = true;
    bankDocUploadBtn.innerHTML = `<span class="btn-spinner"></span> Extracting questions...`;
    feedbackEl.innerHTML = "";

    const formData = new FormData();
    formData.append("file", bankDocSelectedFile);
    formData.append("year", year);
    formData.append("course", course);

    try {
      const res = await fetch("/api/question-bank/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      feedbackEl.innerHTML = `
        <div class="bank-upload-result">
          <span class="badge badge-success">✅ ${data.added} question${data.added !== 1 ? 's' : ''} added</span>
          ${data.skipped ? `<span class="badge badge-warning">${data.skipped} duplicates skipped</span>` : ""}
          <span class="badge badge-neutral">${data.total} total in bank</span>
        </div>`;

      // Reset dropzone
      bankDocSelectedFile = null;
      bankDocDropzoneInner.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p class="bank-doc-main-text">Drag &amp; drop exam paper here, or <button type="button" class="bank-doc-browse-btn" id="bankDocBrowseBtn">browse</button></p>
        <p class="bank-doc-sub-text">Supports PDF, DOCX, TXT, Markdown — questions extracted automatically</p>
      `;
      // Re-attach browse button after innerHTML reset
      document.getElementById("bankDocBrowseBtn")?.addEventListener("click", () => bankDocFileInput?.click());
      bankDocFileInput.value = "";

      loadBankPanel();
    } catch (err) {
      feedbackEl.innerHTML = `<span class="badge badge-danger">Error: ${err.message}</span>`;
    } finally {
      bankDocUploadBtn.disabled = false;
      bankDocUploadBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Extract &amp; Add Questions to Bank`;
    }
  });

  // Load bank count on page init
  loadBankPanel();

  // ------------------------------------------------------------------------
  // 10. Toast Notification
  // ------------------------------------------------------------------------
  function showToast(msg, isError = false) {
    const toast = document.getElementById("archiveToast");
    const toastMsg = document.getElementById("archiveToastMsg");
    toast.className = `archive-toast ${isError ? "toast-error" : ""}`;
    toastMsg.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 4000);
  }

  // ========================================================================
  // 11. PRIMARY MODULE TAB NAVIGATION
  // ========================================================================
  const tabBtnAudit = document.getElementById("tabBtnAudit");
  const tabBtnDeadline = document.getElementById("tabBtnDeadline");
  const tabBtnHandover = document.getElementById("tabBtnHandover");

  const sectionAudit = document.getElementById("sectionAuditModule");
  const sectionDeadline = document.getElementById("sectionDeadlineModule");
  const sectionHandover = document.getElementById("sectionHandoverModule");

  function switchMainTab(target) {
    [tabBtnAudit, tabBtnDeadline, tabBtnHandover].forEach(b => b?.classList.remove("active"));
    [sectionAudit, sectionDeadline, sectionHandover].forEach(s => s?.classList.add("hidden"));

    if (target === "audit") {
      tabBtnAudit?.classList.add("active");
      sectionAudit?.classList.remove("hidden");
    } else if (target === "deadline") {
      tabBtnDeadline?.classList.add("active");
      sectionDeadline?.classList.remove("hidden");
    } else if (target === "handover") {
      tabBtnHandover?.classList.add("active");
      sectionHandover?.classList.remove("hidden");
    }
  }

  tabBtnAudit?.addEventListener("click", () => switchMainTab("audit"));
  tabBtnDeadline?.addEventListener("click", () => switchMainTab("deadline"));
  tabBtnHandover?.addEventListener("click", () => switchMainTab("handover"));

  // ========================================================================
  // 12. MODULE 2: DEADLINE COLLISION CHECKER LOGIC
  // ========================================================================
  let configuredDeadlines = [];

  const dlCourse = document.getElementById("dlCourse");
  const dlType = document.getElementById("dlType");
  const dlWeight = document.getElementById("dlWeight");
  const dlDate = document.getElementById("dlDate");
  const dlNotes = document.getElementById("dlNotes");
  const addDeadlineRowBtn = document.getElementById("addDeadlineRowBtn");
  const deadlineTableBody = document.getElementById("deadlineTableBody");
  const deadlineCountBadge = document.getElementById("deadlineCountBadge");

  const presetDeadlineCollision = document.getElementById("presetDeadlineCollision");
  const presetDeadlineBalanced = document.getElementById("presetDeadlineBalanced");
  const clearDeadlinesBtn = document.getElementById("clearDeadlinesBtn");

  const runCollisionCheckBtn = document.getElementById("runCollisionCheckBtn");
  const deadlineStatusNotice = document.getElementById("deadlineStatusNotice");
  const deadlineEmptyState = document.getElementById("deadlineEmptyState");
  const deadlineResultsDashboard = document.getElementById("deadlineResultsDashboard");

  // Helper to format ISO date safely without timezone distortion
  function getSemesterDate(offsetDays) {
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 1 : (8 - currentDay);
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday + offsetDays);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, "0");
    const d = String(target.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Set default date picker to upcoming Monday
  if (dlDate) dlDate.value = getSemesterDate(7);

  const DEADLINE_PRESETS = {
    collision: [
      { id: "dl-1", course: "CSE220 Data Structures", type: "Midterm Exam", weight: "Major", date: getSemesterDate(49), notes: "30% course weight, 2.5hr duration" },
      { id: "dl-2", course: "CSE311 Database Systems", type: "Midterm Exam", weight: "Major", date: getSemesterDate(51), notes: "25% weight, ERD & Normalization" },
      { id: "dl-3", course: "CSE317 Software Engineering", type: "Midterm Exam", weight: "Major", date: getSemesterDate(56), notes: "Design Patterns & UML Exam" },
      { id: "dl-4", course: "CSE212 Digital Logic", type: "Term Project Due", weight: "Major", date: getSemesterDate(58), notes: "FPGA Hardware Simulation report" },
      { id: "dl-5", course: "CSE305 Microprocessors", type: "Quiz / Lab Test", weight: "Minor", date: getSemesterDate(59), notes: "Assembly tracing quiz" },
      { id: "dl-6", course: "CSE220 Data Structures", type: "Major Assignment", weight: "Major", date: getSemesterDate(91), notes: "B-Tree & Graph library release" },
      { id: "dl-7", course: "CSE311 Database Systems", type: "Final Exam", weight: "Major", date: getSemesterDate(93), notes: "Comprehensive Final" },
      { id: "dl-8", course: "CSE317 Software Engineering", type: "Term Project Due", weight: "Major", date: getSemesterDate(94), notes: "Final deployment sprint" }
    ],
    balanced: [
      { id: "dl-b1", course: "CSE220 Data Structures", type: "Quiz / Lab Test", weight: "Minor", date: getSemesterDate(21), notes: "Linked List quiz" },
      { id: "dl-b2", course: "CSE311 Database Systems", type: "Major Assignment", weight: "Minor", date: getSemesterDate(35), notes: "SQL queries" },
      { id: "dl-b3", course: "CSE220 Data Structures", type: "Midterm Exam", weight: "Major", date: getSemesterDate(49), notes: "Midterm 1" },
      { id: "dl-b4", course: "CSE317 Software Engineering", type: "Midterm Exam", weight: "Major", date: getSemesterDate(63), notes: "Midterm staggered" },
      { id: "dl-b5", course: "CSE212 Digital Logic", type: "Term Project Due", weight: "Major", date: getSemesterDate(77), notes: "FPGA submission" },
      { id: "dl-b6", course: "CSE311 Database Systems", type: "Final Exam", weight: "Major", date: getSemesterDate(98), notes: "Finals week" }
    ]
  };

  function renderDeadlinesTable() {
    if (!deadlineTableBody) return;
    if (configuredDeadlines.length === 0) {
      deadlineTableBody.innerHTML = `<tr class="empty-row"><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No deadlines added yet. Click a demo preset above or add a row.</td></tr>`;
      if (deadlineCountBadge) deadlineCountBadge.textContent = "0 Items";
      return;
    }

    if (deadlineCountBadge) deadlineCountBadge.textContent = `${configuredDeadlines.length} Item${configuredDeadlines.length !== 1 ? 's' : ''}`;
    deadlineTableBody.innerHTML = configuredDeadlines.map((it, idx) => `
      <tr>
        <td><span style="font-family:var(--font-mono); font-weight:600;">${it.date}</span></td>
        <td><strong>${escapeHtml(it.course)}</strong></td>
        <td><span class="badge ${it.type.includes('Exam') ? 'badge-danger' : it.type.includes('Project') ? 'badge-info' : 'badge-neutral'}">${escapeHtml(it.type)}</span></td>
        <td><span class="badge ${it.weight.toLowerCase() === 'major' ? 'badge-danger' : 'badge-neutral'}">${it.weight}</span></td>
        <td><button type="button" class="btn-row-del" data-index="${idx}" onclick="window.removeDeadlineRow && window.removeDeadlineRow(${idx})" title="Remove item">&times;</button></td>
      </tr>
    `).join("");
  }

  window.removeDeadlineRow = function(index) {
    if (typeof index === 'number' && index >= 0 && index < configuredDeadlines.length) {
      configuredDeadlines.splice(index, 1);
      renderDeadlinesTable();
      showToast("Assessment removed.");
    }
  };

  deadlineTableBody?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-row-del");
    if (btn) {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      if (!isNaN(idx)) {
        window.removeDeadlineRow(idx);
      }
    }
  });

  addDeadlineRowBtn?.addEventListener("click", () => {
    const course = dlCourse?.value?.trim();
    const type = dlType?.value || "Assignment";
    const weight = dlWeight?.value || "Major";
    const date = dlDate?.value;
    const notes = dlNotes?.value?.trim() || "";

    if (!course) {
      alert("Please enter a course code / title (e.g. CSE220 Data Structures).");
      dlCourse?.focus();
      return;
    }
    if (!date) {
      alert("Please select a valid due date.");
      dlDate?.focus();
      return;
    }

    configuredDeadlines.push({
      id: `dl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      course,
      type,
      weight,
      date,
      notes
    });

    dlCourse.value = "";
    dlNotes.value = "";
    // Keep date picker set to current value for easy multi-entry
    renderDeadlinesTable();
    showToast(`Added deadline for ${course}`);
  });

  // Allow pressing Enter in input fields to add deadline
  [dlCourse, dlDate, dlNotes].forEach(input => {
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addDeadlineRowBtn?.click();
      }
    });
  });

  presetDeadlineCollision?.addEventListener("click", () => {
    configuredDeadlines = JSON.parse(JSON.stringify(DEADLINE_PRESETS.collision));
    renderDeadlinesTable();
    showToast("Loaded 🚨 Midterm Fatigue Shock scenario! Running audit...");
    runCollisionCheckBtn?.click();
  });

  presetDeadlineBalanced?.addEventListener("click", () => {
    configuredDeadlines = JSON.parse(JSON.stringify(DEADLINE_PRESETS.balanced));
    renderDeadlinesTable();
    showToast("Loaded 🟢 Balanced Schedule scenario! Running audit...");
    runCollisionCheckBtn?.click();
  });

  clearDeadlinesBtn?.addEventListener("click", () => {
    configuredDeadlines = [];
    renderDeadlinesTable();
    deadlineEmptyState?.classList.remove("hidden");
    deadlineResultsDashboard?.classList.add("hidden");
    showToast("All deadlines cleared.");
  });

  // Initial render of empty table
  renderDeadlinesTable();

  // Execute Collision Audit
  runCollisionCheckBtn?.addEventListener("click", async () => {
    if (configuredDeadlines.length === 0) {
      alert("Please add at least one assessment deadline or load a preset first.");
      return;
    }

    runCollisionCheckBtn.disabled = true;
    runCollisionCheckBtn.innerHTML = `<span class="btn-spinner"></span> Auditing Semester Timetable...`;
    deadlineStatusNotice.className = "status-notice loading";
    deadlineStatusNotice.textContent = "Analyzing cross-course overlap and synthesizing AI coordination advice...";
    deadlineStatusNotice.classList.remove("hidden");

    try {
      const res = await fetch("/api/check-deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadlines: configuredDeadlines })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      renderDeadlineResults(data);
      deadlineStatusNotice.className = "status-notice success";
      deadlineStatusNotice.textContent = `Audit Complete: Detected ${data.collision_count} critical collision week(s).`;
      setTimeout(() => deadlineStatusNotice.classList.add("hidden"), 3500);
    } catch (err) {
      deadlineStatusNotice.className = "status-notice error";
      deadlineStatusNotice.textContent = `Error: ${err.message}`;
    } finally {
      runCollisionCheckBtn.disabled = false;
      runCollisionCheckBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>🚀 Audit Semester Deadline Collisions</span>`;
    }
  });

  function renderDeadlineResults(data) {
    deadlineEmptyState?.classList.add("hidden");
    deadlineResultsDashboard?.classList.remove("hidden");

    // KPI values
    document.getElementById("valTotalDeadlines").textContent = data.total_deadlines;
    document.getElementById("valCollisionWeeks").textContent = data.collision_count;
    document.getElementById("valPeakWeek").textContent = data.highest_risk_week;

    const valFatigueRisk = document.getElementById("valFatigueRisk");
    const valFatigueSub = document.getElementById("valFatigueSub");
    if (data.collision_count >= 2) {
      valFatigueRisk.textContent = "High (Severe Fatigue)";
      valFatigueRisk.className = "kpi-value text-danger";
      valFatigueSub.textContent = "High student burnout probability";
    } else if (data.collision_count === 1) {
      valFatigueRisk.textContent = "Moderate Friction";
      valFatigueRisk.className = "kpi-value text-warning";
      valFatigueSub.textContent = "1 bottleneck requires shifting";
    } else {
      valFatigueRisk.textContent = "Optimal (Balanced)";
      valFatigueRisk.className = "kpi-value text-success";
      valFatigueSub.textContent = "Adequate recovery spacing";
    }

    // AI Overview
    document.getElementById("deadlineAiOverviewText").textContent = data.ai_overview;

    // Render 16-Week Heatmap
    const calGrid = document.getElementById("calendarTimelineGrid");
    if (calGrid && data.weeks) {
      const maxScore = Math.max(...data.weeks.map(w => w.total_score), 8.0);
      calGrid.innerHTML = data.weeks.map(w => {
        const barPct = Math.min(100, Math.round((w.total_score / maxScore) * 100));
        return `
          <div class="timeline-week-col timeline-severity-${w.severity}">
            <div class="timeline-week-header">
              <span class="timeline-week-title">${w.label}</span>
              <span class="timeline-badge-pill">${w.deadlines.length} Item${w.deadlines.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="timeline-week-dates">${w.date_range}</div>
            <div class="timeline-bar-wrapper">
              <div class="timeline-bar" style="width: ${barPct}%;"></div>
            </div>
            <div class="timeline-items-summary">
              ${w.deadlines.slice(0, 3).map(d => `
                <div class="timeline-item-micro ${d.weight.toLowerCase() === 'major' ? 'major' : ''}" title="${escapeHtml(d.course)} - ${escapeHtml(d.type)}">
                  ${escapeHtml(d.course.split(' ')[0])}: ${escapeHtml(d.type)}
                </div>
              `).join("")}
              ${w.deadlines.length > 3 ? `<span style="font-size:0.68rem; color:var(--text-light);">+${w.deadlines.length - 3} more</span>` : ''}
            </div>
          </div>
        `;
      }).join("");
    }

    // Render Collision Hotspots List
    const hotspotsList = document.getElementById("collisionHotspotsList");
    const collisionCardsSection = document.getElementById("collisionCardsSection");
    const collisionWeeks = (data.weeks || []).filter(w => w.is_collision);

    if (hotspotsList) {
      if (collisionWeeks.length === 0) {
        hotspotsList.innerHTML = `
          <div class="diagnostic-box good" style="margin: 0;">
            <div class="diagnostic-header">
              <div class="diagnostic-title">
                <span class="diagnostic-icon">✅</span>
                <span>No Critical Deadline Collisions Detected</span>
              </div>
              <span class="badge badge-success">Schedule Balanced</span>
            </div>
            <p class="diagnostic-desc">All submitted exams, projects, and assignments maintain healthy temporal distribution with adequate recovery spacing for students.</p>
          </div>
        `;
      } else {
        hotspotsList.innerHTML = collisionWeeks.map(w => `
          <div class="collision-hotspot-card">
            <div class="hotspot-header">
              <span class="hotspot-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ${w.label} (${w.date_range}) — ${w.major_count} Major Deliverables Overload
              </span>
              <span class="badge badge-danger">Score: ${w.total_score} pts</span>
            </div>
            <div class="hotspot-courses-grid">
              ${w.deadlines.map(d => `
                <div class="hotspot-course-card">
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="hotspot-course-name">${escapeHtml(d.course)}</span>
                    <span class="badge ${d.weight.toLowerCase() === 'major' ? 'badge-danger' : 'badge-neutral'}">${d.weight}</span>
                  </div>
                  <div class="hotspot-course-meta"><strong>${escapeHtml(d.type)}</strong> &bull; Due ${d.date}</div>
                  ${d.notes ? `<div style="font-size:0.72rem; color:var(--text-light);">${escapeHtml(d.notes)}</div>` : ''}
                </div>
              `).join("")}
            </div>
            <div class="hotspot-recom-box">
              <strong>💡 AI Rescheduling Strategy for Department Faculty:</strong>
              <div>${escapeHtml(w.recommendation || `Stagger non-exam deadlines to adjacent lighter weeks to relieve concurrent cognitive pressure.`)}</div>
            </div>
          </div>
        `).join("");
      }
    }
  }


  // ========================================================================
  // 13. MODULE 3: COURSE HANDOVER NOTES GENERATOR LOGIC
  // ========================================================================
  const hoCourseCode = document.getElementById("hoCourseCode");
  const hoTerm = document.getElementById("hoTerm");
  const hoOutcomes = document.getElementById("hoOutcomes");
  const hoTopics = document.getElementById("hoTopics");
  const hoPastQuestions = document.getElementById("hoPastQuestions");
  const hoAvgGrade = document.getElementById("hoAvgGrade");
  const hoMinGrade = document.getElementById("hoMinGrade");
  const hoMaxGrade = document.getElementById("hoMaxGrade");
  const hoPassRate = document.getElementById("hoPassRate");
  const hoInstructorNotes = document.getElementById("hoInstructorNotes");
  const hoImportCurrentExamBtn = document.getElementById("hoImportCurrentExamBtn");

  const presetHandoverCSE220 = document.getElementById("presetHandoverCSE220");
  const presetHandoverCSE311 = document.getElementById("presetHandoverCSE311");
  const clearHandoverBtn = document.getElementById("clearHandoverBtn");

  const generateHandoverBtn = document.getElementById("generateHandoverBtn");
  const handoverStatusNotice = document.getElementById("handoverStatusNotice");
  const handoverEmptyState = document.getElementById("handoverEmptyState");
  const handoverDocumentWrapper = document.getElementById("handoverDocumentWrapper");
  const handoverActionButtons = document.getElementById("handoverActionButtons");

  const copyHandoverBtn = document.getElementById("copyHandoverBtn");
  const exportHandoverBtn = document.getElementById("exportHandoverBtn");
  const printHandoverBtn = document.getElementById("printHandoverBtn");

  let latestHandoverData = null;

  const HANDOVER_PRESETS = {
    cse220: {
      course: "CSE220: Data Structures & Algorithms",
      term: "Spring 2027",
      outcomes: "LO1: Understand foundational data structures, pointers, and memory layout tradeoffs\nLO2: Implement and evaluate asymptotic complexity of sorting and searching algorithms\nLO3: Apply balanced search trees, priority queues, and hashing to solve real-world problems\nLO4: Design graph traversal and shortest-path algorithms for network applications",
      topics: "Module 1: Pointer arithmetic, dynamic memory, struct alignment\nModule 2: Linked Lists (singly, doubly, circular, sentinel nodes)\nModule 3: Stacks & Queues (array & linked implementations, expression evaluation)\nModule 4: Recursion & Backtracking (tree traversal, N-Queens)\nModule 5: Trees (BST, AVL balancing rotations, Heaps & Priority Queues)\nModule 6: Graphs (BFS/DFS, Dijkstra, Prim/Kruskal MST)\nModule 7: Hashing (Chaining, Open Addressing, Linear/Quadratic Probing)",
      past_questions: "1. Trace memory allocation and show stack/heap pointers after deleting the second node in a doubly linked list.\n2. Prove the asymptotic runtime of AVL self-balancing after inserting keys [14, 17, 11, 7, 53, 4] using recurrence relations.\n3. Implement Dijkstra's algorithm using a min-heap priority queue and explain time complexity.\n4. Explain why open addressing with linear probing causes primary clustering.",
      grade_avg: "72%",
      grade_min: "38%",
      grade_max: "98%",
      grade_pass: "84%",
      notes: "Students consistently stumble with pointer manipulation and segfaults in linked lists during the first midterm. Make sure to teach box-and-pointer memory tracing explicitly in class. Recursion trees also cause panic — emphasize Master Theorem early. Skip advanced binomial heaps as they never get tested well. TAs grade Big-O proofs too harshly, so ensure you distribute an exact partial credit key for O(N log N) vs O(N^2) brute force."
    },
    cse311: {
      course: "CSE311: Database Management Systems",
      term: "Spring 2027",
      outcomes: "LO1: Design conceptual entity-relationship diagrams and translate to relational schemas\nLO2: Apply relational algebra and normal forms (1NF through BCNF) for dependency preservation\nLO3: Write optimized SQL queries, transactions, and index structures (B+ Trees)\nLO4: Evaluate ACID properties, two-phase locking (2PL), and crash recovery protocols",
      topics: "Module 1: Relational Model & Relational Algebra\nModule 2: ER Diagrams & Schema Mapping\nModule 3: Functional Dependencies & Normalization (3NF/BCNF)\nModule 4: SQL & Query Execution Trees\nModule 5: Storage & B+ Tree Indexing\nModule 6: Transaction Processing & ACID Guarantees\nModule 7: Concurrency Control (2PL, Strict 2PL, Deadlock Detection)",
      past_questions: "1. Given relation R(A,B,C,D,E) with FDs {A->B, BC->D, D->E}, decompose R into BCNF. Is the decomposition dependency-preserving?\n2. Convert SQL query with sub-select into canonical relational algebra tree and apply heuristic push-down optimization.\n3. Draw the B+ tree resulting from deleting key 45 from the given order-4 tree.\n4. Show a schedule that is conflict serializable but not recoverable under basic two-phase locking.",
      grade_avg: "75%",
      grade_min: "44%",
      grade_max: "96%",
      grade_pass: "88%",
      notes: "BCNF decomposition questions cause 60% of exam mark losses — emphasize closure computation algorithms step-by-step. Query optimization trees test very well and students enjoy visual relational algebra. Warning: in project grading, TAs often overlook transaction rollback handling in PHP/Node.js submissions; mandate a standardized testing script."
    }
  };

  function populateHandoverForm(preset) {
    if (hoCourseCode) hoCourseCode.value = preset.course;
    if (hoTerm) hoTerm.value = preset.term;
    if (hoOutcomes) hoOutcomes.value = preset.outcomes;
    if (hoTopics) hoTopics.value = preset.topics;
    if (hoPastQuestions) hoPastQuestions.value = preset.past_questions;
    if (hoAvgGrade) hoAvgGrade.value = preset.grade_avg;
    if (hoMinGrade) hoMinGrade.value = preset.grade_min;
    if (hoMaxGrade) hoMaxGrade.value = preset.grade_max;
    if (hoPassRate) hoPassRate.value = preset.grade_pass;
    if (hoInstructorNotes) hoInstructorNotes.value = preset.notes;
  }

  presetHandoverCSE220?.addEventListener("click", () => {
    populateHandoverForm(HANDOVER_PRESETS.cse220);
    showToast("Loaded 🌟 CSE220 Data Structures handover preset!");
    generateHandoverBtn?.click();
  });

  presetHandoverCSE311?.addEventListener("click", () => {
    populateHandoverForm(HANDOVER_PRESETS.cse311);
    showToast("Loaded ⚡ CSE311 Database Systems handover preset!");
    generateHandoverBtn?.click();
  });

  clearHandoverBtn?.addEventListener("click", () => {
    if (hoCourseCode) hoCourseCode.value = "";
    if (hoTerm) hoTerm.value = "";
    if (hoOutcomes) hoOutcomes.value = "";
    if (hoTopics) hoTopics.value = "";
    if (hoPastQuestions) hoPastQuestions.value = "";
    if (hoAvgGrade) hoAvgGrade.value = "";
    if (hoMinGrade) hoMinGrade.value = "";
    if (hoMaxGrade) hoMaxGrade.value = "";
    if (hoPassRate) hoPassRate.value = "";
    if (hoInstructorNotes) hoInstructorNotes.value = "";
    handoverEmptyState?.classList.remove("hidden");
    handoverDocumentWrapper?.classList.add("hidden");
    if (handoverActionButtons) handoverActionButtons.style.display = "none";
    showToast("Cleared handover form.");
  });

  // Pull questions currently in Exam tab
  hoImportCurrentExamBtn?.addEventListener("click", () => {
    const examQuestions = questionsInput?.value?.trim();
    if (examQuestions) {
      hoPastQuestions.value = examQuestions;
      showToast("Imported questions from Exam Quality Audit tab!");
    } else {
      showToast("No questions found in the Exam Quality tab to import.", true);
    }
  });

  // Generate Handover Brief Action
  generateHandoverBtn?.addEventListener("click", async () => {
    const course = hoCourseCode?.value?.trim() || "Academic Course";
    const term = hoTerm?.value?.trim() || "Upcoming Semester";
    const outcomes = hoOutcomes?.value?.trim();
    const topics = hoTopics?.value?.trim();
    const past_questions = hoPastQuestions?.value?.trim();
    const instructor_notes = hoInstructorNotes?.value?.trim();

    if (!course) {
      alert("Please enter a course code and title.");
      hoCourseCode?.focus();
      return;
    }

    generateHandoverBtn.disabled = true;
    generateHandoverBtn.innerHTML = `<span class="btn-spinner"></span> Synthesizing Handover Brief...`;
    handoverStatusNotice.className = "status-notice loading";
    handoverStatusNotice.textContent = "Analyzing historical syllabus, exam cognitive patterns, and faculty notes...";
    handoverStatusNotice.classList.remove("hidden");

    const payload = {
      course_name: course,
      course_code: course.split(":")[0].trim(),
      term: term,
      outcomes: outcomes,
      syllabus_topics: topics,
      past_questions: past_questions,
      grade_summary: {
        avg: hoAvgGrade?.value || "72%",
        min: hoMinGrade?.value || "38%",
        max: hoMaxGrade?.value || "98%",
        pass_rate: hoPassRate?.value || "84%"
      },
      instructor_notes: instructor_notes
    };

    try {
      const res = await fetch("/api/generate-handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      latestHandoverData = data;
      renderHandoverBrief(data);

      handoverStatusNotice.className = "status-notice success";
      handoverStatusNotice.textContent = "1-Page Faculty Handover Brief Generated Successfully!";
      setTimeout(() => handoverStatusNotice.classList.add("hidden"), 3500);
    } catch (err) {
      handoverStatusNotice.className = "status-notice error";
      handoverStatusNotice.textContent = `Error: ${err.message}`;
    } finally {
      generateHandoverBtn.disabled = false;
      generateHandoverBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
        <span>✨ Synthesize 1-Page Handover Brief</span>`;
    }
  });

  function renderHandoverBrief(data) {
    handoverEmptyState?.classList.add("hidden");
    handoverDocumentWrapper?.classList.remove("hidden");
    if (handoverActionButtons) handoverActionButtons.style.display = "flex";

    // Header & Meta
    document.getElementById("briefDocCourseTitle").textContent = data.course_name;
    document.getElementById("briefDocTerm").textContent = hoTerm?.value || "Spring 2027";
    document.getElementById("briefDocDate").textContent = data.generated_at || new Date().toLocaleDateString();
    document.getElementById("briefDocEngineTag").textContent = data.engine || "AI Synthesized";

    // Quick Stats
    const stats = data.quick_stats || {};
    document.getElementById("hmRigor").textContent = stats.estimated_rigor || "High (Core Gateway)";
    document.getElementById("hmTheoryCoding").textContent = stats.math_vs_coding_ratio || "35% Math / 65% Code";
    document.getElementById("hmQuizPace").textContent = stats.recommended_quiz_frequency || "Bi-Weekly";

    // Section 1: Overview & Curriculum Role
    document.getElementById("briefOverviewText").textContent = data.course_overview;
    document.getElementById("briefCurriculumRole").innerHTML = `<strong>Role in Curriculum:</strong> ${escapeHtml(data.curriculum_role || "Essential departmental prerequisite.")}`;

    // Section 2: Tricky Topics
    const trickyGrid = document.getElementById("briefTrickyTopicsGrid");
    const trickyList = data.tricky_topics || data.historically_tricky_topics || [];
    if (trickyGrid) {
      if (trickyList.length === 0) {
        trickyGrid.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">No historical stumbling blocks identified.</p>`;
      } else {
        trickyGrid.innerHTML = trickyList.map(t => {
          const topicName = typeof t === 'string' ? t : (t.topic || t.name || "Core Concept");
          const diff = typeof t === 'object' ? (t.difficulty_level || t.difficulty || "High") : "High";
          const pitfall = typeof t === 'object' ? (t.pitfall || t.description || "Common student misconception.") : "Frequent conceptual confusion during exam problems.";
          const evidence = typeof t === 'object' ? (t.evidence || t.historical_evidence || "Documented in past exam patterns.") : "Documented in past exam records.";
          const isVeryHigh = String(diff).toLowerCase().includes("very");
          return `
            <div class="tricky-topic-card ${isVeryHigh ? 'very-high' : ''}">
              <div class="tricky-topic-header">
                <span class="tricky-topic-name">⚠️ ${escapeHtml(topicName)}</span>
                <span class="badge ${isVeryHigh ? 'badge-danger' : 'badge-warning'}">${escapeHtml(diff)} Difficulty</span>
              </div>
              <p class="tricky-pitfall-text"><strong>Common Student Pitfall:</strong> ${escapeHtml(pitfall)}</p>
              <div class="tricky-evidence-box"><strong>Historical Evidence:</strong> ${escapeHtml(evidence)}</div>
            </div>
          `;
        }).join("");
      }
    }

    // Section 3: Exam Style
    const examStyle = data.exam_style_notes || data.exam_style || {};
    if (typeof examStyle === 'string') {
      document.getElementById("briefBloomsDist").textContent = "35% Apply, 40% Analyze, 25% Remember/Understand";
      document.getElementById("briefTypicalFormat").textContent = examStyle;
      document.getElementById("briefQuestionTypes").textContent = "Analytical derivations, code tracing, and design problems.";
      document.getElementById("briefGradingPitfall").textContent = "Standardize TA grading rubrics with exact partial credit breakdowns.";
    } else {
      document.getElementById("briefBloomsDist").textContent = examStyle.blooms_distribution || examStyle.blooms || "15% Remember/Understand, 40% Apply, 35% Analyze, 10% Create";
      document.getElementById("briefTypicalFormat").textContent = examStyle.typical_format || examStyle.format || "20% Tracing / MCQs, 50% Algorithm Design, 30% Implementation";
      document.getElementById("briefQuestionTypes").textContent = examStyle.common_question_types || examStyle.question_types || "Memory diagrams, asymptotic proofs, edge-case implementation.";
      document.getElementById("briefGradingPitfall").textContent = examStyle.grading_pitfalls || examStyle.grading_notes || "Standardize partial credit for brute force vs optimal algorithms.";
    }

    // Section 4: Focus Areas
    const focusList = document.getElementById("briefFocusList");
    const focusItems = data.suggested_focus || data.suggested_focus_areas || data.focus_areas || [];
    if (focusList) {
      if (focusItems.length === 0) {
        focusList.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem 0;">No specific focus areas provided.</p>`;
      } else {
        focusList.innerHTML = focusItems.map(f => {
          const fTitle = typeof f === 'string' ? f : (f.title || f.focus_area || "Instructional Focus");
          const fAdvice = typeof f === 'object' ? (f.advice || f.recommendation || f.description || "Focus on early active learning and conceptual grounding.") : (f || "Focus on early active learning.");
          const fTiming = typeof f === 'object' ? (f.timing || "Semester Action") : "Weeks 1–4";
          return `
            <div class="focus-item-card">
              <div class="focus-item-top">
                <span class="focus-item-title">🎯 ${escapeHtml(fTitle)}</span>
                <span class="focus-timing-badge">${escapeHtml(fTiming)}</span>
              </div>
              <p class="focus-item-advice">${escapeHtml(fAdvice)}</p>
            </div>
          `;
        }).join("");
      }
    }
  }

  // Export Handover as Markdown
  exportHandoverBtn?.addEventListener("click", () => {
    if (!latestHandoverData) return;
    const md = generateHandoverMarkdown(latestHandoverData);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(latestHandoverData.course_code || 'course').toLowerCase()}_handover_brief.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded handover brief as Markdown file!");
  });

  // Copy Handover Text
  copyHandoverBtn?.addEventListener("click", () => {
    if (!latestHandoverData) return;
    const md = generateHandoverMarkdown(latestHandoverData);
    navigator.clipboard.writeText(md).then(() => {
      showToast("Handover brief copied to clipboard!");
    }).catch(() => {
      showToast("Failed to copy to clipboard.", true);
    });
  });

  // Print Handover
  printHandoverBtn?.addEventListener("click", () => {
    window.print();
  });

  function generateHandoverMarkdown(d) {
    const stats = d.quick_stats || {};
    const exam = d.exam_style_notes || {};
    return `# Faculty Handover Brief: ${d.course_name}
**Generated Date:** ${d.generated_at || 'September 2026'} | **Engine:** ${d.engine || 'ExamGuard AI'}

---

## 1. Course Overview & Curriculum Role
${d.course_overview}

**Role in Curriculum:**
${d.curriculum_role || 'Core departmental course.'}

- **Estimated Rigor:** ${stats.estimated_rigor || 'High'}
- **Theory vs Coding Ratio:** ${stats.math_vs_coding_ratio || '35% Theory / 65% Coding'}
- **Recommended Quiz Cadence:** ${stats.recommended_quiz_frequency || 'Bi-Weekly'}

---

## 2. Historically Tricky Topics & Student Pitfalls
${(d.tricky_topics || []).map(t => `### ⚠️ ${t.topic} (${t.difficulty_level || 'High'} Difficulty)\n- **Student Pitfall:** ${t.pitfall}\n- **Historical Evidence:** ${t.evidence}`).join("\n\n")}

---

## 3. Exam Style & Cognitive Culture
- **Bloom's Cognitive Distribution:** ${exam.blooms_distribution || 'N/A'}
- **Typical Exam Format:** ${exam.typical_format || 'N/A'}
- **Common Question Archetypes:** ${exam.common_question_types || 'N/A'}
- **TA Grading Consistency Warning:** ${exam.grading_pitfalls || 'N/A'}

---

## 4. Suggested Focus Areas for Incoming Faculty
${(d.suggested_focus || []).map(f => `### 🎯 ${f.title} [${f.timing || 'Semester'}]\n${f.advice}`).join("\n\n")}

---
*Generated by ExamGuard — AUST CSE Carnival AI Build Hackathon*
`;
  }

  // Auto-populate default count
  updateCounts();
});


