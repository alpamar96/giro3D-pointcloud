import Instance from '@giro3d/giro3d/core/Instance';
import { DEFAULT_SURFACE_OPACITY } from '@giro3d/giro3d/entities/Shape';
import { useCallback, useState } from 'react';
import ActionButtons from './components/ActionsButtons';
import DrawButtons from './components/DrawButtons';
import StyleControls from './components/StyleControls';
import UnitControls from './components/UnitControls';
import { useDrawTool } from './hooks/useDrawTool';
import { useShapeFormatters } from './hooks/useShapeFormatters';
import { useShapes } from './hooks/useShapes';
import type { MeasurementOptions } from './types/measurementsOptions';

interface MeasurementPanelProps {
  instance: Instance;
}

const MeasurementPanel = ({ instance }: MeasurementPanelProps) => {
  const [options, setOptions] = useState<MeasurementOptions>({
    lineWidth: 2,
    borderWidth: 1,
    vertexRadius: 4,
    color: '#2978b4',
    areaUnit: 'm',
    lengthUnit: 'm',
    slopeUnit: 'deg',
    endCondition: 'rightclick',
    surfaceOpacity: DEFAULT_SURFACE_OPACITY,
  });

  const formatters = useShapeFormatters(instance, options);
  const { shapes, addShape, removeAllShapes, exportShapes } = useShapes(instance);
  const { toolRef, createShape, exitEditMode, isDrawing, isEditMode, startEditMode } = useDrawTool(instance, options, shapes, addShape);

  const handleOptionsChange = useCallback(<K extends keyof MeasurementOptions>(key: K, value: MeasurementOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="measurement-panel">
      <h3>Herramientas de Medición</h3>

      <DrawButtons
        isDrawing={isDrawing}
        isEditMode={isEditMode}
        activeButton={null}
        onDraw={(_, cb, opts) => createShape(cb, opts)}
        toolRef={toolRef}
        formatters={formatters}
      />

      <UnitControls options={options} onOptionsChange={handleOptionsChange} shapes={shapes} />
      <StyleControls options={options} onOptionsChange={handleOptionsChange} shapes={shapes} />

      <ActionButtons
        shapes={shapes}
        isEditMode={isEditMode}
        isDrawing={isDrawing}
        onStartEdit={startEditMode}
        onExitEdit={exitEditMode}
        onExport={exportShapes}
        onRemoveAll={removeAllShapes}
      />

      <div>Formas activas: {shapes.length}</div>
    </div>
  );
};

export default MeasurementPanel;
