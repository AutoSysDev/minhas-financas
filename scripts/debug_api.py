import requests
import json

PAT = "sbp_a1e9d11945aed84caf92f198a54dac65ab791f9f"
REF = "oxlxjakwoekbiownvmhv"

headers = {
    "Authorization": f"Bearer {PAT}",
    "Content-Type": "application/json"
}

print("1. Checking Projects...")
resp = requests.get("https://api.supabase.com/v1/projects", headers=headers)
if resp.status_code == 200:
    projects = resp.json()
    print("Projects found:", len(projects))
    for p in projects:
        if p['id'] == REF:
            print(f"Target Project Found: {p['name']} ({p['id']})")
            print(f"Status: {p.get('status')}")
            # Ensure database info is present
            db = p.get('database')
            if db:
                print(f"DB Host: {db.get('host')}")
                # We won't get the password here
else:
    print(f"Failed to list projects: {resp.status_code} {resp.text}")

print("\n2. Trying SQL Query Endpoint (v1/projects/{ref}/query)...")
# Note: documentation often refers to /v1/query or similar for the management API
sql = "SELECT version();"
payload = {"query": sql}
resp = requests.post(f"https://api.supabase.com/v1/projects/{REF}/query", json=payload, headers=headers)
print(f"Query Status: {resp.status_code}")
print(f"Query Response: {resp.text}")

print("\n3. Trying SQL Query via Psql (snippet only, can't run if no tool installed)")
# If we have the db host and user (postgres usually), but no password...
# The service_role key allows REST access, not PSQL/5432 access.
