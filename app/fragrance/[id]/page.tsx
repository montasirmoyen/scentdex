"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import fragranceData from "@/data/fragrances.json";
import accords from "@/data/accords.json";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  Clock,
  Wind,
  Sun,
  Snowflake,
  Leaf,
  Sprout,
  Briefcase,
  Moon,
  Coffee,
  Star,
  ExternalLink,
  Sparkles
} from "lucide-react";

const fragrances = fragranceData.map((f, index) => ({ ...f, ID: index }));

// ── Helpers ────────────────────────────────────────────────────────────────

const ProgressBar = ({ value, color }: { value: number; color: string }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
    <div
      className="h-1.5 rounded-full transition-all"
      style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
    />
  </div>
);

function getBarColor(value: number) {
  if (value < 25) return "var(--destructive)";
  if (value < 40) return "var(--chart-5)";
  if (value < 60) return "var(--chart-3)";
  if (value < 85) return "var(--chart-2)";
  return "var(--chart-1)";
}

function getTextColor(hex: string) {
  if (!hex.startsWith("#")) return "var(--foreground)";
  const rgb = parseInt(hex.substring(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "black" : "white";
}

function genderLabel(g: string) {
  if (g.toLowerCase() === "men") return "for men";
  if (g.toLowerCase() === "women") return "for women";
  return "for men & women";
}

function buildDescription(f: any) {
  const firstAccord = f["Main Accords"]?.[0] ?? "fragrance";
  const currentYear = new Date().getFullYear();
  const isNew = currentYear - parseInt(f.Year, 10) <= 1;

  let desc = `<strong>${f.Name}</strong> by <strong>${f.Brand}</strong> is a ${firstAccord} fragrance. `;
  if (isNew) desc += "This is a new fragrance. ";
  desc += `${f.Name} was launched in ${f.Year}. `;

  const extract = (arr: any[]) =>
    arr.map((n: any) => (typeof n === "string" ? n : n.name)).join(", ");

  if (f.Notes?.Top?.length) desc += `Top notes are ${extract(f.Notes.Top)}; `;
  if (f.Notes?.Middle?.length) desc += `middle notes are ${extract(f.Notes.Middle)}; `;
  if (f.Notes?.Base?.length) desc += `base notes are ${extract(f.Notes.Base)}.`;

  return desc.trim();
}

function getAllNotes(f: any): string[] {
  if (!f?.Notes) return [];
  return Array.from(
    new Set(
      (Object.values(f.Notes) as any[])
        .flat()
        .map((n) => String(typeof n === "string" ? n : n.name).trim().toLowerCase())
    )
  );
}

function getAccordSet(f: any): Set<string> {
  return new Set((f["Main Accords"] || []).map((a: string) => a.toLowerCase()));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const v of a) if (b.has(v)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

function getSimilarFragrances(current: any, all: any[]) {
  const curNotes = new Set(getAllNotes(current));
  const curAccords = getAccordSet(current);

  return all
    .filter((f) => f.ID !== current.ID)
    .map((f) => {
      const accordScore = jaccard(curAccords, getAccordSet(f));
      const noteScore = jaccard(curNotes, new Set(getAllNotes(f)));
      // Accords capture the overall character; notes give ingredient-level similarity
      const combined = 0.6 * accordScore + 0.4 * noteScore;
      return { f, combined };
    })
    .filter(({ combined }) => combined >= 0.18)
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 16)
    .map(({ f }) => f);
}

function getMoreFromDesigner(current: any, all: any[]) {
  return all.filter((f) => f.Brand === current.Brand && f.ID !== current.ID);
}

const SEASON_ICONS: Record<string, React.ReactNode> = {
  spring: <Sprout className="size-4 shrink-0 text-muted-foreground" />,
  summer: <Sun className="size-4 shrink-0 text-muted-foreground" />,
  fall: <Leaf className="size-4 shrink-0 text-muted-foreground" />,
  winter: <Snowflake className="size-4 shrink-0 text-muted-foreground" />,
};

const OCCASION_ICONS: Record<string, React.ReactNode> = {
  professional: <Briefcase className="size-4 shrink-0 text-muted-foreground" />,
  "night out": <Moon className="size-4 shrink-0 text-muted-foreground" />,
  casual: <Coffee className="size-4 shrink-0 text-muted-foreground" />,
};

function getOccasionIcon(name: string) {
  return OCCASION_ICONS[name.toLowerCase()] ?? <Star className="size-4 shrink-0 text-muted-foreground" />;
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FragranceCard({ fragrance }: { fragrance: any }) {
  return (
    <Link href={`/fragrance/${fragrance.ID}`} className="block shrink-0">
      <article className="w-36 overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md md:w-44">
        <div className="relative aspect-square border-b bg-white">
          <Image
            unoptimized
            src={fragrance["Image URL"] || "/unknown.png"}
            alt={fragrance.Name}
            fill
            className="object-contain p-2"
          />
        </div>
        <div className="space-y-0.5 p-2">
          <p className="line-clamp-2 text-xs font-semibold leading-snug">{fragrance.Name}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{fragrance.Brand}</p>
        </div>
      </article>
    </Link>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function FragrancePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const fragranceId = Number(idParam);

  if (!idParam) return null;

  const fragrance = fragrances.find((f) => f.ID === fragranceId);

  if (!fragrance) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-lg border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Fragrance not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The fragrance you are looking for does not exist.
          </p>
        </div>
      </main>
    );
  }

  const similarFragrances = getSimilarFragrances(fragrance, fragrances);
  const moreFromDesigner = getMoreFromDesigner(fragrance, fragrances);

  const FragranceImage = () => {
    const [broken, setBroken] = useState(false);
    return (
      <Image
        unoptimized
        src={broken ? "/unknown.png" : fragrance["Image URL"]}
        alt={fragrance.Name}
        fill
        className="object-contain"
        onError={() => setBroken(true)}
      />
    );
  };

  return (
    <main className="min-h-screen bg-[url('/light-background.png')] bg-cover bg-center bg-fixed dark:bg-none">
      <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
        <div className="space-y-4">
          {/* ── Hero card ── */}
          <div className="rounded-lg border bg-card p-4 md:p-6">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Image */}
              <div className="relative mx-auto h-60 w-60 shrink-0 overflow-hidden rounded-lg border bg-white md:mx-0 md:h-72 md:w-72">
                <FragranceImage />
              </div>

              {/* Details */}
              <div className="flex flex-1 flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {fragrance.Brand}
                  </p>
                  <h1 className="mt-1 text-2xl font-bold">{fragrance.Name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {genderLabel(fragrance.Gender)}
                    {fragrance.Year ? ` · ${fragrance.Year}` : ""}
                    {fragrance.OilType ? ` · ${fragrance.OilType}` : ""}
                  </p>
                </div>


                {/* Purchase & AI */}
                <div className="flex gap-2">
                  {fragrance["Purchase URL"] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(fragrance["Purchase URL"], "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink className="mr-1.5 size-3.5" />
                      Purchase
                    </Button>
                  )}
                  <Button size="sm" onClick={() => router.push("/ai")}>
                    <Sparkles className="mr-1.5 size-3.5" />
                    Ask AI
                  </Button>
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {fragrance.rating && (
                    <span className="flex items-center gap-1 rounded-md border bg-muted/40 px-2.5 py-1">
                      <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                      {fragrance.rating}
                    </span>
                  )}
                  {fragrance.Popularity && (
                    <span className="rounded-md border bg-muted/40 px-2.5 py-1 text-muted-foreground">
                      {fragrance.Popularity} popularity
                    </span>
                  )}
                  {fragrance["Price Value"] && (
                    <span className="rounded-md border bg-muted/40 px-2.5 py-1 capitalize text-muted-foreground">
                      {fragrance["Price Value"].replace("_", " ")}
                    </span>
                  )}
                </div>

                {/* Main Accords */}
                {fragrance["Main Accords"]?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Main Accords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {fragrance["Main Accords"].map((accord: string) => {
                        const key = accord.toLowerCase() as keyof typeof accords;
                        const bg = accords[key] ?? "#e5e7eb";
                        return (
                          <span
                            key={accord}
                            className="rounded-md px-2.5 py-1 text-xs font-medium lowercase"
                            style={{ backgroundColor: bg, color: getTextColor(bg) }}
                          >
                            {accord}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <Separator className="my-4" />
            <p
              className="text-sm leading-relaxed text-foreground/80"
              dangerouslySetInnerHTML={{ __html: buildDescription(fragrance) }}
            />
          </div>

          {/* ── Info grid: Performance + Ideal Time ── */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Performance */}
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Performance
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Longevity</p>
                    <p className="text-sm font-medium">{fragrance.Longevity || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted/40">
                    <Wind className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sillage</p>
                    <p className="text-sm font-medium">{fragrance.Sillage || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seasons */}
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Best Seasons
              </p>
              <div className="space-y-3">
                {[...fragrance["Season Ranking"]]
                  .sort((a: any, b: any) => Number(b.score) - Number(a.score))
                  .map((s: any) => {
                    const pct = (parseFloat(s.score) / 3) * 100;
                    return (
                      <div key={s.name} className="flex items-center gap-2">
                        {SEASON_ICONS[s.name.toLowerCase()] ?? null}
                        <span className="w-12 shrink-0 capitalize text-xs">{s.name}</span>
                        <div className="flex-1">
                          <ProgressBar value={pct} color={getBarColor(pct)} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Occasions ── */}
          {fragrance["Occasion Ranking"]?.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Occasions
              </p>
              <div className="space-y-3">
                {[...fragrance["Occasion Ranking"]]
                  .sort((a: any, b: any) => Number(b.score) - Number(a.score))
                  .map((t: any) => {
                    const pct = (parseFloat(t.score) / 3) * 100;
                    return (
                      <div key={t.name} className="flex items-center gap-2">
                        {getOccasionIcon(t.name)}
                        <span className="w-24 shrink-0 capitalize text-xs font-medium">{t.name}</span>
                        <div className="flex-1">
                          <ProgressBar value={pct} color={getBarColor(pct)} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Fragrance Notes ── */}
          {fragrance.Notes && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fragrance Notes
              </p>
              <Accordion className="divide-y rounded-md border">
                {[
                  { label: "Top Notes", notes: fragrance.Notes.Top },
                  { label: "Middle Notes", notes: fragrance.Notes.Middle },
                  { label: "Base Notes", notes: fragrance.Notes.Base },
                ].map(({ label, notes: noteGroup }) => {
                  if (!noteGroup?.length) return null;
                  return (
                    <AccordionItem key={label} value={label} className="border-none px-4">
                      <AccordionTrigger className="text-sm font-medium">{label}</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pb-1">
                          {noteGroup.map((note: any, i: number) => {
                            const name = typeof note === "string" ? note : note.name;
                            const img =
                              typeof note === "object" && note.imageUrl
                                ? note.imageUrl
                                : "/unknown.png";
                            return (
                              <span
                                key={i}
                                className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1.5 text-xs"
                              >
                                <Image
                                  unoptimized
                                  src={img}
                                  alt={name}
                                  width={24}
                                  height={24}
                                  className="object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/unknown.png";
                                  }}
                                />
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* ── Similar fragrances ── */}
          {similarFragrances.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                This perfume reminds me of
              </p>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-3">
                  {similarFragrances.map((f) => (
                    <FragranceCard key={f.ID} fragrance={f} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* ── More from designer ── */}
          {moreFromDesigner.length > 0 && (
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                More from {fragrance.Brand}
              </p>
              <ScrollArea className="w-full">
                <div className="flex gap-3 pb-3">
                  {moreFromDesigner.map((f) => (
                    <FragranceCard key={f.ID} fragrance={f} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}