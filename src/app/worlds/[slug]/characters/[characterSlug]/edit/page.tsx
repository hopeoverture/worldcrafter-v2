import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CharacterForm } from "@/components/forms/character-form";

interface EditCharacterPageProps {
  params: Promise<{
    slug: string;
    characterSlug: string;
  }>;
}

export default async function EditCharacterPage({
  params,
}: EditCharacterPageProps) {
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
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Edit Character</h1>
        <p className="text-muted-foreground mt-2">
          Update details for{" "}
          <span className="font-medium">{character.name}</span>
        </p>
      </div>

      <CharacterForm
        worldId={world.id}
        worldSlug={world.slug}
        character={character}
        mode="edit"
      />
    </div>
  );
}
