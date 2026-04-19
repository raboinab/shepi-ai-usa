/**
 * Industry Configuration Module (v2 - ID-Based Architecture)
 * 
 * This module contains the centralized industry taxonomy for SMB QoE analysis.
 * The industry spine covers ~99% of SMB businesses and includes economic traits
 * that inform AI reasoning for EBITDA benchmarking, risk identification, and
 * normalization guidance.
 * 
 * Architecture:
 * - INDUSTRIES: Stable ID-keyed definitions with user-facing labels
 * - CATEGORY_DEFAULTS: Trait inheritance by category
 * - INDUSTRY_TRAITS: Industry-specific overrides (keyed by stable ID)
 * - resolveIndustry(): Maps legacy strings to IDs with confidence scoring
 * - getIndustryContext(): Returns both JSON and narrative for AI
 */

// ============ TYPES ============

export type IndustryCategory =
  | "professional"
  | "healthcare"
  | "construction_property"
  | "manufacturing"
  | "technology"
  | "distribution"
  | "consumer"
  | "financial_realestate"
  | "energy"
  | "other";

export interface IndustryDefinition {
  id: string;
  label: string;
  category: IndustryCategory;
}

export interface IndustryTraits {
  laborIntensity?: "low" | "medium" | "high" | "unknown";
  revenueRecurrence?: "low" | "medium" | "high" | "unknown";
  seasonality?: "low" | "medium" | "high" | "unknown";
  workingCapitalIntensity?: "low" | "medium" | "high" | "unknown";
  typicalEbitdaMargin?: {
    low: number;
    median: number;
    high: number;
    source?: "internal_v1" | "ibisworld" | "damodaran" | "user_override";
    confidence?: "low" | "medium" | "high";
  };
  qoeRiskFactors?: string[];
}

export interface ResolvedIndustry {
  id: string | null;
  label: string;
  category: IndustryCategory;
  confidence: "exact" | "fuzzy" | "custom";
}

export interface IndustryContext {
  traitsJson: string;
  narrative: string;
}

// ============ INDUSTRY SPINE (55 items with stable IDs) ============

