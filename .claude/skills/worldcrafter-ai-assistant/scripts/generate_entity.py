#!/usr/bin/env python3
"""
AI Entity Generation Script

Standalone script for generating entities using OpenAI/Anthropic APIs.
Can be used for batch processing or CLI-based generation.

Usage:
    python generate_entity.py --world-id <id> --type character --detail standard
"""

import os
import json
import argparse
from typing import Dict, Any, List, Optional
from datetime import datetime
import openai
from anthropic import Anthropic

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEFAULT_PROVIDER = os.getenv("AI_PROVIDER", "openai")

# Cost tracking (per 1k tokens)
COSTS = {
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "claude-3-5-sonnet": {"input": 0.003, "output": 0.015},
}


class EntityGenerator:
    """AI-powered entity generator with multiple provider support"""

    def __init__(self, provider: str = DEFAULT_PROVIDER):
        self.provider = provider

        if provider == "openai" and OPENAI_API_KEY:
            self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        elif provider == "anthropic" and ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
        else:
            raise ValueError(f"Invalid provider or missing API key: {provider}")

    def build_prompt(
        self,
        world_context: Dict[str, Any],
        entity_type: str,
        detail_level: str = "standard",
        style: str = "neutral",
    ) -> str:
        """Build generation prompt from world context"""

        detail_instructions = {
            "brief": "Keep descriptions concise (2-3 sentences).",
            "standard": "Provide moderate detail (1-2 paragraphs).",
            "detailed": "Create rich, detailed descriptions (3-5 paragraphs).",
        }

        style_instructions = {
            "neutral": "Use a neutral, informative tone.",
            "dramatic": "Use dramatic, evocative language.",
            "mysterious": "Add mystery and intrigue.",
            "heroic": "Emphasize heroism and nobility.",
        }

        entities_list = "\n".join([
            f"- {e['type']}: {e['name']} - {e['description'][:100]}"
            for e in world_context.get("entities", [])[:20]
        ])

        relationships_list = "\n".join([
            f"- {r['sourceName']} ({r['relationType']}) {r['targetName']}"
            for r in world_context.get("relationships", [])[:10]
        ])

        return f"""You are a creative world-building assistant for "{world_context['name']}", a {world_context.get('genre', 'fantasy')} world.

World Description: {world_context.get('description', 'No description provided')}

Existing Entities:
{entities_list}

Existing Relationships:
{relationships_list}

Task: Generate a new {entity_type} that fits naturally into this world.

Requirements:
- {detail_instructions[detail_level]}
- {style_instructions[style]}
- Ensure consistency with existing world lore
- Avoid duplicating existing entity names
- Suggest 2-3 relationships with existing entities

Return a valid JSON object with appropriate fields for a {entity_type}."""

    def generate_with_openai(
        self,
        prompt: str,
        model: str = "gpt-4-turbo-preview",
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Generate entity using OpenAI API"""

        try:
            response = self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a creative world-building assistant. Always respond with valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=temperature,
                max_tokens=2000,
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")

            result = json.loads(content)

            # Calculate cost
            usage = response.usage
            if usage:
                cost = self._calculate_cost(
                    model,
                    usage.prompt_tokens,
                    usage.completion_tokens,
                )
            else:
                cost = 0.0

            return {
                "success": True,
                "data": result,
                "metadata": {
                    "provider": "openai",
                    "model": model,
                    "tokens_used": usage.total_tokens if usage else 0,
                    "cost": cost,
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    def generate_with_anthropic(
        self,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022",
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Generate entity using Anthropic API"""

        try:
            response = self.anthropic_client.messages.create(
                model=model,
                max_tokens=2000,
                temperature=temperature,
                messages=[
                    {
                        "role": "user",
                        "content": prompt + "\n\nRespond with ONLY a valid JSON object, no additional text.",
                    }
                ],
            )

            content_block = response.content[0]
            if content_block.type != "text":
                raise ValueError("Unexpected response type from Anthropic")

            result = json.loads(content_block.text)

            # Calculate cost
            cost = self._calculate_cost(
                model,
                response.usage.input_tokens,
                response.usage.output_tokens,
            )

            return {
                "success": True,
                "data": result,
                "metadata": {
                    "provider": "anthropic",
                    "model": model,
                    "tokens_used": response.usage.input_tokens + response.usage.output_tokens,
                    "cost": cost,
                },
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    def generate(
        self,
        world_context: Dict[str, Any],
        entity_type: str,
        detail_level: str = "standard",
        style: str = "neutral",
        temperature: float = 0.7,
    ) -> Dict[str, Any]:
        """Generate entity using configured provider"""

        prompt = self.build_prompt(world_context, entity_type, detail_level, style)

        if self.provider == "openai":
            return self.generate_with_openai(prompt, temperature=temperature)
        elif self.provider == "anthropic":
            return self.generate_with_anthropic(prompt, temperature=temperature)
        else:
            return {"success": False, "error": f"Unknown provider: {self.provider}"}

    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on token usage"""

        if model not in COSTS:
            return 0.0

        costs = COSTS[model]
        return (input_tokens / 1000) * costs["input"] + (output_tokens / 1000) * costs["output"]


def load_world_context(world_id: str) -> Optional[Dict[str, Any]]:
    """Load world context from database or JSON file"""

    # For demo purposes, load from JSON file
    # In production, this would query the database
    context_file = f"world_{world_id}_context.json"

    if os.path.exists(context_file):
        with open(context_file, "r") as f:
            return json.load(f)

    # Return minimal context for testing
    return {
        "id": world_id,
        "name": "Example World",
        "genre": "fantasy",
        "description": "A magical realm filled with adventure",
        "entities": [],
        "relationships": [],
    }


def save_result(result: Dict[str, Any], output_file: str):
    """Save generation result to JSON file"""

    with open(output_file, "w") as f:
        json.dump(result, f, indent=2)

    print(f"✓ Result saved to {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate entities with AI")
    parser.add_argument("--world-id", required=True, help="World ID")
    parser.add_argument(
        "--type",
        required=True,
        choices=["character", "location", "event", "item"],
        help="Entity type",
    )
    parser.add_argument(
        "--detail",
        default="standard",
        choices=["brief", "standard", "detailed"],
        help="Detail level",
    )
    parser.add_argument(
        "--style",
        default="neutral",
        choices=["neutral", "dramatic", "mysterious", "heroic"],
        help="Writing style",
    )
    parser.add_argument(
        "--provider",
        default=DEFAULT_PROVIDER,
        choices=["openai", "anthropic"],
        help="AI provider",
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Temperature (0.0-2.0)",
    )
    parser.add_argument(
        "--output",
        default="generated_entity.json",
        help="Output file path",
    )

    args = parser.parse_args()

    print(f"🤖 Generating {args.type} with {args.provider}...")
    print(f"   Detail: {args.detail}, Style: {args.style}")

    # Load world context
    world_context = load_world_context(args.world_id)
    if not world_context:
        print(f"✗ Failed to load world context for {args.world_id}")
        return 1

    print(f"   World: {world_context['name']} ({world_context.get('genre', 'unknown')})")

    # Generate entity
    generator = EntityGenerator(provider=args.provider)
    result = generator.generate(
        world_context=world_context,
        entity_type=args.type,
        detail_level=args.detail,
        style=args.style,
        temperature=args.temperature,
    )

    if result["success"]:
        print("✓ Generation successful!")
        print(f"   Tokens: {result['metadata']['tokens_used']}")
        print(f"   Cost: ${result['metadata']['cost']:.4f}")

        # Pretty print result
        print("\n--- Generated Entity ---")
        print(json.dumps(result["data"], indent=2))

        # Save to file
        save_result(result, args.output)

        return 0
    else:
        print(f"✗ Generation failed: {result.get('error', 'Unknown error')}")
        return 1


if __name__ == "__main__":
    exit(main())
