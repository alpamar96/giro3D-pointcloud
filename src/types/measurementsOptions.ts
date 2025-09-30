export interface MeasurementOptions {
  lineWidth: number;
  borderWidth: number;
  vertexRadius: number;
  color: string;
  areaUnit: "m" | "ha" | "acre";
  lengthUnit: "m" | "ft";
  slopeUnit: "deg" | "pct";
  endCondition: "rightclick" | "doubleclick";
  surfaceOpacity: number;
}
