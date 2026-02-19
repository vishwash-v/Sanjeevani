// ============================================================
// Sanjeevani — Core Type Definitions
// Matches the EXACT JSON schema required by RIFT 2026 hackathon
// ============================================================

export type RiskLabel = 'Safe' | 'Adjust Dosage' | 'Toxic' | 'Ineffective' | 'Unknown';
export type Severity = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type Phenotype = 'PM' | 'IM' | 'NM' | 'RM' | 'URM' | 'Unknown';

export const SUPPORTED_GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'] as const;
export type GeneSymbol = typeof SUPPORTED_GENES[number];

export const SUPPORTED_DRUGS = [
  'CODEINE', 'WARFARIN', 'CLOPIDOGREL', 'SIMVASTATIN', 'AZATHIOPRINE', 'FLUOROURACIL'
] as const;
export type DrugName = typeof SUPPORTED_DRUGS[number];

// ---------- VCF Variant ----------
export interface DetectedVariant {
  rsid: string;
  chromosome: string;
  position: number;
  ref_allele: string;
  alt_allele: string;
  genotype: string;
  gene: GeneSymbol | string;
  clinical_significance: string;
  allele_frequency?: number;
}

// ---------- Risk Assessment ----------
export interface RiskAssessment {
  risk_label: RiskLabel;
  cpic_clinical_action: string;
  confidence_score: number;
  severity: Severity;
}

// ---------- Pharmacogenomic Profile ----------
export interface PharmacogenomicProfile {
  primary_gene: GeneSymbol | string;
  diplotype: string;
  phenotype: Phenotype;
  detected_variants: DetectedVariant[];
}

// ---------- Clinical Recommendation ----------
export interface ClinicalRecommendation {
  action: string;
  dosing_guidance: string;
  alternative_drugs: string[];
  monitoring_recommendations: string;
  cpic_guideline_reference: string;
}

// ---------- LLM Explanation ----------
export interface LLMExplanation {
  summary: string;
  mechanism: string;
  variant_specific_effects: string;
  clinical_context: string;
  references: string[];
}

// ---------- Quality Metrics ----------
export interface QualityMetrics {
  vcf_parsing_success: boolean;
  variants_detected: number;
  pharmacogenes_found: number;
  llm_explanation_generated: boolean;
  processing_time_ms: number;
}

// ---------- Full Analysis Result (Matches Required JSON) ----------
export interface AnalysisResult {
  patient_id: string;
  drug: string;
  timestamp: string;
  risk_assessment: RiskAssessment;
  pharmacogenomic_profile: PharmacogenomicProfile;
  clinical_recommendation: ClinicalRecommendation;
  llm_generated_explanation: LLMExplanation;
  quality_metrics: QualityMetrics;
}

// ---------- Internal Structures ----------
export interface VCFRecord {
  chrom: string;
  pos: number;
  id: string; // rsID
  ref: string;
  alt: string;
  qual: string;
  filter: string;
  info: Record<string, string>;
  format?: string;
  samples?: string[];
  genotype?: string;
}

export interface GeneProfile {
  gene: GeneSymbol;
  diplotype: string;
  phenotype: Phenotype;
  variants: DetectedVariant[];
  activityScore: number;
}

export interface AnalysisRequest {
  vcfContent: string;
  drugs: string[];
}
