import type DrawTool from "@giro3d/giro3d/interactions/DrawTool";

interface DrawButtonsProps {
    isDrawing: boolean;
    isEditMode: boolean;
    activeButton: string | null;
    onDraw: (buttonId: string, callback: any, options: any) => void;
    toolRef: React.RefObject<DrawTool | null>;
    formatters: {
        vertexLabelFormatter: any;
        lengthFormatter: any;
        surfaceLabelFormatter: any;
        verticalLineLabelFormatter: any;
        slopeFormatter: any;
    };
}

const DrawButtons = ({ 
    isDrawing, 
    isEditMode, 
    activeButton, 
    onDraw, 
    toolRef,
    formatters 
}: DrawButtonsProps) => {
    const { vertexLabelFormatter, lengthFormatter, surfaceLabelFormatter, verticalLineLabelFormatter, slopeFormatter } = formatters;

    return (
        <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Dibujar</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                <button
                    disabled={isDrawing || isEditMode}
                    className={activeButton === 'point' ? 'active' : ''}
                    onClick={() => onDraw(
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
                    onClick={() => onDraw('segment', toolRef.current!.createSegment, {
                        segmentLabelFormatter: lengthFormatter,
                        showSegmentLabels: true,
                    })}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Segmento
                </button>

                <button
                    disabled={isDrawing || isEditMode}
                    onClick={() => onDraw('linestring', toolRef.current!.createLineString, {
                        segmentLabelFormatter: lengthFormatter,
                        showSegmentLabels: true,
                    })}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Línea
                </button>

                <button
                    disabled={isDrawing || isEditMode}
                    onClick={() => onDraw('polygon', toolRef.current!.createPolygon, {
                        surfaceLabelFormatter,
                        showSurfaceLabel: true,
                    })}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Polígono
                </button>

                <button
                    disabled={isDrawing || isEditMode}
                    onClick={() => onDraw('vertical', toolRef.current!.createVerticalMeasure, {
                        verticalLineLabelFormatter: verticalLineLabelFormatter,
                        segmentLabelFormatter: slopeFormatter,
                    })}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Vertical
                </button>

                <button
                    disabled={isDrawing || isEditMode}
                    onClick={() => onDraw('angle', toolRef.current!.createSector, {})}
                    style={{ padding: '8px', fontSize: '12px' }}
                >
                    Ángulo
                </button>
            </div>
        </div>
    );
};

export default DrawButtons;