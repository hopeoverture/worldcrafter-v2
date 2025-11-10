#!/usr/bin/env python3
"""
AI Consistency Checker Script

Scans world for logical conflicts, contradictions, and inconsistencies.

Usage:
    python check_consistency.py --world-id <id> --output report.json
"""

import os
import json
import argparse
from typing import Dict, Any, List
from datetime import datetime
import openai
from anthropic import Anthropic

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")


class ConsistencyChecker:
    """AI-powered world consistency analyzer"""

    def __init__(self, provider: str = "openai"):
        self.provider = provider

        if provider == "openai" and OPENAI_API_KEY:
            self.openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
        elif provider == "anthropic" and ANTHROPIC_API_KEY:
            self.anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)
        else:
            raise ValueError(f"Invalid provider or missing API key: {provider}")

    def check_all(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Run all consistency checks"""

        issues = []

        print("🔍 Running consistency checks...\n")

        # 1. Date conflicts
        print("1. Checking date conflicts...")
        issues.extend(self.check_date_conflicts(world_data))

        # 2. Location conflicts
        print("2. Checking location conflicts...")
        issues.extend(self.check_location_conflicts(world_data))

        # 3. Description contradictions
        print("3. Checking description contradictions...")
        issues.extend(self.check_description_contradictions(world_data))

        # 4. Orphaned references
        print("4. Checking orphaned references...")
        issues.extend(self.check_orphaned_references(world_data))

        # 5. Relationship inconsistencies
        print("5. Checking relationship inconsistencies...")
        issues.extend(self.check_relationship_inconsistencies(world_data))

        print(f"\n✓ Checks complete. Found {len(issues)} issues.")

        return issues

    def check_date_conflicts(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for temporal inconsistencies in events"""

        issues = []
        events = [e for e in world_data.get("entities", []) if e.get("type") == "event"]

        for event in events:
            if not event.get("date") or not event.get("description"):
                continue

            # Find mentions of other events
            for other_event in events:
                if other_event["id"] == event["id"] or not other_event.get("date"):
                    continue

                if other_event["name"].lower() in event["description"].lower():
                    # Use LLM to check temporal consistency
                    prompt = f"""Analyze this temporal relationship for consistency:

Event 1: "{event['name']}" (Date: {event['date']})
Description: {event['description']}

Event 2: "{other_event['name']}" (Date: {other_event['date']})

Event 1's description mentions Event 2. Are the dates consistent with the narrative context?

Respond with JSON:
{{
  "consistent": true/false,
  "explanation": "brief explanation",
  "severity": "low/medium/high/critical"
}}"""

                    result = self._query_llm(prompt)

                    if result and not result.get("consistent"):
                        issues.append({
                            "id": f"date-{event['id']}-{other_event['id']}",
                            "severity": result.get("severity", "medium"),
                            "category": "date",
                            "title": "Date Conflict Detected",
                            "description": result.get("explanation", "Date inconsistency found"),
                            "affectedEntities": [
                                {"id": event["id"], "type": "event", "name": event["name"]},
                                {"id": other_event["id"], "type": "event", "name": other_event["name"]},
                            ],
                            "suggestedFix": f"Review dates for '{event['name']}' ({event['date']}) and '{other_event['name']}' ({other_event['date']})",
                        })

        return issues

    def check_location_conflicts(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for impossible location scenarios"""

        issues = []
        events = [e for e in world_data.get("entities", []) if e.get("type") == "event"]
        characters = [e for e in world_data.get("entities", []) if e.get("type") == "character"]

        # Build character event timeline
        character_events = {}
        for event in events:
            if not event.get("date") or not event.get("location"):
                continue

            # Extract character mentions from description
            for character in characters:
                if character["name"].lower() in event.get("description", "").lower():
                    if character["id"] not in character_events:
                        character_events[character["id"]] = []

                    character_events[character["id"]].append({
                        "event": event,
                        "date": datetime.fromisoformat(event["date"].replace("Z", "+00:00")),
                    })

        # Check for same-day different-location conflicts
        for char_id, events_list in character_events.items():
            sorted_events = sorted(events_list, key=lambda x: x["date"])

            for i in range(len(sorted_events) - 1):
                event1 = sorted_events[i]["event"]
                event2 = sorted_events[i + 1]["event"]

                # Check if on same day
                time_diff = abs((sorted_events[i + 1]["date"] - sorted_events[i]["date"]).total_seconds() / 3600)

                if time_diff < 24 and event1.get("location") != event2.get("location"):
                    character = next(c for c in characters if c["id"] == char_id)

                    issues.append({
                        "id": f"location-{char_id}-{event1['id']}-{event2['id']}",
                        "severity": "medium",
                        "category": "location",
                        "title": "Location Conflict",
                        "description": f"{character['name']} appears in {event1.get('location', 'unknown location')} and {event2.get('location', 'unknown location')} within {time_diff:.1f} hours",
                        "affectedEntities": [
                            {"id": event1["id"], "type": "event", "name": event1["name"]},
                            {"id": event2["id"], "type": "event", "name": event2["name"]},
                            {"id": char_id, "type": "character", "name": character["name"]},
                        ],
                        "suggestedFix": "Add travel time, adjust dates, or verify character presence",
                    })

        return issues

    def check_description_contradictions(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for internal contradictions in entity descriptions"""

        issues = []
        entities = world_data.get("entities", [])

        for entity in entities:
            if not entity.get("description"):
                continue

            # Use LLM to detect contradictions
            prompt = f"""Analyze this {entity['type']} description for internal contradictions:

Name: {entity['name']}
Description: {entity['description']}

Look for:
- Contradictory statements (e.g., "always calm" vs "quick to anger")
- Impossible traits (e.g., "born in 1990" vs "fought in WWI")
- Logical inconsistencies

Respond with JSON:
{{
  "hasContradictions": true/false,
  "contradictions": [
    {{
      "issue": "description of contradiction",
      "severity": "low/medium/high"
    }}
  ]
}}"""

            result = self._query_llm(prompt)

            if result and result.get("hasContradictions"):
                for contradiction in result.get("contradictions", []):
                    issues.append({
                        "id": f"description-{entity['id']}-{len(issues)}",
                        "severity": contradiction.get("severity", "medium"),
                        "category": "description",
                        "title": "Description Contradiction",
                        "description": contradiction.get("issue", "Contradiction found"),
                        "affectedEntities": [
                            {"id": entity["id"], "type": entity["type"], "name": entity["name"]}
                        ],
                        "suggestedFix": "Review and revise description for consistency",
                    })

        return issues

    def check_orphaned_references(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for references to non-existent entities"""

        issues = []
        entities = world_data.get("entities", [])
        entity_names = set(e["name"].lower() for e in entities)

        for entity in entities:
            if not entity.get("description"):
                continue

            # Extract proper nouns with LLM
            prompt = f"""Extract all proper nouns (names of people, places, events, items) from this text:

{entity['description']}

Only extract capitalized names that appear to reference specific entities.

Respond with JSON:
{{
  "properNouns": ["Name1", "Name2", ...]
}}"""

            result = self._query_llm(prompt)

            if result:
                proper_nouns = result.get("properNouns", [])

                # Filter out proper nouns that don't match existing entities
                orphaned = [
                    noun for noun in proper_nouns
                    if noun.lower() not in entity_names
                ]

                if orphaned:
                    issues.append({
                        "id": f"orphaned-{entity['id']}",
                        "severity": "low",
                        "category": "reference",
                        "title": "Potential Orphaned References",
                        "description": f"{entity['name']} references: {', '.join(orphaned)} - these entities may not exist in the world",
                        "affectedEntities": [
                            {"id": entity["id"], "type": entity["type"], "name": entity["name"]}
                        ],
                        "suggestedFix": "Create these entities or remove/clarify references",
                    })

        return issues

    def check_relationship_inconsistencies(self, world_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check for inconsistent or contradictory relationships"""

        issues = []
        relationships = world_data.get("relationships", [])

        # Check for contradictory relationship types
        relationship_map = {}
        for rel in relationships:
            key = tuple(sorted([rel["sourceId"], rel["targetId"]]))

            if key not in relationship_map:
                relationship_map[key] = []

            relationship_map[key].append(rel)

        for key, rels in relationship_map.items():
            if len(rels) > 1:
                # Multiple relationships between same entities - check for contradictions
                types = [r["relationType"] for r in rels]

                prompt = f"""Are these relationship types contradictory or inconsistent?

Relationship types between two entities: {', '.join(types)}

Respond with JSON:
{{
  "contradictory": true/false,
  "explanation": "brief explanation",
  "severity": "low/medium/high"
}}"""

                result = self._query_llm(prompt)

                if result and result.get("contradictory"):
                    entities = world_data.get("entities", [])
                    source = next((e for e in entities if e["id"] == rels[0]["sourceId"]), None)
                    target = next((e for e in entities if e["id"] == rels[0]["targetId"]), None)

                    if source and target:
                        issues.append({
                            "id": f"relationship-{key[0]}-{key[1]}",
                            "severity": result.get("severity", "medium"),
                            "category": "relationship",
                            "title": "Contradictory Relationships",
                            "description": result.get("explanation", "Contradictory relationship types found"),
                            "affectedEntities": [
                                {"id": source["id"], "type": source["type"], "name": source["name"]},
                                {"id": target["id"], "type": target["type"], "name": target["name"]},
                            ],
                            "suggestedFix": "Review and consolidate relationships",
                        })

        return issues

    def _query_llm(self, prompt: str) -> Dict[str, Any]:
        """Query LLM for consistency analysis"""

        try:
            if self.provider == "openai":
                response = self.openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a consistency analyzer. Always respond with valid JSON.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )

                content = response.choices[0].message.content
                if content:
                    return json.loads(content)

            elif self.provider == "anthropic":
                response = self.anthropic_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1000,
                    temperature=0.3,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt + "\n\nRespond with ONLY valid JSON, no additional text.",
                        }
                    ],
                )

                content_block = response.content[0]
                if content_block.type == "text":
                    return json.loads(content_block.text)

        except Exception as e:
            print(f"   ⚠ LLM query failed: {e}")

        return {}


