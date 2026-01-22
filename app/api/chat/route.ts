import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Content, Part, SchemaType, ResponseSchema } from '@google/generative-ai'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildContext, buildSystemPrompt } from '@/lib/context'
import { getLocalDateString } from '@/lib/date-utils'

export const runtime = 'nodejs'
export const maxDuration = 60

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Schema for structured meal extraction
const mealSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    name: {
      type: SchemaType.STRING,
      description: "Food/meal name, e.g. 'Grilled chicken breast with rice'",
    },
    time_of_day: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    calories: { type: SchemaType.INTEGER },
    protein: { type: SchemaType.NUMBER },
    carbs: { type: SchemaType.NUMBER },
    fat: { type: SchemaType.NUMBER },
    tags: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Optional tags like 'high-protein', 'post-workout'",
    },
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fat'],
}

// Schema for structured workout extraction
const workoutSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    exercise: {
      type: SchemaType.STRING,
      description: 'Name of the exercise or workout',
    },
    type: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['cardio', 'strength'],
    },
    duration_minutes: { type: SchemaType.INTEGER },
    calories_burned: { type: SchemaType.INTEGER },
  },
  required: ['exercise'],
}

// Schema for weight logging
const weightSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    weight: {
      type: SchemaType.NUMBER,
      description: 'Weight in pounds',
    },
    body_fat: {
      type: SchemaType.NUMBER,
      description: 'Body fat percentage (optional)',
    },
  },
  required: ['weight'],
}

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

// Detect what type of logging the user wants based on message content
function detectLoggingIntent(message: string): 'meal' | 'workout' | 'weight' | null {
  const lowerMessage = message.toLowerCase()

  // Weight logging patterns
  if (
    lowerMessage.match(/\b(weigh|weighed|weight is|at \d+\s*(lbs?|pounds?))\b/) ||
    lowerMessage.match(/\d+\s*(lbs?|pounds?)\s*(this morning|today)/)
  ) {
    return 'weight'
  }

  // Workout logging patterns
  if (
    lowerMessage.match(/\b(worked out|workout|exercised|ran|jogged|lifted|gym|cycling|biked|hiit|yoga|pilates|swam|swimming)\b/) ||
    lowerMessage.match(/\b(did|finished|completed)\s+(a|my)?\s*(run|lift|workout|cardio|exercise)/)
  ) {
    return 'workout'
  }

  // Meal logging patterns (most common)
  if (
    lowerMessage.match(/\b(ate|had|eating|just had|for (breakfast|lunch|dinner|snack))\b/) ||
    lowerMessage.match(/\b(chicken|salmon|rice|salad|eggs|oatmeal|protein|steak|burger|pizza|pasta|sandwich)\b/)
  ) {
    return 'meal'
  }

  return null
}

export async function POST(request: Request) {
  try {
    const { message, profileId, image } = await request.json() as {
      message: string
      profileId: string
      image?: { base64: string; mimeType: string }
    }

    if (!message || !profileId) {
      return new Response('Missing message or profileId', { status: 400 })
    }

    // Debug: Log received data
    console.log('=== CHAT API REQUEST ===')
    console.log('Message:', message)
    console.log('ProfileId:', profileId)
    console.log('Image received:', image ? `Yes (${image.mimeType}, ${image.base64.length} chars)` : 'No')

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

    // Build context for Gemini
    const context = await buildContext(profileId, supabase)
    const systemPrompt = buildSystemPrompt(context)

    // Build message history for Gemini (transform roles)
    // Gemini requires history to start with 'user' role, so filter out leading assistant messages
    let filteredMessages = context.recentMessages
    while (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
      filteredMessages = filteredMessages.slice(1)
    }

    const history: Content[] = filteredMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Build current message parts (with optional image)
    const messageParts: Part[] = []
    if (image) {
      console.log('=== BUILDING IMAGE MESSAGE ===')
      console.log('Image mimeType:', image.mimeType)
      console.log('Image base64 length:', image.base64.length)
      console.log('Image base64 preview:', image.base64.substring(0, 50) + '...')
      messageParts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      })
      messageParts.push({
        text: message || "What's in this meal? Estimate the macros and log it for me.",
      })
      console.log('MessageParts built:', messageParts.length, 'parts')
      console.log('Part 0 has inlineData:', !!messageParts[0].inlineData)
      console.log('Part 1 text:', messageParts[1]?.text)
    } else {
      messageParts.push({ text: message })
    }

    // Create conversational model
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
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

    // Process in background
    ;(async () => {
      try {
        let fullResponse = ''
        const today = getLocalDateString()

        // Detect logging intent
        const loggingIntent = image ? 'meal' : detectLoggingIntent(message)

        // Start chat with history
        const chat = model.startChat({
          history,
        })

        // Send message and stream response
        console.log('=== SENDING TO GEMINI ===')
        console.log('MessageParts count:', messageParts.length)
        console.log('MessageParts[0] type:', messageParts[0]?.inlineData ? 'inlineData' : 'text')
        if (messageParts[0]?.inlineData) {
          console.log('InlineData mimeType:', messageParts[0].inlineData.mimeType)
          console.log('InlineData data length:', messageParts[0].inlineData.data?.length)
        }
        const result = await chat.sendMessageStream(messageParts)

        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullResponse += text
            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
            )
          }
        }

        // After conversational response, check if we need to extract structured data
        if (loggingIntent === 'meal') {
          await extractAndLogMeal(message, image, profileId, today, supabase)
        } else if (loggingIntent === 'workout') {
          await extractAndLogWorkout(message, profileId, today, supabase)
        } else if (loggingIntent === 'weight') {
          await extractAndLogWeight(message, profileId, today, supabase)
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
      } catch (error: unknown) {
        // Detailed error logging for Gemini failures
        console.error('=== GEMINI STREAM ERROR ===')
        console.error('Error type:', typeof error)
        console.error('Error:', error)

        if (error instanceof Error) {
          console.error('Error name:', error.name)
          console.error('Error message:', error.message)
          console.error('Error stack:', error.stack)
        }

        // Check for Gemini-specific error properties
        const geminiError = error as { status?: number; statusText?: string; errorDetails?: unknown; response?: unknown }
        if (geminiError.status) console.error('Status code:', geminiError.status)
        if (geminiError.statusText) console.error('Status text:', geminiError.statusText)
        if (geminiError.errorDetails) console.error('Error details:', JSON.stringify(geminiError.errorDetails, null, 2))
        if (geminiError.response) console.error('Response:', geminiError.response)

        console.error('=== END ERROR ===')

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
  } catch (error: unknown) {
    console.error('=== CHAT API ERROR ===')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    console.error('=== END ERROR ===')
    return new Response('Internal server error', { status: 500 })
  }
}

