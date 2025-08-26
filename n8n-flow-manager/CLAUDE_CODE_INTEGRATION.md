# Claude Code Integration Guide

This guide explains how to integrate the n8n Flow Manager with Claude Code, enabling you to instruct Claude Code to perform any n8n flow management task through natural language.

## 🚀 Quick Setup

### 1. Copy Integration Files

Copy the `claudeCodeHooks.js` file to your Claude Code hooks directory:

```bash
# Option 1: Copy to Claude Code hooks directory
cp claudeCodeHooks.js /path/to/your/claude-code/hooks/

# Option 2: Import in existing hooks file
# Add to your existing hooks file:
import { n8nFlowManagerHooks } from './path/to/n8n-flow-manager/claudeCodeHooks.js';
```

### 2. Register Hooks in Claude Code

Add these hooks to your Claude Code configuration:

```javascript
// In your Claude Code hooks configuration
import { 
  handleUserPrompt, 
  handleFileOperation, 
  handleTaskComplete, 
  handleHealthCheck,
  invokeN8nFlowManager,
  getN8nOperations 
} from './claudeCodeHooks.js';

// Register hooks
claudeCode.addHook('user-prompt-submit', handleUserPrompt);
claudeCode.addHook('file-operation', handleFileOperation);
claudeCode.addHook('task-complete', handleTaskComplete);
claudeCode.addHook('health-check', handleHealthCheck);
```

### 3. Configure Environment

Ensure your n8n Flow Manager `.env` file is properly configured:

```bash
# Copy and configure environment
cp .env.example .env

# Edit .env with your settings
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_api_key_here
```

## 💬 Natural Language Commands

Once integrated, you can instruct Claude Code with natural language commands:

### System Analysis & Health

```text
"Analyze the n8n system for issues"
"Check system health"
"What problems exist in the system?"
"Scan for workflow issues"
"Run a comprehensive analysis"
```

### Automated Improvements

```text
"Fix all critical issues"
"Apply system improvements"
"Improve the code automatically"
"Resolve all problems"
"Apply high priority fixes"
"Fix it now"  # Applies immediate fixes
```

### Strategic Planning

```text
"Create an upgrade plan"
"Plan system improvements"
"Show me a roadmap for upgrades"
"Create strategic improvement plan"
```

### Workflow Management

```text
"Export all workflows"
"Export workflow abc123"
"Import workflow from file.json"
"Test workflow xyz789"
"List all active workflows"
"Show workflow status"
```

### Connection & Status

```text
"Test n8n connection"
"Show system status"
"Check if n8n is connected"
"What's the current status?"
```

## 🎯 Direct API Calls

Claude Code can also make direct API calls:

```javascript
// In Claude Code context
const result = await invokeN8nFlowManager('analyze', { detailed: true });
const workflows = await invokeN8nFlowManager('export', { workflowId: 'abc123' });
const improvements = await invokeN8nFlowManager('improve', { priority: 'high', apply: true });
```

## 🔄 Available Operations

| Operation | Description | Parameters |
|-----------|-------------|------------|
| `analyze` | System analysis | `detailed: boolean` |
| `improve` | Apply improvements | `priority: string, apply: boolean` |
| `export` | Export workflows | `workflowId?: string` |
| `import` | Import workflow | `filePath: string` |
| `test` | Test workflow | `workflowId: string` |
| `upgrade` | Create upgrade plan | `timeline: string, risk: string` |
| `status` | Show status | `detailed: boolean` |
| `connection` | Test connection | - |

## 🎛️ Context-Aware Features

The integration provides context-aware responses:

### Smart Parameter Extraction

```text
"Test workflow abc123 with high priority"
# Extracts: workflowId="abc123", priority="high"

"Apply critical fixes immediately"
# Extracts: priority="critical", apply=true

"Export all workflows but don't commit"
# Extracts: all=true, noCommit=true
```

### Conversational Memory

```text
User: "Analyze the system"
Claude: "Found 5 critical issues..."

User: "Fix them"
Claude: "Applying fixes for the 5 critical issues identified..."
```

### File Operation Hooks

Automatically detects workflow file changes and suggests actions:

```text
# When you edit a workflow file
Claude: "🔄 Detected workflow file change. Suggestions:"
- "Test the updated workflow"
- "Export changes to n8n"
- "Analyze workflow for issues"
```

## 🔧 Advanced Configuration

### Custom Hook Integration

```javascript
// Custom hook for specific workflows
export async function onWorkflowUpdate(workflowId, changes) {
  const analysis = await invokeN8nFlowManager('enhance', { workflowId });
  
  return {
    analysis: analysis.data,
    suggestions: [
      'Review workflow performance impact',
      'Test updated workflow functionality'
    ]
  };
}
```

### Health Monitoring Integration

```javascript
// Automatic health checks
export async function onSystemStart() {
  const health = await invokeN8nFlowManager('connection');
  
  if (!health.success) {
    console.warn('⚠️ n8n Flow Manager connection failed');
    return {
      warning: 'n8n system not accessible',
      suggestion: 'Check n8n server and configuration'
    };
  }
}
```

## 🎯 Use Cases

### 1. Development Workflow

```text
# During development
"Analyze the system for any issues"
"Export all workflows for backup"
"Test workflow user-registration"

# After code changes
"Fix any new issues automatically"
"Create upgrade plan for next release"
```

### 2. Code Review Process

```text
# Before PR merge
"Run comprehensive system analysis"
"Check for security vulnerabilities"
"Apply automated improvements"

# After merge
"Export updated workflows"
"Test all critical workflows"
```

### 3. Deployment Pipeline

```text
# Pre-deployment
"Verify n8n connection"
"Test all active workflows"
"Fix any critical issues"

# Post-deployment
"Check system health"
"Monitor workflow performance"
```

## 🔍 Response Format

All commands return structured responses:

```javascript
{
  success: true,
  response: "✅ System analysis complete. Found 3 issues...",
  data: { /* detailed results */ },
  suggestions: [
    "Apply automated improvements",
    "Review critical issues first"
  ],
  nextSteps: [
    "Execute: fix critical issues",
    "Create upgrade plan"
  ]
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Integration not working**
   ```bash
   # Check initialization
   console.log(getN8nStatus());
   ```

2. **Commands not recognized**
   ```javascript
   // Check available operations
   console.log(getN8nOperations());
   ```

3. **Connection issues**
   ```text
   "Test n8n connection"
   # Check .env configuration
   ```

### Debug Mode

Enable debug logging:

```javascript
// In hooks configuration
process.env.N8N_FLOW_MANAGER_DEBUG = 'true';
```

## 📊 Monitoring & Analytics

The integration tracks:
- Command execution history
- Success/failure rates  
- Performance metrics
- User interaction patterns

Access analytics:

```javascript
const status = getN8nStatus();
console.log(status.executionHistory);
```

## 🚀 Best Practices

1. **Start Simple**: Begin with basic commands like "analyze system"
2. **Use Natural Language**: Commands work with conversational phrases
3. **Check Status First**: Always verify n8n connection before operations
4. **Review Before Applying**: Use dry-run mode for improvements
5. **Monitor Results**: Check execution history for patterns

## 🔮 Future Enhancements

Planned features:
- Voice command integration
- Automated workflow suggestions
- Performance monitoring dashboards  
- Advanced AI-powered optimizations
- Multi-environment support

## 📞 Support

For integration issues:
1. Check the integration status
2. Verify n8n Flow Manager configuration  
3. Review Claude Code hooks setup
4. Check console logs for errors

The integration enables seamless workflow management through natural conversation with Claude Code, making n8n administration intuitive and efficient.