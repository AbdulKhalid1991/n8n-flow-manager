import { Command } from 'commander';
import chalk from 'chalk';
import { FlowManager } from '../core/flowManager.js';
import { FlowTester } from '../testing/flowTester.js';
import { FlowEnhancer } from '../enhancement/flowEnhancer.js';
import { N8nClient } from '../api/n8nClient.js';
import { EnhancementAgent } from '../agents/enhancementAgent.js';
import { ImprovementExecutor } from '../agents/improvementExecutor.js';
import { UpgradePathPlanner } from '../agents/upgradePathPlanner.js';
import { environmentValidator } from '../config/environmentValidator.js';

const program = new Command();

program
  .name('n8n-flow-manager')
  .description('Comprehensive n8n flow management system')
  .version('1.0.0');

// Environment validation and setup
program
  .command('validate')
  .description('Validate environment configuration and setup')
  .option('--fix', 'Automatically fix common issues')
  .option('--quiet', 'Suppress detailed output')
  .action(async (options) => {
    try {
      if (options.fix) {
        console.log(chalk.blue('🔧 Auto-fixing common configuration issues...'));
        const fixResult = await environmentValidator.autoFix();
        
        if (fixResult.success) {
          console.log(chalk.green('✅ Applied automatic fixes:'));
          fixResult.fixes.forEach(fix => console.log(chalk.green(`  • ${fix}`)));
        } else {
          console.log(chalk.yellow('⚠️ No automatic fixes applied'));
        }
        console.log('');
      }
      
      const report = await environmentValidator.validateEnvironment();
      
      if (!options.quiet) {
        environmentValidator.printValidationReport(report);
      } else {
        if (report.success) {
          console.log(chalk.green('✅ Environment validation passed'));
        } else {
          console.log(chalk.red(`❌ Validation failed: ${report.errors.length} errors`));
        }
      }
      
      // Exit with appropriate code
      process.exit(report.success ? 0 : 1);
      
    } catch (error) {
      console.error(chalk.red('Error during validation:'), error.message);
      process.exit(1);
    }
  });

// Quick setup command
program
  .command('setup')
  .description('Interactive setup wizard for first-time configuration')
  .action(async () => {
    console.log(chalk.blue('🚀 Welcome to n8n Flow Manager Setup!'));
    console.log(chalk.gray('This wizard will help you configure the system for first use.\n'));
    
    try {
      // Auto-fix common issues first
      console.log(chalk.blue('Step 1: Auto-fixing common issues...'));
      const fixResult = await environmentValidator.autoFix();
      
      if (fixResult.fixes.length > 0) {
        console.log(chalk.green('✅ Applied fixes:'));
        fixResult.fixes.forEach(fix => console.log(chalk.green(`  • ${fix}`)));
      }
      
      // Validate environment
      console.log(chalk.blue('\nStep 2: Validating configuration...'));
      const report = await environmentValidator.validateEnvironment();
      
      if (report.success) {
        console.log(chalk.green('🎉 Setup completed successfully!'));
        console.log(chalk.cyan('\n📋 Next steps:'));
        console.log('  • npm start health     - Check system health');
        console.log('  • npm start list       - List workflows');
        console.log('  • npm start analyze    - Analyze system');
        console.log('  • npm start help       - Show all commands');
      } else {
        console.log(chalk.red('\n❌ Setup incomplete. Please fix the following issues:'));
        
        // Show only critical errors in setup
        const criticalErrors = report.errors.filter(e => 
          ['missing_env_file', 'missing_required_variable', 'n8n_connection_failed'].includes(e.type)
        );
        
        criticalErrors.forEach((error, index) => {
          console.log(chalk.red(`\n${index + 1}. ${error.message}`));
          console.log(chalk.yellow(`   Solution: ${error.solution}`));
          if (error.command) {
            console.log(chalk.cyan(`   Command: ${error.command}`));
          }
        });
        
        console.log(chalk.blue('\n🔧 After fixing issues, run:'));
        console.log(chalk.cyan('  npm start validate'));
      }
      
    } catch (error) {
      console.error(chalk.red('Setup failed:'), error.message);
      console.log(chalk.yellow('\n💡 Manual setup steps:'));
      console.log('  1. Copy .env.example to .env');
      console.log('  2. Edit .env with your n8n settings');
      console.log('  3. Run: npm start validate');
    }
  });

