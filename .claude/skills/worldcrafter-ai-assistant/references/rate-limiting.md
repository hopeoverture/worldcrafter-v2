# Rate Limiting Guide

Implementation guide for AI feature rate limiting using Upstash Redis.

## Overview

WorldCrafter implements a two-tier rate limiting system:

- **Free Tier:** 5 AI generations per hour
- **Premium Tier:** 100 AI generations per hour (effectively unlimited)

Rate limits reset on a sliding window basis, ensuring fair usage while preventing abuse.

---

## Architecture

### Components

1. **Upstash Redis:** Distributed rate limit storage
2. **@upstash/ratelimit:** Sliding window algorithm
3. **Prisma AiQuota:** User quota tracking and persistence
4. **Middleware:** Rate limit checks before AI operations

### Flow

```
User Request
    ↓
Rate Limit Check (Upstash)
    ↓
├─ Allowed → Increment Quota → Execute AI Operation → Update Usage
└─ Blocked → Return 429 Error
```

---

## Setup

### 1. Upstash Redis Setup

1. Create account at https://upstash.com
2. Create Redis database (free tier sufficient for most use cases)
3. Copy connection details to `.env`:

```bash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 2. Install Dependencies

```bash
npm install @upstash/redis @upstash/ratelimit
```

### 3. Database Schema

Already included in `prisma/schema.prisma`:

```prisma
model AiQuota {
  id                String   @id @default(cuid())
  userId            String   @unique @map("user_id")
  tier              String   @default("free") // "free" or "premium"
  generationsUsed   Int      @default(0) @map("generations_used")
  generationsLimit  Int      @default(5) @map("generations_limit")
  resetAt           DateTime @map("reset_at")
  totalTokensUsed   BigInt   @default(0) @map("total_tokens_used")
  totalCost         Decimal  @default(0) @db.Decimal(10, 2) @map("total_cost")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("ai_quotas")
}
```

---

## Implementation

### Rate Limit Service

```typescript
// src/lib/ai/rate-limit.ts

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { prisma } from "@/lib/prisma";

// Initialize Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Free tier: 5 generations per hour
const freeTierRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "@worldcrafter/ai-free",
});

