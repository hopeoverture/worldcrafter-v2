# worldcrafter-ai-assistant

**Version:** 1.0.0

**Description:**
Comprehensive AI-powered features for WorldCrafter including entity generation, relationship suggestions, consistency checking, and writing prompts. Integrates OpenAI GPT-4 and Anthropic Claude for intelligent world-building assistance with rate limiting and cost tracking.

**Trigger Phrases:**
- "Generate with AI"
- "Suggest relationships"
- "Check consistency"
- "Get writing prompts"
- "AI-powered entity"
- "Analyze world consistency"
- "Generate story hooks"

**Allowed Tools:** Read, Write, Edit, Bash

**Related Skills:**
- feature-builder
- database-setup
- test-generator

---

## Overview

This skill implements production-ready AI features for WorldCrafter:

1. **AI Entity Generation** - Generate characters, locations, events, items with full context
2. **Relationship Suggestions** - Intelligent relationship recommendations using embeddings
3. **Consistency Checker** - Scan worlds for logical conflicts and contradictions
4. **Writing Prompts** - Generate story starters, quest hooks, and conflict ideas
5. **Rate Limiting** - Quota management with Redis
6. **Streaming Responses** - Server-Sent Events for long-form content

---

## Architecture

### AI Providers

**Primary Provider:** OpenAI GPT-4 Turbo
- Structured output with JSON mode
- Function calling for validation
- 128k context window
- Cost: ~$0.01 per 1k tokens (input), ~$0.03 per 1k tokens (output)

**Alternative Provider:** Anthropic Claude 3.5 Sonnet
- Excellent for creative content
- 200k context window
- Tool use for structured output
- Cost: ~$0.003 per 1k tokens (input), ~$0.015 per 1k tokens (output)

**Embeddings:** OpenAI text-embedding-3-small
- 1536 dimensions
- Cost: ~$0.00002 per 1k tokens
- Use for similarity search and relationship suggestions

### Tech Stack

```typescript
// AI Libraries
- @anthropic-ai/sdk: ^0.24.0
- openai: ^4.47.0
- @ai-sdk/openai: ^0.0.40 (Vercel AI SDK)
- ai: ^3.1.0 (streaming utilities)

// Vector Search
- @supabase/supabase-js: ^2.43.0 (pgvector extension)
- pgvector: Built into Supabase PostgreSQL

// Rate Limiting
- @upstash/redis: ^1.31.0
- @upstash/ratelimit: ^1.2.0

// Validation
- zod: ^3.23.0 (already in project)
```

---

## 1. AI Entity Generation

### Feature Requirements

**Context Building:**
1. World metadata (genre, description, tone)
2. All existing entities (characters, locations, events, items)
3. Existing relationships and connections
4. User's generation preferences (style, detail level)

**Structured Output:**
- Use Zod schemas for validation
- GPT-4 JSON mode or Claude tool use
- Fallback validation on server

**UI Flow:**
1. User clicks "Generate with AI" button on entity form
2. Modal shows generation options (entity type, detail level, style)
3. Streaming generation with progress indicator
4. Preview generated entity
5. Edit before saving or regenerate
6. One-click save to database

### Implementation

#### Database Schema Addition

```prisma
// prisma/schema.prisma

model AiGeneration {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  worldId       String   @map("world_id")
  entityType    String   @map("entity_type") // "character", "location", "event", "item"
  entityId      String?  @map("entity_id") // If saved
  provider      String   // "openai" or "anthropic"
  model         String   // "gpt-4-turbo" or "claude-3-5-sonnet"
  prompt        String   @db.Text
  response      String   @db.Text
  tokensUsed    Int      @map("tokens_used")
  cost          Decimal  @db.Decimal(10, 6)
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

#### Zod Schemas

```typescript
// src/lib/schemas/ai-generation.ts

import { z } from "zod";

export const aiGenerationOptionsSchema = z.object({
  entityType: z.enum(["character", "location", "event", "item"]),
  detailLevel: z.enum(["brief", "standard", "detailed"]).default("standard"),
  style: z.enum(["neutral", "dramatic", "mysterious", "heroic"]).default("neutral"),
  includeRelationships: z.boolean().default(true),
  temperature: z.number().min(0).max(2).default(0.7),
});

export const generatedCharacterSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  physicalDescription: z.string().optional(),
  personality: z.string().optional(),
  background: z.string().optional(),
  motivations: z.array(z.string()).optional(),
  secrets: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  relationships: z.array(z.object({
    entityName: z.string(),
    relationType: z.string(),
    description: z.string(),
  })).optional(),
});

export const generatedLocationSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  locationType: z.string().optional(),
  geography: z.string().optional(),
  climate: z.string().optional(),
  culture: z.string().optional(),
  economy: z.string().optional(),
  notableFeatures: z.array(z.string()).optional(),
  inhabitants: z.array(z.string()).optional(),
});

