import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  headers: string[];
  rows: string[][];
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
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    "p-3",
                    j === 0 ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
