import Coordinates from '@giro3d/giro3d/core/geographic/Coordinates';
import Instance from '@giro3d/giro3d/core/Instance';
import Shape, {
    DEFAULT_SURFACE_OPACITY,
    angleSegmentFormatter,
    isShapePickResult,
    slopeSegmentFormatter,
} from '@giro3d/giro3d/entities/Shape';
import DrawTool, { conditions } from '@giro3d/giro3d/interactions/DrawTool';
import { useEffect, useRef, useState } from 'react';
import { Color, Vector3 } from 'three';

interface MeasurementPanelProps {
    instance: Instance;
}

const MeasurementPanel = ({ instance }:MeasurementPanelProps) => {
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

    useEffect(() => {
        if (!instance) return;

        toolRef.current = new DrawTool({ instance });
        const tool = toolRef.current;

        // Configurar event listeners
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

            // Reset label opacity
            shapes.forEach(shape => {
                shape.labelOpacity = 1;
            });

            if (isEditMode || highlightHoveredShape) {
                const shape = pickShape(mouseEvent);

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

        // Event listeners para controlar la cámara durante la edición
        tool.addEventListener('start-drag', () => {
            if (instance.view.controls) {
                console.log("AHORA");
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

    const numberFormat = new Intl.NumberFormat(undefined, {
        maximumFractionDigits: 2,
    });

    const vertexLabelFormatter = ({ position }: { position: Vector3 }) => {
        const latlon = new Coordinates(instance.referenceCrs, position.x, position.y).as(
            'EPSG:4326'
        );
        return `lat: ${latlon.latitude.toFixed(5)}°, lon: ${latlon.longitude.toFixed(5)}°`;
    };

    const slopeFormatter = (opts: any) => {
        switch (options.slopeUnit) {
            case 'deg':
                return angleSegmentFormatter(opts);
            case 'pct':
                return slopeSegmentFormatter(opts);
            default:
                return angleSegmentFormatter(opts);
        }
    };

    const surfaceLabelFormatter = ({ area }: { area: number }) => {
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
    };

    const lengthFormatter = ({ length }: { length: number }) => {
        switch (options.lengthUnit) {
            case 'm':
                return `${numberFormat.format(Math.round(length))} m`;
            case 'ft':
                return `${numberFormat.format(Math.round(length * 3.28084))} ft`;
            default:
                return `${numberFormat.format(Math.round(length))} m`;
        }
    };

    const verticalLineLabelFormatter = ({ vertexIndex, length }: { vertexIndex: number; length: number }) => {
        if (vertexIndex === 0) return null;

        switch (options.lengthUnit) {
            case 'm':
                return `${numberFormat.format(Math.round(length))} m`;
            case 'ft':
                return `${numberFormat.format(Math.round(length * 3.28084))} ft`;
            default:
                return `${numberFormat.format(Math.round(length))} m`;
        }
    };

    const pickShape = (mouseEvent: MouseEvent): Shape | null => {
        const pickResults = instance.pickObjectsAt(mouseEvent, { where: shapes });
        const first = pickResults[0];
        if (isShapePickResult(first)) {
            return first.entity;
        }
        return null;
    };

    const createShape = async (callback: Function, specificOptions: any) => {
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
    };

    const handleDrawButton = (
        buttonId: string,
        callback: (options: Record<string, unknown>) => Promise<Shape | undefined | null>,
        specificOptions: Record<string, unknown>
    ) => {
        setActiveButton(buttonId);
        createShape(callback, specificOptions);
    };

    const removeAllShapes = () => {
        shapes.forEach(shape => instance.remove(shape));
        setShapes([]);
    };

    const exportShapes = () => {
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
    };

    const startEditMode = () => {
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
    };

    const exitEditMode = () => {
        if (toolRef.current) {
            toolRef.current.exitEditMode();
        }
        
        setIsEditMode(false);
        setHighlightHoveredShape(false);
        
        if (editedShape) {
            editedShape.color = options.color;
            setEditedShape(null);
        }
    };

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
            
            {/* Botones de dibujo */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Dibujar</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <button
                        disabled={isDrawing || isEditMode}
                        className={activeButton === 'point' ? 'active' : ''}
                        onClick={() => handleDrawButton(
                            'point',
                            (options: Record<string, unknown>) =>
                                toolRef.current!.createPoint(options).then(result => result ?? undefined),
                            {
                                showVertexLabels: true,
                                vertexLabelFormatter,
                            }
                        )}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Punto
                    </button>
                    
                    <button
                        disabled={isDrawing || isEditMode}
                        onClick={() => handleDrawButton('segment', toolRef.current!.createSegment, {
                            segmentLabelFormatter: lengthFormatter,
                            showSegmentLabels: true,
                        })}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Segmento
                    </button>
                    
                    <button
                        disabled={isDrawing || isEditMode}
                        onClick={() => handleDrawButton('linestring', toolRef.current!.createLineString, {
                            segmentLabelFormatter: lengthFormatter,
                            showSegmentLabels: true,
                        })}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Línea
                    </button>
                    
                    <button
                        disabled={isDrawing || isEditMode}
                        onClick={() => handleDrawButton('polygon', toolRef.current!.createPolygon, {
                            surfaceLabelFormatter,
                            showSurfaceLabel: true,
                        })}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Polígono
                    </button>
                    
                    <button
                        disabled={isDrawing || isEditMode}
                        onClick={() => handleDrawButton('vertical', toolRef.current!.createVerticalMeasure, {
                            verticalLineLabelFormatter: verticalLineLabelFormatter,
                            segmentLabelFormatter: slopeFormatter,
                        })}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Vertical
                    </button>
                    
                    <button
                        disabled={isDrawing || isEditMode}
                        onClick={() => handleDrawButton('angle', toolRef.current!.createSector, {})}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Ángulo
                    </button>
                </div>
            </div>

            {/* Controles de unidades */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Unidades</h4>
                
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Longitud:</label>
                    <select
                        value={options.lengthUnit}
                        onChange={(e) => {
                            setOptions(prev => ({ ...prev, lengthUnit: e.target.value as 'm' | 'ft' }));
                            shapes.forEach(shape => shape.rebuildLabels());
                        }}
                        style={{ width: '100%', padding: '4px' }}
                    >
                        <option value="m">Metros</option>
                        <option value="ft">Pies</option>
                    </select>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Área:</label>
                    <select
                        value={options.areaUnit}
                        onChange={(e) => {
                            setOptions(prev => ({ ...prev, areaUnit: e.target.value as 'm' | 'ha' | 'acre' }));
                            shapes.forEach(shape => shape.rebuildLabels());
                        }}
                        style={{ width: '100%', padding: '4px' }}
                    >
                        <option value="m">Metros²</option>
                        <option value="ha">Hectáreas</option>
                        <option value="acre">Acres</option>
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Pendiente:</label>
                    <select
                        value={options.slopeUnit}
                        onChange={(e) => {
                            setOptions(prev => ({ ...prev, slopeUnit: e.target.value as 'deg' | 'pct' }));
                            shapes.forEach(shape => shape.rebuildLabels());
                        }}
                        style={{ width: '100%', padding: '4px' }}
                    >
                        <option value="deg">Grados</option>
                        <option value="pct">Porcentaje</option>
                    </select>
                </div>
            </div>

            {/* Controles de estilo */}
            <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Estilo</h4>
                
                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>
                        Grosor línea: {options.lineWidth}
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={options.lineWidth}
                        onChange={(e) => {
                            const value = parseInt(e.target.value);
                            setOptions(prev => ({ ...prev, lineWidth: value }));
                            shapes.forEach(shape => { shape.lineWidth = value; });
                        }}
                        style={{ width: '100%' }}
                    />
                </div>

                <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Color:</label>
                    <input
                        type="color"
                        value={options.color}
                        onChange={(e) => {
                            setOptions(prev => ({ ...prev, color: e.target.value }));
                            shapes.forEach(shape => { shape.color = e.target.value; });
                        }}
                        style={{ width: '100%', padding: '4px' }}
                    />
                </div>
            </div>

            {/* Acciones */}
            <div>
                <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Acciones</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button
                        onClick={startEditMode}
                        disabled={shapes.length === 0 || isEditMode || isDrawing}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        {isEditMode ? 'Editando...' : 'Editar Forma'}
                    </button>
                    
                    {isEditMode && (
                        <button
                            onClick={exitEditMode}
                            style={{ padding: '8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white' }}
                        >
                            Terminar Edición
                        </button>
                    )}
                    
                    <button
                        onClick={exportShapes}
                        disabled={shapes.length === 0}
                        style={{ padding: '8px', fontSize: '12px' }}
                    >
                        Exportar GeoJSON
                    </button>
                    
                    <button
                        onClick={removeAllShapes}
                        disabled={shapes.length === 0 || isEditMode}
                        style={{ padding: '8px', fontSize: '12px', backgroundColor: '#dc3545', color: 'white' }}
                    >
                        Eliminar Todo
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                Formas activas: {shapes.length}
            </div>
        </div>
    );
};

export default MeasurementPanel;