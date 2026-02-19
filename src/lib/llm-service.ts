// ============================================================
// Sanjeevani — LLM Service (Google Gemini 2.0 Flash)
// Generates clinical explanations for pharmacogenomic results
// ============================================================

import { AnalysisResult, LLMExplanation } from './types';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// ─── Generate LLM explanation for a drug analysis ───
export async function generateExplanation(
    result: AnalysisResult,
    apiKey: string
): Promise<LLMExplanation> {
    const prompt = buildPrompt(result);

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1500,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'OBJECT',
                        properties: {
                            summary: { type: 'STRING' },
                            mechanism: { type: 'STRING' },
                            variant_specific_effects: { type: 'STRING' },
                            clinical_context: { type: 'STRING' },
                            references: { type: 'ARRAY', items: { type: 'STRING' } }
                        },
                        required: ['summary', 'mechanism', 'variant_specific_effects', 'clinical_context', 'references']
                    }
                }
            })
        });

        if (!response.ok) {
            console.error('Gemini API error:', response.status, await response.text());
            return getFallbackExplanation(result);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return getFallbackExplanation(result);
        }

        const parsed = JSON.parse(text);
        return {
            summary: parsed.summary || '',
            mechanism: parsed.mechanism || '',
            variant_specific_effects: parsed.variant_specific_effects || '',
            clinical_context: parsed.clinical_context || '',
            references: parsed.references || [],
        };
    } catch (error) {
        console.error('LLM generation error:', error);
        return getFallbackExplanation(result);
    }
}

// ─── Build structured prompt ───
function buildPrompt(result: AnalysisResult): string {
    const variants = result.pharmacogenomic_profile.detected_variants
        .map(v => `${v.rsid} (${v.genotype}) - ${v.clinical_significance}`)
        .join(', ') || 'No specific variants detected';

    return `You are a clinical pharmacogenomics expert. Provide a detailed, scientifically accurate explanation for the following pharmacogenomic assessment.

PATIENT ASSESSMENT:
- Drug: ${result.drug}
- Primary Gene: ${result.pharmacogenomic_profile.primary_gene}
- Diplotype: ${result.pharmacogenomic_profile.diplotype}
- Phenotype: ${result.pharmacogenomic_profile.phenotype}
- Risk Label: ${result.risk_assessment.risk_label}
- Severity: ${result.risk_assessment.severity}
- Detected Variants: ${variants}

INSTRUCTIONS:
Generate a JSON response with these fields:
1. "summary": A 2-3 sentence patient-friendly summary explaining the risk in simple terms
2. "mechanism": The biological mechanism — how the genetic variant affects drug metabolism (enzyme or transporter activity, metabolic pathway, drug conversion). Note: SLCO1B1 encodes a hepatic uptake transporter (OATP1B1), not an enzyme.
3. "variant_specific_effects": Detailed explanation of each detected variant's functional impact, citing specific rsIDs and star alleles
4. "clinical_context": Clinical implications and what this means for the patient's treatment plan, including CPIC guideline recommendations
5. "references": Array of 3-5 relevant clinical references (CPIC guidelines, PharmGKB, published studies)

Be scientifically precise. Cite specific rsIDs, star alleles, and enzyme activity changes. Use medical terminology appropriately but keep the summary accessible.`;
}

