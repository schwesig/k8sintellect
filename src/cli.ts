#!/usr/bin/env node

import { Command } from 'commander';
import { analyze } from './cli/analyze';
import { serve } from './cli/serve';
import { version } from '../package.json';

const program = new Command();

program
  .name('k8sintellect')
  .description('OpenShift/Kubernetes analysis tool powered by k8sgpt')
  .version(version);

program
  .command('analyze')
  .description('Analyze OpenShift/Kubernetes cluster for issues')
  .option('-n, --namespace <namespace>', 'Analyze specific namespace')
  .option('-o, --output <format>', 'Output format (json|yaml|text)', 'text')
  .option('--all-namespaces', 'Analyze all namespaces', false)
  .option('-f, --filter <filters>', 'Comma-separated list of filters (e.g., Pod,Service,Deployment)')
  .action(analyze);

program
  .command('serve')
  .description('Start web dashboard server')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', 'localhost')
  .action(serve);

program.parse();
