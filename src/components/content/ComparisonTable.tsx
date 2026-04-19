import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  headers: [string, string, string];
  rows: [string, string, string][];
  className?: string;
}

export function ComparisonTable({ headers, rows, className }: ComparisonTableProps) {
  return (
    <div className={cn("not-prose overflow-x-auto mb-8", className)}>
      <table className="w-full text-sm border border-border rounded-lg">
        <thead>
          <tr className="bg-muted/30">
            {headers.map((h, i) => (
              <th key={i} className="text-left p-3 border-b border-border font-semibold text-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/10")}>
              <td className="p-3 font-medium text-foreground">{row[0]}</td>
              <td className="p-3 text-muted-foreground">{row[1]}</td>
              <td className="p-3 text-foreground">{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
