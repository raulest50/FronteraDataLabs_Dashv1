export type DeploymentNode = {
  deploymentId: string;
  boardId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  timestamp: string;
  sensorType?: string | null;
};

export type DeploymentDetail = DeploymentNode & {
  latestCo2: number | null;
  latestTemp: number | null;
  latestRh: number | null;
  latestErrors: number | null;
  variables: string[];
};

export type TelemetryPoint = {
  timestamp: string;
  co2: number | null;
  temp: number | null;
  rh: number | null;
};

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      'VITE_API_BASE_URL no esta configurado. El dashboard necesita la nueva API Python.'
    );
  }

  return configuredUrl.replace(/\/$/, '');
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let message = `La API respondio con estado ${response.status}.`;

    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // Keep default message when response is not JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function fetchDeployments() {
  return apiGet<DeploymentNode[]>('/api/deployments');
}

export async function fetchDeploymentDetail(deploymentId: string) {
  return apiGet<DeploymentDetail>(
    `/api/deployments/${encodeURIComponent(deploymentId)}`
  );
}

export async function fetchDeploymentTelemetry(
  deploymentId: string,
  windowHours = 24
) {
  const safeWindow = Math.min(Math.max(windowHours, 1), 168);

  return apiGet<TelemetryPoint[]>(
    `/api/deployments/${encodeURIComponent(deploymentId)}/telemetry?hours=${safeWindow}`
  );
}
