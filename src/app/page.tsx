'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, ChevronDown, ChevronUp, Copy, Download, AlertTriangle, CheckCircle, Sun, Moon, Shield, Dna, Cpu, Activity, ArrowRight, Zap, BarChart3, FlaskConical, Lock, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AnalysisResult } from '@/lib/types';

const SUPPORTED_DRUGS = [
  { name: 'CODEINE', gene: 'CYP2D6', category: 'Analgesic' },
  { name: 'WARFARIN', gene: 'CYP2C9', category: 'Anticoagulant' },
  { name: 'CLOPIDOGREL', gene: 'CYP2C19', category: 'Antiplatelet' },
  { name: 'SIMVASTATIN', gene: 'SLCO1B1', category: 'Statin' },
  { name: 'AZATHIOPRINE', gene: 'TPMT', category: 'Immunosuppressant' },
  { name: 'FLUOROURACIL', gene: 'DPYD', category: 'Chemotherapy' },
];

function getRiskClass(label: string): string {
  switch (label) {
    case 'Safe': return 'safe';
    case 'Adjust Dosage': return 'adjust';
    case 'Toxic': return 'toxic';
    case 'Ineffective': return 'ineffective';
    default: return 'unknown';
  }
}

function getRiskColor(label: string): string {
  switch (label) {
    case 'Safe': return '#16a34a';
    case 'Adjust Dosage': return '#ca8a04';
    case 'Toxic': return '#dc2626';
    case 'Ineffective': return '#ea580c';
    default: return '#7c3aed';
  }
}

function getRiskPosition(label: string, severity: string): number {
  // Spectrum: Toxic (0%) ← → Safe (50%) ← → Ineffective (100%)
  switch (label) {
    case 'Toxic':
      if (severity === 'critical') return 5;
      if (severity === 'high') return 15;
      return 22;
    case 'Adjust Dosage':
      if (severity === 'high') return 30;
      if (severity === 'moderate') return 37;
      return 42;
    case 'Safe':
      return 50;
    case 'Ineffective':
      if (severity === 'critical') return 95;
      if (severity === 'high') return 85;
      return 78;
    default: // Unknown
      return 50;
  }
}

