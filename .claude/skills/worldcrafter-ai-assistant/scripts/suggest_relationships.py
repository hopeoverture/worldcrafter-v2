#!/usr/bin/env python3
"""
AI Relationship Suggestion Script

Analyzes entities and suggests meaningful relationships using embeddings + LLM.

Usage:
    python suggest_relationships.py --world-id <id> --entity-id <id> --entity-type character
"""

import os
import json
import argparse
from typing import Dict, Any, List, Tuple
import numpy as np
import openai
from anthropic import Anthropic

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Similarity threshold
SIMILARITY_THRESHOLD = 0.7


class RelationshipSuggester:
    """AI-powered relationship suggestion engine"""

    def __init__(self):
        if OPENAI_API_KEY:
            self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        else:
            raise ValueError("OPENAI_API_KEY required for embeddings")

        if ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""

        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding

        except Exception as e:
            print(f"✗ Embedding generation failed: {e}")
            return []

    def cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""

        if not a or not b:
            return 0.0

        a_np = np.array(a)
        b_np = np.array(b)

        dot_product = np.dot(a_np, b_np)
        norm_a = np.linalg.norm(a_np)
        norm_b = np.linalg.norm(b_np)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    def find_similar_entities(
        self,
        source_entity: Dict[str, Any],
        all_entities: List[Dict[str, Any]],
        top_k: int = 10,
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Find most similar entities using embeddings"""

        print("🔍 Generating embeddings...")

        # Generate embedding for source
        source_text = f"{source_entity['name']}\n\n{source_entity.get('description', '')}"
        source_embedding = self.generate_embedding(source_text)

        if not source_embedding:
            return []

        # Calculate similarity with all entities
        similarities = []
        for entity in all_entities:
            if entity["id"] == source_entity["id"]:
                continue

            entity_text = f"{entity['name']}\n\n{entity.get('description', '')}"
            entity_embedding = self.generate_embedding(entity_text)

            if entity_embedding:
                similarity = self.cosine_similarity(source_embedding, entity_embedding)
                similarities.append((entity, similarity))

        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]

    def suggest_relationships_with_llm(
        self,
        source_entity: Dict[str, Any],
        candidates: List[Tuple[Dict[str, Any], float]],
        provider: str = "openai",
    ) -> List[Dict[str, Any]]:
        """Use LLM to generate relationship suggestions"""

        if not candidates:
            return []

        print(f"🤖 Generating suggestions with {provider}...")

        # Build prompt
        candidates_text = "\n".join([
            f"{i + 1}. {entity['type']}: {entity['name']} (similarity: {similarity:.2f})\n"
            f"   Description: {entity.get('description', 'No description')[:200]}"
            for i, (entity, similarity) in enumerate(candidates)
        ])

        prompt = f"""You are a world-building assistant analyzing relationships between entities.

Source Entity ({source_entity['type']}):
Name: {source_entity['name']}
Description: {source_entity.get('description', 'No description')}

Candidate Entities (ordered by similarity):
{candidates_text}

Task: Suggest 3-5 meaningful relationships between the source entity and candidates.

For each suggestion, provide:
1. targetEntityName (exact name from candidates)
2. relationType (ally, enemy, mentor, student, lover, rival, employer, employee, family, friend, etc.)
3. reasoning (2-3 sentences explaining why this relationship makes sense)
4. strength (0.0-1.0, how strong/important this relationship is)

Focus on relationships that:
- Create interesting narrative opportunities
- Make sense given the entities' descriptions
- Add depth to the world

Respond with JSON: {{"suggestions": [...]}}"""

        try:
            if provider == "openai":
                return self._suggest_with_openai(prompt)
            elif provider == "anthropic":
                return self._suggest_with_anthropic(prompt)
            else:
                raise ValueError(f"Unknown provider: {provider}")

        except Exception as e:
            print(f"✗ LLM suggestion failed: {e}")
            return []

    def _suggest_with_openai(self, prompt: str) -> List[Dict[str, Any]]:
        """Generate suggestions with OpenAI"""

        response = self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a creative world-building assistant. Respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        content = response.choices[0].message.content
        if not content:
            return []

        result = json.loads(content)
        return result.get("suggestions", [])

    def _suggest_with_anthropic(self, prompt: str) -> List[Dict[str, Any]]:
        """Generate suggestions with Anthropic"""

        response = self.anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            temperature=0.7,
            messages=[
                {
                    "role": "user",
                    "content": prompt + "\n\nRespond with ONLY a valid JSON object, no additional text.",
                }
            ],
        )

        content_block = response.content[0]
        if content_block.type != "text":
            return []

        result = json.loads(content_block.text)
        return result.get("suggestions", [])

    def suggest(
        self,
        source_entity: Dict[str, Any],
        all_entities: List[Dict[str, Any]],
        provider: str = "openai",
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """Generate relationship suggestions"""

        # Find similar entities
        similar_entities = self.find_similar_entities(source_entity, all_entities, top_k)

        if not similar_entities:
            print("✗ No similar entities found")
            return []

        print(f"✓ Found {len(similar_entities)} similar entities")

        # Generate suggestions with LLM
        suggestions = self.suggest_relationships_with_llm(
            source_entity,
            similar_entities,
            provider,
        )

        # Enrich suggestions with entity IDs
        for suggestion in suggestions:
            for entity, similarity in similar_entities:
                if entity["name"] == suggestion["targetEntityName"]:
                    suggestion["targetEntityId"] = entity["id"]
                    suggestion["targetEntityType"] = entity["type"]
                    suggestion["similarity"] = similarity
                    break

        return suggestions


def load_world_data(world_id: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Load all entities from world"""

    # For demo purposes, load from JSON file
    # In production, this would query the database
    world_file = f"world_{world_id}_data.json"

    if os.path.exists(world_file):
        with open(world_file, "r") as f:
            return json.load(f)

    # Return sample data for testing
    return {
        "entities": [
            {
                "id": "char1",
                "type": "character",
                "name": "Aria Stormwind",
                "description": "A powerful mage who controls the winds and storms.",
            },
            {
                "id": "char2",
                "type": "character",
                "name": "Theron Blackforge",
                "description": "A master blacksmith who crafts legendary weapons.",
            },
            {
                "id": "loc1",
                "type": "location",
                "name": "The Crystal Tower",
                "description": "A tall tower made of crystal where mages study.",
            },
        ],
    }


def save_suggestions(suggestions: List[Dict[str, Any]], output_file: str):
    """Save suggestions to JSON file"""

    with open(output_file, "w") as f:
        json.dump({"suggestions": suggestions}, f, indent=2)

    print(f"✓ Suggestions saved to {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Suggest entity relationships with AI")
    parser.add_argument("--world-id", required=True, help="World ID")
    parser.add_argument("--entity-id", required=True, help="Entity ID")
    parser.add_argument(
        "--entity-type",
        required=True,
        choices=["character", "location", "event", "item"],
        help="Entity type",
    )
    parser.add_argument(
        "--provider",
        default="openai",
        choices=["openai", "anthropic"],
        help="AI provider for suggestion generation",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=10,
        help="Number of similar entities to consider",
    )
    parser.add_argument(
        "--output",
        default="relationship_suggestions.json",
        help="Output file path",
    )

    args = parser.parse_args()

    print(f"🔗 Suggesting relationships for entity {args.entity_id}")

    # Load world data
    world_data = load_world_data(args.world_id)
    all_entities = world_data.get("entities", [])

    print(f"   Loaded {len(all_entities)} entities from world")

    # Find source entity
    source_entity = None
    for entity in all_entities:
        if entity["id"] == args.entity_id and entity["type"] == args.entity_type:
            source_entity = entity
            break

    if not source_entity:
        print(f"✗ Entity {args.entity_id} not found")
        return 1

    print(f"   Source: {source_entity['name']} ({source_entity['type']})")

    # Generate suggestions
    suggester = RelationshipSuggester()
    suggestions = suggester.suggest(
        source_entity=source_entity,
        all_entities=all_entities,
        provider=args.provider,
        top_k=args.top_k,
    )

    if suggestions:
        print(f"\n✓ Generated {len(suggestions)} relationship suggestions:\n")

        for i, suggestion in enumerate(suggestions, 1):
            print(f"{i}. {suggestion['targetEntityName']} ({suggestion['relationType']})")
            print(f"   Strength: {suggestion['strength']:.2f}")
            print(f"   Reasoning: {suggestion['reasoning']}")
            print()

        # Save to file
        save_suggestions(suggestions, args.output)

        return 0
    else:
        print("✗ No suggestions generated")
        return 1


if __name__ == "__main__":
    exit(main())
