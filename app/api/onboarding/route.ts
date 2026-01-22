import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, FunctionDeclarationsTool, FunctionDeclaration, SchemaType } from '@google/generative-ai'
import { executeOnboardingTool, OnboardingProfile } from '@/lib/onboarding-tools'
import { buildOnboardingSystemPrompt } from '@/lib/onboarding-context'

export const runtime = 'nodejs'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Convert onboarding tools to Gemini function declarations
const onboardingFunctions: FunctionDeclaration[] = [
  {
    name: 'update_profile_field',
    description: "Update a single field in the user's profile. Use this to save information as the user shares it.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        field: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['name', 'age', 'height_feet', 'height_inches', 'start_weight', 'goal_weight', 'activity_level', 'goal', 'dietary_restrictions'],
          description: 'The profile field to update',
        },
        value: {
          type: SchemaType.STRING,
          description: 'The value to set for the field (string or number)',
        },
      },
      required: ['field', 'value'],
    },
  },
  {
    name: 'update_stats',
    description: 'Update age, sex, height, and weight all at once. Use this when the user provides their stats together (e.g., "33, male, 5\'10, 184 lbs").',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        age: {
          type: SchemaType.INTEGER,
          description: 'Age in years',
        },
        sex: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['male', 'female'],
          description: 'Biological sex (male or female)',
        },
        height_feet: {
          type: SchemaType.INTEGER,
          description: 'Height feet component (e.g., 5 for 5\'10")',
        },
        height_inches: {
          type: SchemaType.INTEGER,
          description: 'Height inches component (e.g., 10 for 5\'10")',
        },
        weight: {
          type: SchemaType.NUMBER,
          description: 'Weight in pounds',
        },
      },
      required: ['age', 'sex', 'height_feet', 'height_inches', 'weight'],
    },
  },
  {
    name: 'calculate_recommendations',
    description: "Calculate personalized daily nutrition targets based on the user's profile. Call this once you have their height, weight, activity level, and goal.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        height_inches: {
          type: SchemaType.INTEGER,
          description: 'Total height in inches',
        },
        weight_lbs: {
          type: SchemaType.NUMBER,
          description: 'Current weight in pounds',
        },
        age: {
          type: SchemaType.INTEGER,
          description: 'Age in years (estimate if not provided)',
        },
        sex: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['male', 'female'],
          description: 'Biological sex for TDEE calculation (estimate if not provided)',
        },
        activity_level: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
          description: 'Activity level',
        },
        goal: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['lose', 'maintain', 'gain'],
          description: 'Weight goal',
        },
      },
      required: ['height_inches', 'weight_lbs', 'activity_level', 'goal'],
    },
  },
  {
    name: 'set_recommendations',
    description: 'Set the calculated nutrition recommendations in the profile.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        daily_calories: {
          type: SchemaType.INTEGER,
          description: 'Daily calorie target',
        },
        daily_protein: {
          type: SchemaType.INTEGER,
          description: 'Daily protein target in grams',
        },
        daily_carbs: {
          type: SchemaType.INTEGER,
          description: 'Daily carbs target in grams',
        },
        daily_fat: {
          type: SchemaType.INTEGER,
          description: 'Daily fat target in grams',
        },
        tdee: {
          type: SchemaType.INTEGER,
          description: 'Total Daily Energy Expenditure (for adjustment calculations)',
        },
        bmr: {
          type: SchemaType.INTEGER,
          description: 'Basal Metabolic Rate (minimum safe calories)',
        },
      },
      required: ['daily_calories', 'daily_protein', 'daily_carbs', 'daily_fat'],
    },
  },
  {
    name: 'adjust_plan',
    description: 'Adjust the current plan to be more aggressive or more conservative. Use this when the user clicks the adjustment buttons.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        direction: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['more_aggressive', 'more_conservative'],
          description: 'Whether to make the plan more aggressive (lower calories for cut, higher for bulk) or more conservative',
        },
        current_calories: {
          type: SchemaType.INTEGER,
          description: 'Current calorie target',
        },
        tdee: {
          type: SchemaType.INTEGER,
          description: 'Total Daily Energy Expenditure',
        },
        bmr: {
          type: SchemaType.INTEGER,
          description: 'Basal Metabolic Rate (minimum safe calories)',
        },
        goal: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: ['lose', 'maintain', 'gain'],
          description: "User's goal",
        },
        weight_lbs: {
          type: SchemaType.NUMBER,
          description: "User's weight in pounds (for protein calculation)",
        },
      },
      required: ['direction', 'current_calories', 'tdee', 'bmr', 'goal', 'weight_lbs'],
    },
  },
]

const onboardingTools: FunctionDeclarationsTool = {
  functionDeclarations: onboardingFunctions,
}

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

    // Build messages array including chat history (transform roles for Gemini)
    const history: Content[] = chatHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Create model with function calling
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      tools: [onboardingTools],
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
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

        // Start chat with history
        const chat = model.startChat({
          history,
        })

        // Send message
        let result = await chat.sendMessage(message)
        let response = result.response

        // Loop to handle function calls
        while (true) {
          // Get function calls from response
          const functionCalls = response.functionCalls()

          // Stream any text content
          const text = response.text()
          if (text) {
            // Add space between concatenated responses if needed
            const needsSpace = fullResponse.length > 0
              && !/\s$/.test(fullResponse)
              && !/^\s/.test(text)
            const textToSend = needsSpace ? ' ' + text : text
            fullResponse += textToSend
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: textToSend })}\n\n`)
            )
          }

          // If no function calls, we're done
          if (!functionCalls || functionCalls.length === 0) {
            break
          }

          // Execute functions and collect results
          const functionResponses = []
          for (const call of functionCalls) {
            // Convert string value to appropriate type for update_profile_field
            let input = call.args as Record<string, unknown>
            if (call.name === 'update_profile_field' && input.value) {
              const field = input.field as string
              const value = input.value as string
              // Convert to number for numeric fields
              if (['age', 'height_feet', 'height_inches', 'start_weight', 'goal_weight'].includes(field)) {
                input = { ...input, value: Number(value) }
              }
            }

            const toolResult = await executeOnboardingTool(
              call.name,
              input,
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

            functionResponses.push({
              name: call.name,
              response: { result: toolResult },
            })
          }

          // Send function responses back to the model
          result = await chat.sendMessage(
            functionResponses.map(fr => ({
              functionResponse: fr,
            }))
          )
          response = result.response
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
