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
    name: "Lovable Cloud",
    purpose: "Database, authentication, file storage, backend functions",
    dataProcessed: "All user and project data",
    location: "United States",
  },
  {
    name: "Stripe",
    purpose: "Payment processing",
    dataProcessed: "Billing information, email address",
    location: "United States",
  },
  {
    name: "Google AI (Gemini)",
    purpose: "AI-assisted financial analysis",
    dataProcessed: "Financial data sent for analysis",
    location: "United States",
  },
  {
    name: "OpenAI (GPT)",
    purpose: "AI-assisted financial analysis",
    dataProcessed: "Financial data sent for analysis",
    location: "United States",
  },
  {
    name: "Termageddon",
    purpose: "Legal policy hosting",
    dataProcessed: "None (policies only)",
    location: "United States",
  },
  {
    name: "Usercentrics",
    purpose: "Cookie consent management",
    dataProcessed: "Cookie preferences, IP address",
    location: "Germany (EU)",
  },
];

export default function Subprocessors() {
  useSEO({
    title: "Subprocessors — Shepi",
    description:
      "List of third-party subprocessors that Shepi uses to deliver its services, including their purposes and data processing locations.",
    canonical: "https://shepi.ai/subprocessors",
  });

  return (
    <LegalPageLayout title="Subprocessors">
      <p className="text-muted-foreground mb-6">
        Shepi (operated by SMB EDGE) uses the following third-party
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
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subprocessors.map((sp) => (
            <TableRow key={sp.name}>
              <TableCell className="font-medium">{sp.name}</TableCell>
              <TableCell>{sp.purpose}</TableCell>
              <TableCell>{sp.dataProcessed}</TableCell>
              <TableCell>{sp.location}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-sm text-muted-foreground mt-8">
        <strong>Last updated:</strong> February 22, 2026
      </p>

      <p className="text-sm text-muted-foreground mt-4">
        If you have questions about our subprocessors, please contact us at{" "}
        <a
          href="mailto:privacy@shepi.ai"
          className="text-primary hover:underline"
        >
          privacy@shepi.ai
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
