# QuickBooks Sync API Contract

This document defines the API contract for the Java QuickBooks sync service to interact with the Supabase database via the `db-proxy` edge function.

---

## 🔐 Authentication

### Required Headers

```http
x-api-key: <QUICKBOOKS_API_KEY>
x-service-name: QuickBooksSync
Content-Type: application/json
```

### Endpoint

```
POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy
```

---

## 📊 processed_data Table Schema

| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | uuid | No | auto-generated | Primary key |
| `project_id` | uuid | **YES** | - | Must match valid project |
| `user_id` | uuid | **YES** | - | Get from company_info lookup |
| `source_type` | text | **YES** | - | MUST be `"quickbooks_api"` for progress tracking |
| `data_type` | text | **YES** | - | See valid values below |
| `source_document_id` | uuid | No | null | Optional reference |
| `data` | jsonb | **YES** | `{}` | The actual QB data |
| `period_start` | date | Recommended | null | Required for trial_balance |
| `period_end` | date | Recommended | null | Required for trial_balance |
| `record_count` | integer | No | null | Number of records in data |
| `qb_realm_id` | text | No | null | QuickBooks realm ID |
| `validation_status` | text | No | `"pending"` | Processing status |
| `created_at` | timestamptz | No | now() | Auto-set |
| `updated_at` | timestamptz | No | now() | Auto-set |

### Valid `data_type` Values

- `trial_balance` - **Required for progress tracking**
- `chart_of_accounts`
- `balance_sheet`
- `income_statement`
- `general_ledger`
- `cash_flow`
- `customers`
- `vendors`
- `employees`
- `company_info`
- `fixed_assets`
- `inventory`
- `ar_aging`
- `ap_aging`

---

## 🔑 Get QuickBooks Credentials (Token Management)

### Endpoint

```
POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/get-qb-credentials
```

### Required Headers

```http
x-api-key: <QUICKBOOKS_API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "project_id": "<project-uuid>"
}
```

### Response

```json
{
  "success": true,
  "access_token": "eyJ...",
  "realm_id": "1234567890",
  "refreshed": false,
  "expires_in_seconds": 2847
}
```

### Behavior

- Returns current token if valid for 5+ minutes
- **Automatically refreshes** token if expiring within 5 minutes
- `refreshed: true` indicates a fresh token was obtained from OAuth
- Java service should call this instead of querying `company_info` directly

### Token Refresh Strategy

The `get-qb-credentials` endpoint handles token refresh **reactively**:

1. Checks `token_expires_at` in `company_info` table
2. If token expires within 5 minutes → calls `qbAuth` service to refresh
3. `qbAuth` performs OAuth refresh and updates `company_info`
4. Fresh token returned to caller

**Java TokenService Implementation:**

```java
public class TokenService {
    private static final String CREDENTIALS_URL = 
        "https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/get-qb-credentials";
    
    public Credentials getCredentials(String projectId) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(CREDENTIALS_URL))
            .header("x-api-key", apiKey)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(
                "{\"project_id\":\"" + projectId + "\"}"
            ))
            .build();
        
        HttpResponse<String> response = httpClient.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new TokenException("Failed to get credentials: " + response.body());
        }
        
        return parseCredentials(response.body());
    }
}
```

### 401 Error Handling (Safety Net)

If a QuickBooks API call returns 401 Unauthorized, immediately re-fetch credentials and retry:

```java
try {
    makeQuickBooksCall(accessToken);
} catch (UnauthorizedException e) {
    // Force re-fetch (edge function will refresh if needed)
    credentials = tokenService.getCredentials(projectId);
    makeQuickBooksCall(credentials.getAccessToken()); // Retry once
}
```

---

## 🔄 Workflow: Complete Sync Process

### Step 1: Get Credentials

Before making any QuickBooks API calls, get fresh credentials:

```http
POST /functions/v1/get-qb-credentials
x-api-key: <QUICKBOOKS_API_KEY>
Content-Type: application/json

{
  "project_id": "<project-uuid>"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "realm_id": "1234567890",
  "refreshed": false,
  "expires_in_seconds": 3200
}
```

### Step 2: Get user_id from projects table

Get the `user_id` associated with the project for data inserts:

```json
{
  "action": "query",
  "table": "projects",
  "operation": "select",
  "select": "user_id",
  "filters": {
    "id": "<project-uuid>"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": "abc123-user-uuid"
    }
  ]
}
```

### Step 2: Insert processed_data Records

