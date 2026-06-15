import { LegalPageLayout } from "@/components/LegalPageLayout";
import { useSEO } from "@/hooks/useSEO";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const subprocessors = [
  {
    name: "Supabase (Lovable Cloud)",
    purpose: "Database, authentication, file storage, edge functions",
    dataProcessed: "All user and project data",
    certifications: "SOC 2 Type II · HIPAA available",
    location: "United States (AWS)",
  },
  {
    name: "Amazon Web Services",
    purpose: "Underlying compute, network, and storage for Supabase",
    dataProcessed: "All user and project data (encrypted at rest)",
    certifications: "SOC 1 / 2 / 3 Type II · ISO 27001 / 27017 / 27018 · PCI DSS L1 · HIPAA-eligible",
    location: "United States (us-east)",
  },
  {
    name: "Stripe",
    purpose: "Payment processing",
    dataProcessed: "Billing information, email address",
    certifications: "PCI DSS Level 1 · SOC 1 / 2 Type II",
    location: "United States",
  },
  {
    name: "Vercel (AI Gateway)",
    purpose:
      "AI model routing for document parsing, financial analysis, narrative generation, and vector embeddings. Operates under a Zero Data Retention agreement; upstream model providers (Anthropic Claude, OpenAI) process requests as sub-processors under no-retention terms.",
    dataProcessed: "Financial data and document contents sent for analysis",
    certifications: "SOC 2 Type II · ISO 27001 · GDPR",
    location: "United States",
  },
  {
    name: "Intuit (QuickBooks)",
    purpose: "OAuth source of accounting data when customer connects their accounting system",
    dataProcessed: "Read-only GL, transactions, and chart of accounts",
    certifications: "SOC 2 · ISO 27001",
    location: "United States",
  },
  {
    name: "Termageddon",
    purpose: "Legal policy hosting",
    dataProcessed: "None (policies only)",
    certifications: "—",
    location: "United States",
  },
  {
    name: "Usercentrics",
    purpose: "Cookie consent management",
    dataProcessed: "Cookie preferences, IP address",
    certifications: "ISO 27001",
    location: "Germany (EU)",
  },
];

export default function Subprocessors() {
  const __seoTags = useSEO({
    title: "Subprocessors — shepi",
    description:
      "List of third-party subprocessors that shepi uses to deliver its services, including their purposes and data processing locations.",
    canonical: "https://shepi.ai/subprocessors",
  });

  return (
    <LegalPageLayout title="Subprocessors">
      {__seoTags}
      <p className="text-muted-foreground mb-6">
        shepi (operated by SMB EDGE) uses the following third-party
        subprocessors to deliver and support our services. This page is
        maintained in accordance with our obligations under applicable data
        protection laws, including the UK GDPR and Canadian PIPEDA.
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subprocessor</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Data Processed</TableHead>
            <TableHead>Certifications</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subprocessors.map((sp) => (
            <TableRow key={sp.name}>
              <TableCell className="font-medium">{sp.name}</TableCell>
              <TableCell>{sp.purpose}</TableCell>
              <TableCell>{sp.dataProcessed}</TableCell>
              <TableCell className="text-sm">{sp.certifications}</TableCell>
              <TableCell>{sp.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-sm text-muted-foreground mt-8">
        <strong>Last updated:</strong> May 17, 2026
      </p>

      <p className="text-sm text-muted-foreground mt-4">
        If you have questions about our subprocessors, please contact us at{" "}
        <a
          href="mailto:hello@shepi.ai"
          className="text-primary hover:underline"
        >
          hello@shepi.ai
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
