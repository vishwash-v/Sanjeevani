<div align="center">

# 🧬 Sanjeevani

### AI-Powered Pharmacogenomic Risk Prediction System

*"Sanjeevani" — the mythical herb from Indian mythology that could bring the dead back to life.*
*We believe the right genetic information, at the right time, can save lives.*

[![RIFT 2026](https://img.shields.io/badge/RIFT_2026-Hackathon-green?style=for-the-badge)](https://rift2026.com)
[![HealthTech](https://img.shields.io/badge/Track-HealthTech_PS3-blue?style=for-the-badge)](https://rift2026.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-orange?style=for-the-badge&logo=google)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Team NextGen** — Vishwas H V · Tarun Kumar · Vankadara Navneet · Shanmukeswar Reddy

</div>

---

## 🔗 Submission Links

| # | Requirement | Link |
|---|-------------|------|
| 1 | **Live Demo** | [Deployed URL — Coming Soon] |
| 2 | **LinkedIn Video** | [Video Link — Coming Soon] |
| 3 | **GitHub Repository** | [github.com/vishwash-v/Sanjeevani](https://github.com/vishwash-v/Sanjeevani) |
| 4 | **README.md** | You're reading it! |

---

## 📋 Table of Contents

- [The Problem](#-the-problem)
- [Our Solution](#-our-solution-sanjeevani)
- [Key Features](#-key-features)
- [Architecture](#-system-architecture)
- [How It Works — Technical Pipeline](#-how-it-works--technical-pipeline)
- [Supported Drug–Gene Pairs](#-supported-druggene-pairs)
- [Privacy & Security](#-privacy--security)
- [Error Handling](#-error-handling)
- [Tech Stack](#-tech-stack)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [Sample VCF Files](#-sample-vcf-files-for-testing)
- [API Documentation](#-api-documentation)
- [Data Sources & References](#-data-sources--references)
- [What Makes Sanjeevani Unique](#-what-makes-sanjeevani-unique)
- [Challenges We Faced](#-challenges-we-faced)
- [Team](#-team-nextgen)
- [Disclaimer](#%EF%B8%8F-disclaimer)

---

## 🚨 The Problem

**Adverse drug reactions (ADRs) are the 4th leading cause of death in hospitals.** Every year, over 2 million people are hospitalized due to medications that interact dangerously with their genetic makeup. A painkiller that works perfectly for one patient can cause fatal respiratory depression in another — not because of the wrong diagnosis, but because of invisible genetic differences in how their bodies metabolize drugs.

The science to prevent this already exists. **Pharmacogenomics** — the study of how genes affect drug response — is a mature field with peer-reviewed guidelines published by the Clinical Pharmacogenomics Implementation Consortium (CPIC). These guidelines cover dozens of drugs and clearly specify: *"If the patient has this genotype, adjust the dosage / avoid this drug / use an alternative."*

**But there's a gap.** Clinicians don't have time to manually:
1. Parse raw VCF genomic files
2. Identify pharmacogenomic variants among thousands of records
3. Call star alleles from detected variants
4. Calculate activity scores and metabolizer phenotypes
5. Cross-reference CPIC dosing guidelines
6. Explain the results in patient-friendly language

**This gap between available knowledge and clinical practice is costing lives. Sanjeevani bridges it.**

---

## 💡 Our Solution: Sanjeevani

Sanjeevani is a **complete, end-to-end pharmacogenomic risk prediction system** that takes a patient's raw VCF file and produces clinically actionable drug safety assessments in seconds.

### What happens when you upload a VCF file:

```
Patient VCF File ──→ Parse & Validate ──→ Extract Pharma Variants ──→ Call Star Alleles
     │                                                                        │
     ▼                                                                        ▼
  Quality Filter              Map to 6 Pharmacogenes              Calculate Activity Score
  (QUAL, DP, GQ)              (CYP2D6, CYP2C19, etc.)            (CPIC Consensus Method)
                                                                        │
                                                                        ▼
                               Assign Metabolizer Phenotype ◄──── Gene-Specific Thresholds
                               (Poor/Intermediate/Normal/Rapid/Ultra-Rapid)
                                                                        │
                                                                        ▼
                               Multi-Factor Risk Engine ──→ Risk Label + Confidence Score
                               (Safe / Adjust Dosage / Toxic / Ineffective)
                                                                        │
                                                                        ▼
                               Gemini 2.0 Flash AI ──→ Plain Language Clinical Explanation
                               (anonymized data only)         (mechanism + recommendation)
```

**The entire pipeline processes a full VCF file in under 3 seconds.**

---

## ✨ Key Features

### 1. 🧪 Production-Grade VCF Parser (v5 — Edge-Case Hardened)
Our custom-built VCF parser handles **7 validated exception scenarios** that real-world clinical VCF files throw at you:

| Exception | How Sanjeevani Handles It |
|-----------|--------------------------|
| **Low quality variants** (QUAL < 20) | Filtered out with warning — prevents false positives from sequencing noise |
| **Failed FILTER** (not PASS) | Skipped — only quality-controlled variants are used |
| **Low read depth** (DP < 10) | Skipped with warning — insufficient sequencing coverage |
| **Missing rsID** | Falls back to chr:pos coordinate matching against PharmVar/dbSNP |
| **FORMAT/SAMPLE mismatch** | Handles gracefully — uses available fields with warning |
| **chr prefix inconsistency** | Normalizes `chr22` → `22` automatically |
| **Empty/malformed VCF** | Clear, user-friendly error messages |

Additionally:
- **Dual genome build support**: Auto-handles both **GRCh37** (hg19) and **GRCh38** (hg38)
- **Genotype quality (GQ) warnings**: Flags unreliable genotype calls (GQ < 15)
- **0/0 genotype filtering**: Homozygous reference (0/0) variants are correctly excluded from detected variants — only actual mutations (0/1, 1/1) are reported
- **Multi-allelic site handling**: Properly processes complex genotypes

### 2. 🎯 CPIC-Aligned Star Allele Calling
- Maps detected variants to **27 pharmacogenomic variant definitions** across 6 genes
- Supports **compound heterozygous resolution** (e.g., CYP2C19 *2 + *3 = *2/*3 → Poor Metabolizer)
- Uses **weighted matching** for partial variant hits
- Properly distinguishes heterozygous (0/1) from homozygous (1/1) for diplotype construction

### 3. 📊 Multi-Factor Risk Engine (Not a Simple Lookup Table)
Our risk engine goes beyond basic phenotype-to-risk mapping:

- **Activity Score Calculation** following CPIC's standardized methodology (Caudle et al., 2017)
- **Gene-specific phenotype thresholds** aligned with the latest CPIC consensus:
  - CYP2D6: Caudle 2024 update (AS=1 → IM, previously NM)
  - CYP2C19: Lee 2022
  - CYP2C9: Johnson 2017
  - DPYD: Amstutz 2018
  - TPMT: Relling 2019
  - SLCO1B1: Cooper-DeHoff 2022
- **Drug-specific pharmacology**: The same phenotype can mean "Toxic" for one drug and "Ineffective" for another (e.g., CYP2D6 PM → Codeine is Toxic, but CYP2C19 PM → Clopidogrel is Ineffective)
- **ML-calibrated confidence scoring**: Honestly reports prediction certainty based on variant count, functional impact, and activity score extremity
- **Severity escalation**: Automatically escalates severity when multiple no-function variants are detected

### 4. 🤖 Google Gemini 2.0 Flash AI Explanations
- Generates **structured clinical explanations** with mechanism of action, variant-specific effects, and clinical context
- Uses **structured JSON output** (not free-form text) for consistency
- Sends only **anonymized summaries** (drug, gene, diplotype, risk) — never raw VCF data
- **Graceful fallback**: If no API key is configured or the API fails, pre-computed CPIC-based explanations are used automatically

### 5. 🏥 Clinical Accuracy Measures
- **SLCO1B1 correctly identified as a hepatic uptake transporter** (OATP1B1), not an enzyme
- **Panel limitation disclaimers**: Warfarin results note that VKORC1 is not tested; Azathioprine results note that NUDT15 is not tested
- **CPIC clinical action terms** sourced directly from published guidelines
- **Alternative drug recommendations** for every unsafe result
- **Clinical disclaimer** on every analysis output

### 6. 🔒 Privacy-First Architecture (Zero Storage)

```
┌─────────────────────────────────────────────────────────┐
│                 YOUR DEVICE (Browser)                    │
│  ┌──────────┐    ┌────────────┐    ┌────────────────┐   │
│  │ VCF File  │───▶│ VCF Parser │───▶│  Risk Engine   │   │
│  │ (raw DNA) │    │ (in-memory)│    │ (CPIC lookup)  │   │
│  └──────────┘    └────────────┘    └───────┬────────┘   │
│       ❌ Never                              │            │
│       stored                               ▼            │
│                              ┌──────────────────────┐   │
│                              │ Drug + Gene + Risk    │   │
│                              │ (anonymized summary)  │───┼──▶ Gemini AI
│                              └──────────────────────┘   │   (explanation
│                                                         │    only)
│  ✅ Raw VCF never leaves     ✅ No database             │
│  ✅ No cookies/tracking      ✅ Auto-purge on close     │
└─────────────────────────────────────────────────────────┘
```

| Privacy Guarantee | How It's Implemented |
|-------------------|---------------------|
| **Zero Storage** | No database, no file system. VCF data exists only in memory during analysis |
| **Genomic Isolation** | Raw VCF never reaches the AI — only anonymized drug/gene/risk summaries |
| **Session Purge** | All data auto-clears on tab close + manual "Clear All Data" button |
| **No Tracking** | Zero cookies, zero analytics, zero third-party scripts |
| **API Transparency** | Every response includes `privacy.data_stored: false` metadata |

### 7. 🎨 Premium UI/UX Design
- **Apple-inspired glassmorphic design** with frosted glass panels and mesh gradient backgrounds
- **Framer Motion animations** throughout — smooth transitions, staggered card reveals
- **Full dark mode** with separate design tokens and color palettes
- **Interactive risk spectrum** showing where the patient falls on the Toxic ← → Safe ← → Ineffective scale
- **Expandable AI explanation cards** with structured clinical breakdowns
- **VCF parse warnings panel** with severity-coded icons (✕ error, ⚠ warning, ℹ info)
- **One-click JSON export** for integration with clinical EHR systems
- **Responsive design** that works on desktop, tablet, and mobile
- **Sanjeevani watermark** visible in both light and dark modes

### 8. 🛡️ Comprehensive Error Handling
- **Frontend validation**: File type (`.vcf` only), file size (5MB max), drug selection required
- **User-friendly error messages** — not generic "something went wrong" but specific, actionable guidance
- **Graceful missing annotation handling** — missing rsID, QUAL, FILTER, FORMAT fields all handled with warnings
- **Network error handling** with clear retry guidance
- **VCF parse warnings** displayed in a collapsible panel with line numbers and field names

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Next.js 14 Frontend                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────────┐  │
│  │VCF Upload │  │Drug Select│  │  Results Dashboard    │  │
│  │(drag/drop)│  │(6 drugs)  │  │  (risk cards + AI)    │  │
│  └─────┬─────┘  └─────┬─────┘  └──────────┬──────────┘  │
│        └───────────────┼───────────────────┘              │
│                        ▼                                  │
│              Next.js API Route                            │
│              POST /api/analyze                            │
│  ┌───────────┐  ┌────────────┐  ┌──────────────────────┐ │
│  │ VCF Parser │  │Risk Engine │  │ LLM Service          │ │
│  │ (v5, 7    │→ │CPIC Rules  │→ │ Gemini 2.0 Flash     │ │
│  │ exceptions)│  │ML Scoring  │  │ (structured output)  │ │
│  └───────────┘  └────────────┘  └──────────────────────┘ │
│        ↑                 ↑                                │
│  ┌───────────┐  ┌────────────┐                           │
│  │ 27 Variant │  │ 6 Drug-Gene│                           │
│  │ Definitions│  │ Risk Tables│                           │
│  │ (PharmVar) │  │ (CPIC)     │                           │
│  └───────────┘  └────────────┘                           │
└──────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | File | Lines | Purpose |
|--------|------|-------|---------|
| **VCF Parser** | `src/lib/vcf-parser.ts` | ~492 | Parse VCF v4.x, quality filtering, variant extraction, star allele calling, gene profile building |
| **CPIC Data** | `src/lib/cpic-data.ts` | ~514 | 27 variant definitions, dual-build coordinates, activity score thresholds, risk profiles, mechanism templates |
| **Risk Engine** | `src/lib/risk-engine.ts` | ~225 | Multi-factor risk computation, confidence scoring, wild-type inference, clinical recommendations |
| **LLM Service** | `src/lib/llm-service.ts` | ~198 | Gemini API integration, structured prompt engineering, fallback explanations |
| **Type System** | `src/lib/types.ts` | ~113 | TypeScript interfaces matching the required JSON output schema exactly |
| **API Route** | `src/app/api/analyze/route.ts` | ~137 | Request validation, pipeline orchestration, privacy metadata |
| **Frontend** | `src/app/page.tsx` | ~800 | Full interactive UI with drag-drop, animations, risk visualization |

---

## 🔬 How It Works — Technical Pipeline

### Step 1: VCF Parsing & Quality Control
```
Raw VCF → Line-by-line parsing → Quality filtering (QUAL≥20, FILTER=PASS, DP≥10)
        → FORMAT/SAMPLE extraction → Genotype (GT) calling → Chromosome normalization
```
- Supports VCF v4.x format
- Auto-detects genome build from header
- Handles tab-separated and whitespace-separated formats
- Filters 0/0 genotypes (homozygous reference = variant NOT present)

### Step 2: Pharmacogenomic Variant Identification
```
Parsed Records → rsID match (highest priority) → chr:pos match (fallback)
              → ±5bp fuzzy match (for indels) → Gene INFO tag match (last resort)
```
- Matches against **27 curated variant definitions** from PharmVar + dbSNP
- Supports both GRCh37 and GRCh38 coordinates simultaneously
- Deduplicates star alleles from multiple defining SNPs

### Step 3: Star Allele Calling & Diplotype Construction
```
Matched Variants → Group by gene → Determine allele activities
                → Resolve compound heterozygotes → Build diplotype string
```
- **Homozygous variant** (1/1): Both alleles carry the variant → e.g., *4/*4
- **Heterozygous variant** (0/1): One variant + one wild-type → e.g., *1/*4
- **Compound heterozygous**: Two different heterozygous variants in same gene → e.g., *2/*3

### Step 4: Activity Score → Phenotype Translation
```
Allele 1 Activity + Allele 2 Activity = Total Activity Score
                                         → Gene-specific CPIC threshold
                                         → Metabolizer Phenotype
```

| Gene | Poor Metabolizer | Intermediate | Normal | Rapid/Ultra-Rapid |
|------|-----------------|--------------|--------|-------------------|
| CYP2D6 | AS = 0 | AS 0.25–1.0 | AS 1.25–2.25 | AS > 2.25 |
| CYP2C19 | AS = 0 | AS 0.5–1.0 | AS 1.5–2.0 | AS > 2.0 |
| CYP2C9 | AS ≤ 0.5 | AS 1.0–1.5 | AS = 2.0 | — |
| SLCO1B1 | AS = 0 | AS ≤ 1.0 | AS ≥ 1.5 | — |
| TPMT | AS = 0 | AS ≤ 1.0 | AS ≥ 1.5 | — |
| DPYD | AS ≤ 0.5 | AS 1.0–1.5 | AS = 2.0 | — |

### Step 5: CPIC Risk Assessment
The risk engine maps phenotype + drug-specific pharmacology to a clinical risk label:

| Drug | PM Risk | Why |
|------|---------|-----|
| **Codeine** | Toxic | Can't convert codeine → morphine, parent drug accumulates |
| **Clopidogrel** | Ineffective | Can't bioactivate prodrug → no antiplatelet effect |
| **Warfarin** | Adjust Dosage | Slow clearance, but titratable with INR monitoring |
| **Simvastatin** | Adjust Dosage | Impaired hepatic uptake → systemic exposure ↑ |
| **Azathioprine** | Toxic | Deficient TPMT → TGN accumulation → myelosuppression |
| **Fluorouracil** | Toxic | DPD deficiency → >10x 5-FU exposure → fatal toxicity |

### Step 6: AI Clinical Explanation
```
Anonymized Result → Structured Prompt → Gemini 2.0 Flash → JSON Response
(drug + gene +        (5-field schema)    (temp=0.3,         (summary, mechanism,
 risk only)                                structured output)  effects, context, refs)
```

---

## 💊 Supported Drug–Gene Pairs

| Drug | Gene | Clinical Use | What Genetics Can Reveal |
|------|------|-------------|------------------------|
| **Codeine** | CYP2D6 | Pain relief | Poor Metabolizers get zero benefit; Ultra-Rapid Metabolizers risk fatal morphine toxicity |
| **Warfarin** | CYP2C9 | Blood clot prevention | Wrong dose = dangerous bleeding or stroke. *Note: VKORC1 not tested by this panel* |
| **Clopidogrel** | CYP2C19 | Heart attack/stroke prevention | Poor Metabolizers can't activate the drug — stents may clot |
| **Simvastatin** | SLCO1B1 | Cholesterol management | Impaired transporter → 2-4x drug exposure → rhabdomyolysis risk |
| **Azathioprine** | TPMT | Autoimmune diseases | Poor Metabolizers accumulate toxic metabolites → bone marrow failure. *Note: NUDT15 not tested* |
| **Fluorouracil** | DPYD | Cancer chemotherapy | DPD deficiency → severe, potentially fatal toxicity |

---

## 🛡️ Error Handling

### Frontend Validation
| Check | Error Message |
|-------|--------------|
| Non-.vcf file | *"Please upload a valid .vcf file. Only VCF (Variant Call Format) files are supported."* |
| File > 5MB | *"File too large. Maximum file size is 5MB."* |
| No file uploaded | *"Please upload a VCF file before analyzing."* |
| No drugs selected | *"Please select at least one drug to analyze."* |
| Network failure | *"Network error. Please check your connection and try again."* |

### Backend Validation
| Check | Error Message |
|-------|--------------|
| Empty VCF | *"VCF file is empty"* |
| Headers only | *"No actionable pharmacogenomic variants found..."* |
| All filtered | *"No variants passed quality filters..."* |
| Invalid format | Line-specific warnings with field names |

### Graceful Degradation
| Missing Data | Handling |
|-------------|---------|
| No rsID | Falls back to chr:pos matching |
| No QUAL score | Processes with lower confidence |
| No FORMAT/SAMPLE | Defaults genotype, shows warning |
| No Gemini API key | Uses pre-computed CPIC explanations |
| Gemini API failure | Falls back silently to pre-computed explanations |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14 (App Router) | Server-side API routes + React in one codebase |
| **Language** | TypeScript (strict) | Type safety is critical for genomic/medical data |
| **AI/LLM** | Google Gemini 2.0 Flash | Fast structured JSON output, handles medical terminology |
| **UI Animations** | Framer Motion | Smooth GPU-accelerated animations for glassmorphic design |
| **Styling** | Custom CSS Design System | Apple-inspired liquid glass tokens, not a template |
| **Icons** | Lucide React | Clean, consistent medical/scientific iconography |
| **VCF Parser** | Custom TypeScript (v5) | No existing parser handled our 7 edge cases |
| **Risk Engine** | Custom TypeScript | CPIC-aligned algorithmic risk with ML confidence scoring |

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 18+ (recommended: 22.x)
- **npm** or **yarn**

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/vishwash-v/Sanjeevani.git
cd pharma-guard

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key (optional)

# 4. Run the development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and you're ready to go!

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI explanations | **Optional** — fallback explanations work without it |

> 💡 **Don't have a key?** Sanjeevani works perfectly without one — you'll get pre-computed CPIC-based explanations. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) for the full AI experience.

### Deployment

Sanjeevani deploys to **Vercel** with zero configuration:

```bash
npm install -g vercel
vercel --prod
```

Add `GEMINI_API_KEY` in Vercel Environment Variables settings.

---

## 📖 Usage Guide

### Step-by-Step

1. **Upload VCF File** — Drag & drop or click to browse (supports VCF v4.x, max 5MB)
2. **Select Drugs** — Choose one or more of the 6 supported drugs (or "Select All")
3. **Analyze** — Click "Analyze Pharmacogenomic Risk" and wait ~3 seconds
4. **Review Results** — Each drug gets a risk card with:
   - Risk label (color-coded: green=Safe, yellow=Adjust, red=Toxic, gray=Ineffective)
   - Interactive risk spectrum bar
   - Confidence score
   - Diplotype and phenotype
   - Detected variants with rsIDs and clinical significance
   - AI-generated clinical explanation (expandable)
   - CPIC guideline reference
5. **Export** — Copy JSON to clipboard or download as file

### Quick Demo
Click **"Try a sample file"** in the upload area to load a pre-configured VCF with compound heterozygous CYP2C19 variants.

---

## 📁 Sample VCF Files for Testing

All sample files are included in `public/sample-vcf/`:

### Clinical Scenarios
| File | Expected Result |
|------|----------------|
| `sample_patient.vcf` | Multiple high-risk alerts across all 6 genes |
| `cyp2d6_poor_metabolizer_grch38.vcf` | **Toxic** for Codeine — CYP2D6 *4/*4 (Poor Metabolizer) |
| `multi_gene_grch38.vcf` | High risk across multiple drugs simultaneously |
| `normal_metabolizer_grch38.vcf` | **Safe** — demonstrates normal function variants |

### Exception Test Cases (`public/sample-vcf/exceptions/`)
| File | What It Tests |
|------|---------------|
| `exception_chr_prefix.vcf` | Chromosome prefix normalization (chr22 → 22) |
| `exception_compound_het.vcf` | Compound heterozygous detection (*2/*3) |
| `exception_empty.vcf` | Empty file handling |
| `exception_format_mismatch.vcf` | FORMAT/SAMPLE field count mismatch |
| `exception_low_qual.vcf` | Low quality variant filtering |
| `exception_missing_gene.vcf` | Missing GENE INFO tag fallback |
| `exception_multi_gene.vcf` | Multi-gene same-file handling |

---

## 📡 API Documentation

### `POST /api/analyze`

Analyze a VCF file for pharmacogenomic risks.

**Request**: `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `vcfFile` | File | VCF file (.vcf), max 5MB |
| `drugs` | String | Comma-separated drug names (e.g., `CODEINE,WARFARIN`) |

**Response** (JSON):

```json
{
  "success": true,
  "results": [
    {
      "patient_id": "PATIENT_XXX",
      "drug": "CODEINE",
      "timestamp": "2026-02-20T...",
      "risk_assessment": {
        "risk_label": "Toxic",
        "cpic_clinical_action": "Avoid codeine use",
        "confidence_score": 0.85,
        "severity": "critical"
      },
      "pharmacogenomic_profile": {
        "primary_gene": "CYP2D6",
        "diplotype": "*4/*4",
        "phenotype": "PM",
        "detected_variants": [
          {
            "rsid": "rs3892097",
            "chromosome": "22",
            "position": 42128945,
            "ref_allele": "C",
            "alt_allele": "T",
            "genotype": "1/1",
            "gene": "CYP2D6",
            "clinical_significance": "*4: Splicing defect — complete loss of enzyme activity [rsID]"
          }
        ]
      },
      "clinical_recommendation": {
        "action": "AVOID CODEINE...",
        "dosing_guidance": "...",
        "alternative_drugs": ["Acetaminophen", "NSAIDs", "Morphine (direct)"],
        "monitoring_recommendations": "...",
        "cpic_guideline_reference": "CPIC Guideline for CYP2D6 and Codeine (Crews et al., 2021)"
      },
      "llm_generated_explanation": {
        "summary": "...",
        "mechanism": "...",
        "variant_specific_effects": "...",
        "clinical_context": "...",
        "references": ["..."]
      },
      "quality_metrics": {
        "vcf_parsing_success": true,
        "variants_detected": 1,
        "pharmacogenes_found": 1,
        "llm_explanation_generated": true,
        "processing_time_ms": 1250
      }
    }
  ],
  "vcf_warnings": [...],
  "meta": {
    "total_drugs_analyzed": 1,
    "llm_enabled": true,
    "privacy": {
      "data_stored": false,
      "raw_vcf_sent_to_llm": false,
      "session_only": true
    }
  },
  "methodology": {
    "risk_label_derivation": "Algorithmically computed from genotype-to-phenotype translation using CPIC-standardized activity scores...",
    "data_sources": ["CPIC", "PharmVar", "dbSNP", "PharmGKB"]
  },
  "clinical_disclaimer": "Risk labels are algorithmically derived..."
}
```

### `POST /api/parse-vcf` (Debug Endpoint)

Returns raw parsing output for debugging — shows every parsed record, matched variants, gene profiles, and parse warnings.

---

## 📚 Data Sources & References

### Pharmacogenomics Databases

| Source | Usage | License |
|--------|-------|---------|
| [CPIC](https://cpicpgx.org/) | Star allele functional status, activity values, dosing guidelines | Open Access |
| [PharmGKB](https://www.pharmgkb.org/) | Clinical annotations, gene-drug evidence levels | CC BY-SA 4.0 |
| [PharmVar](https://www.pharmvar.org/) | Star allele definitions, variant nomenclature | Open Access |
| [NCBI dbSNP](https://www.ncbi.nlm.nih.gov/snp/) | Variant rsIDs, GRCh37/GRCh38 genome coordinates | Public Domain |

### CPIC Clinical Guidelines

1. **Crews KR, et al.** (2021). CPIC Guideline for CYP2D6, OPRM1, and COMT Genotypes and Select Opioid Therapy. *Clin Pharmacol Ther*, 110(4), 888–896. [PMC8249478](https://pmc.ncbi.nlm.nih.gov/articles/PMC8249478/) — *CYP2D6 → Codeine*

2. **Lee CR, et al.** (2022). CPIC Guideline for CYP2C19 and Clopidogrel Therapy: 2022 Update. *Clin Pharmacol Ther*, 112(5), 959–967. [PMC9035072](https://pmc.ncbi.nlm.nih.gov/articles/PMC9035072/) — *CYP2C19 → Clopidogrel*

3. **Johnson JA, et al.** (2017). CPIC Guideline for Pharmacogenetics-Guided Warfarin Dosing: 2017 Update. *Clin Pharmacol Ther*, 102(3), 397–404. [PMC5546947](https://pmc.ncbi.nlm.nih.gov/articles/PMC5546947/) — *CYP2C9/VKORC1 → Warfarin*

4. **Cooper-DeHoff RM, et al.** (2022). CPIC Guideline for SLCO1B1, ABCG2, and CYP2C9 and Statin-Associated Musculoskeletal Symptoms. *Clin Pharmacol Ther*, 111(5), 1007–1021. [PMC8799009](https://pmc.ncbi.nlm.nih.gov/articles/PMC8799009/) — *SLCO1B1 → Simvastatin*

5. **Relling MV, et al.** (2019). CPIC Guideline for Thiopurine Dosing Based on TPMT and NUDT15 Genotypes: 2018 Update. *Clin Pharmacol Ther*, 105(5), 1095–1105. [PMC6395087](https://pmc.ncbi.nlm.nih.gov/articles/PMC6395087/) — *TPMT → Azathioprine*

6. **Amstutz U, et al.** (2018). CPIC Guideline for Dihydropyrimidine Dehydrogenase Genotype and Fluoropyrimidine Dosing: 2017 Update. *Clin Pharmacol Ther*, 103(2), 210–216. [PMC5760397](https://pmc.ncbi.nlm.nih.gov/articles/PMC5760397/) — *DPYD → Fluorouracil*

### Methodology References

7. **Caudle KE, et al.** (2017). Standardizing CYP2D6 Genotype to Phenotype Translation: Consensus Recommendations from CPIC and DPWG. *Clin Pharmacol Ther*, 102(1), 33–36. [PMC5292679](https://pmc.ncbi.nlm.nih.gov/articles/PMC5292679/) — *Activity score methodology*

8. **Li B, Sangkuhl K, et al.** (2024). How to Run PharmCAT. *Clin Pharmacol Ther*, 116(5). [PMC9232983](https://pmc.ncbi.nlm.nih.gov/articles/PMC9232983/) — *VCF → Star allele reference*

9. **Sangkuhl K, et al.** (2020). PharmVar Star Allele Nomenclature. *Clin Pharmacol Ther*, 107(1), 183–186. [PMC6977333](https://pmc.ncbi.nlm.nih.gov/articles/PMC6977333/) — *Nomenclature system*

10. **Bousman CA, et al.** (2023). PGx Clinical Decision Support in EHRs. *Pharmacogenomics*, 24(4), 219–229. [PMC9840660](https://pmc.ncbi.nlm.nih.gov/articles/PMC9840660/) — *CDS patterns*

---

## 🏆 What Makes Sanjeevani Unique

| Aspect | Typical Hackathon Projects | Sanjeevani |
|--------|---------------------------|------------|
| **Input Handling** | Hardcoded sample data | Production-grade VCF parser with 7 exception handlers |
| **Genome Builds** | Single build or none | Dual-build (GRCh37 + GRCh38) with auto-detection |
| **Risk Logic** | Simple if/else or lookup | Multi-factor algorithmic engine with drug-specific pharmacology |
| **Confidence** | Binary yes/no | ML-calibrated confidence scoring (0.40–0.98) |
| **Star Alleles** | Basic SNP matching | Compound heterozygous resolution, weighted matching |
| **Privacy** | Database storage | Zero-storage, in-memory only, auto-purge |
| **AI Usage** | AI makes decisions | AI only explains — risk decisions are algorithmic |
| **Fallback** | Breaks without API key | Full functionality with pre-computed CPIC explanations |
| **Clinical Accuracy** | Generic labels | SLCO1B1=transporter, VKORC1/NUDT15 disclaimers, CPIC citations |
| **Error Handling** | Generic errors | Line-specific warnings with field names and severity levels |

---

## 🧗 Challenges We Faced

**The VCF parser was our biggest struggle.** We went through **5 iterations** — each time real-world VCF files revealed new edge cases: missing FILTER columns, multi-allelic sites, genome builds not declared in headers, genotype quality issues. Version 5 handles 7 distinct exception scenarios because in healthcare, "it works on the happy path" isn't acceptable. 

**Star allele calling is genuinely complex.** Unlike simple SNP lookups, star alleles can involve multiple variants on the same chromosome. We implemented weighted matching that handles partial hits, compound heterozygotes, and quality-weighted confidence — a challenge usually tackled by specialized bioinformatics tools like PharmCAT.

**Balancing AI helpfulness with clinical safety.** We wanted Gemini to explain results clearly, but couldn't let it hallucinate medical advice. Our solution: the risk engine makes decisions algorithmically using validated CPIC data, then the LLM receives only the confirmed results for explanation. The AI adds clarity — it never makes clinical decisions.

**Clinical accuracy required domain expertise.** Getting details right — like SLCO1B1 being a transporter (not an enzyme), or that Codeine PM means toxicity while Clopidogrel PM means ineffectiveness — required deep reading of CPIC guidelines. We studied 10+ published papers to ensure every risk label and recommendation matches published clinical evidence.

---

## 👥 Team NextGen

| Member | Role |
|--------|------|
| **Vishwas H V** | Lead Developer — Architecture, VCF Parser, Risk Engine, UI |
| **Tarun Kumar** | Backend & AI — LLM Integration, API Design, Clinical Validation |
| **Vankadara Navneet** | Data & Testing — CPIC Data Curation, Sample VCF Creation, QA |
| **Shanmukeswar Reddy** | Frontend & UX — Glassmorphic UI, Animations, Dark Mode, Branding |

---

## ⚠️ Disclaimer

Sanjeevani is built for **research and educational purposes only**. It is not a certified medical device and should not replace professional pharmacogenomic consultation. Risk labels are algorithmically derived from CPIC-standardized activity scores and are intended to **assist — not replace** — clinical decision-making. The prescribing clinician's judgment, informed by published CPIC guidelines, remains the final authority on therapeutic decisions.

---

<div align="center">

Built with sleepless nights and strong coffee ☕🧬

**RIFT 2026 Hackathon** | HealthTech Track | PS3

#RIFT2026 #Sanjeevani #Pharmacogenomics #AIinHealthcare #PrecisionMedicine

</div>
