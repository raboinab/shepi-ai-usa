import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Download, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TableInfo {
  table: string;
  count: number;
}

type ExportStatus = 'idle' | 'loading-list' | 'exporting' | 'done' | 'error';

const HEAVY_TABLES: Record<string, number> = {
  canonical_transactions: 1000,
  rag_chunks: 1000,
  processed_data: 2000,
  project_data_chunks: 2000,
};
const DEFAULT_CHUNK_SIZE = 5000;

function getChunkSize(tableName: string): number {
  return HEAVY_TABLES[tableName] ?? DEFAULT_CHUNK_SIZE;
}

export default function AdminDataExport() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [currentTable, setCurrentTable] = useState('');
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exportedCount, setExportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  async function callExportFunction(params: string): Promise<Response> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const url = `https://${projectId}.supabase.co/functions/v1/export-full-database?${params}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }

    return res;
  }

  async function loadTableList() {
    setStatus('loading-list');
    setErrorMsg('');
    try {
      const res = await callExportFunction('mode=list');
      const list: TableInfo[] = await res.json();
      setTables(list);
      setStatus('idle');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  async function exportTableChunked(
    tableName: string,
  ): Promise<{ parts: Blob[]; expectedRows: number; actualRows: number }> {
    const chunkSize = getChunkSize(tableName);
    const parts: Blob[] = [];
    let offset = 0;
    let chunkNum = 0;
    let actualRows = 0;
    let expectedRows = 0;

    while (true) {
      const res = await callExportFunction(
        `table=${tableName}&offset=${offset}&limit=${chunkSize}`,
      );
      const hasMore = res.headers.get('X-Has-More') === 'true';
      const totalCount = parseInt(res.headers.get('X-Total-Count') || '0', 10);
      const rowCount = parseInt(res.headers.get('X-Row-Count') || '0', 10);
      expectedRows = totalCount;
      actualRows += rowCount;

      const estimatedChunks = Math.max(1, Math.ceil(totalCount / chunkSize));
      chunkNum++;
      setCurrentChunk(chunkNum);
      setTotalChunks(estimatedChunks);

      const sql = await res.text();
      parts.push(new Blob([sql, '\n']));

      if (!hasMore) break;
      offset += chunkSize;
    }

    return { parts, expectedRows, actualRows };
  }

  async function exportAll() {
    let tableList = tables;
    if (tableList.length === 0) {
      setStatus('loading-list');
      setErrorMsg('');
      try {
        const res = await callExportFunction('mode=list');
        tableList = await res.json();
        setTables(tableList);
      } catch (err: any) {
        setErrorMsg(err.message);
        setStatus('error');
        return;
      }
    }
    if (tableList.length === 0) return;

    setStatus('exporting');
    setProgress(0);
    setExportedCount(0);
    setErrorMsg('');

    const blobParts: Blob[] = [];
    const header = [
      '-- Full database export',
      `-- Generated: ${new Date().toISOString()}`,
      '-- Import with: psql -f this_file.sql',
      '',
    ].join('\n');
    blobParts.push(new Blob([header]));

    const mismatches: { table: string; expected: number; actual: number }[] = [];

    for (let i = 0; i < tableList.length; i++) {
      const t = tableList[i];
      setCurrentTable(t.table);
      setCurrentChunk(0);
      setTotalChunks(0);
      setProgress(Math.round((i / tableList.length) * 100));

      try {
        const { parts, expectedRows, actualRows } = await exportTableChunked(t.table);
        for (const p of parts) blobParts.push(p);

        if (actualRows < expectedRows) {
          mismatches.push({ table: t.table, expected: expectedRows, actual: actualRows });
          blobParts.push(
            new Blob([
              `-- WARNING: ${t.table} exported ${actualRows} of ${expectedRows} rows\n`,
            ]),
          );
        }
      } catch (err: any) {
        blobParts.push(new Blob([`-- ERROR exporting ${t.table}: ${err.message}\n`]));
        mismatches.push({ table: t.table, expected: t.count, actual: 0 });
      }

      setExportedCount(i + 1);
    }

    setProgress(100);
    setCurrentTable('');

    if (mismatches.length > 0) {
      blobParts.push(
        new Blob([
          '\n-- INCOMPLETE TABLES:\n' +
            mismatches
              .map((m) => `--   ${m.table}: ${m.actual}/${m.expected} rows`)
              .join('\n') +
            '\n',
        ]),
      );
      toast.warning(
        `Export finished with ${mismatches.length} incomplete table(s): ${mismatches.map((m) => m.table).join(', ')}`,
      );
    }

    const blob = new Blob(blobParts, { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shepi_full_export_${new Date().toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus('done');
  }

  async function exportSingleTable(tableName: string) {
    setStatus('exporting');
    setCurrentTable(tableName);
    setCurrentChunk(0);
    setTotalChunks(0);
    setErrorMsg('');

    try {
      const { parts, expectedRows, actualRows } = await exportTableChunked(tableName);
      if (actualRows < expectedRows) {
        toast.warning(
          `${tableName}: exported ${actualRows} of ${expectedRows} rows`,
        );
      }
      const blob = new Blob(parts, { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.sql`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus('idle');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }

    setCurrentTable('');
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const totalRows = tables.reduce((s, t) => s + Math.max(t.count, 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Data Export</h1>
        <p className="text-muted-foreground mt-1">
          Export all database data as SQL INSERT statements for migration.
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={loadTableList}
          variant="outline"
          disabled={status === 'loading-list' || status === 'exporting'}
        >
          {status === 'loading-list' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Database className="h-4 w-4 mr-2" />
          )}
          Scan Tables
        </Button>

        <Button
          onClick={exportAll}
          disabled={status === 'exporting'}
        >
          {status === 'exporting' ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export Full Database (.sql)
        </Button>
      </div>

      {status === 'exporting' && (
        <div className="space-y-2 bg-muted/30 rounded-lg p-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Exporting {currentTable}
              {totalChunks > 1 && ` (chunk ${currentChunk} of ~${totalChunks})`}
              ...
            </span>
            <span>{exportedCount} / {tables.length} tables</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === 'done' && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          Export complete — file downloaded. {exportedCount} tables exported.
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      {tables.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground flex justify-between">
            <span>{tables.length} tables</span>
            <span>{totalRows.toLocaleString()} total rows</span>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {tables.map((t) => (
              <div
                key={t.table}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-foreground">{t.table}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground tabular-nums">
                    {t.count >= 0 ? t.count.toLocaleString() + ' rows' : 'error'}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => exportSingleTable(t.table)}
                    disabled={status === 'exporting'}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
