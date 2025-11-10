import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CharacterDetail } from "@/components/characters/character-detail";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Edit, ArrowLeft } from "lucide-react";

interface CharacterDetailPageProps {
  params: Promise<{
    slug: string;
    characterSlug: string;
  }>;
}

export default async function CharacterDetailPage({
  params,
}: CharacterDetailPageProps) {
  const { slug, characterSlug } = await params;

  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch world
  const world = await prisma.world.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
    },
  });

  if (!world) {
    redirect("/worlds");
  }

  // Verify ownership
  if (world.userId !== user.id) {
    redirect(`/worlds/${slug}`);
  }

  // Fetch character
  const character = await prisma.character.findUnique({
    where: {
      worldId_slug: {
        worldId: world.id,
        slug: characterSlug,
      },
    },
  });

  if (!character) {
    redirect(`/worlds/${slug}/characters`);
  }

  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 space-y-4">
        {/* Breadcrumb */}
        <Breadcrumbs
          items={[
            { label: world.name, href: `/worlds/${slug}` },
            { label: "Characters", href: `/worlds/${slug}/characters` },
            { label: character.name },
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {character.name}
            </h1>
            {(character.role || character.species) && (
              <p className="text-muted-foreground">
                {[character.role, character.species]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/worlds/${slug}/characters`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Characters
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/worlds/${slug}/characters/${characterSlug}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Character
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <CharacterDetail character={character} worldSlug={world.slug} />
    </div>
  );
}
