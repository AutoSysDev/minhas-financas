import re
import datetime

class BankImportService:
    def parse_pdf_simulation(self, text, reference_date=None):
        linhas = text.split('\n')
        transacoes = []
        
        # Default Year from reference_date or Current
        ref_year = str(datetime.datetime.now().year)
        if reference_date:
            try:
                parts = reference_date.split('-')
                if len(parts) >= 1:
                    ref_year = parts[0]
            except:
                pass

        # Regex Setup
        regex_date_start = re.compile(r'^(\d{2})/(\d{2})(?:/(\d{4}))?\s+(.*)$')
        # Updated Regex for "23 de dez. 2025" or "23 de dez 2025" or "23 de dezembro de 2025"
        regex_date_card = re.compile(r'^(\d{1,2})\s+de\s+([a-zç]+)\.?\s*(?:de)?\s*(\d{4})?\s+(.*)$', re.IGNORECASE)
        
        meses_abbr = {
            "jan": "01", "fev": "02", "mar": "03", "abr": "04", "mai": "05", "jun": "06",
            "jul": "07", "ago": "08", "set": "09", "out": "10", "nov": "11", "dez": "12",
            "janeiro": "01", "fevereiro": "02", "março": "03", "abril": "04", "maio": "05", "junho": "06",
            "julho": "07", "agosto": "08", "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12"
        }

        current_transaction = None

        for linha in linhas:
            linha = linha.strip()
            if not linha: continue

            # Try to match a new transaction line
            is_new_transaction = False
            
            # Robust Amount Regex at End of Line
            # Captures: Sign (opt), Space (opt), Currency (opt), Space (opt), Value
            # e.g., "+ R$ 202,19", "R$ 1,16", "- 100,00", "200,00"
            regex_amount_end = re.compile(r'([+-]?\s*(?:R\$)?\s*[\d.,]+)$')
            
            match_amount = regex_amount_end.search(linha)
            amount_str = None
            
            if match_amount:
                amount_str = match_amount.group(1)
            
            if amount_str:
                # Potential new transaction found
                # Check for Date at start
                date_str = None
                description = ""
                
                match_date = regex_date_start.match(linha)
                match_card = regex_date_card.match(linha)
                
                if match_date:
                    d, m, y, rest = match_date.groups()
                    use_year = y if y else ref_year
                    date_str = f"{use_year}-{m}-{d}"
                    
                    # Clean date and amount from line to get description
                    # Remove date
                    line_no_date = re.sub(r'^(\d{2})/(\d{2})(?:/(\d{4}))?\s+', '', linha)
                    # Remove amount (from end)
                    description = line_no_date[:line_no_date.rfind(amount_str)].strip()
                    # Remove trailing hyphens or "R$" that might be left over if regex didn't catch them
                    # e.g. "Beneficiary - " -> "Beneficiary"
                    description = re.sub(r'\s*[-]\s*$', '', description)
                    description = re.sub(r'\s*R\$\s*$', '', description)
                        
                elif match_card:
                    d, m_name, y, rest = match_card.groups()
                    mes = meses_abbr.get(m_name.lower()[:3], "01") # Handle full or abbr
                    use_year = y if y else ref_year
                    date_str = f"{use_year}-{mes}-{d.zfill(2)}"
                    
                    # Clean date and amount from line to get description
                    # Remove date
                    line_no_date = re.sub(r'^(\d{1,2})\s+de\s+([a-zç]+)\.?\s*(?:de)?\s*(\d{4})?\s+', '', linha, flags=re.IGNORECASE)
                    # Remove amount (from end)
                    description = line_no_date[:line_no_date.rfind(amount_str)].strip()
                     # Remove trailing hyphens or "R$" that might be left over if regex didn't catch them
                    description = re.sub(r'\s*[-]\s*$', '', description)
                    description = re.sub(r'\s*R\$\s*$', '', description)

                if date_str:
                    # It IS a new transaction
                    # 1. Save previous if exists
                    if current_transaction:
                        transacoes.append(current_transaction)
                    
                    # 2. Parse Amount Value
                    val_clean = amount_str.replace('R$', '').replace(' ', '').replace('+', '').replace('-', '')
                    if ',' in val_clean:
                         val_clean = val_clean.replace('.', '').replace(',', '.') # Assume BR format 1.000,00 -> 1000.00
                    
                    try:
                        valor = float(val_clean)
                    except:
                        valor = 0.0

                    is_positive = '+' in amount_str
                    # Explicit Rule: 
                    # + = Income (Positive)
                    # No sign or - = Expense (Negative)
                    
                    if is_positive:
                        final_amount = abs(valor)
                    else:
                        final_amount = -abs(valor)
                    
                    current_transaction = {
                        "date": date_str,
                        "description": description,
                        "amount": final_amount,
                        "category": "Outros", # Placeholder
                        "type": "INCOME" if final_amount > 0 else "EXPENSE"
                    }
                    is_new_transaction = True

            if not is_new_transaction:
                # If not a new transaction, check if we should append to current
                if current_transaction:
                    # Ignore "Total", "Pagina", etc.
                    if "Total" in linha or "Página" in linha or "Saldo" in linha:
                        pass
                    else:
                        # Append to description
                        # Rule: "Capture o nome completo... concatene-os"
                        current_transaction['description'] += " " + linha

        # Append last one
        if current_transaction:
            transacoes.append(current_transaction)
            
        return transacoes

# Test Data based on user rules and examples
text = """
23 de dez. 2025 PAGAMENTO ON LINE - + R$ 202,19
30 de dez. 2025 MULTA POR ATRASO - R$ 1,16
31 de dez. 2025 ENCARGOS ROTATIVO - R$ 7,89
31 de dez. 2025 PARCELAMENTO FATURA - R$ 198,01
Principal (R$ 62,34) + Juros (R$ 135,67)
Total CARTÃO 2306****7251 R$ 11,12
"""

service = BankImportService()
results = service.parse_pdf_simulation(text)
for r in results:
    print(r)
