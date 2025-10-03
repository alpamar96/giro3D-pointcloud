import Giro3D from './components/Giro3D';
import MeasurementPanel from './components/Measurements/MeasurementsTools';
import { CoordinatesContainer } from './components/Coordinates';
import LASPointCloud from './components/Loaders/LASPointCloud';
import Tiles3D from './components/Loaders/Tiles3D';

function App() {
  return (
    <Giro3D crs="EPSG:25830" backgroundColor="#202020">
      <LASPointCloud
        url="../src/assets/dam_gate.las"
        pointSize={0.1}
        focusCamera={true}
      />

      <Tiles3D
        url="../src/assets/SanEsteban/tileset.json"
        errorTarget={8}
      />

      <MeasurementPanel />
      <CoordinatesContainer />
    </Giro3D>
  );
}

export default App;