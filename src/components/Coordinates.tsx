import { useEffect, useRef } from 'react';
import { useGiro3DInstance } from '../hooks/useGiro3DInstance';
import StatusBar from '../widgets/StatusBar';

export const CoordinatesContainer = () => {
  const instance = useGiro3DInstance();
  const statusBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusBarRef.current) return;

    try {
      // Bind StatusBar cuando la instancia y el ref estén listos
      StatusBar.bind(instance);
    } catch (err) {
      console.warn('StatusBar.bind failed:', err);
    }

    // Cleanup si StatusBar tiene un método unbind o dispose
    return () => {
      // StatusBar.unbind?.(instance);
    };
  }, [instance]);

  return (
    <div ref={statusBarRef} id="statusbar">
      <div id="progress-bar"></div>
      <span id="loading-percent"></span>
      <span id="memory-usage"></span>
      <button id="crs"></button>
      <div id="coordinates"></div>
      <div id="attributions"></div>
    </div>
  );
};