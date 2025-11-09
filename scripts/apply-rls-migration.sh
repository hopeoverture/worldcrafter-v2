#!/bin/bash

# =====================================================
# Apply RLS Migration to Supabase Database
# =====================================================
# This script applies the RLS policies from the SQL migration file
# to your Supabase database using the DIRECT_DATABASE_URL

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Applying RLS Migration${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create a .env file with DIRECT_DATABASE_URL"
  exit 1
fi

# Load environment variables
source .env

# Check if DIRECT_DATABASE_URL is set
if [ -z "$DIRECT_DATABASE_URL" ]; then
  echo -e "${RED}Error: DIRECT_DATABASE_URL not set in .env${NC}"
  exit 1
fi

# Apply migration
echo -e "${BLUE}Applying RLS migration...${NC}"
psql "$DIRECT_DATABASE_URL" -f prisma/migrations/sql/001_enable_rls.sql

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ RLS migration applied successfully!${NC}"
  echo ""
  echo -e "${BLUE}Verifying RLS is enabled...${NC}"
  psql "$DIRECT_DATABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';"
  echo ""
  echo -e "${BLUE}Listing RLS policies...${NC}"
  psql "$DIRECT_DATABASE_URL" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'users';"
else
  echo -e "${RED}✗ Failed to apply RLS migration${NC}"
  exit 1
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Migration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