For each data type fetched from QuickBooks:

```json
{
  "action": "query",
  "table": "processed_data",
  "operation": "insert",
  "data": {
    "project_id": "<project-uuid>",
    "user_id": "<user-uuid-from-step-1>",
    "source_type": "quickbooks_api",
    "data_type": "trial_balance",
    "data": {
      "accounts": [...],
      "metadata": {...}
    },
    "period_start": "2024-01-01",
    "period_end": "2024-01-31",
    "record_count": 150,
    "qb_realm_id": "1234567890"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "generated-uuid",
      "project_id": "...",
      ...
    }
  ]
}
```

---

## 📈 Progress Tracking

### How It Works

The database has a trigger `update_workflow_progress_on_insert` that automatically updates workflow progress when `trial_balance` records are inserted.

**Trigger Logic:**
1. Only processes records where `source_type = 'quickbooks_api'`
2. Counts `trial_balance` records created since workflow started
3. Calculates progress: `15% + (records_count / expected_count * 65%)`
4. Progress range: 15% (start) → 80% (all data fetched)

### Critical Requirements

- **`source_type` MUST be `"quickbooks_api"`** - Other values won't trigger progress updates
- **`data_type` should include `"trial_balance"`** - This is what the trigger counts
- **Insert one record per period** - E.g., 36 records for 36 months

### Example: 36-Month Sync

| Records Inserted | Progress |
|------------------|----------|
| 0 | 15% |
| 9 | ~31% |
| 18 | ~48% |
| 27 | ~64% |
| 36 | 80% |

---

## 📞 Completion Callback

### When to Call

After ALL data has been inserted, call the callback URL provided in the original request headers.

### Callback URL

The `trigger-qb-sync` function provides this in the `X-Callback-Url` header:
```
https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/qb-sync-complete
```

### Callback Request

```http
POST /functions/v1/qb-sync-complete
x-api-key: <QUICKBOOKS_API_KEY>
x-workflow-id: <workflow-uuid>
Content-Type: application/json

{
  "workflow_id": "<workflow-uuid>",
  "project_id": "<project-uuid>",
  "status": "success",
  "records_synced": {
    "trial_balance": 36,
    "chart_of_accounts": 1,
    "balance_sheet": 36,
    "income_statement": 36,
    "customers": 1,
    "vendors": 1
  },
  "sync_summary": {
    "total_records": 111,
    "periods_covered": 36,
    "start_date": "2023-01-01",
    "end_date": "2025-12-31"
  }
}
```

### Callback for Errors

```json
{
  "workflow_id": "<workflow-uuid>",
  "project_id": "<project-uuid>",
  "status": "error",
  "error": {
    "code": "QB_API_ERROR",
    "message": "Failed to fetch trial balance for period 2024-03",
    "details": {
      "http_status": 401,
      "qb_error_code": "AuthenticationFailed"
    }
  }
}
```

---

## 🧪 Testing with cURL

### 1. Test Authentication

```bash
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy \
  -H "x-api-key: YOUR_QUICKBOOKS_API_KEY" \
  -H "x-service-name: QuickBooksSync" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "table": "company_info",
    "operation": "select",
    "select": "user_id, project_id",
    "filters": {"realm_id": "1234567890"},
    "limit": 1
  }'
```

### 2. Insert Trial Balance Record

```bash
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy \
  -H "x-api-key: YOUR_QUICKBOOKS_API_KEY" \
  -H "x-service-name: QuickBooksSync" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "table": "processed_data",
    "operation": "insert",
    "data": {
      "project_id": "def456-project-uuid",
      "user_id": "abc123-user-uuid",
      "source_type": "quickbooks_api",
      "data_type": "trial_balance",
      "data": {"accounts": [], "test": true},
      "period_start": "2024-01-01",
      "period_end": "2024-01-31",
      "record_count": 0,
      "qb_realm_id": "1234567890"
    }
  }'
```

### 3. Check Workflow Progress

```bash
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy \
  -H "x-api-key: YOUR_QUICKBOOKS_API_KEY" \
  -H "x-service-name: QuickBooksSync" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "table": "workflows",
    "operation": "select",
    "select": "id, status, progress_percent, current_step",
    "filters": {"id": "workflow-uuid"}
  }'
```

### 4. Call Completion Callback

