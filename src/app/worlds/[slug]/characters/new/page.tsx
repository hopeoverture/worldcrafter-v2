import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CharacterForm } from "@/components/forms/character-form";

interface NewCharacterPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function NewCharacterPage({
  params,
}: NewCharacterPageProps) {
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

  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Character</h1>
        <p className="text-muted-foreground mt-2">
          Add a new character to{" "}
          <span className="font-medium">{world.name}</span>
        </p>
      </div>

      <CharacterForm worldId={world.id} worldSlug={world.slug} mode="create" />
    </div>
  );
}
