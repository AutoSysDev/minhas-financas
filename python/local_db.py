"""SQLite local para Monely Finance (Opcao A)."""
import os
import sqlite3
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.environ.get("MONELY_DATA_DIR") or os.path.dirname(__file__), "monely.db")

LOCAL_USER_ID = "local-user-pggabrielone"
LOCAL_USERNAME = "pggabrielone"
LOCAL_EMAIL = "pggabrielone@local.app"
LOCAL_PASSWORD = "123485"

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  is_premium INTEGER DEFAULT 1,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  is_premium INTEGER DEFAULT 1,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  bank_name TEXT,
  type TEXT,
  balance REAL DEFAULT 0,
  color TEXT,
  logo_text TEXT,
  account_number TEXT,
  icon TEXT,
  default_card_id TEXT,
  category TEXT,
  is_default_for_debit INTEGER DEFAULT 0,
  show_in_summary INTEGER DEFAULT 1,
  ignore_in_total INTEGER DEFAULT 0,
  overdraft_limit REAL DEFAULT 0,
  overdraft_interest_rate REAL DEFAULT 0,
  overdraft_used REAL DEFAULT 0,
  notes TEXT
);
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  last_digits TEXT,
  brand TEXT,
  limit_amount REAL DEFAULT 0,
  current_invoice REAL DEFAULT 0,
  closing_day INTEGER,
  due_day INTEGER,
  status TEXT,
  image_url TEXT,
  color TEXT,
  account_id TEXT,
  linked_account_id TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  description TEXT,
  amount REAL DEFAULT 0,
  date TEXT,
  type TEXT,
  category TEXT,
  card_id TEXT,
  account_id TEXT,
  is_paid INTEGER DEFAULT 1,
  installments INTEGER,
  installment_number INTEGER,
  original_transaction_id TEXT
);
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  category TEXT,
  spent REAL DEFAULT 0,
  limit_amount REAL DEFAULT 0,
  period TEXT,
  color TEXT
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  current_amount REAL DEFAULT 0,
  target_amount REAL DEFAULT 0,
  deadline TEXT,
  icon TEXT,
  color_class TEXT,
  text_class TEXT,
  archived INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS goal_transactions (
  id TEXT PRIMARY KEY,
  goal_id TEXT,
  amount REAL DEFAULT 0,
  type TEXT,
  date TEXT,
  description TEXT,
  related_transaction_id TEXT
);
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  icon TEXT,
  color TEXT,
  type TEXT,
  is_default INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT,
  type TEXT,
  amount REAL DEFAULT 0,
  initial_amount REAL DEFAULT 0,
  quantity REAL DEFAULT 0,
  date TEXT,
  account_id TEXT,
  ticker TEXT,
  yield_rate REAL,
  yield_type TEXT,
  duration REAL,
  duration_unit TEXT,
  tax_type TEXT,
  maturity_date TEXT,
  projected_gross_yield REAL,
  projected_tax_amount REAL,
  projected_net_total REAL,
  projected_net_yield REAL
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  title TEXT,
  message TEXT,
  icon TEXT,
  color TEXT,
  action_url TEXT,
  priority TEXT,
  timestamp TEXT,
  created_at TEXT,
  is_read INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id TEXT PRIMARY KEY,
  bill_reminder_enabled INTEGER DEFAULT 1,
  bill_reminder_days INTEGER DEFAULT 3,
  budget_alert_enabled INTEGER DEFAULT 1,
  budget_alert_threshold REAL DEFAULT 80,
  weekly_summary_enabled INTEGER DEFAULT 0,
  weekly_summary_day INTEGER DEFAULT 1,
  savings_tips_enabled INTEGER DEFAULT 0,
  savings_tips_frequency TEXT DEFAULT 'weekly',
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  owner_user_id TEXT,
  shared_account_id TEXT,
  name TEXT,
  status TEXT DEFAULT 'open',
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  shopping_list_id TEXT,
  name TEXT,
  category TEXT,
  quantity REAL DEFAULT 1,
  unit TEXT,
  estimated_price REAL DEFAULT 0,
  actual_price REAL DEFAULT 0,
  is_checked INTEGER DEFAULT 0,
  assigned_user_id TEXT
);
CREATE TABLE IF NOT EXISTS shared_accounts (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS shared_account_members (
  id TEXT PRIMARY KEY,
  shared_account_id TEXT,
  user_id TEXT,
  role TEXT,
  created_at TEXT,
  email TEXT
);
CREATE TABLE IF NOT EXISTS shared_account_invites (
  id TEXT PRIMARY KEY,
  shared_account_id TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT
);
"""

ALLOWED_TABLES = {
    "users", "profiles", "accounts", "cards", "transactions", "budgets",
    "goals", "goal_transactions", "categories", "investments",
    "notifications", "notification_settings", "shopping_lists",
    "shopping_list_items", "shared_accounts", "shared_account_members",
    "shared_account_invites",
}


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.executescript(SCHEMA)
    now = datetime.utcnow().isoformat()
    conn.execute(
        "INSERT OR IGNORE INTO users (id, username, email, password, is_premium, created_at) VALUES (?,?,?,?,?,?)",
        (LOCAL_USER_ID, LOCAL_USERNAME, LOCAL_EMAIL, LOCAL_PASSWORD, 1, now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO profiles (user_id, is_premium, updated_at) VALUES (?,?,?)",
        (LOCAL_USER_ID, 1, now),
    )
    conn.execute(
        "INSERT OR IGNORE INTO notification_settings (user_id, updated_at) VALUES (?,?)",
        (LOCAL_USER_ID, now),
    )
    # Seed default categories (global, user_id NULL) if empty
    cur = conn.execute("SELECT COUNT(*) AS c FROM categories WHERE user_id IS NULL")
    if cur.fetchone()["c"] == 0:
        defaults = [
            ("Alimentação", "cat_food", "#f59e0b", "expense"),
            ("Transporte", "cat_car", "#3b82f6", "expense"),
            ("Saúde", "cat_health", "#ef4444", "expense"),
            ("Educação", "cat_education", "#8b5cf6", "expense"),
            ("Lazer", "cat_leisure", "#ec4899", "expense"),
            ("Moradia", "cat_home", "#10b981", "expense"),
            ("Supermercado", "cat_grocery", "#22c55e", "expense"),
            ("Salário", "cat_salary", "#16a34a", "income"),
            ("Freelance", "cat_freelance", "#3b82f6", "income"),
            ("Investimentos", "cat_invest", "#0ea5e9", "income"),
            ("Outros", "cat_others", "#6b7280", "expense"),
        ]
        for name, icon, color, typ in defaults:
            conn.execute(
                "INSERT INTO categories (id, user_id, name, icon, color, type, is_default) VALUES (?,?,?,?,?,?,?)",
                (str(uuid.uuid4()), None, name, icon, color, typ, 1),
            )
    conn.commit()
    conn.close()


def row_to_dict(row):
    return dict(row) if row is not None else None


def find_user(login):
    conn = get_conn()
    cur = conn.execute(
        "SELECT * FROM users WHERE username = ? OR email = ? OR id = ?",
        (login, login, login),
    )
    row = cur.fetchone()
    conn.close()
    return row_to_dict(row)


def verify_login(login, password):
    user = find_user(login)
    if not user:
        return None
    if str(user.get("password") or "") != str(password or ""):
        return None
    return user
