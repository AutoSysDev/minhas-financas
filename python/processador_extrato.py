import re
import pandas as pd
import PyPDF2
import sys
import os

def extrair_texto_pdf(caminho_pdf):
    """Extrai o texto de todas as páginas de um arquivo PDF."""
    texto = ""
    try:
        with open(caminho_pdf, "rb") as f:
            leitor = PyPDF2.PdfReader(f)
            for pagina in leitor.pages:
                texto += pagina.extract_text() + "\n"
    except FileNotFoundError:
        print(f"Erro: Arquivo não encontrado em '{caminho_pdf}'. Verifique o caminho e a permissão de acesso.")
        return None
    except Exception as e:
        print(f"Erro inesperado ao ler o PDF: {e}")
        return None
    return texto

def categorizar_transacao(descricao):
    """Categoriza uma transação com base em palavras-chave na descrição."""
    descricao = descricao.upper()
    categorias = {
        "Alimentação": ["LANCHES", "PIZZA", "HOTDOG", "SUSHI", "RESTAURANTE", "CONVENIENCIA", "ARCOS DOURADOS", "BOMFRIGO"],
        "Transporte/Combustível": ["POSTOS", "COMBUSTIVEIS", "AUTO PECAS", "AUTO SERVICE", "GM PRIME"],
        "Serviços/Assinaturas": ["APPLE.COM", "LAVATERIA", "CLARO"],
        "Lazer/Outros": ["GELO E GELA"],
        "Transferências/Pix": ["PIX RECEBIDO", "PIX ENVIADO"],
        "Pagamentos": ["PAGAMENTO FATURA"]
    }
    for categoria, palavras_chave in categorias.items():
        for palavra in palavras_chave:
            if palavra in descricao:
                return categoria
    return "Outros"

def processar_extrato(texto):
    """Processa o texto extraído para encontrar e estruturar as transações."""
    linhas = texto.split('\n')
    transacoes = []
    data_atual = None
    
    # Corrected Regex for Date: "01 de Janeiro de 2026"
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
            mes = meses.get(mes_nome, "01")
            data_atual = f"{dia.zfill(2)}/{mes}/{ano}"
            continue

        # Corrected Regex for Transaction: "Description R$ 100,00 R$ 100,00"
        # Assuming format: Description | Amount | Balance (ignoring balance)
        regex_transacao = re.compile(r'(.+?)\s+(-?R\$\s*[\d.,]+)\s+(R\$\s*[\d.,]+)$')
        
        match_trans = regex_transacao.search(linha)

        if match_trans and data_atual:
            descricao_bruta = match_trans.group(1).strip()
            valor_str = match_trans.group(2).replace('R$', '').replace('.', '').replace(',', '.').replace(' ', '').strip()
            
            try:
                valor = float(valor_str)
                categoria = categorizar_transacao(descricao_bruta)
                transacoes.append({
                    "Data": data_atual,
                    "Descrição": descricao_bruta,
                    "Valor": valor,
                    "Categoria": categoria
                })
            except ValueError:
                continue
    return pd.DataFrame(transacoes)

def main():
    """Função principal para orquestrar a execução."""
    # Adjusted path for Windows environment relative to workspace root
    caminho_pdf_entrada = os.path.join(os.getcwd(), "Extrato-01-01-2026-a-13-01-2026-PDF.pdf")
    # Also check if user uploaded to uploads folder
    if not os.path.exists(caminho_pdf_entrada):
         # Try looking in 'uploads' or root
         pass

    print(f"Iniciando processamento do arquivo: {caminho_pdf_entrada}")
    texto_extraido = extrair_texto_pdf(caminho_pdf_entrada)
    
    if texto_extraido:
        print("Texto extraído com sucesso. Processando transações...")
        df = processar_extrato(texto_extraido)
        
        if not df.empty:
            caminho_csv_saida = os.path.join(os.getcwd(), "extrato_categorizado.csv")
            caminho_xlsx_saida = os.path.join(os.getcwd(), "extrato_categorizado.xlsx")

            df.to_csv(caminho_csv_saida, index=False, encoding='utf-8-sig')
            df.to_excel(caminho_xlsx_saida, index=False)
            
            print(f"\nProcessamento concluído! {len(df)} transações encontradas.")
            print(f"Resultados salvos em '{caminho_csv_saida}' e '{caminho_xlsx_saida}'.")
            print("\nResumo por Categoria:")
            resumo = df.groupby('Categoria')['Valor'].sum().reset_index()
            print(resumo)
        else:
            print("Nenhuma transação foi encontrada no documento. Verifique o conteúdo do PDF e se o regex corresponde ao formato.")
    else:
        print("Falha na extração do texto do PDF. O arquivo existe?")
        sys.exit(1)

if __name__ == "__main__":
    main()
