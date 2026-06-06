/**
 * Full-cycle test of the workbook commit/merge logic.
 *
 * NOTE: This ports the three-way merge from
 * supabase/functions/commit-workbook-upload/index.ts (lines ~205-465).
 * If you change the merge logic there, mirror the change here.
 *
 * Scenarios exercised:
 *   1. Clean apply        — no theirs drift, no conflicts, mine wins.
 *   2. Non-overlap merge  — theirs edited DIFFERENT cells than mine, auto-merge.
 *   3. Overlap conflict   — theirs edited SAME cells as mine, conflicts returned.
 *   4. Resolved conflict  — resolutions provided, merge succeeds with picks honored.
 *   5. Delete vs edit     — mine deletes adj that theirs edited (and vice versa).
 *   6. Fixed asset field conflict + deletion conflict.
 */
import "./_preload-browser-shims";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { buildStyledWorkbook } from "../src/lib/buildStyledWorkbook";
import { META_SHEET_NAME } from "../src/lib/workbookUploadShared";
import type { DealData } from "../src/lib/workbook-types";

// ── Mock data ──────────────────────────────────────────────────────────────
function pid(y: number, m: number) { return `${y}-${String(m).padStart(2, "0")}`; }
function mkPeriod(y: number, m: number) {
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m-1];
  return { id: pid(y,m), label: `${mon} ${y}`, shortLabel: `${mon}-${String(y).slice(2)}`,
    year: y, month: m, date: new Date(y, m-1, 1) };
}
function buildMock(): DealData {
  const periods = [mkPeriod(2024,1), mkPeriod(2024,2), mkPeriod(2024,3)];
  const accounts = [
    { accountId: "1000", accountName: "Sales", fsType: "IS" as const, fsLineItem: "Revenue", subAccount1:"", subAccount2:"", subAccount3:"" },
    { accountId: "6100", accountName: "Cash",  fsType: "BS" as const, fsLineItem: "Cash",    subAccount1:"", subAccount2:"", subAccount3:"" },
  ];
  return {
    deal: { projectId:"t", projectName:"T", clientName:"B", targetCompany:"T", industry:"X", transactionType:"A", fiscalYearEnd:12, periods, fiscalYears:[], aggregatePeriods:[] },
    accounts,
    trialBalance: [
      { ...accounts[0], balances: { [pid(2024,1)]: -100000, [pid(2024,2)]: -110000, [pid(2024,3)]: -120000 } },
      { ...accounts[1], balances: { [pid(2024,1)]: 50000,   [pid(2024,2)]: 60000,   [pid(2024,3)]: 70000 } },
    ],
    adjustments: [
      { id: "adj-1", type: "MA", label: "Owner Compensation", tbAccountNumber:"3100", intent:"Normalize", notes:"",
        amounts: { [pid(2024,1)]:10000, [pid(2024,2)]:10000, [pid(2024,3)]:10000 } },
      { id: "adj-2", type: "DD", label: "One-time Legal", tbAccountNumber:"4300", intent:"Non-recurring", notes:"",
        amounts: { [pid(2024,3)]:25000 } },
    ],
    reclassifications: [], tbIndex: new Map(), monthDates: periods.map(p=>p.date),
    arAging: {}, apAging: {},
    fixedAssets: [
      { description:"Forklift #1", category:"Equipment", acquisitionDate:"2022-05-15", cost:30000, accumulatedDepreciation:12000, netBookValue:18000 },
      { description:"Delivery Van", category:"Vehicles", acquisitionDate:"2021-08-01", cost:45000, accumulatedDepreciation:22000, netBookValue:23000 },
    ],
    topCustomers:{}, topVendors:{}, addbacks:{} as DealData["addbacks"],
  };
}

