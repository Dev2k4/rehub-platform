import { memo } from "react"
import { Shield, ShieldCheck, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TrustScoreProps {
  score: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
}

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

/**
 * TrustScore - Display user trust score with visual indicator
 */
export const TrustScore = memo(function TrustScore({
  score,
  showLabel = true,
  size = "md",
  className,
}: TrustScoreProps) {
  const getScoreLevel = () => {
    if (score >= 80) return { level: "high", color: "text-success", Icon: ShieldCheck }
    if (score >= 50) return { level: "medium", color: "text-warning", Icon: Shield }
    return { level: "low", color: "text-destructive", Icon: ShieldAlert }
  }

  const { color, Icon } = getScoreLevel()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("inline-flex items-center gap-1", className)}>
            <Icon className={cn(sizeClasses[size], color)} />
            {showLabel && (
              <span className={cn("font-medium", textSizeClasses[size], color)}>
                {score}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Trust Score: {score}/100</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})
