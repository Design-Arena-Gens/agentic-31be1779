"use client";

import { useMemo } from "react";
import type { Connector, MultiPolygon, Point, Polygon } from "@/lib/mergePolygons";

interface PolygonSketchProps {
  polygons: Polygon[];
  connectors: Connector[];
  result: MultiPolygon;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function collectPoints(polygons: Polygon[]): Point[] {
  return polygons.flat();
}

function collectBridgePoints(connectors: Connector[]): Point[] {
  return connectors.flatMap((connector) => connector.bridge);
}

function collectResultPoints(result: MultiPolygon): Point[] {
  const points: Point[] = [];
  for (const polygon of result) {
    for (const ring of polygon) {
      for (const [x, y] of ring) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

function computeBounds(polygons: Polygon[], connectors: Connector[], result: MultiPolygon): Bounds {
  const points = [
    ...collectPoints(polygons),
    ...collectBridgePoints(connectors),
    ...collectResultPoints(result)
  ];

  if (points.length === 0) {
    return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
  }

  let minX = points[0]!.x;
  let maxX = points[0]!.x;
  let minY = points[0]!.y;
  let maxY = points[0]!.y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const padding = Math.max((maxX - minX) * 0.1, (maxY - minY) * 0.1, 20);

  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding
  };
}

function ringToPath(ring: number[][]): string {
  if (ring.length === 0) return "";
  const [first, ...rest] = ring;
  const commands = [`M ${first[0]} ${first[1]}`];
  for (const [x, y] of rest) {
    commands.push(`L ${x} ${y}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

export function PolygonSketch({ polygons, connectors, result }: PolygonSketchProps) {
  const bounds = useMemo(() => computeBounds(polygons, connectors, result), [
    polygons,
    connectors,
    result
  ]);

  const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.maxX - bounds.minX} ${bounds.maxY - bounds.minY}`;

  return (
    <svg
      viewBox={viewBox}
      className="h-[480px] w-full rounded-xl border border-slate-800 bg-slate-900"
    >
      <defs>
        <linearGradient id="polyFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {polygons.map((polygon, index) => (
        <polygon
          key={`input-${index}`}
          points={polygon.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          strokeDasharray="6 4"
        />
      ))}

      {connectors.map((connector, index) => (
        <g key={`connector-${index}`}>
          <polygon
            points={connector.bridge.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="#f9731633"
            stroke="#f97316"
            strokeWidth={1.5}
          />
          <line
            x1={connector.pointA.x}
            y1={connector.pointA.y}
            x2={connector.pointB.x}
            y2={connector.pointB.y}
            stroke="#f97316"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        </g>
      ))}

      {result.map((polygon, index) => (
        <g key={`result-${index}`}>
          {polygon.map((ring, ringIndex) => (
            <path
              key={`ring-${ringIndex}`}
              d={ringToPath(ring)}
              fill="url(#polyFill)"
              stroke="#818cf8"
              strokeWidth={2}
              opacity={ringIndex === 0 ? 0.9 : 0.4}
            />
          ))}
        </g>
      ))}
    </svg>
  );
}
