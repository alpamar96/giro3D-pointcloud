import type Shape from "@giro3d/giro3d/entities/Shape";


interface UnitControlsProps {
    options: {
        lengthUnit: 'm' | 'ft';
        areaUnit: 'm' | 'ha' | 'acre';
        slopeUnit: 'deg' | 'pct';
    };
    onOptionsChange: (key: string, value: any) => void;
    shapes: Shape[];
}


const UnitControls = ({ options, onOptionsChange, shapes }: UnitControlsProps) => {
    return (
        <div style={{ marginBottom: '15px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Unidades</h4>

            <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '2px' }}>Longitud:</label>
                <select
                    value={options.lengthUnit}
                    onChange={(e) => {
                        onOptionsChange('lengthUnit', e.target.value as 'm' | 'ft');
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
                        onOptionsChange('areaUnit', e.target.value as 'm' | 'ha' | 'acre');
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
                        onOptionsChange('slopeUnit', e.target.value as 'deg' | 'pct');
                        shapes.forEach(shape => shape.rebuildLabels());
                    }}
                    style={{ width: '100%', padding: '4px' }}
                >
                    <option value="deg">Grados</option>
                    <option value="pct">Porcentaje</option>
                </select>
            </div>
        </div>
    );
};

export default UnitControls;