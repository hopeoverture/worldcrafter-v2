import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CharactersList } from "@/components/characters/characters-list";

interface CharactersPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CharactersPage({ params }: CharactersPageProps) {
  const { slug } = await params;

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

  // Fetch characters
  const characters = await prisma.character.findMany({
    where: {
      worldId: world.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="container max-w-7xl py-10">
      <CharactersList characters={characters} worldSlug={world.slug} />
    </div>
  );
}
