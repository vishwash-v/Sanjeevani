// ============================================================
// Sanjeevani — Risk Engine (v2 — Algorithmic, not lookup)
// Multi-factor risk computation using CPIC pharmacology rules
// ============================================================

import { AnalysisResult, GeneProfile, DrugName, GeneSymbol, SUPPORTED_DRUGS } from './types';
import { DRUG_GENE_MAP, computeDrugRisk, computeConfidenceScore, lookupByRsid, lookupByPosition } from './cpic-data';
import { analyzeVCF } from './vcf-parser';

// ─── Analyze a single drug against genetic profile ───
export function assessDrugRisk(
    drug: DrugName,
    profiles: GeneProfile[],
    patientId: string,
    totalVariantsInVcf: number,
    coveredGenes: Set<string> = new Set()
): AnalysisResult {
    const startTime = Date.now();
    const gene = DRUG_GENE_MAP[drug];

    // Find the matching gene profile
    const geneProfile = profiles.find(p => p.gene === gene);

    if (!geneProfile) {
        // Check if this gene's loci were actually present in the VCF
        const geneCovered = coveredGenes.has(gene);
        return createWildTypeResult(drug, gene, patientId, startTime, geneCovered, totalVariantsInVcf);
    }

    // ── Collect variant functional statuses for multi-factor risk computation ──
    const variantFunctions: string[] = [];

    for (const v of geneProfile.variants) {
        const dbEntry = lookupByRsid(v.rsid) || lookupByPosition(v.chromosome, v.position);
        if (dbEntry) {
            variantFunctions.push(dbEntry.functionalStatus);
        }
    }

    const noFunctionCount = variantFunctions.filter(f => f === 'no_function').length;

    // ── Run multi-factor risk computation ──
    const riskEntry = computeDrugRisk(
        gene,
        drug,
        geneProfile.phenotype,
        geneProfile.activityScore,
        variantFunctions
    );

    // ── Compute ML-calibrated confidence score ──
    const confidence = computeConfidenceScore(
        geneProfile.phenotype,
        geneProfile.variants.length,
        noFunctionCount,
        geneProfile.activityScore
    );

    return {
        patient_id: patientId,
        drug: drug,
        timestamp: new Date().toISOString(),
        risk_assessment: {
            risk_label: riskEntry.risk,
            cpic_clinical_action: riskEntry.cpicClinicalAction,
            confidence_score: confidence,
            severity: riskEntry.severity,
        },
        pharmacogenomic_profile: {
            primary_gene: gene,
            diplotype: geneProfile.diplotype,
            phenotype: geneProfile.phenotype,
            detected_variants: geneProfile.variants
                .filter(v => v.genotype !== '0/0' && v.genotype !== '0|0')
                .map(v => ({
                    rsid: v.rsid,
                    chromosome: v.chromosome,
                    position: v.position,
                    ref_allele: v.ref_allele,
                    alt_allele: v.alt_allele,
                    genotype: v.genotype,
                    gene: v.gene,
                    clinical_significance: v.clinical_significance,
                })),
        },
        clinical_recommendation: {
            action: riskEntry.dosingGuidance,
            dosing_guidance: riskEntry.dosingGuidance,
            alternative_drugs: riskEntry.alternatives,
            monitoring_recommendations: riskEntry.monitoringRecs,
            cpic_guideline_reference: riskEntry.cpicReference,
        },
        llm_generated_explanation: {
            summary: '',
            mechanism: riskEntry.reason, // Pre-fill with algorithmic mechanism
            variant_specific_effects: '',
            clinical_context: '',
            references: [],
        },
        quality_metrics: {
            vcf_parsing_success: true,
            variants_detected: geneProfile.variants.length,
            pharmacogenes_found: 1,
            llm_explanation_generated: false,
            processing_time_ms: Date.now() - startTime,
        },
    };
}

