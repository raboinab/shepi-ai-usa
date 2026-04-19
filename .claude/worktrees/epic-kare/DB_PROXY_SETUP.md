# Database Proxy Setup Guide

The `db-proxy` Edge Function provides secure database access for all external services through a unified REST API.

## 🔒 Authentication

Each service uses its own unique API key for secure, revocable access.

### Supported API Keys

Configure these as Supabase secrets:

- `SHEPI_SHEETS_API_KEY` - For shepiSheets service
- `DOCUCLIPPER_API_KEY` - For DocuClipper integration
- `PARSE_SERVICE_API_KEY` - For parsing services
- `PROCESSING_SERVICE_API_KEY` - For processing services
- `WORKFLOW_SERVICE_API_KEY` - For workflow services

### Setting Up API Keys

1. **Generate Secure Keys:**
```bash
# Generate a secure random API key
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# or
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **Set Supabase Secrets:**
```bash
# Navigate to project directory
cd /Users/araboin/qofeai/shepi-ai-web

# Link to Supabase project (if not already linked)
supabase link --project-ref sqwohcvobfnymsbzlfqr

# Set secrets for each service
supabase secrets set SHEPI_SHEETS_API_KEY="<your-generated-key-1>"
supabase secrets set DOCUCLIPPER_API_KEY="<your-generated-key-2>"
supabase secrets set PARSE_SERVICE_API_KEY="<your-generated-key-3>"
# Add more as needed
```

---

## 📡 Endpoint

```
POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy
```

---

## 🔑 Required Headers

```http
x-api-key: <your-service-api-key>
x-service-name: <your-service-name>
Content-Type: application/json
```

---

## 📖 API Actions

### 1. Query Action (CRUD Operations)

#### SELECT - Read Records
```json
{
  "action": "query",
  "table": "projects",
  "operation": "select",
  "select": "*",
  "filters": {
    "id": "uuid-123"
  },
  "order": {
    "column": "created_at",
    "ascending": false
  },
  "limit": 10,
  "offset": 0
}
```

#### INSERT - Create Records
```json
{
  "action": "query",
  "table": "projects",
  "operation": "insert",
  "data": {
    "name": "New Project",
    "client_name": "Acme Corp",
    "user_id": "user-uuid"
  }
}
```

#### UPDATE - Modify Records
```json
{
  "action": "query",
  "table": "projects",
  "operation": "update",
  "filters": {
    "id": "project-uuid"
  },
  "data": {
    "status": "completed",
    "updated_at": "2026-01-02T10:00:00Z"
  }
}
```

#### DELETE - Remove Records
```json
{
  "action": "query",
  "table": "documents",
  "operation": "delete",
  "filters": {
    "id": "doc-uuid"
  }
}
```

#### UPSERT - Insert or Update
```json
{
  "action": "query",
  "table": "profiles",
  "operation": "upsert",
  "data": {
    "user_id": "user-uuid",
    "full_name": "John Doe",
    "company": "Acme Inc"
  }
}
```

### 2. RPC Action (Call Database Functions)

```json
{
  "action": "rpc",
  "function_name": "get_project_summary",
  "params": {
    "project_id": "uuid-123"
  }
}
```

### 3. Storage Action (File Operations)

Access Supabase Storage to download/upload files without direct credentials.

#### GET SIGNED URL - Get Temporary Download URL
```json
{
  "action": "storage",
  "operation": "get_signed_url",
  "bucket": "documents",
  "path": "user-uuid/bank_statement.pdf",
  "options": {
    "expires_in": 3600
  }
}
```

Response:
```json
{
  "success": true,
  "signed_url": "https://sqwohcvobfnymsbzlfqr.supabase.co/storage/v1/object/sign/...",
  "expires_at": "2026-01-02T15:00:00Z"
}
```

#### UPLOAD - Upload File to Storage
```json
{
  "action": "storage",
  "operation": "upload",
  "bucket": "processed",
  "path": "results/doc-123-processed.json",
  "content": "base64-encoded-content-here",
  "content_type": "application/json",
  "options": {
    "upsert": false
  }
}
```

Response:
```json
{
  "success": true,
  "path": "results/doc-123-processed.json"
}
```

#### LIST - List Files in Directory
```json
{
  "action": "storage",
  "operation": "list",
  "bucket": "documents",
  "path": "user-uuid/",
  "options": {
    "limit": 100,
    "offset": 0
  }
}
```

Response:
```json
{
  "success": true,
  "files": [
    {
      "name": "bank_statement.pdf",
      "id": "file-id",
      "updated_at": "2026-01-02T14:00:00Z"
    }
  ]
}
```

#### DELETE - Remove File from Storage
```json
{
  "action": "storage",
  "operation": "delete",
  "bucket": "documents",
  "path": "user-uuid/old-file.pdf"
}
```

Response:
```json
{
  "success": true,
  "message": "File deleted"
}
```

---

## 🔍 Advanced Filters

### Comparison Operators
```json
{
  "filters": {
    "age": { "operator": "gt", "value": 18 },
    "status": { "operator": "neq", "value": "deleted" },
    "name": { "operator": "ilike", "value": "%acme%"}
  }
}
```

Supported operators:
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `neq` - Not equal
- `like` - Pattern match (case-sensitive)
- `ilike` - Pattern match (case-insensitive)

### Array Filters
```json
{
  "filters": {
    "status": ["active", "pending", "review"]
  }
}
```

### Null Checks
```json
{
  "filters": {
    "deleted_at": null
  }
}
```

---

## 💻 Service Implementation Examples

### Python (shepiSheets, Flask Services)

```python
import os
import requests