// Premium tier: 100 generations per hour
const premiumTierRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  analytics: true,
  prefix: "@worldcrafter/ai-premium",
});

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // 1. Get or create user quota
  let quota = await prisma.aiQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    quota = await prisma.aiQuota.create({
      data: {
        userId,
        tier: "free",
        generationsUsed: 0,
        generationsLimit: 5,
        resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });
  }

  // 2. Check if quota needs reset (hourly)
  if (new Date() > quota.resetAt) {
    quota = await prisma.aiQuota.update({
      where: { userId },
      data: {
        generationsUsed: 0,
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }

  // 3. Apply rate limit via Upstash
  const ratelimit = quota.tier === "premium"
    ? premiumTierRatelimit
    : freeTierRatelimit;

  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  // 4. Update quota if allowed
  if (success) {
    await prisma.aiQuota.update({
      where: { userId },
      data: {
        generationsUsed: { increment: 1 },
      },
    });
  }

  return {
    allowed: success,
    limit,
    remaining,
    reset: new Date(reset),
  };
}

export async function getQuotaStatus(userId: string) {
  const quota = await prisma.aiQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    return {
      tier: "free" as const,
      used: 0,
      limit: 5,
      remaining: 5,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
      totalTokens: 0,
      totalCost: 0,
    };
  }

  return {
    tier: quota.tier as "free" | "premium",
    used: quota.generationsUsed,
    limit: quota.generationsLimit,
    remaining: quota.generationsLimit - quota.generationsUsed,
    resetAt: quota.resetAt,
    totalTokens: Number(quota.totalTokensUsed),
    totalCost: Number(quota.totalCost),
  };
}

export async function upgradeToPremium(userId: string) {
  return await prisma.aiQuota.update({
    where: { userId },
    data: {
      tier: "premium",
      generationsLimit: 100,
    },
  });
}

export async function downgradToFree(userId: string) {
  return await prisma.aiQuota.update({
    where: { userId },
    data: {
      tier: "free",
      generationsLimit: 5,
      generationsUsed: 0, // Reset usage on downgrade
    },
  });
}
```

### Server Action Integration

```typescript
// src/app/worlds/[worldId]/actions/ai-generate.ts

"use server";

import { checkRateLimit } from "@/lib/ai/rate-limit";
import { generateEntityWithOpenAI } from "@/lib/ai/generation-service";

export async function generateEntity(
  worldId: string,
  entityType: string,
  options: any
) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Rate limit check
    const rateLimit = await checkRateLimit(user.id);

    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit exceeded. ${rateLimit.remaining} generations remaining. Resets at ${rateLimit.reset.toLocaleTimeString()}.`,
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
      };
    }

    // 3. Generate entity
    const result = await generateEntityWithOpenAI(
      worldId,
      user.id,
      entityType,
      options,
      schema
    );

    return {
      success: true,
      data: result,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining - 1, // Account for this generation
        reset: rateLimit.reset,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}
```

### API Route Integration

```typescript
// src/app/api/ai/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Get user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimit = await checkRateLimit(user.id);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          rateLimit: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset: rateLimit.reset.toISOString(),
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimit.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
            "X-RateLimit-Reset": rateLimit.reset.getTime().toString(),
            "Retry-After": Math.ceil(
              (rateLimit.reset.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Process request...

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## Client-Side Integration

### React Hook

```typescript
// src/hooks/use-ai-quota.ts

import { useState, useEffect } from "react";

interface QuotaStatus {
  tier: "free" | "premium";
  used: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  totalTokens: number;
  totalCost: number;
}

export function useAiQuota() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    try {
      const response = await fetch("/api/ai/quota");
      const data = await response.json();
      setQuota({
        ...data,
        resetAt: new Date(data.resetAt),
      });
    } catch (error) {
      console.error("Failed to fetch quota:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  return {
    quota,
    loading,
    refresh: fetchQuota,
    isExceeded: quota ? quota.remaining <= 0 : false,
    isPremium: quota?.tier === "premium",
  };
}
```

### Quota Display Component

```typescript
// src/components/ai/QuotaDisplay.tsx

"use client";

import { useAiQuota } from "@/hooks/use-ai-quota";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown } from "lucide-react";

export function QuotaDisplay() {
  const { quota, loading, isExceeded, isPremium } = useAiQuota();

  if (loading || !quota) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  const percentage = (quota.used / quota.limit) * 100;
  const timeUntilReset = Math.max(
    0,
    Math.ceil((quota.resetAt.getTime() - Date.now()) / 1000 / 60)
  );

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPremium ? (
            <>
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Premium</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">Free Tier</span>
            </>
          )}
        </div>
        <Badge variant={isExceeded ? "destructive" : "secondary"}>
          {quota.remaining}/{quota.limit} remaining
        </Badge>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{quota.used} generations used</span>
        <span>Resets in {timeUntilReset}m</span>
      </div>

      {isExceeded && (
        <p className="text-sm text-red-600">
          Quota exceeded. Upgrade to premium for unlimited generations.
        </p>
      )}
    </div>
  );
}
```

---

## Advanced Configurations

### Custom Rate Limits

```typescript
// Per-feature rate limits
const embeddingRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"), // 20 embedding generations per hour
  prefix: "@worldcrafter/embeddings",
});

const consistencyCheckRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 d"), // 3 consistency checks per day
  prefix: "@worldcrafter/consistency",
});
```

### Burst Allowance

Allow short bursts while maintaining hourly limits:

```typescript
const burstRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  timeout: 10000, // 10 second timeout
  // Allow 2 generations within 1 minute, then enforce hourly limit
  ephemeralCache: new Map(),
});
```

### IP-Based Fallback

For unauthenticated users:

```typescript
export async function checkIpRateLimit(ip: string): Promise<boolean> {
  const ipRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "1 h"), // Very restrictive for unauthenticated
    prefix: "@worldcrafter/ip",
  });

  const { success } = await ipRatelimit.limit(ip);
  return success;
}
```

---

## Monitoring & Analytics

### Usage Statistics

```typescript
// src/lib/ai/analytics.ts