export const INDUSTRIES: IndustryDefinition[] = [
  // Professional & Knowledge-Based Services (9)
  { id: "professional_services", label: "Professional Services", category: "professional" },
  { id: "consulting", label: "Consulting & Advisory", category: "professional" },
  { id: "accounting", label: "Accounting & Tax Services", category: "professional" },
  { id: "legal", label: "Legal Services", category: "professional" },
  { id: "marketing", label: "Marketing, Advertising & Creative", category: "professional" },
  { id: "it_services", label: "IT Services & Managed Services", category: "professional" },
  { id: "staffing", label: "Staffing & Recruiting", category: "professional" },
  { id: "engineering", label: "Engineering Services", category: "professional" },
  { id: "architecture", label: "Architecture & Design", category: "professional" },
  
  // Healthcare & Regulated Care (7)
  { id: "medical_practices", label: "Medical Practices & Clinics", category: "healthcare" },
  { id: "dental", label: "Dental Practices", category: "healthcare" },
  { id: "behavioral_health", label: "Behavioral Health", category: "healthcare" },
  { id: "home_health", label: "Home Health & Hospice", category: "healthcare" },
  { id: "veterinary", label: "Veterinary Services", category: "healthcare" },
  { id: "medical_devices", label: "Medical Devices & Diagnostics", category: "healthcare" },
  { id: "life_sciences", label: "Life Sciences & Biotech", category: "healthcare" },
  
  // Construction, Trades & Field Services (9)
  { id: "commercial_construction", label: "Commercial Construction", category: "construction_property" },
  { id: "residential_construction", label: "Residential Construction", category: "construction_property" },
  { id: "specialty_trades", label: "Specialty Trades", category: "construction_property" },
  { id: "landscaping", label: "Landscaping & Grounds Maintenance", category: "construction_property" },
  { id: "facilities", label: "Facilities Maintenance", category: "construction_property" },
  { id: "janitorial", label: "Janitorial & Cleaning Services", category: "construction_property" },
  { id: "restoration", label: "Restoration & Remediation Services", category: "construction_property" },
  { id: "security", label: "Security & Alarm Services", category: "construction_property" },
  { id: "pest_control", label: "Pest Control Services", category: "construction_property" },
  
  // Manufacturing & Industrial (6)
  { id: "manufacturing", label: "Manufacturing", category: "manufacturing" },
  { id: "precision_manufacturing", label: "Precision Manufacturing", category: "manufacturing" },
  { id: "food_beverage_manufacturing", label: "Food & Beverage Manufacturing", category: "manufacturing" },
  { id: "packaging", label: "Packaging & Materials", category: "manufacturing" },
  { id: "industrial_equipment", label: "Industrial Equipment & Machinery", category: "manufacturing" },
  { id: "contract_manufacturing", label: "Contract Manufacturing", category: "manufacturing" },
  
  // Technology & Digital (6)
  { id: "saas", label: "Software & SaaS", category: "technology" },
  { id: "vertical_saas", label: "Vertical SaaS", category: "technology" },
  { id: "it_hardware", label: "IT Products & Hardware", category: "technology" },
  { id: "ecommerce", label: "E-Commerce & Online Retail", category: "technology" },
  { id: "digital_media", label: "Digital Media & Platforms", category: "technology" },
  { id: "telecom", label: "Telecommunications & Infrastructure", category: "technology" },
  
  // Distribution, Logistics & Transportation (4)
  { id: "wholesale_distribution", label: "Wholesale Distribution", category: "distribution" },
  { id: "transportation", label: "Transportation & Logistics", category: "distribution" },
  { id: "warehousing", label: "Warehousing & Fulfillment", category: "distribution" },
  { id: "route_distribution", label: "Route-Based Distribution", category: "distribution" },
  
  // Consumer, Retail & Hospitality (6)
  { id: "retail", label: "Retail Trade", category: "consumer" },
  { id: "restaurants", label: "Restaurants & Food Service", category: "consumer" },
  { id: "hospitality", label: "Hospitality & Lodging", category: "consumer" },
  { id: "franchise", label: "Franchise Operations", category: "consumer" },
  { id: "personal_services", label: "Personal Services", category: "consumer" },
  { id: "automotive", label: "Automotive Sales & Service", category: "consumer" },
  
  // Financial, Insurance & Real Estate (4)
  { id: "wealth_management", label: "Financial Advisory & Wealth Management", category: "financial_realestate" },
  { id: "insurance", label: "Insurance Agencies & Brokerages", category: "financial_realestate" },
  { id: "real_estate_brokerage", label: "Real Estate Brokerage", category: "financial_realestate" },
  { id: "property_management", label: "Property Management", category: "financial_realestate" },
  
  // Energy, Environmental & Infrastructure (3)
  { id: "energy", label: "Energy Services", category: "energy" },
  { id: "clean_energy", label: "Clean Energy & Environmental Services", category: "energy" },
  { id: "utilities", label: "Utilities & Infrastructure Services", category: "energy" },
  
  // Agriculture, Education & Other (5)
  { id: "agriculture", label: "Agriculture & Agribusiness", category: "other" },
  { id: "education", label: "Education & Training", category: "other" },
  { id: "media", label: "Media & Content Production", category: "other" },
  { id: "nonprofit", label: "Nonprofit & Social Services", category: "other" },
  { id: "other", label: "Other", category: "other" },
];

// ============ CATEGORY DEFAULTS ============

export const CATEGORY_DEFAULTS: Record<IndustryCategory, IndustryTraits> = {
  professional: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
  },
  healthcare: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
  },
  construction_property: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high",
  },
  manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high",
  },
  technology: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
  },
  distribution: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
  },
  consumer: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
  },
  financial_realestate: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
  },
  energy: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
  },
  other: {
    laborIntensity: "unknown",
    revenueRecurrence: "unknown",
    seasonality: "unknown",
    workingCapitalIntensity: "unknown",
  },
};

// ============ INDUSTRY TRAITS (keyed by stable ID) ============

