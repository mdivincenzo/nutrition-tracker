import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
  }
  compact?: boolean
}

// Extract the last paragraph if it's a question (CTA)
function extractCTA(content: string): { mainContent: string; cta: string | null } {
  const trimmed = content.trim()

  // Split by double newlines to find paragraphs
  const paragraphs = trimmed.split(/\n\n+/)
  if (paragraphs.length === 0) return { mainContent: content, cta: null }

  const lastParagraph = paragraphs[paragraphs.length - 1].trim()

  // Check if last paragraph ends with a question mark and isn't a header/list
  const isQuestion = lastParagraph.endsWith('?') &&
    !lastParagraph.startsWith('#') &&
    !lastParagraph.startsWith('-') &&
    !lastParagraph.startsWith('*') &&
    !lastParagraph.includes('|') // not a table

  if (isQuestion && paragraphs.length > 1) {
    const mainContent = paragraphs.slice(0, -1).join('\n\n')
    return { mainContent, cta: lastParagraph }
  }

  return { mainContent: content, cta: null }
}

export default function ChatMessage({ message, compact = false }: ChatMessageProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className={`chat-bubble-user ${compact ? 'max-w-[85%]' : 'max-w-[80%]'}`}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }

  // Compact mode: use bubble style for assistant messages too
  if (compact) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] chat-bubble-assistant">
          <p className="whitespace-pre-wrap leading-relaxed text-text-secondary">{message.content}</p>
        </div>
      </div>
    )
  }

  // Standard mode: Assistant messages full width, no bubble, larger text
  const { mainContent, cta } = extractCTA(message.content)

  return (
    <div className="w-full">
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
      </div>
      {cta && (
        <div className="cta-question mt-6">
          <p>{cta}</p>
        </div>
      )}
    </div>
  )
}
