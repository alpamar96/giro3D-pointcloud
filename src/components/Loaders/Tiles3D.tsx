import { useEffect, useRef } from 'react';
import Tiles3DEntity from '@giro3d/giro3d/entities/Tiles3D';
import { useGiro3DInstance } from '../../hooks/useGiro3DInstance';

interface Tiles3DProps {
  url: string;
  dracoDecoderPath?: string;
  ktx2DecoderPath?: string;
  errorTarget?: number;
  onLoad?: (entity: Tiles3DEntity) => void;
}

function Tiles3D({ 
  url,
  dracoDecoderPath = '/examples/jsm/libs/draco/',
  ktx2DecoderPath,
  errorTarget = 8,
  onLoad 
}: Tiles3DProps) {
  const instance = useGiro3DInstance();
  const entityRef = useRef<Tiles3DEntity | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTiles() {
      try {
        const entity = new Tiles3DEntity({
          url,
          dracoDecoderPath,
          ktx2DecoderPath,
          errorTarget,
        });

        await instance.add(entity);
        
        if (!mounted) {
          instance.remove(entity);
          return;
        }

        entityRef.current = entity;
        onLoad?.(entity);
        
        console.log('3D Tiles loaded:', url);
      } catch (error) {
        console.error('Error loading 3D tiles:', error);
      }
    }

    loadTiles();

    return () => {
      mounted = false;
      if (entityRef.current) {
        instance.remove(entityRef.current);
        entityRef.current = null;
      }
    };
  }, [instance, url, dracoDecoderPath, ktx2DecoderPath, errorTarget]);

  return null;
}

export default Tiles3D;