// ============================================================
// Sanjeevani — Main Analysis API Route
// POST /api/analyze — Accepts VCF content + drug list
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runFullAnalysis } from '@/lib/risk-engine';
import { generateExplanation } from '@/lib/llm-service';
import { AnalysisResult } from '@/lib/types';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const vcfFile = formData.get('vcfFile') as File | null;
        const drugsStr = formData.get('drugs') as string | null;

        // Validate inputs
        if (!vcfFile) {
            return NextResponse.json(
                { error: 'No VCF file provided. Please upload a .vcf file.' },
                { status: 400 }
            );
        }

        if (!drugsStr || drugsStr.trim() === '') {
            return NextResponse.json(
                { error: 'No drug names provided. Please specify at least one drug.' },
                { status: 400 }
            );
        }

        // Validate file type
        const fileName = vcfFile.name.toLowerCase();
        if (!fileName.endsWith('.vcf')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a .vcf (Variant Call Format) file.' },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        if (vcfFile.size > 5 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File too large. Maximum file size is 5MB.' },
                { status: 400 }
            );
        }

        // Read VCF content
        const vcfContent = await vcfFile.text();

        // Parse drug list
        const drugs = drugsStr.split(',').map(d => d.trim()).filter(d => d.length > 0);

        // Run analysis
        const { results, warnings, error } = runFullAnalysis(vcfContent, drugs);

        if (error) {
            return NextResponse.json({ error, vcf_warnings: warnings }, { status: 400 });
        }

        // Generate LLM explanations
        const apiKey = process.env.GEMINI_API_KEY;
        let enrichedResults: AnalysisResult[] = results;

        if (apiKey) {
            enrichedResults = await Promise.all(
                results.map(async (result) => {
                    try {
                        const explanation = await generateExplanation(result, apiKey);
                        return {
                            ...result,
                            llm_generated_explanation: explanation,
                            quality_metrics: {
                                ...result.quality_metrics,
                                llm_explanation_generated: true,
                                processing_time_ms: Date.now() - new Date(result.timestamp).getTime(),
                            },
                        };
                    } catch {
                        return result;
                    }
                })
            );
        } else {
            // Use fallback explanations (already populated by llm-service)
            const { generateExplanation: genFallback } = await import('@/lib/llm-service');
            enrichedResults = await Promise.all(
                results.map(async (result) => {
                    const explanation = await genFallback(result, '');
                    return {
                        ...result,
                        llm_generated_explanation: explanation,
                        quality_metrics: {
                            ...result.quality_metrics,
                            llm_explanation_generated: false,
                        },
                    };
                })
            );
        }

        return NextResponse.json({
            success: true,
            results: enrichedResults,
            vcf_warnings: warnings,
            meta: {
                total_drugs_analyzed: enrichedResults.length,
                timestamp: new Date().toISOString(),
                llm_enabled: !!apiKey,
                privacy: {
                    data_stored: false,
                    raw_vcf_sent_to_llm: false,
                    session_only: true,
                },
            },
            methodology: {
                risk_label_derivation: 'Algorithmically computed from genotype-to-phenotype translation using CPIC-standardized activity scores. Each allele is assigned a CPIC-defined activity value (0 = no function, 0.5 = decreased, 1.0 = normal). The sum of both alleles produces the activity score, which is mapped to a metabolizer phenotype (Poor Metabolizer / Intermediate Metabolizer / Normal Metabolizer / Rapid Metabolizer / Ultra-Rapid Metabolizer) using gene-specific CPIC thresholds.',
                phenotype_thresholds: 'Gene-specific CPIC consensus thresholds: CYP2D6 (Caudle 2024), CYP2C19 (Lee 2022), CYP2C9 (Johnson 2017), DPYD (Amstutz 2018), TPMT (Relling 2019), SLCO1B1 (Cooper-DeHoff 2022).',
                data_sources: [
                    'CPIC Allele Functionality Table (api.cpicpgx.org/v1/allele)',
                    'PharmVar star allele definitions (www.pharmvar.org)',
                    'NCBI dbSNP variant coordinates (www.ncbi.nlm.nih.gov/snp)',
                    'PharmGKB clinical annotations (www.pharmgkb.org)',
                ],
            },
            clinical_disclaimer: 'Risk labels are algorithmically derived from genotype-to-phenotype translation using CPIC-standardized activity scores and allele functionality data. These results are intended to assist — not replace — clinical decision-making. Per CPIC guidelines, pharmacogenomic test results should be interpreted in the context of the patient\'s complete clinical picture, including comorbidities, concomitant medications, renal/hepatic function, and clinical history. The prescribing clinician\'s judgment, informed by published CPIC guidelines (cpicpgx.org), remains the final authority on therapeutic decisions.',
        });
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Internal server error during analysis. Please try again.' },
            { status: 500 }
        );
    }
}
