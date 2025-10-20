# K8sIntellect

Web dashboard for OpenShift/Kubernetes cluster analysis powered by k8sgpt.

Built with **PatternFly** (https://www.patternfly.org/) - An enterprise-ready UI framework for Kubernetes applications.

## Features

- **Interactive Web Dashboard**: Modern browser-based interface to visualize and explore cluster issues
- **Real-time Analysis**: Instant cluster health insights powered by k8sgpt
- **Anonymous Mode**: Enabled by default - NO data sent to external AI services
- **Multi-Namespace Support**: Analyze single namespaces or entire clusters
- **Resource Filtering**: Focus on specific resource types (Pods, Services, Deployments, etc.)
- **PatternFly UI**: Professional enterprise design with responsive layout
- **Issue Severity Tracking**: Critical, Warning, and Info level categorization
- **OpenShift-Optimized**: Tested with OpenShift clusters

## Quick Start

```bash
# Clone repository
git clone https://github.com/schwesig/k8sintellect.git
cd k8sintellect

# Install dependencies
npm install

# Build application
npm run build

# Start web dashboard
npm run start -- serve
```

Open your browser at: **http://localhost:3000**

## Prerequisites

- Node.js 20+
- npm or yarn
- Access to a Kubernetes/OpenShift cluster (kubeconfig configured)
- k8sgpt CLI installed ([installation guide](https://github.com/k8sgpt-ai/k8sgpt))

## Web Dashboard

### Starting the Dashboard

```bash
# Default (localhost:3000)
npm run start -- serve

# Custom port/host
npm run start -- serve --port 8080 --host 0.0.0.0

# Development mode with auto-reload
npm run dev:server
```

### Dashboard Features

**Analysis Controls:**
- Namespace selector with auto-completion
- All-namespaces option for cluster-wide analysis
- Resource type filters (Pod, Service, Deployment, StatefulSet, etc.)
- One-click "Select All" / "Deselect All" filters

**Results Display:**
- Summary cards showing total issues by severity
- Detailed issue cards with:
  - Resource kind and name
  - Namespace information
  - Problem description
  - Recommended solution
  - Color-coded severity indicators

**Status Indicators:**
- Anonymous mode badge (security confirmation)
- Real-time analysis progress
- Connection status

## CLI Tool (Optional)

The CLI is also available for automation and scripting:

```bash
# Analyze cluster
npm run start -- analyze --all-namespaces

# Specific namespace
npm run start -- analyze --namespace my-namespace

# Filter resource types
npm run start -- analyze --filter Pod,Service,Deployment

# JSON output for scripting
npm run start -- analyze --output json
```

## Detected Issues

K8sIntellect analyzes the following resource types via k8sgpt:

- **Pods**: CrashLoopBackOff, Error states, failed containers, restart loops
- **Deployments**: Unavailable replicas, rollout issues
- **Services**: Missing endpoints, connectivity issues, LoadBalancer problems
- **StatefulSets**: Volume mounting issues, pod failures
- **Jobs**: Failed job executions, timeout issues
- **Ingress**: Configuration problems, missing backends
- **HorizontalPodAutoscaler**: Scaling issues, metric problems
- **NetworkPolicy**: Security policy warnings
- **And more**: See [k8sgpt documentation](https://github.com/k8sgpt-ai/k8sgpt) for full analyzer list

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

### Available Settings

```bash
# Server Configuration
SERVER_PORT=3000
SERVER_HOST=localhost

# Logging
LOG_LEVEL=info

# K8sGPT (Anonymous mode is default)
K8SGPT_ANONYMOUS_MODE=true
```

### Anonymous Mode (Default & Recommended)

**K8sIntellect runs in ANONYMOUS MODE by default:**
- All analysis runs locally via k8sgpt
- NO cluster data sent to external AI services
- Works in air-gapped environments
- No API keys required

This is the **recommended** and **secure** configuration for production clusters.

See [SECURITY.md](SECURITY.md) for details.

## Development

```bash
# Web server with auto-reload
npm run dev:server

# CLI with auto-reload
npm run dev

# TypeScript compilation (watch mode)
npm run build:watch

# Run tests
npm test
npm run test:watch

# Code quality
npm run lint
npm run lint:fix
npm run format
```

## Project Structure

```
k8sintellect/
├── public/               # Web dashboard UI (main focus)
│   └── index.html        # Single-page application
├── src/
│   ├── server/           # Express API server
│   │   └── index.ts      # REST API endpoints
│   ├── lib/              # Core analysis logic
│   │   ├── analyzer.ts   # K8s cluster analyzer
│   │   └── k8sgpt-adapter.ts  # k8sgpt CLI integration
│   ├── cli/              # CLI interface (optional)
│   │   ├── analyze.ts    # Analysis command
│   │   └── serve.ts      # Server command
│   └── types/            # TypeScript definitions
└── dist/                 # Compiled output
```

## API Endpoints

The web dashboard communicates with these REST endpoints:

- `GET /api/analyze` - Run cluster analysis
  - Query params: `namespace`, `allNamespaces`, `filters`
  - Returns: JSON with issues and summary

- `GET /api/filters` - Get available resource filters
  - Returns: List of supported analyzers

- `GET /api/namespaces` - Get cluster namespaces
  - Returns: List of available namespaces

- `GET /api/status` - Get application status
  - Returns: Anonymous mode status

## K8sGPT Integration

K8sIntellect leverages k8sgpt's powerful analysis capabilities:

- Direct CLI integration for maximum compatibility
- JSON output parsing for web dashboard display
- Automatic issue deduplication
- Proven analyzer ecosystem from k8sgpt community
- Optional AI explanations (when k8sgpt backend configured)

## License

Apache-2.0

## Contributing

Contributions are welcome! Please create an issue or pull request.

Focus areas for contributions:
- Web UI enhancements
- Additional dashboard features
- PatternFly component integration
- Visualization improvements

## Acknowledgments

- Powered by [k8sgpt](https://github.com/k8sgpt-ai/k8sgpt)
- UI built with [PatternFly](https://www.patternfly.org/)
- Tested with OpenShift