// ─── When no variants found for a gene ───
// CRITICAL DISTINCTION:
//   geneCovered=true  → VCF has records AT this gene's loci (even 0/0 ref calls)
//                       → Gene was sequenced, no deleterious variants found → *1/*1 inferred
//   geneCovered=false → VCF has NO records at this gene's loci
//                       → Gene was NOT tested → Status Unknown (cannot infer anything)
//
// This prevents the clinical error of assuming normal function for untested genes.
// "Absence of evidence ≠ evidence of absence"
function createWildTypeResult(
    drug: DrugName,
    gene: GeneSymbol,
    patientId: string,
    startTime: number,
    geneCovered: boolean,
    totalVariants: number
): AnalysisResult {
    if (geneCovered) {
        // Gene WAS tested — loci appeared in VCF but no deleterious variants found
        // → Infer *1/*1 with moderate confidence
        const inferredConfidence = Math.min(0.65 + (totalVariants * 0.02), 0.80);

        return {
            patient_id: patientId,
            drug: drug,
            timestamp: new Date().toISOString(),
            risk_assessment: {
                risk_label: 'Safe',
                cpic_clinical_action: `Use standard ${drug.toLowerCase()} dosing per clinical protocol`,
                confidence_score: inferredConfidence,
                severity: 'none',
            },
            pharmacogenomic_profile: {
                primary_gene: gene,
                diplotype: '*1/*1 (wild-type)',
                phenotype: 'NM',
                detected_variants: [],
            },
            clinical_recommendation: {
                action: `No deleterious ${gene} variants detected in sequencing data. Wild-type *1/*1 inferred → Normal Metabolizer. Use ${drug} per standard dosing guidelines.`,
                dosing_guidance: `Standard dosing appropriate. Activity score 2.0 (inferred normal). ${drug} is expected to be metabolized normally.`,
                alternative_drugs: [],
                monitoring_recommendations: gene === 'CYP2C9' && drug === 'WARFARIN'
                    ? 'Standard clinical monitoring per treatment guidelines. Note: This panel does not test VKORC1, which also significantly influences warfarin dose requirements. VKORC1 genotyping is recommended for comprehensive pharmacogenomic-guided dosing.'
                    : gene === 'TPMT' && drug === 'AZATHIOPRINE'
                        ? 'Standard clinical monitoring per treatment guidelines. Note: This panel does not test NUDT15, which can also affect thiopurine toxicity risk. NUDT15 genotyping may be considered for comprehensive assessment.'
                        : 'Standard clinical monitoring per treatment guidelines.',
                cpic_guideline_reference: `CPIC Guidelines for ${gene}`,
            },
            llm_generated_explanation: {
                summary: '',
                mechanism: `${gene} was screened in the uploaded VCF data. No known loss-of-function, decreased-function, or increased-function variants were detected at established pharmacogenomic loci. By inference, the patient's diplotype is *1/*1 (wild-type), corresponding to Normal Metabolizer status with full ${gene === 'SLCO1B1' ? 'transporter function' : 'enzyme activity'} (activity score 2.0).`,
                variant_specific_effects: 'NM (inferred from absence of known deleterious variants in sequencing data)',
                clinical_context: '',
                references: [],
            },
            quality_metrics: {
                vcf_parsing_success: true,
                variants_detected: 0,
                pharmacogenes_found: 0,
                llm_explanation_generated: false,
                processing_time_ms: Date.now() - startTime,
            },
        };
    } else {
        // Gene was NOT tested — no loci for this gene appeared in VCF at all
        // → Cannot determine genotype → Report Unknown
        return {
            patient_id: patientId,
            drug: drug,
            timestamp: new Date().toISOString(),
            risk_assessment: {
                risk_label: 'Unknown',
                cpic_clinical_action: `${gene} genotype not available from this VCF — cannot determine ${drug} risk. Use standard clinical judgment.`,
                confidence_score: 0.0,
                severity: 'low',
            },
            pharmacogenomic_profile: {
                primary_gene: gene,
                diplotype: 'Indeterminate (gene not sequenced in this panel)',
                phenotype: 'Unknown',
                detected_variants: [],
            },
            clinical_recommendation: {
                action: `${gene} was not tested in this VCF file. Genotype and metabolizer status cannot be determined. Use standard clinical judgment for ${drug} dosing.`,
                dosing_guidance: `No pharmacogenomic guidance available for ${drug} — ${gene} genotype data is absent from the uploaded VCF. Consider ordering targeted ${gene} pharmacogenomic testing.`,
                alternative_drugs: [],
                monitoring_recommendations: `${gene} genotype not available. Consider targeted pharmacogenomic panel testing for ${gene}. Use standard monitoring until genotype is confirmed.`,
                cpic_guideline_reference: `CPIC Guidelines for ${gene}`,
            },
            llm_generated_explanation: {
                summary: '',
                mechanism: `${gene} variants were not present in the uploaded VCF data. This VCF does not appear to cover ${gene} loci — the gene was likely not included in the sequencing panel. No genotype can be inferred. Targeted pharmacogenomic testing for ${gene} is recommended before making ${drug} dosing decisions.`,
                variant_specific_effects: 'Unknown — gene not sequenced in this panel',
                clinical_context: '',
                references: [],
            },
            quality_metrics: {
                vcf_parsing_success: true,
                variants_detected: 0,
                pharmacogenes_found: 0,
                llm_explanation_generated: false,
                processing_time_ms: Date.now() - startTime,
            },
        };
    }
}

// ─── Full pipeline: VCF content + drugs → analysis results ───
export function runFullAnalysis(
    vcfContent: string,
    drugs: string[]
): { results: AnalysisResult[]; warnings: { line: number; field: string; message: string; severity: string }[]; error?: string } {
    // Parse VCF
    const { variants, profiles, coveredGenes, warnings, error } = analyzeVCF(vcfContent);
    if (error) {
        return { results: [], warnings: warnings || [], error };
    }

    // Generate patient ID from hash of VCF content
    const hash = Array.from(vcfContent.slice(0, 100))
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
        .toString(36).toUpperCase();
    const patientId = `PATIENT_${hash}`;

    // Normalize and validate drug names
    const normalizedDrugs = drugs.map(d => d.trim().toUpperCase()) as DrugName[];
    const validDrugs = normalizedDrugs.filter(d =>
        (SUPPORTED_DRUGS as readonly string[]).includes(d)
    );

    if (validDrugs.length === 0) {
        return {
            results: [],
            warnings,
            error: `No supported drugs provided. Supported: ${SUPPORTED_DRUGS.join(', ')}`,
        };
    }

    // Run assessment for each drug
    const results = validDrugs.map(drug =>
        assessDrugRisk(drug, profiles, patientId, variants.length, coveredGenes)
    );

    return { results, warnings };
}
