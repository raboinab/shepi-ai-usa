import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, FileSpreadsheet } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface SpreadsheetReportViewerProps {
  rawData: string[][];
  title?: string;
  syncedAt?: string;
  skipEmptyRows?: boolean;
  headerRowIndex?: number;
}

type RowType = 'header' | 'section' | 'subtotal' | 'total' | 'data' | 'empty';

const TEXT_COLUMN_PATTERNS = /acct|account|line item|sub-account|description|name|category|label/i;

const isTextColumn = (headerValue: string | undefined | null): boolean => {
  if (!headerValue) return false;
  return TEXT_COLUMN_PATTERNS.test(headerValue);
};

const formatCell = (value: string | undefined | null, isText: boolean): string => {
  if (!value || value.trim() === '') return '';
  if (isText) return value;
  
  // Preserve already-formatted percent values and non-meaningful markers
  if (value.trim().endsWith('%') || value.trim() === 'N/M') return value;
  
  // Remove existing formatting characters and try to parse as number
  const cleanValue = value.toString().replace(/[$,()]/g, '').trim();
  const isNegative = value.includes('(') || cleanValue.startsWith('-');
  const num = parseFloat(cleanValue.replace('-', ''));
  
  if (!isNaN(num) && cleanValue !== '' && !/^[a-zA-Z]/.test(cleanValue)) {
    // Format as currency
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(num));
    
    return isNegative ? `(${formatted.replace('$', '')})` : formatted;
  }
  
  return value;
};

const getRowType = (row: string[], rowIndex: number, headerRowIndex: number): RowType => {
  const firstCell = (row[0] || '').toLowerCase().trim();
  const allEmpty = row.every(cell => !cell || cell.trim() === '');
  
  if (allEmpty) return 'empty';
  if (rowIndex === headerRowIndex) return 'header';
  
  // Check for total rows
  if (firstCell.includes('total') || firstCell.includes('net income') || 
      firstCell.includes('gross profit') || firstCell.includes('ebitda') ||
      firstCell.includes('total liabilities & equity') || firstCell.includes('total l&e')) {
    return firstCell.startsWith('total') ? 'total' : 'subtotal';
  }
  
  // Check for section headers (usually have empty values in data columns)
  const nonEmptyCells = row.filter(cell => cell && cell.trim() !== '').length;
  if (nonEmptyCells === 1 && firstCell !== '') {
    // Single cell populated - likely a section header
    if (firstCell.match(/^(revenue|sales|income|expenses|cost|assets|liabilities|equity|operating|other)/i)) {
      return 'section';
    }
  }
  
  return 'data';
};

const getRowStyles = (rowType: RowType): string => {
  switch (rowType) {
    case 'header':
      return 'bg-muted font-semibold border-b-2 border-border';
    case 'section':
      return 'bg-muted/50 font-medium';
    case 'subtotal':
      return 'font-semibold border-t border-border';
    case 'total':
      return 'font-bold bg-primary/10 border-t-2 border-border';
    case 'empty':
      return 'h-4';
    default:
      return '';
  }
};

const getCellStyles = (rowType: RowType, colIndex: number): string => {
  const base = colIndex === 0 ? 'text-left' : 'text-right';
  
  if (rowType === 'header') {
    return `${base} py-3 px-4`;
  }
  if (rowType === 'section') {
    return `${base} py-2 px-4`;
  }
  if (rowType === 'total' || rowType === 'subtotal') {
    return `${base} py-2 px-4`;
  }
  
  return `${base} py-1.5 px-4 ${colIndex === 0 ? 'pl-6' : ''}`;
};

export const SpreadsheetReportViewer = ({
  rawData,
  title,
  syncedAt,
  skipEmptyRows = false,
  headerRowIndex = 0,
}: SpreadsheetReportViewerProps) => {
  if (!rawData || rawData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">No report data available.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sync from the spreadsheet to populate this report.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Determine column count from the widest row
  const columnCount = Math.max(...rawData.map(row => row.length));
  
  // Identify text columns from header row
  const headerRow = rawData[headerRowIndex] || [];
  const textColumnFlags = Array.from({ length: columnCount }, (_, i) => isTextColumn(headerRow[i]));
  
  // Filter rows if needed
  const displayRows = skipEmptyRows 
    ? rawData.filter(row => row.some(cell => cell && cell.trim() !== ''))
    : rawData;

  return (
    <Card>
      {(title || syncedAt) && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            {syncedAt && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Clock className="w-3 h-3" />
                Synced {formatDistanceToNow(new Date(syncedAt), { addSuffix: true })}
              </Badge>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={title || syncedAt ? '' : 'pt-4'}>
        <ScrollArea className="w-full">
          <div className="min-w-max">
            <Table>
              <TableBody>
                {displayRows.map((row, rowIndex) => {
                  const rowType = getRowType(row, rowIndex, headerRowIndex);
                  
                  if (rowType === 'empty' && skipEmptyRows) return null;
                  
                  return (
                    <TableRow key={rowIndex} className={getRowStyles(rowType)}>
                      {Array.from({ length: columnCount }).map((_, colIndex) => {
                        const cellValue = row[colIndex];
                        const formattedValue = rowType === 'header' 
                          ? cellValue 
                          : formatCell(cellValue, textColumnFlags[colIndex]);
                        
                        const CellComponent = rowType === 'header' ? TableHead : TableCell;
                        
                        return (
                          <CellComponent 
                            key={colIndex}
                            className={getCellStyles(rowType, colIndex)}
                          >
                            {formattedValue}
                          </CellComponent>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
