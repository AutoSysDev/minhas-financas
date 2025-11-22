import re
import os

# Páginas que precisam ser atualizadas
pages = [
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Transactions.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Statistics.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Invoice.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Goals.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Cards.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Calendar.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Budgets.tsx",
    r"c:\Users\Pedro\Downloads\minhas-finanças-pessoais\pages\Accounts.tsx",
]

for page_path in pages:
    if not os.path.exists(page_path):
        print(f"Arquivo não encontrado: {page_path}")
        continue
    
    with open(page_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Verificar se já tem o import
    has_private_value_import = "import { PrivateValue }" in content
    
    # Adicionar import se necessário
    if not has_private_value_import:
        # Encontrar a linha de import do Icon
        icon_import_match = re.search(r"(import.*from.*Icon.*\n)", content)
        if icon_import_match:
            icon_import_line = icon_import_match.group(1)
            new_import = icon_import_line + "import { PrivateValue } from '../components/PrivateValue';\n"
            content = content.replace(icon_import_line, new_import)
    
    # Substituir {formatCurrency(...)} por <PrivateValue>{formatCurrency(...)}</PrivateValue>
    # Padrão: {formatCurrency(qualquer coisa)}
    pattern = r'\{formatCurrency\(([^}]+)\)\}'
    replacement = r'<PrivateValue>{formatCurrency(\1)}</PrivateValue>'
    
    content = re.sub(pattern, replacement, content)
    
    # Salvar arquivo
    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✓ Atualizado: {os.path.basename(page_path)}")

print("\n✅ Todos os arquivos foram atualizados com PrivateValue!")
