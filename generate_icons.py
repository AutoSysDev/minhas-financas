from PIL import Image
import os

# Caminho da imagem original
source_image = "assets/icon.png"
adaptive_image = "assets/icon.png"  # Usar a mesma imagem por padrão se não houver específica

# Base path para os recursos Android
android_res = r"android/app/src/main/res"

# Tamanhos para mipmap (ícones do launcher)
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

def create_icon_with_background(logo_path, size, output_path):
    """Cria um ícone com fundo branco e logo centralizada"""
    # Criar imagem de fundo branco
    icon = Image.new('RGB', (size, size), 'white')
    
    # Abrir logo
    logo = Image.open(logo_path)
    
    # Converter para RGBA se necessário
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Redimensionar logo mantendo proporção (80% do tamanho do ícone)
    logo_size = int(size * 0.8)
    logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Calcular posição para centralizar
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    
    # Colar logo no centro
    icon.paste(logo, (x, y), logo if logo.mode == 'RGBA' else None)
    
    # Salvar
    icon.save(output_path, 'PNG')
    print(f"✓ Criado: {output_path}")

def create_adaptive_icon(logo_path, size, output_path):
    """Cria foreground para adaptive icon (transparente)"""
    # Abrir logo
    logo = Image.open(logo_path)
    
    # Converter para RGBA
    if logo.mode != 'RGBA':
        logo = logo.convert('RGBA')
    
    # Criar imagem transparente
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Redimensionar logo (70% do tamanho para safe zone)
    logo_size = int(size * 0.7)
    logo.thumbnail((logo_size, logo_size), Image.Resampling.LANCZOS)
    
    # Centralizar
    x = (size - logo.width) // 2
    y = (size - logo.height) // 2
    
    # Colar logo
    icon.paste(logo, (x, y), logo)
    
    # Salvar
    icon.save(output_path, 'PNG')
    print(f"✓ Criado: {output_path}")

# Criar ícones regulares (mipmap)
print("\n📱 Gerando ícones do launcher...")
for folder, size in mipmap_sizes.items():
    # ic_launcher.png
    output_path = os.path.join(android_res, folder, "ic_launcher.png")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    create_icon_with_background(source_image, size, output_path)
    
    # ic_launcher_round.png
    output_path_round = os.path.join(android_res, folder, "ic_launcher_round.png")
    create_icon_with_background(source_image, size, output_path_round)

# Criar adaptive icons (foreground)
print("\n🎨 Gerando adaptive icons...")
for folder, size in mipmap_sizes.items():
    output_path = os.path.join(android_res, folder, "ic_launcher_foreground.png")
    create_adaptive_icon(adaptive_image, size, output_path)

# Criar favicon para web
print("\n🌐 Gerando favicon...")
favicon_sizes = [16, 32, 192, 512]
for size in favicon_sizes:
    output_path = f"public/favicon-{size}x{size}.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    create_icon_with_background(source_image, size, output_path)

# Criar favicon.ico (16x16 e 32x32)
print("\n📄 Gerando favicon.ico...")
img16 = Image.open("public/favicon-16x16.png")
img32 = Image.open("public/favicon-32x32.png")
img16.save("public/favicon.ico", format='ICO', sizes=[(16, 16), (32, 32)])
print("✓ Criado: public/favicon.ico")

print("\n✅ Todos os ícones foram gerados com sucesso!")
