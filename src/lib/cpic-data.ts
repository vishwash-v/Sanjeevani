// ============================================================
// Sanjeevani — CPIC Pharmacogenomics Data (v3)
// Dual genome build (GRCh37 + GRCh38) + algorithmic risk
//
// DATA SOURCES (all publicly available):
//   • Star allele functional status & activity values:
//     CPIC Allele Functionality Table via api.cpicpgx.org/v1/allele
//     (Clinical Pharmacogenetics Implementation Consortium)
//   • Variant rsIDs & genome coordinates (GRCh37 + GRCh38):
//     PharmVar (www.pharmvar.org) & NCBI dbSNP (www.ncbi.nlm.nih.gov/snp)
//   • Clinical annotations & gene-drug evidence:
//     PharmGKB (www.pharmgkb.org) — Creative Commons BY-SA 4.0
//   • Drug interaction types & dosing guidelines:
//     CPIC Guidelines published in Clinical Pharmacology & Therapeutics
//
// GENES COVERED (6):
//   CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
// ============================================================

import { GeneSymbol, Phenotype, RiskLabel, Severity, DrugName } from './types';

// ─── Variant Record: with BOTH genome build coordinates ───
export interface VariantDefinition {
    rsid: string;
    gene: GeneSymbol;
    chromosome: string;
    position37: number;   // GRCh37/hg19
    position38: number;   // GRCh38/hg38
    refAllele: string;
    altAlleles: string[];  // Multiple possible alt alleles
    starAllele: string;
    activityValue: number;
    functionalStatus: 'no_function' | 'decreased_function' | 'normal_function' | 'increased_function';
    significance: string;
}

