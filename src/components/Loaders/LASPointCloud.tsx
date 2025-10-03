// components/LASPointCloud.tsx
import { useEffect, useRef } from 'react';
import PointCloud from '@giro3d/giro3d/entities/PointCloud';
import LASSource from '@giro3d/giro3d/sources/LASSource';
import { useGiro3DInstance } from '../../hooks/useGiro3DInstance';
import { placeCameraOnTop } from '../../widgets/placeCameraOnTop';

interface LASPointCloudProps {
  url: string;
  activeAttribute?: string;
  pointSize?: number;
  focusCamera?: boolean;
  onLoad?: (entity: PointCloud) => void;
}

function LASPointCloud({ 
  url, 
  activeAttribute = 'Color',
  pointSize = 0.1,
  focusCamera = true,
  onLoad 
}: LASPointCloudProps) {
  const instance = useGiro3DInstance();
  const pointCloudRef = useRef<PointCloud | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPointCloud() {
      try {
        const source = new LASSource({ url });
        const entity = new PointCloud({ source });
        
        await instance.add(entity);
        
        if (!mounted) {
          instance.remove(entity);
          return;
        }

        entity.setActiveAttribute(activeAttribute);
        entity.pointSize = pointSize;

        if (focusCamera) {
          placeCameraOnTop(entity.getBoundingBox(), instance);
        }

        pointCloudRef.current = entity;
        onLoad?.(entity);
        
        console.log('LAS Point Cloud loaded:', url);
      } catch (error) {
        console.error('Error loading point cloud:', error);
      }
    }

    loadPointCloud();

    return () => {
      mounted = false;
      if (pointCloudRef.current) {
        instance.remove(pointCloudRef.current);
        pointCloudRef.current = null;
      }
    };
  }, [instance, url, activeAttribute, pointSize, focusCamera]);

  // No renderiza nada en el DOM
  return null;
}

export default LASPointCloud;