// ─── Fallback explanations when LLM is unavailable ───
function getFallbackExplanation(result: AnalysisResult): LLMExplanation {
    const gene = result.pharmacogenomic_profile.primary_gene;
    const drug = result.drug;
    const phenotype = result.pharmacogenomic_profile.phenotype;
    const diplotype = result.pharmacogenomic_profile.diplotype;
    const risk = result.risk_assessment.risk_label;
    const variants = result.pharmacogenomic_profile.detected_variants;

    const variantText = variants.length > 0
        ? variants.map(v => `${v.rsid} (${v.clinical_significance})`).join('; ')
        : 'No specific pharmacogenomic variants detected';

    const summaries: Record<string, Record<string, string>> = {
        'CODEINE': {
            'Toxic': `Based on your ${gene} ${diplotype} genotype, you are classified as a ${phenotype} (${phenotype === 'PM' ? 'Poor' : 'Ultra-rapid'} Metabolizer). Codeine may be dangerous for you because your body ${phenotype === 'PM' ? 'cannot properly convert codeine to its active form morphine, leading to drug accumulation' : 'converts codeine to morphine too quickly, causing dangerous morphine levels'}. Alternative pain medications should be considered.`,
            'Ineffective': `Your ${gene} ${diplotype} genotype classifies you as a Poor Metabolizer. Codeine requires CYP2D6-mediated conversion to morphine for analgesic effect. With severely reduced enzyme activity, codeine will provide no pain relief. Use alternative analgesics such as acetaminophen, NSAIDs, or non-CYP2D6-dependent opioids.`,
            'Safe': `Your ${gene} ${diplotype} genotype indicates Normal Metabolizer status. Codeine is expected to work as intended at standard doses with normal conversion to morphine for pain relief.`,
            'Adjust Dosage': `Your ${gene} genotype suggests intermediate metabolism of codeine. You may experience reduced pain relief at standard doses. Consider using the lowest effective dose or an alternative analgesic.`,
        },
        'CLOPIDOGREL': {
            'Ineffective': `Your ${gene} ${diplotype} genotype classifies you as a Poor Metabolizer. Clopidogrel may be ineffective because your body cannot convert this prodrug into its active antiplatelet form. This significantly increases your risk of cardiovascular events. Alternative antiplatelet agents like prasugrel or ticagrelor are recommended.`,
            'Toxic': `Your ${gene} ${diplotype} genotype indicates ultra-rapid metabolism of clopidogrel. While this may enhance antiplatelet effect, it also increases bleeding risk. Close monitoring is required.`,
            'Adjust Dosage': `Your ${gene} ${diplotype} genotype indicates intermediate clopidogrel metabolism. Reduced conversion to active metabolite may diminish antiplatelet efficacy. Consider alternative antiplatelet therapy (prasugrel or ticagrelor) per CPIC guidelines, especially for acute coronary syndromes.`,
            'Safe': `Your ${gene} genotype indicates normal clopidogrel activation. The drug is expected to provide effective antiplatelet protection at standard doses.`,
        },
        'WARFARIN': {
            'Toxic': `Your ${gene} ${diplotype} genotype indicates severely impaired warfarin metabolism. S-warfarin clearance is drastically reduced, causing over-anticoagulation and high bleeding risk. A significantly reduced dose (≥50% reduction) or alternative anticoagulant (apixaban, rivaroxaban) is recommended.`,
            'Ineffective': `Your ${gene} ${diplotype} genotype indicates rapid warfarin metabolism. Standard doses may be insufficient for therapeutic anticoagulation. Higher doses with frequent INR monitoring may be required.`,
            'Adjust Dosage': `Your ${gene} ${diplotype} genotype indicates reduced warfarin metabolism. You require a lower warfarin dose to achieve therapeutic anticoagulation and avoid dangerous bleeding complications. Pharmacogenomic-guided dosing is strongly recommended.`,
            'Safe': `Your ${gene} genotype indicates normal warfarin metabolism. Standard dosing with routine INR monitoring is appropriate.`,
        },
        'SIMVASTATIN': {
            'Toxic': `Your ${gene} ${diplotype} genotype indicates impaired hepatic uptake of simvastatin via OATP1B1 transporter. This increases systemic drug exposure by 2-4x and significantly raises your risk of myopathy and rhabdomyolysis. A lower dose or alternative statin (pravastatin, rosuvastatin) is recommended.`,
            'Adjust Dosage': `Your ${gene} ${diplotype} genotype indicates reduced OATP1B1 transporter function. Simvastatin plasma levels may be ~1.5-2x higher than expected, increasing myopathy risk. Use a lower simvastatin dose (≤20mg) or consider switching to pravastatin or rosuvastatin per CPIC guidelines.`,
            'Safe': `Your ${gene} genotype indicates normal hepatic transporter function. Simvastatin is expected to be well-tolerated at standard doses.`,
        },
        'AZATHIOPRINE': {
            'Toxic': `Your ${gene} ${diplotype} genotype indicates deficient TPMT enzyme activity. Azathioprine at standard doses could cause severe, life-threatening myelosuppression (bone marrow failure). Dose must be drastically reduced (reduce by ≥70%) or an alternative immunosuppressant used.`,
            'Adjust Dosage': `Your ${gene} ${diplotype} genotype indicates intermediate TPMT activity. Azathioprine at standard doses increases the risk of myelosuppression. A dose reduction of 30-50% is recommended with regular complete blood count monitoring per CPIC guidelines.`,
            'Safe': `Your ${gene} genotype indicates normal TPMT activity. Azathioprine is expected to be safely metabolized at standard doses.`,
        },
        'FLUOROURACIL': {
            'Toxic': `Your ${gene} ${diplotype} genotype indicates DPD enzyme deficiency. Fluorouracil cannot be properly degraded, leading to potentially fatal toxicity including severe mucositis, myelosuppression, and neurotoxicity. Fluoropyrimidines should be avoided or dose reduced by ≥50%.`,
            'Adjust Dosage': `Your ${gene} ${diplotype} genotype indicates partial DPD deficiency. Fluorouracil exposure is approximately 2x normal, increasing the risk of dose-dependent toxicity. A 25-50% dose reduction is recommended with therapeutic drug monitoring per CPIC guidelines.`,
            'Safe': `Your ${gene} genotype indicates normal DPD activity. Fluorouracil is expected to be metabolized normally at standard doses.`,
        },
    };

    const summary = summaries[drug]?.[risk] ||
        `Your ${gene} ${diplotype} genotype (${phenotype}) has been assessed for ${drug}. Risk level: ${risk}. Please consult with your healthcare provider for personalized recommendations.`;

    return {
        summary,
        mechanism: `The ${gene} gene encodes ${gene === 'SLCO1B1' ? 'a hepatic uptake transporter (OATP1B1) critical for' : 'an enzyme critical for'} ${drug.toLowerCase()} metabolism. The ${diplotype} diplotype results in ${phenotype} metabolizer status, which ${risk === 'Safe' ? `indicates normal ${gene === 'SLCO1B1' ? 'transporter' : 'enzyme'} activity` : 'alters the expected drug metabolism pathway, affecting drug efficacy and safety'}.`,
        variant_specific_effects: variantText,
        clinical_context: result.clinical_recommendation.action,
        references: getCpicReferences(drug, gene),
    };
}

