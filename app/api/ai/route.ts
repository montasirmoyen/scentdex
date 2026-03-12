import { NextResponse, type NextRequest } from 'next/server';
import OpenAI from 'openai';

const API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

const SYSTEM_PROMPT = `You are ScentDex AI, a fragrance specialist assistant.

Your scope is strictly limited to perfume and fragrance-related topics, including:
- perfume recommendations
- notes, accords, and fragrance families
- longevity, projection, and sillage
- seasons, occasions, and wearability
- layering and fragrance wardrobe building
- fragrance comparisons and alternatives
- basic scent chemistry and application tips

If the user asks about anything outside fragrance/perfume, politely refuse in one short sentence and redirect them to ask a fragrance-related question.

Be concise, practical, and clear. Never claim personal real-world experience. If information is uncertain, say so.`;

type IncomingMessage = {
    role: 'user' | 'assistant';
    content: string;
};

function isIncomingMessage(value: unknown): value is IncomingMessage {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const maybeMessage = value as Record<string, unknown>;
    return (
        (maybeMessage.role === 'user' || maybeMessage.role === 'assistant') &&
        typeof maybeMessage.content === 'string'
    );
}

function toResponseMessageContent(content: unknown): string {
    if (typeof content === 'string') {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((part) => {
                if (typeof part === 'object' && part !== null && 'text' in part) {
                    const partText = (part as { text?: unknown }).text;
                    return typeof partText === 'string' ? partText : '';
                }

                return '';
            })
            .join('')
            .trim();
    }

    return '';
}

export async function POST(request: NextRequest) {
    try {
        if (!API_KEY) {
            console.error('API key not configured');
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        const body: { messages?: unknown; prompt?: unknown } = await request.json();
        const rawMessages: unknown[] = Array.isArray(body.messages) ? body.messages : [];
        const prePrompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
        const prompt = prePrompt + " - If the question is not fragrance-related, please politely redirect the user to ask a fragrance-related question. No matter what the user asks, the response must be fragrance-related.";

        const history: IncomingMessage[] = rawMessages
            .filter((message: unknown): message is IncomingMessage => isIncomingMessage(message))
            .map((message: IncomingMessage) => ({
                role: message.role,
                content: message.content.trim(),
            }))
            .filter((message: IncomingMessage) => message.content.length > 0)
            .slice(-12);

        const hasUserMessageInHistory = history.some(
            (message: IncomingMessage) => message.role === 'user'
        );

        if (!hasUserMessageInHistory && prompt.length === 0) {
            return NextResponse.json(
                { error: 'Please provide a fragrance-related question.' },
                { status: 400 }
            );
        }

        if (!hasUserMessageInHistory && prompt.length > 0) {
            history.push({ role: 'user', content: prompt });
        }

        const openai = new OpenAI({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: API_KEY,
            defaultHeaders: {
                'X-Title': 'ScentDex',
            },
        });

        const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT,
                },
                ...history,
            ],
            temperature: 0.6,
        });

        const response = toResponseMessageContent(completion.choices[0]?.message?.content);

        if (!response) {
            return NextResponse.json(
                { error: 'The AI did not return a valid response. Please try again.' },
                { status: 502 }
            );
        }

        return NextResponse.json({ success: true, response });
    } catch (error: unknown) {
        if (error instanceof OpenAI.APIError && error.status === 401) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your API key.' },
                { status: 401 }
            );
        }

        if (error instanceof OpenAI.APIError && error.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        }

        const message =
            error instanceof Error
                ? error.message
                : 'Unknown error while contacting the AI provider.';

        return NextResponse.json(
            { error: 'Failed to receive a response from the AI. Please try again. ' + message },
            { status: 500 }
        );
    }
}