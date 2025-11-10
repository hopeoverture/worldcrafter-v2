#!/usr/bin/env python3
"""
RLS Policy Generator for WorldCrafter

Generates Row-Level Security policies for database tables.

Usage:
    python generate_rls.py <table_name>
    python generate_rls.py blog_posts
"""

import sys
from pathlib import Path


RLS_TEMPLATES = {
    "read_own": """-- Users can read own data
CREATE POLICY "Users can read own {display_name}"
  ON public.{table_name}
  FOR SELECT
  USING (auth.uid() = user_id);""",

    "update_own": """-- Users can update own data
CREATE POLICY "Users can update own {display_name}"
  ON public.{table_name}
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);""",

    "insert_own": """-- Users can insert own data
CREATE POLICY "Users can insert own {display_name}"
  ON public.{table_name}
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);""",

    "delete_own": """-- Users can delete own data
CREATE POLICY "Users can delete own {display_name}"
  ON public.{table_name}
  FOR DELETE
  USING (auth.uid() = user_id);""",

    "public_read": """-- Anyone can read all data
CREATE POLICY "Anyone can read {display_name}"
  ON public.{table_name}
  FOR SELECT
  USING (true);""",

    "authenticated_write": """-- Authenticated users can create
CREATE POLICY "Authenticated users can create {display_name}"
  ON public.{table_name}
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);""",

    "admin_all": """-- Admins can do anything
CREATE POLICY "Admins can manage {display_name}"
  ON public.{table_name}
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'ADMIN'
    )
  );""",

    "public_read_published": """-- Anyone can read published content
CREATE POLICY "Anyone can read published {display_name}"
  ON public.{table_name}
  FOR SELECT
  USING (published = true);

-- Authors can read own drafts
CREATE POLICY "Authors can read own drafts"
  ON public.{table_name}
  FOR SELECT
  USING (auth.uid() = author_id AND published = false);""",
}


POLICY_PATTERNS = {
    "1": {
        "name": "Users can read/write own data",
        "description": "User profiles, settings, private data",
        "policies": ["read_own", "update_own", "insert_own", "delete_own"],
        "requires": ["user_id"]
    },
    "2": {
        "name": "Public read, owner write",
        "description": "Blog posts, comments, public content",
        "policies": ["public_read", "authenticated_write", "update_own", "delete_own"],
        "requires": ["user_id or author_id"]
    },
    "3": {
        "name": "Public read published, owner all",
        "description": "Content with draft/published states",
        "policies": ["public_read_published", "authenticated_write", "update_own", "delete_own"],
        "requires": ["author_id", "published"]
    },
    "4": {
        "name": "Admin only",
        "description": "System tables, admin panels",
        "policies": ["admin_all"],
        "requires": []
    },
    "5": {
        "name": "Custom",
        "description": "Select individual policies",
        "policies": "custom",
        "requires": []
    }
}


def display_menu():
    """Display RLS pattern menu"""
    print("\nAvailable RLS Patterns:")
    print("=" * 60)

    for key, pattern in POLICY_PATTERNS.items():
        print(f"{key}. {pattern['name']}")
        print(f"   {pattern['description']}")
        if pattern['requires']:
            print(f"   Requires: {', '.join(pattern['requires'])}")
        print()


def get_pattern_choice() -> str:
    """Get user's pattern choice"""
    choice = input("Select pattern (1-5): ").strip()

    if choice not in POLICY_PATTERNS:
        print("Invalid choice. Using pattern 1 (Users can read/write own data)")
        return "1"

    return choice


def get_custom_policies() -> list:
    """Let user select custom policies"""
    print("\nAvailable Policy Templates:")
    print("=" * 60)

    templates = list(RLS_TEMPLATES.keys())

    for i, template in enumerate(templates, 1):
        print(f"{i}. {template}")

    print("\nEnter policy numbers separated by commas (e.g., 1,2,3)")
    selection = input("Policies: ").strip()

    selected_policies = []
    for num in selection.split(','):
        try:
            idx = int(num.strip()) - 1
            if 0 <= idx < len(templates):
                selected_policies.append(templates[idx])
        except ValueError:
            continue

    return selected_policies


def get_user_id_field(table_name: str) -> str:
    """Determine the user ID field name"""
    print(f"\nWhat field links to the user?")
    print("1. user_id")
    print("2. author_id")
    print("3. owner_id")
    print("4. Custom")

    choice = input("Choice (1-4): ").strip()

    if choice == "2":
        return "author_id"
    elif choice == "3":
        return "owner_id"
    elif choice == "4":
        return input("Enter field name: ").strip()
    else:
        return "user_id"


def generate_rls_sql(table_name: str, policies: list, user_field: str = "user_id") -> str:
    """Generate RLS SQL for table"""
    display_name = table_name.replace('_', ' ')

    sql_lines = [
        f"-- Row-Level Security Policies for {table_name}",
        f"-- Generated by WorldCrafter RLS Generator",
        "",
        f"-- Enable RLS",
        f"ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;",
        ""
    ]

    # Generate policies
    for policy_key in policies:
        if policy_key in RLS_TEMPLATES:
            policy_sql = RLS_TEMPLATES[policy_key].format(
                table_name=table_name,
                display_name=display_name
            )

            # Replace user_id with actual field name
            if user_field != "user_id":
                policy_sql = policy_sql.replace("user_id", user_field)

            sql_lines.append(policy_sql)
            sql_lines.append("")

    return "\n".join(sql_lines)


def save_sql_file(table_name: str, sql: str) -> Path:
    """Save SQL to migration file"""
    # Try to find migrations directory
    migrations_dir = Path("prisma/migrations/sql")
    migrations_dir.mkdir(parents=True, exist_ok=True)

    filename = f"rls_{table_name}.sql"
    filepath = migrations_dir / filename

    with open(filepath, 'w') as f:
        f.write(sql)

    return filepath


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_rls.py <table_name>")
        print("Example: python generate_rls.py blog_posts")
        sys.exit(1)

    table_name = sys.argv[1]

    print("=" * 60)
    print(f"RLS Policy Generator for: {table_name}")
    print("=" * 60)

    # Display menu and get choice
    display_menu()
    pattern_choice = get_pattern_choice()

    pattern = POLICY_PATTERNS[pattern_choice]

    # Get policies to generate
    if pattern["policies"] == "custom":
        policies = get_custom_policies()
    else:
        policies = pattern["policies"]

    if not policies:
        print("No policies selected. Exiting.")
        return

    # Get user field name if needed
    user_field = "user_id"
    if any(req in ["user_id", "author_id", "owner_id"] for req in pattern.get("requires", [])):
        user_field = get_user_id_field(table_name)

    # Generate SQL
    sql = generate_rls_sql(table_name, policies, user_field)

    # Display generated SQL
    print("\n" + "=" * 60)
    print("Generated RLS Policies:")
    print("=" * 60)
    print(sql)
    print("=" * 60)

    # Ask if user wants to save
    save_choice = input("\nSave to file? (Y/n): ").strip().lower()

    if save_choice in ['', 'y', 'yes']:
        filepath = save_sql_file(table_name, sql)
        print(f"\nRLS policies saved to: {filepath}")

        print("\nNext steps:")
        print(f"1. Review the policies in {filepath}")
        print(f"2. Apply policies: npm run db:rls")
        print(f"3. Test with different users to verify access control")
        print(f"4. Add integration tests for RLS policies")
    else:
        print("\nCopy the SQL above and apply manually")


if __name__ == "__main__":
    main()