export const INDUSTRY_TRAITS: Partial<Record<string, IndustryTraits>> = {
  // ===== Field Services - High labor, often seasonal =====
  landscaping: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 15, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Seasonal revenue concentration",
      "Owner labor normalization",
      "Subcontractor reclassification",
      "Equipment maintenance timing",
    ],
  },
  janitorial: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 6, median: 12, high: 18, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Employee vs contractor classification",
      "Customer concentration",
      "Equipment/supply cost timing",
      "Multi-location overhead allocation",
    ],
  },
  pest_control: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 10, median: 18, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Recurring vs one-time revenue mix",
      "Route density economics",
      "Chemical costs and timing",
      "Customer acquisition costs",
    ],
  },
  security: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 20, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "RMR vs installation revenue",
      "Attrition rate",
      "Deferred revenue treatment",
      "Equipment capitalization",
    ],
  },
  facilities: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 14, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Contract profitability by site",
      "Labor cost allocation",
      "Subcontractor margins",
      "Customer concentration",
    ],
  },
  restoration: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Revenue recognition timing",
      "Insurance receivable collectibility",
      "Project margin variability",
      "Equipment utilization",
    ],
  },

  // ===== Technology - Low labor, high recurring =====
  saas: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 25, high: 40, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Deferred revenue treatment",
      "Capitalized R&D policy",
      "Stock compensation addbacks",
      "Customer churn and cohort analysis",
      "ARR vs recognized revenue",
    ],
  },
  vertical_saas: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 45, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Implementation revenue recognition",
      "Module upsell sustainability",
      "Niche market concentration",
      "Customer lifetime value",
    ],
  },
  it_services: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Managed services vs project revenue",
      "Technician utilization",
      "Hardware resale margins",
      "Customer concentration",
    ],
  },
  ecommerce: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 5, median: 12, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Platform fee normalization",
      "Inventory obsolescence",
      "Returns reserve adequacy",
      "Customer acquisition costs",
      "Fulfillment cost trends",
    ],
  },

  // ===== Healthcare - Medium labor, regulated =====
  dental: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 20, median: 30, high: 40, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Provider compensation normalization",
      "Hygienist productivity metrics",
      "Insurance reimbursement trends",
      "Lab fees as % of production",
    ],
  },
  medical_practices: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 15, median: 25, high: 35, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Physician compensation normalization",
      "Payer mix and reimbursement",
      "Ancillary revenue sustainability",
      "Staff-to-provider ratios",
    ],
  },
  home_health: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Medicare rate changes",
      "Census volatility",
      "Caregiver turnover costs",
      "Billing and collection timing",
    ],
  },
  behavioral_health: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Clinician compensation models",
      "Payer mix and authorization",
      "Utilization and no-show rates",
      "Regulatory compliance costs",
    ],
  },
  veterinary: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 22, high: 32, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Veterinarian compensation normalization",
      "Pharmacy revenue sustainability",
      "Referral vs primary care mix",
      "Emergency services profitability",
    ],
  },

  // ===== Construction & Trades - Project-based, WC intensive =====
  commercial_construction: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 4, median: 8, high: 14, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Percentage of completion vs completed contract",
      "Backlog quality and profitability",
      "Bonding capacity and limits",
      "Change order timing and recognition",
      "Retainage and billing timing",
    ],
  },
  residential_construction: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Spec vs contract home mix",
      "Land and lot inventory",
      "Warranty reserve adequacy",
      "Subcontractor cost trends",
    ],
  },
  specialty_trades: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Service vs project revenue mix",
      "Warranty reserves",
      "Material cost volatility",
      "Technician productivity",
    ],
  },

  // ===== Consumer & Hospitality =====
  restaurants: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 5, median: 10, high: 18, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Four-wall EBITDA vs consolidated",
      "Labor cost normalization",
      "Lease treatment and rent escalations",
      "Food cost trends",
      "Delivery platform fees",
    ],
  },
  hospitality: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "RevPAR and ADR trends",
      "Seasonality normalization",
      "Management fee treatment",
      "FF&E reserves",
      "OTA commission rates",
    ],
  },
  personal_services: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Stylist/technician compensation",
      "Booth rental vs employee model",
      "Product revenue sustainability",
      "Location profitability",
    ],
  },
  franchise: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 15, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Royalty and advertising fund treatment",
      "Franchise agreement terms",
      "Unit-level economics",
      "Development pipeline sustainability",
    ],
  },
  automotive: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 5, high: 8, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "New vs used vehicle margins",
      "F&I income sustainability",
      "Parts and service profitability",
      "Floorplan interest treatment",
    ],
  },

  // ===== Distribution & Logistics =====
  wholesale_distribution: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 6, high: 10, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Inventory obsolescence",
      "Vendor rebate timing and treatment",
      "Customer concentration",
      "Freight cost trends",
      "LIFO reserve",
    ],
  },
  transportation: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Asset-based vs asset-light model",
      "Driver compensation and turnover",
      "Fuel cost normalization",
      "Equipment age and replacement",
    ],
  },
  route_distribution: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Route density economics",
      "Driver compensation models",
      "Customer acquisition costs",
      "Vehicle and equipment timing",
    ],
  },

  // ===== Manufacturing =====
  manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Inventory costing method (FIFO/LIFO)",
      "Capacity utilization",
      "Customer concentration",
      "Raw material hedging",
      "Standard cost variance analysis",
    ],
  },
  food_beverage_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commodity cost volatility",
      "Co-packer relationships",
      "Trade spend normalization",
      "Spoilage reserves",
      "Recall risk",
    ],
  },
  precision_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 10, median: 16, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Program/contract dependency",
      "Scrap and rework rates",
      "Quality certification costs",
      "Equipment depreciation methods",
    ],
  },
  contract_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 10, high: 16, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Customer concentration",
      "Consignment inventory treatment",
      "Tooling ownership and depreciation",
      "Excess and obsolete reserves",
    ],
  },

  // ===== Professional Services =====
  professional_services: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 22, high: 32, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Partner/owner compensation normalization",
      "Utilization and realization rates",
      "WIP and billing timing",
      "Key person dependency",
    ],
  },
  consulting: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Principal compensation normalization",
      "Project vs retainer revenue mix",
      "Subcontractor pass-through",
      "Client concentration",
    ],
  },
  accounting: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 25, median: 35, high: 48, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Partner compensation normalization",
      "Seasonal revenue concentration",
      "Staff-to-partner leverage",
      "Billing rate sustainability",
    ],
  },
  legal: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 20, median: 32, high: 45, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Partner compensation normalization",
      "Contingency fee timing",
      "WIP and unbilled time",
      "Rainmaker dependency",
    ],
  },
  staffing: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 6, high: 12, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Gross profit per FTE",
      "Temp vs perm placement mix",
      "Payroll funding and timing",
      "Client concentration",
      "Bill rate sustainability",
    ],
  },

  // ===== Financial & Real Estate =====
  wealth_management: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 25, median: 38, high: 55, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "AUM-based vs transaction revenue",
      "Advisor compensation and retention",
      "Client concentration",
      "Regulatory compliance costs",
    ],
  },
  insurance: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commission vs fee revenue",
      "Contingent commission timing",
      "Retention rates",
      "Producer compensation",
    ],
  },
  property_management: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 20, high: 30, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Management fee structure",
      "Ancillary revenue sustainability",
      "Contract terms and churn",
      "Unit count growth trends",
    ],
  },
  real_estate_brokerage: {
    laborIntensity: "low",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 15, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commission split structures",
      "Agent retention and productivity",
      "Market cycle sensitivity",
      "Transaction volume trends",
    ],
  },
};

