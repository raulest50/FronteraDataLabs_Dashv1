import { useEffect, useRef } from 'react';
import {
  ArcGisMapServerImageryProvider,
  Cartesian3,
  createOsmBuildingsAsync,
  EllipsoidTerrainProvider,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
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
      }

      try {
        const viewerOptions = {
          baseLayer: ImageryLayer.fromProviderAsync(
            ArcGisMapServerImageryProvider.fromUrl(
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
            )
          ),
          baseLayerPicker: false,
          ...(ionToken
            ? { terrain: Terrain.fromWorldTerrain() }
            : { terrainProvider: new EllipsoidTerrainProvider() }),
        };

        const viewer = new Viewer(cesiumContainerRef.current!, viewerOptions);

        viewerRef.current = viewer;

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
          orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-15.0),
          }
        });

        if (!ionToken) {
          console.warn(
            'VITE_CESIUM_ION_TOKEN no esta definido. Se usa globo base sin terreno mundial ni edificios OSM.'
          );
          return;
        }

        const buildingTileset = await createOsmBuildingsAsync({
          enableShowOutline: false,
          showOutline: false,
        });

        if (viewerRef.current && !viewerRef.current.isDestroyed()) {
          viewerRef.current.scene.primitives.add(buildingTileset);
        }
      } catch (error) {
        console.error('Error inicializando Cesium:', error);
      }
    };

    initViewer();

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