// Connection test command
program
  .command('test-connection')
  .description('Test connection to n8n instance')
  .action(async () => {
    try {
      console.log(chalk.blue('Testing connection to n8n...'));
      
      // First validate basic configuration
      const report = await environmentValidator.validateEnvironment();
      
      if (!report.success) {
        console.log(chalk.red('❌ Environment validation failed'));
        console.log(chalk.yellow('Run "npm start setup" to fix configuration issues'));
        return;
      }
      
      const client = new N8nClient();
      const result = await client.testConnection();
      
      if (result.success) {
        console.log(chalk.green('✓ Connection successful'));
        console.log(chalk.gray(result.message));
        
        // Show basic info about n8n instance
        try {
          const workflows = await client.getAllWorkflows();
          console.log(chalk.cyan(`📊 Found ${workflows.length} workflows in n8n instance`));
        } catch (error) {
          console.log(chalk.yellow('⚠️ Could not fetch workflow count'));
        }
      } else {
        console.log(chalk.red('✗ Connection failed'));
        console.log(chalk.red(result.message));
        if (result.error) {
          console.log(chalk.gray(JSON.stringify(result.error, null, 2)));
        }
        console.log(chalk.yellow('\n💡 Troubleshooting:'));
        console.log('  1. Verify n8n is running and accessible');
        console.log('  2. Check N8N_BASE_URL in .env file');
        console.log('  3. Verify N8N_API_KEY is correct');
        console.log('  4. Run: npm start validate');
      }
    } catch (error) {
      console.error(chalk.red('Error testing connection:'), error.message);
    }
  });

// Export commands
program
  .command('export')
  .description('Export workflows from n8n')
  .option('-w, --workflow <id>', 'Export specific workflow by ID')
  .option('-a, --all', 'Export all workflows')
  .option('--no-commit', 'Skip automatic git commit')
  .action(async (options) => {
    try {
      const flowManager = new FlowManager();
      await flowManager.initialize();
      
      if (options.workflow) {
        console.log(chalk.blue(`Exporting workflow ${options.workflow}...`));
        const result = await flowManager.exportWorkflow(options.workflow, { autoCommit: options.commit });
        
        if (result.success) {
          console.log(chalk.green('✓ Export successful'));
          console.log(chalk.gray(`Saved to: ${result.filePath}`));
        } else {
          console.log(chalk.red('✗ Export failed'));
          console.log(chalk.red(result.message));
        }
      } else if (options.all) {
        console.log(chalk.blue('Exporting all workflows...'));
        const result = await flowManager.exportAllWorkflows({ autoCommit: options.commit });
        
        if (result.success) {
          console.log(chalk.green(`✓ Exported ${result.results.filter(r => r.success).length} workflows`));
          const failed = result.results.filter(r => !r.success);
          if (failed.length > 0) {
            console.log(chalk.yellow(`⚠ Failed to export ${failed.length} workflows`));
          }
        } else {
          console.log(chalk.red('✗ Export failed'));
          console.log(chalk.red(result.message));
        }
      } else {
        console.log(chalk.yellow('Please specify --workflow <id> or --all'));
      }
    } catch (error) {
      console.error(chalk.red('Error during export:'), error.message);
    }
  });

// Import commands
program
  .command('import')
  .description('Import workflows to n8n')
  .argument('<file>', 'Workflow file to import')
  .option('-u, --update', 'Update existing workflow if it exists')
  .option('-b, --backup', 'Backup existing workflow before updating')
  .action(async (file, options) => {
    try {
      const flowManager = new FlowManager();
      console.log(chalk.blue(`Importing workflow from ${file}...`));
      
      const result = await flowManager.importWorkflow(file, options);
      
      if (result.success) {
        console.log(chalk.green('✓ Import successful'));
        console.log(chalk.gray(`Workflow: ${result.workflow.name}`));
        console.log(chalk.gray(`ID: ${result.workflow.id}`));
      } else {
        console.log(chalk.red('✗ Import failed'));
        console.log(chalk.red(result.message));
      }
    } catch (error) {
      console.error(chalk.red('Error during import:'), error.message);
    }
  });

