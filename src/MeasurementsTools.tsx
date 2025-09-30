import Coordinates from '@giro3d/giro3d/core/geographic/Coordinates';
import Instance from '@giro3d/giro3d/core/Instance';
import Shape, {
    DEFAULT_SURFACE_OPACITY,
    angleSegmentFormatter,
    isShapePickResult,
    slopeSegmentFormatter,
} from '@giro3d/giro3d/entities/Shape';
import DrawTool, { conditions } from '@giro3d/giro3d/interactions/DrawTool';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Color, Vector3 } from 'three';
import DrawButtons from './components/DrawButtons';
import UnitControls from './components/UnitControls';
import StyleControls from './components/StyleControls';
import ActionButtons from './components/ActionsButtons';


// ===== TIPOS =====
interface MeasurementPanelProps {
    instance: Instance;
}

// ===== COMPONENTE PRINCIPAL =====
const MeasurementPanel = ({ instance }: MeasurementPanelProps) => {
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [activeButton, setActiveButton] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedShape, setEditedShape] = useState<Shape | null>(null);
    const [highlightHoveredShape, setHighlightHoveredShape] = useState(false);

    const toolRef = useRef<DrawTool | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [options, setOptions] = useState({
        lineWidth: 2,
        borderWidth: 1,
        vertexRadius: 4,
        color: '#2978b4',
        areaUnit: 'm' as 'm' | 'ha' | 'acre',
        lengthUnit: 'm' as 'm' | 'ft',
        slopeUnit: 'deg' as 'deg' | 'pct',
        endCondition: 'rightclick' as 'rightclick' | 'doubleclick',
        surfaceOpacity: DEFAULT_SURFACE_OPACITY,
    });

    const handleOptionsChange = useCallback((key: string, value: any) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    }, []);

    const pickShape = useCallback((mouseEvent: MouseEvent): Shape | null => {
        const pickResults = instance.pickObjectsAt(mouseEvent, { where: shapes });
        const first = pickResults[0];
        if (isShapePickResult(first)) {
            return first.entity;
        }
        return null;
    }, [instance, shapes]);

    const numberFormat = useMemo(() => new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
    }), []);

    const vertexLabelFormatter = useCallback(({ position }: { position: Vector3 }) => {
        const latlon = new Coordinates(instance.referenceCrs, position.x, position.y, position.z).as('EPSG:4326');
        return `lat: ${latlon.latitude.toFixed(5)}°, lon: ${latlon.longitude.toFixed(5)}°, alt: ${latlon.altitude.toFixed(3)} m`;
    }, [instance.referenceCrs]);

    const slopeFormatter = useCallback((opts: any) => {
        switch (options.slopeUnit) {
            case 'deg':
                return angleSegmentFormatter(opts);
            case 'pct':
                return slopeSegmentFormatter(opts);
            default:
                return angleSegmentFormatter(opts);
        }
    }, [options.slopeUnit]);

    const surfaceLabelFormatter = useCallback(({ area }: { area: number }) => {
        switch (options.areaUnit) {
            case 'm': {
                if (area > 1_000_000) {
                    return `${numberFormat.format(area / 1_000_000)} km²`;
                }
                return `${numberFormat.format(Math.round(area))} m²`;
            }
            case 'ha':
                return `${numberFormat.format(area / 10000)} ha`;
            case 'acre':
                return `${numberFormat.format(area / 4_046.8564224)} acres`;
            default:
                return `${numberFormat.format(Math.round(area))} m²`;
        }
    }, [options.areaUnit, numberFormat]);

    const lengthFormatter = useCallback(({ length }: { length: number }) => {
        switch (options.lengthUnit) {
            case 'm':
                return `${numberFormat.format(Math.round(length))} m`;
            case 'ft':
                return `${numberFormat.format(Math.round(length * 3.28084))} ft`;
            default:
                return `${numberFormat.format(Math.round(length))} m`;
        }
    }, [options.lengthUnit, numberFormat]);

    const verticalLineLabelFormatter = useCallback(({ vertexIndex, length }: { vertexIndex: number; length: number }) => {
        if (vertexIndex === 0) return null;

        switch (options.lengthUnit) {
            case 'm':
                return `${numberFormat.format(Math.round(length))} m`;
            case 'ft':
                return `${numberFormat.format(Math.round(length * 3.28084))} ft`;
            default:
                return `${numberFormat.format(Math.round(length))} m`;
        }
    }, [options.lengthUnit, numberFormat]);

    const createShape = useCallback(async (callback: Function, specificOptions: any) => {
        if (!toolRef.current) return;

        setIsDrawing(true);
        abortControllerRef.current = new AbortController();

        try {
            const shape = await callback.bind(toolRef.current)({
                signal: abortControllerRef.current.signal,
                ...options,
                ...specificOptions,
                endCondition: options.endCondition === 'rightclick' ? conditions.rightClick : conditions.doubleClick,
                onTemporaryPointMoved: () => console.log('onTemporaryPointMoved'),
            });

            if (shape) {
                setShapes(prev => [...prev, shape]);
            }
        } catch (e: unknown) {
            if (e instanceof Error && e.message !== 'aborted') {
                console.error(e);
            }
        } finally {
            setIsDrawing(false);
            setActiveButton(null);
        }
    }, [options]);

    const exitEditMode = useCallback(() => {
        if (toolRef.current) {
            toolRef.current.exitEditMode();
        }

        setIsEditMode(false);
        setHighlightHoveredShape(false);

        if (editedShape) {
            editedShape.color = options.color;
            setEditedShape(null);
        }
    }, [editedShape, options.color]);

    const startEditMode = useCallback(() => {
        if (!toolRef.current) return;

        setHighlightHoveredShape(true);

        const handleClick = (mouseEvent: MouseEvent) => {
            if (mouseEvent.button === 0) {
                instance.domElement.removeEventListener('click', handleClick);
                const shape = pickShape(mouseEvent);

                if (shape) {
                    setEditedShape(shape);
                    setIsEditMode(true);
                    setHighlightHoveredShape(false);
                    shape.color = 'yellow';

                    toolRef.current!.enterEditMode({
                        shapesToEdit: [shape],
                        onPointInserted: arg => console.log('onPointInserted', arg),
                        onPointUpdated: arg => console.log('onPointMoved', arg),
                        onPointRemoved: arg => console.log('onPointRemoved', arg),
                    });
                }
            }
        };

        const handleRightClick = () => {
            exitEditMode();
            instance.domElement.removeEventListener('contextmenu', handleRightClick);
        };

        instance.domElement.addEventListener('click', handleClick);
        instance.domElement.addEventListener('contextmenu', handleRightClick);
    }, [instance.domElement, pickShape, exitEditMode]);

    const removeAllShapes = useCallback(() => {
        shapes.forEach(shape => instance.remove(shape));
        setShapes([]);
    }, [shapes, instance]);

    const exportShapes = useCallback(() => {
        const featureCollection = {
            type: 'FeatureCollection',
            features: shapes.map(shape => shape.toGeoJSON()),
        };

        const text = JSON.stringify(featureCollection, null, 2);
        const blob = new Blob([text], { type: 'application/geo+json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = 'shapes.geojson';
        link.href = url;
        link.click();

        URL.revokeObjectURL(url);
    }, [shapes]);

    useEffect(() => {
        if (!instance) return;

        toolRef.current = new DrawTool({ instance });
        const tool = toolRef.current;

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && abortControllerRef.current) {
                try {
                    abortControllerRef.current.abort();
                } catch {
                    console.log('Drawing aborted');
                }
            }
        };

        const handleMouseMove = (mouseEvent: MouseEvent) => {
            if (shapes.length === 0) return;

            shapes.forEach(shape => {
                shape.labelOpacity = 1;
            });

            if (isEditMode || highlightHoveredShape) {
                const pickResults = instance.pickObjectsAt(mouseEvent, { where: shapes });
                const first = pickResults[0];
                const shape = isShapePickResult(first) ? first.entity : null;

                if (shape) {
                    if (isEditMode && shape === editedShape) {
                        shape.labelOpacity = 0.5;
                    }
                    if (highlightHoveredShape) {
                        shape.color = new Color(options.color).offsetHSL(0, 0, 0.2);
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeydown);
        instance.domElement.addEventListener('mousemove', handleMouseMove);

        tool.addEventListener('start-drag', () => {
            if (instance.view.controls) {
                
                (instance.view.controls as any).enabled = false;
            }
        });

        tool.addEventListener('end-drag', () => {
            if (instance.view.controls) {
                (instance.view.controls as any).enabled = true;
            }
        });

        return () => {
            document.removeEventListener('keydown', handleKeydown);
            instance.domElement.removeEventListener('mousemove', handleMouseMove);
            tool.dispose?.();
        };
    }, [instance, shapes, isEditMode, editedShape, highlightHoveredShape, options.color]);

    const handleDrawButton = useCallback((
        buttonId: string,
        callback: (options: Record<string, unknown>) => Promise<Shape | undefined | null>,
        specificOptions: Record<string, unknown>
    ) => {
        setActiveButton(buttonId);
        createShape(callback, specificOptions);
    }, [createShape]);

    const formatters = useMemo(() => ({
        vertexLabelFormatter,
        lengthFormatter,
        surfaceLabelFormatter,
        verticalLineLabelFormatter,
        slopeFormatter,
    }), [vertexLabelFormatter, lengthFormatter, surfaceLabelFormatter, verticalLineLabelFormatter, slopeFormatter]);

    return (
        <div className="measurement-panel" style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            minWidth: '280px',
            maxHeight: '80vh',
            overflowY: 'auto'
        }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Herramientas de Medición</h3>

            <DrawButtons
                isDrawing={isDrawing}
                isEditMode={isEditMode}
                activeButton={activeButton}
                onDraw={handleDrawButton}
                toolRef={toolRef}
                formatters={formatters}
            />

            <UnitControls
                options={options}
                onOptionsChange={handleOptionsChange}
                shapes={shapes}
            />

            <StyleControls
                options={options}
                onOptionsChange={handleOptionsChange}
                shapes={shapes}
            />

            <ActionButtons
                shapes={shapes}
                isEditMode={isEditMode}
                isDrawing={isDrawing}
                onStartEdit={startEditMode}
                onExitEdit={exitEditMode}
                onExport={exportShapes}
                onRemoveAll={removeAllShapes}
            />

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                Formas activas: {shapes.length}
            </div>
        </div>
    );
};

export default MeasurementPanel;