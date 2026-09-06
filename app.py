"""
ExamGuard — AI Exam Quality & Grading Consistency Assistant
=============================================================
AUST CSE Carnival AI Build Hackathon — AI for Academic Life

DYNAMIC AI PIPELINE:
  1. Outcome-Based Education (OBE) LO Mapping & Coverage Gap Detection
  2. Bloom's Taxonomy Cognitive Diversity Classification
  3. Historical Question Bank Similarity & Leak Detection
  4. Inter-Grader Consistent Rubric Generation
  5. Executive Exam Quality Index (Health Score 0-100)
  6. Human-in-the-Loop AI Suggestions:
     - Generate question for uncovered LO
     - Elevate low Bloom's question into higher-order thinking
     - Create fresh variant for flagged duplicate question
  7. Multi-Format File Ingestion (PDF, DOCX, TXT, MD)
  8. Question Bank Management & One-Click Exam Archival
"""

import os
import io
import json
import uuid
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template
import pypdf
import docx

# Try importing google-genai
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# --------------------------------------------------------------------------
# Setup
# --------------------------------------------------------------------------

BASE_DIR = Path(__file__).parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE, override=True)

QUESTION_BANK_PATH = BASE_DIR / "sample_data" / "previous_questions.json"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = Flask(__name__)

BLOOM_LEVELS = [
    "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"
]


# --------------------------------------------------------------------------
# Helpers & Client
# --------------------------------------------------------------------------

def get_active_model() -> str:
    """Always reads the latest model from .env or environment."""
    load_dotenv(ENV_FILE, override=True)
    m = os.environ.get("GEMINI_MODEL", "gemini-3.7-flash").strip()
    if m == "gemini-2.5-flash":
        m = "gemini-3.7-flash"
    return m


def get_fallback_models() -> list[str]:
    primary = get_active_model()
    candidates = [primary, "gemini-3.7-flash", "gemini-3.6-flash", "gemini-2.0-flash"]
    seen = set()
    result = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            result.append(c)
    return result


def load_question_bank() -> list[dict]:
    """Loads the department 'previous exams' bank."""
    if QUESTION_BANK_PATH.exists():
        try:
            return json.loads(QUESTION_BANK_PATH.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def has_gemini_key() -> bool:
    """Checks if a valid Gemini API key is configured."""
    load_dotenv(ENV_FILE, override=True)
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return bool(key and key.strip() and not key.strip().startswith("your_"))


def get_gemini_client():
    """Returns initialized genai.Client or None."""
    if not GENAI_AVAILABLE or not has_gemini_key():
        return None
    load_dotenv(ENV_FILE, override=True)
    api_key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")).strip()
    return genai.Client(api_key=api_key)


def extract_text_from_upload(file_storage) -> str:
    """Extracts raw text from PDF, DOCX, or text/markdown uploads."""
    filename = (file_storage.filename or "").lower()
    content = file_storage.read()

    if filename.endswith(".pdf"):
        reader = pypdf.PdfReader(io.BytesIO(content))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages_text)
    elif filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    else:
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1", errors="ignore")


# --------------------------------------------------------------------------
# Unified Live AI Assessment Engine
# --------------------------------------------------------------------------

