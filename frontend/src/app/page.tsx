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

type FormErrors = Record<string, string>;

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

// ── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);
  const [documentType, setDocumentType] = useState<DocumentType | "">("");

  // Shared / General
  const [date, setDate] = useState("");
  const [governingLaw, setGoverningLaw] = useState("");

  // Demand Letter fields
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [facts, setFacts] = useState("");
  const [demand, setDemand] = useState("");
  const [deadline, setDeadline] = useState("");
  const [senderTitle, setSenderTitle] = useState("");
  const [signatureName, setSignatureName] = useState("");

  // NDA fields
  const [disclosingPartyName, setDisclosingPartyName] = useState("");
  const [disclosingPartyAddress, setDisclosingPartyAddress] = useState("");
  const [receivingPartyName, setReceivingPartyName] = useState("");
  const [receivingPartyAddress, setReceivingPartyAddress] = useState("");
  const [purpose, setPurpose] = useState("");
  const [confidentialInfoDesc, setConfidentialInfoDesc] = useState("");
  const [confidentialityPeriod, setConfidentialityPeriod] = useState("");

  // Service Agreement fields
  const [serviceProviderName, setServiceProviderName] = useState("");
  const [serviceProviderAddress, setServiceProviderAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [servicesDescription, setServicesDescription] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("");
  const [terminationNotice, setTerminationNotice] = useState("");
  const [additionalTerms, setAdditionalTerms] = useState("");

  // UI & API state
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/documents/templates`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: TemplateItem[] | null) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setTemplates(data);
        }
      })
      .catch(() => {
        // Fallback to DEFAULT_TEMPLATES
      });
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!documentType) {
      errors.document_type = "Please select a document type.";
      return errors;
    }

    if (documentType === "demand_letter") {
      if (!senderName.trim()) errors.sender_name = "Sender / Your Name is required.";
      if (!recipientName.trim()) errors.recipient_name = "Recipient Name is required.";
      if (!demand.trim()) errors.demand = "Demand details are required.";
    } else if (documentType === "nda") {
      if (!disclosingPartyName.trim()) errors.disclosing_party_name = "Disclosing Party Name is required.";
      if (!receivingPartyName.trim()) errors.receiving_party_name = "Receiving Party Name is required.";
    } else if (documentType === "service_agreement") {
      if (!serviceProviderName.trim()) errors.service_provider_name = "Service Provider Name is required.";
      if (!clientName.trim()) errors.client_name = "Client Name is required.";
      if (!servicesDescription.trim()) errors.services_description = "Services Description is required.";
    }

    return errors;
  };

  const buildPayload = (): Record<string, string> => {
    const payload: Record<string, string> = { document_type: documentType };

    if (documentType === "demand_letter") {
      if (senderName.trim()) payload.sender_name = senderName.trim();
      if (senderAddress.trim()) payload.sender_address = senderAddress.trim();
      if (senderContact.trim()) payload.sender_contact = senderContact.trim();
      if (recipientName.trim()) payload.recipient_name = recipientName.trim();
      if (recipientAddress.trim()) payload.recipient_address = recipientAddress.trim();
      if (date.trim()) payload.date = date.trim();
      if (subject.trim()) payload.subject = subject.trim();
      if (facts.trim()) payload.facts = facts.trim();
      if (demand.trim()) payload.demand = demand.trim();
      if (deadline.trim()) payload.deadline = deadline.trim();
      if (senderTitle.trim()) payload.sender_title = senderTitle.trim();
      if (signatureName.trim()) payload.signature_name = signatureName.trim();
    } else if (documentType === "nda") {
      if (disclosingPartyName.trim()) payload.disclosing_party_name = disclosingPartyName.trim();
      if (disclosingPartyAddress.trim()) payload.disclosing_party_address = disclosingPartyAddress.trim();
      if (receivingPartyName.trim()) payload.receiving_party_name = receivingPartyName.trim();
      if (receivingPartyAddress.trim()) payload.receiving_party_address = receivingPartyAddress.trim();
      if (purpose.trim()) payload.purpose = purpose.trim();
      if (confidentialInfoDesc.trim()) payload.confidential_info_desc = confidentialInfoDesc.trim();
      if (date.trim()) payload.date = date.trim();
      if (confidentialityPeriod.trim()) payload.confidentiality_period = confidentialityPeriod.trim();
      if (governingLaw.trim()) payload.governing_law = governingLaw.trim();
    } else if (documentType === "service_agreement") {
      if (serviceProviderName.trim()) payload.service_provider_name = serviceProviderName.trim();
      if (serviceProviderAddress.trim()) payload.service_provider_address = serviceProviderAddress.trim();
      if (clientName.trim()) payload.client_name = clientName.trim();
      if (clientAddress.trim()) payload.client_address = clientAddress.trim();
      if (servicesDescription.trim()) payload.services_description = servicesDescription.trim();
      if (paymentTerms.trim()) payload.payment_terms = paymentTerms.trim();
      if (startDate.trim()) payload.start_date = startDate.trim();
      if (duration.trim()) payload.duration = duration.trim();
      if (terminationNotice.trim()) payload.termination_notice = terminationNotice.trim();
      if (governingLaw.trim()) payload.governing_law = governingLaw.trim();
      if (additionalTerms.trim()) payload.additional_terms = additionalTerms.trim();
    }

    return payload;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsGenerating(true);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }

    try {
      const payload = buildPayload();

      // 1. Fetch JSON text result & metadata
      const res = await fetch(`${API_BASE}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      // 2. Fetch generated PDF blob
      const pdfRes = await fetch(`${API_BASE}/documents/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (pdfRes.ok) {
        const pdfBlob = await pdfRes.blob();
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      } else {
        setApiError("Document text generated, but PDF creation failed.");
      }
    } catch {
      setApiError(
        "Could not reach the server. Make sure the backend is running."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl && !result) return;
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = `${documentType || "legal-document"}_draft.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    // Fallback: request PDF download via export endpoint
    handleDownloadFormat("pdf");
  };

  const handleDownloadTxt = () => {
    handleDownloadFormat("txt");
  };

  const handleDownloadFormat = async (format: "txt" | "pdf") => {
    if (!result) return;
    setIsExporting(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/documents/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        setApiError(`Export failed (${res.status}). Please try again.`);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${documentType || "legal-document"}_draft.${format}`;
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
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setResult(null);
    setShowText(false);
    setApiError("");
    setFieldErrors({});
    setDocumentType("");
    
    // Clear all fields
    setDate("");
    setGoverningLaw("");
    setSenderName("");
    setSenderAddress("");
    setSenderContact("");
    setRecipientName("");
    setRecipientAddress("");
    setSubject("");
    setFacts("");
    setDemand("");
    setDeadline("");
    setSenderTitle("");
    setSignatureName("");

    setDisclosingPartyName("");
    setDisclosingPartyAddress("");
    setReceivingPartyName("");
    setReceivingPartyAddress("");
    setPurpose("");
    setConfidentialInfoDesc("");
    setConfidentialityPeriod("");

    setServiceProviderName("");
    setServiceProviderAddress("");
    setClientName("");
    setClientAddress("");
    setServicesDescription("");
    setPaymentTerms("");
    setStartDate("");
    setDuration("");
    setTerminationNotice("");
    setAdditionalTerms("");
  };

  // Helper input styling
  const inputClass = (errorKey?: string) =>
    `w-full bg-slate-800/60 border rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all ${
      errorKey && fieldErrors[errorKey] ? "border-red-500" : "border-slate-600"
    }`;

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
              Select a template, fill in the details, and download your draft.
            </p>
          </div>

          {/* ── Form Card ── */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
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
              {/* Document Type Selector */}
              <div>
                <label
                  htmlFor="document-type"
                  className="block text-sm font-medium text-slate-200 mb-1.5"
                >
                  Select Document Type <span className="text-pink-400">*</span>
                </label>
                <div className="relative">
                  <select
                    id="document-type"
                    value={documentType}
                    onChange={(e) => {
                      setDocumentType(e.target.value as DocumentType);
                      setFieldErrors({});
                    }}
                    className={`w-full bg-slate-800/60 border rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none ${
                      fieldErrors.document_type ? "border-red-500" : "border-slate-600"
                    }`}
                  >
                    <option value="" disabled>
                      Choose a template…
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
                  <p className="mt-1 text-xs text-red-400">
                    {fieldErrors.document_type}
                  </p>
                )}
              </div>

              {/* Dynamic Template-Specific Fields */}

              {/* DEMAND LETTER FIELDS */}
              {documentType === "demand_letter" && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-slate-700/60 pb-2">
                    <h2 className="text-sm font-semibold text-purple-300">
                      Demand Letter Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Sender / Your Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className={inputClass("sender_name")}
                        placeholder="e.g., Jane Doe"
                      />
                      {fieldErrors.sender_name && (
                        <p className="mt-1 text-xs text-red-400">{fieldErrors.sender_name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Recipient Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className={inputClass("recipient_name")}
                        placeholder="e.g., Acme Corp / John Smith"
                      />
                      {fieldErrors.recipient_name && (
                        <p className="mt-1 text-xs text-red-400">{fieldErrors.recipient_name}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Demand / What You Want <span className="text-pink-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={demand}
                      onChange={(e) => setDemand(e.target.value)}
                      className={inputClass("demand")}
                      placeholder="e.g., Full payment of $2,500 owed under Invoice #1042."
                    />
                    {fieldErrors.demand && (
                      <p className="mt-1 text-xs text-red-400">{fieldErrors.demand}</p>
                    )}
                  </div>

                  {/* Optional Demand Letter Fields */}
                  <div className="border-t border-slate-700/60 pt-3 space-y-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Optional Fields
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Sender Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={senderAddress}
                          onChange={(e) => setSenderAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 123 Main St, New York, NY"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Recipient Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 456 Business Ave, Austin, TX"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Sender Contact Info <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={senderContact}
                          onChange={(e) => setSenderContact(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., jane@example.com / (555) 019-2834"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Date <span className="text-slate-400">(Optional - defaults to today)</span>
                        </label>
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., September 12, 2026"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Subject / Matter <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., Overdue Payment for Services Rendered"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Compliance Deadline <span className="text-slate-400">(Optional - default 15 days)</span>
                        </label>
                        <input
                          type="text"
                          value={deadline}
                          onChange={(e) => setDeadline(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 14 days / 30 calendar days"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Facts / Background <span className="text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={facts}
                        onChange={(e) => setFacts(e.target.value)}
                        className={inputClass()}
                        placeholder="e.g., On August 1st, services were delivered as per agreement. Multiple reminders sent went unanswered."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Sender Title / Capacity <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={senderTitle}
                          onChange={(e) => setSenderTitle(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., Managing Member / Attorney-in-fact"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Signature Name <span className="text-slate-400">(Optional - defaults to Sender Name)</span>
                        </label>
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., Jane M. Doe"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NDA FIELDS */}
              {documentType === "nda" && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-slate-700/60 pb-2">
                    <h2 className="text-sm font-semibold text-purple-300">
                      Non-Disclosure Agreement Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Disclosing Party Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={disclosingPartyName}
                        onChange={(e) => setDisclosingPartyName(e.target.value)}
                        className={inputClass("disclosing_party_name")}
                        placeholder="e.g., Acme Innovations Inc."
                      />
                      {fieldErrors.disclosing_party_name && (
                        <p className="mt-1 text-xs text-red-400">
                          {fieldErrors.disclosing_party_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Receiving Party Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={receivingPartyName}
                        onChange={(e) => setReceivingPartyName(e.target.value)}
                        className={inputClass("receiving_party_name")}
                        placeholder="e.g., Beta Software LLC"
                      />
                      {fieldErrors.receiving_party_name && (
                        <p className="mt-1 text-xs text-red-400">
                          {fieldErrors.receiving_party_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Optional NDA Fields */}
                  <div className="border-t border-slate-700/60 pt-3 space-y-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Optional Fields
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Disclosing Party Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={disclosingPartyAddress}
                          onChange={(e) => setDisclosingPartyAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 100 Tech Way, San Francisco, CA"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Receiving Party Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={receivingPartyAddress}
                          onChange={(e) => setReceivingPartyAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 500 Innovation Blvd, Seattle, WA"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Purpose / Business Relationship <span className="text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className={inputClass()}
                        placeholder="e.g., Evaluating a potential strategic partnership or software integration."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Description of Confidential Info <span className="text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={confidentialInfoDesc}
                        onChange={(e) => setConfidentialInfoDesc(e.target.value)}
                        className={inputClass()}
                        placeholder="e.g., Proprietary source code, customer lists, algorithms, and financial projections."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Agreement Date <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., Today's date"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Confidentiality Period <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={confidentialityPeriod}
                          onChange={(e) => setConfidentialityPeriod(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., two (2) years"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Governing Law <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={governingLaw}
                          onChange={(e) => setGoverningLaw(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., State of Delaware"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICE AGREEMENT FIELDS */}
              {documentType === "service_agreement" && (
                <div className="space-y-4 pt-2">
                  <div className="border-b border-slate-700/60 pb-2">
                    <h2 className="text-sm font-semibold text-purple-300">
                      Service Agreement Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Service Provider Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={serviceProviderName}
                        onChange={(e) => setServiceProviderName(e.target.value)}
                        className={inputClass("service_provider_name")}
                        placeholder="e.g., Apex Web Services LLC"
                      />
                      {fieldErrors.service_provider_name && (
                        <p className="mt-1 text-xs text-red-400">
                          {fieldErrors.service_provider_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Client Name <span className="text-pink-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className={inputClass("client_name")}
                        placeholder="e.g., Bright Retail Corp"
                      />
                      {fieldErrors.client_name && (
                        <p className="mt-1 text-xs text-red-400">
                          {fieldErrors.client_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Services Description <span className="text-pink-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={servicesDescription}
                      onChange={(e) => setServicesDescription(e.target.value)}
                      className={inputClass("services_description")}
                      placeholder="e.g., Full stack web application development, cloud infrastructure setup, and technical documentation."
                    />
                    {fieldErrors.services_description && (
                      <p className="mt-1 text-xs text-red-400">
                        {fieldErrors.services_description}
                      </p>
                    )}
                  </div>

                  {/* Optional Service Agreement Fields */}
                  <div className="border-t border-slate-700/60 pt-3 space-y-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Optional Fields
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Service Provider Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={serviceProviderAddress}
                          onChange={(e) => setServiceProviderAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 789 Developer Rd, Austin, TX"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Client Address <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., 321 Commerce St, Chicago, IL"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Payment / Fee Terms <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={paymentTerms}
                          onChange={(e) => setPaymentTerms(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., $5,000 monthly retainer due on the 1st."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Start Date <span className="text-slate-400">(Optional - default today)</span>
                        </label>
                        <input
                          type="text"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., October 1, 2026"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Agreement Duration <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., for a period of 6 months"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Termination Notice <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={terminationNotice}
                          onChange={(e) => setTerminationNotice(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., thirty (30) days"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Governing Law <span className="text-slate-400">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={governingLaw}
                          onChange={(e) => setGoverningLaw(e.target.value)}
                          className={inputClass()}
                          placeholder="e.g., State of California"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Additional Terms <span className="text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={additionalTerms}
                        onChange={(e) => setAdditionalTerms(e.target.value)}
                        className={inputClass()}
                        placeholder="e.g., Weekly progress meetings required every Monday."
                      />
                    </div>
                  </div>
                </div>
              )}

              {!documentType && (
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl text-center">
                  <p className="text-xs text-slate-400">
                    Please select a document type above to see the required and optional details for your document.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="generate-btn"
                type="submit"
                disabled={isGenerating || !documentType}
                className="w-full relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
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

          {/* ── Preview Panel ── */}
          {result && (
            <div
              id="preview-panel"
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5"
            >
              <div className="p-3 bg-amber-900/30 border border-amber-700/40 rounded-xl">
                <p className="text-amber-200 text-xs leading-5">
                  ⚠ <strong>Legal Disclaimer:</strong> {result.disclaimer}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">{result.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-full">
                    PDF Draft
                  </span>
                </div>
              </div>

              {/* PDF Preview Area */}
              <div className="w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
                {pdfUrl ? (
                  <iframe
                    id="pdf-preview-frame"
                    src={pdfUrl}
                    title="Legal Document PDF Preview"
                    className="w-full h-[600px] border-0 rounded-xl"
                  />
                ) : (
                  <div className="p-12 text-center text-slate-400 space-y-3">
                    <svg
                      className="animate-spin h-8 w-8 mx-auto text-purple-400"
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
                    <p className="text-sm font-medium">Rendering PDF Document Preview…</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  id="download-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={!pdfUrl}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-5 rounded-xl transition-colors duration-200 shadow-lg shadow-emerald-950/50"
                >
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </button>

                <button
                  id="toggle-text-btn"
                  onClick={() => setShowText(!showText)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors duration-200 text-sm font-medium"
                >
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {showText ? "Hide Text" : "View Text"}
                </button>

                <button
                  id="start-over-btn"
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200 text-sm font-medium"
                >
                  Start Over
                </button>
              </div>

              {/* Text View Accordion (Secondary Option) */}
              {showText && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Generated Plain Text Content
                    </span>
                    <button
                      onClick={handleDownloadTxt}
                      disabled={isExporting}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium underline"
                    >
                      {isExporting ? "Downloading..." : "Download (.txt)"}
                    </button>
                  </div>
                  <pre
                    id="document-text-preview"
                    className="text-slate-300 text-xs leading-5 whitespace-pre-wrap font-mono bg-slate-900/80 rounded-xl p-4 max-h-[300px] overflow-y-auto border border-slate-800"
                  >
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          )}


          <p className="text-center text-xs text-slate-600 pb-6">
            Pre-Legal Document Generator — for informational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}
