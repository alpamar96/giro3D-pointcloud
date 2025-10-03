
// hooks/useGiro3DInstance.ts (o .tsx)
import { useContext } from 'react';
import Giro3DContext from '../contexts/Giro3DContext';

export const useGiro3DInstance = () => {
  const instance = useContext(Giro3DContext);
  if (!instance) {
    throw new Error('useGiro3DInstance must be used within Giro3D component');
  }
  return instance;
};