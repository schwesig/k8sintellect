export interface ClusterInfo {
  name: string;
  version: string;
  apiServer: string;
}

export interface AnalysisConfig {
  namespace?: string;
  allNamespaces?: boolean;
  analyzers?: string[];
  filters?: string[];
}
