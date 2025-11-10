"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DeleteWorldDialog } from "./delete-world-dialog"

interface DeleteWorldSectionProps {
  worldId: string
  worldName: string
}

export function DeleteWorldSection({
  worldId,
  worldName,
}: DeleteWorldSectionProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-destructive">
            Delete this world
          </h3>
          <p className="text-sm text-muted-foreground">
            Once you delete a world, there is no going back. All locations,
            activities, and metadata will be permanently removed.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete World
        </Button>
      </div>

      <DeleteWorldDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        worldId={worldId}
        worldName={worldName}
      />
    </>
  )
}
