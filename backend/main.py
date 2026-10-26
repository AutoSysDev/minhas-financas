from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import pandas as pd
from ofxparse import OfxParser
import pdfplumber
import io
from datetime import datetime
import json

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/import-invoice")
async def import_invoice(
    file: UploadFile = File(...),
    card_id: str = Form(...),
    month: str = Form(...),
    account_id: str = Form(...)
):
    try:
        content = await file.read()
        filename = file.filename.lower()
        transactions = []

        if filename.endswith('.xlsx') or filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
            # Basic assumption: Columns might be Date, Description, Amount
            # This logic needs to be adapted based on actual bank exports
            # For now, we look for common column names
            
            # Normalize columns
            df.columns = [str(c).lower() for c in df.columns]
            
            date_col = next((c for c in df.columns if 'data' in c or 'date' in c), None)
            desc_col = next((c for c in df.columns if 'desc' in c or 'historico' in c), None)
            amount_col = next((c for c in df.columns if 'valor' in c or 'amount' in c), None)

            if date_col and desc_col and amount_col:
                for _, row in df.iterrows():
                    transactions.append({
                        "date": str(row[date_col]),
                        "description": str(row[desc_col]),
                        "amount": float(row[amount_col]),
                        "card_id": card_id,
                        "account_id": account_id
                    })

        elif filename.endswith('.ofx'):
            ofx = OfxParser.parse(io.BytesIO(content))
            for account in ofx.accounts:
                for transaction in account.statement.transactions:
                    transactions.append({
                        "date": transaction.date.isoformat(),
                        "description": transaction.memo,
                        "amount": float(transaction.amount),
                        "card_id": card_id,
                        "account_id": account_id
                    })

        elif filename.endswith('.pdf'):
            # PDF parsing is complex and structure-dependent.
            # This is a very basic extraction that might not work for all PDFs.
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                text = ""
                for page in pdf.pages:
                    text += page.extract_text() or ""
                
                # Mocking extraction result for now as PDF parsing logic is highly specific
                transactions.append({
                    "description": "PDF Import - Implementation requires specific layout parsing",
                    "amount": 0.0,
                    "date": datetime.now().isoformat(),
                    "raw_text_sample": text[:100]
                })

        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        return {"status": "success", "transactions": transactions, "month": month}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