export const generatedEventSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  eventType: z.string().optional(),
  date: z.string().optional(),
  duration: z.string().optional(),
  participants: z.array(z.string()).optional(),
  location: z.string().optional(),
  consequences: z.array(z.string()).optional(),
  significance: z.string().optional(),
});

export const generatedItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  itemType: z.string().optional(),
  rarity: z.enum(["common", "uncommon", "rare", "legendary"]).optional(),
  properties: z.array(z.string()).optional(),
  history: z.string().optional(),
  currentOwner: z.string().optional(),
  powers: z.array(z.string()).optional(),
});

export type AiGenerationOptions = z.infer<typeof aiGenerationOptionsSchema>;
export type GeneratedCharacter = z.infer<typeof generatedCharacterSchema>;
export type GeneratedLocation = z.infer<typeof generatedLocationSchema>;
export type GeneratedEvent = z.infer<typeof generatedEventSchema>;
export type GeneratedItem = z.infer<typeof generatedItemSchema>;
```

#### AI Service

```typescript
// src/lib/ai/generation-service.ts

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AiGenerationOptions } from "@/lib/schemas/ai-generation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface WorldContext {
  id: string;
  name: string;
  genre?: string;
  description?: string;
  entities: Array<{
    type: string;
    name: string;
    description: string;
  }>;
  relationships: Array<{
    sourceName: string;
    targetName: string;
    relationType: string;
  }>;
}

export async function buildWorldContext(worldId: string): Promise<WorldContext> {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    include: {
      characters: { select: { name: true, description: true } },
      locations: { select: { name: true, description: true } },
      events: { select: { name: true, description: true } },
      items: { select: { name: true, description: true } },
      relationships: {
        select: {
          sourceCharacter: { select: { name: true } },
          targetCharacter: { select: { name: true } },
          relationType: true,
        },
      },
    },
  });

  if (!world) throw new Error("World not found");

  const entities = [
    ...world.characters.map(c => ({ type: "character", name: c.name, description: c.description || "" })),
    ...world.locations.map(l => ({ type: "location", name: l.name, description: l.description || "" })),
    ...world.events.map(e => ({ type: "event", name: e.name, description: e.description || "" })),
    ...world.items.map(i => ({ type: "item", name: i.name, description: i.description || "" })),
  ];

  const relationships = world.relationships.map(r => ({
    sourceName: r.sourceCharacter.name,
    targetName: r.targetCharacter.name,
    relationType: r.relationType,
  }));

  return {
    id: world.id,
    name: world.name,
    genre: world.genre || undefined,
    description: world.description || undefined,
    entities,
    relationships,
  };
}

export function buildGenerationPrompt(
  context: WorldContext,
  entityType: string,
  options: AiGenerationOptions
): string {
  const detailInstructions = {
    brief: "Keep descriptions concise (2-3 sentences).",
    standard: "Provide moderate detail (1-2 paragraphs).",
    detailed: "Create rich, detailed descriptions (3-5 paragraphs).",
  };

  const styleInstructions = {
    neutral: "Use a neutral, informative tone.",
    dramatic: "Use dramatic, evocative language.",
    mysterious: "Add mystery and intrigue.",
    heroic: "Emphasize heroism and nobility.",
  };

  return `You are a creative world-building assistant for "${context.name}", a ${context.genre || "fantasy"} world.

World Description: ${context.description || "No description provided"}

Existing Entities:
${context.entities.slice(0, 20).map(e => `- ${e.type}: ${e.name} - ${e.description.substring(0, 100)}`).join("\n")}

Existing Relationships:
${context.relationships.slice(0, 10).map(r => `- ${r.sourceName} (${r.relationType}) ${r.targetName}`).join("\n")}

Task: Generate a new ${entityType} that fits naturally into this world.

Requirements:
- ${detailInstructions[options.detailLevel]}
- ${styleInstructions[options.style]}
- Ensure consistency with existing world lore
- Avoid duplicating existing entity names
${options.includeRelationships ? "- Suggest 2-3 relationships with existing entities" : ""}

Return a valid JSON object matching the schema for ${entityType}.`;
}