// ─── Drug-specific CPIC guideline references ───
function getCpicReferences(drug: string, gene: string): string[] {
    const drugRefs: Record<string, string[]> = {
        'CODEINE': [
            'Crews KR, et al. CPIC Guideline for CYP2D6, OPRM1, COMT and Select Opioid Therapy. Clin Pharmacol Ther. 2021;110(4):888–896. PMC8249478',
            'PharmGKB Clinical Annotation: CYP2D6 and Codeine — www.pharmgkb.org',
            'Gaedigk A, et al. PharmVar and the Landscape of Pharmacogenetic Resources. Clin Pharmacol Ther. 2018;104(4):611–614.',
        ],
        'CLOPIDOGREL': [
            'Lee CR, et al. CPIC Guideline for CYP2C19 and Clopidogrel Therapy: 2022 Update. Clin Pharmacol Ther. 2022;112(5):959–967. PMC9035072',
            'PharmGKB Clinical Annotation: CYP2C19 and Clopidogrel — www.pharmgkb.org',
            'Scott SA, et al. Clinical Pharmacogenetics Implementation Consortium Guidelines for CYP2C19 Genotype and Clopidogrel Therapy. Clin Pharmacol Ther. 2013;94(3):317–323.',
        ],
        'WARFARIN': [
            'Johnson JA, et al. CPIC Guideline for CYP2C9/VKORC1 Pharmacogenetics and Warfarin Dosing: 2017 Update. Clin Pharmacol Ther. 2017;102(3):397–404. PMC5546947',
            'PharmGKB Clinical Annotation: CYP2C9 and Warfarin — www.pharmgkb.org',
            'Gage BF, et al. Use of Pharmacogenetic and Clinical Factors to Predict the Therapeutic Dose of Warfarin. Clin Pharmacol Ther. 2008;84(3):326–331.',
        ],
        'SIMVASTATIN': [
            'Cooper-DeHoff RM, et al. CPIC Guideline for SLCO1B1, ABCG2, CYP2C9 and Statin-Associated Musculoskeletal Symptoms. Clin Pharmacol Ther. 2022;111(5):1007–1021. PMC8799009',
            'PharmGKB Clinical Annotation: SLCO1B1 and Simvastatin — www.pharmgkb.org',
            'SEARCH Collaborative Group. SLCO1B1 Variants and Statin-Induced Myopathy. N Engl J Med. 2008;359(8):789–799.',
        ],
        'AZATHIOPRINE': [
            'Relling MV, et al. CPIC Guideline for Thiopurine Dosing Based on TPMT and NUDT15 Genotypes: 2018 Update. Clin Pharmacol Ther. 2019;105(5):1095–1105. PMC6395087',
            'PharmGKB Clinical Annotation: TPMT and Azathioprine — www.pharmgkb.org',
            'Lennard L. TPMT in the Treatment of Crohn Disease with Azathioprine. Gut. 2002;51(2):143–146.',
        ],
        'FLUOROURACIL': [
            'Amstutz U, et al. CPIC Guideline for DPYD and Fluoropyrimidine Dosing: 2017 Update. Clin Pharmacol Ther. 2018;103(2):210–216. PMC5760397',
            'PharmGKB Clinical Annotation: DPYD and Fluorouracil — www.pharmgkb.org',
            'Meulendijks D, et al. Clinical Relevance of DPYD Variants for Fluoropyrimidine Treatment. Int J Cancer. 2015;136(10):2275–2282.',
        ],
    };

    return drugRefs[drug] || [
        `CPIC Guideline for ${gene} — Clinical Pharmacogenetics Implementation Consortium (cpicpgx.org)`,
        `PharmGKB Clinical Annotation: ${gene} — www.pharmgkb.org`,
        'Relling MV, Klein TE. CPIC: Clinical Pharmacogenetics Implementation Consortium. Clin Pharmacol Ther. 2011;89(3):464–467.',
    ];
}