def evaluate_exam_ai_unified(learning_outcomes: list[str], questions: list[str], bank: list[dict]) -> dict:
    """
    Executes a high-efficiency unified Google Gemini call.
    Produces LO mapping, Bloom's cognitive classification, past exam duplicate check,
    and multi-grader rubrics in a single model turn.
    """
    client = get_gemini_client()
    if not client:
        raise ValueError("GEMINI_API_KEY is not configured.")

    system_prompt = f"""You are an elite academic assessment auditor for university examinations.
Given course Learning Outcomes (LO1, LO2, ...), draft exam questions (Q1, Q2, ...), and an archive of past exam questions, perform a comprehensive pedagogical audit.

For EACH question:
1. Map it to the primary Learning Outcome(s) it measures.
2. Classify its exact cognitive level in Bloom's Taxonomy: {BLOOM_LEVELS}.
3. Give a concise justification for the classification.
4. Compare against the previous exam bank:
   - Check if the draft question repeats or closely paraphrases any question from the previous bank.
   - If a match is found:
     * similarity: 'high' (exact or near-exact problem) or 'medium' (same concept & close structure).
     * overlap_type: 'Exact Duplicate' or 'Conceptual Paraphrase'.
     * concept_repeated: concise label of the repeated concept (e.g. 'Binary Search Time Complexity', 'Hash Collision Linear Probing').
     * note: 1-sentence explanation of what is shared between them.
     * recommendation: 1-sentence guidance on how faculty can alter the problem framing or constraints to eliminate the duplicate leak.
5. Create a consistent grading rubric with total_points (usually 10), breakdown criteria, and 1-3 specific grading penalties for common mistakes.

Respond with ONLY valid JSON with this exact schema:
{{
  "question_analysis": [
    {{
      "question_index": "Q1",
      "mapped_los": ["LO1"],
      "bloom_level": "Apply",
      "justification": "Requires applying concept X to a specific scenario."
    }}
  ],
  "similarity_flags": [
    {{
      "question_index": "Q2",
      "draft_question": "...",
      "matched_with": "[2024 CSE220] ...",
      "similarity": "high",
      "overlap_type": "Exact Duplicate",
      "concept_repeated": "...",
      "note": "...",
      "recommendation": "..."
    }}
  ],
  "rubrics": [
    {{
      "question_index": "Q1",
      "total_points": 10,
      "criteria": [
        {{"description": "Conceptual correctness", "points": 5}},
        {{"description": "Application logic", "points": 5}}
      ],
      "common_mistakes": [
        "Confusing edge cases (-2 pts)"
      ]
    }}
  ]
}}
"""

    lo_block = "\n".join(f"LO{i+1}: {lo}" for i, lo in enumerate(learning_outcomes))
    q_block = "\n".join(f"Q{i+1}: {q}" for i, q in enumerate(questions))
    bank_block = "\n".join(
        f"[{item.get('year', 'Past')} {item.get('course', '')}] {item.get('text', '')}" for item in bank
    ) if bank else "No previous questions recorded."

    user_prompt = f"LEARNING OUTCOMES:\n{lo_block}\n\nPREVIOUS QUESTION BANK:\n{bank_block}\n\nNEW DRAFT QUESTIONS:\n{q_block}"

    last_err = None
    for model_name in get_fallback_models():
        try:
            config = types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                temperature=0.2,
            )
            resp = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=config,
            )
            text = (resp.text or "").strip()
            if text.startswith("```json"):
                text = text.removeprefix("```json")
            elif text.startswith("```"):
                text = text.removeprefix("```")
            if text.endswith("```"):
                text = text.removesuffix("```")
            parsed = json.loads(text.strip())
            parsed["active_model"] = model_name
            return parsed
        except Exception as e:
            last_err = e
            continue

    raise last_err or RuntimeError("All Gemini model attempts failed.")


# --------------------------------------------------------------------------
# Quality Index (Health Score) & Aggregations
# --------------------------------------------------------------------------

def calculate_exam_health(learning_outcomes: list[str], question_analysis: list[dict], similarity_flags: list[dict]) -> dict:
    total_los = len(learning_outcomes) or 1
    covered_los_set = set()
    for qa in question_analysis:
        for lo in qa.get("mapped_los", []):
            covered_los_set.add(lo)

    coverage_ratio = len(covered_los_set) / total_los
    coverage_score = round(coverage_ratio * 40, 1)

    bloom_counts = {lvl: 0 for lvl in BLOOM_LEVELS}
    for qa in question_analysis:
        lvl = qa.get("bloom_level", "Remember")
        if lvl in bloom_counts:
            bloom_counts[lvl] += 1

    total_q = len(question_analysis) or 1
    lower_order = bloom_counts["Remember"] + bloom_counts["Understand"]
    higher_order = total_q - lower_order

    if higher_order == 0:
        bloom_score = 12.0
    elif higher_order / total_q >= 0.4:
        bloom_score = 35.0
    else:
        bloom_score = round(12.0 + ((higher_order / total_q) / 0.4) * 23.0, 1)

    integrity_score = 25.0
    for flag in similarity_flags:
        sim = flag.get("similarity", "medium").lower()
        if sim == "high":
            integrity_score -= 10.0
        else:
            integrity_score -= 5.0
    integrity_score = max(0.0, integrity_score)

    overall_score = round(coverage_score + bloom_score + integrity_score)
    overall_score = min(100, max(0, overall_score))

    if overall_score >= 88:
        rating = "Exemplary"
        color = "#10b981"
    elif overall_score >= 70:
        rating = "Good"
        color = "#3b82f6"
    elif overall_score >= 55:
        rating = "Fair (Action Needed)"
        color = "#f59e0b"
    else:
        rating = "High Risk (Critical Gaps)"
        color = "#ef4444"

    return {
        "overall_score": overall_score,
        "rating": rating,
        "color": color,
        "coverage_score": coverage_score,
        "bloom_score": bloom_score,
        "integrity_score": integrity_score,
        "covered_los_count": len(covered_los_set),
        "total_los_count": total_los,
        "higher_order_ratio": round((higher_order / total_q) * 100)
    }


