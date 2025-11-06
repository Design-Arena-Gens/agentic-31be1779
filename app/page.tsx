"use client";

import { useMemo, useState } from "react";
import { mergePolygons, type MergeResult, type Polygon } from "@/lib/mergePolygons";
import { PolygonSketch } from "@/components/PolygonSketch";

const SAMPLE_INPUT = `[
  [
    { "x": 0, "y": 0 },
    { "x": 90, "y": 10 },
    { "x": 70, "y": 70 },
    { "x": 10, "y": 50 }
  ],
  [
    { "x": 160, "y": 10 },
    { "x": 230, "y": 0 },
    { "x": 220, "y": 60 },
    { "x": 160, "y": 70 }
  ],
  [
    { "x": 90, "y": 140 },
    { "x": 150, "y": 130 },
    { "x": 140, "y": 200 },
    { "x": 80, "y": 190 }
  ]
]`;

function parsePolygons(raw: string): Polygon[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const polygons: Polygon[] = parsed.map((poly) => {
      if (!Array.isArray(poly)) throw new Error("Invalid polygon structure");
      return poly.map((point) => {
        if (typeof point !== "object" || point === null) {
          throw new Error("Invalid point");
        }
        const x = Number(point.x);
        const y = Number(point.y);
        if (Number.isNaN(x) || Number.isNaN(y)) {
          throw new Error("Invalid coordinate value");
        }
        return { x, y };
      });
    });
    return polygons;
  } catch (error) {
    return null;
  }
}

export default function Page() {
  const [rawInput, setRawInput] = useState<string>(SAMPLE_INPUT);
  const [connectorWidth, setConnectorWidth] = useState<number>(24);

  const polygons = useMemo(() => parsePolygons(rawInput), [rawInput]);

  const mergeResult: MergeResult | null = useMemo(() => {
    if (!polygons || polygons.length === 0) return null;
    try {
      return mergePolygons(polygons, { connectorWidth });
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [polygons, connectorWidth]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">
          Polygon Fusion Planner
        </h1>
        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
          Визуален генератор, който свързва множество несвързани полигони чрез минимални
          мостове и ги обединява в единна геометрия. Въведете координати, изберете ширина
          на връзките и изследвайте резултата.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Полигонални данни (JSON)
            </label>
            <textarea
              value={rawInput}
              onChange={(event) => setRawInput(event.target.value)}
              spellCheck={false}
              className="h-80 w-full rounded-lg border border-slate-800 bg-slate-950/70 p-4 font-mono text-xs text-slate-200 shadow-inner focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <p className="text-xs text-slate-500">
              Всеки полигон е списък от точки с X/Y координати. Минимум три точки.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>Ширина на мостовете</span>
              <span className="text-sky-300">{connectorWidth.toFixed(0)} px</span>
            </label>
            <input
              type="range"
              min={4}
              max={120}
              step={2}
              value={connectorWidth}
              onChange={(event) => setConnectorWidth(Number(event.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Определя дебелината на правоъгълните връзки между полигоните.
            </p>
          </div>

          {mergeResult && mergeResult.connectors.length > 0 && (
            <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Минимално свързващо дърво
              </h2>
              <ul className="space-y-2 text-xs text-slate-300">
                {mergeResult.connectors.map((connector, index) => (
                  <li key={index} className="flex items-center justify-between rounded-md bg-slate-900/70 px-3 py-2">
                    <span>
                      Свързва полигон {connector.from + 1} → {connector.to + 1}
                    </span>
                    <span className="font-mono text-sky-300">
                      {connector.distance.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            {mergeResult && polygons ? (
              <PolygonSketch
                polygons={polygons}
                connectors={mergeResult.connectors}
                result={mergeResult.multipolygon}
              />
            ) : (
              <div className="flex h-[480px] w-full items-center justify-center text-sm text-slate-500">
                Въведете валиден JSON с полигони, за да визуализирате резултата.
              </div>
            )}
          </div>

          {mergeResult && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Изходна многоъгълна геометрия (WKT)
              </h2>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-slate-200">
                {toWKT(mergeResult.multipolygon)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function toWKT(multipolygon: MergeResult["multipolygon"]): string {
  if (multipolygon.length === 0) {
    return "GEOMETRYCOLLECTION EMPTY";
  }

  const polygons = multipolygon
    .map((polygon) => {
      const rings = polygon
        .map((ring) =>
          ring
            .map((point) => `${point[0]} ${point[1]}`)
            .join(", ")
        )
        .map((ring) => `(${ring})`)
        .join(", ");
      return `(${rings})`;
    })
    .join(", ");

  return `MULTIPOLYGON (${polygons})`;
}
