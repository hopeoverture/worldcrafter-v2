# AI Prompts Reference

Comprehensive prompt templates for all AI features in WorldCrafter.

## Entity Generation Prompts

### Character Generation

```
You are a creative world-building assistant for "{worldName}", a {genre} world.

World Description: {worldDescription}

Existing Characters:
{existingCharacters}

Existing Locations:
{existingLocations}

Task: Generate a new character that fits naturally into this world.

Requirements:
- {detailLevel}: {detailInstructions}
- {style}: {styleInstructions}
- Ensure consistency with existing world lore
- Avoid duplicating existing character names
- Consider the world's genre and tone
{includeRelationships ? "- Suggest 2-3 meaningful relationships with existing entities" : ""}

Return a JSON object with the following structure:
{
  "name": "string (1-255 characters)",
  "description": "string (10-5000 characters, main description)",
  "physicalDescription": "string (optional, appearance details)",
  "personality": "string (optional, personality traits)",
  "background": "string (optional, backstory)",
  "motivations": ["string", ...] (optional, goals and drives),
  "secrets": ["string", ...] (optional, hidden information),
  "skills": ["string", ...] (optional, abilities and talents),
  "relationships": [
    {
      "entityName": "string (existing entity name)",
      "relationType": "string (ally, enemy, mentor, etc.)",
      "description": "string (1-2 sentences about relationship)"
    }
  ] (optional, if includeRelationships is true)
}

Make the character compelling, original, and well-suited to {genre} stories.
```

### Location Generation

```
You are a creative world-building assistant for "{worldName}", a {genre} world.

World Description: {worldDescription}

Existing Locations:
{existingLocations}

Existing Characters:
{existingCharacters}

Task: Generate a new location that fits naturally into this world.

Requirements:
- {detailLevel}: {detailInstructions}
- {style}: {styleInstructions}
- Consider geography, climate, and culture
- Ensure consistency with existing world lore
- Avoid duplicating existing location names

Return a JSON object with the following structure:
{
  "name": "string (1-255 characters)",
  "description": "string (10-5000 characters, main description)",
  "locationType": "string (optional, e.g., city, forest, dungeon)",
  "geography": "string (optional, terrain and landscape)",
  "climate": "string (optional, weather patterns)",
  "culture": "string (optional, inhabitants and customs)",
  "economy": "string (optional, trade and resources)",
  "notableFeatures": ["string", ...] (optional, landmarks),
  "inhabitants": ["string", ...] (optional, who lives here)
}

Create a vivid, immersive location that enhances the world.
```

### Event Generation

```
You are a creative world-building assistant for "{worldName}", a {genre} world.

World Description: {worldDescription}

Existing Events:
{existingEvents}

Existing Characters:
{existingCharacters}

Existing Locations:
{existingLocations}

Task: Generate a new event that fits naturally into this world's history or timeline.

Requirements:
- {detailLevel}: {detailInstructions}
- {style}: {styleInstructions}
- Consider cause and effect
- Ensure temporal consistency
- Connect to existing entities where appropriate

Return a JSON object with the following structure:
{
  "name": "string (1-255 characters)",
  "description": "string (10-5000 characters, main description)",
  "eventType": "string (optional, e.g., battle, festival, discovery)",
  "date": "string (optional, ISO date or narrative date)",
  "duration": "string (optional, how long it lasted)",
  "participants": ["string", ...] (optional, who was involved),
  "location": "string (optional, where it occurred)",
  "consequences": ["string", ...] (optional, what changed),
  "significance": "string (optional, why it matters)"
}

Create an event that adds depth and history to the world.
```

### Item Generation

```
You are a creative world-building assistant for "{worldName}", a {genre} world.

World Description: {worldDescription}

Existing Items:
{existingItems}

Task: Generate a new item that fits naturally into this world.

Requirements:
- {detailLevel}: {detailInstructions}
- {style}: {styleInstructions}
- Consider the item's purpose and history
- Balance power level appropriately for {genre}
- Avoid duplicating existing items

Return a JSON object with the following structure:
{
  "name": "string (1-255 characters)",
  "description": "string (10-5000 characters, main description)",
  "itemType": "string (optional, e.g., weapon, artifact, tool)",
  "rarity": "string (optional, common/uncommon/rare/legendary)",
  "properties": ["string", ...] (optional, special characteristics),
  "history": "string (optional, backstory)",
  "currentOwner": "string (optional, who has it)",
  "powers": ["string", ...] (optional, magical/special abilities)
}

Create an item with interesting lore and narrative potential.
```