// Test commands
program
  .command('test')
  .description('Test workflows')
  .option('-w, --workflow <id>', 'Test specific workflow')
  .option('-f, --file <path>', 'Test configuration file')
  .option('-a, --all', 'Test all workflows')
  .action(async (options) => {
    try {
      const flowTester = new FlowTester();
      
      if (options.workflow) {
        console.log(chalk.blue(`Testing workflow ${options.workflow}...`));
        const result = await flowTester.testWorkflow(options.workflow);
        
        console.log(result.success ? chalk.green('✓ Test passed') : chalk.red('✗ Test failed'));
        console.log(chalk.gray(`Duration: ${result.duration}ms`));
        
        if (result.errors.length > 0) {
          console.log(chalk.red('Errors:'));
          result.errors.forEach(error => {
            console.log(chalk.red(`  - ${error.message}`));
          });
        }
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('Warnings:'));
          result.warnings.forEach(warning => {
            console.log(chalk.yellow(`  - ${warning.message}`));
          });
        }
      } else {
        console.log(chalk.yellow('Please specify --workflow <id>, --file <path>, or --all'));
      }
    } catch (error) {
      console.error(chalk.red('Error during testing:'), error.message);
    }
  });

// Enhancement commands
program
  .command('enhance')
  .description('Analyze and enhance workflows')
  .option('-w, --workflow <id>', 'Analyze specific workflow')
  .option('-f, --file <path>', 'Analyze workflow from file')
  .option('--fix', 'Apply automatic fixes')
  .action(async (options) => {
    try {
      const flowEnhancer = new FlowEnhancer();
      let workflow;
      
      if (options.workflow) {
        console.log(chalk.blue(`Analyzing workflow ${options.workflow}...`));
        const client = new N8nClient();
        workflow = await client.getWorkflow(options.workflow);
      } else if (options.file) {
        console.log(chalk.blue(`Analyzing workflow from ${options.file}...`));
        const fs = await import('fs/promises');
        const fileContent = await fs.readFile(options.file, 'utf8');
        workflow = JSON.parse(fileContent);
      } else {
        console.log(chalk.yellow('Please specify --workflow <id> or --file <path>'));
        return;
      }
      
      const analysis = flowEnhancer.analyzeWorkflow(workflow);
      
      console.log(chalk.green('\n📊 Analysis Results'));
      console.log(chalk.gray(`Workflow: ${analysis.workflowName}`));
      console.log(chalk.gray(`Nodes: ${analysis.nodeCount}, Connections: ${analysis.connectionCount}`));
      
      if (analysis.issues.length > 0) {
        console.log(chalk.red('\n🚨 Issues Found:'));
        analysis.issues.forEach(issue => {
          console.log(chalk.red(`  ${issue.severity.toUpperCase()}: ${issue.message}`));
        });
      }
      
      if (analysis.suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Suggestions:'));
        analysis.suggestions.forEach(suggestion => {
          console.log(chalk.yellow(`  - ${suggestion.message}`));
        });
      }
      
      if (analysis.optimizations.length > 0) {
        console.log(chalk.blue('\n⚡ Optimization Opportunities:'));
        analysis.optimizations.forEach(opt => {
          console.log(chalk.blue(`  ${opt.type}: ${opt.description}`));
          console.log(chalk.gray(`    Impact: ${opt.impact}`));
          console.log(chalk.gray(`    Effort: ${opt.effort}`));
        });
      }
      
      if (analysis.securityRecommendations.length > 0) {
        console.log(chalk.magenta('\n🔒 Security Recommendations:'));
        analysis.securityRecommendations.forEach(rec => {
          console.log(chalk.magenta(`  ${rec.severity.toUpperCase()}: ${rec.message}`));
        });
      }
      
    } catch (error) {
      console.error(chalk.red('Error during enhancement:'), error.message);
    }
  });

// List workflows
program
  .command('list')
  .description('List all workflows')
  .option('-a, --active', 'Show only active workflows')
  .option('-i, --inactive', 'Show only inactive workflows')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching workflows...'));
      const client = new N8nClient();
      const workflows = await client.getAllWorkflows();
      
      let filteredWorkflows = workflows;
      if (options.active) {
        filteredWorkflows = workflows.filter(w => w.active);
      } else if (options.inactive) {
        filteredWorkflows = workflows.filter(w => !w.active);
      }
      
      console.log(chalk.green(`\nFound ${filteredWorkflows.length} workflows:`));
      console.log(chalk.gray('ID\t\tName\t\t\t\tStatus\t\tNodes'));
      console.log(chalk.gray('─'.repeat(80)));
      
      filteredWorkflows.forEach(workflow => {
        const status = workflow.active ? chalk.green('Active') : chalk.gray('Inactive');
        const name = workflow.name?.substring(0, 30) || 'Untitled';
        const nodeCount = workflow.nodes?.length || 0;
        
        console.log(`${workflow.id}\t${name.padEnd(30)}\t${status}\t\t${nodeCount}`);
      });
      
    } catch (error) {
      console.error(chalk.red('Error listing workflows:'), error.message);
    }
  });

