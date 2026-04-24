import { useEffect, useState } from 'react';
import './App.css';
import type {
  DeploymentDetail,
  DeploymentNode,
  OrphanTelemetrySummary,
  TelemetryPoint,
} from './data/questdb';
import {
  fetchDeploymentDetail,
  fetchDeployments,
  fetchDeploymentTelemetry,
  fetchOrphanTelemetrySummary,
} from './data/questdb';
import Globe from './components/Globe.tsx';
import InfoOverlay from './components/InfoOverlay.tsx';
import MeasurementNodePanel from './components/MeasurementNodePanel.tsx';

function App() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [nodes, setNodes] = useState<DeploymentNode[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);
  const [nodesError, setNodesError] = useState<string | null>(null);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DeploymentDetail | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<TelemetryPoint[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [orphanSummary, setOrphanSummary] = useState<OrphanTelemetrySummary | null>(
    null
  );

  const selectedNode = nodes.find(
    (node) => node.deploymentId === selectedDeploymentId
  ) ?? null;

  useEffect(() => {
    let cancelled = false;

    const loadNodes = async () => {
      setNodesLoading(true);
      setNodesError(null);

      try {
        const [deploymentsResult, orphanResult] = await Promise.allSettled([
          fetchDeployments(),
          fetchOrphanTelemetrySummary(),
        ]);
        if (cancelled) return;

        if (deploymentsResult.status !== 'fulfilled') {
          throw deploymentsResult.reason;
        }

        setNodes(deploymentsResult.value);

        if (orphanResult.status === 'fulfilled') {
          setOrphanSummary(orphanResult.value);
        } else {
          setOrphanSummary(null);
        }
      } catch (error) {
        if (cancelled) return;

        setNodes([]);
        setNodesError(
          error instanceof Error
            ? error.message
            : 'No fue posible consultar los deployments en la API de telemetria.'
        );
      } finally {
        if (!cancelled) {
          setNodesLoading(false);
        }
      }
    };

    loadNodes();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshOrphanSummary = async () => {
      try {
        const summary = await fetchOrphanTelemetrySummary();
        if (!cancelled) {
          setOrphanSummary(summary);
        }
      } catch {
        if (!cancelled) {
          setOrphanSummary(null);
        }
      }
    };

    const intervalId = window.setInterval(refreshOrphanSummary, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!selectedDeploymentId) {
      setSelectedDetail(null);
      setSelectedSeries([]);
      setPanelError(null);
      setPanelLoading(false);
      return;
    }

    let cancelled = false;

    const loadDeploymentData = async () => {
      setPanelLoading(true);
      setPanelError(null);

      try {
        const [detail, series] = await Promise.all([
          fetchDeploymentDetail(selectedDeploymentId),
          fetchDeploymentTelemetry(selectedDeploymentId, 24),
        ]);

        if (cancelled) return;

        setSelectedDetail(detail);
        setSelectedSeries(series);
      } catch (error) {
        if (cancelled) return;

        setSelectedDetail(null);
        setSelectedSeries([]);
        setPanelError(
          error instanceof Error
            ? error.message
            : 'No fue posible consultar la telemetria del nodo desde la API.'
        );
      } finally {
        if (!cancelled) {
          setPanelLoading(false);
        }
      }
    };

    loadDeploymentData();

    return () => {
      cancelled = true;
    };
  }, [selectedDeploymentId]);

  return (
    <main className="app-shell">
      <section className="globe-stage" aria-label="Visualizacion del globo">
        <Globe
          nodes={nodes}
          selectedDeploymentId={selectedDeploymentId}
          onNodeSelect={setSelectedDeploymentId}
        />

        {isOverlayVisible ? (
          <InfoOverlay
            title="Frontera Data Labs"
            description="Bienvenido al sistema de telemetria mundial."
            onClose={() => setIsOverlayVisible(false)}
          />
        ) : null}

        {orphanSummary && orphanSummary.orphanTelemetryCount > 0 ? (
          <div className="orphan-status-overlay" aria-live="polite">
            <div className="orphan-status-card">
              <strong>Telemetria pendiente de reconciliar</strong>
              <p>
                Se recibieron datos de {orphanSummary.orphanTelemetryCount}{' '}
                deployment
                {orphanSummary.orphanTelemetryCount === 1 ? '' : 's'} sin registro
                valido en backend.
              </p>
              {orphanSummary.orphanDeploymentIds.length > 0 ? (
                <p>
                  IDs recientes: {orphanSummary.orphanDeploymentIds.join(', ')}.
                  El nodo deberia resincronizar su deployment.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {selectedDeploymentId ? (
          <MeasurementNodePanel
            node={selectedNode}
            detail={selectedDetail}
            series={selectedSeries}
            isLoading={panelLoading}
            error={panelError}
            onClose={() => setSelectedDeploymentId(null)}
          />
        ) : null}

        {nodesLoading || nodesError ? (
          <div className="questdb-status-overlay" aria-live="polite">
            <div
              className={`questdb-status-card ${
                nodesError ? 'questdb-status-card-error' : ''
              }`}
            >
              <strong>API de telemetria</strong>
              <p>
                {nodesLoading
                  ? 'Sincronizando deployments para poblar el globo...'
                  : nodesError}
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default App;
