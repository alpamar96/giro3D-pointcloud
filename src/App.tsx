import { useEffect, useRef, useState } from 'react';
import Instance from '@giro3d/giro3d/core/Instance';
import PointCloud from '@giro3d/giro3d/entities/PointCloud';
import LASSource from '@giro3d/giro3d/sources/LASSource';
// import Inspector from '@giro3d/giro3d/gui/Inspector';
import StatusBar from './widgets/StatusBar';
import { placeCameraOnTop } from './widgets/placeCameraOnTop';
import { CoordinatesContainer } from './coordinates';
import MeasurementPanel from './MeasurementsTools';

function App() {
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
    async function load(url: string) {
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

    load('/dam_gate.las').catch(console.error);

    // Inspector
    // Inspector.attach(inspectorRef.current, instance);

    return () => {
      instance.dispose?.();
      setInstance(null);
    };
  }, []);

  return (
    <>
      <div ref={viewRef} style={{ width: '1800px', height: '1600px' }} />
      {instance && <MeasurementPanel instance={instance} />}


      {/* <div ref={inspectorRef} style={{ width: '800px', height: '30px' }} /> */}

      {/* Render the status bar container via the CoordinatesContainer component so the
          same ref is used and markup isn't duplicated. */}
      <CoordinatesContainer statusBarRef={statusBarRef} />
    </>
  );
}

export default App;


// import { useEffect } from 'react';
  
// import { Color } from "three";
// import { MapControls } from "three/examples/jsm/controls/MapControls.js";
 
// import Instance from '@giro3d/giro3d/core/Instance.js';
// import Extent from "@giro3d/giro3d/core/geographic/Extent.js";
// import ElevationLayer from "@giro3d/giro3d/core/layer/ElevationLayer.js";
// import Map from "@giro3d/giro3d/entities/Map.js";
// import Inspector from "@giro3d/giro3d/gui/Inspector.js";
// import GeoTIFFSource from "@giro3d/giro3d/sources/GeoTIFFSource.js";
// import ColorMap, { ColorMapMode } from '@giro3d/giro3d/core/ColorMap';
 
 
// function Giro3D() {
//   useEffect(() => {
 
//   const extent = new Extent(
//     "EPSG:3857",
//     -13581040.085,
//     -13469591.026,
//     5780261.83,
//     5942165.048,
//   );
 
//   const instance = new Instance({
//     target: 'giro3d-view', // The id of the <div> that will contain the Giro3D instance
//     crs: extent.crs,
//   });
 
//   instance.view.camera.position.set(-13656319, 5735451, 88934);
 
//   const controls = new MapControls(instance.view.camera, instance.domElement);
//   controls.enableDamping = true;
//   controls.dampingFactor = 0.2;
//   controls.target.set(-13545408, 5837154, 0);
//   instance.view.setControls(controls);
 
//   const map = new Map({
//     extent,
//     backgroundColor: "gray",
//   });
//   instance.add(map);
 
//   // Use an elevation COG with nodata values
//   const source = new GeoTIFFSource({
//     url: "https://3d.oslandia.com/cog_data/COG_EPSG3857_USGS_13_n47w122_20220919.tif",
//     crs: extent.crs,
//   });
 
//   const min = 263;
//   const max = 4347;
 
//   // Display it as elevation and color
//   const viridis = new ColorMap({
//     colors: [new Color("#440154"), new Color("#482878"), new Color("#3E4989"), new Color("#31688E"), new Color("#26828E"), new Color("#1F9E89"), new Color("#35B779"), new Color("#6CCE59"), new Color("#B4DD2C"), new Color("#FDE725")],
//     min,
//     max,
//     mode: ColorMapMode.Elevation,
//   });

 
//   // Attach the inspector
//   Inspector.attach("inspector", instance);
 
//   map.addLayer(
//     new ElevationLayer({
//       name: "elevation-colormap",
//       extent,
//       source,
//       colorMap: viridis,
//       minmax: { min, max },
//     }),
//   );
//   }, []);
 
//   return (
//     <>
//       <div id="giro3d-view" style={{ width: '1800px', height: '1600px' }}></div>
//       <div id="inspector" style={{ width: '800px', height: '30px' }}></div>
//     </>
//   );
// }
 
// export default Giro3D;
