import { VersionHistory } from '../types';

export class VersionControlManager {
  private maxVersions = 50;
  
  saveVersion(historyId: string, content: string, label?: string): VersionHistory {
    const version: VersionHistory = {
      id: `${historyId}-v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      content,
      label
    };
    
    const versions = this.getVersions(historyId);
    versions.unshift(version);
    
    if (versions.length > this.maxVersions) {
      versions.splice(this.maxVersions);
    }
    
    localStorage.setItem(`rpm_versions_${historyId}`, JSON.stringify(versions));
    return version;
  }
  
  getVersions(historyId: string): VersionHistory[] {
    const stored = localStorage.getItem(`rpm_versions_${historyId}`);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  
  getVersion(historyId: string, versionId: string): VersionHistory | null {
    const versions = this.getVersions(historyId);
    return versions.find(v => v.id === versionId) || null;
  }
  
  deleteVersion(historyId: string, versionId: string): void {
    const versions = this.getVersions(historyId);
    const filtered = versions.filter(v => v.id !== versionId);
    localStorage.setItem(`rpm_versions_${historyId}`, JSON.stringify(filtered));
  }
  
  clearVersions(historyId: string): void {
    localStorage.removeItem(`rpm_versions_${historyId}`);
  }
  
  compareVersions(content1: string, content2: string): { added: number; removed: number } {
    const len1 = content1.length;
    const len2 = content2.length;
    return {
      added: Math.max(0, len2 - len1),
      removed: Math.max(0, len1 - len2)
    };
  }
}

export const versionControl = new VersionControlManager();