export async function getUsageStatistics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const generations = await prisma.aiGeneration.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      entityType: true,
      tokensUsed: true,
      cost: true,
      provider: true,
    },
  });

  return {
    totalGenerations: generations.length,
    totalTokens: generations.reduce((sum, g) => sum + g.tokensUsed, 0),
    totalCost: generations.reduce((sum, g) => sum + Number(g.cost), 0),
    byType: {
      character: generations.filter((g) => g.entityType === "character").length,
      location: generations.filter((g) => g.entityType === "location").length,
      event: generations.filter((g) => g.entityType === "event").length,
      item: generations.filter((g) => g.entityType === "item").length,
    },
    byProvider: {
      openai: generations.filter((g) => g.provider === "openai").length,
      anthropic: generations.filter((g) => g.provider === "anthropic").length,
    },
    averageCost: generations.length > 0
      ? generations.reduce((sum, g) => sum + Number(g.cost), 0) / generations.length
      : 0,
  };
}
```

### Upstash Analytics Dashboard

Access analytics at: https://console.upstash.com/ratelimit

Metrics include:
- Request count over time
- Success vs blocked requests
- Average response time
- Top users by request volume

---

## Testing

### Unit Tests

```typescript
// src/lib/ai/__tests__/rate-limit.test.ts

import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getQuotaStatus } from "../rate-limit";

describe("Rate Limiting", () => {
  const testUserId = "test-user-123";

  beforeEach(async () => {
    // Clean up test data
    await prisma.aiQuota.deleteMany({
      where: { userId: testUserId },
    });
  });

  it("creates quota for new user", async () => {
    const result = await checkRateLimit(testUserId);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4); // After first generation
  });

  it("blocks after limit exceeded", async () => {
    // Use all 5 generations
    for (let i = 0; i < 5; i++) {
      await checkRateLimit(testUserId);
    }

    const result = await checkRateLimit(testUserId);
    expect(result.allowed).toBe(false);
  });

  it("resets quota after time window", async () => {
    // Mock time passage (requires test utilities)
    // Implementation depends on testing framework
  });

  it("premium tier has higher limit", async () => {
    await upgradeToPremium(testUserId);

    const quota = await getQuotaStatus(testUserId);
    expect(quota.limit).toBe(100);
  });
});
```

---

## Best Practices

1. **Always check rate limits before expensive operations**
2. **Provide clear error messages with reset time**
3. **Show quota status in UI before user attempts generation**
4. **Log rate limit violations for abuse detection**
5. **Implement graceful degradation** (e.g., suggest waiting or upgrading)
6. **Use analytics to optimize limits** based on actual usage patterns
7. **Consider per-feature limits** for granular control
8. **Cache quota status** on client to reduce database hits

---

## Troubleshooting

### Issue: Rate limit not resetting

**Cause:** Redis key not expiring properly
**Solution:** Verify Upstash Redis is configured correctly, check sliding window implementation

### Issue: Quota desynced between Redis and Prisma

**Cause:** Race conditions or failed updates
**Solution:** Use transactions, implement retry logic

### Issue: Premium users getting rate limited

**Cause:** Tier not properly updated
**Solution:** Verify `upgradeToPremium()` was called, check database `tier` field

---

## Future Enhancements

- [ ] Daily/monthly limits in addition to hourly
- [ ] Per-world rate limits
- [ ] Soft limits with warnings before hard cutoff
- [ ] Grace period for users who just downgraded
- [ ] Team/organization shared quotas
- [ ] Pay-per-use pricing model integration
- [ ] Webhooks for quota events

---

## Version History

- v1.0.0 (2025-01-09): Initial rate limiting implementation
