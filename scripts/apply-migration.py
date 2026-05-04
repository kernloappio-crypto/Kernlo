#!/usr/bin/env python3
import os
import sys
import urllib.request
import json
from pathlib import Path

# Read environment variables
supabase_url = "https://tyzvhpyrghqayuqchwra.supabase.co"
supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5enZocHlyZ2hxYXl1cWNod3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTYzMDEsImV4cCI6MjA5MDk3MjMwMX0.Nf84YSxW5lHCzT2SIbfPH2TuvHwGlrLrY1AMNDZXYf4"

# Read the migration SQL
migration_path = Path(__file__).parent.parent / "supabase" / "migrations" / "014_add_sms_notifications.sql"

with open(migration_path, 'r') as f:
    migration_sql = f.read()

print("Migration SQL:")
print("=" * 80)
print(migration_sql)
print("=" * 80)
print("\n⚠️  To apply this migration to production Supabase:")
print("1. Go to https://app.supabase.com")
print("2. Select your Kernlo project")
print("3. Go to SQL Editor → New Query")
print("4. Copy and paste the SQL above")
print("5. Click RUN")
print("\nNote: The migration uses IF NOT EXISTS to prevent errors if columns already exist.")