// Git status
program
  .command('status')
  .description('Show git status of flows')
  .action(async () => {
    try {
      const flowManager = new FlowManager();
      await flowManager.initialize();
      
      const status = await flowManager.gitManager.getStatus();
      
      console.log(chalk.blue('Git Status:'));
      console.log(chalk.gray(`Current branch: ${status.current}`));
      
      if (status.modified.length > 0) {
        console.log(chalk.yellow('\nModified files:'));
        status.modified.forEach(file => console.log(chalk.yellow(`  M ${file}`)));
      }
      
      if (status.created.length > 0) {
        console.log(chalk.green('\nNew files:'));
        status.created.forEach(file => console.log(chalk.green(`  A ${file}`)));
      }
      
      if (status.deleted.length > 0) {
        console.log(chalk.red('\nDeleted files:'));
        status.deleted.forEach(file => console.log(chalk.red(`  D ${file}`)));
      }
      
      if (status.staged.length > 0) {
        console.log(chalk.blue('\nStaged files:'));
        status.staged.forEach(file => console.log(chalk.blue(`  S ${file}`)));
      }
      
      if (status.modified.length === 0 && status.created.length === 0 && 
          status.deleted.length === 0 && status.staged.length === 0) {
        console.log(chalk.green('\nWorking tree clean'));
      }
      
    } catch (error) {
      console.error(chalk.red('Error getting status:'), error.message);
    }
  });

