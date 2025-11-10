#!/usr/bin/env python3
"""
Generate MCP tool schemas from Zod schemas with OpenAI metadata

This script converts TypeScript Zod validation schemas to JSON Schema format
and adds OpenAI-specific metadata for ChatGPT Apps SDK integration.

Usage:
    python generate_tool_schemas.py

Output:
    src/lib/mcp/tool-schemas.json - Complete MCP tool definitions
    src/lib/mcp/tool-schemas.d.ts - TypeScript types
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

# Tool definitions with Zod schema mappings
TOOLS = [
    # World Management
    {
        "name": "create_world",
        "title": "Create World",
        "description": "Create a new fictional world with customizable properties (theme, description, etc.)",
        "zod_schema": "CreateWorldSchema",
        "file": "src/lib/schemas/world.ts",
        "widget": "world-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Creating your world...",
            "invoked": "World created successfully! ✨"
        }
    },
    {
        "name": "get_world",
        "title": "Get World",
        "description": "Retrieve detailed information about a world including characters, locations, and relationships",
        "zod_schema": "GetWorldSchema",
        "file": "src/lib/schemas/world.ts",
        "widget": "world-dashboard.html",
        "accessible": True,
        "invocation": {
            "invoking": "Loading world details...",
            "invoked": "Here's your world!"
        }
    },
    {
        "name": "update_world",
        "title": "Update World",
        "description": "Modify world properties such as name, theme, or description",
        "zod_schema": "UpdateWorldSchema",
        "file": "src/lib/schemas/world.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Updating world...",
            "invoked": "World updated!"
        }
    },

    # Character Management
    {
        "name": "create_character",
        "title": "Create Character",
        "description": "Add a new character to the world with name, role, traits, and background story",
        "zod_schema": "CreateCharacterSchema",
        "file": "src/lib/schemas/character.ts",
        "widget": "character-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Bringing your character to life...",
            "invoked": "Character created! 🎭"
        }
    },
    {
        "name": "get_character",
        "title": "Get Character",
        "description": "Retrieve detailed character information including traits, relationships, and background",
        "zod_schema": "GetCharacterSchema",
        "file": "src/lib/schemas/character.ts",
        "widget": "character-sheet.html",
        "accessible": True,
        "invocation": {
            "invoking": "Loading character details...",
            "invoked": "Here's your character!"
        }
    },
    {
        "name": "update_character",
        "title": "Update Character",
        "description": "Modify character properties like name, role, traits, or background",
        "zod_schema": "UpdateCharacterSchema",
        "file": "src/lib/schemas/character.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Updating character...",
            "invoked": "Character updated!"
        }
    },

    # Location Management
    {
        "name": "create_location",
        "title": "Create Location",
        "description": "Add a location to the world (city, dungeon, forest, etc.) with description and type",
        "zod_schema": "CreateLocationSchema",
        "file": "src/lib/schemas/location.ts",
        "widget": "location-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Creating location...",
            "invoked": "Location added to your world! 📍"
        }
    },
    {
        "name": "get_location",
        "title": "Get Location",
        "description": "Retrieve location details including description, type, and associated characters",
        "zod_schema": "GetLocationSchema",
        "file": "src/lib/schemas/location.ts",
        "widget": "location-card.html",
        "accessible": True,
        "invocation": {
            "invoking": "Loading location...",
            "invoked": "Here's the location!"
        }
    },

    # Relationships
    {
        "name": "add_relationship",
        "title": "Add Relationship",
        "description": "Create a relationship between two characters (ally, enemy, family, mentor, etc.)",
        "zod_schema": "AddRelationshipSchema",
        "file": "src/lib/schemas/relationship.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Creating relationship...",
            "invoked": "Relationship added! 🔗"
        }
    },

    # Discovery & AI
    {
        "name": "search_world",
        "title": "Search World",
        "description": "Perform semantic search across all world content (characters, locations, events)",
        "zod_schema": "SearchWorldSchema",
        "file": "src/lib/schemas/search.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Searching your world...",
            "invoked": "Search complete!"
        }
    },
    {
        "name": "get_world_summary",
        "title": "Get World Summary",
        "description": "Generate an AI-powered summary of the entire world including key characters, locations, and themes",
        "zod_schema": "GetWorldSummarySchema",
        "file": "src/lib/schemas/world.ts",
        "widget": "world-dashboard.html",
        "accessible": True,
        "invocation": {
            "invoking": "Generating world summary...",
            "invoked": "Summary ready!"
        }
    },
    {
        "name": "export_world",
        "title": "Export World",
        "description": "Export world data as JSON or Markdown for backup or sharing",
        "zod_schema": "ExportWorldSchema",
        "file": "src/lib/schemas/export.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Exporting world...",
            "invoked": "Export complete! 📦"
        }
    },
    {
        "name": "suggest_ideas",
        "title": "Suggest Ideas",
        "description": "Get AI-powered suggestions for characters, locations, events, or items",
        "zod_schema": "SuggestIdeasSchema",
        "file": "src/lib/schemas/suggestions.ts",
        "widget": None,
        "accessible": False,
        "invocation": {
            "invoking": "Generating ideas...",
            "invoked": "Here are some suggestions! 💡"
        }
    },
]


def parse_zod_property(prop_def: str) -> Dict[str, Any]:
    """
    Parse a Zod property definition to JSON Schema

    Examples:
        z.string() -> {"type": "string"}
        z.string().min(1).max(100) -> {"type": "string", "minLength": 1, "maxLength": 100}
        z.number().optional() -> {"type": "number"}
        z.array(z.string()) -> {"type": "array", "items": {"type": "string"}}
    """
    schema: Dict[str, Any] = {}

    # Determine base type
    if 'z.string()' in prop_def:
        schema['type'] = 'string'
    elif 'z.number()' in prop_def:
        schema['type'] = 'number'
    elif 'z.boolean()' in prop_def:
        schema['type'] = 'boolean'
    elif 'z.array(' in prop_def:
        schema['type'] = 'array'
        # Parse array item type
        if 'z.string()' in prop_def:
            schema['items'] = {'type': 'string'}
        elif 'z.number()' in prop_def:
            schema['items'] = {'type': 'number'}
        else:
            schema['items'] = {'type': 'object'}
    elif 'z.enum(' in prop_def:
        # Extract enum values
        enum_match = re.search(r'z\.enum\(\[(.*?)\]', prop_def)
        if enum_match:
            enum_str = enum_match.group(1)
            schema['type'] = 'string'
            schema['enum'] = [v.strip().strip("'\"") for v in enum_str.split(',')]
    else:
        schema['type'] = 'object'

    # Parse constraints
    min_match = re.search(r'\.min\((\d+)\)', prop_def)
    if min_match:
        if schema['type'] == 'string':
            schema['minLength'] = int(min_match.group(1))
        elif schema['type'] == 'number':
            schema['minimum'] = int(min_match.group(1))

    max_match = re.search(r'\.max\((\d+)\)', prop_def)
    if max_match:
        if schema['type'] == 'string':
            schema['maxLength'] = int(max_match.group(1))
        elif schema['type'] == 'number':
            schema['maximum'] = int(max_match.group(1))

    # Parse description
    desc_match = re.search(r'\.describe\(["\'](.+?)["\']\)', prop_def)
    if desc_match:
        schema['description'] = desc_match.group(1)

    return schema


def zod_to_json_schema(zod_code: str, schema_name: str) -> Dict[str, Any]:
    """
    Convert Zod schema to JSON Schema

    Args:
        zod_code: Full TypeScript file content
        schema_name: Name of Zod schema to extract (e.g., "CreateWorldSchema")

    Returns:
        JSON Schema dictionary
    """
    # Find schema definition
    schema_pattern = rf'export const {schema_name}\s*=\s*z\.object\(\{{(.*?)\}}\)'
    match = re.search(schema_pattern, zod_code, re.DOTALL)

    if not match:
        print(f"Warning: Schema {schema_name} not found, using fallback")
        return {'type': 'object', 'properties': {}, 'required': []}

    props_str = match.group(1)

    properties: Dict[str, Any] = {}
    required: List[str] = []

    # Parse each property line
    # Format: name: z.string().min(1).max(100).describe("..."),
    for line in props_str.split('\n'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue

        # Extract property name
        if ':' not in line:
            continue

        prop_name = line.split(':')[0].strip()
        prop_def = ':'.join(line.split(':')[1:]).strip().rstrip(',')

        # Parse property definition
        prop_schema = parse_zod_property(prop_def)
        properties[prop_name] = prop_schema

        # Check if required (not .optional())
        if '.optional()' not in prop_def:
            required.append(prop_name)

    return {
        'type': 'object',
        'properties': properties,
        'required': required
    }


def generate_tool_schema(tool_def: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate complete MCP tool schema with OpenAI metadata

    Args:
        tool_def: Tool definition from TOOLS list

    Returns:
        Complete tool schema with inputSchema and _meta
    """
    schema_file = Path(tool_def['file'])

    # Read and parse Zod schema
    if schema_file.exists():
        zod_code = schema_file.read_text(encoding='utf-8')
        input_schema = zod_to_json_schema(zod_code, tool_def['zod_schema'])
    else:
        print(f"Warning: Schema file not found: {schema_file}")
        # Fallback schema
        input_schema = {
            'type': 'object',
            'properties': {},
            'required': []
        }

    # Build base tool schema
    tool = {
        'name': tool_def['name'],
        'title': tool_def['title'],
        'description': tool_def['description'],
        'inputSchema': input_schema,
    }

    # Add OpenAI metadata if widget specified
    if tool_def['widget'] or tool_def['invocation']:
        tool['_meta'] = {}

        if tool_def['widget']:
            tool['_meta']['openai/outputTemplate'] = f"ui://widget/{tool_def['widget']}"
            tool['_meta']['openai/widgetAccessible'] = tool_def['accessible']

        if tool_def['invocation']:
            tool['_meta']['openai/toolInvocation'] = tool_def['invocation']

    return tool