```bash
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/qb-sync-complete \
  -H "x-api-key: YOUR_QUICKBOOKS_API_KEY" \
  -H "x-workflow-id: workflow-uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-uuid",
    "project_id": "project-uuid",
    "status": "success",
    "records_synced": {"trial_balance": 36}
  }'
```

---

## ☕ Java Implementation Reference

### Recommended HTTP Client Configuration

```java
// Connection settings
int CONNECT_TIMEOUT_MS = 60_000;  // 60 seconds
int READ_TIMEOUT_MS = 60_000;     // 60 seconds
int MAX_RETRIES = 3;

// Exponential backoff
int[] RETRY_DELAYS_MS = {1000, 2000, 4000};  // 1s, 2s, 4s
```

### Request Builder Example

```java
public class DbProxyClient {
    private static final String BASE_URL = 
        "https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy";
    
    private final String apiKey;
    private final HttpClient httpClient;
    
    public DbProxyClient(String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(60))
            .build();
    }
    
    public JsonObject insertProcessedData(
        String projectId,
        String userId,
        String dataType,
        JsonObject data,
        LocalDate periodStart,
        LocalDate periodEnd,
        String realmId
    ) throws Exception {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "query");
        payload.addProperty("table", "processed_data");
        payload.addProperty("operation", "insert");
        
        JsonObject insertData = new JsonObject();
        insertData.addProperty("project_id", projectId);
        insertData.addProperty("user_id", userId);
        insertData.addProperty("source_type", "quickbooks_api");
        insertData.addProperty("data_type", dataType);
        insertData.add("data", data);
        insertData.addProperty("period_start", periodStart.toString());
        insertData.addProperty("period_end", periodEnd.toString());
        insertData.addProperty("qb_realm_id", realmId);
        
        payload.add("data", insertData);
        
        return executeWithRetry(payload);
    }
    
    private JsonObject executeWithRetry(JsonObject payload) throws Exception {
        int[] delays = {1000, 2000, 4000};
        Exception lastException = null;
        
        for (int attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL))
                    .header("x-api-key", apiKey)
                    .header("x-service-name", "QuickBooksSync")
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                    .build();
                
                HttpResponse<String> response = httpClient.send(
                    request, 
                    HttpResponse.BodyHandlers.ofString()
                );
                
                if (response.statusCode() == 200) {
                    return JsonParser.parseString(response.body()).getAsJsonObject();
                } else if (response.statusCode() >= 500) {
                    throw new IOException("Server error: " + response.statusCode());
                } else {
                    // Client error - don't retry
                    throw new RuntimeException("Client error: " + response.body());
                }
            } catch (IOException e) {
                lastException = e;
                if (attempt < MAX_RETRIES) {
                    Thread.sleep(delays[attempt]);
                }
            }
        }
        
        throw lastException;
    }
}
```

### Sync Orchestration Example

```java
public void syncQuickBooksData(
    String projectId, 
    String realmId,
    LocalDate startDate,
    LocalDate endDate,
    String callbackUrl,
    String workflowId
) {
    try {
        // Step 1: Get user_id
        JsonObject companyInfo = dbProxy.query(
            "company_info", "select",
            Map.of("project_id", projectId, "realm_id", realmId)
        );
        String userId = companyInfo.get("data")
            .getAsJsonArray().get(0)
            .getAsJsonObject().get("user_id").getAsString();
        
        // Step 2: Fetch and insert data for each period
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            LocalDate periodEnd = current.withDayOfMonth(
                current.lengthOfMonth()
            );
            
            // Fetch from QuickBooks API
            JsonObject trialBalance = qbApi.getTrialBalance(
                realmId, current, periodEnd
            );
            
            // Insert to database (triggers progress update)
            dbProxy.insertProcessedData(
                projectId, userId, "trial_balance",
                trialBalance, current, periodEnd, realmId
            );
            
            current = current.plusMonths(1);
        }
        
        // Step 3: Fetch non-periodic data
        insertChartOfAccounts(projectId, userId, realmId);
        insertCustomers(projectId, userId, realmId);
        insertVendors(projectId, userId, realmId);
        
        // Step 4: Call completion callback
        callCompletionCallback(callbackUrl, workflowId, projectId, "success");
        
    } catch (Exception e) {
        callCompletionCallback(callbackUrl, workflowId, projectId, "error", e);
    }
}
```

---

## 📊 Trial Balance Row Schema (from Java Service)

