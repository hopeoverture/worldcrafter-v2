"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { deleteWorld } from "@/app/worlds/actions"

interface DeleteWorldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worldId: string
  worldName: string
}

export function DeleteWorldDialog({
  open,
  onOpenChange,
  worldId,
  worldName,
}: DeleteWorldDialogProps) {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmationValid = confirmText === worldName

  async function handleDelete() {
    if (!isConfirmationValid) {
      toast.error("Please type the world name exactly to confirm deletion")
      return
    }

    setIsDeleting(true)

    try {
      const result = await deleteWorld(worldId)

      if (result.success) {
        toast.success(`World "${worldName}" has been deleted`)
        router.push("/worlds")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete world")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Delete world error:", error)
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
      setConfirmText("")
    }
  }

  function handleCancel() {
    setConfirmText("")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <AlertDialogTitle>Delete World</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              This action cannot be undone. This will permanently delete the
              world <span className="font-semibold">{worldName}</span> and all
              associated data including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>All locations</li>
              <li>All activity history</li>
              <li>All custom metadata</li>
            </ul>
            <p className="font-medium mt-4">
              Type <span className="font-mono bg-muted px-1">{worldName}</span>{" "}
              to confirm deletion:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-delete">Confirm World Name</Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={worldName}
            disabled={isDeleting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete World"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
