// ==========================================================================
// ExamGuard Frontend Controller — AUST CSE Carnival Hackathon Edition
// ==========================================================================

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

  // 6c. Similarity & Leaks
  function renderSimilarityFlags(flags) {
    const el = document.getElementById("similarityContent");
    el.innerHTML = "";

    if (!flags || flags.length === 0) {
      el.innerHTML = `<p style="color:var(--success-text);font-size:0.88rem;">✅ <strong>Integrity Verified:</strong> No high-confidence duplicates detected against past semester question archives.</p>`;
      return;
    }

    flags.forEach(flag => {
      const card = document.createElement("div");
      card.className = "flag-card";
      const isHigh = (flag.similarity || "").toLowerCase() === "high";

      card.innerHTML = `
        <div class="flag-header">
          <strong>${flag.question_index}</strong>
          <span class="badge ${isHigh ? 'badge-danger' : 'badge-warning'}">${flag.similarity.toUpperCase()} OVERLAP RISK</span>
        </div>
        <div class="flag-matched-box">
          Matched Archive: ${flag.matched_with}
        </div>
        <div style="font-size:0.8rem;color:var(--text-muted);">${flag.note || ''}</div>
        <div class="flag-action-row">
          <button type="button" class="btn btn-secondary btn-xs generate-alt-btn" data-qidx="${flag.question_index}" data-match="${encodeURIComponent(flag.matched_with)}">✨ Generate Leak-Free Variant</button>
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

  // Auto-populate default count
  updateCounts();
});