---

## Relationship Suggestion Prompts

### Finding Similar Entities

```
You are a world-building assistant analyzing relationships between entities.

Source Entity ({sourceType}):
Name: {sourceName}
Description: {sourceDescription}

Candidate Entities (ordered by similarity):
{candidateList}

Task: Suggest 3-5 meaningful relationships between the source entity and candidates.

For each suggestion, provide:
1. targetEntityName (exact name from candidates)
2. relationType (ally, enemy, mentor, student, lover, rival, employer, employee, family, friend, etc.)
3. reasoning (2-3 sentences explaining why this relationship makes sense narratively)
4. strength (0.0-1.0, representing how strong/important this relationship is)

Focus on relationships that:
- Create interesting narrative opportunities
- Make logical sense given the entities' descriptions
- Add depth and interconnection to the world
- Respect the genre and tone
- Avoid clichés unless they serve the story

Respond with JSON:
{
  "suggestions": [
    {
      "targetEntityName": "string",
      "relationType": "string",
      "reasoning": "string",
      "strength": 0.8
    },
    ...
  ]
}
```

---

## Consistency Checking Prompts

### Date Conflict Analysis

```
Analyze this temporal relationship for consistency:

Event 1: "{event1Name}" (Date: {event1Date})
Description: {event1Description}

Event 2: "{event2Name}" (Date: {event2Date})

Event 1's description mentions Event 2. Are the dates consistent with the narrative context?

Consider:
- Does Event 1 reference Event 2 as happening before, after, or during?
- Do the actual dates support this temporal relationship?
- Are there any logical impossibilities?

Respond with JSON:
{
  "consistent": true/false,
  "explanation": "Brief explanation of the consistency or conflict",
  "severity": "low/medium/high/critical"
}
```

### Description Contradiction Detection

```
Analyze this {entityType} description for internal contradictions:

Name: {entityName}
Description: {entityDescription}

Look for:
- Contradictory statements (e.g., "always calm" vs "quick to anger")
- Impossible traits (e.g., age conflicts, physical impossibilities)
- Logical inconsistencies (e.g., "hates magic" but "powerful mage")
- Timeline conflicts (e.g., "born in 1990" vs "fought in WWI")

Respond with JSON:
{
  "hasContradictions": true/false,
  "contradictions": [
    {
      "issue": "Description of the specific contradiction",
      "severity": "low/medium/high"
    }
  ]
}

Be thorough but avoid false positives. Some apparent contradictions may be intentional character complexity.
```

### Orphaned Reference Extraction

```
Extract all proper nouns (names of people, places, events, items) from this text:

{entityDescription}

Only extract capitalized names that appear to reference specific entities in the world.
Exclude:
- Generic nouns that happen to be capitalized
- Common place names (e.g., "the Forest" vs "The Whispering Woods")
- Pronouns and titles

Respond with JSON:
{
  "properNouns": ["Name1", "Name2", ...]
}
```

### Relationship Contradiction Check

```
Are these relationship types contradictory or inconsistent?

Relationship types between two entities: {relationshipTypes}

Consider:
- Can these relationships coexist? (e.g., "ally" and "enemy" are contradictory)
- Do they represent different time periods? (e.g., "mentor" then "rival")
- Are they complementary? (e.g., "employer" and "friend")

Respond with JSON:
{
  "contradictory": true/false,
  "explanation": "Brief explanation",
  "severity": "low/medium/high"
}
```

---

## Writing Prompt Generation

### General Prompt Generation

