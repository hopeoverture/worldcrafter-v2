#!/usr/bin/env python3
"""
Prisma Model Generator for WorldCrafter

Interactive script to generate Prisma models following WorldCrafter conventions.

Usage:
    python generate_model.py
"""

import re
from pathlib import Path


def to_pascal_case(text: str) -> str:
    """Convert text to PascalCase"""
    return ''.join(word.capitalize() for word in re.split(r'[-_\s]+', text))


def to_snake_case(text: str) -> str:
    """Convert text to snake_case"""
    # Insert underscore before uppercase letters and convert to lowercase
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def get_input(prompt: str, default: str = None) -> str:
    """Get input with optional default"""
    if default:
        value = input(f"{prompt} [{default}]: ").strip()
        return value if value else default
    return input(f"{prompt}: ").strip()


def get_yes_no(prompt: str, default: bool = True) -> bool:
    """Get yes/no input"""
    default_str = "Y/n" if default else "y/N"
    value = input(f"{prompt} [{default_str}]: ").strip().lower()

    if not value:
        return default

    return value in ['y', 'yes', 'true', '1']


def generate_model_fields() -> list:
    """Interactively generate model fields"""
    fields = []

    print("\nAdd fields (press Enter on field name to finish)")

    while True:
        field_name = input("\nField name (camelCase): ").strip()

        if not field_name:
            break

        field_type = get_input("Field type (String/Int/Boolean/DateTime/Json)", "String")

        is_optional = get_yes_no("Optional?", False)
        is_unique = get_yes_no("Unique?", False)

        default_value = None
        if field_type == "Boolean":
            has_default = get_yes_no("Add default value?", True)
            if has_default:
                default_value = "true" if get_yes_no("Default value", True) else "false"
        elif field_type == "DateTime":
            if get_yes_no("Default to now()?", False):
                default_value = "now()"

        fields.append({
            'name': field_name,
            'type': field_type,
            'optional': is_optional,
            'unique': is_unique,
            'default': default_value
        })

    return fields


def generate_relationships() -> list:
    """Interactively generate relationships"""
    relationships = []

    if not get_yes_no("\nAdd relationships?", False):
        return relationships

    print("\nAdd relationships (press Enter on relation name to finish)")

    while True:
        relation_name = input("\nRelation to (model name in PascalCase): ").strip()

        if not relation_name:
            break

        relation_type = get_input("Relation type (one-to-many/one-to-one/many-to-many)", "one-to-many")

        if relation_type == "many-to-many":
            print("Note: Create junction table separately")
            continue

        field_name = get_input(f"Field name for {relation_name}", relation_name.lower())

        on_delete = get_input("onDelete behavior (Cascade/SetNull/Restrict)", "Cascade")

        relationships.append({
            'model': relation_name,
            'field': field_name,
            'type': relation_type,
            'onDelete': on_delete
        })

    return relationships


def generate_prisma_model(model_name: str, fields: list, relationships: list) -> str:
    """Generate Prisma model string"""
    pascal_name = to_pascal_case(model_name)
    snake_name = to_snake_case(model_name)

    model_lines = [f"model {pascal_name} {{"]

    # Add id field
    model_lines.append("  id        String   @id @default(cuid())")

    # Add custom fields
    for field in fields:
        line = f"  {field['name']:<12}"

        # Type
        line += field['type']
        if field['optional']:
            line += "?"

        # Attributes
        attrs = []
        if field['unique']:
            attrs.append("@unique")
        if field['default']:
            attrs.append(f"@default({field['default']})")
        if not field['name'].islower():
            attrs.append(f"@map(\"{to_snake_case(field['name'])}\")")

        if attrs:
            line += " " * (20 - len(field['type'])) + " ".join(attrs)

        model_lines.append(line)

    # Add standard timestamp fields
    model_lines.append("  createdAt DateTime @default(now()) @map(\"created_at\")")
    model_lines.append("  updatedAt DateTime @updatedAt @map(\"updated_at\")")

    # Add blank line before relations if any
    if relationships:
        model_lines.append("")

    # Add relationships
    for rel in relationships:
        # Add foreign key field
        fk_field = f"{rel['field']}Id"
        fk_col = to_snake_case(fk_field)

        optional = "?" if rel['type'] == "one-to-one" else ""
        unique = " @unique" if rel['type'] == "one-to-one" else ""

        model_lines.append(f"  {fk_field:<12} String{optional}{unique} @map(\"{fk_col}\")")

        # Add relation field
        model_lines.append("")
        model_lines.append(f"  {rel['field']} {rel['model']} @relation(fields: [{fk_field}], references: [id], onDelete: {rel['onDelete']})")

    # Add indexes
    model_lines.append("")
    for rel in relationships:
        fk_field = f"{rel['field']}Id"
        model_lines.append(f"  @@index([{fk_field}])")

    # Add table mapping
    model_lines.append(f"  @@map(\"{snake_name}\")")

    model_lines.append("}")

    return "\n".join(model_lines)


def main():
    print("=" * 60)
    print("WorldCrafter Prisma Model Generator")
    print("=" * 60)

    # Get model name
    model_name = get_input("\nModel name (PascalCase or kebab-case)")

    if not model_name:
        print("Error: Model name is required")
        return

    pascal_name = to_pascal_case(model_name)
    snake_name = to_snake_case(model_name)

    print(f"\nModel name: {pascal_name}")
    print(f"Table name: {snake_name}")

    # Generate fields
    fields = generate_model_fields()

    # Generate relationships
    relationships = generate_relationships()

    # Generate model
    model_code = generate_prisma_model(model_name, fields, relationships)

    # Display generated model
    print("\n" + "=" * 60)
    print("Generated Prisma Model:")
    print("=" * 60)
    print(model_code)
    print("=" * 60)

    # Ask if user wants to save
    if get_yes_no("\nSave to clipboard or file?", True):
        # Try to find prisma schema
        schema_path = Path("prisma/schema.prisma")

        if schema_path.exists():
            if get_yes_no(f"Append to {schema_path}?", True):
                with open(schema_path, 'a') as f:
                    f.write("\n\n" + model_code + "\n")
                print(f"\nModel appended to {schema_path}")
            else:
                print("\nModel code above - copy manually")
        else:
            print("\nNote: prisma/schema.prisma not found")
            print("Copy the model code above and paste it into your schema file")

    # Next steps
    print("\nNext steps:")
    print(f"1. Review the generated model in prisma/schema.prisma")
    print(f"2. Run: npx prisma migrate dev --name add_{snake_name}_table")
    print(f"3. Add RLS policies: python .claude/skills/worldcrafter-database-setup/scripts/generate_rls.py {snake_name}")
    print(f"4. Sync test database: npm run db:test:sync")


if __name__ == "__main__":
    main()
