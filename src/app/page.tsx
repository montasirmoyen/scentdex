"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import NavBar from "../../components/navbar";
import fragrancesData from "../../data/fragrancesV2.json";
import { Menu, X } from "lucide-react";
import Footer from "@/components/Footer";

// Add ID to each fragrance for routing
const fragrances = fragrancesData.map((f, index) => ({ ...f, ID: index }));

export default function Page() {
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<string | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<string | null>(null);
  const [designerFilter, setDesignerFilter] = useState<string | null>(null);
  const [noteFilter, setNoteFilter] = useState<string | null>(null);
  const [designerSearch, setDesignerSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [sortBy, setSortBy] = useState("Most popular");
  const [visibleCount, setVisibleCount] = useState(20);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const designers = useMemo(() => {
    const brands: Record<string, number> = {};
    fragrances.forEach(f => {
      brands[f.Brand] = (brands[f.Brand] || 0) + 1;
    });
    return Object.entries(brands).sort((a, b) => b[1] - a[1]);
  }, []);

  const notes = useMemo(() => {
    const noteMap: Record<string, number> = {};
    fragrances.forEach(f => {
      if (f.Notes) {
        Object.values(f.Notes).flat().forEach((note: any) => {
          const noteName = typeof note === 'string' ? note : note.name;
          noteMap[noteName] = (noteMap[noteName] || 0) + 1;
        });
      }
    });
    return Object.entries(noteMap).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    let results = fragrances.filter(f => {
      if (search) {
        const combined = `${f.Brand} ${f.Name}`.toLowerCase();
        if (!combined.includes(search.toLowerCase())) return false;
      }
      if (genderFilter && f.Gender !== genderFilter) return false;
      if (designerFilter && f.Brand !== designerFilter) return false;
      if (noteFilter && f.Notes) {
        const allNotes = Object.values(f.Notes).flat().map((note: any) => 
          typeof note === 'string' ? note : note.name
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
    } else if (sortBy === "Newest") {
      results = results.sort((a, b) => Number(b.Year || 0) - Number(a.Year || 0));
    } else if (sortBy === "Most popular") {
      const popularityOrder: Record<string, number> = {
        "Very high": 5,
        "High": 4,
        "Medium": 3,
        "Low": 2,
        "Very low": 1
      };
      results = results.sort((a, b) => 
        (popularityOrder[b.Popularity] || 0) - (popularityOrder[a.Popularity] || 0)
      );
    } else {
      results = results.sort((a, b) => a.ID - b.ID);
    }

    return results;
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

  return (
    <main className="min-h-screen bg-[url('/background1.png')] bg-cover bg-center bg-fixed">
      <NavBar />

      {/* Mobile filter toggle */}
      <div className="lg:hidden sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full px-4 py-3 flex items-center justify-between font-medium"
        >
          <span>Filters</span>
          {isFiltersOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* LEFT SIDEBAR */}
        <aside className={`lg:w-64 p-4 lg:p-6 bg-white/75 backdrop-blur-md transition-transform duration-300 ${isFiltersOpen ? 'block' : 'hidden lg:block'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Filters</h2>
            <button
              onClick={() => setIsFiltersOpen(false)}
              className="lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-700 mb-4 font-medium"
            >
              Clear all filters
            </button>
          )}

          {/* Sort */}
          <div className="mb-6">
            <label className="block font-medium mb-2">Sort by</label>
            <select
              className="w-full h-10 border rounded-lg px-3 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option>Most popular</option>
              <option>Highest rated</option>
              <option>Newest</option>
            </select>
          </div>

          {/* Gender */}
          <div className="mb-6">
            <p className="font-medium mb-2">Gender</p>
            <div className="flex flex-wrap gap-2">
              {["men", "women", "unisex"].map(g => (
                <button
                  key={g}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${genderFilter === g
                      ? "bg-purple-600 text-white font-medium"
                      : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  onClick={() => setGenderFilter(genderFilter === g ? null : g)}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Season */}
          <div className="mb-6">
            <p className="font-medium mb-2">Season</p>
            <div className="flex flex-wrap gap-2">
              {["fall", "spring", "summer", "winter"].map(season => (
                <button
                  key={season}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${seasonFilter === season
                      ? "bg-purple-600 text-white font-medium"
                      : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  onClick={() =>
                    setSeasonFilter(seasonFilter === season ? null : season)
                  }
                >
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Designers */}
          <div className="mb-6">
            <p className="font-medium mb-2">Designers</p>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search designers..."
                className="w-full border rounded-lg px-3 py-2 pr-9 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={designerSearch}
                onChange={(e) => setDesignerSearch(e.target.value)}
              />
              <img
                src="/search.png"
                alt="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {designers
                .filter(([d]) =>
                  d.toLowerCase().includes(designerSearch.toLowerCase())
                )
                .map(([d, count]) => (
                  <button
                    key={d}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${designerFilter === d
                        ? "bg-blue-600 text-white font-medium"
                        : "hover:bg-gray-100"
                      }`}
                    onClick={() =>
                      setDesignerFilter(designerFilter === d ? null : d)
                    }
                  >
                    {d} ({count})
                  </button>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="font-medium mb-2">Notes</p>
            <div className="relative mb-2">
              <input
                type="text"
                placeholder="Search notes..."
                className="w-full border rounded-lg px-3 py-2 pr-9 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
              />
              <img
                src="/search.png"
                alt="Search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-50"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {notes
                .filter(([n]) =>
                  n.toLowerCase().includes(noteSearch.toLowerCase())
                )
                .slice(0, 50)
                .map(([note, count]) => (
                  <button
                    key={note}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-lg transition-colors ${noteFilter === note
                        ? "bg-green-600 text-white font-medium"
                        : "hover:bg-gray-100"
                      }`}
                    onClick={() =>
                      setNoteFilter(noteFilter === note ? null : note)
                    }
                  >
                    {note} ({count})
                  </button>
                ))}
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN */}
        <section className="flex-1 p-4 lg:p-8">
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Search for fragrances..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 pr-11 bg-white/90 backdrop-blur-sm text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <img
              src="/search.png"
              alt="Search"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none opacity-50"
            />
          </div>

          {/* Results count */}
          {filtered.length > 0 && (
            <p className="text-sm text-gray-600 mb-4">
              {filtered.length} {filtered.length === 1 ? 'fragrance found' : 'fragrances found'}
            </p>
          )}

          {/* Fragrance grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {filtered.slice(0, visibleCount).map(f => (
              <Link key={f.ID} href={`/fragrance/${f.ID}`}>
                <div className="bg-white/95 rounded-xl shadow-md p-3 lg:p-4 flex flex-col hover:shadow-xl transition-all hover:scale-[1.02] h-full min-h-[280px] lg:min-h-[300px]">
                  <div className="relative w-full h-40 lg:h-48 mb-3 flex-shrink-0">
                    <Image
                      src={f["Image URL"]}
                      alt={f.Name}
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <h2 className="text-sm lg:text-base font-semibold text-gray-900 line-clamp-2 mb-1">
                      {f.Name}
                    </h2>
                    <p className="text-xs lg:text-sm text-gray-600 line-clamp-1">{f.Brand}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Show More */}
          {visibleCount < filtered.length && (
            <div className="flex justify-center mt-8">
              <button
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                onClick={() => setVisibleCount(prev => prev + 20)}
              >
                Show More
              </button>
            </div>
          )}

          <Footer />
        </section>
      </div>
    </main>
  );
}
