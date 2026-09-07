"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, ExternalLink, GraduationCap, MapPin, Search } from "lucide-react";
import { SetTargetUniversityButton } from "@/components/set-target-university-button";

export interface UniversityItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  city: string;
  grantScore: number;
  description: string;
  website: string | null;
  programs: string[] | readonly string[];
  logoPath: string;
  chance: number | null;
}

interface UniversitiesClientProps {
  universities: UniversityItem[];
  userTargetId: string | null;
  userForecast: number | null;
}

export function UniversitiesClient({ universities, userTargetId, userForecast }: UniversitiesClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [sortBy, setSortBy] = useState<"score_asc" | "score_desc" | "name">("score_asc");

  const cities = useMemo(() => {
    const list = Array.from(new Set(universities.map((u) => u.city))).filter(Boolean);
    list.sort();
    return list;
  }, [universities]);

  const filteredUniversities = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = universities.filter((u) => {
      if (selectedCity !== "all" && u.city !== selectedCity) return false;
      if (!q) return true;
      const matchName = u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q);
      const matchPrograms = u.programs.some((p) => p.toLowerCase().includes(q));
      return matchName || matchPrograms;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === "score_asc") return a.grantScore - b.grantScore;
      if (sortBy === "score_desc") return b.grantScore - a.grantScore;
      return a.shortName.localeCompare(b.shortName);
    });

    return list;
  }, [universities, search, selectedCity, sortBy]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input
            type="text"
            placeholder="Поиск по названию вуза или специальности..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-line bg-paper py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-ink"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-xs font-semibold outline-none transition focus:border-ink"
          >
            <option value="all">Все города</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score_asc" | "score_desc" | "name")}
            className="rounded-2xl border border-line bg-paper px-4 py-3 text-xs font-semibold outline-none transition focus:border-ink"
          >
            <option value="score_asc">Балл на грант (по возрастанию)</option>
            <option value="score_desc">Балл на грант (по убыванию)</option>
            <option value="name">По алфавиту</option>
          </select>
        </div>
      </div>

      {/* Grid of Universities */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUniversities.map((uni) => {
          const isTarget = userTargetId === uni.id;
          const gap = userForecast !== null ? uni.grantScore - userForecast : null;

          return (
            <div
              key={uni.id}
              className={`flex flex-col justify-between rounded-[32px] border bg-white p-6 transition hover:shadow-lg sm:p-7 ${
                isTarget ? "border-ink ring-2 ring-ink/10" : "border-line"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-16 w-24 place-items-center overflow-hidden rounded-2xl border border-line bg-white p-2">
                    <Image
                      src={uni.logoPath}
                      alt={`Логотип ${uni.shortName}`}
                      width={100}
                      height={50}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-muted">
                      {uni.city}
                    </span>
                    {isTarget && (
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Моя цель
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <h2 className="text-xl font-bold leading-tight">
                    <Link href={`/universities/${uni.slug}`} className="hover:underline">
                      {uni.shortName}
                    </Link>
                  </h2>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{uni.name}</p>
                </div>

                {/* Score & Chance Stats */}
                <div className="mt-5 rounded-2xl bg-paper p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Ориентир на грант</span>
                    <strong className="text-sm font-bold text-ink">{uni.grantScore} баллов</strong>
                  </div>
                  {uni.chance !== null && (
                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5 text-xs">
                      <span className="text-muted">Твой шанс</span>
                      <span
                        className={`font-bold ${
                          uni.chance >= 70
                            ? "text-emerald-600"
                            : uni.chance >= 40
                            ? "text-amber-600"
                            : "text-rose-600"
                        }`}
                      >
                        {uni.chance}% {gap !== null && gap > 0 ? `(-${gap} б.)` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Programs Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {uni.programs.slice(0, 3).map((prog) => (
                    <span key={prog} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                      {prog}
                    </span>
                  ))}
                  {uni.programs.length > 3 && (
                    <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-muted">
                      +{uni.programs.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
                <Link
                  href={`/universities/${uni.slug}`}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-paper text-xs font-semibold text-ink transition hover:bg-ink hover:text-white"
                >
                  Подробнее <ArrowRight size={14} />
                </Link>
                <div className="shrink-0">
                  <SetTargetUniversityButton universityId={uni.id} isCurrentTarget={isTarget} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUniversities.length === 0 && (
        <div className="rounded-[32px] border border-line bg-white p-12 text-center">
          <Building2 className="mx-auto text-muted" size={40} />
          <p className="mt-4 text-base font-semibold">Вузы не найдены</p>
          <p className="mt-1 text-sm text-muted">Попробуйте изменить параметры поиска или фильтрации.</p>
        </div>
      )}
    </div>
  );
}