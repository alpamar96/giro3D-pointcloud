// contexts/Giro3DContext.tsx
import { createContext } from 'react';
import type Instance from '@giro3d/giro3d/core/Instance';

const Giro3DContext = createContext<Instance | null>(null);

export default Giro3DContext;