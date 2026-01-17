import requests
import time

BASE_URL = "http://localhost:5000"

def test_health():
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

def test_search(query):
    try:
        resp = requests.get(f"{BASE_URL}/search?q={query}")
        print(f"Search '{query}': {resp.status_code}")
        print(resp.json())
    except Exception as e:
        print(f"Search Failed: {e}")

def test_sync():
    try:
        resp = requests.post(f"{BASE_URL}/sync")
        print(f"Sync Trigger: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"Sync Trigger Failed: {e}")

if __name__ == "__main__":
    print("Verifying Local Server...")
    test_health()
    test_search("PETR4")
    test_search("BTC")
    test_sync()
