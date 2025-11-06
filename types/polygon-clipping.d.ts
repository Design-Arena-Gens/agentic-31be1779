declare module "polygon-clipping" {
  export type Coordinate = [number, number];
  export type Ring = Coordinate[];
  export type Polygon = Ring[];
  export type MultiPolygon = Polygon[];

  export function union(...geometries: MultiPolygon[]): MultiPolygon;

  const polygonClipping: {
    union: typeof union;
  };

  export default polygonClipping;
}
