/**
 * AI Generation Button Component
 *
 * Reusable button for triggering AI entity generation with modal UI.
 * Handles streaming responses, quota checks, and error states.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useCompletion } from "ai/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { generateEntity } from "@/app/worlds/[worldId]/actions/ai-generate";

interface AiGenerationButtonProps {
  worldId: string;
  entityType: "character" | "location" | "event" | "item";
  onGenerated?: (data: any) => void;
  quotaUsed?: number;
  quotaLimit?: number;
  disabled?: boolean;
}

export function AiGenerationButton({
  worldId,
  entityType,
  onGenerated,
  quotaUsed = 0,
  quotaLimit = 5,
  disabled = false,
}: AiGenerationButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);

  // Generation options
  const [detailLevel, setDetailLevel] = useState<"brief" | "standard" | "detailed">("standard");
  const [style, setStyle] = useState<"neutral" | "dramatic" | "mysterious" | "heroic">("neutral");
  const [includeRelationships, setIncludeRelationships] = useState(true);

  const quotaRemaining = quotaLimit - quotaUsed;
  const quotaExceeded = quotaRemaining <= 0;

  const handleGenerate = async () => {
    setError(null);
    setGeneratedData(null);
    setIsGenerating(true);

    try {
      const result = await generateEntity(worldId, entityType, {
        entityType,
        detailLevel,
        style,
        includeRelationships,
        temperature: 0.7,
      });

      if (result.success && result.data) {
        setGeneratedData(result.data);
        onGenerated?.(result.data);
      } else {
        setError(result.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    // Navigate to create form with pre-filled data
    const params = new URLSearchParams();
    params.set("aiGenerated", "true");
    params.set("data", JSON.stringify(generatedData));

    router.push(`/worlds/${worldId}/${entityType}s/new?${params.toString()}`);
    setOpen(false);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || quotaExceeded}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Generate {entityType.charAt(0).toUpperCase() + entityType.slice(1)} with AI
          </DialogTitle>
          <DialogDescription>
            Customize generation settings and create a unique {entityType} for your world.
            {!quotaExceeded && (
              <span className="block mt-1 text-sm">
                Remaining generations: {quotaRemaining}/{quotaLimit}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {quotaExceeded && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You've reached your generation limit. Upgrade to premium for unlimited generations.
            </AlertDescription>
          </Alert>
        )}

        {!quotaExceeded && !generatedData && (
          <div className="space-y-6">
            {/* Detail Level */}
            <div className="space-y-3">
              <Label>Detail Level</Label>
              <RadioGroup value={detailLevel} onValueChange={(v: any) => setDetailLevel(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="brief" id="brief" />
                  <Label htmlFor="brief" className="font-normal cursor-pointer">
                    Brief - Concise 2-3 sentence descriptions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="font-normal cursor-pointer">
                    Standard - Moderate detail with 1-2 paragraphs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="detailed" />
                  <Label htmlFor="detailed" className="font-normal cursor-pointer">
                    Detailed - Rich 3-5 paragraph descriptions
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Style */}
            <div className="space-y-3">
              <Label>Writing Style</Label>
              <RadioGroup value={style} onValueChange={(v: any) => setStyle(v)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="neutral" />
                  <Label htmlFor="neutral" className="font-normal cursor-pointer">
                    Neutral - Informative and balanced
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dramatic" id="dramatic" />
                  <Label htmlFor="dramatic" className="font-normal cursor-pointer">
                    Dramatic - Evocative and engaging
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mysterious" id="mysterious" />
                  <Label htmlFor="mysterious" className="font-normal cursor-pointer">
                    Mysterious - Intriguing with hidden depths
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="heroic" id="heroic" />
                  <Label htmlFor="heroic" className="font-normal cursor-pointer">
                    Heroic - Noble and inspiring
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Include Relationships */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="relationships"
                checked={includeRelationships}
                onChange={(e) => setIncludeRelationships(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="relationships" className="font-normal cursor-pointer">
                Suggest relationships with existing entities
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {generatedData && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h3 className="font-semibold text-lg">{generatedData.name}</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{generatedData.description}</p>
              </div>

              {generatedData.physicalDescription && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Physical Description</h4>
                  <p className="text-sm text-muted-foreground">{generatedData.physicalDescription}</p>
                </div>
              )}

              {generatedData.personality && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Personality</h4>
                  <p className="text-sm text-muted-foreground">{generatedData.personality}</p>
                </div>
              )}

              {generatedData.relationships && generatedData.relationships.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Suggested Relationships</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {generatedData.relationships.map((rel: any, i: number) => (
                      <li key={i}>
                        <span className="font-medium">{rel.relationType}</span> with {rel.entityName}: {rel.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                Regenerate
              </Button>
              <Button onClick={handleSave}>
                Save {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
