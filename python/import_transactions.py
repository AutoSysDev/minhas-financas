import argparse
import os
import pandas as pd
import pdfplumber
from ofxparse import OfxParser
from supabase import create_client, Client
from dotenv import load_dotenv
import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL:
    print("Error: SUPABASE_URL (or VITE_SUPABASE_URL) must be set in .env")
    exit(1)

if not SUPABASE_KEY:
    print("Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    print("Please find this key in your Supabase Dashboard > Settings > API > Project API keys > service_role (secret)")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_ofx(file_path):
    print(f"Parsing OFX: {file_path}")
    with open(file_path, encoding="latin-1") as fileobj:
        ofx = OfxParser.parse(fileobj)
    
    transactions = []
    for account in ofx.accounts:
        for tx in account.statement.transactions:
            transactions.append({
                "date": tx.date,
                "amount": tx.amount,
                "description": tx.memo,
                "id": tx.id
            })
    return transactions

def parse_pdf(file_path):
    print(f"Parsing PDF: {file_path}")
    # Defines a basic strategy for PDFs - this usually requires customization per bank
    transactions = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            # Very naive parsing - assumes lines look like "DD/MM DESCRIPTION AMOUNT"
            # This needs REGEX in a real scenario
            lines = text.split('\n')
            for line in lines:
                # Placeholder logic
                pass
    print("PDF parsing is highly specific to bank layouts and requires custom regex rules.")
    return transactions

def import_transactions(file_path, user_id, account_id):
    ext = os.path.splitext(file_path)[1].lower()
    
    data = []
    if ext == '.ofx':
        data = parse_ofx(file_path)
    elif ext == '.pdf':
        data = parse_pdf(file_path)
    else:
        print("Unsupported file format.")
        return

    print(f"Found {len(data)} transactions.")
    
    count = 0
    for tx in data:
        # Check for duplicates?
        # For now, just insert
        
        # Determine type
        amount = float(tx['amount'])
        t_type = "INCOME" if amount > 0 else "EXPENSE"
        
        payload = {
            "user_id": user_id,
            "account_id": account_id,
            "description": tx['description'],
            "amount": abs(amount), # Store absolute value
            "type": t_type,
            "date": tx['date'].isoformat(),
            "is_paid": True,
            "category": "Outros" # Auto-categorization would go here
        }
        
        try:
            supabase.table("transactions").insert(payload).execute()
            count += 1
        except Exception as e:
            print(f"Error inserting {tx['description']}: {e}")

    print(f"Successfully imported {count} transactions.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Import transactions from file')
    parser.add_argument('file_path', help='Path to the file (OFX/PDF)')
    parser.add_argument('--user_id', required=True, help='Target User UUID')
    parser.add_argument('--account_id', required=True, help='Target Account UUID')
    
    args = parser.parse_args()
    import_transactions(args.file_path, args.user_id, args.account_id)