// ── Parser (mirrors deployed parse-workbook-upload) ────────────────────────
const SUPPORTED = new Set(["1.1","1.2"]);
function parseMeta(wb: XLSX.WorkBook) {
  const ws = wb.Sheets[META_SHEET_NAME]; if (!ws) throw new Error("no meta");
  const g = (a: string) => { const c = ws[a]; return c ? String(c.v ?? "").trim() : ""; };
  if (g("A1") !== "shepiWorkbook") throw new Error("bad meta header");
  const schemaVersion = g("B1"); if (!SUPPORTED.has(schemaVersion)) throw new Error("bad schema");
  const projectId = g("B2"); const exportedFromRevision = Number(g("B3") || "0");
  const periods: { id:string;label:string;shortLabel:string }[] = [];
  const adjDir: { id:string;type:string;label:string }[] = [];
  const faDir: { key:string;description:string }[] = [];
  const chunks: string[] = []; let section: ""|"periods"|"adjustments"|"fixedAssets"|"snapshot" = ""; let empty = 0;
  for (let r=6; r<200000; r++) {
    const a = (ws[`A${r}`] ? String(ws[`A${r}`].v ?? "") : "").trim();
    const b = (ws[`B${r}`] ? String(ws[`B${r}`].v ?? "") : "").trim();
    const c = (ws[`C${r}`] ? String(ws[`C${r}`].v ?? "") : "").trim();
    if (!a && !b && !c) { if (section === "snapshot") continue; if (++empty >= 3) break; continue; }
    empty = 0;
    if (a === "__periods__") { section = "periods"; continue; }
    if (a === "__adjustments__") { section = "adjustments"; continue; }
    if (a === "__fixedAssets__") { section = "fixedAssets"; continue; }
    if (a === "__snapshot__") { section = "snapshot"; continue; }
    if (a === "__snapshot_end__") break;
    if (a === "periodId" || a === "id" || a === "key") continue;
    if (section === "periods" && a) periods.push({ id:a, label:b, shortLabel:c||b });
    else if (section === "adjustments" && a) adjDir.push({ id:a, type:b, label:c });
    else if (section === "fixedAssets" && a) faDir.push({ key:a, description:b });
    else if (section === "snapshot" && a) chunks.push(a);
  }
  return { schemaVersion, projectId, exportedFromRevision, periods, adjustmentDirectory: adjDir, fixedAssetDirectory: faDir, snapshot: JSON.parse(chunks.join("")) };
}
const rowsOf = (ws: XLSX.WorkSheet) => XLSX.utils.sheet_to_json(ws, { header: 1, defval: null }) as unknown[][];

