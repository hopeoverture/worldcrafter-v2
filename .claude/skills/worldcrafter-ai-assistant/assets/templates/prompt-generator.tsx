/**
 * Writing Prompt Generator Component
 *
 * Generates creative writing prompts from world entities.
 * Supports different prompt types and saves favorites.
 */

"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Heart, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface WritingPrompt {
  id: string;
  type: "story-starter" | "quest-hook" | "conflict" | "scene";
  title: string;
  prompt: string;
  involvedEntities: Array<{
    id: string;
    type: string;
    name: string;
  }>;
}

interface PromptGeneratorProps {
  worldId: string;
  onSavePrompt?: (prompt: WritingPrompt) => void;
  savedPrompts?: string[];
}

const promptTypeConfig = {
  "story-starter": {
    label: "Story Starters",
    description: "Opening scenes to begin your story",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  "quest-hook": {
    label: "Quest Hooks",
    description: "Adventure ideas and missions",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  conflict: {
    label: "Conflicts",
    description: "Dramatic tensions and problems",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  scene: {
    label: "Scenes",
    description: "Specific moments and interactions",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
};

export function PromptGenerator({
  worldId,
  onSavePrompt,
  savedPrompts = [],
}: PromptGeneratorProps) {
  const [prompts, setPrompts] = useState<WritingPrompt[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/worlds/${worldId}/prompts/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate prompts");
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error("Error generating prompts:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = async (prompt: WritingPrompt) => {
    try {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const filteredPrompts =
    selectedType === "all"
      ? prompts
      : prompts.filter((p) => p.type === selectedType);

  const promptsByType = {
    "story-starter": prompts.filter((p) => p.type === "story-starter"),
    "quest-hook": prompts.filter((p) => p.type === "quest-hook"),
    conflict: prompts.filter((p) => p.type === "conflict"),
    scene: prompts.filter((p) => p.type === "scene"),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Writing Prompt Generator</CardTitle>
              <CardDescription>
                Generate creative writing prompts based on your world's entities
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Prompts
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {prompts.length > 0 && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              {Object.entries(promptTypeConfig).map(([type, config]) => {
                const count = promptsByType[type as keyof typeof promptsByType].length;
                return (
                  <div key={type}>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{config.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Prompts */}
      {prompts.length > 0 && (
        <Tabs defaultValue="all" onValueChange={setSelectedType}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">
              All ({prompts.length})
            </TabsTrigger>
            {Object.entries(promptTypeConfig).map(([type, config]) => {
              const count = promptsByType[type as keyof typeof promptsByType].length;
              return (
                <TabsTrigger key={type} value={type}>
                  {config.label} ({count})
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            <PromptList
              prompts={filteredPrompts}
              worldId={worldId}
              onCopy={handleCopyPrompt}
              onSave={onSavePrompt}
              savedPrompts={savedPrompts}
              copiedId={copiedId}
            />
          </TabsContent>

          {Object.keys(promptTypeConfig).map((type) => (
            <TabsContent key={type} value={type} className="space-y-3 mt-4">
              <PromptList
                prompts={promptsByType[type as keyof typeof promptsByType]}
                worldId={worldId}
                onCopy={handleCopyPrompt}
                onSave={onSavePrompt}
                savedPrompts={savedPrompts}
                copiedId={copiedId}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Empty State */}
      {prompts.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="py-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Prompts Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Generate writing prompts to get inspired by your world
            </p>
            <Button onClick={handleGenerate} disabled={isGenerating}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Prompts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PromptListProps {
  prompts: WritingPrompt[];
  worldId: string;
  onCopy: (prompt: WritingPrompt) => void;
  onSave?: (prompt: WritingPrompt) => void;
  savedPrompts: string[];
  copiedId: string | null;
}

function PromptList({
  prompts,
  worldId,
  onCopy,
  onSave,
  savedPrompts,
  copiedId,
}: PromptListProps) {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prompts of this type
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {prompts.map((prompt) => {
        const config = promptTypeConfig[prompt.type];
        const isSaved = savedPrompts.includes(prompt.id);
        const isCopied = copiedId === prompt.id;

        return (
          <Card key={prompt.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={config.color}>{config.label}</Badge>
                      <h3 className="font-semibold">{prompt.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed">{prompt.prompt}</p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCopy(prompt)}
                      title="Copy prompt"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    {onSave && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSave(prompt)}
                        title={isSaved ? "Saved" : "Save prompt"}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            isSaved && "fill-red-500 text-red-500"
                          )}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Involved Entities */}
                {prompt.involvedEntities.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      Involves:
                    </span>
                    {prompt.involvedEntities.map((entity) => (
                      <a
                        key={entity.id}
                        href={`/worlds/${worldId}/${entity.type}s/${entity.id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md text-xs hover:bg-accent transition-colors"
                      >
                        <span className="text-muted-foreground capitalize">
                          {entity.type}:
                        </span>
                        <span className="font-medium">{entity.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
