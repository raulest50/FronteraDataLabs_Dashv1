import { useEffect, useRef } from 'react';
import {
  ArcGisMapServerImageryProvider,
  Cartesian3,
  Color,
  createOsmBuildingsAsync,
  CustomDataSource,
  defined,
  EllipsoidTerrainProvider,
  Entity,
  HeightReference,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Terrain,
  Viewer
} from 'cesium';
import type { DeploymentNode } from '../data/questdb';
import 'cesium/Build/Cesium/Widgets/widgets.css';

type GlobeProps = {
  nodes?: DeploymentNode[];
  selectedDeploymentId?: string | null;
  onNodeSelect?: (deploymentId: string) => void;
};

export default function Globe({
  nodes = [],
  selectedDeploymentId = null,
  onNodeSelect,
}: GlobeProps) {
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const nodeDataSourceRef = useRef<CustomDataSource | null>(null);
  const clickHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  const onNodeSelectRef = useRef(onNodeSelect);

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  const syncNodes = () => {
    const dataSource = nodeDataSourceRef.current;
    if (!dataSource) return;

    dataSource.entities.removeAll();

    nodes.forEach((node) => {
      const isSelected = node.deploymentId === selectedDeploymentId;

      dataSource.entities.add({
        id: node.deploymentId,
        position: Cartesian3.fromDegrees(node.longitude, node.latitude, 12),
        properties: {
          deploymentId: node.deploymentId,
          boardId: node.boardId,
          locationName: node.locationName,
          kind: 'measurement-node',
        },
        point: {
          pixelSize: isSelected ? 18 : 13,
          color: isSelected
            ? Color.fromCssColorString('#7df9ff')
            : Color.fromCssColorString('#ffb84d'),
          outlineColor: Color.fromCssColorString('#0b0f14'),
          outlineWidth: isSelected ? 3 : 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: HeightReference.CLAMP_TO_GROUND,
        },
      });
    });
  };

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
        const nodeDataSource = new CustomDataSource('measurement-nodes');

        viewerRef.current = viewer;
        nodeDataSourceRef.current = nodeDataSource;
        await viewer.dataSources.add(nodeDataSource);

        clickHandlerRef.current = new ScreenSpaceEventHandler(viewer.scene.canvas);
        clickHandlerRef.current.setInputAction((movement: ScreenSpaceEventHandler.PositionedEvent) => {
          const picked = viewer.scene.pick(movement.position);

          if (!defined(picked) || !(picked.id instanceof Entity)) {
            return;
          }

          const entity = picked.id;
          const deploymentId = entity.properties?.deploymentId?.getValue(
            viewer.clock.currentTime
          );

          if (typeof deploymentId === 'string') {
            onNodeSelectRef.current?.(deploymentId);
          }
        }, ScreenSpaceEventType.LEFT_CLICK);

        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
          orientation: {
            heading: CesiumMath.toRadians(0.0),
            pitch: CesiumMath.toRadians(-15.0),
          }
        });

        syncNodes();

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
      if (clickHandlerRef.current) {
        clickHandlerRef.current.destroy();
        clickHandlerRef.current = null;
      }

      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }

      nodeDataSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    syncNodes();
  }, [nodes, selectedDeploymentId]);

  return (
    <div
      ref={cesiumContainerRef}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
