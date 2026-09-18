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
