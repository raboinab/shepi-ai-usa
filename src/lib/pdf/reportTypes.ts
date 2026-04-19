/**
 * TypeScript interfaces for slide data used in PDF report generation.
 */

export interface ReportMetadata {
  companyName: string;
  projectName: string;
  clientName: string;
  industry: string;
  transactionType: string;
  reportDate: string;
  fiscalYearEnd: string;
  preparedBy?: string;
  confidential?: boolean;
  serviceTier?: 'diy' | 'done_for_you';
}

export interface SlideDefinition {
  id: string;
  title: string;
  section?: string;
  component: React.ComponentType<SlideProps>;
}

export interface SlideProps {
  metadata: ReportMetadata;
  pageNumber: number;
  totalPages: number;
  /** Arbitrary data payload for each slide type */
  data?: Record<string, unknown>;
}

export interface GenerateReportOptions {
  metadata: ReportMetadata;
  slides: SlideDefinition[];
  onProgress?: (current: number, total: number, label: string) => void;
}

export interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
  format?: "currency" | "percent" | "number" | "text";
}

export interface TableRow {
  cells: Record<string, string | number | null>;
  bold?: boolean;
  highlight?: boolean;
  indent?: number;
  separator?: boolean;
}
