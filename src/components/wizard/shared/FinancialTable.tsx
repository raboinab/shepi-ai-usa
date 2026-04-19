import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "currency";
  editable?: boolean;
  width?: string;
}

interface FinancialTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onDataChange: (data: Record<string, unknown>[]) => void;
  allowAddRow?: boolean;
  allowDeleteRow?: boolean;
  newRowTemplate?: Record<string, unknown>;
}

export const FinancialTable = ({
  columns,
  data,
  onDataChange,
  allowAddRow = true,
  allowDeleteRow = true,
  newRowTemplate = {},
}: FinancialTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const handleCellChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    const col = columns.find((c) => c.key === key);
    newData[rowIndex] = {
      ...newData[rowIndex],
      [key]: col?.type === "number" || col?.type === "currency" ? parseFloat(value) || 0 : value,
    };
    onDataChange(newData);
  };

  const addRow = () => {
    onDataChange([...data, { id: Date.now(), ...newRowTemplate }]);
  };

  const deleteRow = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              {allowDeleteRow && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={row.id as string || rowIndex}>
                {columns.map((col) => (
                  <TableCell key={col.key} className="p-1">
                    {col.editable !== false ? (
                      <Input
                        type={col.type === "number" || col.type === "currency" ? "number" : "text"}
                        value={row[col.key] as string || ""}
                        onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : col.type === "currency" ? (
                      <span className="px-3 font-medium">{formatCurrency(row[col.key] as number)}</span>
                    ) : (
                      <span className="px-3">{row[col.key] as string}</span>
                    )}
                  </TableCell>
                ))}
                {allowDeleteRow && (
                  <TableCell className="p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRow(rowIndex)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {allowAddRow && (
        <Button variant="outline" size="sm" onClick={addRow} className="gap-2">
          <Plus className="w-4 h-4" /> Add Row
        </Button>
      )}
    </div>
  );
};
