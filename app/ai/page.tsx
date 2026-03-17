"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Eraser, Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const COOLDOWN_SECONDS = 5;

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

function renderMessageContent(content: string) {
	const parts: Array<{ text: string; isBold: boolean }> = [];
	const boldPattern = /\*\*(.+?)\*\*/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = boldPattern.exec(content)) !== null) {
		const [fullMatch, boldText] = match;
		const startIndex = match.index;

		if (startIndex > lastIndex) {
			parts.push({ text: content.slice(lastIndex, startIndex), isBold: false });
		}

		parts.push({ text: boldText, isBold: true });
		lastIndex = startIndex + fullMatch.length;
	}

	if (lastIndex < content.length) {
		parts.push({ text: content.slice(lastIndex), isBold: false });
	}

	if (parts.length === 0) {
		return content;
	}

	return parts.map((part, index) =>
		part.isBold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>
	);
}

const STARTER_QUESTIONS = [
	"Recommend a long-lasting office fragrance for summer.",
	"What are the main differences between citrus and woody scents?",
	"Suggest 3 winter date-night fragrances under $150.",
	"How can I make my fragrance last longer on skin?",
];

export default function AiPage() {
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: crypto.randomUUID(),
			role: "assistant",
			content:
				"Ask me anything about fragrances: recommendations, notes, longevity, layering, seasons, and comparisons.",
		},
	]);
	const [prompt, setPrompt] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [cooldownRemaining, setCooldownRemaining] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, isLoading]);

	useEffect(() => {
		if (cooldownRemaining <= 0) {
			return;
		}

		const timeout = window.setTimeout(() => {
			setCooldownRemaining((current) => Math.max(0, current - 1));
		}, 1000);

		return () => window.clearTimeout(timeout);
	}, [cooldownRemaining]);

	const isCooldownActive = cooldownRemaining > 0;
	const canSubmit = useMemo(
		() => prompt.trim().length > 0 && !isLoading && !isCooldownActive,
		[prompt, isLoading, isCooldownActive]
	);

	async function submitMessage(text: string) {
		const trimmed = text.trim();
		if (!trimmed || isLoading || isCooldownActive) {
			return;
		}

		const nextUserMessage: ChatMessage = {
			id: crypto.randomUUID(),
			role: "user",
			content: trimmed,
		};

		const nextMessages = [...messages, nextUserMessage];
		setMessages(nextMessages);
		setPrompt("");
		setError(null);
		setIsLoading(true);

		try {
			const response = await fetch("/api/ai", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: nextMessages.map((message) => ({
						role: message.role,
						content: message.content,
					})),
				}),
			});

			const data = (await response.json()) as { response?: string; error?: string };

			if (!response.ok) {
				throw new Error(data.error || "Could not get a response from the fragrance assistant.");
			}

			if (typeof data.response !== "string") {
				throw new Error("The assistant returned an invalid response.");
			}

			const assistantReply: string = data.response.replace(/^\s+/, "");

			const nextAssistantMessage: ChatMessage = {
				id: crypto.randomUUID(),
				role: "assistant",
				content: assistantReply,
			};

			setMessages([...nextMessages, nextAssistantMessage]);
		} catch (caughtError: unknown) {
			setError(caughtError instanceof Error ? caughtError.message : "Something went wrong.");
		} finally {
			setIsLoading(false);
			setCooldownRemaining(COOLDOWN_SECONDS);
		}
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await submitMessage(prompt);
	}

	function resetConversation() {
		setMessages([
			{
				id: crypto.randomUUID(),
				role: "assistant",
				content:
					"Conversation cleared. Ask me a fragrance question whenever you are ready.",
			},
		]);
		setError(null);
		setPrompt("");
	}

	return (
		<main className="container mx-auto px-4 pb-10">
			<section className="mx-auto w-full max-w-4xl space-y-4">
				<header className="rounded-xl border bg-card p-5">
					<div className="flex items-start justify-between gap-3">
						<div>
							<p className="text-sm text-muted-foreground">ScentDex AI</p>
							<h1 className="text-2xl font-semibold tracking-tight">Fragrance Assistant</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								This assistant only answers fragrance-related questions.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={resetConversation}
							disabled={isLoading}
						>
							<Eraser className="size-4" />
							Clear chat
						</Button>
					</div>

					<Separator className="my-4" />

					<div className="flex flex-wrap gap-2">
						{STARTER_QUESTIONS.map((question) => (
							<Button
								key={question}
								size="sm"
								variant="secondary"
								onClick={() => submitMessage(question)}
								disabled={isLoading || isCooldownActive}
							>
								<Sparkles className="size-3.5" />
								{question}
							</Button>
						))}
					</div>
				</header>

				<div className="rounded-xl border bg-card">
					<ScrollArea className="h-[55vh] p-4">
						<div className="space-y-4">
							{messages.map((message) => {
								const isUser = message.role === "user";
								return (
									<div
										key={message.id}
										className={`flex ${isUser ? "justify-end" : "justify-start"}`}
									>
										<div
											className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
												isUser
													? "bg-primary text-primary-foreground"
													: "border bg-muted/50 text-foreground"
											}`}
										>
											{!isUser && (
												<p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
													<Bot className="size-3.5" />
													ScentDex AI
												</p>
											)}
												<p className="whitespace-pre-wrap">{renderMessageContent(message.content)}</p>
										</div>
									</div>
								);
							})}

							{isLoading && (
								<div className="flex justify-start">
									<div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-3 text-sm">
										<Loader2 className="size-4 animate-spin" />
										Thinking about your fragrance question...
									</div>
								</div>
							)}

							{error && (
								<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
									{error}
								</div>
							)}

							<div ref={bottomRef} />
						</div>
					</ScrollArea>

					<Separator />

					<form onSubmit={handleSubmit} className="space-y-3 p-4">
						<Input
							value={prompt}
							onChange={(event) => setPrompt(event.target.value)}
							placeholder={
								isCooldownActive
									? `Please wait ${cooldownRemaining}s before sending another question...`
									: "Ask a fragrance question..."
							}
							disabled={isLoading || isCooldownActive}
						/>
						<div className="flex items-center justify-between gap-2">
							{isCooldownActive ? (
								<p className="text-xs font-medium text-amber-600">
									Cooldown active: you can send again in {cooldownRemaining}s.
								</p>
							) : (
								<p className="text-xs text-muted-foreground">
									Example: "Recommend a warm vanilla scent for winter nights."
								</p>
							)}
							<Button type="submit" disabled={!canSubmit}>
								{isLoading ? (
									<Loader2 className="size-4 animate-spin" />
								) : isCooldownActive ? (
									<Sparkles className="size-4" />
								) : (
									<Send className="size-4" />
								)}
								{isLoading
									? "Sending..."
									: isCooldownActive
										? `Wait ${cooldownRemaining}s`
										: "Send"}
							</Button>
						</div>
					</form>
				</div>
			</section>
		</main>
	);
}
