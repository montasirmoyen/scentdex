import { NextResponse, type NextRequest } from 'next/server';
import OpenAI from 'openai';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const API_KEY = process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3-4b:free';
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const RATE_LIMIT_WINDOW = '60 s';
const RATE_LIMIT_MAX_REQUESTS = 10;
const MAX_REQUEST_BYTES = 8 * 1024;
const MAX_PROMPT_CHARS = 1_000;
const FRAGRANCE_SCOPE_SUFFIX =
    ' If the question is not fragrance-related, politely redirect the user to ask a fragrance-related question.';

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

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: API_KEY,
    defaultHeaders: {
        'X-Title': 'ScentDex',
    },
});

const redis =
    UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
              url: UPSTASH_REDIS_REST_URL,
              token: UPSTASH_REDIS_REST_TOKEN,
          })
        : null;

const ratelimit =
    redis === null
        ? null
        : new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW),
          });

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

    return request.headers.get('user-agent')?.slice(0, 120) || 'unknown-client';
}

function getContentLengthHeader(request: NextRequest): number | null {
    const raw = request.headers.get('content-length');
    if (!raw) {
        return null;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
        return null;
    }

    return parsed;
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

        if (!ratelimit) {
            return NextResponse.json(
                {
                    error:
                        'Shared rate limiter is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.',
                },
                { status: 500 }
            );
        }

        const declaredLength = getContentLengthHeader(request);
        if (declaredLength !== null && declaredLength > MAX_REQUEST_BYTES) {
            return NextResponse.json(
                {
                    error: `Request payload is too large. Max size is ${MAX_REQUEST_BYTES} bytes.`,
                },
                { status: 413 }
            );
        }

        const identifier = getClientIdentifier(request);
        const rateLimit = await ratelimit.limit(`scentdex:ai:${identifier}`);

        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((rateLimit.reset - Date.now()) / 1000)
        );

        if (!rateLimit.success) {
            return NextResponse.json(
                {
                    error: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(retryAfterSeconds),
                        'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                        'X-RateLimit-Reset': String(rateLimit.reset),
                    },
                }
            );
        }

        const rawBody = await request.text();
        const requestBytes = new TextEncoder().encode(rawBody).length;

        if (requestBytes > MAX_REQUEST_BYTES) {
            return NextResponse.json(
                {
                    error: `Request payload is too large. Max size is ${MAX_REQUEST_BYTES} bytes.`,
                },
                { status: 413 }
            );
        }

        let body: { prompt?: unknown };

        try {
            body = JSON.parse(rawBody) as { prompt?: unknown };
        } catch {
            return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 });
        }

        const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

        if (prompt.length === 0) {
            return NextResponse.json(
                { error: 'Please provide a fragrance-related question.' },
                { status: 400 }
            );
        }

        if (prompt.length > MAX_PROMPT_CHARS) {
            return NextResponse.json(
                {
                    error: `Prompt is too long. Max length is ${MAX_PROMPT_CHARS} characters.`,
                },
                { status: 413 }
            );
        }

        const scopedPrompt = `${prompt}${FRAGRANCE_SCOPE_SUFFIX}`;

        const completion = await openai.chat.completions.create({
            model: AI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: scopedPrompt,
                },
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
                        'X-RateLimit-Reset': String(rateLimit.reset),
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
                    'X-RateLimit-Reset': String(rateLimit.reset),
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