import type Shape from "@giro3d/giro3d/entities/Shape";
import type { MeasurementOptions } from "../types/measurementsOptions";

interface StyleControlsProps {
    options: {
        lineWidth: number;
        color: string;
    };
    onOptionsChange: <K extends keyof MeasurementOptions>(key: K, value: MeasurementOptions[K]) => void;
    shapes: Shape[];
}


const StyleControls = ({ options, onOptionsChange, shapes }: StyleControlsProps) => {
    return (
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
                        onOptionsChange('lineWidth', value);
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
                        onOptionsChange('color', e.target.value);
                        shapes.forEach(shape => { shape.color = e.target.value; });
                    }}
                    style={{ width: '100%', padding: '4px' }}
                />
            </div>
        </div>
    );
};

export default StyleControls;