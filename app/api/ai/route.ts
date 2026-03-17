import { NextResponse, type NextRequest } from 'next/server';
import OpenAI from 'openai';

const API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
    scentDexAiRateLimit?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalForRateLimit.scentDexAiRateLimit ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.scentDexAiRateLimit) {
    globalForRateLimit.scentDexAiRateLimit = rateLimitStore;
}

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

function getClientIdentifier(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        const firstAddress = forwardedFor.split(',')[0]?.trim();
        if (firstAddress) {
            return firstAddress;
        }
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    return 'unknown';
}

function consumeRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
    resetAt: number;
} {
    const now = Date.now();

    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
            rateLimitStore.delete(key);
        }
    }

    const existingEntry = rateLimitStore.get(identifier);

    if (!existingEntry || existingEntry.resetAt <= now) {
        const resetAt = now + RATE_LIMIT_WINDOW_MS;
        rateLimitStore.set(identifier, { count: 1, resetAt });
        return {
            allowed: true,
            remaining: RATE_LIMIT_MAX_REQUESTS - 1,
            retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
            resetAt,
        };
    }

    if (existingEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
            resetAt: existingEntry.resetAt,
        };
    }

    existingEntry.count += 1;
    rateLimitStore.set(identifier, existingEntry);

    return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - existingEntry.count,
        retryAfterSeconds: Math.max(1, Math.ceil((existingEntry.resetAt - now) / 1000)),
        resetAt: existingEntry.resetAt,
    };
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

        const identifier = getClientIdentifier(request);
        const rateLimit = consumeRateLimit(identifier);

        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(rateLimit.retryAfterSeconds),
                        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                        'X-RateLimit-Reset': String(rateLimit.resetAt),
                    },
                }
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
                {
                    status: 502,
                    headers: {
                        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                        'X-RateLimit-Reset': String(rateLimit.resetAt),
                    },
                }
            );
        }

        return NextResponse.json(
            { success: true, response },
            {
                headers: {
                    'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                    'X-RateLimit-Reset': String(rateLimit.resetAt),
                },
            }
        );
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