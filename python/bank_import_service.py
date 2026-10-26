import os
import re
import pandas as pd
import pypdf
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
            "Pagamentos": ["PAGAMENTO", "BOLETO", "CONSEC", "RECARGA"],
            "Encargos": ["JUROS", "IOF", "MULTA", "ENCARGOS", "ROTATIVO"]
        }
        for categoria, palavras_chave in categorias.items():
            for palavra in palavras_chave:
                if palavra in descricao:
                    return categoria
        return "Outros"

    def _parse_amount(self, amount_str):
        try:
            is_positive = '+' in amount_str
            val_clean = amount_str.replace('R$', '').replace(' ', '').replace('+', '').replace('-', '')
            if ',' in val_clean:
                val_clean = val_clean.replace('.', '').replace(',', '.')
            if val_clean.count('.') > 1:
                parts = val_clean.split('.')
                val_clean = "".join(parts[:-1]) + "." + parts[-1]
            valor = float(val_clean)
            return valor if is_positive else -valor
        except:
            return 0.0

    def parse_pdf(self, file_bytes, reference_date=None):
        texto = ""
        try:
            pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in pdf_reader.pages:
                text_extracted = page.extract_text()
                if text_extracted:
                    texto += text_extracted + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return []

        linhas = texto.split('\n')
        transacoes = []
        ref_year = str(datetime.datetime.now().year)
        if reference_date:
            try:
                ref_year = reference_date.split('-')[0]
            except: pass

        meses_abbr = {
            "jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05", "jun": "06",
            "jul": "07", "ago": "08", "set": "09", "out": "10", "nov": "11", "dez": "12",
            "janeiro": "01", "fevereiro": "02", "março": "03", "abril": "04", "maio": "05", "junho": "06",
            "julho": "07", "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
        }

        regex_date_card = re.compile(r'^(\d{1,2})\s+de\s+([a-zç]+)\.?\s*(?:de)?\s*(\d{4})?\s+', re.IGNORECASE)
        current_tx = None

        for linha in linhas:
            linha = linha.strip()
            if not linha or any(x in linha for x in ["Total", "Página", "Data Movimentação"]):
                continue

            match_valor = re.search(r'([+-]?\s*R\$\s*[\d.,]+)$', linha)
            match_d = regex_date_card.match(linha)
            
            if match_d:
                if current_tx:
                    transacoes.append(current_tx)
                
                d, m_nome, y = match_d.groups()
                mes = meses_abbr.get(m_nome.lower()[:3], "01")
                date_str = f"{y if y else ref_year}-{mes}-{d.zfill(2)}"
                description = linha[match_d.end():].strip()
                amount = None
                
                if match_valor:
                    val_str = match_valor.group(1)
                    description = description.replace(val_str, "").strip().rstrip("-").strip()
                    amount = self._parse_amount(val_str)
                
                current_tx = {"date": date_str, "description": description, "amount": amount}
            
            elif current_tx:
                if match_valor:
                    val_str = match_valor.group(1)
                    current_tx["amount"] = self._parse_amount(val_str)
                    extra_desc = linha.replace(val_str, "").strip().rstrip("-").strip()
                    if extra_desc:
                        current_tx["description"] += " " + extra_desc
                else:
                    if not any(x in linha for x in ["CARTÃO", "Vencimento", "Valor Total"]):
                        current_tx["description"] += " " + linha

        if current_tx and current_tx.get("amount") is not None:
            transacoes.append(current_tx)
            
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
        transactions = []
        for _, row in df.iterrows():
            try:
                date_val = str(row.get('Data', row.get('date', '')))
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

    def parse_file(self, file_bytes, filename, reference_date=None):
        ext = os.path.splitext(filename)[1].lower()
        if ext == '.pdf':
            data = self.parse_pdf(file_bytes, reference_date)
        elif ext == '.ofx':
            data = self.parse_ofx(file_bytes)
        elif ext in ['.xlsx', '.xls']:
            data = self.parse_xlsx(file_bytes)
        else:
            raise Exception(f"Formato {ext} não suportado.")

        enriched_data = []
        for i, tx in enumerate(data):
            if tx['description'] and tx['amount'] is not None:
                tx['id'] = f"tmp_{i}_{int(time.time())}"
                tx['category'] = self.categorizar_transacao(tx['description'])
                tx['type'] = "INCOME" if tx['amount'] > 0 else "EXPENSE"
                enriched_data.append(tx)
        return enriched_data

    def save_transactions(self, transactions, user_id, account_id, card_id=None):
        count = 0
        for tx in transactions:
            payload = {
                "user_id": user_id,
                "account_id": account_id if account_id else None,
                "card_id": card_id if card_id else None,
                "description": tx['description'],
                "amount": abs(tx['amount']),
                "type": tx['type'],
                "date": tx['date'],
                "is_paid": False if card_id else True,
                "category": tx['category']
            }
            try:
                self.supabase.table("transactions").insert(payload).execute()
                count += 1
            except Exception as e:
                print(f"Error inserting: {e}")
        return count

    def process_and_save(self, file_bytes, filename, user_id, account_id, card_id=None, reference_date=None):
        data = self.parse_file(file_bytes, filename, reference_date)
        if not data: return 0
        return self.save_transactions(data, user_id, account_id, card_id)