Each account row in `data_type: "trial_balance"` records should include these fields using **camelCase** naming:

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `accountId` | string | Yes | QB Account ID | `"123"` |
| `accountType` | string | Yes | Raw QB type (BANK, INCOME, etc.) | `"BANK"` |
| `accountSubtype` | string | No | QB detail type | `"Checking"` |
| `fsType` | string | Yes | Balance Sheet ("BS") or Income Statement ("IS") | `"BS"` |
| `accountNumber` | string | No | Account number from AcctNum | `"1000"` |
| `accountName` | string | Yes | Account display name | `"Checking Account"` |
| `fsLineItem` | string | Yes | Standardized workbook Column E label | `"Cash and cash equivalents"` |
| `subAccount1` | string | No | Hierarchy level 1 (from AccountSubType) | `"Banking"` |
| `subAccount2` | string | No | Hierarchy level 2 (from ParentRef) | `""` |
| `subAccount3` | string | No | Hierarchy level 3 (reserved for future) | `""` |

### Canonical fsLineItem Mapping Table

The Java service must use these **exact** strings for `fsLineItem` to ensure workbook SUMIFS formulas work correctly:

| QBO Account Type | fsType | fsLineItem (Column E) |
|-----------------|--------|----------------------|
| `BANK` | BS | `Cash and cash equivalents` |
| `ACCOUNTS_RECEIVABLE` | BS | `Accounts receivable` |
| `OTHER_CURRENT_ASSET` | BS | `Other current assets` |
| `FIXED_ASSET` | BS | `Fixed assets` |
| `OTHER_ASSET` | BS | `Other assets` |
| `ACCOUNTS_PAYABLE` | BS | `Current liabilities` |
| `CREDIT_CARD` | BS | `Current liabilities` |
| `OTHER_CURRENT_LIABILITY` | BS | `Other current liabilities` |
| `LONG_TERM_LIABILITY` | BS | `Long term liabilities` |
| `EQUITY` | BS | `Equity` |
| `INCOME` | IS | `Revenue` |
| `REVENUE` | IS | `Revenue` |
| `COST_OF_GOODS_SOLD` | IS | `Cost of Goods Sold` |
| `EXPENSE` | IS | `Operating expenses` |
| `OTHER_INCOME` | IS | `Other expense (income)` |
| `OTHER_EXPENSE` | IS | `Other expense (income)` |

### Example Trial Balance Row

```json
{
  "accountId": "123",
  "accountType": "BANK",
  "accountSubtype": "Checking",
  "fsType": "BS",
  "accountNumber": "1000",
  "accountName": "Checking Account",
  "fsLineItem": "Cash and cash equivalents",
  "subAccount1": "Checking",
  "subAccount2": "",
  "subAccount3": "",
  "monthlyValues": {
    "2024-01": 15000.00,
    "2024-02": 18500.00
  }
}
```

### Edge Function Fallback

If `fsLineItem` is not provided by the Java service, edge functions will compute it using `mapAccountTypeToFSLineItem(accountType)` from the shared `_shared/qbAccountMappings.ts` module.

---

## ⚠️ Error Handling

### db-proxy Error Responses

```json
{
  "success": false,
  "error": "Database Error",
  "message": "duplicate key value violates unique constraint"
}
```

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Continue |
| 400 | Bad Request | Fix payload, don't retry |
| 401 | Unauthorized | Check API key |
| 500 | Server Error | Retry with backoff |
| 502/503 | Gateway Error | Retry with backoff |

### Recommended Error Codes for Callback

| Code | Description |
|------|-------------|
| `QB_AUTH_EXPIRED` | QuickBooks token needs refresh |
| `QB_API_ERROR` | QuickBooks API returned error |
| `QB_RATE_LIMITED` | Hit QuickBooks rate limits |
| `DB_INSERT_FAILED` | Could not save to database |
| `NETWORK_ERROR` | Connection issues |

---

## 📋 Sync Checklist

- [ ] Validate API key is configured
- [ ] Get `user_id` from `company_info` table first
- [ ] Use `source_type: "quickbooks_api"` for all inserts
- [ ] Insert `trial_balance` records with `period_start`/`period_end`
- [ ] Handle rate limits from QuickBooks API (100 requests/minute)
- [ ] Implement retry logic with exponential backoff
- [ ] Set 60-second timeouts on HTTP calls
- [ ] Call completion callback when done (success or error)
- [ ] Log all operations for debugging

---

## 📞 Support

For issues:
1. Check Supabase edge function logs
2. Verify API key is correct
3. Test with cURL commands above
4. Check `workflows` table for status/errors
