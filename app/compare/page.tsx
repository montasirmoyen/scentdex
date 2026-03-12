"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeftRight, RotateCcw, Star, Trophy } from "lucide-react";

import accords from "@/data/accords.json";
import fragranceData from "@/data/fragrances.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type NoteItem = string | { name: string; imageUrl?: string };

type RankingItem = {
	name: string;
	score: number;
};

type Fragrance = {
	ID: number;
	Name: string;
	Brand: string;
	Year?: string;
	rating?: string;
	Gender?: string;
	Popularity?: string;
	Price?: string;
	OilType?: string;
	Longevity?: string;
	Sillage?: string;
	Confidence?: string;
	"Price Value"?: string;
	"Image URL"?: string;
	"Purchase URL"?: string;
	"Main Accords"?: string[];
	"Season Ranking"?: RankingItem[];
	"Occasion Ranking"?: RankingItem[];
	Notes?: Record<string, NoteItem[]>;
};

const fragrances: Fragrance[] = (fragranceData as Omit<Fragrance, "ID">[]).map(
	(fragrance, index) => ({ ...fragrance, ID: index })
);

const SEASONS = ["spring", "summer", "fall", "winter"];
const OCCASIONS = ["professional", "night out", "casual"];

const popularityRank: Record<string, number> = {
	"very high": 5,
	high: 4,
	medium: 3,
	low: 2,
	"very low": 1,
};

const confidenceRank: Record<string, number> = {
	high: 3,
	medium: 2,
	low: 1,
};

const longevityRank: Record<string, number> = {
	very_long_lasting: 5,
	long_lasting: 4,
	moderate: 3,
	weak: 2,
	very_weak: 1,
};

const sillageRank: Record<string, number> = {
	enormous: 5,
	strong: 4,
	moderate: 3,
	intimate: 2,
	soft: 1,
};

const priceValueRank: Record<string, number> = {
	excellent_value: 4,
	good_value: 3,
	fair_value: 2,
	poor_value: 1,
};

function normalize(value: string): string {
	return value.trim().toLowerCase();
}

function parseNumber(value?: string): number | null {
	if (!value) return null;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : null;
}

function formatLabel(value?: string): string {
	if (!value) return "-";
	return value.replaceAll("_", " ");
}

function getRankingScore(items: RankingItem[] | undefined, target: string): number {
	if (!items) return 0;
	const item = items.find((entry) => normalize(entry.name) === normalize(target));
	return item ? Number(item.score) : 0;
}

function getAccordSet(fragrance: Fragrance | null): Set<string> {
	if (!fragrance?.["Main Accords"]) return new Set<string>();
	return new Set(fragrance["Main Accords"].map((accord) => normalize(accord)));
}

function getAllNotesSet(fragrance: Fragrance | null): Set<string> {
	if (!fragrance?.Notes) return new Set<string>();
	const notes = Object.values(fragrance.Notes)
		.flat()
		.map((note) => (typeof note === "string" ? note : note.name))
		.map((note) => normalize(note));
	return new Set(notes);
}

function getLayerNotes(fragrance: Fragrance | null, layer: string): string[] {
	const entries = fragrance?.Notes?.[layer] ?? [];
	return Array.from(
		new Set(
			entries
				.map((item) => (typeof item === "string" ? item : item.name))
				.map((value) => normalize(value))
		)
	);
}

function jaccard(a: Set<string>, b: Set<string>): number {
	if (a.size === 0 && b.size === 0) return 0;
	let intersection = 0;
	for (const value of a) {
		if (b.has(value)) intersection += 1;
	}
	return intersection / (a.size + b.size - intersection);
}

function getTextColor(hex: string): string {
	if (!hex.startsWith("#")) return "var(--foreground)";
	const rgb = Number.parseInt(hex.slice(1), 16);
	const r = (rgb >> 16) & 0xff;
	const g = (rgb >> 8) & 0xff;
	const b = rgb & 0xff;
	return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "black" : "white";
}

function FragranceImage({ fragrance }: { fragrance: Fragrance }) {
	const [broken, setBroken] = useState(false);
	return (
		<Image
			unoptimized
			src={broken ? "/unknown.png" : (fragrance["Image URL"] ?? "/unknown.png")}
			alt={fragrance.Name}
			fill
			className="object-contain p-2"
			onError={() => setBroken(true)}
		/>
	);
}

function WinnerBadge({ show }: { show: boolean }) {
	if (!show) return null;
	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
			<Trophy className="size-3" />
			Winner
		</span>
	);
}

