# Cost Tracking Guide

Comprehensive guide for tracking, analyzing, and optimizing AI API costs in WorldCrafter.

## Overview

AI features can be expensive at scale. Effective cost tracking helps:

- **Monitor spending** per user, feature, and provider
- **Detect anomalies** (abuse, bugs, inefficiencies)
- **Optimize costs** by choosing appropriate models
- **Budget accurately** for scaling
- **Bill users** fairly for premium features

---

## Cost Structure

### OpenAI Pricing (as of 2025)

| Model | Input (per 1k tokens) | Output (per 1k tokens) |
|-------|----------------------|------------------------|
| GPT-4 Turbo | $0.01 | $0.03 |
| GPT-3.5 Turbo | $0.0005 | $0.0015 |
| text-embedding-3-small | $0.00002 | N/A |

### Anthropic Pricing (as of 2025)

| Model | Input (per 1k tokens) | Output (per 1k tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |

### Typical WorldCrafter Costs

| Operation | Avg Tokens | Provider | Avg Cost |
|-----------|-----------|----------|----------|
| Character Generation (Standard) | 800 input, 600 output | GPT-4 | $0.026 |
| Character Generation (Brief) | 500 input, 200 output | GPT-4 | $0.011 |
| Relationship Suggestions | 1200 input, 400 output | GPT-4 | $0.024 |
| Consistency Check | 2000 input, 800 output | GPT-3.5 | $0.0022 |
| Writing Prompt (single) | 600 input, 150 output | GPT-4 | $0.0105 |
| Entity Embedding | 200 input | OpenAI | $0.000004 |

**Estimated monthly cost for active user (free tier):**
- 5 generations/hour × 24 hours = 120 generations/day
- 120 × $0.026 = $3.12/day
- $3.12 × 30 = **$93.60/month**

**With optimization:**
- Use GPT-3.5 for simple tasks: 60% cost reduction
- Cache embeddings: 90% reduction for relationship features
- Batch operations: 30% reduction
- **Optimized cost: ~$30/month per active user**

---

## Database Schema

Already included in skill's SKILL.md:

```prisma
model AiGeneration {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  worldId       String   @map("world_id")
  entityType    String   @map("entity_type")
  entityId      String?  @map("entity_id")
  provider      String   // "openai" or "anthropic"
  model         String   // "gpt-4-turbo", "claude-3-5-sonnet", etc.
  prompt        String   @db.Text
  response      String   @db.Text
  tokensUsed    Int      @map("tokens_used")
  cost          Decimal  @db.Decimal(10, 6) // Store as decimal for accuracy
  status        String   // "success", "error", "cancelled"
  createdAt     DateTime @default(now()) @map("created_at")

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  world         World    @relation(fields: [worldId], references: [id], onDelete: Cascade)

  @@map("ai_generations")
  @@index([userId])
  @@index([worldId])
  @@index([createdAt])
}

model AiQuota {
  // ... (includes totalTokensUsed and totalCost fields)
  totalTokensUsed   BigInt   @default(0) @map("total_tokens_used")
  totalCost         Decimal  @default(0) @db.Decimal(10, 2) @map("total_cost")
}
```

---

## Implementation

### Cost Calculation Service

```typescript
// src/lib/ai/cost-calculator.ts

interface CostConfig {
  [model: string]: {
    input: number;  // Cost per 1k tokens
    output: number; // Cost per 1k tokens
  };
}

const COST_CONFIG: CostConfig = {
  "gpt-4-turbo": { input: 0.01, output: 0.03 },
  "gpt-4-turbo-preview": { input: 0.01, output: 0.03 },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015 },
  "claude-3-5-sonnet": { input: 0.003, output: 0.015 },
  "claude-3-5-sonnet-20241022": { input: 0.003, output: 0.015 },
  "claude-3-haiku": { input: 0.00025, output: 0.00125 },
  "text-embedding-3-small": { input: 0.00002, output: 0 },
  "text-embedding-3-large": { input: 0.00013, output: 0 },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = COST_CONFIG[model];

  if (!config) {
    console.warn(`Unknown model: ${model}, using default cost`);
    return 0.01; // Conservative default
  }

  const inputCost = (inputTokens / 1000) * config.input;
  const outputCost = (outputTokens / 1000) * config.output;

  return Number((inputCost + outputCost).toFixed(6));
}

export function estimateCost(
  model: string,
  estimatedTokens: number,
  inputOutputRatio: number = 0.6 // Typical: 60% input, 40% output
): number {
  const inputTokens = Math.floor(estimatedTokens * inputOutputRatio);
  const outputTokens = Math.floor(estimatedTokens * (1 - inputOutputRatio));

  return calculateCost(model, inputTokens, outputTokens);
}

export function compareCosts(
  models: string[],
  inputTokens: number,
  outputTokens: number
): Array<{ model: string; cost: number }> {
  return models
    .map((model) => ({
      model,
      cost: calculateCost(model, inputTokens, outputTokens),
    }))
    .sort((a, b) => a.cost - b.cost);
}
```

### Tracking Service

```typescript
// src/lib/ai/cost-tracking.ts

import { prisma } from "@/lib/prisma";
import { calculateCost } from "./cost-calculator";

export async function trackGeneration(data: {
  userId: string;
  worldId: string;
  entityType: string;
  entityId?: string;
  provider: string;
  model: string;
  prompt: string;
  response: string;
  inputTokens: number;
  outputTokens: number;
  status: "success" | "error" | "cancelled";
}) {
  const cost = calculateCost(data.model, data.inputTokens, data.outputTokens);
  const tokensUsed = data.inputTokens + data.outputTokens;

  // Create generation record
  const generation = await prisma.aiGeneration.create({
    data: {
      userId: data.userId,
      worldId: data.worldId,
      entityType: data.entityType,
      entityId: data.entityId,
      provider: data.provider,
      model: data.model,
      prompt: data.prompt,
      response: data.response,
      tokensUsed,
      cost,
      status: data.status,
    },
  });

  // Update user's total quota
  await prisma.aiQuota.update({
    where: { userId: data.userId },
    data: {
      totalTokensUsed: { increment: tokensUsed },
      totalCost: { increment: cost },
    },
  });

  return generation;
}

export async function getUserCosts(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where = {
    userId,
    ...(startDate && endDate
      ? { createdAt: { gte: startDate, lte: endDate } }
      : {}),
  };

  const generations = await prisma.aiGeneration.findMany({
    where,
    select: {
      cost: true,
      tokensUsed: true,
      provider: true,
      model: true,
      entityType: true,
      createdAt: true,
      status: true,
    },
  });

  const totalCost = generations.reduce((sum, g) => sum + Number(g.cost), 0);
  const totalTokens = generations.reduce((sum, g) => sum + g.tokensUsed, 0);

  return {
    totalCost,
    totalTokens,
    generationCount: generations.length,
    successfulGenerations: generations.filter((g) => g.status === "success").length,
    failedGenerations: generations.filter((g) => g.status === "error").length,
    byProvider: {
      openai: {
        count: generations.filter((g) => g.provider === "openai").length,
        cost: generations
          .filter((g) => g.provider === "openai")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
      anthropic: {
        count: generations.filter((g) => g.provider === "anthropic").length,
        cost: generations
          .filter((g) => g.provider === "anthropic")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
    },
    byEntityType: {
      character: generations.filter((g) => g.entityType === "character").length,
      location: generations.filter((g) => g.entityType === "location").length,
      event: generations.filter((g) => g.entityType === "event").length,
      item: generations.filter((g) => g.entityType === "item").length,
    },
    averageCost: generations.length > 0 ? totalCost / generations.length : 0,
    averageTokens: generations.length > 0 ? totalTokens / generations.length : 0,
  };
}

export async function getWorldCosts(worldId: string, userId: string) {
  const generations = await prisma.aiGeneration.findMany({
    where: { worldId, userId },
    select: {
      cost: true,
      tokensUsed: true,
      entityType: true,
      createdAt: true,
    },
  });

  return {
    totalCost: generations.reduce((sum, g) => sum + Number(g.cost), 0),
    totalTokens: generations.reduce((sum, g) => sum + g.tokensUsed, 0),
    generationCount: generations.length,
    byType: {
      character: {
        count: generations.filter((g) => g.entityType === "character").length,
        cost: generations
          .filter((g) => g.entityType === "character")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
      location: {
        count: generations.filter((g) => g.entityType === "location").length,
        cost: generations
          .filter((g) => g.entityType === "location")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
      event: {
        count: generations.filter((g) => g.entityType === "event").length,
        cost: generations
          .filter((g) => g.entityType === "event")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
      item: {
        count: generations.filter((g) => g.entityType === "item").length,
        cost: generations
          .filter((g) => g.entityType === "item")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
    },
  };
}

export async function getSystemWideCosts(startDate: Date, endDate: Date) {
  const generations = await prisma.aiGeneration.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      cost: true,
      tokensUsed: true,
      provider: true,
      model: true,
      userId: true,
      status: true,
    },
  });

  const uniqueUsers = new Set(generations.map((g) => g.userId)).size;

  return {
    totalCost: generations.reduce((sum, g) => sum + Number(g.cost), 0),
    totalTokens: generations.reduce((sum, g) => sum + g.tokensUsed, 0),
    totalGenerations: generations.length,
    uniqueUsers,
    costPerUser: uniqueUsers > 0
      ? generations.reduce((sum, g) => sum + Number(g.cost), 0) / uniqueUsers
      : 0,
    successRate:
      generations.length > 0
        ? (generations.filter((g) => g.status === "success").length /
            generations.length) *
          100
        : 0,
    byProvider: {
      openai: {
        count: generations.filter((g) => g.provider === "openai").length,
        cost: generations
          .filter((g) => g.provider === "openai")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
      anthropic: {
        count: generations.filter((g) => g.provider === "anthropic").length,
        cost: generations
          .filter((g) => g.provider === "anthropic")
          .reduce((sum, g) => sum + Number(g.cost), 0),
      },
    },
    topModels: Object.entries(
      generations.reduce((acc, g) => {
        acc[g.model] = (acc[g.model] || 0) + Number(g.cost);
        return acc;
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  };
}
```

---

## Cost Alerts

### Alert Service

```typescript
// src/lib/ai/cost-alerts.ts

import { prisma } from "@/lib/prisma";
import { getUserCosts } from "./cost-tracking";

const COST_THRESHOLDS = {
  daily: 1.0, // $1/day for free tier
  weekly: 5.0, // $5/week
  monthly: 15.0, // $15/month
};

export async function checkCostAlerts(userId: string) {
  const now = new Date();
  const alerts: Array<{ level: string; message: string }> = [];

  // Daily check
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const dailyCosts = await getUserCosts(userId, dayStart, now);

  if (dailyCosts.totalCost > COST_THRESHOLDS.daily) {
    alerts.push({
      level: "warning",
      message: `Daily AI cost ($${dailyCosts.totalCost.toFixed(2)}) exceeds threshold ($${COST_THRESHOLDS.daily})`,
    });
  }

  // Weekly check
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const weeklyCosts = await getUserCosts(userId, weekStart, now);

  if (weeklyCosts.totalCost > COST_THRESHOLDS.weekly) {
    alerts.push({
      level: "warning",
      message: `Weekly AI cost ($${weeklyCosts.totalCost.toFixed(2)}) exceeds threshold ($${COST_THRESHOLDS.weekly})`,
    });
  }

  // Monthly check
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthlyCosts = await getUserCosts(userId, monthStart, now);

  if (monthlyCosts.totalCost > COST_THRESHOLDS.monthly) {
    alerts.push({
      level: "critical",
      message: `Monthly AI cost ($${monthlyCosts.totalCost.toFixed(2)}) exceeds threshold ($${COST_THRESHOLDS.monthly})`,
    });
  }

  return alerts;
}

export async function sendCostAlert(userId: string, alert: { level: string; message: string }) {
  // Send email notification, push notification, etc.
  // Implementation depends on notification system

  console.log(`[COST ALERT] User ${userId}: ${alert.message}`);

  // Log alert to database
  await prisma.aiQuota.update({
    where: { userId },
    data: {
      updatedAt: new Date(), // Trigger alert timestamp
    },
  });
}
```

### Scheduled Alert Check

```typescript
// src/app/api/cron/cost-alerts/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkCostAlerts, sendCostAlert } from "@/lib/ai/cost-alerts";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all users with AI activity in last 24 hours
    const activeUsers = await prisma.aiGeneration.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const alertsSent = [];

    for (const { userId } of activeUsers) {
      const alerts = await checkCostAlerts(userId);

      for (const alert of alerts) {
        await sendCostAlert(userId, alert);
        alertsSent.push({ userId, alert });
      }
    }

    return NextResponse.json({
      success: true,
      alertsSent: alertsSent.length,
      details: alertsSent,
    });
  } catch (error) {
    console.error("Cost alert check failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Configure in Vercel:
```bash
# Add to vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cost-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## Cost Optimization Strategies

### 1. Model Selection

```typescript
// src/lib/ai/model-selector.ts

export function selectOptimalModel(
  task: "generation" | "analysis" | "embedding",
  detailLevel: "brief" | "standard" | "detailed"
): string {
  if (task === "embedding") {
    return "text-embedding-3-small"; // Cheapest, sufficient for most use cases
  }

  if (task === "analysis") {
    return "gpt-3.5-turbo"; // 10x cheaper than GPT-4, good for consistency checks
  }

  if (task === "generation") {
    if (detailLevel === "brief") {
      return "gpt-3.5-turbo"; // Fast and cheap for simple generations
    } else {
      return "gpt-4-turbo"; // Higher quality for standard/detailed
    }
  }

  return "gpt-4-turbo"; // Default to GPT-4 for safety
}
```

### 2. Response Caching

```typescript
// src/lib/ai/cache.ts

import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function cachedGeneration(
  cacheKey: string,
  generateFn: () => Promise<any>,
  ttl: number = 60 * 60 * 24 // 24 hours
) {
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  // Generate and cache
  console.log(`[CACHE MISS] ${cacheKey}`);
  const result = await generateFn();

  await redis.set(cacheKey, result, { ex: ttl });

  return result;
}

// Usage
const result = await cachedGeneration(
  `suggestions:${entityId}`,
  () => suggestRelationships(entityId, entityType, worldId)
);
```

### 3. Batch Operations

```typescript
// src/lib/ai/batch-embeddings.ts

export async function batchGenerateEmbeddings(
  entities: Array<{ id: string; text: string }>
) {
  const BATCH_SIZE = 100; // OpenAI allows up to 2048
  const batches = [];

  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    batches.push(entities.slice(i, i + BATCH_SIZE));
  }

  const results = [];

  for (const batch of batches) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch.map((e) => e.text),
    });

    results.push(
      ...response.data.map((d, i) => ({
        id: batch[i].id,
        embedding: d.embedding,
      }))
    );
  }

  return results;
}
```

### 4. Prompt Optimization

```typescript
// Reduce prompt size by summarizing context
function buildOptimizedPrompt(context: WorldContext) {
  return `World: ${context.name} (${context.genre})

${context.entities.slice(0, 10).map(e => `- ${e.name}`).join("\n")}

Generate a character fitting this world.`; // 50% token reduction
}
```

---

## Reporting & Analytics

### Cost Dashboard Component

```typescript
// src/components/ai/CostDashboard.tsx

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function CostDashboard({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/ai/costs?userId=${userId}`)
      .then((res) => res.json())
      .then(setData);
  }, [userId]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${data.totalCost.toFixed(2)}</div>
          <p className="text-sm text-muted-foreground">
            {data.generationCount} generations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${data.averageCost.toFixed(3)}</div>
          <p className="text-sm text-muted-foreground">per generation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {(data.totalTokens / 1000).toFixed(1)}k
          </div>
          <p className="text-sm text-muted-foreground">
            {(data.averageTokens || 0).toFixed(0)} avg per generation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Best Practices

1. **Track everything**: Never call AI APIs without logging cost
2. **Alert early**: Set low thresholds to catch runaway costs
3. **Review regularly**: Analyze cost reports weekly
4. **Optimize ruthlessly**: Use cheaper models where possible
5. **Cache aggressively**: Don't regenerate identical content
6. **Batch when possible**: Reduce API overhead
7. **Monitor anomalies**: Spike in costs = potential abuse or bug
8. **Budget per user**: Set hard limits to prevent overspending

---

## Version History

- v1.0.0 (2025-01-09): Initial cost tracking implementation
