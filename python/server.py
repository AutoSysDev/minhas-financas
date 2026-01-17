import os
import yfinance as yf
from flask import Flask, request, jsonify
from flask_cors import CORS
from sync_investments import sync_investments
import threading
from bank_import_service import BankImportService

app = Flask(__name__)
CORS(app)
import_service = BankImportService()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Monely Finance Automation Server Running"})

@app.route('/search', methods=['GET'])
def search_ticker():
    query = request.args.get('q')
    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400
    
    query = query.strip().upper()
    print(f"Searching for: {query}...")
    
    results = []
    
    # Try different suffixes if not present (BR market mostly)
    suffixes = ['', '.SA']
    
    for suffix in suffixes:
        try:
            full_ticker = query + suffix if not query.endswith(suffix) else query
            
            # yfinance search is sometimes slow or limited, let's try direct ticker fetch first
            ticker = yf.Ticker(full_ticker)
            info = ticker.info
            
            # Check if we got valid data (some key fields usually present)
            if info and ('longName' in info or 'shortName' in info or 'regularMarketPrice' in info or 'currentPrice' in info):
               
               price = info.get('currentPrice') or info.get('regularMarketPrice')
               name = info.get('longName') or info.get('shortName') or full_ticker
               
               results.append({
                   "ticker": full_ticker,
                   "name": name,
                   "price": price,
                   "currency": info.get('currency', 'BRL')
               })
        except Exception as e:
            print(f"Error checking {full_ticker}: {e}")
            continue

    # Also try generic yfinance search if single lookup failed or to add more options
    # Note: yf.Search is not always reliable in the python library, 
    # but we can try just returning what we found directly for now.
    
    if not results and len(query) >= 3:
         # Fallback: Just return the raw query as a suggestion if we found nothing, 
         # but marked as 'Unknown' so user can try. 
         # Or rely on frontend to handle "Not found".
         pass

    return jsonify({"results": results})

@app.route('/sync', methods=['POST'])
def trigger_sync():
    # Run sync in a separate thread to not block response
    def run_job():
        try:
            print("Starting manual sync job...")
            sync_investments()
            print("Manual sync job finished.")
        except Exception as e:
            print(f"Manual sync failed: {e}")

    thread = threading.Thread(target=run_job)
    thread.start()
    
    return jsonify({"status": "started", "message": "Investment sync started in background"})

@app.route('/parse', methods=['POST'])
def parse_bank_statement():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        file_bytes = file.read()
        transactions = import_service.parse_file(file_bytes, file.filename)
        
        return jsonify({
            "status": "success", 
            "transactions": transactions
        })
    except Exception as e:
        print(f"Parse failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/save-imported', methods=['POST'])
def save_imported_transactions():
    try:
        data = request.json
        transactions = data.get('transactions')
        user_id = data.get('user_id')
        account_id = data.get('account_id')

        if not transactions or not user_id:
            return jsonify({"error": "Missing transactions or user_id"}), 400
        
        count = import_service.save_transactions(transactions, user_id, account_id)
        
        return jsonify({
            "status": "success", 
            "message": f"Successfully imported {count} transactions.",
            "count": count
        })
    except Exception as e:
        print(f"Save failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/import', methods=['POST'])
def import_bank_statement():
    # Keep /import as a one-shot shortcut just in case
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id')
        account_id = request.form.get('account_id')

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        file_bytes = file.read()
        count = import_service.process_and_save(file_bytes, file.filename, user_id, account_id)
        
        return jsonify({
            "status": "success", 
            "message": f"Successfully imported {count} transactions.",
            "count": count
        })
    except Exception as e:
        print(f"Import failed: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Starting Monely Finance Local Server on port 5000...")
    app.run(port=5000, debug=True)
