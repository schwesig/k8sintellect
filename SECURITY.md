# Security and Privacy

## Anonymous Mode (Default)

**K8sIntellect runs in ANONYMOUS MODE by default.**

This means:
- All analysis runs locally using only Kubernetes API data
- NO cluster data is sent to external AI services
- NO API keys or external providers are required
- Complete data privacy - your cluster data stays in your environment

## Data Processing

### Anonymous Mode (Default)
- Connects directly to your Kubernetes cluster via kubeconfig
- Analyzes pods, deployments, and resources locally
- Uses rule-based pattern matching for issue detection
- All recommendations are generated locally

### External AI Mode (Optional, Not Recommended)
If you explicitly disable anonymous mode:
- Cluster issue descriptions MAY be sent to external AI providers
- Requires API keys for services like OpenAI, Azure, etc.
- WARNING: This will transmit cluster metadata to third parties

## Configuration

Anonymous mode is controlled via environment variable:

```bash
# Default: Anonymous mode enabled
K8SGPT_ANONYMOUS_MODE=true

# To use external AI (not recommended for production clusters):
K8SGPT_ANONYMOUS_MODE=false
K8SGPT_AI_PROVIDER=openai
K8SGPT_API_KEY=your-api-key
```

## Kubernetes Permissions

The tool requires read-only access to your cluster:
- List/Get pods
- List/Get deployments
- List/Get services
- Read events

Use a service account with minimal read-only RBAC permissions.

## Best Practices

1. **Keep Anonymous Mode Enabled** - No reason to disable it for most use cases
2. **Use Read-Only Service Accounts** - Don't grant write permissions
3. **Audit Logs** - Review cluster audit logs to verify no unexpected API calls
4. **Network Policies** - No outbound internet access required in anonymous mode
5. **Air-Gapped Environments** - Works perfectly in isolated/air-gapped clusters

## Reporting Security Issues

If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Report privately via GitHub Security Advisories: https://github.com/schwesig/k8sintellect/security/advisories/new
3. Or open a private issue with details

We will respond as quickly as possible to address the issue.