// ─── Pharmacogenomic variant database (sourced from CPIC + PharmVar + dbSNP) ───
export const VARIANT_DATABASE: VariantDefinition[] = [
    // ──────── CYP2D6 (chr22) ────────
    { rsid: 'rs3892097', gene: 'CYP2D6', chromosome: '22', position37: 42526694, position38: 42128945, refAllele: 'C', altAlleles: ['T', 'A'], starAllele: '*4', activityValue: 0, functionalStatus: 'no_function', significance: 'Splicing defect (IVS3+1G>A) — complete loss of enzyme activity' },
    { rsid: 'rs5030655', gene: 'CYP2D6', chromosome: '22', position37: 42525085, position38: 42127336, refAllele: 'T', altAlleles: ['TA'], starAllele: '*6', activityValue: 0, functionalStatus: 'no_function', significance: 'Frameshift deletion — truncated non-functional protein' },
    { rsid: 'rs1065852', gene: 'CYP2D6', chromosome: '22', position37: 42526763, position38: 42129014, refAllele: 'C', altAlleles: ['T'], starAllele: '*10', activityValue: 0.25, functionalStatus: 'decreased_function', significance: 'P34S missense — unstable enzyme with reduced catalytic activity' },
    { rsid: 'rs16947', gene: 'CYP2D6', chromosome: '22', position37: 42524947, position38: 42127198, refAllele: 'G', altAlleles: ['A'], starAllele: '*2', activityValue: 1.0, functionalStatus: 'normal_function', significance: 'R296C — normal enzymatic function maintained' },
    { rsid: 'rs1135840', gene: 'CYP2D6', chromosome: '22', position37: 42524244, position38: 42126495, refAllele: 'C', altAlleles: ['G'], starAllele: '*2', activityValue: 1.0, functionalStatus: 'normal_function', significance: 'S486T — normal function variant' },
    { rsid: 'rs28371725', gene: 'CYP2D6', chromosome: '22', position37: 42526006, position38: 42128257, refAllele: 'C', altAlleles: ['T'], starAllele: '*41', activityValue: 0.5, functionalStatus: 'decreased_function', significance: 'Splicing defect — reduced mRNA expression and enzyme activity' },
    { rsid: 'rs28371706', gene: 'CYP2D6', chromosome: '22', position37: 42522613, position38: 42124864, refAllele: 'C', altAlleles: ['T'], starAllele: '*17', activityValue: 0.5, functionalStatus: 'decreased_function', significance: 'T107I — reduced substrate affinity and catalytic activity' },
    { rsid: 'rs5030862', gene: 'CYP2D6', chromosome: '22', position37: 42525772, position38: 42128023, refAllele: 'G', altAlleles: ['A'], starAllele: '*8', activityValue: 0, functionalStatus: 'no_function', significance: 'G169R — complete loss of function' },
    { rsid: 'rs5030865', gene: 'CYP2D6', chromosome: '22', position37: 42524564, position38: 42126815, refAllele: 'T', altAlleles: ['C'], starAllele: '*14', activityValue: 0, functionalStatus: 'no_function', significance: 'P34S + G169R — non-functional enzyme' },
    { rsid: 'rs769258', gene: 'CYP2D6', chromosome: '22', position37: 42526505, position38: 42128756, refAllele: 'G', altAlleles: ['A'], starAllele: '*3', activityValue: 0, functionalStatus: 'no_function', significance: 'Frameshift (2549delA) — no functional protein' },

    // ──────── CYP2C19 (chr10) ────────
    { rsid: 'rs4244285', gene: 'CYP2C19', chromosome: '10', position37: 96541616, position38: 94781859, refAllele: 'G', altAlleles: ['A'], starAllele: '*2', activityValue: 0, functionalStatus: 'no_function', significance: 'Aberrant splice site — exon 5 skipping → premature stop' },
    { rsid: 'rs4986893', gene: 'CYP2C19', chromosome: '10', position37: 96540410, position38: 94780653, refAllele: 'G', altAlleles: ['A'], starAllele: '*3', activityValue: 0, functionalStatus: 'no_function', significance: 'W212X premature stop codon — truncated non-functional protein' },
    { rsid: 'rs12248560', gene: 'CYP2C19', chromosome: '10', position37: 96521657, position38: 94761900, refAllele: 'C', altAlleles: ['T'], starAllele: '*17', activityValue: 1.5, functionalStatus: 'increased_function', significance: 'Promoter variant -806C>T — increased transcription' },
    { rsid: 'rs28399504', gene: 'CYP2C19', chromosome: '10', position37: 96522463, position38: 94762706, refAllele: 'A', altAlleles: ['G'], starAllele: '*4', activityValue: 0, functionalStatus: 'no_function', significance: 'Initiation codon variant — abolished translation' },

    // ──────── CYP2C9 (chr10) ────────
    { rsid: 'rs1799853', gene: 'CYP2C9', chromosome: '10', position37: 96702047, position38: 94942290, refAllele: 'C', altAlleles: ['T'], starAllele: '*2', activityValue: 0.5, functionalStatus: 'decreased_function', significance: 'R144C missense — 30-40% reduced S-warfarin hydroxylation' },
    { rsid: 'rs1057910', gene: 'CYP2C9', chromosome: '10', position37: 96741053, position38: 94981296, refAllele: 'A', altAlleles: ['C'], starAllele: '*3', activityValue: 0.25, functionalStatus: 'decreased_function', significance: 'I359L missense — 80-90% reduced S-warfarin hydroxylation' },
    { rsid: 'rs56165452', gene: 'CYP2C9', chromosome: '10', position37: 96709039, position38: 94949282, refAllele: 'C', altAlleles: ['G'], starAllele: '*5', activityValue: 0.25, functionalStatus: 'decreased_function', significance: 'D360E — significantly reduced enzyme activity' },
    { rsid: 'rs28371686', gene: 'CYP2C9', chromosome: '10', position37: 96731944, position38: 94972187, refAllele: 'A', altAlleles: ['G'], starAllele: '*6', activityValue: 0, functionalStatus: 'no_function', significance: 'Frameshift — non-functional enzyme' },

    // ──────── SLCO1B1 (chr12) ────────
    { rsid: 'rs4149056', gene: 'SLCO1B1', chromosome: '12', position37: 21331549, position38: 21178615, refAllele: 'T', altAlleles: ['C'], starAllele: '*5', activityValue: 0, functionalStatus: 'decreased_function', significance: 'V174A — impaired OATP1B1 membrane localization, 3-4x increased statin AUC' },
    { rsid: 'rs2306283', gene: 'SLCO1B1', chromosome: '12', position37: 21329738, position38: 21176804, refAllele: 'A', altAlleles: ['G'], starAllele: '*1B', activityValue: 1.0, functionalStatus: 'normal_function', significance: 'N130D — normal-to-increased transport function' },

    // ──────── TPMT (chr6) ────────
    { rsid: 'rs1800462', gene: 'TPMT', chromosome: '6', position37: 18130918, position38: 18139027, refAllele: 'C', altAlleles: ['G'], starAllele: '*2', activityValue: 0, functionalStatus: 'no_function', significance: 'A80P — protein misfolding, complete loss of activity' },
    { rsid: 'rs1800460', gene: 'TPMT', chromosome: '6', position37: 18130845, position38: 18138954, refAllele: 'C', altAlleles: ['T', 'A'], starAllele: '*3B', activityValue: 0, functionalStatus: 'no_function', significance: 'A154T — accelerated degradation, undetectable enzyme' },
    { rsid: 'rs1142345', gene: 'TPMT', chromosome: '6', position37: 18130687, position38: 18138796, refAllele: 'A', altAlleles: ['G'], starAllele: '*3C', activityValue: 0, functionalStatus: 'no_function', significance: 'Y240C — protein aggregation, complete catalytic loss' },

    // ──────── DPYD (chr1) ────────
    { rsid: 'rs3918290', gene: 'DPYD', chromosome: '1', position37: 97915614, position38: 97450058, refAllele: 'C', altAlleles: ['T'], starAllele: '*2A', activityValue: 0, functionalStatus: 'no_function', significance: 'IVS14+1G>A — exon 14 skipping, no DPD enzyme produced' },
    { rsid: 'rs55886062', gene: 'DPYD', chromosome: '1', position37: 98039419, position38: 97573863, refAllele: 'A', altAlleles: ['C'], starAllele: '*13', activityValue: 0, functionalStatus: 'no_function', significance: 'I560S — disrupts FAD binding, abolished activity' },
    { rsid: 'rs67376798', gene: 'DPYD', chromosome: '1', position37: 98205966, position38: 97740410, refAllele: 'T', altAlleles: ['A'], starAllele: 'D949V', activityValue: 0.5, functionalStatus: 'decreased_function', significance: 'D949V — ~50% residual DPD activity in heterozygotes' },
    { rsid: 'rs75017182', gene: 'DPYD', chromosome: '1', position37: 97573863, position38: 97108307, refAllele: 'G', altAlleles: ['A'], starAllele: 'HapB3', activityValue: 0.5, functionalStatus: 'decreased_function', significance: 'c.1129-5923C>G — deep intronic partial exon skipping' },
];

