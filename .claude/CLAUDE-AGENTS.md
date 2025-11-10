# WorldCrafter Agents Reference

**Agents analyze existing code** - use for reviews, audits, and quality checks.

## Quality & Review Agents

### codebase-review-architect

**Use after**: Completing features, before PRs, for security-critical code
**Does**: Architectural review, validates WorldCrafter patterns (RLS, auth, Server Actions), identifies security issues

### project-health-auditor

**Use**: Weekly/bi-weekly, before releases, when tech debt suspected
**Does**: Codebase health assessment, technical debt inventory, coverage analysis, dependency auditing

### test-coverage-auditor

**Use**: After features, when coverage <80%, before releases
**Does**: Analyzes coverage gaps, validates testing pyramid, ensures critical paths tested

## Database & Performance Agents

### rls-policy-validator

**Use**: IMMEDIATELY after adding tables with user data, before production deploys
**Does**: Validates RLS policies, identifies security gaps, generates migration fixes
**CRITICAL**: Run on EVERY schema change

### migration-reviewer

**Use**: BEFORE applying any migration (especially production)
**Does**: Reviews migrations for safety, checks RLS requirements, validates backward compatibility

### query-performance-analyzer

**Use**: After adding queries, slow pages, schema changes, monthly audits
**Does**: Analyzes for N+1 problems, missing indexes, over-fetching, provides optimizations

### performance-test-suite

**Use**: Before launches, after optimizations, for heavy features, monthly load tests
**Does**: Creates load tests, stress tests, benchmarks, identifies bottlenecks

## When to Use What

**After schema changes**: `migration-reviewer` → `rls-policy-validator` → sync test DB
**After feature complete**: `test-coverage-auditor` → `codebase-review-architect`
**Performance issues**: `query-performance-analyzer` → fix → `performance-test-suite`
**Before release**: `project-health-auditor` + `test-coverage-auditor`
