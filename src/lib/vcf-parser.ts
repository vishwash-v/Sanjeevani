// ============================================================
// Sanjeevani — VCF File Parser (v5 — Edge-case hardened)
//
// Handles all 7 CPIC-validated exception scenarios:
//   1. Low quality variants (QUAL<20, FILTER!=PASS, DP<10)
//   2. Missing GENE INFO field (falls back to rsID/position)
//   3. FORMAT/SAMPLE field count mismatch
//   4. Compound heterozygous (multi-variant same gene)
//   5. Multi-gene same file (drug-gene filtering)
//   6. chr prefix normalization
//   7. Empty VCF graceful handling
// ============================================================

import { VCFRecord, DetectedVariant, GeneProfile, GeneSymbol, SUPPORTED_GENES } from './types';
import { lookupByRsid, lookupByPosition, calculateActivityScore, activityScoreToPhenotype, VariantDefinition } from './cpic-data';

// ─── Quality thresholds ───
const MIN_QUAL_SCORE = 20;   // Skip variants below this QUAL
const MIN_READ_DEPTH = 10;   // Skip variants with depth below this
const MIN_GENO_QUALITY = 15; // Warn on low genotype quality

// ─── Parse Warnings ───
export interface ParseWarning {
    line: number;
    field: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
}

// ─── EXCEPTION 1, 3, 6: Line parsing with quality filtering + FORMAT validation ───
export function parseVCF(vcfContent: string): { records: VCFRecord[]; warnings: ParseWarning[] } {
    const lines = vcfContent.split('\n');
    const records: VCFRecord[] = [];
    const warnings: ParseWarning[] = [];
    let lineNumber = 0;

    for (const line of lines) {
        lineNumber++;

        // Skip headers and empty lines
        if (line.startsWith('#') || line.trim() === '') continue;

        // Split by tab; fall back to whitespace for non-standard files
        let fields = line.split('\t');
        if (fields.length < 5) {
            fields = line.split(/\s+/);
        }

        // Minimum: CHROM, POS, ID, REF, ALT
        if (fields.length < 5) {
            warnings.push({
                line: lineNumber,
                field: 'ALL',
                message: `Skipped — only ${fields.length} column(s) found, need at least 5 (CHROM, POS, ID, REF, ALT)`,
                severity: 'error',
            });
            continue;
        }

        const [chrom, pos, id, ref, alt, qual, filter, ...rest] = fields;

        // Validate position
        const posNum = parseInt(pos, 10);
        if (isNaN(posNum)) {
            warnings.push({
                line: lineNumber,
                field: 'POS',
                message: `Invalid position "${pos}" — must be a number`,
                severity: 'error',
            });
            continue;
        }

        // ─── EXCEPTION 1: Quality filtering ───
        // Skip variants with QUAL below threshold
        const qualNum = parseFloat(qual);
        if (!isNaN(qualNum) && qualNum < MIN_QUAL_SCORE) {
            warnings.push({
                line: lineNumber,
                field: 'QUAL',
                message: `Variant skipped — QUAL=${qualNum} is below minimum threshold (${MIN_QUAL_SCORE}). Low-quality variants may be sequencing artifacts.`,
                severity: 'warning',
            });
            continue;
        }

        // Skip variants that did NOT pass filters (except . and PASS)
        if (filter && filter !== '.' && filter !== 'PASS') {
            warnings.push({
                line: lineNumber,
                field: 'FILTER',
                message: `Variant skipped — FILTER="${filter}" indicates the variant did not pass quality control. Only PASS variants are used for pharmacogenomic analysis.`,
                severity: 'warning',
            });
            continue;
        }

        // Warn on missing optional fields (don't skip)
        if (!id || id === '.') {
            warnings.push({
                line: lineNumber,
                field: 'ID',
                message: 'rsID missing — will attempt chr:pos matching against database',
                severity: 'info',
            });
        }

        if (!qual || qual === '.') {
            warnings.push({
                line: lineNumber,
                field: 'QUAL',
                message: 'Quality score missing — variant will still be processed but with lower confidence',
                severity: 'info',
            });
        }

        // Parse INFO field
        const infoStr = rest[0] || '';
        const info: Record<string, string> = {};
        if (infoStr && infoStr !== '.') {
            infoStr.split(';').forEach(pair => {
                const eqIdx = pair.indexOf('=');
                if (eqIdx > 0) {
                    info[pair.substring(0, eqIdx).toUpperCase()] = pair.substring(eqIdx + 1);
                } else {
                    info[pair.toUpperCase()] = 'true';
                }
            });
        }

        // ─── EXCEPTION 3: FORMAT/SAMPLE field count validation ───
        let genotype = '1/1'; // Default when no genotype data
        const formatStr = rest.length >= 2 ? rest[1] : undefined;
        const sampleStr = rest.length >= 3 ? rest[2] : undefined;

        if (formatStr && sampleStr) {
            const formatFields = formatStr.split(':');
            const sampleFields = sampleStr.split(':');

            // Check FORMAT/SAMPLE field count mismatch
            if (formatFields.length !== sampleFields.length) {
                warnings.push({
                    line: lineNumber,
                    field: 'FORMAT',
                    message: `FORMAT/SAMPLE field count mismatch — FORMAT has ${formatFields.length} fields (${formatStr}) but SAMPLE has ${sampleFields.length} values. Using available fields cautiously.`,
                    severity: 'warning',
                });
            }

            // Extract GT (genotype)
            const gtIndex = formatFields.indexOf('GT');
            if (gtIndex >= 0 && gtIndex < sampleFields.length) {
                genotype = sampleFields[gtIndex];
            } else {
                warnings.push({
                    line: lineNumber,
                    field: 'FORMAT/GT',
                    message: 'Genotype (GT) not found in FORMAT — defaulting to 1/1 (homozygous)',
                    severity: 'warning',
                });
            }

            // ─── EXCEPTION 1 (cont): Read depth (DP) filtering ───
            const dpIndex = formatFields.indexOf('DP');
            if (dpIndex >= 0 && dpIndex < sampleFields.length) {
                const dp = parseInt(sampleFields[dpIndex], 10);
                if (!isNaN(dp) && dp < MIN_READ_DEPTH) {
                    warnings.push({
                        line: lineNumber,
                        field: 'DP',
                        message: `Variant skipped — read depth DP=${dp} is below minimum threshold (${MIN_READ_DEPTH}). Insufficient sequencing coverage may produce unreliable genotype calls.`,
                        severity: 'warning',
                    });
                    continue; // Skip this variant
                }
            }

            // Genotype quality (GQ) warning
            const gqIndex = formatFields.indexOf('GQ');
            if (gqIndex >= 0 && gqIndex < sampleFields.length) {
                const gq = parseInt(sampleFields[gqIndex], 10);
                if (!isNaN(gq) && gq < MIN_GENO_QUALITY) {
                    warnings.push({
                        line: lineNumber,
                        field: 'GQ',
                        message: `Low genotype quality (GQ=${gq}) — genotype call may be unreliable. Consider validating with orthogonal method.`,
                        severity: 'warning',
                    });
                    // Don't skip — just warn and lower confidence downstream
                }
            }
        } else {
            warnings.push({
                line: lineNumber,
                field: 'FORMAT',
                message: 'No FORMAT/SAMPLE columns — defaulting genotype to 1/1 (homozygous)',
                severity: 'info',
            });
        }

        // ─── EXCEPTION 6: Chromosome normalization (chr6 → 6) ───
        records.push({
            chrom: chrom.replace(/^chr/i, ''),
            pos: posNum,
            id: id || '.',
            ref,
            alt,
            qual: qual || '.',
            filter: filter || '.',
            info,
            format: formatStr,
            genotype,
        });
    }

    return { records, warnings };
}