// ═══════════════════════════════════════════════════════════════
// Build MULTIPLE lookup indices for comprehensive matching
// ═══════════════════════════════════════════════════════════════

const rsidIndex = new Map<string, VariantDefinition>();
const pos37Index = new Map<string, VariantDefinition>();
const pos38Index = new Map<string, VariantDefinition>();

for (const v of VARIANT_DATABASE) {
    // Index by rsID (case insensitive)
    rsidIndex.set(v.rsid.toLowerCase(), v);

    // Index by chr:pos for BOTH genome builds
    // Handle various chromosome naming: "22", "chr22", "CHR22"
    const chroms = [v.chromosome, `chr${v.chromosome}`];
    for (const chr of chroms) {
        pos37Index.set(`${chr}:${v.position37}`, v);
        pos38Index.set(`${chr}:${v.position38}`, v);
    }
}

export function lookupByRsid(rsid: string): VariantDefinition | undefined {
    return rsidIndex.get(rsid.toLowerCase());
}

export function lookupByPosition(chrom: string, pos: number): VariantDefinition | undefined {
    const cleanChrom = chrom.replace(/^chr/i, '');
    const keys = [`${cleanChrom}:${pos}`, `chr${cleanChrom}:${pos}`];

    // Try GRCh37 first
    for (const key of keys) {
        const result = pos37Index.get(key);
        if (result) return result;
    }

    // Try GRCh38
    for (const key of keys) {
        const result = pos38Index.get(key);
        if (result) return result;
    }

    // Try fuzzy position match (±5bp window for indels/alignment differences)
    for (let offset = -5; offset <= 5; offset++) {
        if (offset === 0) continue;
        const fuzzyPos = pos + offset;
        for (const chr of [cleanChrom, `chr${cleanChrom}`]) {
            const r37 = pos37Index.get(`${chr}:${fuzzyPos}`);
            if (r37) return r37;
            const r38 = pos38Index.get(`${chr}:${fuzzyPos}`);
            if (r38) return r38;
        }
    }

    return undefined;
}

