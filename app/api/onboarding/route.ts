import Anthropic from '@anthropic-ai/sdk'
import { onboardingToolDefinitions, executeOnboardingTool, OnboardingProfile } from '@/lib/onboarding-tools'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding-context'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { message, profile, step, messages: chatHistory } = await request.json() as {
      message: string
      profile: OnboardingProfile
      step: number
      messages: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!message) {
      return new Response('Missing message', { status: 400 })
    }

    // Note: Onboarding API is now public since it runs before user signup
    // Profile data is stored in sessionStorage on the client until signup

    // Build the system prompt based on current state
    const systemPrompt = buildOnboardingSystemPrompt(profile, step)

    // Build messages array including chat history
    const messages: Anthropic.MessageParam[] = [
      ...chatHistory.map((m) => ({
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

    // Track profile updates
    const profileUpdates: Partial<OnboardingProfile> = {}

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
            tools: onboardingToolDefinitions,
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
            const result = await executeOnboardingTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              { ...profile, ...profileUpdates },
              (updates) => {
                Object.assign(profileUpdates, updates)
              }
            )

            // Send profile update to client
            if (Object.keys(profileUpdates).length > 0) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ profileUpdate: profileUpdates })}\n\n`)
              )
            }

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

        // Send final profile updates if any
        if (Object.keys(profileUpdates).length > 0) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ profileUpdate: profileUpdates })}\n\n`)
          )
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'))
        await writer.close()
      } catch (error) {
        console.error('Onboarding stream error:', error)
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
    console.error('Onboarding API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
