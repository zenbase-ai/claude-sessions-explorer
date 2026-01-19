import type { SessionMessage, MessageContent } from "@/types";

interface MessageBubbleProps {
  message: SessionMessage;
}

function extractTextContent(
  content: string | MessageContent[]
): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const part of content) {
      if (part.type === "text" && part.text) {
        textParts.push(part.text);
      } else if (part.type === "tool_use" && part.name) {
        textParts.push(`[Tool: ${part.name}]`);
      } else if (part.type === "tool_result" && part.content) {
        textParts.push(`[Tool Result: ${part.content.slice(0, 100)}...]`);
      }
    }
    return textParts.join("\n") || null;
  }

  return null;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === "user";
  const content = message.message?.content;

  // Skip meta messages and messages with no displayable content
  if (message.isMeta) return null;

  const textContent = content ? extractTextContent(content) : null;

  // Skip if no text content to display
  if (!textContent || textContent.trim().length === 0) return null;

  // Skip command messages
  if (textContent.includes("<command-name>")) return null;
  if (textContent.includes("<local-command-")) return null;

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        <div className="mb-1 text-xs opacity-70">
          {isUser ? "You" : "Claude"}
        </div>
        <div className="whitespace-pre-wrap break-words text-sm">
          {textContent}
        </div>
      </div>
    </div>
  );
}
