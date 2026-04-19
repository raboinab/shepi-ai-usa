import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { projectId, adjustmentId, adjustment, jobId } = body;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "Missing projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const discoveryUrl = Deno.env.get("DISCOVERY_SERVICE_URL");
    const discoveryKey = Deno.env.get("DISCOVERY_SERVICE_KEY");

    if (!discoveryUrl || !discoveryKey) {
      return new Response(
        JSON.stringify({ error: "Discovery service not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountHints = (() => {
      const rawName = adjustment?.linkedAccountName;
      if (!rawName) return [];
      const hints = [rawName];
      const leaf = rawName.split(":").pop()?.trim();
      if (leaf && leaf !== rawName) hints.push(leaf);
      return hints;
    })();

    // Fetch payroll data for comp-related adjustments
    let payrollContext = null;
    const descLower = (adjustment?.description ?? "").toLowerCase();
    const classLower = (adjustment?.category ?? "").toLowerCase();
    const isCompRelated = ["owner", "comp", "salary", "payroll", "wage", "officer"].some(
      kw => descLower.includes(kw) || classLower.includes(kw)
    );

    if (isCompRelated) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: payrollRows } = await adminClient
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "payroll")
        .limit(1)
        .maybeSingle();

      if (payrollRows?.data) {
        const extracted = (payrollRows.data as Record<string, unknown>)?.extractedData as Record<string, unknown> | undefined;
        if (extracted) {
          const sumItems = (items: Array<{ monthlyValues?: Record<string, number> }>) =>
            (items || []).reduce((total, it) => {
              return total + Object.values(it.monthlyValues || {}).reduce((s, v) => s + (v || 0), 0);
            }, 0);

          const salaryWages = sumItems(extracted.salaryWages as []) || 0;
          const ownerCompensation = sumItems(extracted.ownerCompensation as []) || 0;
          const payrollTaxes = sumItems(extracted.payrollTaxes as []) || 0;
          const benefits = sumItems(extracted.benefits as []) || 0;
          const totalPayroll = salaryWages + ownerCompensation + payrollTaxes + benefits;

          const ownerCompArr = (extracted.ownerCompensation as Array<{ name?: string; description?: string; employee_name?: string; monthlyValues?: Record<string, number> }>) || [];

          // Also scan salaryWages for owner-related entries that were miscategorized
          const ownerKeywords = ["owner", "officer", "shareholder", "principal", "member"];
          const salaryWagesArr = (extracted.salaryWages as Array<{ name?: string; description?: string; employee_name?: string; monthlyValues?: Record<string, number> }>) || [];
          const ownerFromSalary = salaryWagesArr.filter(it => {
            const name = (it.name || it.description || it.employee_name || "").toLowerCase();
            return ownerKeywords.some(kw => name.includes(kw));
          });

          const combinedOwnerArr = [...ownerCompArr, ...ownerFromSalary];

          const numPeriods = combinedOwnerArr.length > 0
            ? Math.max(...combinedOwnerArr.map(it => Object.keys(it.monthlyValues || {}).length), 1)
            : 1;
          const monthsPerYear = 12;

          const ownerCompItems = combinedOwnerArr.map(it => {
            const annualTotal = Object.values(it.monthlyValues || {}).reduce((s, v) => s + (v || 0), 0) / Math.max(numPeriods / monthsPerYear, 1);
            return {
              name: it.description || it.employee_name || "Unknown",
              annualTotal: Math.round(annualTotal * 100) / 100,
            };
          });

          const totalAnnualOwnerComp = ownerCompItems.reduce((s, it) => s + it.annualTotal, 0);

          payrollContext = {
            totals: {
              salaryWages,
              ownerCompensation,
              payrollTaxes,
              benefits,
              totalPayroll,
            },
            itemCount: {
              salaryWages: ((extracted.salaryWages as []) || []).length,
              ownerCompensation: ownerCompArr.length,
            },
            ownerCompItems,
            totalAnnualOwnerComp: Math.round(totalAnnualOwnerComp * 100) / 100,
            source: "uploaded payroll register",
          };
          console.log("[verify] including payroll_context for comp-related adjustment, totalPayroll:", totalPayroll, "ownerCompItems:", ownerCompItems.length);
        }
      }
    }

    // Fetch supporting documents for this project
    let supportingDocsContext = null;
    const adminClientDocs = createClient(supabaseUrl, serviceRoleKey);
    const { data: supportingDocs } = await adminClientDocs
      .from("documents")
      .select("id, name, description, parsed_summary")
      .eq("project_id", projectId)
      .eq("account_type", "supporting_documents")
      .not("parsed_summary", "is", null);

    if (supportingDocs && supportingDocs.length > 0) {
      supportingDocsContext = supportingDocs.map(doc => ({
        documentName: doc.name,
        description: doc.description,
        extractedData: doc.parsed_summary,
      }));
      console.log("[verify] including", supportingDocs.length, "supporting documents as context");
    }

    // Fetch lease context for rent/occupancy adjustments
    let leaseContext = null;
    const isLeaseRelated = ["rent", "lease", "occupancy", "landlord", "tenant", "cam", "nnn"].some(
      kw => descLower.includes(kw) || classLower.includes(kw)
    );
    if (isLeaseRelated) {
      const { data: leaseDocs } = await adminClientDocs
        .from("documents")
        .select("id, name, parsed_summary")
        .eq("project_id", projectId)
        .eq("account_type", "lease_agreement")
        .not("parsed_summary", "is", null);
      if (leaseDocs && leaseDocs.length > 0) {
        leaseContext = leaseDocs.map(doc => ({
          documentName: doc.name,
          extractedData: doc.parsed_summary,
        }));
        console.log("[verify] including", leaseDocs.length, "lease agreements as context");
      }
    }

    // Fetch fixed assets context for depreciation/amortization adjustments
    let fixedAssetsContext = null;
    const isDepreciationRelated = ["depreciation", "amortization", "fixed asset", "capital expenditure", "capex"].some(
      kw => descLower.includes(kw) || classLower.includes(kw)
    );
    if (isDepreciationRelated) {
      const adminClient2 = createClient(supabaseUrl, serviceRoleKey);
      const { data: faRows } = await adminClient2
        .from("processed_data")
        .select("data")
        .eq("project_id", projectId)
        .eq("data_type", "fixed_assets")
        .limit(5);
      if (faRows && faRows.length > 0) {
        fixedAssetsContext = faRows.map(r => r.data);
        console.log("[verify] including", faRows.length, "fixed asset records as context");
      }
    }

    // Fetch inventory context for COGS/inventory adjustments
    let inventoryContext = null;
    const isInventoryRelated = ["inventory", "cogs", "cost of goods", "cost of sales", "obsolescence", "write-down"].some(
      kw => descLower.includes(kw) || classLower.includes(kw)
    );
    if (isInventoryRelated) {
      const { data: invDocs } = await adminClientDocs
        .from("documents")
        .select("id, name, parsed_summary")
        .eq("project_id", projectId)
        .eq("account_type", "inventory")
        .not("parsed_summary", "is", null);
      if (invDocs && invDocs.length > 0) {
        inventoryContext = invDocs.map(doc => ({
          documentName: doc.name,
          extractedData: doc.parsed_summary,
        }));
        console.log("[verify] including", invDocs.length, "inventory reports as context");
      }
    }

    // Fetch proof documents specifically attached to this adjustment
    let proofDocsContext = null;
    if (adjustmentId) {
      const { data: proofRecords } = await adminClientDocs
        .from("adjustment_proofs")
        .select("traceability_data, document_id")
        .eq("adjustment_id", adjustmentId)
        .eq("project_id", projectId);

      const proofDocIds: string[] = [];
      if (proofRecords && proofRecords.length > 0) {
        for (const rec of proofRecords) {
          if (rec.document_id) proofDocIds.push(rec.document_id);
          const td = rec.traceability_data as Record<string, unknown> | null;
          if (td && Array.isArray(td.document_ids)) {
            for (const did of td.document_ids) {
              if (typeof did === "string" && !proofDocIds.includes(did)) proofDocIds.push(did);
            }
          }
        }
      }

      if (proofDocIds.length > 0) {
        const { data: proofDocs } = await adminClientDocs
          .from("documents")
          .select("id, name, parsed_summary, extracted_data, account_type, category")
          .in("id", proofDocIds);

        // Also fetch processed_data for these proof documents
        const { data: proofPdRows } = await adminClientDocs
          .from("processed_data")
          .select("data, source_document_id, data_type")
          .eq("project_id", projectId)
          .in("source_document_id", proofDocIds);

        const pdByDocId = new Map<string, any>();
        if (proofPdRows) {
          for (const pd of proofPdRows) {
            if (pd.source_document_id) pdByDocId.set(pd.source_document_id, pd);
          }
        }

        if (proofDocs && proofDocs.length > 0) {
          proofDocsContext = proofDocs.map(doc => {
            const pd = pdByDocId.get(doc.id);
            const richData = pd ? (pd.data?.extractedData || pd.data) : null;
            return {
              documentName: doc.name,
              dataType: pd?.data_type || doc.account_type || doc.category || 'unknown',
              extractedData: richData || doc.parsed_summary || doc.extracted_data,
            };
          });
          console.log("[verify] including", proofDocs.length, "proof documents as context,", pdByDocId.size, "with processed_data enrichment");
        }
      }
    }

    // Extract per-period values from the adjustment (user-entered monthly amounts)
    const periodValues = adjustment?.periodValues ?? null;

    const requestPayload = {
      project_id: projectId,
      ...(jobId ? { job_id: jobId } : {}),
      description: adjustment?.description ?? "",
      amount: adjustment?.amount ?? 0,
      period: adjustment?.periodRange ?? null,
      adjustment_class: adjustment?.category ?? "",
      account_hints: accountHints,
      supabase_url: supabaseUrl,
      supabase_service_role_key: serviceRoleKey,
      ...(periodValues ? { period_values: periodValues } : {}),
      ...(payrollContext ? { payroll_context: payrollContext } : {}),
      ...(supportingDocsContext ? { supporting_documents_context: supportingDocsContext } : {}),
      ...(leaseContext ? { lease_context: leaseContext } : {}),
      ...(fixedAssetsContext ? { fixed_assets_context: fixedAssetsContext } : {}),
      ...(inventoryContext ? { inventory_context: inventoryContext } : {}),
      ...(proofDocsContext ? { proof_documents_context: proofDocsContext } : {}),
      schema_hints: {
        amount_column: "amount_signed",
        amount_abs_column: "amount_abs",
        notes: "amount is NULL for GL rows. Use amount_signed for actual transaction values.",
      },
    };

    console.log("[verify] sending async request to discovery service", periodValues ? `with ${Object.keys(periodValues).length} period values` : "without period values");

    const response = await fetch(`${discoveryUrl}/api/v1/proposals/verify`, {
      method: "POST",
      headers: {
        "x-service-key": discoveryKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Discovery service returned ${response.status}: ${errText}`);
      return new Response(
        JSON.stringify({ error: `Verification service error: ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    console.log("[verify] got job_id:", result.job_id, "status:", result.status);

    return new Response(
      JSON.stringify({
        jobId: result.job_id,
        status: result.status || "queued",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("verify-management-adjustment error:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
