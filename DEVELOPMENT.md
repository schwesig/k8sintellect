# DEVELOPMENT.md

This file provides guidance for developers and AI coding assistants when working with code in this repository.

## Project Overview

K8sIntellect is a **web dashboard** for OpenShift/Kubernetes cluster analysis, powered by k8sgpt. Built with TypeScript/Node.js and PatternFly, it provides an interactive interface for cluster health monitoring. A CLI tool is also available for scripting and automation.

**PRIMARY FOCUS**: Web dashboard UI and user experience
**SECONDARY**: CLI tool for automation

**SECURITY: Always runs in ANONYMOUS MODE by default** - no cluster data is sent to external AI services.

## Architecture

### Core Components (in order of importance)

1. **Web Dashboard (`public/index.html`)**: Single-page application built with PatternFly
   - Interactive UI for cluster analysis
   - Real-time issue visualization
   - Namespace and filter selection
   - Results display with severity categorization

2. **Web Server (`src/server/`)**: Express-based API server that:
   - Serves the web dashboard (`public/index.html`)
   - Provides `/api/analyze` endpoint for cluster analysis
   - Returns JSON results consumed by the frontend

3. **Analyzer (`src/lib/analyzer.ts`)**: Core analysis engine
   - Integrates with k8sgpt CLI
   - Parses k8sgpt JSON output
   - Returns structured `AnalysisResult` with issues categorized by severity

4. **k8sgpt Adapter (`src/lib/k8sgpt-adapter.ts`)**: k8sgpt CLI integration
   - Executes k8sgpt analyze commands
   - Converts k8sgpt output to internal format
   - Handles anonymous mode configuration

5. **CLI (`src/cli/`)**: Optional command-line interface
   - `serve`: Starts the web dashboard server
   - `analyze`: Runs analysis and outputs to console (for scripting)

### Data Flow

```
Web Browser → Express Server → k8sgpt CLI → Kubernetes API
     ↓             ↓                ↓
  Display ← JSON Response ← Parsed Results
```

## Development Commands

### Primary: Web Dashboard Development

```bash
# Start web dashboard with auto-reload (RECOMMENDED)
npm run dev:server

# Production build and serve
npm run build
npm run start -- serve

# Custom port/host
npm run start -- serve --port 8080 --host 0.0.0.0
```

### Secondary: CLI Development

```bash
# CLI with auto-reload
npm run dev

# Run CLI analysis
npm run start -- analyze --all-namespaces
```

### Testing and Quality

```bash
npm test                 # Run Jest tests
npm run test:watch       # Tests in watch mode
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier formatting
npm run type-check       # TypeScript type checking without emit
```

### Adding a Single Test

```bash
npm test -- path/to/test.test.ts
```

## Key Development Patterns

### Adding New Analyzers

To add analysis for a new resource type (e.g., Services):

1. Add analyzer method to `K8sAnalyzer` class in `src/lib/analyzer.ts`:
   ```typescript
   private async analyzeServices(options: AnalyzeOptions): Promise<Issue[]> {
     // Implementation
   }
   ```

2. Call it from the main `analyze()` method:
   ```typescript
   const serviceIssues = await this.analyzeServices(options);
   issues.push(...serviceIssues);
   ```

3. Follow the existing pattern: check resource state, create `Issue` objects with appropriate severity

### Adding New CLI Commands

1. Create command file in `src/cli/` (e.g., `src/cli/export.ts`)
2. Register in `src/cli.ts`:
   ```typescript
   program
     .command('export')
     .description('Export analysis results')
     .action(export);
   ```

### API Endpoints

Add new endpoints in `src/server/index.ts`. All API routes should be prefixed with `/api/`.

## TypeScript Configuration

- **Target**: ES2022
- **Module**: CommonJS
- **Strict mode**: Enabled
- **Output**: `dist/` directory

## Dependencies

### Core
- `@kubernetes/client-node`: Kubernetes API client
- `commander`: CLI framework
- `express`: Web server
- `winston`: Logging

### Development
- `typescript`: Type checking and compilation
- `tsx`: TypeScript execution with hot-reload
- `jest` + `ts-jest`: Testing framework
- `eslint` + `prettier`: Code quality

## Environment Configuration

Create `.env` file from `.env.example`:
- `LOG_LEVEL`: Winston log level (debug, info, warn, error)
- `SERVER_PORT`: Web dashboard port (default: 3000)
- `SERVER_HOST`: Web dashboard host (default: localhost)

## Kubernetes Access

The tool uses the default kubeconfig from `~/.kube/config`. Override with `KUBECONFIG` environment variable if needed.

## Future k8sgpt Integration

The project is structured to accommodate k8sgpt integration:

1. **Current**: Basic rule-based analysis in `K8sAnalyzer`
2. **Planned**:
   - Call k8sgpt CLI as subprocess
   - Direct library integration with k8sgpt-go
   - AI-powered issue enhancement via LLM APIs

Integration points are in `src/lib/k8sgpt-adapter.ts`.

## Code Style

- Use TypeScript strict mode
- Prefer `async/await` over promises
- Export types from `src/types/` for reusability
- Use Winston logger instead of `console.log`
- Follow existing patterns for error handling and logging