// System Analysis and Enhancement
program
  .command('analyze')
  .description('Analyze entire system for improvements and issues')
  .option('--detailed', 'Show detailed analysis results')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Starting comprehensive system analysis...'));
      const enhancementAgent = new EnhancementAgent();
      
      const analysis = await enhancementAgent.analyzeProject();
      
      if (!analysis.success) {
        console.log(chalk.red('✗ Analysis failed'));
        console.log(chalk.red(analysis.error));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(analysis, null, 2));
        return;
      }

      // Display summary
      const summary = analysis.summary;
      console.log(chalk.green('\n📊 Analysis Summary'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`Total Issues Found: ${chalk.yellow(summary.totalIssues)}`);
      console.log(`Overall Rating: ${this.getRatingColor(summary.overallRating)(summary.overallRating)}`);
      console.log(`Estimated Effort: ${chalk.cyan(summary.estimatedEffort)}`);
      
      console.log(chalk.blue('\n🎯 Issue Breakdown:'));
      if (summary.severityBreakdown.critical > 0) {
        console.log(chalk.red(`  Critical: ${summary.severityBreakdown.critical}`));
      }
      if (summary.severityBreakdown.high > 0) {
        console.log(chalk.redBright(`  High: ${summary.severityBreakdown.high}`));
      }
      if (summary.severityBreakdown.medium > 0) {
        console.log(chalk.yellow(`  Medium: ${summary.severityBreakdown.medium}`));
      }
      if (summary.severityBreakdown.low > 0) {
        console.log(chalk.gray(`  Low: ${summary.severityBreakdown.low}`));
      }

      // Display recommendations
      console.log(chalk.green('\n💡 Top Recommendations:'));
      analysis.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${chalk.cyan(rec.title)} (${rec.priority})`);
        console.log(`   Impact: ${rec.impact} | Effort: ${rec.estimatedEffort}`);
        console.log(`   Tasks: ${rec.items.length} improvements identified`);
      });

      if (options.detailed) {
        console.log(chalk.blue('\n📋 Detailed Analysis:'));
        
        Object.entries(analysis.analysis).forEach(([category, data]) => {
          if (data.issues && data.issues.length > 0) {
            console.log(chalk.yellow(`\n${category.toUpperCase()}:`));
            data.issues.slice(0, 5).forEach(issue => {
              const severityColor = issue.severity === 'critical' ? chalk.red : 
                                    issue.severity === 'high' ? chalk.redBright :
                                    issue.severity === 'medium' ? chalk.yellow : chalk.gray;
              console.log(`  ${severityColor(issue.severity.toUpperCase())}: ${issue.message}`);
            });
            if (data.issues.length > 5) {
              console.log(chalk.gray(`  ... and ${data.issues.length - 5} more issues`));
            }
          }
        });
      }

      console.log(chalk.green('\n✨ Next Steps:'));
      console.log('  • Run "npm start improve --dry-run" to see proposed fixes');
      console.log('  • Run "npm start improve --apply --priority high" to apply critical fixes');
      console.log('  • Run "npm start analyze --detailed" for comprehensive details');

    } catch (error) {
      console.error(chalk.red('Error during analysis:'), error.message);
    }
  });

// System Improvement
program
  .command('improve')
  .description('Apply automated improvements to the system')
  .option('--dry-run', 'Show what would be improved without making changes', true)
  .option('--apply', 'Actually apply the improvements')
  .option('--priority <level>', 'Priority level (immediate, high, medium, low)', 'high')
  .option('--auto', 'Apply all automated improvements without confirmation')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 System Improvement Tool'));
      
      if (options.apply && options.dryRun) {
        options.dryRun = false; // --apply overrides --dry-run
      }

      const improvementExecutor = new ImprovementExecutor();
      
      const result = await improvementExecutor.executeImprovements({
        autoApply: options.auto,
        priority: options.priority,
        dryRun: options.dryRun
      });

      if (!result.success) {
        console.log(chalk.red('✗ Improvement execution failed'));
        console.log(chalk.red(result.error));
        return;
      }

      if (result.dryRun) {
        console.log(chalk.cyan('\n📋 Dry Run Results'));
        console.log(chalk.gray('─'.repeat(50)));
        
        const plan = result.executionPlan;
        console.log(`Total Phases: ${chalk.yellow(plan.totalPhases)}`);
        console.log(`Total Tasks: ${chalk.yellow(plan.totalTasks)}`);
        console.log(`Automated Tasks: ${chalk.green(plan.automatedTasks)}`);
        console.log(`Manual Tasks: ${chalk.red(plan.manualTasks)}`);
        
        console.log(chalk.blue('\n📊 Issue Summary:'));
        const issues = result.analysis.issues;
        Object.entries(issues).forEach(([severity, count]) => {
          if (count > 0) {
            const color = severity === 'critical' ? chalk.red : 
                         severity === 'high' ? chalk.redBright :
                         severity === 'medium' ? chalk.yellow : chalk.gray;
            console.log(`  ${color(severity)}: ${count} issues`);
          }
        });

        console.log(chalk.green('\n🔨 Proposed Improvements:'));
        result.recommendations.forEach((phase, index) => {
          console.log(`\n${index + 1}. ${chalk.cyan(phase.title)} (${phase.priority})`);
          console.log(`   ${phase.taskCount} tasks (${phase.automatedCount} automated)`);
          
          if (phase.tasks.length > 0) {
            phase.tasks.slice(0, 3).forEach(task => {
              const icon = task.automated ? '🤖' : '👤';
              console.log(`   ${icon} ${task.description}`);
            });
            if (phase.tasks.length > 3) {
              console.log(`   ... and ${phase.tasks.length - 3} more tasks`);
            }
          }
        });

        console.log(chalk.green('\n✨ To apply improvements:'));
        console.log('  • npm start improve --apply --priority immediate');
        console.log('  • npm start improve --apply --priority high --auto');
        
      } else {
        console.log(chalk.green('\n✅ Improvement Execution Complete'));
        console.log(chalk.gray('─'.repeat(50)));
        
        if (result.completedTasks) {
          console.log(`${chalk.green('Completed')}: ${result.completedTasks.length} tasks`);
          result.completedTasks.forEach(task => {
            console.log(`  ✅ ${task.description}`);
          });
        }

        if (result.failedTasks && result.failedTasks.length > 0) {
          console.log(`\n${chalk.red('Failed')}: ${result.failedTasks.length} tasks`);
          result.failedTasks.forEach(task => {
            console.log(`  ❌ ${task.description}: ${task.error}`);
          });
        }

        if (result.skippedTasks && result.skippedTasks.length > 0) {
          console.log(`\n${chalk.yellow('Skipped (Manual)')}: ${result.skippedTasks.length} tasks`);
          result.skippedTasks.forEach(task => {
            console.log(`  ⏭️  ${task.description}`);
          });
        }

        console.log(chalk.green('\n🎉 System improvements applied successfully!'));
        console.log(chalk.cyan('💡 Tip: Run "npm start analyze" to verify improvements'));
      }

    } catch (error) {
      console.error(chalk.red('Error during improvement:'), error.message);
    }
  });

// Health Check
program
  .command('health')
  .description('Quick health check of the system')
  .action(async () => {
    try {
      console.log(chalk.blue('🏥 System Health Check'));
      console.log(chalk.gray('─'.repeat(30)));

      // Test n8n connection
      console.log('Testing n8n connection...', chalk.gray('⏳'));
      const client = new N8nClient();
      const connectionResult = await client.testConnection();
      
      if (connectionResult.success) {
        console.log('n8n Connection:', chalk.green('✅ Healthy'));
      } else {
        console.log('n8n Connection:', chalk.red('❌ Failed'));
        console.log(chalk.red(`  Error: ${connectionResult.message}`));
      }

      // Check project structure
      console.log('\nChecking project structure...', chalk.gray('⏳'));
      const enhancementAgent = new EnhancementAgent();
      const analysis = await enhancementAgent.analyzeProject();
      
      if (analysis.success) {
        const critical = analysis.summary.severityBreakdown.critical;
        const high = analysis.summary.severityBreakdown.high;
        
        if (critical > 0) {
          console.log('Project Health:', chalk.red('❌ Critical Issues'));
          console.log(chalk.red(`  ${critical} critical issues found`));
        } else if (high > 3) {
          console.log('Project Health:', chalk.yellow('⚠️  Needs Attention'));
          console.log(chalk.yellow(`  ${high} high priority issues found`));
        } else {
          console.log('Project Health:', chalk.green('✅ Good'));
        }

        console.log(`\nOverall Rating: ${this.getRatingColor(analysis.summary.overallRating)(analysis.summary.overallRating)}`);
        console.log(`Total Issues: ${analysis.summary.totalIssues}`);
        
        if (critical > 0 || high > 0) {
          console.log(chalk.cyan('\n💡 Quick Actions:'));
          console.log('  • npm start improve --apply --priority immediate');
          console.log('  • npm start analyze --detailed');
        }
      } else {
        console.log('Project Health:', chalk.red('❌ Analysis Failed'));
      }

    } catch (error) {
      console.error(chalk.red('Health check failed:'), error.message);
    }
  });

// Upgrade Path Planning
program
  .command('plan-upgrade')
  .description('Create a comprehensive upgrade path for the system')
  .option('--target <version>', 'Target version or milestone', 'latest')
  .option('--timeline <type>', 'Timeline preference (aggressive, moderate, flexible)', 'flexible')
  .option('--risk <level>', 'Risk tolerance (low, medium, high)', 'medium')
  .option('--json', 'Output results in JSON format')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📈 Creating comprehensive upgrade path...'));
      const upgradePathPlanner = new UpgradePathPlanner();
      
      const result = await upgradePathPlanner.createUpgradePath({
        targetVersion: options.target,
        timeline: options.timeline,
        riskTolerance: options.risk
      });

      if (!result.success) {
        console.log(chalk.red('✗ Upgrade path planning failed'));
        console.log(chalk.red(result.error));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      // Display current state
      console.log(chalk.green('\n📊 Current System State'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`Overall Rating: ${getRatingColor(result.currentState.overallRating)(result.currentState.overallRating)}`);
      console.log(`Total Issues: ${chalk.yellow(result.currentState.totalIssues)}`);
      
      if (result.currentState.criticalIssues > 0) {
        console.log(`Critical Issues: ${chalk.red(result.currentState.criticalIssues)}`);
      }
      if (result.currentState.highIssues > 0) {
        console.log(`High Priority Issues: ${chalk.redBright(result.currentState.highIssues)}`);
      }

      console.log(chalk.blue('\n🎯 Main Concerns:'));
      result.currentState.mainConcerns.forEach(concern => {
        console.log(`  • ${chalk.yellow(concern)}`);
      });

      console.log(chalk.green('\n💪 System Strengths:'));
      result.currentState.strengths.forEach(strength => {
        console.log(`  • ${chalk.green(strength)}`);
      });

      // Display upgrade path
      console.log(chalk.cyan(`\n🗺️  Upgrade Path (${result.upgradePath.totalPhases} phases, ${result.upgradePath.totalTasks} tasks)`));
      console.log(chalk.gray('─'.repeat(70)));

      result.upgradePath.phases.forEach((phase, index) => {
        console.log(`\n${chalk.bold(`Phase ${phase.phase}: ${phase.name}`)}`);
        console.log(chalk.gray(phase.description));
        console.log(`Duration: ${chalk.cyan(phase.estimatedDuration.description)}`);
        console.log(`Tasks: ${chalk.yellow(phase.tasks.length)}`);
        
        // Show top 3 tasks
        phase.tasks.slice(0, 3).forEach(task => {
          const priorityColor = task.priority === 'critical' ? chalk.red :
                               task.priority === 'high' ? chalk.redBright :
                               task.priority === 'medium' ? chalk.yellow : chalk.gray;
          const automatedIcon = task.automated ? '🤖' : '👤';
          console.log(`  ${automatedIcon} ${priorityColor(task.priority.toUpperCase())}: ${task.title}`);
        });
        
        if (phase.tasks.length > 3) {
          console.log(`  ${chalk.gray(`... and ${phase.tasks.length - 3} more tasks`)}`);
        }
        
        console.log(chalk.gray(`Prerequisites: ${phase.prerequisites.join(', ') || 'None'}`));
      });

      // Timeline
      console.log(chalk.green('\n⏰ Timeline Estimate'));
      console.log(chalk.gray('─'.repeat(30)));
      console.log(`Total Time: ${chalk.cyan(`${result.estimatedTimeline.totalWeeks} weeks`)} (${result.estimatedTimeline.totalDays} days)`);
      console.log(`Total Effort: ${chalk.yellow(`${result.estimatedTimeline.totalHours} hours`)}`);

      console.log(chalk.blue('\nPhase Breakdown:'));
      result.estimatedTimeline.phases.forEach(phase => {
        console.log(`  ${phase.name}: ${chalk.cyan(`${phase.estimatedDays} days`)} (${phase.estimatedHours}h)`);
      });

      // Risk assessment
      console.log(chalk.magenta(`\n⚠️  Risk Assessment: ${result.riskAssessment.riskLevel.toUpperCase()}`));
      console.log(chalk.gray('─'.repeat(40)));
      console.log(`Total Risk Areas: ${chalk.yellow(result.riskAssessment.totalRisks)}`);
      
      if (result.riskAssessment.risks.length > 0) {
        console.log(chalk.yellow('\nKey Risk Areas:'));
        result.riskAssessment.risks.slice(0, 5).forEach(risk => {
          console.log(`  • ${risk.task}: ${risk.risks.join(', ')}`);
        });
      }

      // Recommendations
      console.log(chalk.green('\n💡 Strategic Recommendations'));
      console.log(chalk.gray('─'.repeat(35)));
      result.recommendations.forEach(rec => {
        const priorityColor = rec.priority === 'immediate' ? chalk.red :
                             rec.priority === 'short-term' ? chalk.redBright :
                             rec.priority === 'medium-term' ? chalk.yellow :
                             rec.priority === 'long-term' ? chalk.blue : chalk.gray;
        
        console.log(`\n${priorityColor(rec.priority.toUpperCase())}: ${chalk.bold(rec.title)}`);
        console.log(`  ${rec.description}`);
        console.log(chalk.gray(`  Reasoning: ${rec.reasoning}`));
      });

      // Next steps
      console.log(chalk.green('\n✨ Next Steps'));
      console.log(chalk.gray('─'.repeat(20)));
      console.log('1. Review and validate the upgrade path');
      console.log('2. Start with Phase 1 (Critical Issues & Security)');
      console.log('3. Use "npm start improve --apply --priority immediate" for automated fixes');
      console.log('4. Set up project tracking for manual tasks');
      console.log('5. Regular progress reviews and path adjustments');

      console.log(chalk.cyan('\n🎯 Pro Tips:'));
      console.log('• Focus on one phase at a time');
      console.log('• Use automated improvements where possible');
      console.log('• Test thoroughly after each phase');
      console.log('• Keep stakeholders informed of progress');
      
    } catch (error) {
      console.error(chalk.red('Error during upgrade planning:'), error.message);
    }
  });

// Helper method for rating colors
function getRatingColor(rating) {
  switch (rating.toLowerCase()) {
    case 'excellent': return chalk.green;
    case 'good': return chalk.blue;
    case 'average': return chalk.yellow;
    case 'below average': return chalk.orange;
    case 'poor': return chalk.red;
    default: return chalk.gray;
  }
}

export { program };