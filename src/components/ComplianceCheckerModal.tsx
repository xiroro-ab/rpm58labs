import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle, Lightbulb, Shield } from 'lucide-react';
import { complianceChecker, ComplianceReport } from '../lib/complianceChecker';
import toast from 'react-hot-toast';

interface ComplianceCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  formPhase: string;
}

export function ComplianceCheckerModal({ isOpen, onClose, htmlContent, formPhase }: ComplianceCheckerModalProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);

  const handleCheck = () => {
    if (!htmlContent) {
      toast.error('Tidak ada konten untuk diperiksa');
      return;
    }

    try {
      const result = complianceChecker.checkCompliance(htmlContent, formPhase);
      setReport(result);
      toast.success(`Skor kepatuhan: ${result.score}%`);
    } catch (error: any) {
      toast.error('Gagal memeriksa kepatuhan: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Curriculum Compliance Checker</h2>
              <p className="text-xs text-slate-500 mt-0.5">Validasi standar Kurikulum Merdeka</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {!report ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Shield className="w-16 h-16 mb-4 opacity-20 mx-auto" />
                <p className="text-sm">Dokumen siap diperiksa</p>
                <p className="text-xs mt-2">Sistem akan memeriksa semua komponen yang diperlukan</p>
                <button
                  onClick={handleCheck}
                  className="mt-6 flex items-center gap-2 px-5 py-3 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors shadow-md mx-auto"
                >
                  <Shield className="w-4 h-4" />
                  Periksa Kepatuhan
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className={`rounded-xl p-6 border-2 ${complianceChecker.getGradeBg(report.score)}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Skor Kepatuhan</h3>
                    <p className="text-sm text-slate-600">Berdasarkan standar Kurikulum Merdeka</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-4xl font-extrabold ${complianceChecker.getGradeColor(report.score)}`}>
                      {report.score}%
                    </p>
                    <p className={`text-xs font-semibold ${complianceChecker.getGradeColor(report.score)}`}>
                      {complianceChecker.getGradeLabel(report.score)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-white/50 rounded-full h-3 mb-4">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      report.score >= 80 ? 'bg-green-500' : report.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${report.score}%` }}
                  />
                </div>

                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(report.overallStatus)}
                  <span className={`font-semibold ${
                    report.overallStatus === 'pass' ? 'text-green-700' :
                    report.overallStatus === 'warning' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {report.overallStatus === 'pass' ? 'LULUS - Dokumen memenuhi standar' :
                     report.overallStatus === 'warning' ? 'PERHATIAN - Beberapa komponen kurang' :
                     'TIDAK LULUS - Banyak komponen belum terpenuhi'}
                  </span>
                </div>
              </div>

              {/* Sections Breakdown */}
              <div className="space-y-4">
                {report.sections.map((section, index) => (
                  <div key={index} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(section.status)}
                        <h4 className="font-semibold text-slate-800">{section.name}</h4>
                      </div>
                      <span className={`text-sm font-bold ${
                        section.score >= 80 ? 'text-green-600' :
                        section.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {section.score}%
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 flex-1">
                            {item.present ? (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                            <span className={`text-sm ${item.present ? 'text-slate-700' : 'text-slate-400'}`}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!item.present && item.suggestion && (
                              <div className="group relative">
                                <Lightbulb className="w-4 h-4 text-amber-500 cursor-help" />
                                <div className="absolute right-0 top-6 w-64 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                  {item.suggestion}
                                </div>
                              </div>
                            )}
                            <span className="text-[10px] text-slate-400 w-8 text-right">
                              x{item.weight}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {report.suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    <h4 className="font-semibold text-slate-800">Saran Perbaikan</h4>
                  </div>
                  <ul className="space-y-2">
                    {report.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Elements Summary */}
              {report.missingElements.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    {report.missingElements.length} Komponen Belum Terpenuhi
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {report.missingElements.map((elem, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-md">
                        {elem}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
