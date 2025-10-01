import { useState, useCallback } from "react";
import Instance from "@giro3d/giro3d/core/Instance";
import type Shape from "@giro3d/giro3d/entities/Shape";

export function useShapes(instance: Instance) {
  const [shapes, setShapes] = useState<Shape[]>([]);

  const addShape = useCallback((shape: Shape) => {
    setShapes((prev) => [...prev, shape]);
  }, []);

  const removeAllShapes = useCallback(() => {
    setShapes((prev) => {
      prev.forEach((shape) => instance.remove(shape));
      return [];
    });
  }, [instance]);

  const exportShapes = useCallback(() => {
    const featureCollection = {
      type: "FeatureCollection",
      features: shapes.map((shape) => shape.toGeoJSON()),
    };

    const text = JSON.stringify(featureCollection, null, 2);
    const blob = new Blob([text], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.download = "shapes.geojson";
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);
  }, [shapes]);

  return { shapes, addShape, removeAllShapes, exportShapes, setShapes };
}
