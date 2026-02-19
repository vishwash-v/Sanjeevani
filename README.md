# Sanjeevani 🧬

> *"Sanjeevani"* — the mythical herb from Indian mythology that could bring the dead back to life. We named our project after it because we believe the right information, at the right time, can quite literally save lives.

**RIFT 2026 Hackathon • HealthTech Track • PS3**

---

## The Problem That Kept Us Up at Night

Every year, **adverse drug reactions kill more people than car accidents.** Not because doctors prescribe the wrong drugs — but because two patients with identical symptoms can have wildly different genetic makeups. A painkiller that works perfectly for one person can be *life-threatening* for another.

The science to prevent this already exists. It's called **pharmacogenomics** — using a patient's genetic profile to predict how they'll respond to specific medications. Organizations like CPIC (Clinical Pharmacogenomics Implementation Consortium) have published detailed, peer-reviewed guidelines for dozens of drugs.

But here's the painful truth: **most of this knowledge stays locked in research papers.** Clinicians don't have time to manually cross-reference a patient's VCF file against star allele tables, calculate activity scores, and look up CPIC dosing recommendations. The gap between what we *know* and what we *use* in practice is costing lives.

**Sanjeevani bridges that gap.**

---

## What Sanjeevani Actually Does

You upload a patient's VCF file (the standard format for genomic variant data). You pick the drugs you want to check. Sanjeevani does the rest:

1. **Parses the VCF file** — extracts every variant, handles edge cases like low-quality reads, multi-allelic sites, and both GRCh37 and GRCh38 genome builds
2. **Identifies pharmacogenomic variants** — maps variants to 6 critical genes (CYP2D6, CYP2C9, CYP2C19, SLCO1B1, TPMT, DPYD) using coordinates from PharmVar and dbSNP
3. **Calls star alleles** — determines the patient's diplotype (e.g., \*1/\*4) from detected variants
4. **Assigns phenotype** — calculates the CPIC activity score and translates it to a metabolizer status (Normal, Poor, Intermediate, Rapid, or Ultra-Rapid)
5. **Predicts risk** — runs a multi-factor risk engine aligned with CPIC guidelines, outputting one of: Safe, Dose Adjustment Needed, Toxic, or Ineffective
6. **Explains in plain language** — sends an anonymized summary (never the raw VCF) to Google Gemini 2.0 Flash, which generates a clear, mechanism-based clinical explanation

The entire pipeline runs in seconds. No PhD required to interpret the output.

### Supported Drug–Gene Pairs

| Drug | Gene | What It Treats | Why Genetics Matter |
|------|------|---------------|-------------------|
| **Codeine** | CYP2D6 | Pain relief | Poor Metabolizers get zero benefit; Ultra-Rapid Metabolizers risk morphine toxicity |
| **Warfarin** | CYP2C9 | Blood clotting | Wrong dose = bleeding complications or stroke |
| **Clopidogrel** | CYP2C19 | Heart attack prevention | Poor Metabolizers can't activate the drug — stents may clot |
| **Simvastatin** | SLCO1B1 | Cholesterol | Certain variants cause dangerous muscle breakdown (rhabdomyolysis) |
| **Azathioprine** | TPMT | Autoimmune diseases | Poor Metabolizers accumulate toxic metabolites → bone marrow suppression |
| **Fluorouracil** | DPYD | Cancer chemotherapy | Reduced enzyme activity → severe, potentially fatal toxicity |

---

## Why Sanjeevani Is Different

We didn't build another "upload and get a report" tool. Here's what sets us apart:

### 1. We Actually Parse Real VCF Files

Most hackathon projects hardcode a few sample inputs. We built a **production-grade VCF parser** that handles:
- Both GRCh37 and GRCh38 genome builds (auto-detected)
- Low-quality variant filtering (QUAL < 20, FILTER ≠ PASS, DP < 10)
- Multi-allelic sites and complex genotypes
- Missing fields and malformed records (with warnings, not crashes)
- Real-world VCF files from clinical sequencing pipelines

We went through **five iterations** of the parser (v1 through v5), each time discovering new edge cases from real genomic data. The final version handles 7 distinct exception scenarios — because in healthcare, "it works on the happy path" isn't good enough.

### 2. The Risk Engine Is Algorithmic, Not a Lookup Table

Our risk engine doesn't just say "this variant = bad." It computes a **multi-factor risk score** considering:
- **Activity score calculation** following CPIC's standardized methodology (Caudle et al., 2017)
- **Variant functional impact** (no-function, decreased-function, increased-function, normal-function)
- **Diplotype combination effects** — because carrying one bad allele is different from carrying two
- **Drug-specific pharmacology** — the same phenotype can mean "toxic" for one drug and "ineffective" for another
- **ML-calibrated confidence scoring** that honestly tells you how certain the prediction is

### 3. Privacy Isn't an Afterthought — It's the Architecture

Genomic data is the most sensitive information that exists. It's immutable (you can't change your DNA), it's uniquely identifying, and it affects your entire family. We took this seriously:

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

