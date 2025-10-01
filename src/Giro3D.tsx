import { useEffect, useRef, useState } from 'react';
import Instance from '@giro3d/giro3d/core/Instance';
import PointCloud from '@giro3d/giro3d/entities/PointCloud';
import LASSource from '@giro3d/giro3d/sources/LASSource';
// import Inspector from '@giro3d/giro3d/gui/Inspector';
import StatusBar from './widgets/StatusBar';
import { placeCameraOnTop } from './widgets/placeCameraOnTop';
import MeasurementPanel from './components/Measurements/MeasurementsTools';
import { CoordinatesContainer } from './components/Coordinates';

import './Giro3D.css';

function Giro3D() {
  const viewRef = useRef<HTMLDivElement | null>(null);
  // const inspectorRef = useRef<HTMLDivElement | null>(null);
  const statusBarRef = useRef<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);

  useEffect(() => {
    if (!viewRef.current || !statusBarRef.current) return;

    // Crear instancia
    const instance = new Instance({
      crs: 'EPSG:25830',
      target: viewRef.current,
      backgroundColor: null,
    });

    // Save instance to state so child components can use it
    setInstance(instance);

    Instance.registerCRS(
      'EPSG:25830',
      '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
    );

    // Cargar LAS
    async function loadLas(url: string) {
      const source = new LASSource({ url });
      const entity = new PointCloud({ source });

      await instance.add(entity);

      entity.setActiveAttribute('Color');
      entity.pointSize = 0.1;

      placeCameraOnTop(entity.getBoundingBox(), instance);

      // Bind StatusBar **después** de que existan los elementos
      try {
        StatusBar.bind(instance);
      } catch (err) {
        console.warn('StatusBar.bind failed:', err);
      }
    }

    loadLas('../src/assets/dam_gate.las').catch(console.error);

    
    async function load3DTiles(url: string) {

      const sourceTiles = new Tiles3D

      
    }


    // Inspector
    // Inspector.attach(inspectorRef.current, instance);

    return () => {
      instance.dispose?.();
      setInstance(null);
    };
  }, []);

  return (
    <>
      <div className="view-container">
        {/* 2. El div del canvas, ahora sin estilos en línea */}
        <div ref={viewRef} className="canvas-view" />

        {/* 3. El panel de medidas. React lo colocará dentro de "view-container" */}
        {instance && <MeasurementPanel instance={instance} />}

        <div className="coordinates-container">
          <CoordinatesContainer statusBarRef={statusBarRef} />
        </div>
      </div>
    </>
  );
}

export default Giro3D;

