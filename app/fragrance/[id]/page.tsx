"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams } from "next/navigation";
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

// Add ID to each fragrance
const fragrances = fragranceData.map((f, index) => ({ ...f, ID: index }));

const ProgressBar = ({ value, color }: { value: number; color: string }) => {
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-2 rounded-full transition-all"
        style={{
          width: `${value}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};

function isNewFragrance(releaseYear: string) {
  const currentYear = new Date().getFullYear();
  return currentYear - parseInt(releaseYear, 10) <= 1;
}

function returnDesc(f: any) {
  const firstAccord = f["Main Accords"]?.[0] ?? "fragrance";

  let description = `<strong>${f.Name}</strong> by <strong>${f.Brand}</strong> is a ${firstAccord} fragrance. `;

  if (isNewFragrance(f.Year)) {
    description += "This is a new fragrance. ";
  }

  description += `${f.Name} was launched in ${f.Year}. `;

  if (f.Notes?.Top?.length) {
    const topNotes = f.Notes.Top.map((n: any) => typeof n === 'string' ? n : n.name).join(", ");
    description += `Top notes are ${topNotes}; `;
  }

  if (f.Notes?.Middle?.length) {
    const middleNotes = f.Notes.Middle.map((n: any) => typeof n === 'string' ? n : n.name).join(", ");
    description += `middle notes are ${middleNotes}; `;
  }

  if (f.Notes?.Base?.length) {
    const baseNotes = f.Notes.Base.map((n: any) => typeof n === 'string' ? n : n.name).join(", ");
    description += `base notes are ${baseNotes}.`;
  }

  return description.trim();
}

function getTextColor(hex: string) {
  const c = hex.substring(1);
  const rgb = parseInt(c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 150 ? "black" : "white";
}

function getAllNotes(f: any): string[] {
  if (!f || !f.Notes) return [];
  const groups = Object.values(f.Notes) as any[];
  return Array.from(
    new Set(
      groups.flat().map(n => {
        const name = typeof n === 'string' ? n : n.name;
        return String(name).trim().toLowerCase();
      })
    )
  );
}

function getSimilarFragrances(current: any, all: any[]) {
  const curSet = new Set(getAllNotes(current));
  if (curSet.size === 0) return [];

  return all.filter(f => {
    if (f.ID === current.ID) return false;
    let matches = 0;
    for (const n of getAllNotes(f)) {
      if (curSet.has(n)) {
        matches++;
        if (matches >= 3) return true;
      }
    }
    return false;
  });
}

function getMoreFromDesigner(current: any, all: any[]) {
  return all.filter(f => f.Brand === current.Brand && f.ID !== current.ID);
}

function genderToProperCase(g: string) {
  if (g.toLowerCase() === "men") return "men";
  if (g.toLowerCase() === "women") return "women";
  return "men & women";
}

function getBarColor(value: number) {
  if (value < 25) return "#ff4d4f"
  if (value < 40) return "#fa8c16"
  if (value < 60) return "#fadb14"
  if (value < 85) return "#52c41a"
  return "#1890ff"
}

function FragranceCard({ fragrance }: { fragrance: any }) {
  return (
    <Link href={`/fragrance/${fragrance.ID}`} className="block shrink-0">
      <div className="w-40 rounded-lg border bg-card p-3 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md lg:w-48">
        <div className="relative w-full h-28 lg:h-32 mb-2">
          <Image
            unoptimized
            src={fragrance["Image URL"] || "/unknown.png"}
            alt={fragrance.Name}
            fill
            className="object-contain rounded"
          />
        </div>
        <h3 className="text-xs lg:text-sm font-semibold line-clamp-2">{fragrance.Name}</h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{fragrance.Brand}</p>
      </div>
    </Link>
  );
}

export default function FragrancePage() {
  const params = useParams<{ id: string }>();
  const idParam = params?.id;
  const fragranceId = Number(idParam);

  if (!idParam) {
    return null;
  }

  const fragrance = fragrances.find((f) => f.ID === fragranceId);

  if (!fragrance) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-6">
        <div className="w-full rounded-xl border bg-card p-6 text-center">
          <h1 className="text-xl font-semibold">Fragrance not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The fragrance you are looking for does not exist.
          </p>
          <Button className="mt-4" onClick={() => (window.location.href = "/")}>Back to ScentDex</Button>
        </div>
      </main>
    );
  }

  const similarFragrances = getSimilarFragrances(fragrance, fragrances);
  const moreFromDesigner = getMoreFromDesigner(fragrance, fragrances);

  // Component to handle broken image on client side
  const FragranceImageWithFallback = () => {
    const [isBroken, setIsBroken] = useState(false);

    return (
      <Image
        unoptimized
        src={isBroken ? "/unknown.png" : fragrance["Image URL"]}
        alt={fragrance.Name}
        fill
        className="object-contain rounded-lg"
        onError={() => setIsBroken(true)}
      />
    );
  };

  return (
    <main className="min-h-screen bg-[url('/background1.png')] bg-cover bg-center bg-fixed">
      <div className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="bg-white/75 backdrop-blur-sm shadow-lg rounded-xl lg:rounded-2xl p-4 lg:p-6">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
            <div className="relative mx-auto h-64 w-full shrink-0 md:mx-0 md:h-80 md:w-64">
              <FragranceImageWithFallback />
            </div>
            <div className="flex-1">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {fragrance.Name}
              </h1>
              <p className="text-sm lg:text-base text-gray-600 mb-1">
                for {genderToProperCase(fragrance.Gender)}
              </p>
              <p className="text-sm lg:text-base text-gray-500 mb-4">{fragrance.Brand}</p>
              <Button
                onClick={() => window.open(fragrance["Purchase URL"], "_blank", "noopener,noreferrer")}
                size="sm"
              >
                Purchase
              </Button>

              {/* Accord Progress Bars */}
              {fragrance["Main Accords"] && fragrance["Main Accords"].length > 0 && (
                <div className="mt-4">
                  <h2 className="text-sm lg:text-base font-semibold mb-2">Main Accords</h2>
                  <div className="flex flex-wrap gap-2">
                    {fragrance["Main Accords"].map((accord: string) => {
                      const key = accord.toLowerCase() as keyof typeof accords;
                      const color = accords[key] ?? "#ccc";
                      const textColor = getTextColor(color);

                      return (
                        <div
                          key={accord}
                          className="text-center rounded-lg px-3 py-1.5 text-xs lg:text-sm font-medium lowercase"
                          style={{ backgroundColor: color, color: textColor }}
                        >
                          {accord}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <p
            className="mt-4 text-sm lg:text-base text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: returnDesc(fragrance) }}
          />

          <Separator className="mt-6" />

          <h2 className="text-base lg:text-lg font-semibold mt-6 mb-3">Ideal Time to Wear</h2>

          {/* Season Ranking */}
          <div className="mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {fragrance["Season Ranking"].map((s: any) => (
                <div key={s.name} className="flex items-center gap-3">
                  <Image
                    unoptimized
                    src={`/${s.name.toLowerCase()}.png`}
                    alt={s.name}
                    width={28}
                    height={28}
                    className="shrink-0 object-contain"
                    style={{ filter: "contrast(0)" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm capitalize mb-1">{s.name}</p>
                    <ProgressBar
                      value={(parseFloat(s.score) / 3) * 100}
                      color={getBarColor((parseFloat(s.score) / 3) * 100)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Occasion Ranking */}
          {fragrance["Occasion Ranking"] && fragrance["Occasion Ranking"].length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {fragrance["Occasion Ranking"].map((t: any) => (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm capitalize mb-1">{t.name}</p>
                    <ProgressBar
                      value={(parseFloat(t.score) / 3) * 100}
                      color={getBarColor((parseFloat(t.score) / 3) * 100)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Performance */}
          <h2 className="text-base lg:text-lg font-semibold mt-6 mb-3">Performance</h2>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/longevity.png"
                alt="Longevity"
                width={28}
                height={28}
                className="shrink-0"
                style={{ filter: "contrast(0)" }}
                unoptimized
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-1">Longevity</p>
                <p className="text-sm font-medium text-gray-700">{fragrance.Longevity}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Image
                unoptimized
                src="/sillage.png"
                alt="Sillage"
                width={28}
                height={28}
                className="shrink-0"
                style={{ filter: "contrast(0)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm mb-1">Sillage</p>
                <p className="text-sm font-medium text-gray-700">{fragrance.Sillage}</p>
              </div>
            </div>
          </div>

          {/* Fragrance Notes */}
          {fragrance.Notes && (
            <div className="mt-6">
              <h2 className="mb-3 text-xl font-semibold lg:text-2xl">Fragrance Notes</h2>
              <Accordion className="rounded-lg border bg-card px-4">
                {[
                  { label: "Top Notes", notes: fragrance.Notes.Top },
                  { label: "Middle Notes", notes: fragrance.Notes.Middle },
                  { label: "Base Notes", notes: fragrance.Notes.Base },
                ].map(({ label, notes: noteGroup }) => {
                  if (!noteGroup || !Array.isArray(noteGroup) || noteGroup.length === 0) return null;

                  return (
                    <AccordionItem key={label} value={label}>
                      <AccordionTrigger>{label}</AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2">
                          {noteGroup.map((note: any, i: number) => {
                            const noteName = typeof note === "string" ? note : note.name;
                            const imgSrc =
                              typeof note === "object" && note.imageUrl ? note.imageUrl : "/unknown.png";
                            return (
                              <span
                                key={i}
                                className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2 py-1.5 text-sm lg:text-base"
                              >
                                <Image
                                  unoptimized
                                  src={imgSrc}
                                  alt={noteName}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                                {noteName}
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

        </div>
      </div>

      {similarFragrances.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="bg-white/50 backdrop-blur-sm shadow-md rounded-xl lg:rounded-2xl p-4 lg:p-6 mt-4 lg:mt-8">
            <h2 className="text-base lg:text-lg font-semibold mb-4">This perfume reminds me of</h2>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex gap-3 pb-2 lg:gap-4">
                {similarFragrances.map((f) => (
                  <FragranceCard key={f.ID} fragrance={f} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* More from Designer */}
      {moreFromDesigner.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="bg-white/50 backdrop-blur-sm shadow-md rounded-xl lg:rounded-2xl p-4 lg:p-6 mt-4 lg:mt-8">
            <h2 className="text-base lg:text-lg font-semibold mb-4">
              More from {fragrance.Brand}
            </h2>
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex gap-3 pb-2 lg:gap-4">
                {moreFromDesigner.map((f) => (
                  <FragranceCard key={f.ID} fragrance={f} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </main>
  );
}