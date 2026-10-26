import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
from dotenv import load_dotenv
import local_db
import sqlite3
import uuid as uuid_lib
from datetime import datetime

load_dotenv()
local_db.init_db()

# Imports pesados (yfinance/pandas/langchain/supabase) sao lazy dentro das
# rotas que precisam deles, para o .exe desktop (PyInstaller) nao precisar
# embuti-los. Sem as libs instaladas, essas rotas retornam 503 com mensagem.
_import_service = None


def get_import_service():
    global _import_service
    if _import_service is None:
        from bank_import_service import BankImportService
        _import_service = BankImportService()
    return _import_service

app = Flask(__name__)
CORS(app)

MISSING_DEPS_MSG = "Recurso indisponível na versão desktop (dependências opcionais não instaladas)."

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Monely Finance Automation Server Running"})

@app.route('/search', methods=['GET'])
def search_ticker():
    try:
        import yfinance as yf
    except ImportError:
        return jsonify({"error": MISSING_DEPS_MSG}), 503
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
    try:
        from sync_investments import sync_investments
    except (ImportError, SystemExit, Exception) as e:
        print(f"Sync indisponível: {e}")
        return jsonify({"error": MISSING_DEPS_MSG}), 503
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
        svc = get_import_service()
    except Exception as e:
        print(f"Import service indisponível: {e}")
        return jsonify({"error": MISSING_DEPS_MSG}), 503
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        file_bytes = file.read()
        transactions = svc.parse_file(file_bytes, file.filename)
        
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
        svc = get_import_service()
    except Exception as e:
        print(f"Import service indisponível: {e}")
        return jsonify({"error": MISSING_DEPS_MSG}), 503
    try:
        data = request.json
        transactions = data.get('transactions')
        user_id = data.get('user_id')
        account_id = data.get('account_id')

        if not transactions or not user_id:
            return jsonify({"error": "Missing transactions or user_id"}), 400
        
        count = svc.save_transactions(transactions, user_id, account_id)
        
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
        svc = get_import_service()
    except Exception as e:
        print(f"Import service indisponível: {e}")
        return jsonify({"error": MISSING_DEPS_MSG}), 503
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id')
        account_id = request.form.get('account_id')
        card_id = request.form.get('card_id')
        reference_date = request.form.get('reference_date') # YYYY-MM

        if not user_id:
            return jsonify({"error": "Missing user_id"}), 400
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        file_bytes = file.read()
        count = svc.process_and_save(file_bytes, file.filename, user_id, account_id, card_id, reference_date)
        
        return jsonify({
            "status": "success", 
            "message": f"Successfully imported {count} transactions.",
            "count": count
        })
    except Exception as e:
        print(f"Import failed: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat_with_finance_ai():
    try:
        import pandas as pd
        from langchain_openai import ChatOpenAI
        from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
    except ImportError:
        return jsonify({"error": MISSING_DEPS_MSG}), 503
    try:
        data = request.json
        query = data.get('query')
        transactions = data.get('transactions', [])
        history = data.get('history', []) # No momento não estamos usando history no pandas agent simples, mas recebemos

        if not query:
            return jsonify({"error": "Missing query"}), 400
        
        if not transactions:
            return jsonify({"response": "Não tenho dados de transações para analisar no momento. Por favor, certifique-se de que há transações no período selecionado."})

        # Preparar DataFrame
        df = pd.DataFrame(transactions)
        
        # Ajustar tipos de dados para o agente
        if 'amount' in df.columns:
            df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')

        # Configurar modelo
        api_key = os.getenv("VITE_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return jsonify({"error": "OpenAI API Key not found"}), 500

        llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0, 
            api_key=api_key
        )

        # Preparar histórico para o agente
        history_text = ""
        for msg in history:
            role = "Usuário" if msg['role'] == 'user' else "Assistente"
            history_text += f"{role}: {msg['content']}\n"

        # Criar agente
        prefix = f"""Você é um assistente financeiro pessoal sênior da Monely Finance. 
        Você tem acesso a um DataFrame com as transações financeiras do usuário para o período selecionado.
        As colunas disponíveis são: date, description, amount, category, type (INCOME/EXPENSE).
        Sempre responda em Português do Brasil de forma amigável, profissional e objetiva.
        Ao falar de valores, use o formato R$ X.XXX,XX.
        Se o usuário perguntar algo que não pode ser respondido com os dados, explique educadamente.

        Histórico da conversa:
        {history_text}
        """
        
        agent = create_pandas_dataframe_agent(
            llm,
            df,
            verbose=True,
            agent_type="openai-functions",
            allow_dangerous_code=True, # Necessário para o pandas agent executar código
            prefix=prefix
        )

        # Executar query
        response = agent.run(query)
        
        return jsonify({
            "status": "success",
            "response": response
        })

    except Exception as e:
        print(f"Chat failed: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- Local DB API (SQLite, Opcao A) ----------

def _to_bool(v):
    if isinstance(v, bool):
        return 1 if v else 0
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return v
    s = str(v).lower()
    if s in ("true", "1"):
        return 1
    if s in ("false", "0"):
        return 0
    return v


def _table_cols(conn, table):
    try:
        cur = conn.execute(f"PRAGMA table_info({table})")
        return {r["name"] for r in cur.fetchall()}
    except Exception:
        return set()


def _apply_tx_side_effects(conn, tx):
    """Replica triggers de saldo/fatura."""
    try:
        ttype = str(tx.get("type") or "EXPENSE").upper()
        amount = float(tx.get("amount") or 0)
        is_paid = _to_bool(tx.get("is_paid"))
        if is_paid is None:
            is_paid = 1
        account_id = tx.get("account_id")
        card_id = tx.get("card_id")
        if account_id and int(is_paid) == 1 and not card_id:
            delta = amount if ttype == "INCOME" else -amount
            conn.execute("UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?", (delta, account_id))
        if card_id and ttype == "EXPENSE":
            # soma apenas nao-pagas? mantem simples: soma se nao paga
            if int(is_paid) == 0:
                conn.execute(
                    "UPDATE cards SET current_invoice = COALESCE(current_invoice,0) + ? WHERE id = ?",
                    (amount, card_id),
                )
    except Exception as e:
        print(f"side-effect failed: {e}")


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json or {}
    login = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""
    user = local_db.verify_login(login, password)
    if not user:
        return jsonify({"error": "Credenciais inválidas"}), 401
    return jsonify({
        "user": {
            "id": user["id"],
            "email": user["email"],
            "username": user["username"],
            "is_premium": bool(user.get("is_premium")),
        },
        "session": {
            "access_token": user["id"],
            "user_id": user["id"],
        },
    })


@app.route('/api/auth/signup', methods=['POST'])
def api_signup():
    data = request.json or {}
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    username = (data.get("username") or email.split("@")[0]).strip()
    if not email or not password:
        return jsonify({"error": "Email e senha obrigatórios"}), 400
    conn = local_db.get_conn()
    try:
        uid = str(uuid_lib.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO users (id, username, email, password, is_premium, created_at) VALUES (?,?,?,?,?,?)",
            (uid, username, email, password, 1, now),
        )
        conn.execute("INSERT OR IGNORE INTO profiles (user_id, is_premium, updated_at) VALUES (?,?,?)", (uid, 1, now))
        conn.commit()
        return jsonify({"user": {"id": uid, "email": email, "username": username, "is_premium": True}})
    except sqlite3.IntegrityError:
        return jsonify({"error": "Usuário já existe"}), 400
    finally:
        conn.close()


@app.route('/api/table/<table>', methods=['GET', 'POST', 'PATCH', 'DELETE'])
def api_table(table):
    if table not in local_db.ALLOWED_TABLES:
        return jsonify({"error": f"Tabela inválida: {table}"}), 400
    conn = local_db.get_conn()
    try:
        if request.method in ('PATCH', 'DELETE'):
            # bulk por filtros (ex: ?account_id.eq.X)
            data = request.json or {}
            filt = []
            params = []
            for key, vals in request.args.lists():
                if key in ("order", "range", "limit", "select", "or"):
                    continue
                if "." in key:
                    col, op = key.split(".", 1)
                    for v in vals:
                        if op == "eq":
                            filt.append(f"{col} = ?")
                            params.append(v)
                        elif op == "in":
                            items = [x.strip("() ") for x in v.strip("()").split(",") if x.strip()]
                            if items:
                                ph = ",".join(["?"] * len(items))
                                filt.append(f"{col} IN ({ph})")
                                params.extend(items)
                else:
                    for v in vals:
                        filt.append(f"{key} = ?")
                        params.append(v)
            if not filt:
                return jsonify({"error": "Filtro obrigatório"}), 400
            w = " AND ".join(filt)
            if request.method == 'DELETE':
                if table == "transactions":
                    cur = conn.execute(f"SELECT * FROM transactions WHERE {w}", params)
                    for old in [dict(r) for r in cur.fetchall()]:
                        try:
                            ttype = str(old.get("type") or "EXPENSE").upper()
                            amount = float(old.get("amount") or 0)
                            acc = old.get("account_id")
                            card = old.get("card_id")
                            paid = int(old.get("is_paid") or 0)
                            if acc and paid == 1 and not card:
                                delta = -amount if ttype == "INCOME" else amount
                                conn.execute("UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?", (delta, acc))
                            if card and ttype == "EXPENSE" and paid == 0:
                                conn.execute("UPDATE cards SET current_invoice = COALESCE(current_invoice,0) - ? WHERE id = ?", (amount, card))
                        except Exception as e:
                            print(f"revert failed: {e}")
                conn.execute(f"DELETE FROM {table} WHERE {w}", params)
                conn.commit()
                return jsonify({"ok": True})
            else:
                if not data:
                    return jsonify({"ok": True})
                valid = _table_cols(conn, table)
                data = {k: v for k, v in data.items() if not valid or k in valid}
                if not data:
                    return jsonify({"ok": True})
                sets = ",".join([f"{k} = ?" for k in data.keys()])
                conn.execute(f"UPDATE {table} SET {sets} WHERE {w}", list(data.values()) + params)
                conn.commit()
                return jsonify({"ok": True})
        if request.method == 'GET':
            where = []
            params = []
            # filtros eq/gte/lte/ilike/in/or
            for key, vals in request.args.lists():
                if key in ("order", "range", "limit", "select", "or"):
                    continue
                if "." in key:
                    col, op = key.split(".", 1)
                    for v in vals:
                        if op == "eq":
                            if v == "null":
                                where.append(f"{col} IS NULL")
                            else:
                                where.append(f"{col} = ?")
                                params.append(_to_bool(v) if col in ("is_paid", "is_read", "archived", "is_default") else v)
                        elif op == "gte":
                            where.append(f"{col} >= ?")
                            params.append(v)
                        elif op == "lte":
                            where.append(f"{col} <= ?")
                            params.append(v)
                        elif op == "ilike":
                            where.append(f"{col} LIKE ?")
                            params.append(v.replace("%", "%%") if False else v.replace("%", "%"))
                        elif op == "in":
                            items = [x.strip("() ") for x in v.strip("()").split(",") if x.strip()]
                            if items:
                                ph = ",".join(["?"] * len(items))
                                where.append(f"{col} IN ({ph})")
                                params.extend(items)
                else:
                    for v in vals:
                        where.append(f"{key} = ?")
                        params.append(v)
            # or= ex: user_id.eq.X,user_id.is.null
            or_expr = request.args.get("or")
            if or_expr:
                parts = []
                for token in or_expr.split(","):
                    if ".eq." in token:
                        c, _, vv = token.partition(".eq.")
                        parts.append(f"{c} = '{vv}'")
                    elif ".is.null" in token:
                        c = token.split(".")[0]
                        parts.append(f"{c} IS NULL")
                if parts:
                    where.append("(" + " OR ".join(parts) + ")")
            sql = f"SELECT * FROM {table}"
            if where:
                sql += " WHERE " + " AND ".join(where)
            order = request.args.get("order")
            if order:
                # formato col.asc|desc
                try:
                    col, direction = order.rsplit(".", 1)
                    direction = "DESC" if direction.lower().startswith("desc") else "ASC"
                    sql += f" ORDER BY {col} {direction}"
                except Exception:
                    pass
            limit = request.args.get("limit")
            rng = request.args.get("range")
            if rng:
                try:
                    a, b = rng.split("-")
                    offset = int(a)
                    count = int(b) - int(a) + 1
                    sql += f" LIMIT {count} OFFSET {offset}"
                except Exception:
                    pass
            elif limit:
                try:
                    sql += f" LIMIT {int(limit)}"
                except Exception:
                    pass
            cur = conn.execute(sql, params)
            rows = [dict(r) for r in cur.fetchall()]
            return jsonify(rows)
        else:
            payload = request.json
            rows_in = payload if isinstance(payload, list) else [payload]
            out = []
            for r in rows_in:
                r = dict(r or {})
                r.setdefault("id", str(uuid_lib.uuid4()))
                if table == "notifications" and not r.get("timestamp"):
                    r["timestamp"] = datetime.utcnow().isoformat()
                valid = _table_cols(conn, table)
                r = {k: v for k, v in r.items() if not valid or k in valid}
                if "id" in valid and not r.get("id"):
                    r["id"] = str(uuid_lib.uuid4())
                cols = list(r.keys())
                ph = ",".join(["?"] * len(cols))
                try:
                    conn.execute(f"INSERT INTO {table} ({','.join(cols)}) VALUES ({ph})", [r[c] for c in cols])
                except sqlite3.OperationalError as e:
                    # coluna inexistente: ignora extras
                    print(f"insert warn {table}: {e}")
                    conn.execute(f"INSERT INTO {table} (id) VALUES (?)", [r["id"]])
                if table == "transactions":
                    _apply_tx_side_effects(conn, r)
                out.append(r)
            conn.commit()
            return jsonify(out)
    finally:
        conn.close()


@app.route('/api/table/<table>/<row_id>', methods=['PATCH', 'DELETE'])
def api_row(table, row_id):
    if table not in local_db.ALLOWED_TABLES:
        return jsonify({"error": "Tabela inválida"}), 400
    conn = local_db.get_conn()
    try:
        if request.method == 'DELETE':
            if table == "transactions":
                cur = conn.execute("SELECT * FROM transactions WHERE id = ?", [row_id])
                old = cur.fetchone()
                if old:
                    old = dict(old)
                    # reverte efeito
                    try:
                        ttype = str(old.get("type") or "EXPENSE").upper()
                        amount = float(old.get("amount") or 0)
                        acc = old.get("account_id")
                        card = old.get("card_id")
                        paid = int(old.get("is_paid") or 0)
                        if acc and paid == 1 and not card:
                            delta = -amount if ttype == "INCOME" else amount
                            conn.execute("UPDATE accounts SET balance = COALESCE(balance,0) + ? WHERE id = ?", (delta, acc))
                        if card and ttype == "EXPENSE" and paid == 0:
                            conn.execute("UPDATE cards SET current_invoice = COALESCE(current_invoice,0) - ? WHERE id = ?", (amount, card))
                    except Exception as e:
                        print(f"revert failed: {e}")
            conn.execute(f"DELETE FROM {table} WHERE id = ?", [row_id])
            conn.commit()
            return jsonify({"ok": True})
        else:
            data = request.json or {}
            valid = _table_cols(conn, table)
            data = {k: v for k, v in data.items() if not valid or k in valid}
            if not data:
                return jsonify({"ok": True})
            # where extra via querystring (ex: eq account_id)
            filt = []
            params = []
            for key, vals in request.args.lists():
                if key in ("order", "range", "limit", "select", "or"):
                    continue
                if "." in key:
                    col, op = key.split(".", 1)
                    for v in vals:
                        if op == "eq":
                            filt.append(f"{col} = ?")
                            params.append(v)
                else:
                    for v in vals:
                        filt.append(f"{key} = ?")
                        params.append(v)
            sets = ",".join([f"{k} = ?" for k in data.keys()])
            if not sets:
                return jsonify({"ok": True})
            if filt:
                sql = f"UPDATE {table} SET {sets} WHERE (" + " AND ".join(filt) + f") OR id = '{row_id}'"
                # params: set values + filter values
                conn.execute(sql, list(data.values()) + params)
            else:
                conn.execute(f"UPDATE {table} SET {sets} WHERE id = ?", list(data.values()) + [row_id])
            conn.commit()
            return jsonify({"ok": True})
    finally:
        conn.close()


@app.route('/api/upsert/<table>', methods=['POST'])
def api_upsert(table):
    if table not in local_db.ALLOWED_TABLES:
        return jsonify({"error": "Tabela inválida"}), 400
    payload = request.json or {}
    conn = local_db.get_conn()
    try:
        payload = dict(payload)
        valid = _table_cols(conn, table)
        payload = {k: v for k, v in payload.items() if not valid or k in valid}
        if "id" in valid and not payload.get("id"):
            payload["id"] = str(uuid_lib.uuid4())
        if table in ("profiles", "notification_settings", "users") and payload.get("user_id"):
            conn.execute(f"DELETE FROM {table} WHERE user_id = ?", [payload["user_id"]])
        cols = list(payload.keys())
        ph = ",".join(["?"] * len(cols))
        conn.execute(f"INSERT OR REPLACE INTO {table} ({','.join(cols)}) VALUES ({ph})", [payload[c] for c in cols])
        conn.commit()
        return jsonify(payload)
    finally:
        conn.close()

if __name__ == '__main__':
    port = int(os.environ.get("MONELY_BACKEND_PORT") or 5000)
    print(f"Starting Monely Finance Local Server on port {port}...")
    app.run(port=port, debug=True, use_reloader=False)
