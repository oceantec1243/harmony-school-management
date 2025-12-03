import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StudentStatus } from "@/lib/types"

interface StatusBadgeProps {
  status: StudentStatus
}

const statusConfig: Record<StudentStatus, { label: string; className: string }> = {
  Active: {
    label: "Actif",
    className: "bg-success/10 text-success hover:bg-success/20",
  },
  Suspended: {
    label: "Suspendu",
    className: "bg-warning/10 text-warning hover:bg-warning/20",
  },
  Graduated: {
    label: "Diplômé",
    className: "bg-primary/10 text-primary hover:bg-primary/20",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