export default function HomePage() {
  const [vcfFile, setVcfFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vcfWarnings, setVcfWarnings] = useState<{ line: number; field: string; message: string; severity: string }[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pharma-theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('pharma-theme', next ? 'dark' : 'light');
  };

  // ─── Privacy: Clear All Data ───
  const clearAllData = useCallback(() => {
    setVcfFile(null);
    setSelectedDrugs([]);
    setResults([]);
    setLoading(false);
    setError('');
    setVcfWarnings([]);
    setShowWarnings(false);
    setExpandedCards(new Set());
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ─── Privacy: Auto-purge on tab close ───
  useEffect(() => {
    const handleUnload = () => {
      // Clear any analysis data from memory on tab close
      clearAllData();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [clearAllData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.vcf')) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum file size is 5MB.');
        return;
      }
      setVcfFile(file);
      setError('');
    } else {
      setError('Please upload a valid .vcf file. Only VCF (Variant Call Format) files are supported.');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.vcf')) {
        setError('Please upload a valid .vcf file. Only VCF (Variant Call Format) files are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum file size is 5MB.');
        return;
      }
      setVcfFile(file);
      setError('');
    }
  };

  const toggleDrug = (drug: string) => {
    setSelectedDrugs(prev =>
      prev.includes(drug) ? prev.filter(d => d !== drug) : [...prev, drug]
    );
  };

  const handleSelectAll = () => {
    if (selectedDrugs.length === SUPPORTED_DRUGS.length) {
      setSelectedDrugs([]);
    } else {
      setSelectedDrugs(SUPPORTED_DRUGS.map(d => d.name));
    }
  };

  const handleLoadSample = async () => {
    try {
      const res = await fetch('/sample-vcf/exceptions/exception_compound_het.vcf');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'sample_CYP2C19_compound_het.vcf', { type: 'text/plain' });
      setVcfFile(file);
      setError('');
    } catch {
      setError('Could not load sample file');
    }
  };

  const handleAnalyze = async () => {
    if (!vcfFile) {
      setError('Please upload a VCF file before analyzing.');
      return;
    }
    if (selectedDrugs.length === 0) {
      setError('Please select at least one drug to analyze.');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setVcfWarnings([]);
    setShowWarnings(false);

    try {
      const formData = new FormData();
      formData.append('vcfFile', vcfFile);
      formData.append('drugs', selectedDrugs.join(','));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setResults(data.results);
      if (data.vcf_warnings && data.vcf_warnings.length > 0) {
        setVcfWarnings(data.vcf_warnings);
      }
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (index: number) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanjeevani-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = results.length > 0 ? {
    drugs: results.length,
    variants: results.reduce((sum, r) => sum + r.pharmacogenomic_profile.detected_variants.length, 0),
    genes: new Set(results.map(r => r.pharmacogenomic_profile.primary_gene)).size,
    highRisk: results.filter(r => r.risk_assessment.severity === 'high' || r.risk_assessment.severity === 'critical').length,
  } : null;

  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-content">
          <a href="/" className="logo">
            <img src="/logo.png" alt="Sanjeevani" className="logo-img" />
            <span className="logo-text">Sanjeevani</span>
          </a>
          <span className="nav-badge">RIFT 2026 — HealthTech</span>
          <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      <main className="container">
        {/* Header */}
        <section className="hero">
          <h1>Pharmacogenomic Risk Prediction</h1>
          <p>
            Upload genomic data (VCF) to receive CPIC-aligned drug risk
            assessments with clinical recommendations.
          </p>
          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="trust-badge">
              <Shield size={14} />
              <span>CPIC-Aligned</span>
            </div>
            <div className="trust-badge">
              <Dna size={14} />
              <span>GRCh38</span>
            </div>
            <div className="trust-badge">
              <FlaskConical size={14} />
              <span>6 Drug-Gene Pairs</span>
            </div>
            <div className="trust-badge">
              <Cpu size={14} />
              <span>AI-Powered</span>
            </div>
          </div>
        </section>

        {/* Upload Section */}
        <section className="upload-section">
          <div className="upload-grid">
            {/* VCF Upload */}
            <div
              className={`dropzone ${isDragging ? 'dragging' : ''} ${vcfFile ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".vcf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="vcf-upload"
              />
              {vcfFile ? (
                <>
                  <div className="file-info">
                    <FileText size={16} />
                    <span>{vcfFile.name}</span>
                  </div>
                  <p style={{ marginTop: 4 }}>
                    {(vcfFile.size / 1024).toFixed(1)} KB — Click to change
                  </p>
                </>
              ) : (
                <>
                  <div className="dropzone-icon">
                    <Upload size={28} strokeWidth={1.5} />
                  </div>
                  <h3>Upload VCF File</h3>
                  <p>Drag and drop or click to browse</p>
                  <p style={{ marginTop: 4 }}>VCF v4.x, max 5MB</p>
                  <button
                    type="button"
                    className="sample-link"
                    onClick={(e) => { e.stopPropagation(); handleLoadSample(); }}
                  >
                    🧪 Try a sample file
                  </button>
                </>
              )}
            </div>

            {/* Drug Selection */}
            <div className="drug-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Select Drugs to Analyze</h3>
                <button type="button" className="select-all-btn" onClick={handleSelectAll}>
                  {selectedDrugs.length === SUPPORTED_DRUGS.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="drug-chips">
                {SUPPORTED_DRUGS.map(drug => (
                  <button
                    key={drug.name}
                    className={`drug-chip ${selectedDrugs.includes(drug.name) ? 'selected' : ''}`}
                    onClick={() => toggleDrug(drug.name)}
                    title={`${drug.gene} — ${drug.category}`}
                  >
                    {drug.name}
                    <span style={{ fontSize: '0.7rem', marginLeft: 4, opacity: 0.6 }}>
                      ({drug.gene})
                    </span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {selectedDrugs.length} drug{selectedDrugs.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            className="btn-primary"
            onClick={handleAnalyze}
            disabled={!vcfFile || selectedDrugs.length === 0 || loading}
            id="analyze-button"
          >
            {loading ? (
              <>
                <span className="loading-spinner" />
                Analyzing...
              </>
            ) : (
              'Analyze Pharmacogenomic Risk'
            )}
          </button>

          {/* How It Works — Pipeline */}
          {!results.length && (
            <div className="pipeline-section">
              <div className="pipeline-step">
                <div className="pipeline-icon">
                  <Upload size={20} strokeWidth={1.5} />
                </div>
                <div className="pipeline-text">
                  <h4>Upload</h4>
                  <p>VCF genomic file</p>
                </div>
              </div>
              <ArrowRight size={16} className="pipeline-arrow" />
              <div className="pipeline-step">
                <div className="pipeline-icon">
                  <Activity size={20} strokeWidth={1.5} />
                </div>
                <div className="pipeline-text">
                  <h4>Analyze</h4>
                  <p>Variant detection</p>
                </div>
              </div>
              <ArrowRight size={16} className="pipeline-arrow" />
              <div className="pipeline-step">
                <div className="pipeline-icon">
                  <BarChart3 size={20} strokeWidth={1.5} />
                </div>
                <div className="pipeline-text">
                  <h4>Report</h4>
                  <p>Risk assessment</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Results */}
        {results.length > 0 && (
          <section className="results-section" ref={resultsRef}>
            <div className="results-header">
              <h2>Risk Assessment Results</h2>
              <div className="results-actions">
                <button className="btn-icon" onClick={copyJson} id="copy-json-btn">
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
                <button className="btn-icon" onClick={downloadJson} id="download-json-btn">
                  <Download size={14} />
                  Download
                </button>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="stats-bar">
                <div className="stat-item">
                  <div className="stat-value">{stats.drugs}</div>
                  <div className="stat-label">Drugs Analyzed</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.variants}</div>
                  <div className="stat-label">Variants Detected</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.genes}</div>
                  <div className="stat-label">Genes Profiled</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: stats.highRisk > 0 ? '#dc2626' : '#16a34a' }}>
                    {stats.highRisk}
                  </div>
                  <div className="stat-label">High Risk Alerts</div>
                </div>
              </div>
            )}

            {/* VCF Parse Warnings */}
            {vcfWarnings.length > 0 && (
              <div className="vcf-warnings-panel">
                <button
                  className="warnings-toggle"
                  onClick={() => setShowWarnings(!showWarnings)}
                >
                  <AlertTriangle size={14} />
                  <span>
                    {vcfWarnings.length} VCF Parse Warning{vcfWarnings.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    {showWarnings ? '▲ Hide' : '▼ Show'}
                  </span>
                </button>
                {showWarnings && (
                  <div className="warnings-list">
                    {vcfWarnings.map((w, i) => (
                      <div key={i} className={`warning-item warning-${w.severity}`}>
                        <span className="warning-severity">
                          {w.severity === 'error' ? '✕' : w.severity === 'warning' ? '⚠' : 'ℹ'}
                        </span>
                        <span className="warning-field">{w.field}</span>
                        <span className="warning-line">Line {w.line}</span>
                        <span className="warning-msg">{w.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Clinical Disclaimer */}
            <div className="clinical-disclaimer">
              <div className="disclaimer-title">
                <AlertTriangle size={14} />
                Clinical Decision Support Notice
              </div>
              <p>
                Risk labels shown below are <strong>algorithmically derived</strong> from
                genotype-to-phenotype translation using CPIC-standardized activity scores and
                allele functionality data. These results are intended to <strong>assist
                </strong> — not replace — clinical decision-making. Per CPIC
                guidelines, pharmacogenomic test results should be interpreted in the context
                of the patient&apos;s complete clinical picture, including comorbidities,
                concomitant medications, renal/hepatic function, and clinical history.
                The prescribing clinician&apos;s judgment, informed by published CPIC
                guidelines, remains the final authority on therapeutic decisions.
              </p>
              <p className="disclaimer-source">
                Reference: CPIC (cpicpgx.org) &mdash; &quot;CPIC guidelines are intended only
                to assist in clinical decision-making and to identify areas in which further
                research is needed.&quot;
              </p>
            </div>

            {/* Risk Cards */}
            <div className="risk-cards">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  className="risk-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                >
                  <div className="risk-card-header">
                    <div>
                      <div className="risk-card-drug">{result.drug}</div>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {result.pharmacogenomic_profile.primary_gene}
                      </span>
                    </div>
                  </div>

                  {/* Risk Spectrum Bars */}
                  <div className="risk-spectrum-section">
                    {/* CPIC Clinical Action Bar */}
                    <div className="spectrum-row">
                      <div className="spectrum-label">CPIC Clinical</div>
                      <div className="spectrum-container">
                        <div className="spectrum-bar">
                          <div
                            className="spectrum-marker"
                            style={{ left: `${getRiskPosition(result.risk_assessment.risk_label, result.risk_assessment.severity)}%` }}
                          />
                        </div>
                        <div className="spectrum-labels">
                          <span className="spectrum-edge toxic">Toxic</span>
                          <span className="spectrum-center">Safe</span>
                          <span className="spectrum-edge ineffective">Ineffective</span>
                        </div>
                        <div className="spectrum-result-label" style={{ color: getRiskColor(result.risk_assessment.risk_label) }}>
                          {result.risk_assessment.cpic_clinical_action}
                        </div>
                      </div>
                    </div>

                    {/* Algorithmic Risk Label Bar */}
                    <div className="spectrum-row">
                      <div className="spectrum-label">Algorithmic</div>
                      <div className="spectrum-container">
                        <div className="spectrum-bar">
                          <div
                            className="spectrum-marker"
                            style={{ left: `${getRiskPosition(result.risk_assessment.risk_label, result.risk_assessment.severity)}%` }}
                          />
                        </div>
                        <div className="spectrum-labels">
                          <span className="spectrum-edge toxic">Toxic</span>
                          <span className="spectrum-center">Safe</span>
                          <span className="spectrum-edge ineffective">Ineffective</span>
                        </div>
                        <div className="spectrum-result-label" style={{ color: getRiskColor(result.risk_assessment.risk_label) }}>
                          {result.risk_assessment.risk_label}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="risk-card-body">
                    <div className="risk-detail-group">
                      <h4>Diplotype</h4>
                      <p className="mono">{result.pharmacogenomic_profile.diplotype}</p>
                    </div>
                    <div className="risk-detail-group">
                      <h4>Phenotype</h4>
                      <p>{({ PM: 'Poor', IM: 'Intermediate', NM: 'Normal', RM: 'Rapid', URM: 'Ultra-Rapid', Unknown: 'Unknown' } as Record<string, string>)[result.pharmacogenomic_profile.phenotype] || result.pharmacogenomic_profile.phenotype} Metabolizer</p>
                    </div>
                    <div className="risk-detail-group">
                      <h4>Severity</h4>
                      <p>
                        <span className={`severity-dot ${result.risk_assessment.severity}`} />
                        {result.risk_assessment.severity.charAt(0).toUpperCase() + result.risk_assessment.severity.slice(1)}
                      </p>
                    </div>
                    <div className="risk-detail-group">
                      <h4>Confidence</h4>
                      <p>{(result.risk_assessment.confidence_score * 100).toFixed(0)}%</p>
                      <div className="confidence-bar">
                        <div
                          className="confidence-fill"
                          style={{
                            width: `${result.risk_assessment.confidence_score * 100}%`,
                            background: getRiskColor(result.risk_assessment.risk_label),
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Clinical Recommendation */}
                  <div className="clinical-rec">
                    <h4>Clinical Recommendation</h4>
                    <p>{result.clinical_recommendation.action}</p>
                    {result.clinical_recommendation.alternative_drugs.length > 0 && (
                      <p className="alternatives">
                        Alternatives: {result.clinical_recommendation.alternative_drugs.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Detected Variants */}
                  {result.pharmacogenomic_profile.detected_variants.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>
                        Detected Variants ({result.pharmacogenomic_profile.detected_variants.length})
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="variant-table">
                          <thead>
                            <tr>
                              <th>rsID</th>
                              <th>Position</th>
                              <th>Ref/Alt</th>
                              <th>Genotype</th>
                              <th>Significance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.pharmacogenomic_profile.detected_variants.map((v, i) => (
                              <tr key={i}>
                                <td>{v.rsid}</td>
                                <td>chr{v.chromosome}:{v.position}</td>
                                <td>{v.ref_allele} → {v.alt_allele}</td>
                                <td>{v.genotype}</td>
                                <td style={{ fontFamily: 'Inter, sans-serif' }}>{v.clinical_significance}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* AI Explanation */}
                  <div className="explanation-panel">
                    <button
                      className="explanation-toggle"
                      onClick={() => toggleCard(index)}
                    >
                      <span>Clinical Explanation</span>
                      {expandedCards.has(index) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                      {expandedCards.has(index) && (
                        <motion.div
                          className="explanation-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <h5>Summary</h5>
                          <p>{result.llm_generated_explanation.summary || 'No explanation available.'}</p>

                          {result.llm_generated_explanation.mechanism && (
                            <>
                              <h5>Mechanism</h5>
                              <p>{result.llm_generated_explanation.mechanism}</p>
                            </>
                          )}

                          {result.llm_generated_explanation.variant_specific_effects && (
                            <>
                              <h5>Variant Effects</h5>
                              <p>{result.llm_generated_explanation.variant_specific_effects}</p>
                            </>
                          )}

                          {result.llm_generated_explanation.clinical_context && (
                            <>
                              <h5>Clinical Context</h5>
                              <p>{result.llm_generated_explanation.clinical_context}</p>
                            </>
                          )}

                          {result.llm_generated_explanation.references?.length > 0 && (
                            <>
                              <h5>References</h5>
                              <ul style={{ paddingLeft: 16, margin: 0 }}>
                                {result.llm_generated_explanation.references.map((ref, i) => (
                                  <li key={i} style={{ marginBottom: 2, fontSize: '0.8rem' }}>{ref}</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* JSON Output */}
            <div className="json-viewer">
              <h3>Raw JSON Output</h3>
              <pre className="json-content">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </section>
        )}

        {/* Privacy Shield */}
        <section className="privacy-shield">
          <div className="privacy-header">
            <ShieldCheck size={20} />
            <h3>Privacy-First Architecture</h3>
          </div>
          <div className="privacy-features">
            <div className="privacy-feature">
              <div className="privacy-feature-icon">
                <Lock size={18} />
              </div>
              <div>
                <h4>Zero Storage</h4>
                <p>No database. Your VCF file is processed in-memory and immediately discarded after analysis.</p>
              </div>
            </div>
            <div className="privacy-feature">
              <div className="privacy-feature-icon">
                <EyeOff size={18} />
              </div>
              <div>
                <h4>Genomic Isolation</h4>
                <p>Raw genomic data never leaves the pipeline. Only anonymized variant summaries reach the AI explainer.</p>
              </div>
            </div>
            <div className="privacy-feature">
              <div className="privacy-feature-icon">
                <Trash2 size={18} />
              </div>
              <div>
                <h4>Session Purge</h4>
                <p>All data auto-clears when you close the tab. Or clear manually anytime.</p>
              </div>
            </div>
          </div>
          {results.length > 0 && (
            <button className="btn-clear-data" onClick={clearAllData}>
              <Trash2 size={14} />
              Clear All Analysis Data
            </button>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>
            Sanjeevani — Pharmacogenomic Risk Prediction &middot;{' '}
            <a href="https://cpicpgx.org/" target="_blank" rel="noopener noreferrer">
              CPIC Guidelines
            </a>{' '}
            &middot; RIFT 2026
          </p>
          <p style={{ marginTop: 4 }}>
            For research and educational purposes only. Not a substitute for professional medical advice.
          </p>
        </footer>
      </main>
    </>
  );
}
