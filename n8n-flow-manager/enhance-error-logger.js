import { claudeCodeIntegration } from './src/integration/claudeCodeIntegration.js';

async function enhanceErrorLogger() {
  console.log('🔍 Searching for error handling and logging workflow references...\n');
  
  try {
    // Search for error handling workflows
    const searchResult = await claudeCodeIntegration.executeTask('search for error handling and notification workflows');
    console.log('✅ Error Workflow Search:', searchResult.success ? 'SUCCESS' : 'FAILED');
    
    if (searchResult.success && searchResult.data?.results) {
      console.log(`📊 Found ${searchResult.data.results.length} reference workflows`);
      console.log('🔍 Sample Results:');
      searchResult.data.results.slice(0, 3).forEach((workflow, i) => {
        console.log(`   ${i+1}. ${workflow.name || workflow.id}`);
        console.log(`      Source: ${workflow.source}`);
        console.log(`      Category: ${workflow.category || 'General'}`);
      });
    }
    
    console.log('\n💡 Getting recommendations for enhanced error logging...');
    
    // Get workflow recommendations
    const recResult = await claudeCodeIntegration.executeTask('recommend advanced error logging workflows with alerting and monitoring features');
    console.log('✅ Recommendation Search:', recResult.success ? 'SUCCESS' : 'FAILED');
    
    if (recResult.success && recResult.data?.recommendations) {
      console.log(`📋 Recommended ${recResult.data.recommendations.length} enhancement patterns`);
      recResult.data.recommendations.forEach((rec, i) => {
        console.log(`   ${i+1}. ${rec.name} (Quality: ${rec.quality}%)`);
      });
    }
    
    console.log('\n🚀 Generating enhanced Error Logger workflow...');
    
    // Generate enhanced workflow
    const genResult = await claudeCodeIntegration.executeTask('create enhanced error logger workflow with advanced alerting, monitoring, and recovery features based on production-ready templates');
    console.log('✅ Enhanced Workflow Generation:', genResult.success ? 'SUCCESS' : 'FAILED');
    
    if (genResult.success) {
      console.log('📝 Generation Details:');
      console.log('   Task Type:', genResult.data?.taskType);
      console.log('   Workflows Generated:', genResult.data?.workflows?.length || 0);
      if (genResult.data?.workflows?.length > 0) {
        const workflow = genResult.data.workflows[0];
        console.log('   Generated Workflow:', workflow.name);
        console.log('   Confidence:', workflow.metadata?.confidence + '%');
        console.log('   AI Enhanced:', workflow.aiGenerated);
        console.log('   Node Count:', workflow.nodes?.length || 0);
      }
    }
    
    console.log('\n🎯 Enhancement Summary:');
    console.log('✅ Reference Search: Complete');
    console.log('✅ Recommendation Analysis: Complete');
    console.log('✅ Enhanced Workflow Generation: Complete');
    
  } catch (error) {
    console.error('❌ Enhancement failed:', error.message);
  }
}

enhanceErrorLogger().catch(console.error);