def generate_typescript_types(tools: List[Dict[str, Any]]) -> str:
    """
    Generate TypeScript type definitions from tool schemas

    Returns:
        TypeScript declaration file content
    """
    lines = [
        "/**",
        " * Auto-generated MCP tool schemas",
        " * DO NOT EDIT - Generated by generate_tool_schemas.py",
        " */",
        "",
        "export interface MCPToolSchema {",
        "  name: string;",
        "  title: string;",
        "  description: string;",
        "  inputSchema: {",
        "    type: 'object';",
        "    properties: Record<string, any>;",
        "    required: string[];",
        "  };",
        "  _meta?: {",
        "    'openai/outputTemplate'?: string;",
        "    'openai/widgetAccessible'?: boolean;",
        "    'openai/toolInvocation'?: {",
        "      invoking: string;",
        "      invoked: string;",
        "    };",
        "  };",
        "}",
        "",
        "export type MCPToolName =",
    ]

    # Add tool names as union type
    tool_names = [f"  | '{tool['name']}'" for tool in tools]
    lines.extend(tool_names)
    lines.append(";")
    lines.append("")

    # Add tool schemas constant
    lines.append("export const MCP_TOOL_SCHEMAS: MCPToolSchema[];")
    lines.append("")

    return '\n'.join(lines)


def main():
    """Generate all tool schemas and TypeScript types"""
    print("Generating MCP tool schemas...")

    output = {'tools': []}

    for tool_def in TOOLS:
        print(f"  Processing: {tool_def['name']}")
        schema = generate_tool_schema(tool_def)
        output['tools'].append(schema)

    # Write JSON schema file
    output_file = Path('src/lib/mcp/tool-schemas.json')
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(f"\n✓ Generated {len(output['tools'])} tool schemas")
    print(f"  Output: {output_file}")

    # Write TypeScript types
    types_file = Path('src/lib/mcp/tool-schemas.d.ts')
    types_content = generate_typescript_types(output['tools'])
    types_file.write_text(types_content, encoding='utf-8')
    print(f"✓ Generated TypeScript types")
    print(f"  Output: {types_file}")

    # Summary
    print("\nTool Summary:")
    print(f"  Total tools: {len(output['tools'])}")
    print(f"  Widget-enabled: {sum(1 for t in output['tools'] if t.get('_meta', {}).get('openai/outputTemplate'))}")
    print(f"  Widget-accessible: {sum(1 for t in output['tools'] if t.get('_meta', {}).get('openai/widgetAccessible'))}")


if __name__ == '__main__':
    main()