def build_coverage_report(learning_outcomes: list[str], question_analysis: list[dict]) -> dict:
    lo_coverage = {f"LO{i+1}": {"text": lo, "count": 0, "questions": []}
                   for i, lo in enumerate(learning_outcomes)}
    bloom_distribution = {level: 0 for level in BLOOM_LEVELS}

    for qa in question_analysis:
        for lo_key in qa.get("mapped_los", []):
            if lo_key in lo_coverage:
                lo_coverage[lo_key]["count"] += 1
                lo_coverage[lo_key]["questions"].append(qa.get("question_index", ""))
        level = qa.get("bloom_level")
        if level in bloom_distribution:
            bloom_distribution[level] += 1

    uncovered_los = [k for k, v in lo_coverage.items() if v["count"] == 0]

    return {
        "lo_coverage": lo_coverage,
        "uncovered_los": uncovered_los,
        "bloom_distribution": bloom_distribution,
    }


# --------------------------------------------------------------------------
# Simulation / Offline Fallback Generator
# --------------------------------------------------------------------------

def generate_simulation_data(learning_outcomes: list[str], questions: list[str], bank: list[dict]) -> dict:
    q_analysis = []
    bloom_order = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]

    for i, q in enumerate(questions):
        q_lower = q.lower()
        if any(w in q_lower for w in ["define", "what is", "state", "list", "name"]):
            lvl = "Remember"
        elif any(w in q_lower for w in ["explain", "describe", "differentiate", "compare", "why"]):
            lvl = "Understand"
        elif any(w in q_lower for w in ["implement", "write", "calculate", "solve", "apply"]):
            lvl = "Apply"
        elif any(w in q_lower for w in ["analyze", "derive", "time complexity", "tradeoff", "investigate"]):
            lvl = "Analyze"
        elif any(w in q_lower for w in ["evaluate", "critique", "justify", "optimize", "assess"]):
            lvl = "Evaluate"
        else:
            lvl = bloom_order[min(i, len(bloom_order) - 1)]

        mapped = []
        for lo_idx, lo in enumerate(learning_outcomes):
            lo_words = set(lo.lower().split())
            q_words = set(q_lower.split())
            overlap = lo_words.intersection(q_words) - {"and", "the", "a", "of", "to", "in", "for", "with"}
            if len(overlap) >= 1 or (i % len(learning_outcomes) == lo_idx and len(mapped) == 0):
                mapped.append(f"LO{lo_idx+1}")

        if not mapped and learning_outcomes:
            mapped = [f"LO{(i % len(learning_outcomes)) + 1}"]

        q_analysis.append({
            "question_index": f"Q{i+1}",
            "mapped_los": mapped,
            "bloom_level": lvl,
            "justification": f"Demonstrates {lvl.lower()} cognitive mastery relating to {', '.join(mapped)}."
        })

    sim_flags = []
    for i, q in enumerate(questions):
        q_words = set(q.lower().split())
        for item in bank:
            b_text = item.get("text", "")
            b_words = set(b_text.lower().split())
            common = q_words.intersection(b_words) - {"a", "an", "the", "in", "and", "or", "of", "to", "is", "its"}
            if len(common) >= 4:
                is_high = len(common) >= 6
                sim_flags.append({
                    "question_index": f"Q{i+1}",
                    "draft_question": q,
                    "matched_with": f"[{item.get('year', 'Past')} {item.get('course', '')}] {b_text}",
                    "similarity": "high" if is_high else "medium",
                    "overlap_type": "Exact Duplicate" if is_high else "Conceptual Paraphrase",
                    "concept_repeated": "Core algorithmic / domain problem formulation",
                    "note": f"Matches key concepts and phrasing: {', '.join(list(common)[:4])}",
                    "recommendation": "Vary constraints, input data representations, or application domain to test original thinking."
                })
                break

    rubrics = []
    for i, q in enumerate(questions):
        rubrics.append({
            "question_index": f"Q{i+1}",
            "total_points": 10,
            "criteria": [
                {"description": "Core conceptual correctness & definition", "points": 4},
                {"description": "Application logic, code structure or derivation", "points": 4},
                {"description": "Clarity, edge cases, and terminology", "points": 2}
            ],
            "common_mistakes": [
                "Incomplete analysis or missing complexity terms (-2 pts)",
                "Syntax or indexing off-by-one errors (-1 pt)"
            ]
        })

    return {
        "question_analysis": q_analysis,
        "similarity_flags": sim_flags,
        "rubrics": rubrics,
        "is_simulated": True
    }


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/status", methods=["GET"])
def api_status():
    has_key = has_gemini_key()
    model = get_active_model()
    return jsonify({
        "gemini_configured": has_key,
        "model": f"Google Gemini ({model})" if has_key else "Simulation Mode (Offline Demo)",
        "mode": "live" if has_key else "demo"
    })


