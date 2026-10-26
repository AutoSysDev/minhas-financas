# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['..\\python\\server.py'],
    pathex=['python'],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['pandas', 'numpy', 'yfinance', 'supabase', 'ofxparse', 'pypdf', 'openpyxl', 'pdfplumber', 'tabulate', 'langchain', 'langchain_openai', 'langchain_experimental', 'langchain_core', 'langchain_community', 'tiktoken', 'bank_import_service', 'sync_investments', 'processador_extrato', 'import_transactions', 'validate_rules'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='monely-server',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