```
You are a creative writing coach generating story prompts for a writer.

World Context:
Genre: {genre}
Description: {worldDescription}

Characters:
{characterList}

Locations:
{locationList}

Relationships:
{relationshipList}

Task: Generate {count} diverse writing prompts using these entities.

Distribution:
- {storyStarterCount} story starters (opening scenes that hook the reader)
- {questHookCount} quest hooks (adventure ideas and missions)
- {conflictCount} conflicts (dramatic tensions and problems to solve)
- {sceneCount} scenes (specific moments and character interactions)

For each prompt:
1. type: "story-starter" | "quest-hook" | "conflict" | "scene"
2. title: Catchy 3-5 word title that sparks interest
3. prompt: 2-3 sentences describing the situation, conflict, or scene
4. involvedEntities: Array of entity names used (for linking)

Guidelines:
- Use multiple entities to create interesting dynamics
- Focus on conflict, choice, and character development
- Make prompts specific enough to be actionable
- Leave room for writer interpretation
- Vary tones from light to dark, simple to complex

Respond with JSON:
{
  "prompts": [
    {
      "type": "story-starter",
      "title": "The Missing Heirloom",
      "prompt": "When the ancient crown disappears from the vault, suspicion falls on the new guard. But she knows the real thief is someone much closer to the throne.",
      "involvedEntities": ["Crown of Ages", "Guard Captain Aria", "Queen Elara"]
    },
    ...
  ]
}
```

---

## Advanced Prompt Techniques

### Few-Shot Learning

Add examples to improve output quality:

```
Here are examples of well-written characters:

Example 1:
{
  "name": "Kael Shadowmend",
  "description": "A former assassin turned priest, Kael carries the weight of his past in every deliberate movement. His hands, once instruments of death, now heal the sick in the Temple of Dawn. But when darkness threatens the city, he must decide if redemption means forsaking his deadly skills forever.",
  "personality": "Quiet and contemplative, struggling with guilt but driven by hope for redemption."
}

Example 2:
{
  "name": "Lyra Brightforge",
  "description": "The youngest master blacksmith in guild history, Lyra's talent is matched only by her stubbornness. She refuses to forge weapons for the war, insisting that her craft should build, not destroy. This stance has made her both admired and reviled in equal measure.",
  "personality": "Principled and passionate, willing to stand alone for her beliefs."
}

Now generate a new character in this style for {worldName}:
```

### Chain-of-Thought Prompting

For complex analysis:

```
Analyze this world for consistency issues. Think step by step:

Step 1: List all temporal references (dates, "before", "after", etc.)
Step 2: Construct a timeline from these references
Step 3: Identify any conflicts or impossibilities
Step 4: Rate the severity of each conflict
Step 5: Suggest fixes

World data:
{worldData}

Respond with your analysis in JSON format.
```

### Constrained Generation

For specific requirements:

```
Generate a character with these MANDATORY traits:
- Name must start with "A"
- Must be a magic user
- Must have a tragic backstory
- Must have at least one enemy relationship
- Description must be exactly 2 paragraphs

All other details are flexible. Follow the standard character schema.
```

---

## Prompt Optimization Tips

### 1. Be Specific

**Bad:** "Generate a character"
**Good:** "Generate a fantasy character for a dark medieval world, focusing on moral ambiguity"

### 2. Provide Context

Always include:
- World genre and tone
- Existing entities (to avoid duplicates)
- Style preferences
- Detail level required

### 3. Use Structured Output

Always request JSON with specific schemas. This ensures:
- Type safety
- Validation compatibility
- Consistent parsing

### 4. Set Boundaries

Specify:
- Character limits (1-255 for names, 10-5000 for descriptions)
- Exclusions (avoid duplicates, certain themes)
- Required fields vs optional fields

### 5. Temperature Settings

- **0.3-0.5:** Consistency checking, analysis (more deterministic)
- **0.7-0.9:** Entity generation, writing prompts (more creative)
- **1.0+:** Experimental, highly creative content

### 6. Handle Edge Cases

```
If there are no existing characters in the world, create a protagonist-type character.
If the world has 50+ characters, focus on creating supporting or background characters.
If the genre is unclear, default to generic fantasy.
```

---

## Prompt Testing Checklist

Before deploying a prompt:

- [ ] Test with empty/minimal world data
- [ ] Test with rich world data (50+ entities)
- [ ] Test with different genres
- [ ] Test with different detail levels
- [ ] Verify JSON output is valid and matches schema
- [ ] Check for hallucinations (invented entity names)
- [ ] Validate character limits are respected
- [ ] Test with different AI providers (OpenAI vs Anthropic)
- [ ] Measure token usage and cost
- [ ] Verify relationship suggestions are logical

---

## Version History

- v1.0.0 (2025-01-09): Initial prompt templates
