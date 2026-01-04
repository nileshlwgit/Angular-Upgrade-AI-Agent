import { Type } from '@google/genai';

export enum AgentType {
  SCANNER = 'SCANNER',
  STRATEGIST = 'STRATEGIST',
  EXECUTOR = 'EXECUTOR',
  QA = 'QA',
  IDLE = 'IDLE'
}

export enum UpgradeStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  agent: AgentType;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'command';
}

export interface Dependency {
  name: string;
  currentVersion: string;
  targetVersion?: string;
  isDev: boolean;
}

export interface ProjectAnalysis {
  angularVersion: string;
  nodeVersion: string;
  dependencies: Dependency[];
  customizations: string[];
  complexityScore: number; // 1-10
}

export interface FileDiff {
  fileName: string;
  originalContent: string;
  modifiedContent: string;
}

export interface UpgradeStep {
  stepId: number;
  fromVersion: string;
  toVersion: string;
  nodeVersionRequired: string;
  description: string;
  commands: string[];
  breakingChanges: string[];
  status: UpgradeStatus;
  fileChanges?: FileDiff[];
}

export interface UpgradePlan {
  steps: UpgradeStep[];
  estimatedDuration: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

// Mock file system structure for the sandbox
export interface VirtualFile {
  path: string;
  content: string;
}