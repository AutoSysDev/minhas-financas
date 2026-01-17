import os
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing keys")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Try to insert a dummy investment with a ticker
try:
    print("Attempting to insert test record with ticker...")
    data = {
        "user_id": "00000000-0000-0000-0000-000000000000", # Will likely fail FK if user doesn't exist, need a real user or just check schema another way.
        # Better: Select single row and try to update it with a ticker? No, safety.
        # Getting a real user ID from existing data?
        "name": "Test Automation",
        "type": "acoes",
        "amount": 100,
        "ticker": "TEST3"
    }
    
    # Actually, we can just introspect the URL if we want, but let's try to get one user first
    users = supabase.table("investments").select("user_id").limit(1).execute()
    if users.data and len(users.data) > 0:
        uid = users.data[0]['user_id']
        data['user_id'] = uid
        
        # Insert
        res = supabase.table("investments").insert(data).execute()
        print("Success! Ticker column exists.")
        
        # Cleanup
        new_id = res.data[0]['id']
        supabase.table("investments").delete().eq("id", new_id).execute()
    else:
        # No investments, try to just RPC or something?
        # If table exists but empty, we can't get valid user_id easily without auth admin.
        # We have service key, we can list users?
        # supabase.auth.admin.list_users() is possible with service key.
        users = supabase.auth.admin.list_users()
        if users.users:
            uid = users.users[0].id
            data['user_id'] = uid
            res = supabase.table("investments").insert(data).execute()
            print("Success! Ticker column exists.")
            # Cleanup
            new_id = res.data[0]['id']
            supabase.table("investments").delete().eq("id", new_id).execute()
        else:
             print("No users found to test with.")

except Exception as e:
    print(f"Migration Verify Failed: {e}")
