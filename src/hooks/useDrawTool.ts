import { useEffect, useRef, useState, useCallback } from "react";
import DrawTool, { conditions } from "@giro3d/giro3d/interactions/DrawTool";
import Instance from "@giro3d/giro3d/core/Instance";
import type { MeasurementOptions } from "../types/measurementsOptions";
import type Shape from "@giro3d/giro3d/entities/Shape";

export function useDrawTool(
  instance: Instance,
  options: MeasurementOptions,
  addShape: (s: Shape) => void
) {
  const toolRef = useRef<DrawTool | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedShape, setEditedShape] = useState<Shape | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);

  /**
   * Crear nueva Shape
   */
  const createShape = useCallback(
    async (callback: Function, specificOptions: any) => {
      if (!toolRef.current) return;

      setIsDrawing(true);
      abortControllerRef.current = new AbortController();

      try {
        const shape = await callback.bind(toolRef.current)({
          signal: abortControllerRef.current.signal,
          ...options,
          ...specificOptions,
          endCondition:
            options.endCondition === "rightclick"
              ? conditions.rightClick
              : conditions.doubleClick,
        });

        if (shape) {
          addShape(shape);
          setShapes((prev) => [...prev, shape]);
        }
      } finally {
        setIsDrawing(false);
      }
    },
    [options, addShape]
  );

  /**
   * Salir de modo edición
   */
  const exitEditMode = useCallback(() => {
    toolRef.current?.exitEditMode();
    setIsEditMode(false);

    if (editedShape) {
      // Restaurar color original
      editedShape.color = options.color;
      setEditedShape(null);
    }

    // Reactivar controles de cámara
    if (instance.view.controls) {
      instance.view.controls.enabled = true;
    }
  }, [editedShape, instance, options.color]);

  /**
   * Entrar en modo edición
   */
  const startEditMode = useCallback(() => {
    if (!toolRef.current) return;

    const handleClick = (mouseEvent: MouseEvent) => {
      if (mouseEvent.button !== 0) return; // solo izquierdo
      instance.domElement.removeEventListener("click", handleClick);

      const pickResults = instance.pickObjectsAt(mouseEvent, { where: shapes });
      const first = pickResults[0];
      const shape = first?.entity as Shape | null;

      if (shape) {
        setEditedShape(shape);
        setIsEditMode(true);

        // Desactivar controles de cámara
        if (instance.view.controls) {
          instance.view.controls.enabled = false;
        }

        // Cambiar color de edición
        shape.color = "yellow";

        toolRef.current!.enterEditMode({
          shapesToEdit: [shape],
          onPointInserted: (arg) => console.log("onPointInserted", arg),
          onPointUpdated: (arg) => console.log("onPointUpdated", arg),
          onPointRemoved: (arg) => console.log("onPointRemoved", arg),
        });
      }
    };

    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault(); // ⚠️ evitar menú contextual
      exitEditMode();
      instance.domElement.removeEventListener("contextmenu", handleRightClick);
    };

    // Registramos los listeners
    instance.domElement.addEventListener("click", handleClick);
    instance.domElement.addEventListener("contextmenu", handleRightClick);
  }, [instance, shapes, exitEditMode]);

  /**
   * Inicialización del DrawTool
   */
  useEffect(() => {
    toolRef.current = new DrawTool({ instance });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      toolRef.current?.dispose?.();
    };
  }, [instance]);

  return {
    toolRef,
    createShape,
    startEditMode,
    exitEditMode,
    isDrawing,
    isEditMode,
    editedShape,
  };
}