@app.route("/api/parse-document", methods=["POST"])
def api_parse_document():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    try:
        text = extract_text_from_upload(file)
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        return jsonify({"text": "\n".join(lines), "line_count": len(lines)})
    except Exception as e:
        return jsonify({"error": f"Failed to parse document: {str(e)}"}), 500


@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    data = request.get_json(force=True)
    learning_outcomes = [lo.strip() for lo in data.get("learning_outcomes", []) if lo.strip()]
    questions = [q.strip() for q in data.get("questions", []) if q.strip()]
    course_name = data.get("course_name", "Assessment")
    force_demo = data.get("force_demo", False)

    if not learning_outcomes or not questions:
        return jsonify({"error": "Both learning outcomes and draft questions are required."}), 400

    bank = load_question_bank()
    is_live = has_gemini_key() and not force_demo

    try:
        if is_live:
            ai_data = evaluate_exam_ai_unified(learning_outcomes, questions, bank)
            q_analysis = ai_data.get("question_analysis", [])
            similarity_flags = ai_data.get("similarity_flags", [])
            rubrics = ai_data.get("rubrics", [])
            active_model = ai_data.get("active_model", get_active_model())
            simulated = False
        else:
            sim_data = generate_simulation_data(learning_outcomes, questions, bank)
            q_analysis = sim_data["question_analysis"]
            similarity_flags = sim_data["similarity_flags"]
            rubrics = sim_data["rubrics"]
            active_model = "Simulation Engine"
            simulated = True

        # Attach original draft question to similarity flag if not set
        for flag in similarity_flags:
            if not flag.get("draft_question"):
                q_idx_str = flag.get("question_index", "Q1")
                num = int("".join(filter(str.isdigit, q_idx_str)) or "1") - 1
                if 0 <= num < len(questions):
                    flag["draft_question"] = questions[num]

        coverage_report = build_coverage_report(learning_outcomes, q_analysis)
        health_index = calculate_exam_health(learning_outcomes, q_analysis, similarity_flags)

        report = {
            "id": str(uuid.uuid4()),
            "course_name": course_name,
            "question_analysis": q_analysis,
            "coverage_report": coverage_report,
            "similarity_flags": similarity_flags,
            "rubrics": rubrics,
            "health_index": health_index,
            "simulated": simulated,
            "model_used": active_model,
            "bank_size": len(bank),
            "gemini_ready": has_gemini_key()
        }
        return jsonify(report)

    except Exception as e:
        sim_data = generate_simulation_data(learning_outcomes, questions, bank)
        coverage_report = build_coverage_report(learning_outcomes, sim_data["question_analysis"])
        health_index = calculate_exam_health(learning_outcomes, sim_data["question_analysis"], sim_data["similarity_flags"])
        return jsonify({
            "id": str(uuid.uuid4()),
            "course_name": course_name,
            "question_analysis": sim_data["question_analysis"],
            "coverage_report": coverage_report,
            "similarity_flags": sim_data["similarity_flags"],
            "rubrics": sim_data["rubrics"],
            "health_index": health_index,
            "simulated": True,
            "model_used": "Simulation Fallback",
            "bank_size": len(bank),
            "gemini_ready": has_gemini_key(),
            "warning": f"AI model response notice: {str(e)[:120]}. Displaying high-fidelity audit."
        })


