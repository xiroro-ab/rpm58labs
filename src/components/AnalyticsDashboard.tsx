import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Clock, Download, FileText, PieChart, Activity } from 'lucide-react';
import { HistoryItem } from '../types';
import { analyticsManager, AnalyticsData } from '../lib/analytics';
import toast from 'react-hot-toast';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

export function AnalyticsDashboard({ isOpen, onClose, history }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'charts' | 'time'>('overview');

  useEffect(() => {
    if (isOpen && history.length > 0) {
      const data = analyticsManager.getAnalytics(history);
      setAnalytics(data);
    }
  }, [isOpen, history]);

  const handleExport = (format: 'json' | 'csv') => {
    if (!analytics) return;
    
    const report = analyticsManager.exportAnalyticsReport(analytics, format);
    const blob = new Blob([report], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpm-analytics-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Analytics berhasil diekspor sebagai ${format.toUpperCase()}!`);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  const chartData = analytics ? analyticsManager.getChartData(analytics) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BarChart3 className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analytics Dashboard</h2>
              <p className="text-xs text-slate-500 mt-0.5">Insight & statistik penggunaan RPM</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => handleExport('csv')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-5">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              selectedTab === 'overview'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('charts')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              selectedTab === 'charts'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Charts & Graphs
          </button>
          <button
            onClick={() => setSelectedTab('time')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              selectedTab === 'time'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Time Tracking
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!analytics ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <FileText className="w-16 h-16 mb-4 opacity-20 mx-auto" />
                <p className="text-sm">Belum ada data analytics</p>
                <p className="text-xs mt-1">Generate RPM untuk melihat statistik</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <span className="text-xs font-semibold text-blue-600 bg-white px-2 py-1 rounded-full">Total</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{analytics.totalRPM}</p>
                      <p className="text-sm text-blue-700 mt-1">RPM Dibuat</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          analytics.growthRate >= 0 ? 'text-green-600 bg-white' : 'text-red-600 bg-white'
                        }`}>
                          {analytics.growthRate >= 0 ? '+' : ''}{analytics.growthRate.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{analytics.createdThisWeek}</p>
                      <p className="text-sm text-green-700 mt-1">Minggu Ini</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-8 h-8 text-purple-600" />
                        <span className="text-xs font-semibold text-purple-600 bg-white px-2 py-1 rounded-full">Avg</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-900">
                        {formatDuration(analytics.averageGenerationTime)}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">Waktu Generate</p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="w-8 h-8 text-orange-600" />
                        <span className="text-xs font-semibold text-orange-600 bg-white px-2 py-1 rounded-full">Total</span>
                      </div>
                      <p className="text-3xl font-bold text-orange-900">
                        {formatDuration(analytics.totalTimeSpent)}
                      </p>
                      <p className="text-sm text-orange-700 mt-1">Total Waktu</p>
                    </div>
                  </div>

                  {/* Most Used */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-3">Model Paling Sering Digunakan</h3>
                      <p className="text-2xl font-bold text-violet-600">{analytics.mostUsedModel}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {analytics.totalByLearningModel[analytics.mostUsedModel]} kali digunakan
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-3">Mata Pelajaran Terpopuler</h3>
                      <p className="text-2xl font-bold text-violet-600">{analytics.mostUsedSubject}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {analytics.totalBySubject[analytics.mostUsedSubject]} RPM dibuat
                      </p>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h3 className="font-semibold text-slate-800 mb-3">Aktivitas Terakhir</h3>
                    <p className="text-sm text-slate-600">
                      <Clock className="w-4 h-4 inline mr-2" />
                      {formatDate(analytics.lastActivity)}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Bulan Ini</p>
                        <p className="text-xl font-bold text-slate-800">{analytics.createdThisMonth} RPM</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Minggu Ini</p>
                        <p className="text-xl font-bold text-slate-800">{analytics.createdThisWeek} RPM</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Tab */}
              {selectedTab === 'charts' && chartData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* By Subject */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-violet-600" />
                        Berdasarkan Mata Pelajaran
                      </h3>
                      <div className="space-y-2">
                        {chartData.subjectData.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{item.value}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-violet-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(item.value / analytics.totalRPM) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Learning Model */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        Berdasarkan Model Pembelajaran
                      </h3>
                      <div className="space-y-2">
                        {chartData.modelData.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{item.value}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(item.value / analytics.totalRPM) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Learning Mode */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-green-600" />
                        Berdasarkan Moda Pembelajaran
                      </h3>
                      <div className="space-y-2">
                        {chartData.modeData.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{item.value}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(item.value / analytics.totalRPM) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Phase */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Berdasarkan Fase/Kelas
                      </h3>
                      <div className="space-y-2">
                        {chartData.phaseData.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-slate-700">{item.name}</span>
                                <span className="text-sm font-bold text-slate-900">{item.value}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div
                                  className="bg-orange-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(item.value / analytics.totalRPM) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Tracking Tab */}
              {selectedTab === 'time' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-5">
                    <h3 className="font-semibold text-slate-800 mb-3">Total Waktu Aktivitas</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Total Jam</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {(analytics.totalTimeSpent / 3600).toFixed(1)}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Rata-rata Generate</p>
                        <p className="text-2xl font-bold text-violet-600">
                          {(analytics.averageGenerationTime / 60).toFixed(1)}m
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Total RPM</p>
                        <p className="text-2xl font-bold text-violet-600">{analytics.totalRPM}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <h3 className="font-semibold text-slate-800 mb-3">Produktivitas</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">RPM per jam</span>
                        <span className="text-lg font-bold text-slate-800">
                          {analytics.totalTimeSpent > 0 
                            ? ((analytics.totalRPM / (analytics.totalTimeSpent / 3600)).toFixed(2))
                            : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Efficiency Score</span>
                        <span className="text-lg font-bold text-green-600">
                          {analytics.averageGenerationTime < 600 ? 'Excellent' : 
                           analytics.averageGenerationTime < 900 ? 'Good' : 'Average'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