function MetricRow({
	label,
	leftValue,
	rightValue,
	leftScore,
	rightScore,
}: {
	label: string;
	leftValue: string;
	rightValue: string;
	leftScore: number | null;
	rightScore: number | null;
}) {
	const hasBoth = leftScore !== null && rightScore !== null;
	const leftWinner = hasBoth && leftScore > rightScore;
	const rightWinner = hasBoth && rightScore > leftScore;

	return (
		<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-md border px-3 py-2">
			<div className="flex items-center justify-between gap-2">
				<span className="text-sm font-medium">{leftValue}</span>
				<WinnerBadge show={leftWinner} />
			</div>
			<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
			<div className="flex items-center justify-between gap-2">
				<WinnerBadge show={rightWinner} />
				<span className="text-right text-sm font-medium">{rightValue}</span>
			</div>
		</div>
	);
}

function RankBar({
	label,
	left,
	right,
}: {
	label: string;
	left: number;
	right: number;
}) {
	const max = Math.max(left, right, 0.01);
	const leftPct = (left / max) * 100;
	const rightPct = (right / max) * 100;
	const leftWinner = left > right;
	const rightWinner = right > left;

	return (
		<div className="rounded-md border p-3">
			<div className="mb-2 flex items-center justify-between">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
				{left === right ? (
					<span className="text-xs text-muted-foreground">Tie</span>
				) : (
					<span className="text-xs text-muted-foreground">{leftWinner ? "Left" : "Right"} leads</span>
				)}
			</div>
			<div className="space-y-2">
				<div className="space-y-1">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Left</span>
						<span className="font-medium">{left.toFixed(2)}</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className={`h-2 rounded-full transition-all ${leftWinner ? "bg-primary" : "bg-primary/55"}`}
							style={{ width: `${leftPct}%` }}
						/>
					</div>
				</div>
				<div className="space-y-1">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Right</span>
						<span className="font-medium">{right.toFixed(2)}</span>
					</div>
					<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
						<div
							className={`h-2 rounded-full transition-all ${rightWinner ? "bg-primary" : "bg-primary/55"}`}
							style={{ width: `${rightPct}%` }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

type SlotPickerProps = {
	title: string;
	query: string;
	open: boolean;
	setOpen: (value: boolean) => void;
	setQuery: (value: string) => void;
	onSelect: (fragrance: Fragrance) => void;
	selected: Fragrance | null;
	matches: Fragrance[];
	onClear: () => void;
};

function SlotPicker({
	title,
	query,
	open,
	setOpen,
	setQuery,
	onSelect,
	selected,
	matches,
	onClear,
}: SlotPickerProps) {
	return (
		<section className="rounded-xl border bg-card p-4">
			<div className="mb-3 flex items-center justify-between gap-2">
				<p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
				{selected ? (
					<Button variant="ghost" size="sm" onClick={onClear}>
						Clear
					</Button>
				) : null}
			</div>

			<div
				className="relative"
				onFocus={() => setOpen(true)}
				onBlur={() => {
					window.setTimeout(() => setOpen(false), 100);
				}}
			>
				<Input
					value={query}
					onChange={(event) => {
						setQuery(event.target.value);
						setOpen(true);
					}}
					placeholder="Search by brand or fragrance name"
				/>
				{open ? (
					<div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
						{matches.length > 0 ? (
							matches.map((fragrance) => (
								<button
									key={fragrance.ID}
									type="button"
									onMouseDown={() => onSelect(fragrance)}
									className="flex w-full items-center justify-between rounded-sm px-2 py-2 text-left hover:bg-accent"
								>
									<span className="line-clamp-1 text-sm font-medium">
										{fragrance.Brand} - {fragrance.Name}
									</span>
									<span className="ml-2 shrink-0 text-xs text-muted-foreground">{fragrance.Year ?? "-"}</span>
								</button>
							))
						) : (
							<p className="px-2 py-3 text-sm text-muted-foreground">No matching fragrances</p>
						)}
					</div>
				) : null}
			</div>

			<div className="mt-4 rounded-lg border bg-background p-3">
				{selected ? (
					<div className="flex items-start gap-3">
						<div className="relative size-24 shrink-0 overflow-hidden rounded-md border bg-white">
							<FragranceImage fragrance={selected} />
						</div>
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{selected.Brand}</p>
							<h2 className="line-clamp-2 font-semibold leading-tight">{selected.Name}</h2>
							<p className="text-sm text-muted-foreground">
								{selected.Year ?? "Unknown year"}
								{selected.Gender ? ` · ${selected.Gender}` : ""}
								{selected.rating ? ` · ${selected.rating} rating` : ""}
							</p>
						</div>
					</div>
				) : (
					<p className="text-sm text-muted-foreground">Pick a fragrance to activate this slot.</p>
				)}
			</div>
		</section>
	);
}

export default function ComparePage() {
	const [isReady, setIsReady] = useState(false);

	const [leftId, setLeftId] = useState<number | null>(null);
	const [rightId, setRightId] = useState<number | null>(null);

	const [leftQuery, setLeftQuery] = useState("");
	const [rightQuery, setRightQuery] = useState("");

	const [leftOpen, setLeftOpen] = useState(false);
	const [rightOpen, setRightOpen] = useState(false);

	useEffect(() => {
		setIsReady(true);
	}, []);

	const left = useMemo(
		() => fragrances.find((fragrance) => fragrance.ID === leftId) ?? null,
		[leftId]
	);
	const right = useMemo(
		() => fragrances.find((fragrance) => fragrance.ID === rightId) ?? null,
		[rightId]
	);

	const leftMatches = useMemo(() => {
		const q = normalize(leftQuery);
		return fragrances
			.filter((fragrance) => {
				const combined = `${fragrance.Brand} ${fragrance.Name}`.toLowerCase();
				if (!q) return true;
				return combined.includes(q);
			})
			.slice(0, 12);
	}, [leftQuery]);

	const rightMatches = useMemo(() => {
		const q = normalize(rightQuery);
		return fragrances
			.filter((fragrance) => {
				const combined = `${fragrance.Brand} ${fragrance.Name}`.toLowerCase();
				if (!q) return true;
				return combined.includes(q);
			})
			.slice(0, 12);
	}, [rightQuery]);

	const accordSetLeft = useMemo(() => getAccordSet(left), [left]);
	const accordSetRight = useMemo(() => getAccordSet(right), [right]);
	const notesSetLeft = useMemo(() => getAllNotesSet(left), [left]);
	const notesSetRight = useMemo(() => getAllNotesSet(right), [right]);

	const accordSimilarity = useMemo(
		() => jaccard(accordSetLeft, accordSetRight),
		[accordSetLeft, accordSetRight]
	);
	const notesSimilarity = useMemo(
		() => jaccard(notesSetLeft, notesSetRight),
		[notesSetLeft, notesSetRight]
	);
	const similarityScore = useMemo(
		() => Math.round((0.6 * accordSimilarity + 0.4 * notesSimilarity) * 100),
		[accordSimilarity, notesSimilarity]
	);

	const sharedAccords = useMemo(
		() => Array.from(accordSetLeft).filter((accord) => accordSetRight.has(accord)),
		[accordSetLeft, accordSetRight]
	);
	const uniqueLeftAccords = useMemo(
		() => Array.from(accordSetLeft).filter((accord) => !accordSetRight.has(accord)),
		[accordSetLeft, accordSetRight]
	);
	const uniqueRightAccords = useMemo(
		() => Array.from(accordSetRight).filter((accord) => !accordSetLeft.has(accord)),
		[accordSetLeft, accordSetRight]
	);

	const sharedNotes = useMemo(
		() => Array.from(notesSetLeft).filter((note) => notesSetRight.has(note)),
		[notesSetLeft, notesSetRight]
	);
	const uniqueLeftNotes = useMemo(
		() => Array.from(notesSetLeft).filter((note) => !notesSetRight.has(note)),
		[notesSetLeft, notesSetRight]
	);
	const uniqueRightNotes = useMemo(
		() => Array.from(notesSetRight).filter((note) => !notesSetLeft.has(note)),
		[notesSetLeft, notesSetRight]
	);

	const topLeft = useMemo(() => getLayerNotes(left, "Top"), [left]);
	const topRight = useMemo(() => getLayerNotes(right, "Top"), [right]);
	const middleLeft = useMemo(() => getLayerNotes(left, "Middle"), [left]);
	const middleRight = useMemo(() => getLayerNotes(right, "Middle"), [right]);
	const baseLeft = useMemo(() => getLayerNotes(left, "Base"), [left]);
	const baseRight = useMemo(() => getLayerNotes(right, "Base"), [right]);

	const isCompareReady = Boolean(left && right);

	function handleSelectLeft(fragrance: Fragrance) {
		setLeftId(fragrance.ID);
		setLeftQuery(`${fragrance.Brand} - ${fragrance.Name}`);
		setLeftOpen(false);
	}

	function handleSelectRight(fragrance: Fragrance) {
		setRightId(fragrance.ID);
		setRightQuery(`${fragrance.Brand} - ${fragrance.Name}`);
		setRightOpen(false);
	}

	function resetAll() {
		setLeftId(null);
		setRightId(null);
		setLeftQuery("");
		setRightQuery("");
		setLeftOpen(false);
		setRightOpen(false);
	}

	function swapSlots() {
		setLeftId(rightId);
		setRightId(leftId);
		setLeftQuery(rightQuery);
		setRightQuery(leftQuery);
		setLeftOpen(false);
		setRightOpen(false);
	}

	return (
		<main className="min-h-screen">
			<div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
				<header className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						Fragrance Intelligence
					</p>
					<h1 className="text-3xl font-bold tracking-tight">Compare Fragrances</h1>
					<p className="max-w-2xl text-sm text-muted-foreground md:text-base">
						Pick two fragrances and get an instant breakdown of profile similarity, performance, seasonality,
						and note overlap.
					</p>
				</header>

				{!isReady ? (
					<section className="grid gap-4 md:grid-cols-2">
						<div className="h-52 animate-pulse rounded-xl border bg-muted/40" />
						<div className="h-52 animate-pulse rounded-xl border bg-muted/40" />
					</section>
				) : (
					<section className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
						<SlotPicker
							title="Slot A"
							query={leftQuery}
							open={leftOpen}
							setOpen={setLeftOpen}
							setQuery={setLeftQuery}
							onSelect={handleSelectLeft}
							selected={left}
							matches={leftMatches}
							onClear={() => {
								setLeftId(null);
								setLeftQuery("");
							}}
						/>

						<div className="flex items-center justify-center gap-2 md:flex-col md:pt-14">
							<Button variant="outline" size="icon" onClick={swapSlots} disabled={!left && !right}>
								<ArrowLeftRight className="size-4" />
							</Button>
							<Button variant="outline" size="icon" onClick={resetAll} disabled={!left && !right}>
								<RotateCcw className="size-4" />
							</Button>
						</div>

						<SlotPicker
							title="Slot B"
							query={rightQuery}
							open={rightOpen}
							setOpen={setRightOpen}
							setQuery={setRightQuery}
							onSelect={handleSelectRight}
							selected={right}
							matches={rightMatches}
							onClear={() => {
								setRightId(null);
								setRightQuery("");
							}}
						/>
					</section>
				)}

				{!left && !right ? (
					<section className="rounded-xl border border-dashed bg-card p-8 text-center">
						<p className="text-lg font-semibold">Start by selecting fragrances in both slots</p>
						<p className="mt-2 text-sm text-muted-foreground">
							You will get side-by-side metrics, accord overlap, and note profile differences.
						</p>
					</section>
				) : null}

				{(left && !right) || (!left && right) ? (
					<section className="rounded-xl border bg-card p-6 text-center">
						<p className="text-base font-semibold">Select a second fragrance to complete the comparison</p>
						<p className="mt-1 text-sm text-muted-foreground">Both slots must be filled for full analysis.</p>
					</section>
				) : null}

				{isCompareReady && left && right ? (
					<section className="space-y-6">
						<div className="rounded-xl border bg-card p-5">
							<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Similarity score</p>
									<h2 className="mt-1 text-3xl font-bold">{similarityScore}%</h2>
									<p className="mt-1 text-sm text-muted-foreground">
										Accords overlap {(accordSimilarity * 100).toFixed(0)}% · Notes overlap {(notesSimilarity * 100).toFixed(0)}%
									</p>
								</div>
								<div className="grid w-full max-w-sm grid-cols-2 gap-3">
									<div className="rounded-lg border bg-background p-3">
										<p className="text-xs text-muted-foreground">Shared accords</p>
										<p className="mt-1 text-xl font-semibold">{sharedAccords.length}</p>
									</div>
									<div className="rounded-lg border bg-background p-3">
										<p className="text-xs text-muted-foreground">Shared notes</p>
										<p className="mt-1 text-xl font-semibold">{sharedNotes.length}</p>
									</div>
								</div>
							</div>
						</div>

						<section className="space-y-3 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Core stats</h3>
							<MetricRow
								label="Rating"
								leftValue={left.rating ?? "-"}
								rightValue={right.rating ?? "-"}
								leftScore={parseNumber(left.rating)}
								rightScore={parseNumber(right.rating)}
							/>
							<MetricRow
								label="Year"
								leftValue={left.Year ?? "-"}
								rightValue={right.Year ?? "-"}
								leftScore={parseNumber(left.Year)}
								rightScore={parseNumber(right.Year)}
							/>
							<MetricRow
								label="Popularity"
								leftValue={left.Popularity ?? "-"}
								rightValue={right.Popularity ?? "-"}
								leftScore={left.Popularity ? popularityRank[normalize(left.Popularity)] ?? null : null}
								rightScore={right.Popularity ? popularityRank[normalize(right.Popularity)] ?? null : null}
							/>
							<MetricRow
								label="Price value"
								leftValue={formatLabel(left["Price Value"])}
								rightValue={formatLabel(right["Price Value"])}
								leftScore={left["Price Value"] ? priceValueRank[normalize(left["Price Value"])] ?? null : null}
								rightScore={right["Price Value"] ? priceValueRank[normalize(right["Price Value"])] ?? null : null}
							/>
						</section>

						<section className="space-y-3 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Performance</h3>
							<MetricRow
								label="Longevity"
								leftValue={formatLabel(left.Longevity)}
								rightValue={formatLabel(right.Longevity)}
								leftScore={left.Longevity ? longevityRank[normalize(left.Longevity).replaceAll(" ", "_")] ?? null : null}
								rightScore={right.Longevity ? longevityRank[normalize(right.Longevity).replaceAll(" ", "_")] ?? null : null}
							/>
							<MetricRow
								label="Sillage"
								leftValue={formatLabel(left.Sillage)}
								rightValue={formatLabel(right.Sillage)}
								leftScore={left.Sillage ? sillageRank[normalize(left.Sillage)] ?? null : null}
								rightScore={right.Sillage ? sillageRank[normalize(right.Sillage)] ?? null : null}
							/>
							<MetricRow
								label="Confidence"
								leftValue={formatLabel(left.Confidence)}
								rightValue={formatLabel(right.Confidence)}
								leftScore={left.Confidence ? confidenceRank[normalize(left.Confidence)] ?? null : null}
								rightScore={right.Confidence ? confidenceRank[normalize(right.Confidence)] ?? null : null}
							/>
						</section>

						<section className="space-y-3 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Season fit</h3>
							<div className="grid gap-3 md:grid-cols-2">
								{SEASONS.map((season) => (
									<RankBar
										key={season}
										label={season}
										left={getRankingScore(left["Season Ranking"], season)}
										right={getRankingScore(right["Season Ranking"], season)}
									/>
								))}
							</div>
						</section>

						<section className="space-y-3 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Occasion fit</h3>
							<div className="grid gap-3 md:grid-cols-2">
								{OCCASIONS.map((occasion) => (
									<RankBar
										key={occasion}
										label={occasion}
										left={getRankingScore(left["Occasion Ranking"], occasion)}
										right={getRankingScore(right["Occasion Ranking"], occasion)}
									/>
								))}
							</div>
						</section>

						<section className="space-y-4 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Main accords</h3>

							<div className="space-y-2">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shared accords</p>
								<div className="flex flex-wrap gap-2">
									{sharedAccords.length > 0 ? (
										sharedAccords.map((accord) => {
											const bg = accords[accord as keyof typeof accords] ?? "#e5e7eb";
											return (
												<span
													key={accord}
													className="rounded-md px-2.5 py-1 text-xs font-semibold"
													style={{ backgroundColor: bg, color: getTextColor(bg) }}
												>
													{accord}
												</span>
											);
										})
									) : (
										<p className="text-sm text-muted-foreground">No shared accords.</p>
									)}
								</div>
							</div>

							<Separator />

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unique to left</p>
									<div className="flex flex-wrap gap-2">
										{uniqueLeftAccords.length > 0 ? (
											uniqueLeftAccords.map((accord) => (
												<span key={accord} className="rounded-md border px-2.5 py-1 text-xs font-medium">
													{accord}
												</span>
											))
										) : (
											<p className="text-sm text-muted-foreground">No unique accords.</p>
										)}
									</div>
								</div>
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unique to right</p>
									<div className="flex flex-wrap gap-2">
										{uniqueRightAccords.length > 0 ? (
											uniqueRightAccords.map((accord) => (
												<span key={accord} className="rounded-md border px-2.5 py-1 text-xs font-medium">
													{accord}
												</span>
											))
										) : (
											<p className="text-sm text-muted-foreground">No unique accords.</p>
										)}
									</div>
								</div>
							</div>
						</section>

						<section className="space-y-4 rounded-xl border bg-card p-5">
							<h3 className="text-lg font-semibold">Notes overlap and uniqueness</h3>

							<div className="space-y-2">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shared notes</p>
								<div className="flex flex-wrap gap-2">
									{sharedNotes.length > 0 ? (
										sharedNotes.map((note) => (
											<span key={note} className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium">
												{note}
											</span>
										))
									) : (
										<p className="text-sm text-muted-foreground">No shared notes.</p>
									)}
								</div>
							</div>

							<Separator />

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unique to left</p>
									<div className="flex flex-wrap gap-2">
										{uniqueLeftNotes.length > 0 ? (
											uniqueLeftNotes.slice(0, 30).map((note) => (
												<span key={note} className="rounded-md border px-2.5 py-1 text-xs font-medium">
													{note}
												</span>
											))
										) : (
											<p className="text-sm text-muted-foreground">No unique notes.</p>
										)}
									</div>
								</div>
								<div className="space-y-2">
									<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Unique to right</p>
									<div className="flex flex-wrap gap-2">
										{uniqueRightNotes.length > 0 ? (
											uniqueRightNotes.slice(0, 30).map((note) => (
												<span key={note} className="rounded-md border px-2.5 py-1 text-xs font-medium">
													{note}
												</span>
											))
										) : (
											<p className="text-sm text-muted-foreground">No unique notes.</p>
										)}
									</div>
								</div>
							</div>

							<Separator />

							<div className="grid gap-4 md:grid-cols-3">
								{[
									["Top", topLeft, topRight],
									["Middle", middleLeft, middleRight],
									["Base", baseLeft, baseRight],
								].map(([layer, leftLayer, rightLayer]) => {
									const leftValues = leftLayer as string[];
									const rightValues = rightLayer as string[];
									const rightSet = new Set(rightValues);
									const leftSet = new Set(leftValues);
									const overlap = leftValues.filter((value) => rightSet.has(value));

									return (
										<div key={layer as string} className="rounded-lg border p-3">
											<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{layer} notes</p>
											<p className="mt-2 text-sm">
												Overlap: <span className="font-semibold">{overlap.length}</span>
											</p>
											<div className="mt-2 flex flex-wrap gap-2">
												{overlap.length > 0 ? (
													overlap.map((note) => (
														<span key={note} className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
															{note}
														</span>
													))
												) : (
													<span className="text-xs text-muted-foreground">No overlap</span>
												)}
											</div>
											<p className="mt-3 text-xs text-muted-foreground">
												Left unique: {leftValues.filter((value) => !rightSet.has(value)).length} · Right unique:{" "}
												{rightValues.filter((value) => !leftSet.has(value)).length}
											</p>
										</div>
									);
								})}
							</div>
						</section>

						<section className="grid gap-4 rounded-xl border bg-card p-5 md:grid-cols-2">
							<div className="space-y-3 rounded-lg border p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Left fragrance</p>
								<h4 className="text-lg font-semibold">{left.Brand} - {left.Name}</h4>
								<div className="flex flex-wrap gap-2">
									<Button>
										<Link href={`/fragrance/${left.ID}`}>View details</Link>
									</Button>
									{left["Purchase URL"] ? (
										<Button variant="outline">
											<a href={left["Purchase URL"]} target="_blank" rel="noreferrer">
												Purchase
											</a>
										</Button>
									) : null}
								</div>
							</div>
							<div className="space-y-3 rounded-lg border p-4">
								<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Right fragrance</p>
								<h4 className="text-lg font-semibold">{right.Brand} - {right.Name}</h4>
								<div className="flex flex-wrap gap-2">
									<Button>
										<Link href={`/fragrance/${right.ID}`}>View details</Link>
									</Button>
									{right["Purchase URL"] ? (
										<Button variant="outline">
											<a href={right["Purchase URL"]} target="_blank" rel="noreferrer">
												Purchase
											</a>
										</Button>
									) : null}
								</div>
							</div>
						</section>
					</section>
				) : null}

				<footer className="pb-4 text-xs text-muted-foreground">
					<div className="inline-flex items-center gap-1">
						<Star className="size-3.5" />
						Similarity uses 60% accord overlap and 40% notes overlap.
					</div>
				</footer>
			</div>
		</main>
	);
}
