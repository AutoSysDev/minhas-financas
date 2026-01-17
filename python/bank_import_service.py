import os
import re
import pandas as pd
import PyPDF2
from ofxparse import OfxParser
from supabase import create_client, Client
from dotenv import load_dotenv
import datetime
import io
import time

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

class BankImportService:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise Exception("Supabase credentials missing.")
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    def categorizar_transacao(self, descricao):
        descricao = descricao.upper()
        categorias = {
            "Alimentação": ["LANCHES", "PIZZA", "HOTDOG", "SUSHI", "RESTAURANTE", "CONVENIENCIA", "ARCOS DOURADOS", "BOMFRIGO", "IFOOD", "UBER EATS"],
            "Transporte": ["POSTOS", "COMBUSTIVEIS", "AUTO PECAS", "AUTO SERVICE", "GM PRIME", "UBER", "99APP", "ESTACIONAMENTO"],
            "Assinaturas": ["APPLE.COM", "NETFLIX", "SPOTIFY", "GOOGLE", "CLARO", "VIVO"],
            "Lazer": ["GELO E GELA", "CINEMA", "SHOPPING"],
            "Transferência": ["PIX RECEBIDO", "PIX ENVIADO", "TED", "DOC"],
            "Pagamentos": ["PAGAMENTO FATURA", "BOLETO", "CONSEC"]
        }
        for categoria, palavras_chave in categorias.items():
            for palavra in palavras_chave:
                if palavra in descricao:
                    return categoria
        return "Outros"

    def parse_pdf(self, file_bytes):
        """Extracts transactions from PDF using the logic provided by the user."""
        texto = ""
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            texto += page.extract_text() + "\n"

        linhas = texto.split('\n')
        transacoes = []
        data_atual = None
        regex_data = re.compile(r'(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})')
        meses = {
            "Janeiro": "01", "Fevereiro": "02", "Março": "03", "Abril": "04",
            "Maio": "05", "Junho": "06", "Julho": "07", "Agosto": "08",
            "Setembro": "09", "Outubro": "10", "Novembro": "11", "Dezembro": "12"
        }

        for linha in linhas:
            linha = linha.strip()
            if not linha: continue

            match_data = regex_data.search(linha)
            if match_data:
                dia, mes_nome, ano = match_data.groups()
                mes = meses.get(mes_nome.capitalize(), "01")
                data_atual = f"{ano}-{mes}-{dia.zfill(2)}"
                continue

            # Standard format: Description R$ Amount R$ Balance
            regex_transacao = re.compile(r'(.+?)\s+(-?R\$\s*[\d.,]+)\s+(R\$\s*[\d.,]+)$')
            match_trans = regex_transacao.search(linha)

            if match_trans and data_atual:
                descricao_bruta = match_trans.group(1).strip()
                valor_str = match_trans.group(2).replace('R$', '').replace('.', '').replace(',', '.').replace(' ', '').strip()
                
                try:
                    valor = float(valor_str)
                    transacoes.append({
                        "date": data_atual,
                        "description": descricao_bruta,
                        "amount": valor,
                    })
                except ValueError:
                    continue
        return transacoes

    def parse_ofx(self, file_bytes):
        ofx = OfxParser.parse(io.BytesIO(file_bytes))
        transactions = []
        for account in ofx.accounts:
            for tx in account.statement.transactions:
                transactions.append({
                    "date": tx.date.strftime("%Y-%m-%d"),
                    "amount": float(tx.amount),
                    "description": tx.memo or tx.payee or "Transação s/ desc."
                })
        return transactions

    def parse_xlsx(self, file_bytes):
        df = pd.read_excel(io.BytesIO(file_bytes))
        # Expected columns: Data, Descrição, Valor
        # We try to be flexible
        transactions = []
        for _, row in df.iterrows():
            try:
                date_val = str(row.get('Data', row.get('date', '')))
                # Basic parsing if date is string dd/mm/yyyy
                if '/' in date_val:
                    d, m, y = date_val.split('/')
                    date_val = f"{y}-{m}-{d}"
                
                transactions.append({
                    "date": date_val,
                    "amount": float(row.get('Valor', row.get('amount', 0))),
                    "description": str(row.get('Descrição', row.get('description', 'Transação')))
                })
            except:
                continue
        return transactions

    def parse_file(self, file_bytes, filename):
        """Determines format and extracts transactions without saving."""
        ext = os.path.splitext(filename)[1].lower()
        
        if ext == '.pdf':
            data = self.parse_pdf(file_bytes)
        elif ext == '.ofx':
            data = self.parse_ofx(file_bytes)
        elif ext in ['.xlsx', '.xls']:
            data = self.parse_xlsx(file_bytes)
        else:
            raise Exception(f"Formato {ext} não suportado.")

        # Enrich with suggested categories and IDs for frontend selection
        for i, tx in enumerate(data):
            tx['id'] = f"tmp_{i}_{int(time.time())}"
            tx['category'] = self.categorizar_transacao(tx['description'])
            tx['type'] = "INCOME" if tx['amount'] > 0 else "EXPENSE"
            
        return data

    def save_transactions(self, transactions, user_id, account_id):
        """Saves a list of pre-parsed transactions to Supabase."""
        count = 0
        for tx in transactions:
            payload = {
                "user_id": user_id,
                "account_id": account_id if account_id else None,
                "description": tx['description'],
                "amount": abs(tx['amount']),
                "type": tx['type'],
                "date": tx['date'],
                "is_paid": True,
                "category": tx['category']
            }
            
            try:
                self.supabase.table("transactions").insert(payload).execute()
                count += 1
            except Exception as e:
                print(f"Error inserting: {e}")
        
        return count

    def process_and_save(self, file_bytes, filename, user_id, account_id):
        # Legacy method or for direct import if needed
        data = self.parse_file(file_bytes, filename)
        if not data: return 0
        return self.save_transactions(data, user_id, account_id)
