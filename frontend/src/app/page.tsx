"use client";

import { useState, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type DocumentType = "nda" | "service_agreement" | "demand_letter";

interface TemplateItem {
  document_type: DocumentType;
  title: string;
  description: string;
}

interface GenerateResponse {
  document_type: DocumentType;
  title: string;
  content: string;
  disclaimer: string;
}

interface FormErrors {
  document_type?: string;
  party_name?: string;
  details?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    document_type: "nda",
    title: "Non-Disclosure Agreement (NDA)",
    description: "Standard mutual/unilateral confidentiality agreement protecting proprietary information.",
  },
  {
    document_type: "service_agreement",
    title: "Service Agreement",
    description: "General service contract defining services, scope, payment terms, and obligations.",
  },
  {
    document_type: "demand_letter",
    title: "Demand Letter",
    description: "Formal pre-litigation demand letter requesting action or payment within a notice period.",
  },
];

// ── Validation ───────────────────────────────────────────────────────────────

function validateForm(
  documentType: string,
  partyName: string,
  details: string
): FormErrors {
  const errors: FormErrors = {};
  if (!documentType) errors.document_type = "Please select a document type.";
  if (!partyName.trim()) errors.party_name = "Party name is required.";
  if (!details.trim() || details.trim().length < 10)
    errors.details = "Please enter at least 10 characters of details.";
  return errors;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  // Templates list from backend (PL-3 / PL-4 / PL-8 integration)
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);

  // Form state
  const [documentType, setDocumentType] = useState<DocumentType | "">("");
  const [partyName, setPartyName] = useState("");
  const [details, setDetails] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  // API state
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/documents/templates`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TemplateItem[] | null) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_TEMPLATES is maintained
      });
  }, []);


  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    // Frontend validation (PL-9)
    const errors = validateForm(documentType, partyName, details);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: documentType,
          party_name: partyName.trim(),
          details: details.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body?.detail?.[0]?.msg ??
          body?.detail ??
          `Server error (${res.status})`;
        setApiError(typeof msg === "string" ? msg : JSON.stringify(msg));
        return;
      }

      const data: GenerateResponse = await res.json();
      setResult(data);
    } catch {
      setApiError(
        "Could not reach the server. Make sure the backend is running."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    setIsExporting(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/documents/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: documentType,
          party_name: partyName.trim(),
          details: details.trim(),
        }),
      });

      if (!res.ok) {
        setApiError(`Export failed (${res.status}). Please try again.`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType}_draft.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setApiError("Download failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setApiError("");
    setFieldErrors({});
    setDocumentType("");
    setPartyName("");
    setDetails("");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 font-sans">
      {/* ── Legal Disclaimer Banner (PL-7) ── */}
      <div className="bg-amber-900/40 border-b border-amber-700/50 px-4 py-3 text-center">
        <p className="text-amber-200 text-xs leading-5 max-w-3xl mx-auto">
          <strong>⚠ Legal Disclaimer:</strong> This tool generates document
          drafts from fixed templates for general informational purposes only.
          It does <em>not</em> constitute legal advice. Always have documents
          reviewed by a qualified legal professional before use.
        </p>
      </div>

      <div className="flex items-start justify-center p-6 pt-10 min-h-[calc(100vh-3rem)]">
        <div className="max-w-2xl w-full space-y-6">
          {/* ── Header ── */}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300 mb-1">
              Pre-Legal Document Generator
            </h1>
            <p className="text-slate-400 text-sm">
              Select a template, provide details, and download your draft.
            </p>
          </div>

          {/* ── Form Card ── */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
            {/* Global API Error */}
            {apiError && (
              <div
                id="api-error"
                role="alert"
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm flex items-start gap-2"
              >
                <svg
                  className="h-5 w-5 mt-0.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {apiError}
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-5" noValidate>
              {/* Document Type */}
              <div>
                <label
                  htmlFor="document-type"
                  className="block text-sm font-medium text-slate-200 mb-1.5"
                >
                  Document Type <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="document-type"
                    value={documentType}
                    onChange={(e) => {
                      setDocumentType(e.target.value as DocumentType);
                      setFieldErrors((prev) => ({
                        ...prev,
                        document_type: undefined,
                      }));
                    }}
                    className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none ${fieldErrors.document_type ? "border-red-500" : "border-slate-600"}`}
                    aria-describedby={
                      fieldErrors.document_type
                        ? "document-type-error"
                        : undefined
                    }
                  >
                    <option value="" disabled>
                      Select a document type…
                    </option>
                    {templates.map((tmpl) => (
                      <option key={tmpl.document_type} value={tmpl.document_type}>
                        {tmpl.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                {fieldErrors.document_type && (
                  <p
                    id="document-type-error"
                    className="mt-1 text-xs text-red-400"
                  >
                    {fieldErrors.document_type}
                  </p>
                )}
              </div>

              {/* Party Name */}
              <div>
                <label
                  htmlFor="party-name"
                  className="block text-sm font-medium text-slate-200 mb-1.5"
                >
                  Party / Company Name <span className="text-pink-400">*</span>
                </label>
                <input
                  id="party-name"
                  type="text"
                  value={partyName}
                  onChange={(e) => {
                    setPartyName(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      party_name: undefined,
                    }));
                  }}
                  className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${fieldErrors.party_name ? "border-red-500" : "border-slate-600"}`}
                  placeholder="e.g., Acme Corp"
                  aria-describedby={
                    fieldErrors.party_name ? "party-name-error" : undefined
                  }
                />
                {fieldErrors.party_name && (
                  <p
                    id="party-name-error"
                    className="mt-1 text-xs text-red-400"
                  >
                    {fieldErrors.party_name}
                  </p>
                )}
              </div>

              {/* Details */}
              <div>
                <label
                  htmlFor="details"
                  className="block text-sm font-medium text-slate-200 mb-1.5"
                >
                  Key Details / Requirements{" "}
                  <span className="text-pink-400">*</span>
                </label>
                <textarea
                  id="details"
                  value={details}
                  onChange={(e) => {
                    setDetails(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      details: undefined,
                    }));
                  }}
                  rows={5}
                  className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none ${fieldErrors.details ? "border-red-500" : "border-slate-600"}`}
                  placeholder="Provide context, terms, parties involved, or specific clauses required…"
                  aria-describedby={
                    fieldErrors.details ? "details-error" : undefined
                  }
                />
                {fieldErrors.details && (
                  <p id="details-error" className="mt-1 text-xs text-red-400">
                    {fieldErrors.details}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                id="generate-btn"
                type="submit"
                disabled={isGenerating}
                className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Generating…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Generate Draft
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* ── Preview Panel (PL-5) ── */}
          {result && (
            <div
              id="preview-panel"
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 space-y-4"
            >
              {/* Disclaimer inside preview (PL-7) */}
              <div className="p-3 bg-amber-900/30 border border-amber-700/40 rounded-xl">
                <p className="text-amber-200 text-xs leading-5">
                  ⚠ <strong>Legal Disclaimer:</strong> {result.disclaimer}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{result.title}</h2>
                <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
                  Draft
                </span>
              </div>

              {/* Document content */}
              <pre
                id="document-preview"
                className="text-slate-300 text-sm leading-6 whitespace-pre-wrap font-mono bg-slate-900/60 rounded-xl p-5 max-h-[500px] overflow-y-auto border border-slate-700"
              >
                {result.content}
              </pre>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                {/* Download (PL-6) */}
                <button
                  id="download-btn"
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-colors duration-200"
                >
                  {isExporting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Downloading…
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download (.txt)
                    </>
                  )}
                </button>

                {/* Start over */}
                <button
                  id="start-over-btn"
                  onClick={handleReset}
                  className="px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700/50 transition-colors duration-200 text-sm font-medium"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-slate-600 pb-6">
            Pre-Legal Document Generator — for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