- **Zero Storage** — No database. No file system. Everything is in-memory and gone when processing ends.
- **Genomic Isolation** — The AI never sees your raw VCF. Only anonymized drug/gene/risk summaries.
- **Session Purge** — Close the tab? Everything's gone. There's also a manual "Clear All Data" button.
- **No Tracking** — No cookies, no analytics, no third-party scripts. Nothing.
- **API Transparency** — Every response includes `privacy.data_stored: false` so you can verify programmatically.

### 4. The UI Isn't Just Functional — It's Beautiful

We built a premium glassmorphic interface with:
- Apple-inspired liquid glass design system with frosted panels and mesh gradient backgrounds
- Smooth Framer Motion animations throughout
- Full dark mode support (with separate design tokens for both themes)
- Risk spectrum visualizations that show where you fall on the Toxic → Safe → Ineffective scale
- Expandable AI explanation cards with structured clinical breakdowns
- One-click JSON export for integration with clinical systems

---

## The Challenges We Faced (And How We Solved Them)

**The VCF parser was our biggest headache.** Real-world VCF files are messy. We started with a simple parser and kept hitting edge cases — files with missing FILTER columns, multi-allelic variants encoded in unexpected ways, genome builds that weren't explicitly declared in the header. Each fix revealed two more problems. Five versions later, we had something robust.

**Star allele calling from raw variants is genuinely hard.** Unlike simple SNP lookups, star alleles can involve combinations of multiple variants. A patient with three specific SNPs on the same chromosome might be \*6, but any two of those three could be noise. We had to implement a weighted matching system that accounts for partial hits and variant quality.

**Balancing AI helpfulness with accuracy was tricky.** We wanted Gemini to explain results in plain language, but we couldn't let it hallucinate medical advice. Our solution: we pre-compute the risk assessment algorithmically using validated CPIC data, then send only the confirmed results to the LLM for explanation. The AI adds clarity — it doesn't make clinical decisions.

**Making it work on real data, not just demo data.** We created multiple sample VCF files representing different clinical scenarios — a CYP2D6 Poor Metabolizer (\*4/\*4), a multi-gene high-risk patient, a normal metabolizer control. We tested against actual pharmacogenomic expectations and iterated until every result matched published CPIC guidelines.

---

## Tech Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|----------------|
| **Framework** | Next.js 14 | Server-side API routes + React frontend in one codebase |
| **Language** | TypeScript | Genomic data needs type safety — one wrong type can mean wrong medical advice |
| **AI/LLM** | Google Gemini 2.0 Flash | Fast, structured JSON output, handles medical terminology well |
| **Animations** | Framer Motion | Smooth, GPU-accelerated animations for the glassmorphic UI |
| **Styling** | Custom CSS Design System | Apple-inspired liquid glass tokens — not a generic template |
| **Icons** | Lucide React | Clean, consistent medical/scientific iconography |
| **VCF Parser** | Custom (TypeScript) | No existing parser handled our edge cases — we built our own |
| **Risk Engine** | Custom (TypeScript) | CPIC-aligned algorithmic risk with confidence scoring |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/vishwash-v/Sanjeevani.git
cd pharma-guard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Gemini API key (optional — fallback explanations work without it)

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're ready to go.

> **Don't have a Gemini API key?** No problem. Sanjeevani works without one — you'll get pre-computed clinical explanations instead of AI-generated ones. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) if you want the full experience.

### Try It Out

We've included sample VCF files in `public/sample-vcf/` so you can test immediately:

| File | What It Demonstrates |
|------|---------------------|
| `sample_patient.vcf` | Multiple high-risk alerts across all 6 genes |
| `cyp2d6_poor_metabolizer_grch38.vcf` | **Toxic** result for Codeine — Poor Metabolizer with \*4/\*4 diplotype |
| `multi_gene_grch38.vcf` | High risk across multiple drugs simultaneously |
| `normal_metabolizer_grch38.vcf` | **Safe** results — demonstrates normal function variants |

Or just click **"Try a sample file"** in the UI — it loads a demo VCF automatically.

---

## How the Pipeline Works (Technical Deep Dive)

```
VCF File → Parse → Identify Variants → Call Star Alleles → Calculate Activity Score
→ Assign Phenotype → Run Risk Engine → Generate Explanation → Structured JSON Output
```

### Step 1: VCF Parsing (v5 — Edge-Case Hardened)
Our parser reads VCF v4.x files and extracts variant records. It auto-detects the genome build (GRCh37 vs. GRCh38) from the header and handles 7 validated exception scenarios: low quality variants, missing FILTER fields, multi-allelic sites, phased genotypes, structural variants, and more.

### Step 2: Variant → Gene Mapping
Each variant is checked against our dual-build coordinate database (derived from PharmVar + dbSNP). We maintain separate coordinate mappings for GRCh37 and GRCh38 for all 6 pharmacogenes.

