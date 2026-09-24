export type ServiceType = 'frontend' | 'backend' | 'custom';

export interface ServiceConfig {
  name: string;
  path: string;
  type: ServiceType;
  domain: string;
  command: string;
  portEnvVar?: string;
  port?: number;
  customEnv?: Record<string, string>;
}

export interface HostmagicConfig {
  $schema?: string;
  name: string;
  tld?: string;
  autostart?: boolean;
  services: ServiceConfig[];
}

export interface DetectedService {
  name: string;
  relativePath: string;
  type: ServiceType;
  framework?: string;
  detectedCommand: string;
  suggestedDomain: string;
}

export interface ServiceRuntimeInfo {
  service: ServiceConfig;
  port: number;
  url: string;
  env: Record<string, string>;
}

export interface RegisteredProject {
  name: string;
  path: string;
  tld?: string;
  services: ServiceConfig[];
  icon?: string;
  color?: string;
  autostart?: boolean;
  lastRun?: number;
  createdAt?: number;
}

export interface DashboardProjectInfo {
  name: string;
  path: string;
  tld?: string;
  icon?: string;
  color?: string;
  autostart?: boolean;
  status: 'running' | 'stopped';
  services: Array<ServiceConfig & { url: string; livePort?: number }>;
  routes: Array<{
    domain: string;
    targetPort: number;
    serviceName?: string;
    type?: string;
  }>;
  startedByGateway?: boolean;
}