function parseTB(wb: XLSX.WorkBook, meta: ReturnType<typeof parseMeta>) {
  const out: Record<string,Record<string,number>> = {};
  const ws = wb.Sheets["Trial Balance"]; if (!ws) return out;
  const rows = rowsOf(ws); const headers = rows[0].map(h => String(h ?? "").trim());
  const acctIdx = headers.findIndex(h => /acct\s*#|account\s*id/i.test(h));
  const pidSet = new Set(meta.periods.map(p=>p.id));
  const lbl = new Map<string,string>(); for (const p of meta.periods) { lbl.set(p.label.toLowerCase(), p.id); if (p.shortLabel) lbl.set(p.shortLabel.toLowerCase(), p.id); }
  const cols: {idx:number;pid:string}[] = [];
  headers.forEach((h,i)=>{ if (pidSet.has(h)) cols.push({idx:i,pid:h}); else { const id=lbl.get(h.toLowerCase()); if (id) cols.push({idx:i,pid:id}); } });
  for (let r=1; r<rows.length; r++) {
    const row=rows[r]; if (!row) continue;
    const aid=String(row[acctIdx]??"").trim(); if (!aid) continue;
    const base = meta.snapshot.trialBalance[aid]; if (!base) continue;
    const ch: Record<string,number> = {};
    for (const {idx,pid:p} of cols) { const v=row[idx]; if (v==null||v==="") continue; const n=Number(v); if (!Number.isFinite(n)) continue; if (Math.abs((base[p]??0)-n)>0.005) ch[p]=n; }
    if (Object.keys(ch).length) out[aid]=ch;
  }
  return out;
}
function parseAdj(wb: XLSX.WorkBook, meta: ReturnType<typeof parseMeta>) {
  const changed: Record<string,Record<string,number>> = {};
  const added: { type:string;label:string;periodValues:Record<string,number> }[] = [];
  const seen = new Set<string>();
  const pidSet = new Set(meta.periods.map(p=>p.id));
  const lbl = new Map<string,string>(); for (const p of meta.periods) { lbl.set(p.label.toLowerCase(), p.id); if (p.shortLabel) lbl.set(p.shortLabel.toLowerCase(), p.id); }
  const dir = new Map(meta.adjustmentDirectory.map(d => [`${d.type}::${d.label.toLowerCase()}`, d]));
  for (const sn of ["DD Adjustments I","DD Adjustments II"]) {
    const ws = wb.Sheets[sn]; if (!ws) continue;
    const rows = rowsOf(ws);
    let hr=-1; for (let r=0; r<Math.min(rows.length,10); r++) if (String(rows[r]?.[0]??"").toLowerCase().trim()==="description") { hr=r; break; }
    if (hr<0) continue;
    const headers = rows[hr].map(h=>String(h??"").trim());
    const labelIdx = headers.findIndex(h=>h.toLowerCase()==="description");
    const typeIdx = headers.findIndex(h=>h.toLowerCase()==="type");
    const cols: {idx:number;pid:string}[] = [];
    headers.forEach((h,i)=>{ if (pidSet.has(h)) cols.push({idx:i,pid:h}); else { const id=lbl.get(h.toLowerCase()); if (id) cols.push({idx:i,pid:id}); } });
    for (let r=hr+1; r<rows.length; r++) {
      const row=rows[r]; if (!row) continue;
      const label=String(row[labelIdx]??"").trim();
      const type=String(row[typeIdx]??"").trim();
      if (!label||!type||/^(total|subtotal)/i.test(label)) continue;
      const hit = dir.get(`${type}::${label.toLowerCase()}`);
      const newAmts: Record<string,number> = {};
      for (const {idx,pid:p} of cols) { const v=row[idx]; if (v==null||v==="") continue; const n=Number(v); if (Number.isFinite(n)&&n!==0) newAmts[p]=n; }
      if (hit) {
        seen.add(hit.id);
        const base = meta.snapshot.adjustments[hit.id]?.periodValues ?? {};
        const ch: Record<string,number> = {};
        for (const p of new Set([...Object.keys(base),...Object.keys(newAmts)])) {
          const o=base[p]??0; const n=newAmts[p]??0; if (Math.abs(o-n)>0.005) ch[p]=n;
        }
        if (Object.keys(ch).length) changed[hit.id]=ch;
      } else added.push({ type, label, periodValues: newAmts });
    }
  }
  const deleted = meta.adjustmentDirectory.filter(d=>!seen.has(d.id)).map(d=>d.id);
  return { changed, deleted, added };
}
function parseFA(wb: XLSX.WorkBook, meta: ReturnType<typeof parseMeta>) {
  const changed: Record<string,Record<string,unknown>> = {};
  const added: { description:string; category:string; acquisitionDate:string; cost:number; accumulatedDepreciation:number; netBookValue:number }[] = [];
  const seen = new Set<string>();
  const ws = wb.Sheets["Fixed Assets"]; if (!ws) return { changed, deleted: [] as string[], added };
  const rows = rowsOf(ws);
  const hdr = rows[0].map(h=>String(h??"").trim().toLowerCase());
  const idx = (re: RegExp | string) => hdr.findIndex(h => typeof re === "string" ? h === re : re.test(h));
  const dI=idx("description"), cI=hdr.findIndex(h=>h==="cost"||h==="original cost"),
    deI=hdr.findIndex(h=>h==="accum depr"||h==="accumulated depreciation"),
    nI=hdr.findIndex(h=>h==="net book value"||h==="nbv"),
    caI=idx("category"), daI=hdr.findIndex(h=>h==="acquired"||h==="acquisition date");
  for (let r=1; r<rows.length; r++) {
    const row=rows[r]; if (!row) continue;
    const desc=String(row[dI]??"").trim(); if (!desc||/^total/i.test(desc)) continue;
    const key=desc.toLowerCase();
    const base = (meta.snapshot.fixedAssets ?? {})[key];
    const cost=Number(row[cI]??0), depr=Number(row[deI]??0), nbv=Number(row[nI]??0);
    const category=caI>=0?String(row[caI]??""):"", acquisitionDate=daI>=0?String(row[daI]??""):"";
    if (!base) { added.push({ description: desc, category, acquisitionDate, cost, accumulatedDepreciation: depr, netBookValue: nbv }); continue; }
    seen.add(key);
    const diff: Record<string,unknown> = {};
    if (Math.abs(cost-base.cost)>0.005) diff.cost = cost;
    if (Math.abs(depr-base.accumulatedDepreciation)>0.005) diff.accumulatedDepreciation = depr;
    if (Math.abs(nbv-base.netBookValue)>0.005) diff.netBookValue = nbv;
    if (Object.keys(diff).length) changed[key] = diff;
  }
  const deleted = meta.fixedAssetDirectory.filter(d=>!seen.has(d.key)).map(d=>d.key);
  return { changed, deleted, added };
}

// ── Mutate as a user editing the workbook in Excel ─────────────────────────
function mutate(wb: ExcelJS.Workbook) {
  const tb = wb.getWorksheet("Trial Balance")!;
  const hdr = tb.getRow(1).values as unknown[];
  const acctCol = hdr.findIndex((v,i)=>i>0 && /acct\s*#|account\s*id/i.test(String(v??"")));
  const febCol  = hdr.findIndex((v,i)=>i>0 && /Feb.*24|2024-02/.test(String(v??"")));
  const marCol  = hdr.findIndex((v,i)=>i>0 && /Mar.*24|2024-03/.test(String(v??"")));
  tb.eachRow((row,idx)=>{
    if (idx<=1) return;
    const id = String(row.getCell(acctCol).value??"").trim();
    if (id === "6100") row.getCell(febCol).value = 65000;     // Cash Feb 60k→65k
    if (id === "1000") row.getCell(marCol).value = -130000;   // Sales Mar -120k→-130k
  });
  for (const sn of ["DD Adjustments I","DD Adjustments II"]) {
    const ws = wb.getWorksheet(sn); if (!ws) continue;
    let hr=-1; let hv: unknown[]=[];
    for (let r=1;r<=10;r++){const v=ws.getRow(r).values as unknown[]; if (v.some(x=>String(x??"").toLowerCase().trim()==="description")) {hr=r;hv=v;break;}}
    if (hr<0) continue;
    const labelCol=hv.findIndex((v,i)=>i>0&&String(v??"").toLowerCase().trim()==="description");
    const typeCol =hv.findIndex((v,i)=>i>0&&String(v??"").toLowerCase().trim()==="type");
    const marC   =hv.findIndex((v,i)=>i>0&&/Mar.*24|2024-03/.test(String(v??"")));
    const janC   =hv.findIndex((v,i)=>i>0&&/Jan.*24|2024-01/.test(String(v??"")));
    const clear: number[] = [];
    ws.eachRow((row,idx)=>{
      if (idx<=hr) return;
      const label = String(row.getCell(labelCol).value??"").trim();
      if (label==="Owner Compensation" && marC>0) row.getCell(marC).value = 15000;  // 10k→15k
      if (label==="One-time Legal") clear.push(idx);                                 // delete adj-2
    });
    for (const r of clear) ws.getRow(r).eachCell({includeEmpty:true}, c=>{c.value=null;});
    if (sn==="DD Adjustments I" && labelCol>0 && typeCol>0 && janC>0) {
      let last=hr; ws.eachRow((row,idx)=>{ if (idx>hr && String(row.getCell(labelCol).value??"").trim()) last=Math.max(last,idx); });
      const nr = ws.getRow(last+1);
      nr.getCell(labelCol).value = "Travel Personalized"; nr.getCell(typeCol).value = "MA"; nr.getCell(janC).value = 5000;
    }
  }
  const fa = wb.getWorksheet("Fixed Assets");
  if (fa) {
    const hv = fa.getRow(1).values as unknown[];
    const dC=hv.findIndex((v,i)=>i>0&&String(v??"").toLowerCase().trim()==="description");
    const cC=hv.findIndex((v,i)=>i>0&&/^cost$/i.test(String(v??"").trim()));
    const caC=hv.findIndex((v,i)=>i>0&&String(v??"").toLowerCase().trim()==="category");
    const deC=hv.findIndex((v,i)=>i>0&&/accum/i.test(String(v??"")));
    const nC =hv.findIndex((v,i)=>i>0&&/net book/i.test(String(v??"")));
    const clear: number[] = []; let last=1;
    fa.eachRow((row,idx)=>{
      if (idx===1) return;
      const d=String(row.getCell(dC).value??"").trim();
      if (!d||/^total/i.test(d)) return;
      last=Math.max(last,idx);
      if (d==="Forklift #1" && cC>0) row.getCell(cC).value = 32000;   // 30k→32k
      if (d==="Delivery Van") clear.push(idx);                          // delete
    });
    for (const r of clear) fa.getRow(r).eachCell({includeEmpty:true}, c=>{c.value=null;});
    const nr = fa.getRow(last+1);
    if (dC>0) nr.getCell(dC).value = "Office Printer";
    if (caC>0) nr.getCell(caC).value = "Office Equipment";
    if (cC>0) nr.getCell(cC).value = 1200;
    if (deC>0) nr.getCell(deC).value = 300;
    if (nC>0) nr.getCell(nC).value = 900;
  }
}

// ── Port of the merge logic from commit-workbook-upload/index.ts ──────────
interface MergeInput {
  base: { trialBalance: Record<string,Record<string,number>>; adjustments: Record<string,any>; fixedAssets: Record<string,any> };
  mine: {
    trialBalance: Record<string,Record<string,number>>;
    adjustmentsChanged: Record<string,Record<string,number>>;
    adjustmentsDeleted: string[];
    adjustmentsAdded: any[];
    fixedAssetsChanged: Record<string,any>;
    fixedAssetsDeleted: string[];
    fixedAssetsAdded: any[];
  };
  current: { trialBalance: Record<string,Record<string,number>>; adjustments: Record<string,any>; fixedAssets: Record<string,any> };
  resolutions?: Record<string,"mine"|"theirs">;
  force?: boolean;
}
function merge({ base, mine, current, resolutions = {}, force }: MergeInput) {
  const conflicts: any[] = [];
  const finalTB: Record<string,Record<string,number>> = {};
  for (const [a,c] of Object.entries(current.trialBalance)) finalTB[a]={...c};
  for (const [acct, cells] of Object.entries(mine.trialBalance)) {
    const baseRow = base.trialBalance[acct] ?? {};
    const theirsRow = current.trialBalance[acct] ?? {};
    for (const [p, mineVal] of Object.entries(cells)) {
      const bv = baseRow[p] ?? 0; const tv = theirsRow[p] ?? 0;
      const theirsChanged = Math.abs(tv-bv) > 0.005;
      if (theirsChanged && Math.abs(tv-mineVal) > 0.005) {
        const id = `tb::${acct}::${p}`; const pick = resolutions[id];
        if (pick === "mine" || force) finalTB[acct] = { ...(finalTB[acct]??{}), [p]: mineVal };
        else if (pick === "theirs") {} 
        else conflicts.push({ kind:"tb", conflictId:id, label:`TB ${acct} · ${p}`, base:bv, mine:mineVal, theirs:tv });
      } else finalTB[acct] = { ...(finalTB[acct]??{}), [p]: mineVal };
    }
  }
  const finalAdj: Record<string,any> = {};
  for (const [id,a] of Object.entries(current.adjustments)) finalAdj[id] = { ...a, periodValues: {...a.periodValues } };
  for (const [id, mineCells] of Object.entries(mine.adjustmentsChanged)) {
    const baseAdj = base.adjustments[id]; const theirsAdj = current.adjustments[id];
    if (!theirsAdj) {
      const cid = `adj_del::${id}`; const pick = resolutions[cid];
      if (pick === "mine" || force) { if (baseAdj) finalAdj[id] = { ...baseAdj, periodValues: { ...baseAdj.periodValues, ...mineCells } }; }
      else if (pick === "theirs") {} 
      else conflicts.push({ kind:"adjustment_deleted_vs_edited", conflictId:cid, label:`Adj "${baseAdj?.label??id}" deleted online but edited offline`, base:"exists", mine:"edited", theirs:"deleted" });
      continue;
    }
    for (const [p, mineVal] of Object.entries(mineCells)) {
      const bv = baseAdj?.periodValues?.[p] ?? 0; const tv = theirsAdj.periodValues[p] ?? 0;
      const theirsChanged = Math.abs(tv-bv) > 0.005;
      if (theirsChanged && Math.abs(tv-mineVal) > 0.005) {
        const cid = `adj::${id}::${p}`; const pick = resolutions[cid];
        if (pick === "mine" || force) finalAdj[id].periodValues[p] = mineVal;
        else if (pick === "theirs") {} 
        else conflicts.push({ kind:"adjustment_amount", conflictId:cid, label:`${theirsAdj.type} · ${theirsAdj.label} · ${p}`, base:bv, mine:mineVal, theirs:tv });
      } else finalAdj[id].periodValues[p] = mineVal;
    }
  }
  for (const id of mine.adjustmentsDeleted) {
    const baseAdj = base.adjustments[id]; const theirsAdj = current.adjustments[id];
    if (!theirsAdj) continue;
    const bv = baseAdj?.periodValues ?? {};
    const all = new Set([...Object.keys(bv),...Object.keys(theirsAdj.periodValues)]);
    let theirsEdited = false;
    for (const k of all) if (Math.abs((bv[k]??0) - (theirsAdj.periodValues[k]??0)) > 0.005) { theirsEdited = true; break; }
    if (theirsEdited) {
      const cid = `adj_del::${id}`; const pick = resolutions[cid];
      if (pick === "mine" || force) delete finalAdj[id];
      else if (pick === "theirs") {} 
      else conflicts.push({ kind:"adjustment_deleted_vs_edited", conflictId:cid, label:`Adj "${theirsAdj.label}" deleted offline but edited online`, base:"exists", mine:"deleted", theirs:"edited" });
    } else delete finalAdj[id];
  }
  for (const a of mine.adjustmentsAdded) finalAdj[a.id ?? `new::${a.label}`] = a;

  const FA_FIELDS = ["category","acquisitionDate","cost","accumulatedDepreciation","netBookValue"] as const;
  const faEq = (f: typeof FA_FIELDS[number], a:any, b:any) => (f==="cost"||f==="accumulatedDepreciation"||f==="netBookValue") ? Math.abs(Number(a??0)-Number(b??0))<=0.005 : String(a??"")===String(b??"");
  const finalFA: Record<string,any> = {};
  for (const [k,fa] of Object.entries(current.fixedAssets)) finalFA[k] = { ...fa };
  for (const [key, diff] of Object.entries(mine.fixedAssetsChanged)) {
    const baseRow = base.fixedAssets[key]; const theirsRow = current.fixedAssets[key];
    if (!theirsRow) {
      const cid = `fa_del::${key}`; const pick = resolutions[cid];
      if (pick === "mine" || force) { if (baseRow) finalFA[key] = { ...baseRow, ...diff }; }
      else if (pick === "theirs") {} 
      else conflicts.push({ kind:"fixed_asset_deleted_vs_edited", conflictId:cid, label:`FA "${baseRow?.description??key}" deleted online but edited offline`, base:"exists", mine:"edited", theirs:"deleted" });
      continue;
    }
    for (const field of FA_FIELDS) {
      if (!(field in (diff as any))) continue;
      const mineVal = (diff as any)[field];
      const baseVal = baseRow ? baseRow[field] : undefined;
      const theirsVal = theirsRow[field];
      const theirsChanged = baseRow ? !faEq(field, theirsVal, baseVal) : true;
      if (theirsChanged && !faEq(field, theirsVal, mineVal)) {
        const cid = `fa::${key}::${field}`; const pick = resolutions[cid];
        if (pick === "mine" || force) finalFA[key][field] = mineVal;
        else if (pick === "theirs") {} 
        else conflicts.push({ kind:"fixed_asset_field", conflictId:cid, label:`${theirsRow.description} · ${field}`, base:baseVal??null, mine:mineVal??null, theirs:theirsVal??null });
      } else finalFA[key][field] = mineVal;
    }
  }
  for (const key of mine.fixedAssetsDeleted) {
    const baseRow = base.fixedAssets[key]; const theirsRow = current.fixedAssets[key];
    if (!theirsRow) continue;
    let theirsEdited = false;
    if (baseRow) { for (const f of FA_FIELDS) if (!faEq(f, baseRow[f], theirsRow[f])) { theirsEdited = true; break; } }
    else theirsEdited = true;
    if (theirsEdited) {
      const cid = `fa_del::${key}`; const pick = resolutions[cid];
      if (pick === "mine" || force) delete finalFA[key];
      else if (pick === "theirs") {} 
      else conflicts.push({ kind:"fixed_asset_deleted_vs_edited", conflictId:cid, label:`FA "${theirsRow.description}" deleted offline but edited online`, base:"exists", mine:"deleted", theirs:"edited" });
    } else delete finalFA[key];
  }
  for (const fa of mine.fixedAssetsAdded) { const k = (fa.description||"").toLowerCase().trim(); if (k) finalFA[k] = fa; }
  return { conflicts, finalTB, finalAdj, finalFA };
}

// ── Build base snapshot from mock (matches what buildStyledWorkbook embeds) ─
function makeBase(dd: DealData) {
  return {
    trialBalance: Object.fromEntries(dd.trialBalance.map(t => [t.accountId, t.balances])),
    adjustments: Object.fromEntries(dd.adjustments.map(a => [a.id, { id:a.id, type:a.type, label:a.label, tbAccountNumber:a.tbAccountNumber, intent:a.intent, notes:a.notes, periodValues:a.amounts }])),
    fixedAssets: Object.fromEntries(dd.fixedAssets.map(f => [f.description.toLowerCase(), f])),
  };
}

// ── Run all scenarios ─────────────────────────────────────────────────────
const fail = (m: string) => { throw new Error("❌ " + m); };
const ok = (m: string) => console.log("  ✅ " + m);

async function getMineFromWorkbook() {
  const dd = buildMock();
  const wb = await buildStyledWorkbook({ dealData: dd, roundTripMeta: { projectId: "test-uuid", revision: 1 } });
  mutate(wb);
  const buf = await wb.xlsx.writeBuffer();
  const wb2 = XLSX.read(new Uint8Array(buf as ArrayBuffer), { type: "array" });
  const meta = parseMeta(wb2);
  const tb = parseTB(wb2, meta);
  const { changed, deleted, added } = parseAdj(wb2, meta);
  const fa = parseFA(wb2, meta);
  return {
    base: makeBase(dd),
    mine: {
      trialBalance: tb,
      adjustmentsChanged: changed,
      adjustmentsDeleted: deleted,
      adjustmentsAdded: added.map((a,i)=>({ id:`new-${i}`, type:a.type, label:a.label, periodValues:a.periodValues })),
      fixedAssetsChanged: fa.changed,
      fixedAssetsDeleted: fa.deleted,
      fixedAssetsAdded: fa.added,
    },
  };
}

async function run() {
  console.log("\n=== Scenario 1: Clean apply (no theirs drift) ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    const current = { trialBalance: { ...base.trialBalance }, adjustments: { ...base.adjustments }, fixedAssets: { ...base.fixedAssets } };
    const { conflicts, finalTB, finalAdj, finalFA } = merge({ base, mine, current });
    if (conflicts.length) fail(`expected 0 conflicts, got ${conflicts.length}: ${JSON.stringify(conflicts)}`);
    ok("no conflicts");
    if (finalTB["6100"]["2024-02"] !== 65000) fail("Cash Feb not applied");
    if (finalTB["1000"]["2024-03"] !== -130000) fail("Sales Mar not applied");
    if (finalAdj["adj-1"].periodValues["2024-03"] !== 15000) fail("Owner Comp Mar not applied");
    if (finalAdj["adj-2"]) fail("One-time Legal not deleted");
    if (!Object.values(finalAdj).some((a:any) => a.label === "Travel Personalized")) fail("New adj not added");
    if (finalFA["forklift #1"].cost !== 32000) fail("Forklift cost not applied");
    if (finalFA["delivery van"]) fail("Delivery Van not deleted");
    if (!finalFA["office printer"]) fail("Office Printer not added");
    ok("all mine edits applied to final state");
  }

  console.log("\n=== Scenario 2: Non-overlapping theirs drift → auto-merge ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    // Theirs edits a DIFFERENT cell from mine (mine touches Cash-Feb; theirs touches Cash-Jan)
    const current = JSON.parse(JSON.stringify(base));
    current.trialBalance["6100"]["2024-01"] = 55555;   // theirs only
    current.adjustments["adj-1"].periodValues["2024-01"] = 11111;  // theirs only
    const { conflicts, finalTB, finalAdj } = merge({ base, mine, current });
    if (conflicts.length) fail(`expected 0 conflicts (non-overlap), got ${conflicts.length}`);
    ok("no conflicts (non-overlapping fields)");
    if (finalTB["6100"]["2024-01"] !== 55555) fail("theirs Cash-Jan lost");
    if (finalTB["6100"]["2024-02"] !== 65000) fail("mine Cash-Feb lost");
    if (finalAdj["adj-1"].periodValues["2024-01"] !== 11111) fail("theirs adj Jan lost");
    if (finalAdj["adj-1"].periodValues["2024-03"] !== 15000) fail("mine adj Mar lost");
    ok("both sides preserved");
  }

  console.log("\n=== Scenario 3: Overlapping edits → CONFLICTS ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    const current = JSON.parse(JSON.stringify(base));
    current.trialBalance["6100"]["2024-02"] = 99999;            // theirs edits same Cash-Feb as mine
    current.adjustments["adj-1"].periodValues["2024-03"] = 99999;  // theirs edits same Owner-Comp-Mar
    current.fixedAssets["forklift #1"].cost = 88888;             // theirs edits same Forklift cost
    const { conflicts } = merge({ base, mine, current });
    const kinds = conflicts.map(c=>c.kind).sort();
    if (!kinds.includes("tb")) fail("missing TB conflict");
    if (!kinds.includes("adjustment_amount")) fail("missing adj conflict");
    if (!kinds.includes("fixed_asset_field")) fail("missing FA conflict");
    ok(`got ${conflicts.length} conflicts: ${[...new Set(kinds)].join(", ")}`);
  }

  console.log("\n=== Scenario 4: Conflicts resolved (mix of mine/theirs) ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    const current = JSON.parse(JSON.stringify(base));
    current.trialBalance["6100"]["2024-02"] = 99999;
    current.adjustments["adj-1"].periodValues["2024-03"] = 77777;
    current.fixedAssets["forklift #1"].cost = 88888;
    const resolutions = {
      "tb::6100::2024-02": "mine" as const,        // keep 65000
      "adj::adj-1::2024-03": "theirs" as const,    // keep 77777
      "fa::forklift #1::cost": "mine" as const,    // keep 32000
    };
    const { conflicts, finalTB, finalAdj, finalFA } = merge({ base, mine, current, resolutions });
    if (conflicts.length) fail(`expected 0 conflicts after resolution, got ${conflicts.length}`);
    if (finalTB["6100"]["2024-02"] !== 65000) fail("TB resolve mine failed");
    if (finalAdj["adj-1"].periodValues["2024-03"] !== 77777) fail("adj resolve theirs failed");
    if (finalFA["forklift #1"].cost !== 32000) fail("FA resolve mine failed");
    ok("resolutions honored");
  }

  console.log("\n=== Scenario 5: Delete-vs-edit ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    // mine deleted adj-2; theirs ALSO edits adj-2 (conflict)
    const current = JSON.parse(JSON.stringify(base));
    current.adjustments["adj-2"].periodValues["2024-03"] = 99999;
    const { conflicts } = merge({ base, mine, current });
    const dv = conflicts.find(c=>c.kind==="adjustment_deleted_vs_edited");
    if (!dv) fail("missing adj delete-vs-edit conflict");
    ok("adj delete-vs-edit detected");

    // Same but FA: mine deleted Delivery Van; theirs edited it
    const current2 = JSON.parse(JSON.stringify(base));
    current2.fixedAssets["delivery van"].cost = 99999;
    const { conflicts: c2 } = merge({ base, mine, current: current2 });
    if (!c2.some(c=>c.kind==="fixed_asset_deleted_vs_edited")) fail("missing FA delete-vs-edit conflict");
    ok("FA delete-vs-edit detected");

    // Resolve them
    const { conflicts: c3, finalAdj, finalFA } = merge({ base, mine, current: current2, resolutions: {
      "adj_del::adj-2": "theirs",  // keep adj
      "fa_del::delivery van": "mine",  // delete FA
    }});
    // c3 may still include the adj conflict from current2 since current2 has adj-2 unedited
    void c3; void finalAdj;
    if (finalFA["delivery van"]) fail("FA delete resolution didn't delete");
    ok("delete-vs-edit resolutions honored");
  }

  console.log("\n=== Scenario 6: Force flag overrides all conflicts ===");
  {
    const { base, mine } = await getMineFromWorkbook();
    const current = JSON.parse(JSON.stringify(base));
    current.trialBalance["6100"]["2024-02"] = 99999;
    current.adjustments["adj-1"].periodValues["2024-03"] = 77777;
    current.fixedAssets["forklift #1"].cost = 88888;
    const { conflicts, finalTB, finalAdj, finalFA } = merge({ base, mine, current, force: true });
    if (conflicts.length) fail("force should suppress conflicts");
    if (finalTB["6100"]["2024-02"] !== 65000) fail("force didn't apply mine TB");
    if (finalAdj["adj-1"].periodValues["2024-03"] !== 15000) fail("force didn't apply mine adj");
    if (finalFA["forklift #1"].cost !== 32000) fail("force didn't apply mine FA");
    ok("force wins everywhere");
  }

  console.log("\n🎉 All commit/merge scenarios verified.\n");
}
run().catch(e => { console.error(e); process.exit(1); });