SUPABASE_URL = "https://sqwohcvobfnymsbzlfqr.supabase.co"
API_KEY = os.getenv("SHEPI_SHEETS_API_KEY")

def query_database(table, operation, **kwargs):
    """Generic database query function"""
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/db-proxy",
        headers={
            "x-api-key": API_KEY,
            "x-service-name": "shepiSheets",
            "Content-Type": "application/json"
        },
        json={
            "action": "query",
            "table": table,
            "operation": operation,
            **kwargs
        }
    )
    
    response.raise_for_status()
    return response.json()

# Example: Get a project
project_data = query_database(
    table="projects",
    operation="select",
    filters={"id": "project-uuid"},
    select="id, name, wizard_data, periods"
)

# Example: Update a project
updated = query_database(
    table="projects",
    operation="update",
    filters={"id": "project-uuid"},
    data={"status": "completed"}
)

# Example: Insert a document
new_doc = query_database(
    table="documents",
    operation="insert",
    data={
        "project_id": "project-uuid",
        "name": "bank_statement.pdf",
        "file_path": "/path/to/file",
        "user_id": "user-uuid"
    }
)

# Storage operations
def get_signed_url(bucket: str, path: str, expires_in: int = 3600):
    """Get a temporary signed URL to download a file"""
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/db-proxy",
        headers={
            "x-api-key": API_KEY,
            "x-service-name": "DocuClipper",
            "Content-Type": "application/json"
        },
        json={
            "action": "storage",
            "operation": "get_signed_url",
            "bucket": bucket,
            "path": path,
            "options": {"expires_in": expires_in}
        }
    )
    response.raise_for_status()
    return response.json()['signed_url']

# Example: Download a document via signed URL
signed_url = get_signed_url("documents", "user-uuid/bank_statement.pdf")
file_content = requests.get(signed_url).content
```

### Node.js / TypeScript

```typescript
import axios from 'axios';

const SUPABASE_URL = "https://sqwohcvobfnymsbzlfqr.supabase.co";
const API_KEY = process.env.DOCUCLIPPER_API_KEY;

async function queryDatabase(
  table: string,
  operation: string,
  options: any = {}
) {
  const response = await axios.post(
    `${SUPABASE_URL}/functions/v1/db-proxy`,
    {
      action: "query",
      table,
      operation,
      ...options
    },
    {
      headers: {
        "x-api-key": API_KEY,
        "x-service-name": "DocuClipper",
        "Content-Type": "application/json"
      }
    }
  );
  
  return response.data;
}

