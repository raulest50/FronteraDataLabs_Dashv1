import type { TelemetryPoint } from '../data/questdb';

type MiniTrendChartProps = {
  label: string;
  unit: string;
  color: string;
  data: TelemetryPoint[];
  accessor: (point: TelemetryPoint) => number | null;
};

const CHART_WIDTH = 260;
const CHART_HEIGHT = 92;
const CHART_PADDING = 10;

function formatMetric(value: number | null, unit: string) {
  if (value === null) return '--';
  const decimals = unit === 'ppm' ? 0 : 1;
  return `${value.toFixed(decimals)} ${unit}`;
}

function formatTickLabel(timestamp: string) {
  if (!timestamp) return '--:--';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '--:--';

  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function MiniTrendChart({
  label,
  unit,
  color,
  data,
  accessor,
}: MiniTrendChartProps) {
  const validPoints = data
    .map((point) => ({
      ...point,
      value: accessor(point),
    }))
    .filter((point) => point.value !== null);

  const latestValue =
    validPoints.length > 0 ? validPoints[validPoints.length - 1].value : null;

  if (validPoints.length < 2) {
    return (
      <section className="mini-trend-chart">
        <header className="mini-trend-chart-header">
          <div>
            <p className="mini-trend-chart-label">{label}</p>
            <strong className="mini-trend-chart-value">
              {formatMetric(latestValue, unit)}
            </strong>
          </div>
          <span className="mini-trend-chart-dot" style={{ backgroundColor: color }} />
        </header>

        <div className="mini-trend-chart-empty">
          Sin datos suficientes para graficar las ultimas 24 horas.
        </div>
      </section>
    );
  }

  const values = validPoints.map((point) => point.value as number);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const pathData = validPoints
    .map((point, index) => {
      const x = CHART_PADDING + (index / (validPoints.length - 1)) * innerWidth;
      const y =
        CHART_PADDING +
        innerHeight -
        (((point.value as number) - minValue) / valueRange) * innerHeight;

      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const startTimestamp = validPoints[0].timestamp;
  const endTimestamp = validPoints[validPoints.length - 1].timestamp;

  return (
    <section className="mini-trend-chart">
      <header className="mini-trend-chart-header">
        <div>
          <p className="mini-trend-chart-label">{label}</p>
          <strong className="mini-trend-chart-value">
            {formatMetric(latestValue, unit)}
          </strong>
        </div>
        <span className="mini-trend-chart-dot" style={{ backgroundColor: color }} />
      </header>

      <svg
        className="mini-trend-chart-svg"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        aria-label={`Tendencia de ${label}`}
      >
        <line
          x1={CHART_PADDING}
          y1={CHART_HEIGHT - CHART_PADDING}
          x2={CHART_WIDTH - CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          className="mini-trend-chart-axis"
        />
        <line
          x1={CHART_PADDING}
          y1={CHART_PADDING}
          x2={CHART_PADDING}
          y2={CHART_HEIGHT - CHART_PADDING}
          className="mini-trend-chart-axis"
        />
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <footer className="mini-trend-chart-footer">
        <span>{formatTickLabel(startTimestamp)}</span>
        <span>{formatTickLabel(endTimestamp)}</span>
      </footer>
    </section>
  );
}