// ============ HELPER FUNCTIONS ============

/**
 * Infer category for custom industries based on keywords.
 */
function inferCategory(input: string): IndustryCategory {
  const lower = input.toLowerCase();
  
  if (/software|saas|tech|digital|app|platform/.test(lower)) return "technology";
  if (/construct|build|trade|hvac|plumb|electr|roof|landscap|clean|maint|restoration/.test(lower)) return "construction_property";
  if (/health|medical|dental|clinic|hospital|care|vet|hospice/.test(lower)) return "healthcare";
  if (/manufactur|industrial|factory|production|packaging/.test(lower)) return "manufacturing";
  if (/distribut|wholesale|logistics|transport|freight|warehous/.test(lower)) return "distribution";
  if (/restaurant|retail|hotel|hospitality|food|franchise|salon|spa/.test(lower)) return "consumer";
  if (/consult|legal|account|law|advisory|market|staffing|recruit/.test(lower)) return "professional";
  if (/insur|financ|bank|wealth|real estate|property|brokerage/.test(lower)) return "financial_realestate";
  if (/energy|oil|gas|solar|wind|power|utility/.test(lower)) return "energy";
  
  return "other";
}

/**
 * Resolve an industry string to structured data.
 * Handles exact matches, fuzzy matches, and custom industries.
 */
export function resolveIndustry(input: string): ResolvedIndustry {
  if (!input) {
    return { id: null, label: "", category: "other", confidence: "custom" };
  }
  
  // Exact label match
  const exact = INDUSTRIES.find(i => i.label === input);
  if (exact) {
    return { id: exact.id, label: exact.label, category: exact.category, confidence: "exact" };
  }
  
  // Fuzzy match (case-insensitive, trimmed)
  const normalized = input.toLowerCase().trim();
  const fuzzy = INDUSTRIES.find(i => i.label.toLowerCase().trim() === normalized);
  if (fuzzy) {
    return { id: fuzzy.id, label: input, category: fuzzy.category, confidence: "fuzzy" };
  }
  
  // Custom industry - infer category from keywords
  return { id: null, label: input, category: inferCategory(input), confidence: "custom" };
}

/**
 * Get traits for an industry, with category-level inheritance.
 */