### Step 3: Star Allele Calling
Detected variants are matched against known star allele definitions. The system handles partial matches (when sequencing coverage is incomplete) by using a weighted scoring model and reports confidence accordingly.

### Step 4: Activity Score → Phenotype
Following CPIC's standardized methodology, each allele gets a function value (0 for no-function, 0.5 for decreased, 1.0 for normal, 1.5+ for increased). The sum gives the activity score, which maps to a metabolizer phenotype.

### Step 5: Risk Engine
The risk engine combines phenotype, drug-specific pharmacology, and CPIC recommendations to produce a risk label (Safe, Dose Adjustment, Toxic, or Ineffective) with a confidence score. It's not a simple lookup — the same phenotype can map to different risks for different drugs.

### Step 6: AI Explanation
Anonymized results (drug name, gene, diplotype, phenotype, risk label — never the raw VCF) are sent to Gemini 2.0 Flash, which returns a structured explanation covering mechanism of action, clinical implications, and alternative recommendations.

---

## API Reference

### `POST /api/analyze`

| Field | Type | Description |
|-------|------|-------------|
| `vcfFile` | File | VCF file (.vcf), max 5MB |
| `drugs` | String | Comma-separated drug names |

Returns structured JSON with risk assessments, pharmacogenomic profiles, clinical recommendations, and AI-generated explanations. Every response includes `meta.privacy` confirming zero data storage.

---

## Data Sources & References

All pharmacogenomic data comes from peer-reviewed, publicly available sources:

### Clinical Guidelines
1. **Crews KR, et al.** (2021). CPIC Guideline for CYP2D6 and Opioid Therapy. *Clin Pharmacol Ther*, 110(4). [PMC8249478](https://pmc.ncbi.nlm.nih.gov/articles/PMC8249478/)
2. **Lee CR, et al.** (2022). CPIC Guideline for CYP2C19 and Clopidogrel. *Clin Pharmacol Ther*, 112(5). [PMC9035072](https://pmc.ncbi.nlm.nih.gov/articles/PMC9035072/)
3. **Johnson JA, et al.** (2017). CPIC Guideline for Warfarin Dosing. *Clin Pharmacol Ther*, 102(3). [PMC5546947](https://pmc.ncbi.nlm.nih.gov/articles/PMC5546947/)
4. **Cooper-DeHoff RM, et al.** (2022). CPIC Guideline for SLCO1B1 and Statins. *Clin Pharmacol Ther*, 111(5). [PMC8799009](https://pmc.ncbi.nlm.nih.gov/articles/PMC8799009/)
5. **Relling MV, et al.** (2019). CPIC Guideline for TPMT and Thiopurines. *Clin Pharmacol Ther*, 105(5). [PMC6395087](https://pmc.ncbi.nlm.nih.gov/articles/PMC6395087/)
6. **Amstutz U, et al.** (2018). CPIC Guideline for DPYD and Fluoropyrimidines. *Clin Pharmacol Ther*, 103(2). [PMC5760397](https://pmc.ncbi.nlm.nih.gov/articles/PMC5760397/)

### Databases
| Source | What We Use It For |
|--------|-------------------|
| [CPIC](https://cpicpgx.org/) | Star allele functions, activity values, dosing guidelines |
| [PharmGKB](https://www.pharmgkb.org/) | Clinical annotations, evidence levels |
| [PharmVar](https://www.pharmvar.org/) | Star allele definitions, variant nomenclature |
| [NCBI dbSNP](https://www.ncbi.nlm.nih.gov/snp/) | Variant coordinates for both genome builds |

### Methodology
7. **Caudle KE, et al.** (2017). Standardizing CYP2D6 Genotype to Phenotype Translation. *Clin Pharmacol Ther*, 102(1). [PMC5292679](https://pmc.ncbi.nlm.nih.gov/articles/PMC5292679/)
8. **Li B, Sangkuhl K, et al.** (2024). Running PharmCAT. *Clin Pharmacol Ther*, 116(5). [PMC9232983](https://pmc.ncbi.nlm.nih.gov/articles/PMC9232983/)
9. **Sangkuhl K, et al.** (2020). PharmVar Star Allele Nomenclature. *Clin Pharmacol Ther*, 107(1). [PMC6977333](https://pmc.ncbi.nlm.nih.gov/articles/PMC6977333/)
10. **Bousman CA, et al.** (2023). PGx Clinical Decision Support in EHRs. *Pharmacogenomics*, 24(4). [PMC9840660](https://pmc.ncbi.nlm.nih.gov/articles/PMC9840660/)

---

## 👥 Team

- [Team Member Names]

---

## ⚠️ Disclaimer

Sanjeevani is built for **research and educational purposes**. It is not a certified medical device and should not replace professional pharmacogenomic consultation. Always work with a qualified healthcare provider when making medication decisions based on genetic information.

---

Built with sleepless nights and strong coffee for **RIFT 2026** ☕🧬

#RIFT2026 #Sanjeevani #Pharmacogenomics #AIinHealthcare #PrecisionMedicine