export async function generateEntityWithOpenAI<T extends z.ZodType>(
  worldId: string,
  userId: string,
  entityType: string,
  options: AiGenerationOptions,
  schema: T
): Promise<z.infer<T>> {
  const context = await buildWorldContext(worldId);
  const prompt = buildGenerationPrompt(context, entityType, options);

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a creative world-building assistant. Always respond with valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: options.temperature,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  const validated = schema.parse(parsed);

  // Track generation
  await prisma.aiGeneration.create({
    data: {
      userId,
      worldId,
      entityType,
      provider: "openai",
      model: "gpt-4-turbo",
      prompt,
      response: content,
      tokensUsed: response.usage?.total_tokens || 0,
      cost: calculateCost("gpt-4-turbo", response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
      status: "success",
    },
  });

  return validated;
}

export async function generateEntityWithClaude<T extends z.ZodType>(
  worldId: string,
  userId: string,
  entityType: string,
  options: AiGenerationOptions,
  schema: T
): Promise<z.infer<T>> {
  const context = await buildWorldContext(worldId);
  const prompt = buildGenerationPrompt(context, entityType, options);

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2000,
    temperature: options.temperature,
    messages: [
      {
        role: "user",
        content: prompt + "\n\nRespond with ONLY a valid JSON object, no additional text.",
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  const parsed = JSON.parse(content.text);
  const validated = schema.parse(parsed);

  // Track generation
  await prisma.aiGeneration.create({
    data: {
      userId,
      worldId,
      entityType,
      provider: "anthropic",
      model: "claude-3-5-sonnet",
      prompt,
      response: content.text,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      cost: calculateCost("claude-3-5-sonnet", response.usage.input_tokens, response.usage.output_tokens),
      status: "success",
    },
  });

  return validated;
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = {
    "gpt-4-turbo": { input: 0.01 / 1000, output: 0.03 / 1000 },
    "claude-3-5-sonnet": { input: 0.003 / 1000, output: 0.015 / 1000 },
  };

  const cost = costs[model as keyof typeof costs];
  return inputTokens * cost.input + outputTokens * cost.output;
}
```

#### Server Action

```typescript
// src/app/worlds/[worldId]/actions/ai-generate.ts

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { generateEntityWithOpenAI, generateEntityWithClaude } from "@/lib/ai/generation-service";
import { aiGenerationOptionsSchema, generatedCharacterSchema } from "@/lib/schemas/ai-generation";
import { z } from "zod";

export async function generateEntity(
  worldId: string,
  entityType: string,
  options: z.infer<typeof aiGenerationOptionsSchema>
) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 2. Validate input
    const validatedOptions = aiGenerationOptionsSchema.parse(options);

    // 3. Rate limit check
    const allowed = await checkRateLimit(user.id);
    if (!allowed) {
      return { success: false, error: "Rate limit exceeded. Upgrade to premium for unlimited generations." };
    }

    // 4. Generate entity
    const schema = getSchemaForEntityType(entityType);
    const provider = process.env.AI_PROVIDER || "openai";

    let generated;
    if (provider === "anthropic") {
      generated = await generateEntityWithClaude(worldId, user.id, entityType, validatedOptions, schema);
    } else {
      generated = await generateEntityWithOpenAI(worldId, user.id, entityType, validatedOptions, schema);
    }

    // 5. Revalidate
    revalidatePath(`/worlds/${worldId}`);

    return { success: true, data: generated };
  } catch (error) {
    console.error("AI generation error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Generation failed" };
  }
}

function getSchemaForEntityType(entityType: string) {
  switch (entityType) {
    case "character":
      return generatedCharacterSchema;
    case "location":
      return generatedLocationSchema;
    case "event":
      return generatedEventSchema;
    case "item":
      return generatedItemSchema;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
```

---

## 2. Relationship Suggestions

### Feature Requirements

**Analysis:**
1. Calculate embeddings for entity descriptions
2. Find similar entities using cosine similarity
3. Use LLM to generate relationship suggestions with reasoning
4. Rank by relevance and narrative potential

**UI Flow:**
1. View entity details page
2. "Suggest Relationships" button
3. Loading state with progress
4. Show 3-5 suggestions with reasoning
5. One-click add relationship

### Implementation

#### Database Schema Addition

```prisma
// Add to prisma/schema.prisma

model EntityEmbedding {
  id            String   @id @default(cuid())
  entityId      String   @unique @map("entity_id")
  entityType    String   @map("entity_type")
  embedding     Unsupported("vector(1536)")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@map("entity_embeddings")
  @@index([entityType])
}
```

#### Embedding Service

```typescript
// src/lib/ai/embedding-service.ts

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

export async function upsertEntityEmbedding(
  entityId: string,
  entityType: string,
  name: string,
  description: string
) {
  const text = `${name}\n\n${description}`;
  const embedding = await generateEmbedding(text);

  // Use raw SQL for vector upsert
  await prisma.$executeRaw`
    INSERT INTO entity_embeddings (id, entity_id, entity_type, embedding, created_at, updated_at)
    VALUES (gen_random_uuid(), ${entityId}, ${entityType}, ${embedding}::vector, NOW(), NOW())
    ON CONFLICT (entity_id)
    DO UPDATE SET embedding = ${embedding}::vector, updated_at = NOW()
  `;
}

export async function findSimilarEntities(
  entityId: string,
  worldId: string,
  limit: number = 10
): Promise<Array<{ id: string; type: string; name: string; similarity: number }>> {
  const result = await prisma.$queryRaw<Array<{
    id: string;
    entity_type: string;
    name: string;
    similarity: number;
  }>>`
    WITH target AS (
      SELECT embedding FROM entity_embeddings WHERE entity_id = ${entityId}
    )
    SELECT
      ee.entity_id as id,
      ee.entity_type,
      COALESCE(c.name, l.name, e.name, i.name) as name,
      1 - (ee.embedding <=> (SELECT embedding FROM target)) as similarity
    FROM entity_embeddings ee
    LEFT JOIN characters c ON ee.entity_id = c.id AND ee.entity_type = 'character'
    LEFT JOIN locations l ON ee.entity_id = l.id AND ee.entity_type = 'location'
    LEFT JOIN events e ON ee.entity_id = e.id AND ee.entity_type = 'event'
    LEFT JOIN items i ON ee.entity_id = i.id AND ee.entity_type = 'item'
    WHERE ee.entity_id != ${entityId}
      AND (
        (ee.entity_type = 'character' AND c.world_id = ${worldId}) OR
        (ee.entity_type = 'location' AND l.world_id = ${worldId}) OR
        (ee.entity_type = 'event' AND e.world_id = ${worldId}) OR
        (ee.entity_type = 'item' AND i.world_id = ${worldId})
      )
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return result.map(r => ({
    id: r.id,
    type: r.entity_type,
    name: r.name,
    similarity: Number(r.similarity),
  }));
}
```

#### Relationship Suggestion Service

```typescript
// src/lib/ai/relationship-service.ts

import OpenAI from "openai";
import { findSimilarEntities } from "./embedding-service";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface RelationshipSuggestion {
  targetEntityId: string;
  targetEntityName: string;
  targetEntityType: string;
  relationType: string;
  reasoning: string;
  strength: number; // 0-1
}

export async function suggestRelationships(
  entityId: string,
  entityType: string,
  worldId: string
): Promise<RelationshipSuggestion[]> {
  // 1. Get source entity details
  const sourceEntity = await getEntityDetails(entityId, entityType);
  if (!sourceEntity) throw new Error("Entity not found");

  // 2. Find similar entities
  const similarEntities = await findSimilarEntities(entityId, worldId, 10);

  // 3. Get details for similar entities
  const candidateDetails = await Promise.all(
    similarEntities.map(async (e) => ({
      ...e,
      details: await getEntityDetails(e.id, e.type),
    }))
  );

  // 4. Use LLM to generate suggestions
  const prompt = `You are a world-building assistant analyzing relationships between entities.

Source Entity (${entityType}):
Name: ${sourceEntity.name}
Description: ${sourceEntity.description}

Candidate Entities:
${candidateDetails.map((c, i) => `
${i + 1}. ${c.type}: ${c.name} (similarity: ${c.similarity.toFixed(2)})
   Description: ${c.details?.description || "No description"}
`).join("\n")}

Task: Suggest 3-5 meaningful relationships between the source entity and candidates.

For each suggestion, provide:
1. Target entity name
2. Relationship type (ally, enemy, mentor, student, lover, rival, employer, family, etc.)
3. Reasoning (2-3 sentences explaining why this relationship makes sense)
4. Strength (0.0-1.0, how strong/important this relationship is)

Respond with a JSON array of suggestions.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a creative world-building assistant. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content);
  const suggestions = parsed.suggestions || [];

  // 5. Map back to entity IDs
  return suggestions.map((s: any) => {
    const candidate = candidateDetails.find(c => c.name === s.targetEntityName);
    return {
      targetEntityId: candidate?.id || "",
      targetEntityName: s.targetEntityName,
      targetEntityType: candidate?.type || "character",
      relationType: s.relationType,
      reasoning: s.reasoning,
      strength: s.strength,
    };
  }).filter((s: RelationshipSuggestion) => s.targetEntityId !== "");
}

async function getEntityDetails(entityId: string, entityType: string) {
  switch (entityType) {
    case "character":
      return await prisma.character.findUnique({ where: { id: entityId } });
    case "location":
      return await prisma.location.findUnique({ where: { id: entityId } });
    case "event":
      return await prisma.event.findUnique({ where: { id: entityId } });
    case "item":
      return await prisma.item.findUnique({ where: { id: entityId } });
    default:
      return null;
  }
}
```

---

## 3. Consistency Checker

### Feature Requirements

**Checks:**
1. **Date Conflicts** - Events referencing each other with impossible dates
2. **Location Conflicts** - Character in two places at same time
3. **Description Contradictions** - Embedding similarity + LLM analysis
4. **Orphaned References** - Mentions of non-existent entities

**Report Format:**
- Severity: Critical, High, Medium, Low
- Category: Date, Location, Description, Reference
- Details with links to affected entities
- Suggested fixes

### Implementation

#### Consistency Service

```typescript
// src/lib/ai/consistency-service.ts

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "./embedding-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ConsistencyIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "date" | "location" | "description" | "reference";
  title: string;
  description: string;
  affectedEntities: Array<{ id: string; type: string; name: string }>;
  suggestedFix?: string;
}

export async function checkWorldConsistency(worldId: string): Promise<ConsistencyIssue[]> {
  const issues: ConsistencyIssue[] = [];

  // 1. Check date conflicts
  issues.push(...await checkDateConflicts(worldId));

  // 2. Check location conflicts
  issues.push(...await checkLocationConflicts(worldId));

  // 3. Check description contradictions
  issues.push(...await checkDescriptionContradictions(worldId));

  // 4. Check orphaned references
  issues.push(...await checkOrphanedReferences(worldId));

  return issues;
}

async function checkDateConflicts(worldId: string): Promise<ConsistencyIssue[]> {
  const events = await prisma.event.findMany({
    where: { worldId },
    select: { id: true, name: true, date: true, description: true },
  });

  const issues: ConsistencyIssue[] = [];

  // Find events that reference other events
  for (const event of events) {
    if (!event.date || !event.description) continue;

    // Extract mentions of other events
    const mentions = events.filter(e =>
      e.id !== event.id &&
      e.name &&
      event.description.toLowerCase().includes(e.name.toLowerCase())
    );

    for (const mentioned of mentions) {
      if (!mentioned.date) continue;

      // Check if dates are consistent with context
      const eventDate = new Date(event.date);
      const mentionedDate = new Date(mentioned.date);

      // Use LLM to check if temporal relationship makes sense
      const prompt = `Does this temporal relationship make sense?

Event 1: "${event.name}" (${event.date})
Description: ${event.description}

Event 2: "${mentioned.name}" (${mentioned.date})

Event 1's description mentions Event 2. Is the date relationship consistent?
Respond with JSON: { "consistent": true/false, "explanation": "..." }`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      if (!result.consistent) {
        issues.push({
          id: `date-${event.id}-${mentioned.id}`,
          severity: "high",
          category: "date",
          title: "Date Conflict",
          description: result.explanation,
          affectedEntities: [
            { id: event.id, type: "event", name: event.name },
            { id: mentioned.id, type: "event", name: mentioned.name },
          ],
          suggestedFix: `Review the dates for "${event.name}" and "${mentioned.name}" to ensure temporal consistency.`,
        });
      }
    }
  }

  return issues;
}

async function checkLocationConflicts(worldId: string): Promise<ConsistencyIssue[]> {
  // Check if characters are mentioned in events at overlapping times in different locations
  const events = await prisma.event.findMany({
    where: { worldId },
    include: {
      location: true,
      characters: { include: { character: true } },
    },
  });

  const issues: ConsistencyIssue[] = [];

  // Group events by character
  const eventsByCharacter = new Map<string, typeof events>();
  events.forEach(event => {
    event.characters.forEach(({ character }) => {
      if (!eventsByCharacter.has(character.id)) {
        eventsByCharacter.set(character.id, []);
      }
      eventsByCharacter.get(character.id)!.push(event);
    });
  });

  // Check for conflicts
  for (const [characterId, characterEvents] of eventsByCharacter) {
    const sortedEvents = characterEvents
      .filter(e => e.date && e.location)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const event1 = sortedEvents[i];
      const event2 = sortedEvents[i + 1];

      if (event1.location!.id !== event2.location!.id) {
        const timeDiff = Math.abs(
          new Date(event2.date!).getTime() - new Date(event1.date!).getTime()
        );
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        if (hoursDiff < 24) { // Same day, different locations
          issues.push({
            id: `location-${characterId}-${event1.id}-${event2.id}`,
            severity: "medium",
            category: "location",
            title: "Location Conflict",
            description: `${event1.characters.find(c => c.characterId === characterId)?.character.name} appears in ${event1.location!.name} and ${event2.location!.name} on the same day.`,
            affectedEntities: [
              { id: event1.id, type: "event", name: event1.name },
              { id: event2.id, type: "event", name: event2.name },
            ],
            suggestedFix: "Add travel time between events or adjust dates.",
          });
        }
      }
    }
  }

  return issues;
}

