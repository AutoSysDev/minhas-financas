import os
import yfinance as yf
from supabase import create_client, Client
from dotenv import load_dotenv
import datetime

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use service role for backend scripts

if not SUPABASE_URL:
    print("Error: SUPABASE_URL (or VITE_SUPABASE_URL) must be set in .env")
    exit(1)

if not SUPABASE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    print("Please find this key in your Supabase Dashboard > Settings > API > Project API keys > service_role (secret)")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def sync_investments():
    print(f"Starting investment sync at {datetime.datetime.now()}")
    
    # 1. Fetch investments with tickers
    response = supabase.table("investments").select("*").not_.is_("ticker", "null").execute()
    investments = response.data
    
    if not investments:
        print("No investments with tickers found.")
        return

    print(f"Found {len(investments)} investments to sync.")

    for inv in investments:
        ticker = inv.get("ticker")
        if not ticker:
            continue
            
        # Sanitize ticker (common user error: "BTC USD" -> "BTC-USD")
        ticker = ticker.strip().upper().replace(" ", "-")
        
        print(f"Syncing {ticker} for investment ID {inv['id']}...")
        
        try:
            # 2. Fetch data from yfinance
            stock = yf.Ticker(ticker)
            # Try to get the fast info (often faster and reliable for current price)
            price = None
            
            # Different strategies to get price depending on asset type (basic logic)
            # Try 'currentPrice' first, then 'regularMarketPrice', then history
            info = stock.info
            
            if 'currentPrice' in info:
                price = info['currentPrice']
            elif 'regularMarketPrice' in info:
                price = info['regularMarketPrice']
            else:
                # Fallback to history
                hist = stock.history(period="1d")
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
            
            if price is None:
                print(f"  Warning: Could not fetch price for {ticker}")
                continue
                
            print(f"  Current price: {price}")
            
            # 3. Update Supabase
            quantity = inv.get("quantity", 0)
            if quantity is None: quantity = 0
            quantity = float(quantity)

            update_data = {
                "last_sync": datetime.datetime.now().isoformat(),
                "current_price": float(price)
            }

            if quantity > 0:
                new_amount = float(price) * quantity
                update_data["amount"] = new_amount
                print(f"  Updating {ticker}: Price={price:.2f}, Qty={quantity}, New Amount={new_amount:.2f}")
            else:
                print(f"  Updating {ticker}: Price={price:.2f} (Qty is 0, skipping amount update)")

            supabase.table("investments").update(update_data).eq("id", inv["id"]).execute()
            
            print(f"  Sync complete for {ticker}")
            
        except Exception as e:
            print(f"  Error syncing {ticker}: {e}")

if __name__ == "__main__":
    sync_investments()
