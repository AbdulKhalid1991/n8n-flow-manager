# n8n Flow Manager

A comprehensive n8n flow management system that provides version control, testing, enhancement, and lifecycle management for your n8n workflows.

## Features

🔄 **Version Control Integration**
- Git-based versioning for all workflows
- Automatic commits with meaningful messages
- Branch management and rollback capabilities

📤 **Export/Import Workflows**
- Export individual or all workflows from n8n
- Import workflows with backup and update options
- Compare local vs remote workflow differences

🧪 **Testing Framework**
- Automated workflow testing and validation
- Pre-execution validation checks
- Performance and reliability testing
- Parallel test execution

⚡ **Enhancement & Optimization**
- Workflow analysis and optimization suggestions
- Security vulnerability detection
- Performance bottleneck identification
- Best practices compliance checking

🤖 **AI-Powered Enhancement Agent**
- Comprehensive system analysis and health checks
- Automated code quality improvements
- Security vulnerability detection and fixing
- Performance optimization suggestions
- Upgrade path planning with risk assessment

🛠️ **Automated Improvement System**
- One-click fixes for common issues
- Automated error handling implementation
- Console logging replacement with structured logging
- Synchronous to asynchronous operation conversion
- Test suite generation and setup

📊 **System Health Monitoring**
- Real-time health status checking
- Issue severity breakdown and prioritization
- Progress tracking and improvement verification
- Comprehensive reporting and analytics

🗺️ **Strategic Upgrade Planning**
- Multi-phase upgrade path generation
- Risk assessment and mitigation strategies
- Timeline estimation and resource planning
- Priority-based task organization

🖥️ **Command Line Interface**
- Easy-to-use CLI commands with rich output
- Interactive health checks and analysis
- Progress tracking and detailed reporting
- Automated and manual improvement options

## Installation

1. Clone or create the project:
```bash
cd n8n-flow-manager
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your n8n instance details
```

3. Initialize the system:
```bash
npm start test-connection
```

## Configuration

Edit the `.env` file with your settings:

```env
# n8n Instance Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_api_key_here

# Git Configuration
GIT_AUTHOR_NAME=n8n Flow Manager
GIT_AUTHOR_EMAIL=flows@your-domain.com

# Dashboard Configuration (Future)
DASHBOARD_PORT=3000
DASHBOARD_HOST=localhost

# Testing Configuration
TEST_TIMEOUT=30000
TEST_PARALLEL_LIMIT=5

# Enhancement Settings
ENHANCEMENT_LEVEL=moderate
AUTO_OPTIMIZE=false
```

## Usage

### Basic Commands

**Test Connection**
```bash
npm start test-connection
```

**List All Workflows**
```bash
npm start list
npm start list --active    # Only active workflows
npm start list --inactive  # Only inactive workflows
```

**Export Workflows**
```bash
# Export specific workflow
npm start export --workflow <workflow_id>

# Export all workflows
npm start export --all

# Export without git commit
npm start export --all --no-commit
```

**Import Workflows**
```bash
# Import workflow
npm start import workflow.json

# Update existing workflow
npm start import workflow.json --update --backup
```

**Test Workflows**
```bash
# Test specific workflow
npm start test --workflow <workflow_id>

# Test from file
npm start test --file workflow.json
```

**System Health & Analysis**
```bash
# Quick health check
npm start health

# Comprehensive system analysis
npm start analyze

# Detailed analysis with full breakdown
npm start analyze --detailed

# JSON output for integration
npm start analyze --json
```

**Automated System Improvements**
```bash
# Dry run - see what would be improved
npm start improve --dry-run

# Apply high priority improvements
npm start improve --apply --priority high

# Quick fix for critical issues
npm run quick-fix

# Apply all automated improvements
npm start improve --apply --auto
```

**Strategic Upgrade Planning**
```bash
# Create comprehensive upgrade path
npm start plan-upgrade

# Target-specific upgrade path
npm start plan-upgrade --target latest --timeline flexible

# Risk-assessed upgrade planning
npm start plan-upgrade --risk low --json
```

**Analyze & Enhance Workflows**
```bash
# Analyze workflow
npm start enhance --workflow <workflow_id>

# Analyze from file
npm start enhance --file workflow.json

# Apply automatic fixes (future)
npm start enhance --workflow <workflow_id> --fix
```

**Git Status**
```bash
npm start status
```

### Advanced Usage

**Workflow Testing with Custom Data**
```javascript
import { FlowTester } from './src/testing/flowTester.js';

const tester = new FlowTester();
const result = await tester.testWorkflow('workflow_id', {
  name: 'Custom Test',
  input: { data: 'test' },
  expectedOutput: { status: 'success' }
});
```

**Programmatic Flow Management**
```javascript
import { FlowManager } from './src/core/flowManager.js';

const manager = new FlowManager();
await manager.initialize();

// Export workflow
const result = await manager.exportWorkflow('workflow_id');

// Import workflow
await manager.importWorkflow('./flows/my-workflow.json', {
  update: true,
  backup: true
});
```

**Workflow Enhancement**
```javascript
import { FlowEnhancer } from './src/enhancement/flowEnhancer.js';
import { N8nClient } from './src/api/n8nClient.js';

const enhancer = new FlowEnhancer();
const client = new N8nClient();

const workflow = await client.getWorkflow('workflow_id');
const analysis = enhancer.analyzeWorkflow(workflow);

console.log('Issues:', analysis.issues);
console.log('Suggestions:', analysis.suggestions);
console.log('Optimizations:', analysis.optimizations);
```

## Workflow Lifecycle Management

### 1. Development Phase
- Create and test workflows in n8n
- Export workflows for version control
- Run enhancement analysis

### 2. Version Control
- Automatic git commits on export
- Branch management for different environments
- Rollback capabilities

### 3. Testing
- Validate workflow structure
- Test execution with sample data
- Performance and reliability checks

### 4. Enhancement
- Security vulnerability scanning
- Performance optimization suggestions
- Best practices compliance

### 5. Deployment
- Import tested workflows
- Backup existing workflows
- Monitor and maintain

## API Reference

### N8nClient
- `testConnection()` - Test connection to n8n
- `getAllWorkflows()` - Get all workflows
- `getWorkflow(id)` - Get specific workflow
- `createWorkflow(data)` - Create new workflow
- `updateWorkflow(id, data)` - Update workflow
- `executeWorkflow(id, data)` - Execute workflow

### FlowManager
- `exportWorkflow(id, options)` - Export workflow
- `exportAllWorkflows(options)` - Export all workflows
- `importWorkflow(path, options)` - Import workflow
- `compareWorkflows(local, remote)` - Compare workflows

### FlowTester
- `testWorkflow(id, testData)` - Test single workflow
- `testMultipleWorkflows(tests)` - Test multiple workflows
- `generateTestReport(results)` - Generate test report

### FlowEnhancer
- `analyzeWorkflow(workflow)` - Analyze workflow
- `applyOptimization(workflow, type)` - Apply optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and feature requests, please create an issue in the repository.

## Roadmap

- [ ] Web dashboard interface
- [ ] Workflow templates library
- [ ] Advanced testing scenarios
- [ ] CI/CD integration
- [ ] Multi-environment support
- [ ] Workflow documentation generation
- [ ] Performance metrics dashboard
- [ ] Automated optimization application