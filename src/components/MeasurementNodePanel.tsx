import './MeasurementNodePanel.css';
import type {
  DeploymentDetail,
  DeploymentNode,
  TelemetryPoint,
} from '../data/questdb';
import MiniTrendChart from './MiniTrendChart';

type MeasurementNodePanelProps = {
  node: DeploymentNode | null;
  detail: DeploymentDetail | null;
  series: TelemetryPoint[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatCoordinate(value: number | null | undefined) {
  if (typeof value !== 'number') return '--';
  return value.toFixed(5);
}

function formatReading(value: number | null, unit: string) {
  if (value === null) return '--';
  const decimals = unit === 'ppm' ? 0 : 1;
  return `${value.toFixed(decimals)} ${unit}`;
}

export default function MeasurementNodePanel({
  node,
  detail,
  series,
  isLoading,
  error,
  onClose,
}: MeasurementNodePanelProps) {
  const metadata = detail ?? node;

  if (!metadata) return null;

  return (
    <div className="measurement-panel-layer">
      <aside className="measurement-panel-card" aria-label="Detalle del nodo de medicion">
        <button
          type="button"
          className="measurement-panel-close"
          onClick={onClose}
          aria-label="Cerrar detalle del nodo"
        >
          Cerrar
        </button>

        <div className="measurement-panel-grid">
          <section className="measurement-panel-meta">
            <p className="measurement-panel-eyebrow">Nodo de medicion</p>
            <h2 className="measurement-panel-title">
              {metadata.locationName || 'Ubicacion sin nombre'}
            </h2>
            <p className="measurement-panel-subtitle">
              {detail?.sensorType ? `Sensor ${detail.sensorType}` : 'Sensor ambiental'}
            </p>

            <div className="measurement-panel-stats">
              <article className="measurement-stat-card">
                <span>CO2</span>
                <strong>{formatReading(detail?.latestCo2 ?? null, 'ppm')}</strong>
              </article>
              <article className="measurement-stat-card">
                <span>Temperatura</span>
                <strong>{formatReading(detail?.latestTemp ?? null, '°C')}</strong>
              </article>
              <article className="measurement-stat-card">
                <span>Humedad</span>
                <strong>{formatReading(detail?.latestRh ?? null, '%')}</strong>
              </article>
            </div>

            <dl className="measurement-panel-definition-list">
              <div>
                <dt>Deployment ID</dt>
                <dd>{metadata.deploymentId}</dd>
              </div>
              <div>
                <dt>Board ID</dt>
                <dd>{metadata.boardId}</dd>
              </div>
              <div>
                <dt>Latitud</dt>
                <dd>{formatCoordinate(metadata.latitude)}</dd>
              </div>
              <div>
                <dt>Longitud</dt>
                <dd>{formatCoordinate(metadata.longitude)}</dd>
              </div>
              <div>
                <dt>Variables sensadas</dt>
                <dd>
                  <div className="measurement-panel-tags">
                    {(detail?.variables ?? ['CO2', 'Temperatura', 'Humedad relativa']).map(
                      (variable) => (
                        <span key={variable} className="measurement-panel-tag">
                          {variable}
                        </span>
                      )
                    )}
                  </div>
                </dd>
              </div>
              <div>
                <dt>Errores del sensor</dt>
                <dd>{detail?.latestErrors ?? '--'}</dd>
              </div>
            </dl>
          </section>

          <section className="measurement-panel-charts">
            <header className="measurement-panel-charts-header">
              <div>
                <p className="measurement-panel-eyebrow">Historico reciente</p>
                <h3>Ultimas 24 horas</h3>
              </div>
            </header>

            {isLoading ? (
              <div className="measurement-panel-feedback">
                Consultando telemetria del deployment seleccionado...
              </div>
            ) : null}

            {!isLoading && error ? (
              <div className="measurement-panel-feedback measurement-panel-feedback-error">
                {error}
              </div>
            ) : null}

            {!isLoading && !error ? (
              <div className="measurement-panel-chart-list">
                <MiniTrendChart
                  label="CO2"
                  unit="ppm"
                  color="#6fe4ff"
                  data={series}
                  accessor={(point) => point.co2}
                />
                <MiniTrendChart
                  label="Temperatura"
                  unit="°C"
                  color="#ff9b71"
                  data={series}
                  accessor={(point) => point.temp}
                />
                <MiniTrendChart
                  label="Humedad relativa"
                  unit="%"
                  color="#8dffb4"
                  data={series}
                  accessor={(point) => point.rh}
                />
              </div>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
