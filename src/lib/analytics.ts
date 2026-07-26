import { HistoryItem, RPMFormData } from '../types';

export interface AnalyticsData {
  totalRPM: number;
  totalBySubject: Record<string, number>;
  totalByPhase: Record<string, number>;
  totalByLearningMode: Record<string, number>;
  totalByLearningModel: Record<string, number>;
  averageGenerationTime: number;
  mostUsedModel: string;
  mostUsedSubject: string;
  totalTimeSpent: number; // in seconds
  createdThisWeek: number;
  createdThisMonth: number;
  lastActivity: string;
  growthRate: number; // percentage
}

export interface TimeTrackingEntry {
  id: string;
  rpmId: string;
  startTime: string;
  endTime?: string;
  duration: number; // in seconds
  activity: 'generate' | 'edit' | 'view';
}

export class AnalyticsManager {
  private trackingKey = 'rpm_time_tracking';
  private analyticsKey = 'rpm_analytics_cache';

  getAnalytics(history: HistoryItem[]): AnalyticsData {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalBySubject: Record<string, number> = {};
    const totalByPhase: Record<string, number> = {};
    const totalByLearningMode: Record<string, number> = {};
    const totalByLearningModel: Record<string, number> = {};
    
    let createdThisWeek = 0;
    let createdThisMonth = 0;
    let lastActivity = '';

    history.forEach(item => {
      const itemDate = new Date(item.date);
      
      // Count by subject
      const subject = item.formData.subject || 'Unknown';
      totalBySubject[subject] = (totalBySubject[subject] || 0) + 1;
      
      // Count by phase
      const phase = item.formData.phase || 'Unknown';
      totalByPhase[phase] = (totalByPhase[phase] || 0) + 1;
      
      // Count by learning mode
      const mode = item.formData.learningMode || 'Unknown';
      totalByLearningMode[mode] = (totalByLearningMode[mode] || 0) + 1;
      
      // Count by learning model
      const model = item.formData.learningModel || 'Unknown';
      totalByLearningModel[model] = (totalByLearningModel[model] || 0) + 1;
      
      // Count time-based
      if (itemDate >= oneWeekAgo) createdThisWeek++;
      if (itemDate >= oneMonthAgo) createdThisMonth++;
      
      // Last activity
      if (!lastActivity || itemDate > new Date(lastActivity)) {
        lastActivity = item.date;
      }
    });

    // Find most used
    const mostUsedModel = Object.keys(totalByLearningModel).reduce((a, b) => 
      totalByLearningModel[a] > totalByLearningModel[b] ? a : b, 'N/A'
    );
    
    const mostUsedSubject = Object.keys(totalBySubject).reduce((a, b) => 
      totalBySubject[a] > totalBySubject[b] ? a : b, 'N/A'
    );

    // Calculate growth rate (week over week)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const createdLastWeek = history.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= twoWeeksAgo && itemDate < oneWeekAgo;
    }).length;
    
    const growthRate = createdLastWeek > 0 
      ? ((createdThisWeek - createdLastWeek) / createdLastWeek) * 100 
      : 0;

    // Get time tracking data
    const timeTracking = this.getTimeTracking();
    const totalTimeSpent = timeTracking.reduce((sum, entry) => sum + entry.duration, 0);
    const completedGenerations = timeTracking.filter(e => e.activity === 'generate' && e.endTime);
    const averageGenerationTime = completedGenerations.length > 0
      ? completedGenerations.reduce((sum, e) => sum + e.duration, 0) / completedGenerations.length
      : 0;

    return {
      totalRPM: history.length,
      totalBySubject,
      totalByPhase,
      totalByLearningMode,
      totalByLearningModel,
      averageGenerationTime,
      mostUsedModel,
      mostUsedSubject,
      totalTimeSpent,
      createdThisWeek,
      createdThisMonth,
      lastActivity,
      growthRate
    };
  }

  startTracking(rpmId: string, activity: 'generate' | 'edit' | 'view'): string {
    const entry: TimeTrackingEntry = {
      id: `track-${Date.now()}`,
      rpmId,
      startTime: new Date().toISOString(),
      duration: 0,
      activity
    };

    const tracking = this.getTimeTracking();
    tracking.push(entry);
    localStorage.setItem(this.trackingKey, JSON.stringify(tracking));

    return entry.id;
  }

  stopTracking(trackingId: string): void {
    const tracking = this.getTimeTracking();
    const entry = tracking.find(e => e.id === trackingId);
    
    if (entry && !entry.endTime) {
      entry.endTime = new Date().toISOString();
      entry.duration = (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 1000;
      localStorage.setItem(this.trackingKey, JSON.stringify(tracking));
    }
  }

  getTimeTracking(): TimeTrackingEntry[] {
    const stored = localStorage.getItem(this.trackingKey);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }

  clearOldTracking(daysToKeep: number = 30): void {
    const tracking = this.getTimeTracking();
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const filtered = tracking.filter(entry => 
      new Date(entry.startTime) >= cutoffDate
    );
    
    localStorage.setItem(this.trackingKey, JSON.stringify(filtered));
  }

  exportAnalyticsReport(analytics: AnalyticsData, format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2);
    } else {
      // CSV format
      let csv = 'Metric,Value\n';
      csv += `Total RPM,${analytics.totalRPM}\n`;
      csv += `Most Used Model,${analytics.mostUsedModel}\n`;
      csv += `Most Used Subject,${analytics.mostUsedSubject}\n`;
      csv += `Created This Week,${analytics.createdThisWeek}\n`;
      csv += `Created This Month,${analytics.createdThisMonth}\n`;
      csv += `Growth Rate,${analytics.growthRate.toFixed(2)}%\n`;
      csv += `Average Generation Time,${(analytics.averageGenerationTime / 60).toFixed(2)} minutes\n`;
      csv += `Total Time Spent,${(analytics.totalTimeSpent / 3600).toFixed(2)} hours\n`;
      csv += `Last Activity,${analytics.lastActivity}\n`;
      csv += '\nBy Subject\n';
      Object.entries(analytics.totalBySubject).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      csv += '\nBy Learning Model\n';
      Object.entries(analytics.totalByLearningModel).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      return csv;
    }
  }

  getChartData(analytics: AnalyticsData) {
    return {
      subjectData: Object.entries(analytics.totalBySubject).map(([name, value]) => ({
        name,
        value
      })),
      modelData: Object.entries(analytics.totalByLearningModel).map(([name, value]) => ({
        name: name.replace(/ \(.*\)/, ''), // Remove parentheses for cleaner display
        value
      })),
      modeData: Object.entries(analytics.totalByLearningMode).map(([name, value]) => ({
        name,
        value
      })),
      phaseData: Object.entries(analytics.totalByPhase).map(([name, value]) => ({
        name,
        value
      }))
    };
  }
}

export const analyticsManager = new AnalyticsManager();
