"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";

import fragranceData from "@/data/fragrances.json";

const fragrances = fragranceData.map((f, index) => ({ ...f, ID: index }));
const SEASONS = ["spring", "summer", "fall", "winter"];
const SORT_OPTIONS = ["Newest", "Highest rated", "Most popular"];

const DESIGNER_ALIASES: Record<string, string> = {
  "parfums de marly": "Parfums de Marly",
  "versace": "Versace",
  "gianni versace": "Versace",
  "viktor&rolf": "Viktor & Rolf",
  "viktor & rolf": "Viktor & Rolf",
};

const normalizeDesignerName = (brand: string) =>
  DESIGNER_ALIASES[brand.trim().toLowerCase()] || brand;

export default function Page() {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [designerFilter, setDesignerFilter] = useState<string | null>(null);
  const [noteFilter, setNoteFilter] = useState<string | null>(null);
  const [designerSearch, setDesignerSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [sortBy, setSortBy] = useState("Newest");
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<number>>(new Set());

  const handleImageError = (id: number) => {
    setBrokenImages((prev) => new Set([...prev, id]));
  };

  const designers = useMemo(() => {
    const brands: Record<string, number> = {};
    fragrances.forEach((f) => {
      const normalizedBrand = normalizeDesignerName(f.Brand);
      brands[normalizedBrand] = (brands[normalizedBrand] || 0) + 1;
    });
    return Object.entries(brands).sort((a, b) => b[1] - a[1]);
  }, []);

  const notes = useMemo(() => {
    const noteMap: Record<string, number> = {};
    fragrances.forEach((f) => {
      if (f.Notes) {
        Object.values(f.Notes).flat().forEach((note: any) => {
          const noteName = typeof note === "string" ? note : note.name;
          noteMap[noteName] = (noteMap[noteName] || 0) + 1;
        });
      }
    });
    return Object.entries(noteMap).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    let results = fragrances.filter((f) => {
      if (search) {
        const combined = `${f.Brand} ${f.Name}`.toLowerCase();
        if (!combined.includes(search.toLowerCase())) return false;
      }
      if (genderFilter && f.Gender !== genderFilter) return false;
      if (designerFilter && normalizeDesignerName(f.Brand) !== designerFilter) {
        return false;
      }
      if (noteFilter && f.Notes) {
        const allNotes = Object.values(f.Notes).flat().map((note: any) =>
          typeof note === "string" ? note : note.name
        );
        if (!allNotes.includes(noteFilter)) return false;
      }
      if (seasonFilter) {
        const seasonEntry = f["Season Ranking"]?.find(
          (s: { name: string; score: number }) => s.name.toLowerCase() === seasonFilter.toLowerCase()
        );
        if (!seasonEntry) return false;
        const seasonScore = Number(seasonEntry.score);
        if (seasonScore <= 0.9) return false;
      }
      return true;
    });

    if (sortBy === "Highest rated") {
      results = results.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortBy === "Most popular") {
      const popularityOrder: Record<string, number> = {
        "Very high": 5,
        "High": 4,
        "Medium": 3,
        "Low": 2,
        "Very low": 1,
      };
      results = results.sort((a, b) =>
        (popularityOrder[b.Popularity] || 0) - (popularityOrder[a.Popularity] || 0)
      );
    } else {
      // Newest (default)
      results = results.sort((a, b) => Number(b.Year || 0) - Number(a.Year || 0));
    }

    return results;
  }, [search, genderFilter, designerFilter, noteFilter, seasonFilter, sortBy]);

  const visibleFragrances = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  const filteredDesigners = useMemo(() => {
    const q = designerSearch.trim().toLowerCase();
    return designers.filter(([brand]) =>
      q ? brand.toLowerCase().includes(q) : true
    );
  }, [designers, designerSearch]);

  const filteredNotes = useMemo(() => {
    const q = noteSearch.trim().toLowerCase();
    return notes.filter(([note]) => (q ? note.toLowerCase().includes(q) : true));
  }, [notes, noteSearch]);

  useEffect(() => {
    setVisibleCount(20);
  }, [search, genderFilter, designerFilter, noteFilter, seasonFilter, sortBy]);

  const clearFilters = () => {
    setGenderFilter(null);
    setDesignerFilter(null);
    setNoteFilter(null);
    setSeasonFilter(null);
    setSearch("");
    setDesignerSearch("");
    setNoteSearch("");
  };

  const hasActiveFilters = genderFilter || designerFilter || noteFilter || seasonFilter || search;
  const canLoadMore = visibleCount < filtered.length;

  const sidebarContent = (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Sort by
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {SORT_OPTIONS.map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "default" : "outline"}
              onClick={() => setSortBy(option)}
              className="justify-start"
            >
              {option}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Gender
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ["men", "Men"],
            ["women", "Women"],
            ["unisex", "Unisex"],
          ].map(([value, label]) => (
            <Button
              key={value}
              variant={genderFilter === value ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setGenderFilter((current) => (current === value ? null : value))
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Season
        </p>
        <div className="flex flex-wrap gap-2">
          {SEASONS.map((season) => (
            <Button
              key={season}
              variant={seasonFilter === season ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setSeasonFilter((current) => (current === season ? null : season))
              }
              className="capitalize"
            >
              {season}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Designer
        </p>
        <Input
          value={designerSearch}
          onChange={(e) => setDesignerSearch(e.target.value)}
          placeholder="Search designer"
        />
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
          {filteredDesigners.slice(0, 120).map(([brand, count]) => (
            <Button
              key={brand}
              variant={designerFilter === brand ? "secondary" : "ghost"}
              className="h-auto w-full justify-between py-2"
              onClick={() =>
                setDesignerFilter((current) => (current === brand ? null : brand))
              }
            >
              <span className="truncate">{brand}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Notes
        </p>
        <Input
          value={noteSearch}
          onChange={(e) => setNoteSearch(e.target.value)}
          placeholder="Search notes"
        />
        <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
          {filteredNotes.slice(0, 120).map(([note, count]) => (
            <Button
              key={note}
              variant={noteFilter === note ? "secondary" : "ghost"}
              className="h-auto w-full justify-between py-2"
              onClick={() =>
                setNoteFilter((current) => (current === note ? null : note))
              }
            >
              <span className="truncate">{note}</span>
              <span className="text-xs text-muted-foreground">{count}</span>
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="destructive" className="w-full" onClick={clearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[url('/light-background.png')] bg-cover bg-center bg-fixed dark:bg-none">
      <section className="mx-auto max-w-7xl w-full p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <h1 className="text-lg font-semibold">ScentDex</h1>
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
              <Menu className="size-4" />
              Filters
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
              <SheetHeader className="border-b">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="p-4">{sidebarContent}</div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-4 rounded-lg border bg-card p-4">{sidebarContent}</div>
          </aside>

          <section className="space-y-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by fragrance name or brand"
                  className="md:max-w-md"
                />
                <p className="text-sm text-muted-foreground">
                  Showing {visibleFragrances.length} of {filtered.length} fragrances
                </p>
              </div>
            </div>

            {visibleFragrances.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                No fragrances found for the selected filters.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
                  {visibleFragrances.map((fragrance) => (
                    <Link key={fragrance.ID} href={`/fragrance/${fragrance.ID}`}>
                      <article
                        className="overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative aspect-square border-b bg-white">
                          {brokenImages.has(fragrance.ID) ? (
                            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                              Image unavailable
                            </div>
                          ) : (
                            <Image
                              src={fragrance["Image URL"] || "/fragrances/placeholder.jpg"}
                              alt={`${fragrance.Brand} ${fragrance.Name}`}
                              fill
                              sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
                              className="object-contain p-2"
                              onError={() => handleImageError(fragrance.ID)}
                            />
                          )}
                        </div>

                        <div className="space-y-1 p-3">
                          <p className="line-clamp-1 text-sm font-semibold">{fragrance.Name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">{fragrance.Brand}</p>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>{fragrance.Year || "N/A"}</span>
                            <span>⭐ {fragrance.rating || "0.0"}</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {canLoadMore && (
                  <div className="flex justify-center pt-2">
                    <Button onClick={() => setVisibleCount((prev) => prev + 20)}>
                      Load 20 more
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </section>

    </main>
  );
}