// Extract structured meal data and log to database
async function extractAndLogMeal(
  message: string,
  image: { base64: string; mimeType: string } | undefined,
  profileId: string,
  date: string,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  try {
    const structuredModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'Extract meal data as JSON. Be precise with macro estimates. If the user mentions multiple foods, combine them into one meal entry.',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: mealSchema,
      },
    })

    const parts: Part[] = []
    if (image) {
      parts.push({
        inlineData: {
          data: image.base64,
          mimeType: image.mimeType,
        },
      })
    }
    parts.push({
      text: `Extract the meal from this: "${message}". Return JSON with name, calories, protein, carbs, fat, and optionally time_of_day and tags.`,
    })

    const result = await structuredModel.generateContent(parts)
    const response = result.response
    const text = response.text()

    const mealData = JSON.parse(text)

    // Log to database
    await supabase.from('meals').insert({
      profile_id: profileId,
      date,
      name: mealData.name,
      time_of_day: mealData.time_of_day || null,
      calories: mealData.calories,
      protein: mealData.protein,
      carbs: mealData.carbs,
      fat: mealData.fat,
      tags: mealData.tags || null,
    })
  } catch (error: unknown) {
    console.error('=== MEAL EXTRACTION ERROR ===')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
    }
    const geminiError = error as { status?: number; errorDetails?: unknown }
    if (geminiError.status) console.error('Status code:', geminiError.status)
    if (geminiError.errorDetails) console.error('Error details:', JSON.stringify(geminiError.errorDetails, null, 2))
    console.error('=== END ERROR ===')
  }
}

// Extract structured workout data and log to database
async function extractAndLogWorkout(
  message: string,
  profileId: string,
  date: string,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  try {
    const structuredModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'Extract workout data as JSON. Estimate calories burned based on typical exercise values.',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: workoutSchema,
      },
    })

    const result = await structuredModel.generateContent(
      `Extract the workout from this: "${message}". Return JSON with exercise, type (cardio or strength), duration_minutes, and calories_burned.`
    )
    const response = result.response
    const text = response.text()

    const workoutData = JSON.parse(text)
    console.log('=== WORKOUT EXTRACTION ===')
    console.log('Raw Gemini response:', text)
    console.log('Parsed workout data:', JSON.stringify(workoutData, null, 2))

    // Log to database
    const insertData = {
      profile_id: profileId,
      date,
      exercise: workoutData.exercise,
      type: workoutData.type || null,
      duration_minutes: workoutData.duration_minutes || null,
      calories_burned: workoutData.calories_burned || null,
    }
    console.log('Inserting to database:', JSON.stringify(insertData, null, 2))
    const { data: insertedWorkout, error: insertError } = await supabase.from('workouts').insert(insertData).select()
    if (insertError) {
      console.error('Workout insert error:', insertError)
    } else {
      console.log('Workout inserted successfully:', insertedWorkout)
    }
  } catch (error: unknown) {
    console.error('=== WORKOUT EXTRACTION ERROR ===')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
    }
    const geminiError = error as { status?: number; errorDetails?: unknown }
    if (geminiError.status) console.error('Status code:', geminiError.status)
    if (geminiError.errorDetails) console.error('Error details:', JSON.stringify(geminiError.errorDetails, null, 2))
    console.error('=== END ERROR ===')
  }
}

// Extract structured weight data and log to database
async function extractAndLogWeight(
  message: string,
  profileId: string,
  date: string,
  supabase: ReturnType<typeof createSupabaseClient>
) {
  try {
    const structuredModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: 'Extract weight data as JSON. Weight should be in pounds.',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: weightSchema,
      },
    })

    const result = await structuredModel.generateContent(
      `Extract the weight from this: "${message}". Return JSON with weight (in pounds) and optionally body_fat percentage.`
    )
    const response = result.response
    const text = response.text()

    const weightData = JSON.parse(text)

    // Upsert to database (one weigh-in per day)
    await supabase.from('weigh_ins').upsert(
      {
        profile_id: profileId,
        date,
        weight: weightData.weight,
        body_fat: weightData.body_fat || null,
      },
      { onConflict: 'profile_id,date' }
    )
  } catch (error: unknown) {
    console.error('=== WEIGHT EXTRACTION ERROR ===')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
    }
    const geminiError = error as { status?: number; errorDetails?: unknown }
    if (geminiError.status) console.error('Status code:', geminiError.status)
    if (geminiError.errorDetails) console.error('Error details:', JSON.stringify(geminiError.errorDetails, null, 2))
    console.error('=== END ERROR ===')
  }
}