// ─── EXCEPTION 7: VCF Validation (empty file handling) ───
export function validateVCF(vcfContent: string): { valid: boolean; error?: string } {
    if (!vcfContent || vcfContent.trim().length === 0) {
        return { valid: false, error: 'VCF file is empty' };
    }

    const dataLines = vcfContent.split('\n').filter(l => !l.startsWith('#') && l.trim() !== '');
    if (dataLines.length === 0) {
        return { valid: false, error: 'No actionable pharmacogenomic variants found. The VCF file contains only headers and no variant records.' };
    }

    const hasValidLine = dataLines.some(line => {
        const fields = line.split('\t');
        if (fields.length >= 5) return true;
        return line.split(/\s+/).length >= 5;
    });

    if (!hasValidLine) {
        return { valid: false, error: 'No valid variant records found (expected at least 5 columns: CHROM, POS, ID, REF, ALT)' };
    }

    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════
// EXCEPTION 2, 4, 5: Variant matching with rsID/position fallback,
//                     compound het support, star-allele dedup
// ═══════════════════════════════════════════════════════════════

export function extractPharmaVariants(records: VCFRecord[], warnings: ParseWarning[] = []): { variants: DetectedVariant[]; coveredGenes: Set<GeneSymbol> } {
    const variants: DetectedVariant[] = [];
    const coveredGenes = new Set<GeneSymbol>();
    const seenStarAlleles = new Set<string>();
    const seenPositions = new Set<string>();

    for (const record of records) {
        let matched: VariantDefinition | undefined;
        let matchMethod = '';

        // Strategy 1: rsID match (highest priority)
        const rsids = record.id.split(';').map(s => s.trim()).filter(s => s !== '.' && s !== '');
        for (const rsid of rsids) {
            matched = lookupByRsid(rsid);
            if (matched) {
                matchMethod = 'rsID';
                break;
            }
        }

        // Strategy 2: Position match — critical when rsID is missing
        if (!matched) {
            matched = lookupByPosition(record.chrom, record.pos);
            if (matched) matchMethod = 'chr:pos';
        }

        // ─── EXCEPTION 2: Missing GENE field handled here ───
        // If rsID and position both fail, try INFO GENE tag fallback
        if (!matched) {
            const geneName = record.info.GENE || record.info.GENEINFO?.split(':')[0] || '';
            if ((SUPPORTED_GENES as readonly string[]).includes(geneName)) {
                // Track that this gene's loci appeared in the VCF
                coveredGenes.add(geneName as GeneSymbol);
                // Skip 0/0 (homozygous reference) — patient does not carry variant
                if (!doesCarryVariant(record)) continue;
                const posKey = `${geneName}:${record.chrom}:${record.pos}`;
                if (!seenPositions.has(posKey)) {
                    seenPositions.add(posKey);
                    variants.push({
                        rsid: record.id !== '.' ? record.id : `${record.chrom}:${record.pos}`,
                        chromosome: record.chrom,
                        position: record.pos,
                        ref_allele: record.ref,
                        alt_allele: record.alt,
                        genotype: record.genotype || '0/1',
                        gene: geneName as GeneSymbol,
                        clinical_significance: record.info.STAR
                            ? `Star allele ${record.info.STAR} in ${geneName} (${record.info.EFFECT || 'unknown effect'})`
                            : `Variant in pharmacogene ${geneName}`,
                    });
                }
                continue;
            }
        }

        if (!matched) continue;

        // ─── CRITICAL: Track gene as covered even for 0/0 reference calls ───
        // This means the VCF actually sequenced this gene's loci.
        // A 0/0 call AT a known locus = gene tested, variant not present (normal).
        // This is different from the gene's loci not appearing in the VCF at all.
        coveredGenes.add(matched.gene);

        // ─── Warn when GENE INFO is missing but variant was matched via database ───
        const infoGene = record.info.GENE || record.info.GENEINFO?.split(':')[0] || '';
        if (!infoGene) {
            warnings.push({
                line: 0,
                field: 'INFO/GENE',
                message: `GENE field missing in INFO column for ${record.id || `chr${record.chrom}:${record.pos}`}. Gene inferred as ${matched.gene} (${matched.starAllele}) via ${matchMethod} match against CPIC variant database.`,
                severity: 'warning',
            });
        }

        // Deduplicate same star allele from different rsIDs
        const starKey = `${matched.gene}:${matched.starAllele}`;
        if (seenStarAlleles.has(starKey)) continue;

        const posKey = `${matched.gene}:${record.chrom}:${record.pos}`;
        if (seenPositions.has(posKey)) continue;

        // Check if patient carries the variant allele
        if (!doesCarryVariant(record)) continue;

        seenStarAlleles.add(starKey);
        seenPositions.add(posKey);

        variants.push({
            rsid: matched.rsid,
            chromosome: record.chrom,
            position: record.pos,
            ref_allele: record.ref,
            alt_allele: record.alt,
            genotype: record.genotype || '0/1',
            gene: matched.gene,
            clinical_significance: `${matched.starAllele}: ${matched.significance} [${matchMethod}]`,
        });
    }

    return { variants, coveredGenes };
}

function doesCarryVariant(record: VCFRecord): boolean {
    const gt = record.genotype || '';
    if (gt === '0/0' || gt === '0|0') return false;
    return true;
}

function isHomozygousVariant(genotype: string): boolean {
    return genotype === '1/1' || genotype === '1|1';
}

// ═══════════════════════════════════════════════════════════════
// EXCEPTION 4: BUILD GENE PROFILES with compound heterozygous
//   support — properly combines *2 + *3 on different alleles
//   into a compound het diplotype (*2/*3)
// EXCEPTION 5: Multi-gene handled — each gene gets its own
//   profile; drug-gene filtering happens in risk-engine.ts
// ═══════════════════════════════════════════════════════════════

export function buildGeneProfiles(variants: DetectedVariant[]): GeneProfile[] {
    const geneMap = new Map<GeneSymbol, DetectedVariant[]>();
    for (const v of variants) {
        const gene = v.gene as GeneSymbol;
        if (!geneMap.has(gene)) geneMap.set(gene, []);
        geneMap.get(gene)!.push(v);
    }

    const profiles: GeneProfile[] = [];

    for (const [gene, geneVariants] of geneMap) {
        const seenStars = new Set<string>();
        const alleleActivities: { star: string; activity: number; genotype: string }[] = [];

        for (const variant of geneVariants) {
            const dbEntry = lookupByRsid(variant.rsid) || lookupByPosition(variant.chromosome, variant.position);
            if (!dbEntry) continue;

            if (seenStars.has(dbEntry.starAllele)) continue;
            seenStars.add(dbEntry.starAllele);

            alleleActivities.push({
                star: dbEntry.starAllele,
                activity: dbEntry.activityValue,
                genotype: variant.genotype,
            });
        }

        // ── Determine allele 1 and allele 2 activity values ──
        // EXCEPTION 4: Compound heterozygous resolution
        //   Two heterozygous variants (0/1) in same gene → compound het
        //   e.g., CYP2C19 *2 (0/1) + *3 (0/1) = *2/*3 (PM)
        let allele1Activity = 1.0;
        let allele2Activity = 1.0;

        if (alleleActivities.length === 0) {
            allele1Activity = 1.0;
            allele2Activity = 1.0;
        } else if (alleleActivities.length === 1) {
            const entry = alleleActivities[0];
            if (isHomozygousVariant(entry.genotype)) {
                allele1Activity = entry.activity;
                allele2Activity = entry.activity;
            } else {
                allele1Activity = 1.0;
                allele2Activity = entry.activity;
            }
        } else {
            // ─── COMPOUND HETEROZYGOUS ───
            // Multiple distinct variants in this gene
            // Sort by activity (worst first) for conservative assignment
            const sorted = [...alleleActivities].sort((a, b) => a.activity - b.activity);

            // Check if any variant is homozygous
            const homoVariant = sorted.find(v => isHomozygousVariant(v.genotype));

            if (homoVariant) {
                // Homozygous variant takes both alleles
                allele1Activity = homoVariant.activity;
                allele2Activity = homoVariant.activity;
            } else {
                // Both heterozygous → compound het
                // Assign worst variant to allele 1, next-worst to allele 2
                allele1Activity = sorted[0].activity;
                allele2Activity = sorted.length >= 2 ? sorted[1].activity : 1.0;
            }
        }

        const totalActivityScore = calculateActivityScore(allele1Activity, allele2Activity);
        const phenotype = activityScoreToPhenotype(gene, totalActivityScore);

        // ── Build diplotype string ──
        const starAlleles = alleleActivities.map(a => a.star);
        let diplotype: string;
        if (starAlleles.length === 0) {
            diplotype = '*1/*1';
        } else if (starAlleles.length === 1) {
            if (isHomozygousVariant(alleleActivities[0].genotype)) {
                diplotype = `${starAlleles[0]}/${starAlleles[0]}`;
            } else {
                diplotype = `*1/${starAlleles[0]}`;
            }
        } else {
            // Compound heterozygote
            diplotype = `${starAlleles[0]}/${starAlleles[1]}`;
        }

        profiles.push({
            gene,
            diplotype,
            phenotype,
            variants: geneVariants,
            activityScore: Math.round(totalActivityScore * 100) / 100,
        });
    }

    return profiles;
}

// ═══════════════════════════════════════════════════════════════
// Full pipeline: VCF content → parsed records + profiles
// ═══════════════════════════════════════════════════════════════

export function analyzeVCF(vcfContent: string): {
    records: VCFRecord[];
    variants: DetectedVariant[];
    profiles: GeneProfile[];
    coveredGenes: Set<GeneSymbol>;
    warnings: ParseWarning[];
    error?: string;
} {
    const validation = validateVCF(vcfContent);
    if (!validation.valid) {
        return { records: [], variants: [], profiles: [], coveredGenes: new Set(), warnings: [], error: validation.error };
    }

    const { records, warnings } = parseVCF(vcfContent);

    // If all records were filtered out by quality checks, report gracefully
    if (records.length === 0) {
        warnings.push({
            line: 0,
            field: 'ALL',
            message: 'No variants passed quality filters. All variants were excluded due to low QUAL, failed FILTER, or insufficient read depth (DP).',
            severity: 'warning',
        });
        return { records: [], variants: [], profiles: [], coveredGenes: new Set(), warnings };
    }

    const { variants, coveredGenes } = extractPharmaVariants(records, warnings);
    const profiles = buildGeneProfiles(variants);

    // Also mark genes that have profiles as covered
    for (const p of profiles) {
        coveredGenes.add(p.gene);
    }

    return { records, variants, profiles, coveredGenes, warnings };
}
