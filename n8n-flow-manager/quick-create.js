#!/usr/bin/env node

/**
 * 🚀 QUICK CREATE - One Command Optimized Flow Creation
 * 
 * Usage: node quick-create.js "workflow description"
 * Example: node quick-create.js "email automation with error handling"
 */

import { OptimizedFlowCreator } from './create-optimized-flow.js';

async function quickCreate() {
  console.log('🚀 QUICK CREATE - Optimized n8n Flow');
  console.log('🎯 Target: 10x faster, 5x better quality, production-ready\n');
  
  // Get description from command line
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Usage Examples:');
    console.log('  node quick-create.js "data processing workflow"');
    console.log('  node quick-create.js "email automation system" "My Email Flow"');
    console.log('  node quick-create.js "error logging with monitoring"');
    console.log('  node quick-create.js "API integration with webhooks"');
    console.log('  node quick-create.js "invoice processing automation"');
    console.log('\n🎯 Features automatically included:');
    console.log('  ✅ Repository templates (7,453 workflows)');
    console.log('  ✅ MCP validation (535 nodes)');
    console.log('  ✅ AI enhancement');
    console.log('  ✅ Error handling & monitoring');
    console.log('  ✅ Production-ready deployment');
    process.exit(0);
  }
  
  const description = args[0];
  const name = args[1] || null;
  
  try {
    const creator = new OptimizedFlowCreator();
    const result = await creator.createOptimizedFlow(description, name);
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Optimized workflow created:');
      console.log(`📋 Workflow ID: ${result.workflow.id}`);
      console.log(`⚡ Created in: ${Math.round(result.duration / 1000)}s`);
      console.log(`🔗 URL: https://n8n.srv779128.hstgr.cloud/workflow/${result.workflow.id}`);
      
      console.log('\n✅ Optimizations Applied:');
      console.log(`  Repository Templates: ${result.optimizations.repository ? '✅' : '❌'}`);
      console.log(`  MCP Validation: ${result.optimizations.mcp ? '✅' : '❌'}`);
      console.log(`  AI Enhancement: ${result.optimizations.ai ? '✅' : '❌'}`);
      console.log(`  Production Ready: ${result.optimizations.production ? '✅' : '❌'}`);
      
      console.log('\n🚀 Ready for use! Activate workflow in n8n to start.');
    } else {
      console.error(`\n❌ Creation failed: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Quick create failed:', error.message);
    process.exit(1);
  }
}

// Run quick create
quickCreate();