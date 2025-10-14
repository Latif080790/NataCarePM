import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { Brain, TrendingUp, AlertTriangle, Target, Sparkles, RefreshCw } from 'lucide-react';

interface AIInsight {
  type: 'risk' | 'opportunity' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  action?: string;
}

interface AIInsightsPanelProps {
  projectData?: any;
  onRefresh?: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ 
  projectData,
  onRefresh 
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate AI insights based on project data
  useEffect(() => {
    generateInsights();
  }, [projectData]);

  const generateInsights = () => {
    // Simulated AI insights - in production, this would call Gemini API
    const mockInsights: AIInsight[] = [
      {
        type: 'risk',
        title: 'Schedule Delay Risk Detected',
        description: 'Current progress is 7% behind planned schedule. Risk of missing Q4 deadline.',
        confidence: 87,
        impact: 'high',
        action: 'Increase resources or adjust timeline'
      },
      {
        type: 'opportunity',
        title: 'Budget Optimization Opportunity',
        description: 'Analysis shows potential 12% cost savings in material procurement.',
        confidence: 92,
        impact: 'medium',
        action: 'Review supplier contracts'
      },
      {
        type: 'prediction',
        title: 'Completion Forecast',
        description: 'Based on current velocity, project completion predicted for August 28, 2025.',
        confidence: 85,
        impact: 'medium',
        action: 'Monitor progress weekly'
      },
      {
        type: 'recommendation',
        title: 'Resource Allocation',
        description: 'AI suggests reassigning 2 team members from infrastructure to finishing work.',
        confidence: 78,
        impact: 'medium',
        action: 'Review team allocation'
      }
    ];

    setInsights(mockInsights);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      generateInsights();
      setIsLoading(false);
    }, 1000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'prediction':
        return <Target className="w-5 h-5 text-blue-400" />;
      case 'recommendation':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <Brain className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'risk':
        return 'from-red-500/20 to-red-600/10 border-red-500/30';
      case 'opportunity':
        return 'from-green-500/20 to-green-600/10 border-green-500/30';
      case 'prediction':
        return 'from-blue-500/20 to-blue-600/10 border-blue-500/30';
      case 'recommendation':
        return 'from-purple-500/20 to-purple-600/10 border-purple-500/30';
      default:
        return 'from-slate-500/20 to-slate-600/10 border-slate-500/30';
    }
  };

  const getImpactBadge = (impact: string) => {
    const colors = {
      high: 'bg-red-500/20 text-red-400 border-red-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[impact as keyof typeof colors] || colors.low;
  };

  return (
    <Card className="card-enhanced">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">AI-Powered Insights</h3>
            <p className="text-xs text-slate-400">Predictive analytics & recommendations</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`glass border rounded-xl p-4 bg-gradient-to-br ${getTypeColor(insight.type)} transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1">
                {getTypeIcon(insight.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-slate-100">{insight.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getImpactBadge(insight.impact)}`}>
                      {insight.impact.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-slate-300 mb-2">
                  {insight.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-slate-400">
                      Confidence: <span className="font-semibold text-slate-300">{insight.confidence}%</span>
                    </div>
                    <div className="h-1.5 w-16 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                        style={{ width: `${insight.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {insight.action && (
                    <button className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                      {insight.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Status Footer */}
      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>AI Engine Active</span>
        </div>
        <span>Powered by Gemini AI</span>
      </div>
    </Card>
  );
};
