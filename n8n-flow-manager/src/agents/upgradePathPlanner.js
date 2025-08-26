import fs from 'fs/promises';
import path from 'path';
import { EnhancementAgent } from './enhancementAgent.js';

export class UpgradePathPlanner {
  constructor() {
    this.enhancementAgent = new EnhancementAgent();
    this.projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
    this.upgradePaths = new Map();
  }

  async createUpgradePath(options = {}) {
    const { targetVersion = 'latest', timeline = 'flexible', riskTolerance = 'medium' } = options;
    
    console.log('📈 Upgrade Path Planner: Analyzing current state and planning upgrades...');
    
    try {
      // Analyze current system
      const currentAnalysis = await this.enhancementAgent.analyzeProject();
      
      if (!currentAnalysis.success) {
        return {
          success: false,
          error: 'Failed to analyze current system state',
          details: currentAnalysis.error
        };
      }

      // Create upgrade roadmap
      const upgradePath = await this.generateUpgradePath(currentAnalysis, {
        targetVersion,
        timeline,
        riskTolerance
      });

      return {
        success: true,
        currentState: this.summarizeCurrentState(currentAnalysis),
        upgradePath,
        estimatedTimeline: this.calculateTimeline(upgradePath),
        riskAssessment: this.assessRisks(upgradePath),
        recommendations: this.generateUpgradeRecommendations(upgradePath)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateUpgradePath(analysis, options) {
    const phases = [];
    
    // Phase 1: Critical Issues & Security
    const criticalPhase = await this.createCriticalPhase(analysis);
    if (criticalPhase.tasks.length > 0) {
      phases.push(criticalPhase);
    }

    // Phase 2: Infrastructure & Dependencies
    const infrastructurePhase = await this.createInfrastructurePhase(analysis);
    if (infrastructurePhase.tasks.length > 0) {
      phases.push(infrastructurePhase);
    }

    // Phase 3: Code Quality & Performance
    const qualityPhase = await this.createQualityPhase(analysis);
    if (qualityPhase.tasks.length > 0) {
      phases.push(qualityPhase);
    }

    // Phase 4: Features & Enhancements
    const featuresPhase = await this.createFeaturesPhase(analysis, options);
    if (featuresPhase.tasks.length > 0) {
      phases.push(featuresPhase);
    }

    // Phase 5: Optimization & Future-Proofing
    const optimizationPhase = await this.createOptimizationPhase(analysis);
    if (optimizationPhase.tasks.length > 0) {
      phases.push(optimizationPhase);
    }

    return {
      phases,
      totalPhases: phases.length,
      totalTasks: phases.reduce((sum, phase) => sum + phase.tasks.length, 0)
    };
  }

  async createCriticalPhase(analysis) {
    const tasks = [];
    
    // Security vulnerabilities
    const securityIssues = analysis.analysis.security?.issues || [];
    const criticalSecurityIssues = securityIssues.filter(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );

    criticalSecurityIssues.forEach(issue => {
      tasks.push({
        id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Fix ${issue.type} vulnerability`,
        description: issue.message,
        category: 'security',
        priority: 'critical',
        effort: issue.severity === 'critical' ? 'high' : 'medium',
        dependencies: [],
        risks: ['Security breach potential if not addressed'],
        benefits: ['Improved security posture', 'Compliance adherence'],
        automated: this.isTaskAutomated(issue.type),
        estimatedHours: issue.severity === 'critical' ? 8 : 4
      });
    });

    // Critical functionality issues
    const codeQualityIssues = analysis.analysis.codeQuality?.issues || [];
    const criticalCodeIssues = codeQualityIssues.filter(issue => 
      issue.severity === 'critical' || 
      (issue.severity === 'high' && issue.type === 'missing_error_handling')
    );

    criticalCodeIssues.forEach(issue => {
      tasks.push({
        id: `code_critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Address critical ${issue.type}`,
        description: issue.message,
        category: 'reliability',
        priority: 'critical',
        effort: 'medium',
        dependencies: [],
        risks: ['System instability', 'User experience degradation'],
        benefits: ['Improved reliability', 'Better error handling'],
        automated: this.isTaskAutomated(issue.type),
        estimatedHours: 4
      });
    });

    // Missing critical infrastructure
    const architectureIssues = analysis.analysis.architecture?.issues || [];
    const criticalArchIssues = architectureIssues.filter(issue => 
      issue.severity === 'critical' || issue.type === 'missing_env_example'
    );

    criticalArchIssues.forEach(issue => {
      tasks.push({
        id: `arch_critical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Fix ${issue.type}`,
        description: issue.message,
        category: 'infrastructure',
        priority: 'critical',
        effort: 'low',
        dependencies: [],
        risks: ['Setup difficulties', 'Configuration errors'],
        benefits: ['Easier setup', 'Better developer experience'],
        automated: true,
        estimatedHours: 1
      });
    });

    return {
      name: 'Critical Issues & Security',
      phase: 1,
      description: 'Address critical security vulnerabilities and system reliability issues',
      tasks,
      estimatedDuration: this.calculatePhaseDuration(tasks),
      prerequisites: [],
      successCriteria: [
        'All critical security vulnerabilities resolved',
        'System stability improved',
        'Basic error handling implemented'
      ]
    };
  }

  async createInfrastructurePhase(analysis) {
    const tasks = [];

    // Testing infrastructure
    const hasTests = analysis.analysis.architecture?.structure?.some(item => 
      item.includes('test') || item.includes('spec')
    );

    if (!hasTests) {
      tasks.push({
        id: `testing_setup_${Date.now()}`,
        title: 'Set up comprehensive testing framework',
        description: 'Implement Jest testing framework with unit and integration tests',
        category: 'testing',
        priority: 'high',
        effort: 'high',
        dependencies: [],
        risks: ['Initial time investment', 'Learning curve'],
        benefits: ['Improved code quality', 'Regression prevention', 'Easier refactoring'],
        automated: true,
        estimatedHours: 16
      });
    }

    // Logging infrastructure
    const maintenanceIssues = analysis.analysis.maintenance?.issues || [];
    const needsLogging = maintenanceIssues.some(issue => issue.type === 'no_logging_framework');

    if (needsLogging) {
      tasks.push({
        id: `logging_setup_${Date.now()}`,
        title: 'Implement structured logging',
        description: 'Replace console statements with proper logging framework',
        category: 'infrastructure',
        priority: 'high',
        effort: 'medium',
        dependencies: [],
        risks: ['Temporary log format changes'],
        benefits: ['Better debugging', 'Production monitoring', 'Log aggregation ready'],
        automated: true,
        estimatedHours: 6
      });
    }

    // CI/CD Pipeline
    tasks.push({
      id: `cicd_setup_${Date.now()}`,
      title: 'Set up CI/CD pipeline',
      description: 'Implement GitHub Actions for automated testing and deployment',
      category: 'devops',
      priority: 'medium',
      effort: 'medium',
      dependencies: ['testing_setup'],
      risks: ['Initial setup complexity', 'Pipeline failures'],
      benefits: ['Automated quality gates', 'Faster deployments', 'Consistent builds'],
      automated: false,
      estimatedHours: 8
    });

    // Environment management
    tasks.push({
      id: `env_management_${Date.now()}`,
      title: 'Improve environment configuration',
      description: 'Add environment validation and multi-environment support',
      category: 'configuration',
      priority: 'medium',
      effort: 'low',
      dependencies: [],
      risks: ['Configuration breaking changes'],
      benefits: ['Better environment isolation', 'Easier deployment'],
      automated: true,
      estimatedHours: 4
    });

    return {
      name: 'Infrastructure & Dependencies',
      phase: 2,
      description: 'Establish robust development and deployment infrastructure',
      tasks,
      estimatedDuration: this.calculatePhaseDuration(tasks),
      prerequisites: ['Critical Issues & Security phase completion'],
      successCriteria: [
        'Comprehensive test suite in place',
        'Structured logging implemented',
        'CI/CD pipeline operational',
        'Environment management improved'
      ]
    };
  }

  async createQualityPhase(analysis) {
    const tasks = [];

    // Code quality improvements
    const codeQualityIssues = analysis.analysis.codeQuality?.issues || [];
    
    // Group similar issues
    const issueGroups = this.groupIssuesByType(codeQualityIssues);

    Object.entries(issueGroups).forEach(([issueType, issues]) => {
      if (issues.length > 0 && issues[0].severity !== 'critical') {
        tasks.push({
          id: `quality_${issueType}_${Date.now()}`,
          title: `Improve ${issueType.replace(/_/g, ' ')}`,
          description: `Address ${issues.length} instances of ${issueType}`,
          category: 'code_quality',
          priority: issues[0].severity === 'high' ? 'high' : 'medium',
          effort: issues.length > 5 ? 'high' : 'medium',
          dependencies: [],
          risks: ['Code changes may introduce bugs'],
          benefits: ['Improved maintainability', 'Better code readability', 'Reduced technical debt'],
          automated: this.isTaskAutomated(issueType),
          estimatedHours: Math.min(issues.length * 2, 12)
        });
      }
    });

    // Performance optimizations
    const performanceIssues = analysis.analysis.performance?.issues || [];
    const significantPerfIssues = performanceIssues.filter(issue => 
      issue.severity === 'high' || issue.severity === 'medium'
    );

    if (significantPerfIssues.length > 0) {
      tasks.push({
        id: `performance_optimization_${Date.now()}`,
        title: 'Optimize application performance',
        description: `Address ${significantPerfIssues.length} performance bottlenecks`,
        category: 'performance',
        priority: 'medium',
        effort: 'high',
        dependencies: ['testing_setup'],
        risks: ['Performance changes may affect functionality'],
        benefits: ['Faster execution', 'Better resource utilization', 'Improved user experience'],
        automated: true,
        estimatedHours: 10
      });
    }

    // Code documentation
    const documentationIssues = codeQualityIssues.filter(issue => 
      issue.type === 'missing_documentation'
    );

    if (documentationIssues.length > 0) {
      tasks.push({
        id: `documentation_improvement_${Date.now()}`,
        title: 'Improve code documentation',
        description: 'Add JSDoc comments and improve inline documentation',
        category: 'documentation',
        priority: 'low',
        effort: 'medium',
        dependencies: [],
        risks: ['Time investment for documentation'],
        benefits: ['Better code understanding', 'Easier onboarding', 'Improved maintainability'],
        automated: false,
        estimatedHours: 8
      });
    }

    return {
      name: 'Code Quality & Performance',
      phase: 3,
      description: 'Improve code quality, performance, and maintainability',
      tasks,
      estimatedDuration: this.calculatePhaseDuration(tasks),
      prerequisites: ['Infrastructure & Dependencies phase completion'],
      successCriteria: [
        'Code quality issues reduced by 80%',
        'Performance bottlenecks addressed',
        'Documentation coverage improved',
        'Technical debt reduced'
      ]
    };
  }

  async createFeaturesPhase(analysis, options) {
    const tasks = [];

    // Web dashboard (mentioned in roadmap)
    tasks.push({
      id: `web_dashboard_${Date.now()}`,
      title: 'Develop web dashboard',
      description: 'Create web interface for workflow management and monitoring',
      category: 'feature',
      priority: 'medium',
      effort: 'very_high',
      dependencies: ['testing_setup', 'logging_setup'],
      risks: ['Complex UI development', 'Additional maintenance overhead'],
      benefits: ['Better user experience', 'Visual workflow management', 'Real-time monitoring'],
      automated: false,
      estimatedHours: 40
    });

    // Advanced workflow features
    tasks.push({
      id: `workflow_templates_${Date.now()}`,
      title: 'Implement workflow templates system',
      description: 'Create reusable workflow templates and template marketplace',
      category: 'feature',
      priority: 'medium',
      effort: 'high',
      dependencies: [],
      risks: ['Template versioning complexity'],
      benefits: ['Faster workflow creation', 'Best practices sharing', 'Standardization'],
      automated: false,
      estimatedHours: 20
    });

    // Enhanced testing capabilities
    tasks.push({
      id: `advanced_testing_${Date.now()}`,
      title: 'Enhance testing capabilities',
      description: 'Add advanced testing scenarios and workflow simulation',
      category: 'feature',
      priority: 'medium',
      effort: 'high',
      dependencies: ['testing_setup'],
      risks: ['Complex test scenario management'],
      benefits: ['Better workflow validation', 'Regression testing', 'Quality assurance'],
      automated: false,
      estimatedHours: 16
    });

    // Plugin system
    tasks.push({
      id: `plugin_system_${Date.now()}`,
      title: 'Implement plugin architecture',
      description: 'Create extensible plugin system for custom analyzers and commands',
      category: 'architecture',
      priority: 'low',
      effort: 'very_high',
      dependencies: [],
      risks: ['Architectural complexity', 'API stability concerns'],
      benefits: ['Extensibility', 'Community contributions', 'Custom integrations'],
      automated: false,
      estimatedHours: 32
    });

    // Multi-environment support
    tasks.push({
      id: `multi_environment_${Date.now()}`,
      title: 'Add multi-environment support',
      description: 'Support for dev, staging, and production environments',
      category: 'feature',
      priority: 'medium',
      effort: 'medium',
      dependencies: ['env_management'],
      risks: ['Configuration complexity'],
      benefits: ['Better deployment management', 'Environment isolation', 'Staged rollouts'],
      automated: false,
      estimatedHours: 12
    });

    return {
      name: 'Features & Enhancements',
      phase: 4,
      description: 'Add new features and capabilities to expand system functionality',
      tasks,
      estimatedDuration: this.calculatePhaseDuration(tasks),
      prerequisites: ['Code Quality & Performance phase completion'],
      successCriteria: [
        'Web dashboard operational',
        'Template system implemented',
        'Enhanced testing capabilities',
        'Multi-environment support'
      ]
    };
  }

  async createOptimizationPhase(analysis) {
    const tasks = [];

    // Advanced monitoring
    tasks.push({
      id: `monitoring_setup_${Date.now()}`,
      title: 'Implement comprehensive monitoring',
      description: 'Add metrics, alerting, and performance monitoring',
      category: 'monitoring',
      priority: 'medium',
      effort: 'high',
      dependencies: ['logging_setup', 'web_dashboard'],
      risks: ['Monitoring overhead', 'Alert fatigue'],
      benefits: ['Proactive issue detection', 'Performance insights', 'System observability'],
      automated: false,
      estimatedHours: 16
    });

    // Advanced security features
    tasks.push({
      id: `advanced_security_${Date.now()}`,
      title: 'Enhance security features',
      description: 'Implement advanced authentication, encryption, and audit logging',
      category: 'security',
      priority: 'medium',
      effort: 'high',
      dependencies: [],
      risks: ['Security complexity', 'Performance impact'],
      benefits: ['Enhanced security posture', 'Compliance readiness', 'Audit capabilities'],
      automated: false,
      estimatedHours: 20
    });

    // Performance optimization
    tasks.push({
      id: `advanced_performance_${Date.now()}`,
      title: 'Advanced performance optimization',
      description: 'Implement caching, connection pooling, and resource optimization',
      category: 'performance',
      priority: 'low',
      effort: 'high',
      dependencies: ['monitoring_setup'],
      risks: ['Optimization complexity', 'Potential regressions'],
      benefits: ['Better scalability', 'Resource efficiency', 'Improved response times'],
      automated: false,
      estimatedHours: 18
    });

    // Future-proofing
    tasks.push({
      id: `future_proofing_${Date.now()}`,
      title: 'Future-proofing improvements',
      description: 'Update to latest standards, improve API versioning, add deprecation support',
      category: 'architecture',
      priority: 'low',
      effort: 'medium',
      dependencies: [],
      risks: ['Breaking changes', 'Migration complexity'],
      benefits: ['Long-term maintainability', 'Technology relevance', 'Upgrade readiness'],
      automated: false,
      estimatedHours: 12
    });

    return {
      name: 'Optimization & Future-Proofing',
      phase: 5,
      description: 'Optimize system performance and prepare for future growth',
      tasks,
      estimatedDuration: this.calculatePhaseDuration(tasks),
      prerequisites: ['Features & Enhancements phase completion'],
      successCriteria: [
        'Comprehensive monitoring in place',
        'Advanced security features implemented',
        'Performance optimized for scale',
        'System future-proofed'
      ]
    };
  }

  summarizeCurrentState(analysis) {
    return {
      overallRating: analysis.summary.overallRating,
      totalIssues: analysis.summary.totalIssues,
      criticalIssues: analysis.summary.severityBreakdown.critical,
      highIssues: analysis.summary.severityBreakdown.high,
      mediumIssues: analysis.summary.severityBreakdown.medium,
      lowIssues: analysis.summary.severityBreakdown.low,
      mainConcerns: this.extractMainConcerns(analysis),
      strengths: this.extractStrengths(analysis)
    };
  }

  extractMainConcerns(analysis) {
    const concerns = [];
    
    if (analysis.summary.severityBreakdown.critical > 0) {
      concerns.push('Critical security or reliability issues present');
    }
    
    if (analysis.summary.severityBreakdown.high > 5) {
      concerns.push('High number of high-priority issues');
    }
    
    // Check specific categories
    const securityIssues = analysis.analysis.security?.issues?.length || 0;
    if (securityIssues > 0) {
      concerns.push('Security vulnerabilities identified');
    }
    
    const performanceIssues = analysis.analysis.performance?.issues?.length || 0;
    if (performanceIssues > 3) {
      concerns.push('Performance optimization needed');
    }

    const hasTests = analysis.analysis.architecture?.structure?.some(item => 
      item.includes('test') || item.includes('spec')
    );
    if (!hasTests) {
      concerns.push('No testing infrastructure found');
    }

    return concerns.length > 0 ? concerns : ['System appears to be in good condition'];
  }

  extractStrengths(analysis) {
    const strengths = [];
    
    if (analysis.summary.severityBreakdown.critical === 0) {
      strengths.push('No critical issues found');
    }
    
    if (analysis.summary.overallRating === 'Excellent' || analysis.summary.overallRating === 'Good') {
      strengths.push('Good overall code quality');
    }
    
    // Check for good architecture
    const structure = analysis.analysis.architecture?.structure || [];
    if (structure.some(item => item.includes('src/'))) {
      strengths.push('Well-organized project structure');
    }
    
    if (structure.some(item => item.includes('README.md'))) {
      strengths.push('Documentation present');
    }
    
    return strengths.length > 0 ? strengths : ['Basic project structure in place'];
  }

  calculateTimeline(upgradePath) {
    const totalHours = upgradePath.phases.reduce((sum, phase) => {
      return sum + phase.tasks.reduce((phaseSum, task) => phaseSum + (task.estimatedHours || 0), 0);
    }, 0);
    
    const totalDays = Math.ceil(totalHours / 8); // Assuming 8-hour workdays
    const totalWeeks = Math.ceil(totalDays / 5); // Assuming 5-day work weeks
    
    return {
      totalHours,
      totalDays,
      totalWeeks,
      phases: upgradePath.phases.map(phase => ({
        name: phase.name,
        estimatedHours: phase.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0),
        estimatedDays: Math.ceil(phase.tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0) / 8)
      }))
    };
  }

  assessRisks(upgradePath) {
    const risks = [];
    
    upgradePath.phases.forEach(phase => {
      phase.tasks.forEach(task => {
        if (task.risks && task.risks.length > 0) {
          risks.push({
            phase: phase.name,
            task: task.title,
            risks: task.risks,
            mitigation: this.getRiskMitigation(task.category)
          });
        }
      });
    });
    
    return {
      totalRisks: risks.length,
      riskLevel: this.calculateOverallRiskLevel(risks),
      risks: risks.slice(0, 10), // Top 10 risks
      mitigationStrategies: this.getGeneralMitigationStrategies()
    };
  }

  calculateOverallRiskLevel(risks) {
    if (risks.length > 20) return 'high';
    if (risks.length > 10) return 'medium';
    if (risks.length > 5) return 'low';
    return 'minimal';
  }

  getRiskMitigation(category) {
    const mitigations = {
      security: 'Thorough testing, security review, staged deployment',
      performance: 'Load testing, performance monitoring, rollback plan',
      infrastructure: 'Backup systems, incremental deployment, monitoring',
      feature: 'Feature flags, A/B testing, user feedback collection',
      code_quality: 'Code review, automated testing, incremental refactoring'
    };
    
    return mitigations[category] || 'Careful planning, testing, and monitoring';
  }

  getGeneralMitigationStrategies() {
    return [
      'Implement comprehensive testing before deployment',
      'Use feature flags for gradual rollout of changes',
      'Maintain backup and rollback procedures',
      'Monitor system health during and after upgrades',
      'Have a communication plan for stakeholders',
      'Schedule upgrades during low-traffic periods',
      'Keep documentation updated throughout the process'
    ];
  }

  generateUpgradeRecommendations(upgradePath) {
    return [
      {
        priority: 'immediate',
        title: 'Start with Critical Issues',
        description: 'Address all critical security and reliability issues first',
        reasoning: 'Critical issues pose immediate risk to system stability and security'
      },
      {
        priority: 'short-term',
        title: 'Establish Testing Infrastructure',
        description: 'Set up comprehensive testing before major refactoring',
        reasoning: 'Testing infrastructure provides safety net for future changes'
      },
      {
        priority: 'medium-term',
        title: 'Incremental Quality Improvements',
        description: 'Address code quality issues in small, manageable chunks',
        reasoning: 'Gradual improvement reduces risk and maintains system stability'
      },
      {
        priority: 'long-term',
        title: 'Feature Development',
        description: 'Add new features after core system is stable and well-tested',
        reasoning: 'New features should build on a solid, reliable foundation'
      },
      {
        priority: 'ongoing',
        title: 'Continuous Optimization',
        description: 'Regularly review and optimize system performance and architecture',
        reasoning: 'Continuous improvement prevents technical debt accumulation'
      }
    ];
  }

  // Helper methods
  calculatePhaseDuration(tasks) {
    const totalHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
    const days = Math.ceil(totalHours / 8);
    const weeks = Math.ceil(days / 5);
    
    return {
      hours: totalHours,
      days,
      weeks,
      description: `${weeks} week${weeks !== 1 ? 's' : ''} (${days} working days)`
    };
  }

  isTaskAutomated(issueType) {
    const automatedTypes = [
      'missing_env_example',
      'console_logging',
      'sync_in_async',
      'sequential_operations',
      'missing_error_handling'
    ];
    
    return automatedTypes.includes(issueType);
  }

  groupIssuesByType(issues) {
    return issues.reduce((groups, issue) => {
      const type = issue.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(issue);
      return groups;
    }, {});
  }
}