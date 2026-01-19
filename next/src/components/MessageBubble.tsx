import { cn } from "@/lib/utils"
import type { SessionMessage, MessageContent } from "@/types"

type MessageBubbleProps = {
  message: SessionMessage
}

const extractTextContent = (content: string | MessageContent[]): string | null => {
  if (typeof content === "string") {
    return content
  }

  if (Array.isArray(content)) {
    const textParts: string[] = []
    for (const part of content) {
      if (part.type === "text" && part.text) {
        textParts.push(part.text)
      } else if (part.type === "tool_use" && part.name) {
        textParts.push(`[Tool: ${part.name}]`)
      } else if (part.type === "tool_result" && part.content) {
        textParts.push(`[Tool Result: ${part.content.slice(0, 100)}...]`)
      }
    }
    return textParts.join("\n") || null
  }

  return null
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === "user"
  const content = message.message?.content

  if (message.isMeta) return null

  const textContent = content ? extractTextContent(content) : null

  if (!textContent || textContent.trim().length === 0) return null
  if (textContent.includes("<command-name>")) return null
  if (textContent.includes("<local-command-")) return null

  return (
    <div className={cn("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <div className="mb-1 text-xs opacity-70">
          {isUser ? "You" : "Claude"}
        </div>
        <div className="whitespace-pre-wrap break-words text-sm">
          {textContent}
        </div>
      </div>
    </div>
  )
}
