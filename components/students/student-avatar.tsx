import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface StudentAvatarProps {
  firstName: string
  lastName: string
  photo?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
}

const colors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
]

export function StudentAvatar({ firstName, lastName, photo, size = "md", className }: StudentAvatarProps) {
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase()
  const colorIndex = (firstName.charCodeAt(0) + lastName.charCodeAt(0)) % colors.length

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {photo && <AvatarImage src={photo || "/placeholder.svg"} alt={`${firstName} ${lastName}`} />}
      <AvatarFallback className={cn(colors[colorIndex], "text-white font-medium")}>{initials}</AvatarFallback>
    </Avatar>
  )
}