// Example: Get documents
const docs = await queryDatabase("documents", "select", {
  filters: { project_id: "uuid-123" },
  select: "id, name, processing_status"
});

// Example: Update processing status
await queryDatabase("documents", "update", {
  filters: { id: "doc-uuid" },
  data: { processing_status: "completed" }
});

// Storage operations
async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  const response = await axios.post(
    `${SUPABASE_URL}/functions/v1/db-proxy`,
    {
      action: "storage",
      operation: "get_signed_url",
      bucket,
      path,
      options: { expires_in: expiresIn }
    },
    {
      headers: {
        "x-api-key": API_KEY,
        "x-service-name": "DocuClipper",
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.signed_url;
}

// Example: Get signed URL for file download
const signedUrl = await getSignedUrl("documents", "user-uuid/file.pdf");
```

### cURL (Testing)

```bash
# Get a project
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy \
  -H "x-api-key: your-api-key-here" \
  -H "x-service-name: TestService" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "table": "projects",
    "operation": "select",
    "filters": {"id": "project-uuid"}
  }'

# Get signed URL for file download
curl -X POST https://sqwohcvobfnymsbzlfqr.supabase.co/functions/v1/db-proxy \
  -H "x-api-key: your-api-key-here" \
  -H "x-service-name: TestService" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "storage",
    "operation": "get_signed_url",
    "bucket": "documents",
    "path": "user-uuid/file.pdf",
    "options": {"expires_in": 3600}
  }'
```

---

## 🗃️ Available Tables

Common tables you can access:

- `projects` - Project information
- `documents` - Uploaded documents
- `processed_data` - Parsed financial data
- `workflows` - Workflow execution records
- `subscriptions` - User subscription data
- `profiles` - User profile information

*Note: You have access to all tables. Use responsibly.*

---

## 🚨 Error Handling

### Error Responses

```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing API key"
}
```

```json
{
  "error": "Database Error",
  "message": "column 'invalid_field' does not exist"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing parameters, invalid operation)
- `401` - Unauthorized (invalid API key)
- `500` - Internal Server Error (database error, server misconfiguration)

---

## 📊 Logging & Monitoring

All requests are logged with:
- Service name (from `x-service-name` header)
- Action and operation performed
- Success/failure status
- Error details if applicable

Check logs in Supabase Dashboard:
```
https://supabase.com/dashboard/project/sqwohcvobfnymsbzlfqr/logs/edge-functions
```

---

## 🔐 Security Best Practices

1. **Keep API Keys Secret**
   - Never commit keys to git
   - Use environment variables
   - Rotate keys periodically

2. **Use Service Names**
   - Always include `x-service-name` header
   - Helps with debugging and audit logs

3. **Validate Responses**
   - Check for `success: true` in response
   - Handle errors gracefully

4. **Least Privilege**
   - Only query tables you need
   - Use specific `select` fields instead of `*`

5. **Rate Limiting**
   - Implement retry logic with exponential backoff
   - Don't hammer the API

---

## 🆘 Troubleshooting

### "Unauthorized" Error
- Check API key is set correctly in environment
- Verify key matches one configured in Supabase secrets
- Ensure `x-api-key` header is included

### "Table not found" Error
- Check table name spelling
- Verify table exists in database

### "Column does not exist" Error
- Check column names in `select` or `data` fields
- Use database schema as reference

### No Data Returned
- Verify filters are correct
- Check if data actually exists in database
- Try without filters first

---

## 📞 Support

For issues or questions:
1. Check Supabase logs for detailed error messages
2. Verify API key configuration
3. Test with cURL to isolate service-specific issues
4. Check this documentation for examples

---

## 🎯 Quick Start Checklist

- [ ] Generate secure API key
- [ ] Set Supabase secret for your service
- [ ] Test with cURL
- [ ] Implement in your service
- [ ] Add error handling
- [ ] Monitor logs

**You're ready to go!** 🚀