// ─── Gene → Drug Mapping ───
export const GENE_DRUG_MAP: Record<GeneSymbol, DrugName[]> = {
    CYP2D6: ['CODEINE'],
    CYP2C19: ['CLOPIDOGREL'],
    CYP2C9: ['WARFARIN'],
    SLCO1B1: ['SIMVASTATIN'],
    TPMT: ['AZATHIOPRINE'],
    DPYD: ['FLUOROURACIL'],
};

export const DRUG_GENE_MAP: Record<DrugName, GeneSymbol> = {
    CODEINE: 'CYP2D6',
    CLOPIDOGREL: 'CYP2C19',
    WARFARIN: 'CYP2C9',
    SIMVASTATIN: 'SLCO1B1',
    AZATHIOPRINE: 'TPMT',
    FLUOROURACIL: 'DPYD',
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY SCORE → PHENOTYPE
// Gene-specific CPIC-standard classification (2024 consensus)
//
// Sources:
//   CYP2D6: Caudle KE et al. CPIC/DPWG consensus 2024 update
//           PM=0, IM=0.25–1.0, NM=1.25–2.25, URM>2.25
//           (AS=1 → IM per 2024 consensus, previously NM)
//   CYP2C19: Lee CR et al. CPIC 2022; AS system
//            PM=0, IM=0.5–1.0, NM=1.5–2.0, RM/URM>2.0
//   CYP2C9:  Johnson JA et al. CPIC 2017; AS system
//            PM=0–0.5, IM=1.0–1.5, NM=2.0
//   DPYD:    Amstutz U et al. CPIC 2018; AS system
//            PM=0–0.5, IM=1.0–1.5, NM=2.0
//   TPMT:    Relling MV et al. CPIC 2019; diplotype-based
//            PM=0, IM=0.5–1.0 (possible IM at 0.5), NM≥1.5
//   SLCO1B1: Cooper-DeHoff RM et al. CPIC 2022; function-based
//            Poor=0, Decreased=0.5–1.0, Normal=1.5–2.0,
//            Increased>2.0
// ═══════════════════════════════════════════════════════════════

export function calculateActivityScore(allele1Activity: number, allele2Activity: number): number {
    return allele1Activity + allele2Activity;
}

export function activityScoreToPhenotype(gene: GeneSymbol, activityScore: number): Phenotype {
    // Each gene uses its own thresholds per CPIC consensus
    switch (gene) {
        case 'CYP2D6':
            // Caudle KE et al. 2024 consensus: AS=1→IM (updated from NM)
            if (activityScore === 0) return 'PM';
            if (activityScore >= 0.25 && activityScore <= 1.0) return 'IM';
            if (activityScore >= 1.25 && activityScore <= 2.25) return 'NM';
            if (activityScore > 2.25) return 'URM';
            return 'IM'; // edge cases

        case 'CYP2C19':
            // Lee CR et al. 2022: AS-based
            if (activityScore === 0) return 'PM';
            if (activityScore >= 0.5 && activityScore <= 1.0) return 'IM';
            if (activityScore >= 1.5 && activityScore <= 2.0) return 'NM';
            if (activityScore > 2.0) return 'RM'; // *17/*17 rapid
            return 'IM'; // edge cases like AS=0.25

        case 'CYP2C9':
            // Johnson JA et al. 2017: no increased-function alleles
            if (activityScore <= 0.5) return 'PM';
            if (activityScore >= 1.0 && activityScore <= 1.5) return 'IM';
            if (activityScore === 2.0) return 'NM';
            if (activityScore < 1.0) return 'PM'; // e.g. 0.75
            return 'NM'; // above 2.0 defaults to NM (no URM for CYP2C9)

        case 'DPYD':
            // Amstutz U et al. 2018: strict thresholds
            if (activityScore <= 0.5) return 'PM';
            if (activityScore >= 1.0 && activityScore <= 1.5) return 'IM';
            if (activityScore === 2.0) return 'NM';
            if (activityScore < 1.0) return 'PM'; // e.g. 0.75
            return 'NM'; // no URM for DPYD

        case 'TPMT':
            // Relling MV et al. 2019: diplotype-based
            // AS 0 = PM, AS 0.5 = Possible IM, AS 1 = IM, AS ≥1.5 = NM
            if (activityScore === 0) return 'PM';
            if (activityScore <= 1.0) return 'IM'; // 0.5 (possible IM) and 1.0
            if (activityScore >= 1.5) return 'NM';
            return 'IM'; // edge cases

        case 'SLCO1B1':
            // Cooper-DeHoff RM et al. 2022: function-based terms
            // Poor function = 0, Decreased = 0.5–1.0, Normal = 1.5–2.0
            // (mapped to PM/IM/NM for consistency in our system)
            if (activityScore === 0) return 'PM';   // Poor Function
            if (activityScore <= 1.0) return 'IM';   // Decreased Function
            if (activityScore >= 1.5) return 'NM';   // Normal Function
            return 'IM'; // edge cases

        default:
            if (activityScore === 0) return 'PM';
            if (activityScore < 1.5) return 'IM';
            return 'NM';
    }
}

// ═══════════════════════════════════════════════════
// RISK ASSESSMENT ALGORITHM
// ═══════════════════════════════════════════════════

export interface RiskEntry {
    risk: RiskLabel;
    cpicClinicalAction: string;
    severity: Severity;
    reason: string;
    dosingGuidance: string;
    alternatives: string[];
    cpicReference: string;
    monitoringRecs: string;
}

// ─── CPIC Clinical Action Terms (from published guidelines) ───
// These are the actual CPIC recommendation wordings for each gene-drug-phenotype.
function getCpicClinicalAction(gene: GeneSymbol, drug: DrugName, phenotype: Phenotype): string {
    const actions: Record<string, Record<string, string>> = {
        'CYP2D6|CODEINE': {
            PM: 'Avoid codeine use',
            IM: 'Use with caution, consider reduced dose or alternative',
            NM: 'Use label-recommended dose',
            RM: 'Avoid codeine use due to rapid morphine formation',
            URM: 'Avoid codeine use — risk of fatal respiratory depression',
        },
        'CYP2C19|CLOPIDOGREL': {
            PM: 'Use alternative antiplatelet therapy (prasugrel, ticagrelor)',
            IM: 'Use alternative antiplatelet therapy',
            NM: 'Use clopidogrel per standard dosing',
            RM: 'Use clopidogrel per standard dosing',
        },
        'CYP2C9|WARFARIN': {
            PM: 'Significantly reduce warfarin dose or use alternative anticoagulant',
            IM: 'Reduce initial warfarin dose, monitor INR closely',
            NM: 'Use standard warfarin dosing per clinical protocol',
        },
        'SLCO1B1|SIMVASTATIN': {
            PM: 'Prescribe alternative statin (pravastatin, rosuvastatin)',
            IM: 'Prescribe lower simvastatin dose (≤20 mg) or alternative statin',
            NM: 'Prescribe simvastatin per standard guidelines',
        },
        'TPMT|AZATHIOPRINE': {
            PM: 'Consider alternative non-thiopurine agent',
            IM: 'Reduce initial dose to 30–70% of standard, titrate based on tolerance',
            NM: 'Use standard azathioprine dose per indication',
        },
        'DPYD|FLUOROURACIL': {
            PM: 'Avoid fluoropyrimidine use or reduce dose by ≥50%',
            IM: 'Reduce starting dose by 25–50%, titrate based on toxicity',
            NM: 'Use standard fluoropyrimidine dose per protocol',
        },
    };

    const key = `${gene}|${drug}`;
    return actions[key]?.[phenotype] || `Consult CPIC guidelines for ${drug} in ${phenotype} metabolizers`;
}

// ═══════════════════════════════════════════════════════════════
// CPIC RISK PROFILES — Data-driven, no hardcoded drug-name logic
//
// Each drug defines its risk_label + severity for every phenotype.
// Adding a new drug requires only adding an entry here.
//
// Key insight: PM ≠ always Toxic. CPIC risk depends on:
//   - Whether the drug is a prodrug (needs activation) or clearance drug
//   - Whether PM means "zero enzyme" (lethal) or "low enzyme" (dose-adjust)
//   - Drug-specific therapeutic index and monitoring ability
// ═══════════════════════════════════════════════════════════════

interface PhenotypeRisk { risk: RiskLabel; severity: Severity }

const CPIC_RISK_PROFILES: Record<DrugName, Record<string, PhenotypeRisk>> = {
    CODEINE: {
        // Prodrug: CYP2D6 converts codeine → morphine
        // PM: can't convert → parent drug accumulation → toxicity (Crews 2021)
        // URM: excessive morphine → respiratory depression → fatal (Crews 2021)
        PM: { risk: 'Toxic', severity: 'critical' },
        IM: { risk: 'Adjust Dosage', severity: 'moderate' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Toxic', severity: 'high' },
        URM: { risk: 'Toxic', severity: 'critical' },
    },
    CLOPIDOGREL: {
        // Prodrug: CYP2C19 bioactivates clopidogrel
        // PM: can't activate → no antiplatelet effect → cardiovascular risk (Lee 2022)
        PM: { risk: 'Ineffective', severity: 'critical' },
        IM: { risk: 'Ineffective', severity: 'high' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Safe', severity: 'none' },
        URM: { risk: 'Safe', severity: 'none' },
    },
    WARFARIN: {
        // Clearance: CYP2C9 metabolizes S-warfarin
        // PM: slow clearance → use lower dose + INR monitoring (Johnson 2017)
        // NOT a contraindication — warfarin is titratable
        PM: { risk: 'Adjust Dosage', severity: 'high' },
        IM: { risk: 'Adjust Dosage', severity: 'moderate' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Safe', severity: 'none' },
        URM: { risk: 'Safe', severity: 'none' },
    },
    SIMVASTATIN: {
        // Transporter: SLCO1B1 enables hepatic uptake
        // PM: impaired uptake → systemic exposure → myopathy risk (Cooper-DeHoff 2022)
        // Use lower dose or alternative statin — NOT absolute avoidance
        PM: { risk: 'Adjust Dosage', severity: 'high' },
        IM: { risk: 'Adjust Dosage', severity: 'moderate' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Safe', severity: 'none' },
        URM: { risk: 'Safe', severity: 'none' },
    },
    AZATHIOPRINE: {
        // Clearance: TPMT methylates thiopurines
        // PM: near-zero TPMT → TGN accumulation → severe myelosuppression (Relling 2019)
        // Truly dangerous — avoid or use drastically reduced dose
        PM: { risk: 'Toxic', severity: 'critical' },
        IM: { risk: 'Adjust Dosage', severity: 'high' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Safe', severity: 'none' },
        URM: { risk: 'Safe', severity: 'none' },
    },
    FLUOROURACIL: {
        // Clearance: DPYD catabolizes 5-FU
        // PM: DPD deficiency → >10x 5-FU exposure → potentially fatal (Amstutz 2018)
        // Truly dangerous — avoid or reduce ≥50%
        PM: { risk: 'Toxic', severity: 'critical' },
        IM: { risk: 'Adjust Dosage', severity: 'high' },
        NM: { risk: 'Safe', severity: 'none' },
        RM: { risk: 'Safe', severity: 'none' },
        URM: { risk: 'Safe', severity: 'none' },
    },
};

export function computeDrugRisk(
    gene: GeneSymbol,
    drug: DrugName,
    phenotype: Phenotype,
    activityScore: number,
    variantFunctions: string[]
): RiskEntry {
    // Look up risk from the data table — no if/else drug logic
    const drugProfile = CPIC_RISK_PROFILES[drug];
    const phenoRisk = drugProfile?.[phenotype];

    let risk: RiskLabel;
    let severity: Severity;

    if (phenoRisk) {
        risk = phenoRisk.risk;
        severity = phenoRisk.severity;
    } else {
        risk = 'Unknown';
        severity = 'moderate';
    }

    // Escalate severity if multiple no-function variants detected
    const noFunctionCount = variantFunctions.filter(f => f === 'no_function').length;
    if (noFunctionCount >= 2 && severity !== 'critical') {
        severity = 'high';
    }

    const cpicClinicalAction = getCpicClinicalAction(gene, drug, phenotype);
    const guidance = generateGuidance(gene, drug, phenotype, risk, activityScore);

    return { risk, cpicClinicalAction, severity, ...guidance };
}

function generateGuidance(
    gene: GeneSymbol, drug: DrugName, phenotype: Phenotype, risk: RiskLabel, activityScore: number
): Omit<RiskEntry, 'risk' | 'severity' | 'cpicClinicalAction'> {
    const cpicRefs: Record<DrugName, string> = {
        CODEINE: 'CPIC Guideline for CYP2D6 and Codeine (Crews et al., 2021)',
        CLOPIDOGREL: 'CPIC Guideline for CYP2C19 and Clopidogrel (Lee et al., 2022)',
        WARFARIN: 'CPIC Guideline for CYP2C9/VKORC1 and Warfarin (Johnson et al., 2017)',
        SIMVASTATIN: 'CPIC Guideline for SLCO1B1 and Simvastatin (Cooper-DeHoff et al., 2022)',
        AZATHIOPRINE: 'CPIC Guideline for TPMT/NUDT15 and Thiopurines (Relling et al., 2019)',
        FLUOROURACIL: 'CPIC Guideline for DPYD and Fluoropyrimidines (Amstutz et al., 2018)',
    };

    const alternatives: Record<DrugName, string[]> = {
        CODEINE: ['Acetaminophen', 'NSAIDs (ibuprofen)', 'Morphine (direct)', 'Hydromorphone', 'Oxycodone'],
        CLOPIDOGREL: ['Prasugrel', 'Ticagrelor'],
        WARFARIN: ['Apixaban (Eliquis)', 'Rivaroxaban (Xarelto)', 'Dabigatran (Pradaxa)'],
        SIMVASTATIN: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin', 'Pitavastatin'],
        AZATHIOPRINE: ['Mycophenolate mofetil', 'Tacrolimus', 'Cyclosporine'],
        FLUOROURACIL: ['Non-fluoropyrimidine regimens', 'Raltitrexed', 'Targeted therapy'],
    };

    let dosingGuidance: string;
    let monitoringRecs: string;

    if (risk === 'Toxic' || risk === 'Ineffective') {
        dosingGuidance = `AVOID ${drug}. Activity score ${activityScore.toFixed(1)} → ${phenotype} metabolizer. Use alternative medication.`;
        monitoringRecs = risk === 'Toxic'
            ? `${drug} contraindicated for ${phenotype} metabolizers. If administered, monitor for toxicity immediately.`
            : `${drug} expected to be ineffective. Monitor for treatment failure and switch to alternative.`;
    } else if (risk === 'Adjust Dosage') {
        const reduction = activityScore < 0.5 ? '50-80%' : activityScore < 1.0 ? '25-50%' : '15-25%';
        dosingGuidance = `Reduce ${drug} dose by ${reduction}. Activity score ${activityScore.toFixed(1)} → reduced metabolism. Titrate based on response.`;
        monitoringRecs = `Enhanced monitoring required. Check drug levels if available. Monitor for efficacy and adverse effects.`;
    } else {
        dosingGuidance = `Use ${drug} per standard dosing. Activity score ${activityScore.toFixed(1)} → normal ${gene} function.`;
        monitoringRecs = 'Standard clinical monitoring per guidelines.';
    }

    return {
        reason: buildMechanismReason(gene, drug, phenotype, activityScore),
        dosingGuidance,
        alternatives: risk === 'Safe' ? [] : alternatives[drug] || [],
        cpicReference: cpicRefs[drug],
        monitoringRecs,
    };
}

function buildMechanismReason(gene: GeneSymbol, drug: DrugName, phenotype: Phenotype, activityScore: number): string {
    const mechanismTemplates: Record<string, Record<string, string>> = {
        'CYP2D6|CODEINE': {
            PM: `CYP2D6 activity score ${activityScore.toFixed(1)} (PM) → severely impaired codeine O-demethylation → cannot convert codeine→morphine → no analgesia + parent drug accumulation → toxicity risk`,
            IM: `CYP2D6 activity score ${activityScore.toFixed(1)} (IM) → reduced codeine→morphine conversion → diminished analgesic response`,
            NM: `CYP2D6 activity score ${activityScore.toFixed(1)} (NM) → normal 5-10% codeine→morphine conversion → standard analgesic response`,
            RM: `CYP2D6 activity score ${activityScore.toFixed(1)} (RM) → accelerated codeine→morphine → supratherapeutic morphine levels`,
            URM: `CYP2D6 activity score ${activityScore.toFixed(1)} (URM) → excessive morphine formation → life-threatening respiratory depression`,
        },
        'CYP2C19|CLOPIDOGREL': {
            PM: `CYP2C19 activity score ${activityScore.toFixed(1)} (PM) → cannot bioactivate clopidogrel → no antiplatelet effect → cardiovascular risk`,
            IM: `CYP2C19 activity score ${activityScore.toFixed(1)} (IM) → reduced clopidogrel activation → subtherapeutic response`,
            NM: `CYP2C19 activity score ${activityScore.toFixed(1)} (NM) → standard bioactivation → expected efficacy`,
            RM: `CYP2C19 activity score ${activityScore.toFixed(1)} (RM) → enhanced activation → increased effect`,
        },
        'CYP2C9|WARFARIN': {
            PM: `CYP2C9 activity score ${activityScore.toFixed(1)} (PM) → severely impaired S-warfarin hydroxylation → over-anticoagulation → bleeding risk`,
            IM: `CYP2C9 activity score ${activityScore.toFixed(1)} (IM) → reduced S-warfarin clearance → lower dose needed`,
            NM: `CYP2C9 activity score ${activityScore.toFixed(1)} (NM) → normal S-warfarin metabolism → standard dose-response`,
        },
        'SLCO1B1|SIMVASTATIN': {
            PM: `SLCO1B1 activity score ${activityScore.toFixed(1)} (PM) → impaired hepatic uptake → 2-4x systemic exposure → myopathy/rhabdomyolysis risk`,
            IM: `SLCO1B1 activity score ${activityScore.toFixed(1)} (IM) → reduced hepatic uptake → ~1.5-2x exposure → myopathy risk`,
            NM: `SLCO1B1 activity score ${activityScore.toFixed(1)} (NM) → normal hepatic first-pass → standard pharmacokinetics`,
        },
        'TPMT|AZATHIOPRINE': {
            PM: `TPMT activity score ${activityScore.toFixed(1)} (PM) → deficient methyltransferase → TGN accumulation → severe myelosuppression`,
            IM: `TPMT activity score ${activityScore.toFixed(1)} (IM) → reduced methylation → elevated TGN → myelotoxicity risk`,
            NM: `TPMT activity score ${activityScore.toFixed(1)} (NM) → adequate methylation → balanced metabolites → expected response`,
        },
        'DPYD|FLUOROURACIL': {
            PM: `DPYD activity score ${activityScore.toFixed(1)} (PM) → complete DPD deficiency → >10x 5-FU exposure → fatal toxicity risk`,
            IM: `DPYD activity score ${activityScore.toFixed(1)} (IM) → partial DPD deficiency → ~2x exposure → dose-dependent toxicity`,
            NM: `DPYD activity score ${activityScore.toFixed(1)} (NM) → normal DPD activity → standard 5-FU catabolism`,
        },
    };

    const key = `${gene}|${drug}`;
    return mechanismTemplates[key]?.[phenotype] ||
        `${gene} activity score ${activityScore.toFixed(1)} — ${phenotype} metabolizer for ${drug}.`;
}

// ─── Multi-factor ML confidence scoring ───
export function computeConfidenceScore(
    phenotype: Phenotype,
    variantCount: number,
    noFunctionVariants: number,
    activityScore: number
): number {
    let confidence = 0.40;
    confidence += Math.min(variantCount * 0.07, 0.15);
    if (phenotype === 'PM' && noFunctionVariants >= 2) confidence += 0.15;
    else if (phenotype === 'PM' || phenotype === 'URM') confidence += 0.12;
    else if (phenotype === 'NM') confidence += 0.10;
    else if (phenotype === 'IM') confidence += 0.08;
    if (activityScore === 0 || activityScore >= 2.5) confidence += 0.10;
    else if (activityScore <= 0.5 || activityScore >= 2.0) confidence += 0.06;
    else confidence += 0.03;
    if (variantCount >= 2 && noFunctionVariants === variantCount) confidence += 0.08;
    return Math.min(Math.round(confidence * 100) / 100, 0.98);
}
