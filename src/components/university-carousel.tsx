"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { universityCatalog } from "@/data/universities";

export function UniversityCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(0.55);
  const interactingRef = useRef(false);
  const positionRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    positionRef.current = track.scrollLeft;
    const animate = () => {
      const midpoint = track.scrollWidth / 2;
      if (!interactingRef.current && midpoint > 0) {
        positionRef.current += speedRef.current;
        if (positionRef.current >= midpoint) positionRef.current -= midpoint;
        if (positionRef.current <= 0) positionRef.current += midpoint;
        track.scrollLeft = positionRef.current;
      }
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(frame);
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = (event.clientX - bounds.left) / bounds.width;
        const distanceFromCenter = Math.abs(position - 0.5) * 2;
        speedRef.current = (position < 0.5 ? -1 : 1) * Math.max(0.35, distanceFromCenter * 2.4);
      }}
      onMouseLeave={() => {
        speedRef.current = 0.55;
      }}
    >
      <div
        ref={trackRef}
        className="university-carousel flex gap-5 overflow-x-auto overflow-y-hidden px-4 pb-px"
        aria-label="Университеты"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") {
            if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
            interactingRef.current = true;
            positionRef.current = event.currentTarget.scrollLeft;
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") {
            positionRef.current = event.currentTarget.scrollLeft;
            resumeTimerRef.current = window.setTimeout(() => {
              positionRef.current = trackRef.current?.scrollLeft ?? positionRef.current;
              interactingRef.current = false;
            }, 700);
          }
        }}
        onPointerCancel={(event) => {
          positionRef.current = event.currentTarget.scrollLeft;
          resumeTimerRef.current = window.setTimeout(() => {
            positionRef.current = trackRef.current?.scrollLeft ?? positionRef.current;
            interactingRef.current = false;
          }, 700);
        }}
        onScroll={(event) => {
          if (interactingRef.current) {
            positionRef.current = event.currentTarget.scrollLeft;
          }
        }}
      >
        {[...universityCatalog, ...universityCatalog].map((university, index) => {
          const wideLogo = ["mnu", "narxoz", "enu", "kimep", "sdu"].includes(university.slug);
          const extraWideLogo = university.slug === "enu";
          return (
            <Link
              key={`${university.slug}-${index}`}
              href={`/universities/${university.slug}`}
              className="flex h-[76px] min-w-60 shrink-0 items-center gap-5 rounded-[20px] border border-line bg-white px-6 shadow-[0_10px_35px_rgba(0,0,0,.045)] transition hover:border-[#2563eb]"
            >
              <span className={`grid h-13 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-line ${wideLogo ? "university-logo-wide w-24" : "w-13"} ${extraWideLogo ? "university-logo-extra-wide" : ""}`}>
                <Image
                  src={university.logoPath}
                  alt={`Логотип ${university.shortName}`}
                  width={wideLogo ? 96 : 56}
                  height={56}
                  className="h-full w-full object-contain"
                />
              </span>
              <span>
                <strong className="block whitespace-nowrap text-[15px]">{university.shortName}</strong>
                <small className="mt-0.5 block text-xs text-muted">{university.city}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
