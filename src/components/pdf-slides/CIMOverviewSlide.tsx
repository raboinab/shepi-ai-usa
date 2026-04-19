/**
 * CIM Overview slide — renders parsed CIM insights (business description,
 * products/services, key risks, growth drivers).
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface CIMData {
  businessOverview?: string;
  productsServices?: string[];
  keyRisks?: string[];
  growthDrivers?: string[];
  managementTeam?: string[];
}

export function CIMOverviewSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const cim = (data as CIMData) || {};

  const overview = cim.businessOverview || `Overview information for ${metadata.companyName} will be populated from CIM analysis.`;
  const products = cim.productsServices || [];
  const risks = cim.keyRisks || [];
  const drivers = cim.growthDrivers || [];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Business Overview">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        {/* Title */}
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Business Overview
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />

        {/* Overview paragraph */}
        <div style={{ fontSize: 16, lineHeight: 1.7, color: PDF_COLORS.midGray, marginBottom: 32, maxWidth: 1600 }}>
          {overview}
        </div>

        {/* Three-column grid */}
        <div style={{ display: "flex", gap: 40 }}>
          {/* Products / Services */}
          {products.length > 0 && (
            <div style={{ flex: 1, backgroundColor: PDF_COLORS.offWhite, borderRadius: 8, padding: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>
                Products & Services
              </div>
              {products.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: PDF_COLORS.teal, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: PDF_COLORS.darkGray, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Growth Drivers */}
          {drivers.length > 0 && (
            <div style={{ flex: 1, backgroundColor: PDF_COLORS.offWhite, borderRadius: 8, padding: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>
                Growth Drivers
              </div>
              {drivers.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: PDF_COLORS.green, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: PDF_COLORS.darkGray, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Key Risks */}
          {risks.length > 0 && (
            <div style={{ flex: 1, backgroundColor: PDF_COLORS.offWhite, borderRadius: 8, padding: 28 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 16, textTransform: "uppercase", letterSpacing: "1px" }}>
                Key Risks
              </div>
              {risks.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: PDF_COLORS.red, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: PDF_COLORS.darkGray, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlideLayout>
  );
}
