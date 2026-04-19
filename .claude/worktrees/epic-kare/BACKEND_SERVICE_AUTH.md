# Backend Service Authentication Guide

## 🔑 Problem: Services Don't Have User Tokens

External backend services (docuclipperapi, qbToJson, quickbooksapi, shepiSheets) act **on behalf of users**, not as users themselves. They need a different authentication mechanism.

---

## ✅ Solution: Use Service Role Key

### Option 1: Service Role Key (Recommended for Now)
Backend services should use the **SUPABASE_SERVICE_ROLE_KEY** which bypasses RLS.

**Why this works:**
- Bypasses Row Level Security (RLS)
- Has full database access
- Used for server-to-server communication

**How to use:**

```python
# Python (docuclipperapi, shepiSheets)
import os
import requests

SUPABASE_URL = "https://klccgigaedojxdpnkjcd.supabase.co"
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

headers = {
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "apikey": SERVICE_ROLE_KEY  # Also include as apikey
}

response = requests.post(
    f"{SUPABASE_URL}/functions/v1/processed-data-create",
    headers=headers,
    json={
        "project_id": project_id,
        "source_type": "docuclipper",
        "data_type": "bank_transactions",
        "data": extracted_data
    }
)
```

```java
// Java (quickbooksapi)
String supabaseUrl = "https://klccgigaedojxdpnkjcd.supabase.co";
String serviceRoleKey = System.getenv("SUPABASE_SERVICE_ROLE_KEY");

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(supabaseUrl + "/functions/v1/processed-data-create"))
    .header("Authorization", "Bearer " + serviceRoleKey)
    .header("apikey", serviceRoleKey)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
    .build();
```

---

## 🔐 Service Role Key Setup

### 1. Get the Service Role Key

**Location:** Supabase Dashboard → Settings → API

**Key Details:**
- Name: `service_role`
- Secret: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long)
- **NEVER commit to git or expose publicly!**

### 2. Add to Each Service's Environment

```bash
# docuclipperapi/.env
SUPABASE_URL=https://klccgigaedojxdpnkjcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# qbToJson/.env
SUPABASE_URL=https://klccgigaedojxdpnkjcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# quickbooksapi/.env (or application.properties)
SUPABASE_URL=https://klccgigaedojxdpnkjcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# shepiSheets/.env
SUPABASE_URL=https://klccgigaedojxdpnkjcd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# cloudRunQBAuth/.env (already has it!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🎯 Updated Integration Examples

### docuclipperapi

```python
# In docuclipper.py, after processing:
import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def store_processed_data(project_id, document_id, extracted_data):
    """Store processed data via Edge Function using service key."""
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "project_id": project_id,
        "source_type": "docuclipper",
        "data_type": "bank_transactions",
        "source_document_id": document_id,
        "data": extracted_data,
        "record_count": len(extracted_data.get("transactions", []))
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/processed-data-create",
        headers=headers,
        json=payload
    )
    
    if response.status_code not in [200, 201]:
        logging.error(f"Failed to store processed data: {response.text}")
    else:
        logging.info(f"Successfully stored processed data: {response.json()}")
    
    return response

# Call after processing:
store_processed_data(project_id, document_id, extracted_data)
```

### qbToJson

```python
# In qbToJson service:
import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def get_pending_documents(project_id):
    """Get pending QB files to process."""
    # For now, use REST API directly
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/documents",
        headers=headers,
        params={
            "project_id": f"eq.{project_id}",
            "category": "eq.quickbooks_file",
            "processing_status": "eq.pending"
        }
    )
    return response.json()

def store_transformed_data(project_id, document_id, transformed_data, data_type):
    """Store transformed QB data."""
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "project_id": project_id,
        "source_type": "qbtojson",
        "data_type": data_type,  # 'trial_balance', 'balance_sheet', etc.
        "source_document_id": document_id,
        "data": transformed_data
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/functions/v1/processed-data-create",
        headers=headers,
        json=payload
    )
    return response

def update_document_status(document_id, status):
    """Update document processing status."""
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/documents",
        headers=headers,
        params={"id": f"eq.{document_id}"},
        json={"processing_status": status}
    )
    return response
```

### quickbooksapi (Java)

```java
public class ProcessedDataService {
    private static final String SUPABASE_URL = System.getenv("SUPABASE_URL");
    private static final String SERVICE_KEY = System.getenv("SUPABASE_SERVICE_ROLE_KEY");
    
    public void storeQBData(String projectId, String qbRealmId, 
                           String dataType, JsonObject data) {
        
        HttpClient client = HttpClient.newHttpClient();
        
        JsonObject payload = Json.createObjectBuilder()
            .add("project_id", projectId)
            .add("source_type", "quickbooks_api")
            .add("data_type", dataType)
            .add("qb_realm_id", qbRealmId)
            .add("data", data)
            .build();
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(SUPABASE_URL + "/functions/v1/processed-data-create"))
            .header("Authorization", "Bearer " + SERVICE_KEY)
            .header("apikey", SERVICE_KEY)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
            .build();
        
        try {
            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());
            
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                logger.info("Successfully stored QB data");
            } else {
                logger.error("Failed to store QB data: " + response.body());
            }
        } catch (Exception e) {
            logger.error("Error storing QB data", e);
        }
    }
}
```

### shepiSheets

```python
# In shepiSheets service:
import os
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def get_project_data(project_id):
    """Get all processed data for a project."""
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY
    }
    
    response = requests.get(
        f"{SUPABASE_URL}/functions/v1/processed-data-list",
        headers=headers,
        params={"project_id": project_id}
    )
    
    return response.json()

def update_project_sheet_id(project_id, sheet_id, sheet_url):
    """Update project with created Google Sheet ID."""
    headers = {
        "Authorization": f"Bearer {SERVICE_KEY}",
        "apikey": SERVICE_KEY,
        "Content-Type": "application/json"
    }
    
    response = requests.patch(
        f"{SUPABASE_URL}/rest/v1/projects",
        headers=headers,
        params={"id": f"eq.{project_id}"},
        json={
            "google_sheet_id": sheet_id,
            "google_sheet_url": sheet_url
        }
    )
    return response
```

---

## 🔐 Security Notes

### ⚠️ IMPORTANT: Service Role Key Security

1. **NEVER expose service role key publicly**
   - Don't commit to git
   - Don't include in client-side code
   - Don't log in production

2. **Store securely in environment variables**
   - Use `.env` files (add to `.gitignore`)
   - Use Cloud Run secrets
   - Use Kubernetes secrets

3. **Rotate periodically**
   - Can be regenerated in Supabase Dashboard
   - Update all services when rotated

4. **Monitor usage**
   - Check Supabase logs for suspicious activity
   - Rate limit if needed

---

## 📊 Data Flow with Service Auth

```
Backend Service (no user token)
    ↓
Uses SUPABASE_SERVICE_ROLE_KEY
    ↓
Calls Edge Function
    ↓
Edge Function uses service key from request
    ↓
Service key bypasses RLS
    ↓
Data written to database
    ↓
RLS still protects when users query directly
```

---

## ✅ Summary

**Problem:** Backend services don't have user tokens
**Solution:** Use SUPABASE_SERVICE_ROLE_KEY
**Where to get it:** Supabase Dashboard → Settings → API
**How to use:** Pass as `Authorization: Bearer {key}` and `apikey: {key}` headers
**Security:** Store in environment variables, never commit to git

**All backend services can now authenticate with Supabase!** 🔐
