import { useMemo, useCallback } from "react";
import {
  angleSegmentFormatter,
  slopeSegmentFormatter,
} from "@giro3d/giro3d/entities/Shape";
import Instance from "@giro3d/giro3d/core/Instance";
import { Vector3 } from "three";
import type { MeasurementOptions } from "../types/measurementsOptions";
import Coordinates from "@giro3d/giro3d/core/geographic/Coordinates";

export function useShapeFormatters(
  instance: Instance,
  options: MeasurementOptions
) {
  const numberFormat = useMemo(
    () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }),
    []
  );

  const vertexLabelFormatter = useCallback(
    ({ position }: { position: Vector3 }) => {
      const latlon = new Coordinates(
        instance.referenceCrs,
        position.x,
        position.y,
        position.z
      ).as("EPSG:4326");
      return `lat: ${latlon.latitude.toFixed(
        5
      )}°, lon: ${latlon.longitude.toFixed(5)}°, alt: ${latlon.altitude.toFixed(
        3
      )} m`;
    },
    [instance.referenceCrs]
  );

  const slopeFormatter = useCallback(
    (opts: any) => {
      return options.slopeUnit === "pct"
        ? slopeSegmentFormatter(opts)
        : angleSegmentFormatter(opts);
    },
    [options.slopeUnit]
  );

  const surfaceLabelFormatter = useCallback(
    ({ area }: { area: number }) => {
      switch (options.areaUnit) {
        case "m":
          if (area > 1_000_000)
            return `${numberFormat.format(area / 1_000_000)} km²`;
          return `${numberFormat.format(Math.round(area))} m²`;
        case "ha":
          return `${numberFormat.format(area / 10000)} ha`;
        case "acre":
          return `${numberFormat.format(area / 4046.8564224)} acres`;
        default:
          return `${numberFormat.format(Math.round(area))} m²`;
      }
    },
    [options.areaUnit, numberFormat]
  );

  const lengthFormatter = useCallback(
    ({ length }: { length: number }) => {
      return options.lengthUnit === "ft"
        ? `${numberFormat.format(Math.round(length * 3.28084))} ft`
        : `${numberFormat.format(Math.round(length))} m`;
    },
    [options.lengthUnit, numberFormat]
  );

  const verticalLineLabelFormatter = useCallback(
    ({ vertexIndex, length }: { vertexIndex: number; length: number }) => {
      if (vertexIndex === 0) return null;
      return options.lengthUnit === "ft"
        ? `${numberFormat.format(Math.round(length * 3.28084))} ft`
        : `${numberFormat.format(Math.round(length))} m`;
    },
    [options.lengthUnit, numberFormat]
  );

  return {
    vertexLabelFormatter,
    slopeFormatter,
    surfaceLabelFormatter,
    lengthFormatter,
    verticalLineLabelFormatter,
  };
}
