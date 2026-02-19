// ============================================================
// Sanjeevani — Debug Parse API
// POST /api/parse-vcf — Shows exactly what the parser extracts
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { parseVCF, extractPharmaVariants, buildGeneProfiles } from '@/lib/vcf-parser';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const vcfFile = formData.get('vcfFile') as File | null;

        if (!vcfFile) {
            return NextResponse.json({ error: 'No VCF file provided' }, { status: 400 });
        }

        const vcfContent = await vcfFile.text();

        // Parse ALL records (not just pharmacogenomic ones)
        const { records: allRecords, warnings } = parseVCF(vcfContent);

        // Extract pharmacogenomic variants
        const pharmaVariants = extractPharmaVariants(allRecords);

        // Build gene profiles
        const profiles = buildGeneProfiles(pharmaVariants);

        return NextResponse.json({
            debug: true,
            vcf_stats: {
                file_name: vcfFile.name,
                file_size_bytes: vcfFile.size,
                total_lines: vcfContent.split('\n').length,
                header_lines: vcfContent.split('\n').filter((l: string) => l.startsWith('#')).length,
                total_records: allRecords.length,
                pharmacogenomic_matches: pharmaVariants.length,
                genes_profiled: profiles.length,
            },
            // Show first 20 raw records so user can see what's being parsed
            raw_records_sample: allRecords.slice(0, 20).map(r => ({
                chrom: r.chrom,
                pos: r.pos,
                id: r.id,
                ref: r.ref,
                alt: r.alt,
                genotype: r.genotype || 'not_found',
                info_keys: Object.keys(r.info),
            })),
            matched_variants: pharmaVariants,
            gene_profiles: profiles.map(p => ({
                gene: p.gene,
                diplotype: p.diplotype,
                phenotype: p.phenotype,
                activityScore: p.activityScore,
                variant_count: p.variants.length,
            })),
            parse_warnings: warnings.slice(0, 20), // Show first 20 warnings
        });
    } catch (error) {
        console.error('Parse debug error:', error);
        return NextResponse.json(
            { error: 'Failed to parse VCF', details: String(error) },
            { status: 500 }
        );
    }
}