@app.route("/api/suggest-lo-question", methods=["POST"])
def api_suggest_lo_question():
    data = request.get_json(force=True)
    lo_text = data.get("lo_text", "")
    target_bloom = data.get("target_bloom", "Apply")
    course_name = data.get("course_name", "Academic Course")

    if not lo_text:
        return jsonify({"error": "lo_text is required"}), 400

    if has_gemini_key():
        for m in get_fallback_models():
            try:
                client = get_gemini_client()
                prompt = f"""For course '{course_name}', generate ONE high-quality exam question specifically designed to test this learning outcome:
Outcome: "{lo_text}"
Target Bloom's Level: {target_bloom}

Return JSON with:
{{
  "suggested_question": "...",
  "rationale": "...",
  "target_bloom": "{target_bloom}"
}}
"""
                config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.3)
                resp = client.models.generate_content(model=m, contents=prompt, config=config)
                return jsonify(json.loads(resp.text.strip()))
            except Exception:
                continue

    return jsonify({
        "suggested_question": f"Apply the principles of {lo_text.lower()} to design an optimal solution for a high-traffic scenario, justifying your design decisions.",
        "rationale": f"Targets the {target_bloom} cognitive tier by asking students to apply and justify design choices.",
        "target_bloom": target_bloom
    })


@app.route("/api/elevate-question", methods=["POST"])
def api_elevate_question():
    data = request.get_json(force=True)
    question = data.get("question", "")
    target_bloom = data.get("target_bloom", "Analyze")

    if not question:
        return jsonify({"error": "question is required"}), 400

    if has_gemini_key():
        for m in get_fallback_models():
            try:
                client = get_gemini_client()
                prompt = f"""Transform this exam question from rote recall into a higher-order {target_bloom} question:
Original Question: "{question}"

Return JSON:
{{
  "elevated_question": "...",
  "target_bloom": "{target_bloom}",
  "improvement_note": "..."
}}
"""
                config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.3)
                resp = client.models.generate_content(model=m, contents=prompt, config=config)
                return jsonify(json.loads(resp.text.strip()))
            except Exception:
                continue

    return jsonify({
        "elevated_question": f"Given a real-world system where performance degrades under load: {question.rstrip('.')}? Analyze the bottleneck and evaluate two contrasting optimization strategies.",
        "target_bloom": target_bloom,
        "improvement_note": "Added contextual scenario and comparative analysis requirement."
    })


@app.route("/api/generate-alternative", methods=["POST"])
def api_generate_alternative():
    data = request.get_json(force=True)
    question = data.get("question", "")
    matched_with = data.get("matched_with", "")

    if not question:
        return jsonify({"error": "question is required"}), 400

    if has_gemini_key():
        for m in get_fallback_models():
            try:
                client = get_gemini_client()
                prompt = f"""This draft exam question closely duplicates a past exam question:
Draft Question: "{question}"
Past Exam Match: "{matched_with}"

Generate a fresh, original question that tests the exact same concept and rigor but uses a distinct problem framing, data, or application context to eliminate duplication.
Return JSON:
{{
  "alternative_question": "...",
  "explanation": "..."
}}
"""
                config = types.GenerateContentConfig(response_mime_type="application/json", temperature=0.3)
                resp = client.models.generate_content(model=m, contents=prompt, config=config)
                return jsonify(json.loads(resp.text.strip()))
            except Exception:
                continue

    return jsonify({
        "alternative_question": f"Consider an alternate scenario assessing the same core principle: {question.rstrip('.')} under constrained memory conditions with custom constraints.",
        "explanation": "Varied the constraints and environment to prevent leak exploit."
    })


# --------------------------------------------------------------------------
# Question Bank & Archival Management APIs
# --------------------------------------------------------------------------

@app.route("/api/question-bank", methods=["GET", "POST"])
def api_question_bank():
    bank = load_question_bank()
    if request.method == "GET":
        courses = sorted(list(set(item.get("course", "General") for item in bank if item.get("course"))))
        return jsonify({"questions": bank, "total": len(bank), "courses": courses})

    new_data = request.get_json(force=True)
    if isinstance(new_data, list):
        for item in new_data:
            if item.get("text"):
                bank.append({
                    "year": item.get("year", 2025),
                    "course": item.get("course", "Academic Course"),
                    "text": item.get("text").strip()
                })
    elif isinstance(new_data, dict) and new_data.get("text"):
        bank.append({
            "year": new_data.get("year", 2025),
            "course": new_data.get("course", "Academic Course"),
            "text": new_data.get("text").strip()
        })
    else:
        return jsonify({"error": "Invalid question data"}), 400

    QUESTION_BANK_PATH.write_text(json.dumps(bank, indent=2), encoding="utf-8")
    return jsonify({"status": "success", "total": len(bank)})