async function checkDescriptionContradictions(worldId: string): Promise<ConsistencyIssue[]> {
  const characters = await prisma.character.findMany({
    where: { worldId },
    select: { id: true, name: true, description: true },
  });

  const issues: ConsistencyIssue[] = [];

  // Check for contradictions in character descriptions
  for (const character of characters) {
    if (!character.description) continue;

    // Use LLM to detect internal contradictions
    const prompt = `Analyze this character description for contradictions:

Character: ${character.name}
Description: ${character.description}

Are there any logical contradictions, impossible traits, or conflicting statements?
Respond with JSON: { "hasContradictions": true/false, "contradictions": [{ "issue": "...", "severity": "low/medium/high" }] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    if (result.hasContradictions && result.contradictions) {
      result.contradictions.forEach((contradiction: any) => {
        issues.push({
          id: `description-${character.id}-${issues.length}`,
          severity: contradiction.severity as any,
          category: "description",
          title: "Description Contradiction",
          description: contradiction.issue,
          affectedEntities: [{ id: character.id, type: "character", name: character.name }],
        });
      });
    }
  }

  return issues;
}

async function checkOrphanedReferences(worldId: string): Promise<ConsistencyIssue[]> {
  const world = await prisma.world.findUnique({
    where: { id: worldId },
    include: {
      characters: true,
      locations: true,
      events: true,
      items: true,
    },
  });

  if (!world) return [];

  const issues: ConsistencyIssue[] = [];
  const allEntityNames = [
    ...world.characters.map(c => c.name),
    ...world.locations.map(l => l.name),
    ...world.events.map(e => e.name),
    ...world.items.map(i => i.name),
  ];

  // Check descriptions for mentions of non-existent entities
  const allEntities = [
    ...world.characters.map(e => ({ ...e, type: "character" })),
    ...world.locations.map(e => ({ ...e, type: "location" })),
    ...world.events.map(e => ({ ...e, type: "event" })),
    ...world.items.map(e => ({ ...e, type: "item" })),
  ];

  for (const entity of allEntities) {
    if (!entity.description) continue;

    // Use LLM to extract proper nouns that might be entity references
    const prompt = `Extract all proper nouns (names of people, places, events, items) from this text:

${entity.description}

Respond with JSON: { "properNouns": ["Name1", "Name2", ...] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const properNouns = result.properNouns || [];

    // Check if any proper nouns are not in entity list
    const orphaned = properNouns.filter((noun: string) =>
      !allEntityNames.some(name => name.toLowerCase() === noun.toLowerCase())
    );

    if (orphaned.length > 0) {
      issues.push({
        id: `orphaned-${entity.id}`,
        severity: "low",
        category: "reference",
        title: "Potential Orphaned References",
        description: `${entity.name} mentions: ${orphaned.join(", ")} - these entities don't exist in the world.`,
        affectedEntities: [{ id: entity.id, type: entity.type, name: entity.name }],
        suggestedFix: "Create these entities or remove references.",
      });
    }
  }

  return issues;
}
```

---

## 4. Writing Prompts

### Implementation

```typescript
// src/lib/ai/prompt-service.ts

import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface WritingPrompt {
  id: string;
  type: "story-starter" | "quest-hook" | "conflict" | "scene";
  title: string;
  prompt: string;
  involvedEntities: Array<{ id: string; type: string; name: string }>;
}

export async function generateWritingPrompts(
  worldId: string,
  count: number = 5
): Promise<WritingPrompt[]> {
  // 1. Select random entities
  const characters = await prisma.character.findMany({
    where: { worldId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const locations = await prisma.location.findMany({
    where: { worldId },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  const relationships = await prisma.relationship.findMany({
    where: { sourceCharacter: { worldId } },
    include: {
      sourceCharacter: true,
      targetCharacter: true,
    },
    take: 10,
  });

  // 2. Build context
  const context = `Characters:
${characters.map(c => `- ${c.name}: ${c.description || "No description"}`).join("\n")}

Locations:
${locations.map(l => `- ${l.name}: ${l.description || "No description"}`).join("\n")}

Relationships:
${relationships.map(r => `- ${r.sourceCharacter.name} (${r.relationType}) ${r.targetCharacter.name}`).join("\n")}`;

  // 3. Generate prompts with LLM
  const prompt = `You are a creative writing coach generating story prompts for a writer.

World Context:
${context}

Task: Generate ${count} diverse writing prompts using these entities. Include:
- ${Math.ceil(count * 0.3)} story starters (opening scenes)
- ${Math.ceil(count * 0.3)} quest hooks (adventure ideas)
- ${Math.ceil(count * 0.2)} conflicts (dramatic tensions)
- ${Math.ceil(count * 0.2)} scenes (specific moments)

For each prompt:
1. Type (story-starter, quest-hook, conflict, or scene)
2. Title (catchy 3-5 word title)
3. Prompt (2-3 sentences describing the situation)
4. Involved entities (list of character/location names used)

Respond with JSON: { "prompts": [...] }`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      { role: "system", content: "You are a creative writing coach. Respond with valid JSON only." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.9,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No response from OpenAI");

  const result = JSON.parse(content);

  // 4. Map back to entity IDs
  const allEntities = [
    ...characters.map(c => ({ id: c.id, type: "character", name: c.name })),
    ...locations.map(l => ({ id: l.id, type: "location", name: l.name })),
  ];

  return (result.prompts || []).map((p: any, index: number) => ({
    id: `prompt-${Date.now()}-${index}`,
    type: p.type,
    title: p.title,
    prompt: p.prompt,
    involvedEntities: (p.involvedEntities || [])
      .map((name: string) => allEntities.find(e => e.name === name))
      .filter(Boolean),
  }));
}
```

---

## 5. Rate Limiting

### Implementation

```typescript
// src/lib/ai/rate-limit.ts

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { prisma } from "@/lib/prisma";

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

// Premium tier: 100 generations per hour (effectively unlimited)
const premiumTierRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 h"),
  analytics: true,
  prefix: "@worldcrafter/ai-premium",
});

export async function checkRateLimit(userId: string): Promise<boolean> {
  // 1. Get user's quota
  let quota = await prisma.aiQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    // Create initial quota
    quota = await prisma.aiQuota.create({
      data: {
        userId,
        tier: "free",
        generationsUsed: 0,
        generationsLimit: 5,
        resetAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      },
    });
  }

  // 2. Check if reset is needed
  if (new Date() > quota.resetAt) {
    quota = await prisma.aiQuota.update({
      where: { userId },
      data: {
        generationsUsed: 0,
        resetAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }

  // 3. Apply rate limit
  const ratelimit = quota.tier === "premium" ? premiumTierRatelimit : freeTierRatelimit;
  const { success } = await ratelimit.limit(userId);

  if (success) {
    // Increment usage
    await prisma.aiQuota.update({
      where: { userId },
      data: { generationsUsed: { increment: 1 } },
    });
  }

  return success;
}

export async function getQuotaStatus(userId: string) {
  const quota = await prisma.aiQuota.findUnique({
    where: { userId },
  });

  if (!quota) {
    return {
      tier: "free",
      used: 0,
      limit: 5,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  return {
    tier: quota.tier,
    used: quota.generationsUsed,
    limit: quota.generationsLimit,
    resetAt: quota.resetAt,
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
```

---

## 6. Streaming Responses

### Implementation

```typescript
// src/app/api/ai/generate-stream/route.ts

import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { buildWorldContext, buildGenerationPrompt } from "@/lib/ai/generation-service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Parse request
    const { worldId, entityType, options } = await req.json();

    // 3. Build context and prompt
    const context = await buildWorldContext(worldId);
    const prompt = buildGenerationPrompt(context, entityType, options);

    // 4. Stream response
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      stream: true,
      messages: [
        { role: "system", content: "You are a creative world-building assistant. Respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: options.temperature || 0.7,
      max_tokens: 2000,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Streaming error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

#### Client Component with Streaming

```typescript
// src/components/ai/StreamingGenerator.tsx

"use client";

import { useState } from "react";
import { useCompletion } from "ai/react";

export function StreamingGenerator({ worldId, entityType }: { worldId: string; entityType: string }) {
  const { completion, complete, isLoading } = useCompletion({
    api: "/api/ai/generate-stream",
  });

  const handleGenerate = async () => {
    await complete(JSON.stringify({
      worldId,
      entityType,
      options: { detailLevel: "standard", style: "neutral" },
    }));
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Generating..." : "Generate with AI"}
      </button>

      {completion && (
        <div className="p-4 bg-gray-100 rounded-md whitespace-pre-wrap">
          {completion}
        </div>
      )}
    </div>
  );
}
```

---

## Environment Variables

Add to `.env`:

```bash
# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
AI_PROVIDER="openai" # or "anthropic"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Optional: Cost tracking
AI_COST_ALERT_THRESHOLD=10.00 # Alert when user exceeds $10
```

---

## Database Migration

```bash
# 1. Add pgvector extension (run once in Supabase SQL editor)
CREATE EXTENSION IF NOT EXISTS vector;

# 2. Create migration
npx prisma migrate dev --name add_ai_features

# 3. Apply RLS policies
npm run db:rls
```

---

## Testing Strategy

### Unit Tests

```typescript
// src/lib/ai/__tests__/generation-service.test.ts

import { describe, it, expect, vi } from "vitest";
import { buildWorldContext, buildGenerationPrompt } from "../generation-service";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    world: {
      findUnique: vi.fn(),
    },
  },
}));

describe("AI Generation Service", () => {
  it("builds world context correctly", async () => {
    vi.mocked(prisma.world.findUnique).mockResolvedValue({
      id: "world1",
      name: "Test World",
      genre: "fantasy",
      description: "A magical realm",
      characters: [{ name: "Hero", description: "Brave warrior" }],
      locations: [],
      events: [],
      items: [],
      relationships: [],
    } as any);

    const context = await buildWorldContext("world1");

    expect(context.name).toBe("Test World");
    expect(context.entities).toHaveLength(1);
    expect(context.entities[0].name).toBe("Hero");
  });

  it("generates appropriate prompt", () => {
    const context = {
      id: "world1",
      name: "Test World",
      genre: "fantasy",
      description: "A magical realm",
      entities: [{ type: "character", name: "Hero", description: "Brave warrior" }],
      relationships: [],
    };

    const prompt = buildGenerationPrompt(context, "character", {
      entityType: "character",
      detailLevel: "standard",
      style: "neutral",
      includeRelationships: true,
      temperature: 0.7,
    });

    expect(prompt).toContain("Test World");
    expect(prompt).toContain("fantasy");
    expect(prompt).toContain("Hero");
  });
});
```

### Integration Tests

```typescript
// src/app/__tests__/ai-generation.integration.test.ts

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateEntity } from "@/app/worlds/[worldId]/actions/ai-generate";

describe("AI Generation Integration", () => {
  let testWorldId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test world
    const world = await prisma.world.create({
      data: {
        name: "Test World",
        genre: "fantasy",
        userId: "test-user",
      },
    });
    testWorldId = world.id;
    testUserId = "test-user";
  });

  afterAll(async () => {
    await prisma.world.delete({ where: { id: testWorldId } });
  });

  it("generates character with AI", async () => {
    const result = await generateEntity(testWorldId, "character", {
      entityType: "character",
      detailLevel: "brief",
      style: "neutral",
      includeRelationships: false,
      temperature: 0.5,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("name");
    expect(result.data).toHaveProperty("description");
  }, 30000); // 30 second timeout for API call
});
```

---

## Usage Examples

### Generate Character

```typescript
import { generateEntity } from "@/app/worlds/[worldId]/actions/ai-generate";

const result = await generateEntity("world-id", "character", {
  entityType: "character",
  detailLevel: "detailed",
  style: "dramatic",
  includeRelationships: true,
  temperature: 0.8,
});

if (result.success) {
  console.log("Generated character:", result.data);
}
```

### Suggest Relationships

```typescript
import { suggestRelationships } from "@/lib/ai/relationship-service";

const suggestions = await suggestRelationships(
  "character-id",
  "character",
  "world-id"
);

console.log("Suggested relationships:", suggestions);
```

### Check Consistency

```typescript
import { checkWorldConsistency } from "@/lib/ai/consistency-service";

const issues = await checkWorldConsistency("world-id");

console.log("Consistency issues found:", issues.length);
issues.forEach(issue => {
  console.log(`[${issue.severity}] ${issue.title}: ${issue.description}`);
});
```

### Generate Writing Prompts

```typescript
import { generateWritingPrompts } from "@/lib/ai/prompt-service";

const prompts = await generateWritingPrompts("world-id", 10);

console.log("Writing prompts:", prompts);
```

---

## Cost Tracking

Track AI costs per user in `ai_generations` table. Run periodic reports:

```typescript
// src/lib/ai/cost-tracking.ts

export async function getUserAiCosts(userId: string, startDate: Date, endDate: Date) {
  const generations = await prisma.aiGeneration.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      cost: true,
      tokensUsed: true,
      provider: true,
      model: true,
    },
  });

  const totalCost = generations.reduce((sum, g) => sum + Number(g.cost), 0);
  const totalTokens = generations.reduce((sum, g) => sum + g.tokensUsed, 0);

  return {
    totalCost,
    totalTokens,
    generationCount: generations.length,
    byProvider: {
      openai: generations.filter(g => g.provider === "openai").length,
      anthropic: generations.filter(g => g.provider === "anthropic").length,
    },
  };
}
```

---

## Performance Considerations

1. **Cache embeddings**: Regenerate only when entity description changes
2. **Batch operations**: Process multiple entities in parallel where possible
3. **Use cheaper models**: GPT-3.5 for simple tasks, GPT-4 for complex
4. **Implement timeouts**: Cancel long-running requests
5. **Monitor costs**: Alert when user exceeds threshold

---

## Security Considerations

1. **Validate all inputs**: Use Zod schemas on server
2. **Rate limit aggressively**: Prevent abuse
3. **Sanitize LLM output**: Never execute generated code
4. **Log all generations**: For debugging and cost tracking
5. **RLS policies**: Ensure users can only generate for their worlds

---

## Future Enhancements

1. **Image Generation**: DALL-E 3 for character portraits, location maps
2. **Voice Narration**: Text-to-speech for descriptions
3. **Collaborative Editing**: Real-time AI suggestions while editing
4. **World Templates**: Pre-built worlds with AI-generated content
5. **Export to PDF/EPUB**: Generate formatted world guides
6. **Interactive Chatbot**: Ask questions about your world

---

## Troubleshooting

### Issue: Rate limit errors from OpenAI

**Solution:** Implement exponential backoff and use GPT-3.5 for non-critical tasks.

### Issue: Embeddings out of sync

**Solution:** Run batch job to regenerate all embeddings:

```bash
npm run db:regenerate-embeddings
```

### Issue: High costs

**Solution:** Review `ai_generations` table, implement stricter rate limits, use cheaper models.

---

## References

- OpenAI API: https://platform.openai.com/docs
- Anthropic API: https://docs.anthropic.com
- Vercel AI SDK: https://sdk.vercel.ai/docs
- pgvector: https://github.com/pgvector/pgvector
- Upstash Redis: https://docs.upstash.com/redis
