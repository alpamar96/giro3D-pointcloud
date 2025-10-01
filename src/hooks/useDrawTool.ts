import { useEffect, useRef, useState, useCallback } from "react";
import DrawTool, { conditions } from "@giro3d/giro3d/interactions/DrawTool";
import Instance from "@giro3d/giro3d/core/Instance";
import type { MeasurementOptions } from "../types/measurementsOptions";
import type Shape from "@giro3d/giro3d/entities/Shape";

export function useDrawTool(
  instance: Instance,
  options: MeasurementOptions,
  shapes : Shape [],
  addShape: (s: Shape) => void
) {
  const toolRef = useRef<DrawTool | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editedShapeRef = useRef<Shape | null>(null); // ← useRef en lugar de useState
  const shapesRef = useRef<Shape[]>(shapes); // ← También shapes como ref

  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Nota: 
    // shapes siempre será el valor actual porque:

    // Cada vez que shapes cambia en useShapes, el componente se re-renderiza
    // En cada re-render, obtienes el nuevo valor de shapes
    // Ese nuevo valor se pasa a useDrawTool
    // useDrawTool recibe el valor actualizado en cada render

  // Sincronizar shapesRef con shapes
   useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);
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
    // Restaurar color ANTES de salir del modo edición
    if (editedShapeRef.current) {
      editedShapeRef.current.color = options.color;
      instance.notifyChange(); // ← Forzar actualización visual
      editedShapeRef.current = null;
    }

    // Salir del modo edición
    toolRef.current?.exitEditMode();
    setIsEditMode(false);

    // Reactivar controles de cámara
    if (instance.view.controls) {
      //@ts-expect-error Ignore missing types
        instance.view.controls.enabled = true;
    }
  }, [instance, options.color]);

  /**
   * Entrar en modo edición
   */
  const startEditMode = useCallback(() => {
    if (!toolRef.current) return;

    let clickHandlerRef: ((e: MouseEvent) => void) | null = null;
    let rightClickHandlerRef: ((e: MouseEvent) => void) | null = null;

    const handleClick = (mouseEvent: MouseEvent) => {
      if (mouseEvent.button !== 0) return; // solo izquierdo

      // Remover listeners inmediatamente
      if (clickHandlerRef) {
        instance.domElement.removeEventListener("click", clickHandlerRef);
      }

      const pickResults = instance.pickObjectsAt(mouseEvent, {
        where: shapesRef.current,
      });
      const first = pickResults[0];
      const shape = first?.entity as Shape | null;

      if (shape) {
        editedShapeRef.current = shape;
        setIsEditMode(true);

        // Desactivar controles de cámara
        if (instance.view.controls) {
          //@ts-expect-error Ignore missing types
          instance.view.controls.enabled = false;
        }

        // Cambiar color de edición
        shape.color = "yellow";
        instance.notifyChange(); // ← Forzar actualización

        toolRef.current!.enterEditMode({
          shapesToEdit: [shape],
          onPointInserted: (arg) => console.log("onPointInserted", arg),
          onPointUpdated: (arg) => console.log("onPointUpdated", arg),
          onPointRemoved: (arg) => console.log("onPointRemoved", arg),
        });
      }
    };

    const handleRightClick = (mouseEvent: MouseEvent) => {
      mouseEvent.preventDefault(); // Evitar menú contextual

      // Remover listeners inmediatamente
      if (clickHandlerRef) {
        instance.domElement.removeEventListener("click", clickHandlerRef);
      }
      if (rightClickHandlerRef) {
        instance.domElement.removeEventListener(
          "contextmenu",
          rightClickHandlerRef
        );
      }

      // Salir del modo edición
      exitEditMode();
    };

    // Guardar referencias para poder eliminarlos
    clickHandlerRef = handleClick;
    rightClickHandlerRef = handleRightClick;

    // Registrar listeners
    instance.domElement.addEventListener("click", clickHandlerRef);
    instance.domElement.addEventListener("contextmenu", rightClickHandlerRef);
  }, [instance, exitEditMode]);



  /**
   * Inicialización del DrawTool
   */
  useEffect(() => {
    toolRef.current = new DrawTool({ instance });

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        // También salir del modo edición si está activo
        if (editedShapeRef.current) {
          exitEditMode();
        }
      }
    };

    document.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("keydown", handleKeydown);
      toolRef.current?.dispose?.();
    };
  }, [instance, exitEditMode]);

  return {
    toolRef,
    createShape,
    startEditMode,
    exitEditMode,
    isDrawing,
    isEditMode,
    editedShape: editedShapeRef.current, // Exponer el valor actual
    shapes: shapesRef.current, // Exponer shapes si lo necesitas
  };
}