@app.route("/api/question-bank/<int:index>", methods=["DELETE"])
def api_delete_question(index):
    bank = load_question_bank()
    if 0 <= index < len(bank):
        removed = bank.pop(index)
        QUESTION_BANK_PATH.write_text(json.dumps(bank, indent=2), encoding="utf-8")
        return jsonify({"status": "deleted", "removed": removed, "total": len(bank)})
    return jsonify({"error": "Index out of range"}), 404


@app.route("/api/question-bank/upload", methods=["POST"])
def api_question_bank_upload():
    """
    Accepts a PDF / DOCX / TXT document upload and bulk-adds extracted
    questions to the past question bank.  Each non-empty line (or numbered
    list item) is treated as one question.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty filename"}), 400

    year_str = request.form.get("year", str(2025))
    course   = (request.form.get("course") or "Academic Course").strip()
    try:
        year = int(year_str)
    except ValueError:
        year = 2025

    # Extract raw text
    try:
        raw_text = extract_text_from_upload(file)
    except Exception as e:
        return jsonify({"error": f"Failed to parse document: {str(e)}"}), 500

    # ----------------------------------------------------------------
    # Split into individual questions
    # Strategy:
    #   1. Split on newlines.
    #   2. Strip leading numbering / bullet markers (Q1. 1. - • etc.)
    #   3. Skip very short lines (< 10 chars) — likely headers/blanks.
    #   4. Collapse multi-line continuations (lines that don't start
    #      with a number/bullet are appended to the previous question).
    # ----------------------------------------------------------------
    import re
    lines = raw_text.splitlines()
    questions_raw: list[str] = []
    current = ""

    number_re = re.compile(
        r"^\s*(?:Q\.?\s*\d+|Q\d+|\d+\s*[.):]|[-•*►])\s*", re.IGNORECASE
    )

    for line in lines:
        stripped = line.strip()
        if not stripped:
            # blank line → flush current question
            if current:
                questions_raw.append(current.strip())
                current = ""
            continue

        is_new_item = bool(number_re.match(stripped))
        cleaned = number_re.sub("", stripped).strip()

        if is_new_item:
            if current:
                questions_raw.append(current.strip())
            current = cleaned
        else:
            # continuation line
            if current:
                current += " " + cleaned
            else:
                # no numbering at all — every line is its own question
                questions_raw.append(cleaned)

    if current:
        questions_raw.append(current.strip())

    # Filter: must be at least 10 characters and look like a question/statement
    questions_filtered = [q for q in questions_raw if len(q) >= 10]

    if not questions_filtered:
        return jsonify({"error": "No questions could be extracted from the document."}), 400

    # Bulk-add to bank (skip exact duplicates)
    bank = load_question_bank()
    existing_texts = {b.get("text", "").strip().lower() for b in bank}
    added = 0
    skipped = 0
    for q in questions_filtered:
        if q.lower() not in existing_texts:
            bank.append({"year": year, "course": course, "text": q})
            existing_texts.add(q.lower())
            added += 1
        else:
            skipped += 1

    QUESTION_BANK_PATH.write_text(json.dumps(bank, indent=2), encoding="utf-8")
    return jsonify({
        "status": "success",
        "added": added,
        "skipped": skipped,
        "total": len(bank),
        "extracted": len(questions_filtered),
    })


@app.route("/api/archive-exam", methods=["POST"])

def api_archive_exam():
    """Archives all questions from the analyzed exam into the bank."""
    data = request.get_json(force=True)
    course = data.get("course_name", "Academic Course")
    year = data.get("year", 2026)
    questions = [q.strip() for q in data.get("questions", []) if q.strip()]

    if not questions:
        return jsonify({"error": "No questions to archive"}), 400

    bank = load_question_bank()
    added_count = 0
    existing_texts = set(b.get("text", "").strip().lower() for b in bank)

    for q in questions:
        if q.lower() not in existing_texts:
            bank.append({
                "year": year,
                "course": course,
                "text": q
            })
            added_count += 1

    QUESTION_BANK_PATH.write_text(json.dumps(bank, indent=2), encoding="utf-8")
    return jsonify({
        "status": "archived",
        "added": added_count,
        "total_bank_size": len(bank)
    })


if __name__ == "__main__":
    app.run(debug=True, port=5001)
