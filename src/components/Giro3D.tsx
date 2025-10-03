// components/Giro3D.tsx
import { useEffect, useRef, useState } from 'react';
import Instance from '@giro3d/giro3d/core/Instance';
import Giro3DContext from '../contexts/Giro3DContext';
import '../Giro3D.css';

interface Giro3DProps {
  crs?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
}

function Giro3D({ 
  crs = 'EPSG:25830', 
  backgroundColor = '#202020',
  children 
}: Giro3DProps) {
  const viewRef = useRef<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<Instance | null>(null);

  useEffect(() => {
    if (!viewRef.current) return;

    // Registrar CRS si es necesario
    if (crs === 'EPSG:25830') {
      Instance.registerCRS(
        'EPSG:25830',
        '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
      );
    }

    // Crear instancia
    const newInstance = new Instance({
      crs,
      target: viewRef.current,
      backgroundColor,
    });

    setInstance(newInstance);

    return () => {
      newInstance.dispose?.();
      setInstance(null);
    };
  }, [crs, backgroundColor]);

  return (
    <Giro3DContext.Provider value={instance}>
      <div className="view-container">
        <div ref={viewRef} className="canvas-view" />
        {/* Los children solo se renderizan cuando instance está listo */}
        {instance && children}
      </div>
    </Giro3DContext.Provider>
  );
}

export default Giro3D;