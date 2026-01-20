import Anthropic from '@anthropic-ai/sdk'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { toolDefinitions, executeTool } from '@/lib/tools'
import { buildContext, buildSystemPrompt } from '@/lib/context'

export const runtime = 'nodejs'
export const maxDuration = 60

function createSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const { message, profileId } = await request.json()

    if (!message || !profileId) {
      return new Response('Missing message or profileId', { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Verify user owns this profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404 })
    }

    // Save user message to chat history
    await supabase.from('chat_history').insert({
      profile_id: profileId,
      role: 'user',
      content: message,
    })

    // Build context for Claude
    const context = await buildContext(profileId, supabase)
    const systemPrompt = buildSystemPrompt(context)

    // Build messages array including recent history
    const messages: Anthropic.MessageParam[] = [
      ...context.recentMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Process in background
    ;(async () => {
      try {
        let fullResponse = ''
        let currentMessages = messages

        // Loop to handle tool use
        while (true) {
          const response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: systemPrompt,
            tools: toolDefinitions,
            messages: currentMessages,
          })

          // Check if there are tool uses
          const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
          )

          // Stream any text content
          for (const block of response.content) {
            if (block.type === 'text') {
              fullResponse += block.text
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ content: block.text })}\n\n`)
              )
            }
          }

          // If no tool uses, we're done
          if (toolUseBlocks.length === 0) {
            break
          }

          // Execute tools and build tool results
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const toolUse of toolUseBlocks) {
            const result = await executeTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              profileId,
              supabase
            )
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: result,
            })
          }

          // Add assistant response and tool results to messages
          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: response.content },
            { role: 'user', content: toolResults },
          ]

          // If stop reason is end_turn after tools, continue to get final response
          if (response.stop_reason === 'end_turn') {
            break
          }
        }

        // Save assistant response to chat history
        if (fullResponse) {
          await supabase.from('chat_history').insert({
            profile_id: profileId,
            role: 'assistant',
            content: fullResponse,
          })
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'))
        await writer.close()
      } catch (error) {
        console.error('Stream error:', error)
        await writer.write(
          encoder.encode(
            `data: ${JSON.stringify({ content: '\n\nSorry, I encountered an error. Please try again.' })}\n\n`
          )
        )
        await writer.write(encoder.encode('data: [DONE]\n\n'))
        await writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