export function getIndustryTraits(industryInput: string): IndustryTraits {
  const resolved = resolveIndustry(industryInput);
  
  // If we have an exact ID match with traits, use those
  if (resolved.id && INDUSTRY_TRAITS[resolved.id]) {
    return INDUSTRY_TRAITS[resolved.id]!;
  }
  
  // Fall back to category defaults
  return CATEGORY_DEFAULTS[resolved.category];
}

/**
 * Get structured + narrative context for AI.
 */
export function getIndustryContext(industryInput: string): IndustryContext {
  const resolved = resolveIndustry(industryInput);
  const traits = getIndustryTraits(industryInput);
  
  // Build compact JSON for grounding
  const traitsJson = JSON.stringify({
    industry: resolved.label,
    industryId: resolved.id,
    category: resolved.category,
    confidence: resolved.confidence,
    traits: {
      laborIntensity: traits.laborIntensity,
      seasonality: traits.seasonality,
      revenueRecurrence: traits.revenueRecurrence,
      workingCapitalIntensity: traits.workingCapitalIntensity,
      ebitdaRange: traits.typicalEbitdaMargin 
        ? `${traits.typicalEbitdaMargin.low}-${traits.typicalEbitdaMargin.high}%`
        : null,
    },
  });
  
  // Build narrative bullets
  const parts: string[] = [`Industry: ${resolved.label}`];
  if (resolved.confidence === "custom") {
    parts.push(`(Custom industry, inferred category: ${resolved.category})`);
  }
  
  if (traits.laborIntensity === "high") {
    parts.push("- High labor intensity: Watch for owner compensation normalization");
  }
  if (traits.seasonality === "high") {
    parts.push("- Seasonal business: Analyze revenue by month, normalize working capital");
  }
  if (traits.workingCapitalIntensity === "high") {
    parts.push("- Working capital intensive: Focus on inventory, AR/AP trends");
  }
  if (traits.revenueRecurrence === "high") {
    parts.push("- Recurring revenue: Analyze churn, retention metrics");
  } else if (traits.revenueRecurrence === "low") {
    parts.push("- Project/transaction-based: Focus on backlog, pipeline, concentration");
  }
  if (traits.qoeRiskFactors?.length) {
    parts.push(`- Key QoE risks: ${traits.qoeRiskFactors.join(", ")}`);
  }
  if (traits.typicalEbitdaMargin) {
    const conf = traits.typicalEbitdaMargin.confidence || "medium";
    parts.push(`- EBITDA range: ${traits.typicalEbitdaMargin.low}%-${traits.typicalEbitdaMargin.high}% (${conf} confidence)`);
  }
  
  return {
    traitsJson,
    narrative: parts.join("\n"),
  };
}

/**
 * Backward-compatible: Get industry labels for dropdown.
 */
export function getIndustryLabels(): string[] {
  return INDUSTRIES.map(i => i.label);
}

/**
 * Find industry by ID.
 */
export function getIndustryById(id: string): IndustryDefinition | undefined {
  return INDUSTRIES.find(i => i.id === id);
}

/**
 * Assess EBITDA margin with provenance awareness.
 */
export function assessEbitdaMargin(
  industryInput: string, 
  margin: number
): { assessment: "below" | "within" | "above"; rangeText: string; confidence: string } {
  const traits = getIndustryTraits(industryInput);
  
  if (!traits.typicalEbitdaMargin) {
    // Generic fallback
    const assessment = margin > 15 ? "above" : margin > 10 ? "within" : "below";
    return { assessment, rangeText: "vs general benchmarks", confidence: "low" };
  }
  
  const { low, high, confidence = "medium" } = traits.typicalEbitdaMargin;
  const assessment = margin < low ? "below" : margin > high ? "above" : "within";
  const rangeText = `industry range: ${low}%-${high}%`;
  
  return { assessment, rangeText, confidence };
}

/**
 * Get a compact industry summary for tooltips/badges.
 */
export function getIndustrySummary(industryInput: string): string {
  const traits = getIndustryTraits(industryInput);
  const parts: string[] = [];
  
  if (traits.laborIntensity === "high") parts.push("Labor-intensive");
  if (traits.seasonality === "high") parts.push("Seasonal");
  if (traits.revenueRecurrence === "high") parts.push("Recurring revenue");
  if (traits.workingCapitalIntensity === "high") parts.push("WC-heavy");
  
  if (parts.length === 0) return "Standard business model";
  return parts.join(" • ");
}

// Legacy type export for backward compatibility
export type Industry = string;