def load_world_data(world_id: str) -> Dict[str, Any]:
    """Load world data from database or JSON file"""

    # For demo purposes, load from JSON file
    world_file = f"world_{world_id}_data.json"

    if os.path.exists(world_file):
        with open(world_file, "r") as f:
            return json.load(f)

    # Return sample data for testing
    return {
        "id": world_id,
        "name": "Example World",
        "entities": [
            {
                "id": "event1",
                "type": "event",
                "name": "The Great Battle",
                "date": "2024-01-15",
                "location": "Northern Plains",
                "description": "A massive battle occurred after the peace treaty was signed.",
            },
            {
                "id": "event2",
                "type": "event",
                "name": "The Peace Treaty",
                "date": "2024-01-20",
                "location": "Capital City",
                "description": "The warring factions signed a peace treaty.",
            },
        ],
        "relationships": [],
    }


def save_report(issues: List[Dict[str, Any]], output_file: str):
    """Save consistency report to JSON file"""

    report = {
        "timestamp": datetime.now().isoformat(),
        "totalIssues": len(issues),
        "bySeverity": {
            "critical": len([i for i in issues if i["severity"] == "critical"]),
            "high": len([i for i in issues if i["severity"] == "high"]),
            "medium": len([i for i in issues if i["severity"] == "medium"]),
            "low": len([i for i in issues if i["severity"] == "low"]),
        },
        "byCategory": {
            "date": len([i for i in issues if i["category"] == "date"]),
            "location": len([i for i in issues if i["category"] == "location"]),
            "description": len([i for i in issues if i["category"] == "description"]),
            "reference": len([i for i in issues if i["category"] == "reference"]),
            "relationship": len([i for i in issues if i["category"] == "relationship"]),
        },
        "issues": issues,
    }

    with open(output_file, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n✓ Report saved to {output_file}")


def print_summary(issues: List[Dict[str, Any]]):
    """Print summary of issues"""

    print("\n" + "=" * 60)
    print("CONSISTENCY REPORT SUMMARY")
    print("=" * 60)

    by_severity = {
        "critical": [i for i in issues if i["severity"] == "critical"],
        "high": [i for i in issues if i["severity"] == "high"],
        "medium": [i for i in issues if i["severity"] == "medium"],
        "low": [i for i in issues if i["severity"] == "low"],
    }

    print(f"\nTotal Issues: {len(issues)}")
    print(f"  Critical: {len(by_severity['critical'])}")
    print(f"  High:     {len(by_severity['high'])}")
    print(f"  Medium:   {len(by_severity['medium'])}")
    print(f"  Low:      {len(by_severity['low'])}")

    if issues:
        print("\nTop Issues:")
        for i, issue in enumerate(sorted(issues, key=lambda x: ["low", "medium", "high", "critical"].index(x["severity"]), reverse=True)[:5], 1):
            print(f"\n{i}. [{issue['severity'].upper()}] {issue['title']}")
            print(f"   {issue['description']}")


def main():
    parser = argparse.ArgumentParser(description="Check world consistency with AI")
    parser.add_argument("--world-id", required=True, help="World ID")
    parser.add_argument(
        "--provider",
        default="openai",
        choices=["openai", "anthropic"],
        help="AI provider",
    )
    parser.add_argument(
        "--output",
        default="consistency_report.json",
        help="Output file path",
    )

    args = parser.parse_args()

    print(f"🔍 Checking consistency for world {args.world_id}")

    # Load world data
    world_data = load_world_data(args.world_id)
    print(f"   Loaded world: {world_data.get('name', 'Unknown')}")
    print(f"   Entities: {len(world_data.get('entities', []))}")
    print(f"   Relationships: {len(world_data.get('relationships', []))}\n")

    # Run consistency checks
    checker = ConsistencyChecker(provider=args.provider)
    issues = checker.check_all(world_data)

    # Print summary
    print_summary(issues)

    # Save report
    save_report(issues, args.output)

    return 0 if len([i for i in issues if i["severity"] in ["critical", "high"]]) == 0 else 1


if __name__ == "__main__":
    exit(main())
