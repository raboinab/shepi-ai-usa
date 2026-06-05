import "./_preload-browser-shims";
import ExcelJS from "exceljs";
import { buildStyledWorkbook } from "../src/lib/buildStyledWorkbook";
function pid(y:number,m:number){return `${y}-${String(m).padStart(2,"0")}`}
const periods = [
  {id:pid(2024,1),label:"Jan 2024",shortLabel:"Jan-24",year:2024,month:1,date:new Date(2024,0,1)},
  {id:pid(2024,2),label:"Feb 2024",shortLabel:"Feb-24",year:2024,month:2,date:new Date(2024,1,1)},
  {id:pid(2024,3),label:"Mar 2024",shortLabel:"Mar-24",year:2024,month:3,date:new Date(2024,2,1)}
];
const accounts:any = [
  {accountId:"1000",accountName:"Sales Revenue",fsType:"IS",fsLineItem:"Revenue",subAccount1:"",subAccount2:"",subAccount3:""},
  {accountId:"6100",accountName:"Cash",fsType:"BS",fsLineItem:"Cash and cash equivalents",subAccount1:"",subAccount2:"",subAccount3:""},
];
const dealData:any = {
  deal:{projectId:"x",projectName:"T",clientName:"",targetCompany:"T",industry:"",transactionType:"",fiscalYearEnd:12,periods,fiscalYears:[],aggregatePeriods:[]},
  accounts,
  trialBalance:[
    {...accounts[0],balances:{[pid(2024,1)]:-100000,[pid(2024,2)]:-110000,[pid(2024,3)]:-120000}},
    {...accounts[1],balances:{[pid(2024,1)]:50000,[pid(2024,2)]:60000,[pid(2024,3)]:70000}},
  ],
  adjustments:[],reclassifications:[],tbIndex:new Map(),monthDates:[],arAging:{},apAging:{},fixedAssets:[],topCustomers:{},topVendors:{},addbacks:{},
};
const wb = await buildStyledWorkbook({dealData, roundTripMeta:{projectId:"x",revision:0}});
const buf = await wb.xlsx.writeBuffer();
const wb2 = new ExcelJS.Workbook();
await wb2.xlsx.load(buf as ArrayBuffer);
const tb = wb2.getWorksheet("Trial Balance")!;
const headerCells = tb.getRow(1).values as unknown[];
console.log("Headers:", JSON.stringify(headerCells));
const acctCol = headerCells.findIndex((v, i) => i > 0 && /acct\s*#|account\s*id/i.test(String(v ?? "")));
const febCol = headerCells.findIndex((v, i) => i > 0 && /Feb.*24|2024-02/.test(String(v ?? "")));
console.log("acctCol:", acctCol, "febCol:", febCol);
let foundCashRow = -1;
tb.eachRow((row, rIdx) => {
  const v = row.getCell(acctCol).value;
  console.log(`r${rIdx} acct=`, JSON.stringify(v));
  if (String(v ?? "").trim() === "6100") foundCashRow = rIdx;
});
console.log("foundCashRow:", foundCashRow);
