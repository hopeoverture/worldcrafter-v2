#!/usr/bin/env python3
"""
Database Sync Script for WorldCrafter

Syncs Prisma schema to development and test databases.

Usage:
    python sync_databases.py
    python sync_databases.py --test-only
    python sync_databases.py --dev-only
"""

import subprocess
import sys
from pathlib import Path


def run_command(cmd: list, description: str, env=None) -> bool:
    """Run a command and return success status"""
    print(f"\n{description}...")
    print(f"Running: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True,
            env=env
        )

        if result.stdout:
            print(result.stdout)

        print(f"✓ {description} completed successfully")
        return True

    except subprocess.CalledProcessError as e:
        print(f"✗ {description} failed")
        print(f"Error: {e.stderr}")
        return False


def sync_dev_database() -> bool:
    """Sync schema to development database"""
    print("\n" + "=" * 60)
    print("Syncing Development Database")
    print("=" * 60)

    # Check if we should use migrate or push
    use_migrate = input("\nUse migrations (Y) or direct push (n)? [Y/n]: ").strip().lower()

    if use_migrate in ['', 'y', 'yes']:
        # Create migration
        migration_name = input("Migration name: ").strip()

        if not migration_name:
            print("Error: Migration name required")
            return False

        cmd = ["npx", "prisma", "migrate", "dev", "--name", migration_name]
        return run_command(cmd, "Creating and applying migration")
    else:
        # Direct push
        cmd = ["npx", "prisma", "db", "push"]
        confirm = input("This will push schema directly (no migration file). Continue? [y/N]: ").strip().lower()

        if confirm not in ['y', 'yes']:
            print("Cancelled")
            return False

        return run_command(cmd, "Pushing schema to dev database")


def sync_test_database() -> bool:
    """Sync schema to test database"""
    print("\n" + "=" * 60)
    print("Syncing Test Database")
    print("=" * 60)

    # Check if .env.test exists
    env_test = Path(".env.test")

    if not env_test.exists():
        print("\nWarning: .env.test not found")
        print("Create .env.test with test database credentials")
        return False

    # Check if we should use npm script or direct command
    use_npm = Path("package.json").exists()

    if use_npm:
        # Use npm script (recommended)
        print("\nUsing npm script to sync test database...")

        seed = input("Seed test data after sync? [y/N]: ").strip().lower()

        if seed in ['y', 'yes']:
            cmd = ["npm", "run", "db:test:sync", "--", "--seed"]
        else:
            cmd = ["npm", "run", "db:test:sync"]

        return run_command(cmd, "Syncing test database")
    else:
        # Direct Prisma command
        print("\nUsing direct Prisma command...")

        # Set environment to use .env.test
        import os
        from dotenv import load_dotenv

        # Load test environment
        load_dotenv(".env.test")

        cmd = ["npx", "prisma", "db", "push"]
        return run_command(cmd, "Pushing schema to test database")


def main():
    print("=" * 60)
    print("WorldCrafter Database Sync")
    print("=" * 60)

    # Parse command line arguments
    args = sys.argv[1:]

    sync_dev = "--test-only" not in args
    sync_test = "--dev-only" not in args

    success = True

    # Sync development database
    if sync_dev:
        if not sync_dev_database():
            success = False
            print("\nDevelopment database sync failed")

            if sync_test:
                continue_choice = input("\nContinue with test database sync? [y/N]: ").strip().lower()
                if continue_choice not in ['y', 'yes']:
                    sys.exit(1)

    # Sync test database
    if sync_test:
        if not sync_test_database():
            success = False
            print("\nTest database sync failed")

    # Summary
    print("\n" + "=" * 60)
    if success:
        print("✓ All databases synced successfully")
    else:
        print("✗ Some database syncs failed")
    print("=" * 60)

    # Next steps
    if success:
        print("\nNext steps:")
        print("1. Verify schema in Prisma Studio: npx prisma studio")
        print("2. Run tests: npm test")
        print("3. Check application: npm run dev")

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nSync cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nError: {e}")
        sys.exit(1)
