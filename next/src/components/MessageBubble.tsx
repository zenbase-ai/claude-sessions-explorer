/**
 * MessageBubble Component
 *
 * Renders a single message in a conversation view, styled as a chat bubble.
 * Supports different message types: text, tool use, and tool results.
 *
 * Features:
 * - Markdown rendering for text content
 * - Collapsible tool use blocks showing tool name and input
 * - Collapsible tool result blocks with preview/expand functionality
 * - Filters out internal command messages (e.g., <command-name> tags)
 * - Different styling for user vs assistant messages
 *
 * Used by: /sessions/[id] page to display conversation history
 */

"use client"

import { useState } from "react"
import Markdown from "react-markdown"
import { cn } from "@/lib/utils"
import type { SessionMessage, MessageContent } from "@/types"

/**
 * Props for the MessageBubble component
 */
type MessageBubbleProps = {
  /** The session message to render */
  message: SessionMessage
}

/**
 * Internal representation of a parsed content part.
 * Messages can contain multiple parts of different types.
 */
type ContentPart = {
  /** The type of content: text, tool_use, or tool_result */
  type: "text" | "tool_use" | "tool_result"
  /** The content string to display */
  content: string
  /** Tool name (only for tool_use type) */
  toolName?: string
}

/**
 * Parses message content into an array of typed content parts.
 * Handles both simple string content and complex array content.
 *
 * @param content - Raw message content (string or MessageContent array)
 * @returns Array of parsed content parts for rendering
 */
const parseContent = (content: string | MessageContent[]): ContentPart[] => {
  // Simple string content -> single text part
  if (typeof content === "string") {
    return [{ type: "text", content }]
  }

  // Array content -> multiple parts of different types
  if (Array.isArray(content)) {
    const parts: ContentPart[] = []
    for (const part of content) {
      if (part.type === "text" && part.text) {
        parts.push({ type: "text", content: part.text })
      } else if (part.type === "tool_use" && part.name) {
        // Tool use shows the tool name and its input parameters
        const inputStr = part.input
          ? typeof part.input === "string"
            ? part.input
            : JSON.stringify(part.input, null, 2)
          : ""
        parts.push({
          type: "tool_use",
          content: inputStr,
          toolName: part.name,
        })
      } else if (part.type === "tool_result") {
        // Tool results show the output from tool execution
        const resultContent =
          typeof part.content === "string"
            ? part.content
            : JSON.stringify(part.content, null, 2)
        parts.push({
          type: "tool_result",
          content: resultContent || "",
        })
      }
    }
    return parts
  }

  return []
}

/**
 * Renders a collapsible block showing a tool invocation.
 * Displays the tool name as a header with expandable input parameters.
 */
const ToolUseBlock: React.FC<{ toolName: string; content: string }> = ({
  toolName,
  content,
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cn("size-4 text-blue-500 transition-transform", isExpanded && "rotate-90")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-mono text-xs text-blue-500">{toolName}</span>
      </button>
      {isExpanded && content && (
        <pre className="max-h-64 overflow-auto border-t border-border bg-muted/50 p-3 font-mono text-xs">
          {content}
        </pre>
      )}
    </div>
  )
}

/**
 * Renders a collapsible block showing tool execution results.
 * Shows a preview (first 150 chars) with option to expand.
 */
const ToolResultBlock: React.FC<{ content: string }> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const preview = content.slice(0, 150)
  const hasMore = content.length > 150

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-card">
      <div className="px-3 py-2">
        <div className="mb-1 text-xs text-muted-foreground">Tool Result</div>
        <pre className="overflow-hidden font-mono text-xs text-muted-foreground">
          {isExpanded ? content : preview}
          {hasMore && !isExpanded && "..."}
        </pre>
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Main MessageBubble component.
 * Renders a chat bubble with the message content, styled differently for user/assistant.
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === "user"
  const content = message.message?.content

  // Skip meta messages (system messages not meant for display)
  if (message.isMeta) return null

  const parts = content ? parseContent(content) : []

  // Skip if no parseable content
  if (parts.length === 0) return null

  // Filter out internal command messages (Claude Code internal tags)
  const textParts = parts.filter((p) => p.type === "text")
  const hasOnlyInternalCommands = textParts.every(
    (p) =>
      p.content.includes("<command-name>") ||
      p.content.includes("<local-command-")
  )

  // Skip if message only contains internal commands
  if (textParts.length > 0 && hasOnlyInternalCommands) return null

  return (
    <div className={cn("flex mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-foreground border border-border"
        )}
      >
        {/* Message sender label */}
        <div className="mb-1.5 text-xs font-medium opacity-70">
          {isUser ? "You" : "Claude"}
        </div>

        {/* Message content parts */}
        <div className="space-y-2">
          {parts.map((part, idx) => {
            if (part.type === "text") {
              // Skip internal command messages
              if (
                part.content.includes("<command-name>") ||
                part.content.includes("<local-command-")
              ) {
                return null
              }
              // Render text with markdown support
              return (
                <div
                  key={idx}
                  className={cn(
                    "prose prose-sm max-w-none break-words",
                    isUser
                      ? "prose-invert"
                      : "dark:prose-invert"
                  )}
                >
                  <Markdown>{part.content}</Markdown>
                </div>
              )
            }

            if (part.type === "tool_use") {
              return (
                <ToolUseBlock
                  key={idx}
                  toolName={part.toolName || "Tool"}
                  content={part.content}
                />
              )
            }

            if (part.type === "tool_result") {
              return <ToolResultBlock key={idx} content={part.content} />
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
