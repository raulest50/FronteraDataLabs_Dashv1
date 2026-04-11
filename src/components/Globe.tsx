import { useEffect, useRef } from 'react';
import {
  Cartesian3,
  createOsmBuildingsAsync,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  OpenStreetMapImageryProvider,
  Terrain,
  Viewer
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export default function Globe() {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  useEffect(() => {
    if (!cesiumContainerRef.current) return;

    const initViewer = async () => {
      const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
      if (ionToken) {
        Ion.defaultAccessToken = ionToken;
      } else {
        console.warn(
          'VITE_CESIUM_ION_TOKEN no esta definido. El terreno global y los edificios de Cesium pueden fallar.'
        );
      }

      // Initialize the Cesium Viewer in the HTML element with the cesiumContainer ref
      const viewer = new Viewer(cesiumContainerRef.current!, {
        baseLayer: ImageryLayer.fromProviderAsync(
          Promise.resolve(
            new OpenStreetMapImageryProvider({
              url: 'https://tile.openstreetmap.org/',
            })
          )
        ),
        baseLayerPicker: false,
        terrain: Terrain.fromWorldTerrain(),
      });

      viewerRef.current = viewer;

      // Fly the camera to San Francisco at the given longitude, latitude, and height.
      // Puedes cambiar las coordenadas a Bogotá: (-74.0721, 4.7110, 400)
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
        orientation: {
          heading: CesiumMath.toRadians(0.0),
          pitch: CesiumMath.toRadians(-15.0),
        }
      });

      // Add Cesium OSM Buildings, a global 3D buildings layer.
      const buildingTileset = await createOsmBuildingsAsync({
        enableShowOutline: false,
        showOutline: false,
      });
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.primitives.add(buildingTileset);
      }
    };

    initViewer();

    // Cleanup on component unmount
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={cesiumContainerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
