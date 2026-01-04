
import React, { useState, useCallback } from 'react';
import { 
  AgentType, 
  LogEntry, 
  ProjectAnalysis, 
  UpgradePlan, 
  UpgradeStatus, 
  VirtualFile,
  FileDiff 
} from './types';
import { INITIAL_MOCK_FILES, ICONS } from './constants';
import { analyzeProject, createUpgradeStrategy, executeMigrationCode, generateSimulatedPreview, generatePromptsFile } from './services/geminiService';
import { fetchGithubFile, fetchGithubTree } from './services/githubService';
import AgentStatusCard from './components/AgentStatusCard';
import Terminal from './components/Terminal';
import PlanOverview from './components/PlanOverview';
import CodeDiffViewer from './components/CodeDiffViewer';
import AppPreview from './components/AppPreview';
import { Play, RefreshCw, Github, ShieldAlert, Layout, Eye, CheckCircle, Key, FileText, AlertTriangle, Download, Archive, Terminal as TerminalIcon, Network, Book } from 'lucide-react';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/bezkoder/angular-11-crud-app');
  const [targetVersion, setTargetVersion] = useState('16.0.0');
  const [githubToken, setGithubToken] = useState<string>('');

  const [currentAgent, setCurrentAgent] = useState<AgentType>(AgentType.IDLE);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<VirtualFile[]>(INITIAL_MOCK_FILES);
  
  const [activeTab, setActiveTab] = useState<'diff' | 'preview'>('diff');
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isPlanOpen, setIsPlanOpen] = useState(true);
  
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [plan, setPlan] = useState<UpgradePlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewingStepIndex, setViewingStepIndex] = useState<number | null>(null);

  const [currentDiffs, setCurrentDiffs] = useState<FileDiff[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [currentPreviewVersion, setCurrentPreviewVersion] = useState('0.0.0');
  const [currentNodeVersion, setCurrentNodeVersion] = useState('0.0.0');
  const [isValidConfig, setIsValidConfig] = useState(true);

  const addLog = useCallback((agent: AgentType, message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      agent,
      message,
      type
    }]);
  }, []);

  const handleSetToken = () => {
    const token = window.prompt("Enter GitHub Personal Access Token (for private repos/higher rate limits):", githubToken);
    if (token !== null) setGithubToken(token);
  };

  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runScanner = async () => {
    setIsProcessing(true);
    setCurrentAgent(AgentType.SCANNER);
    setAnalysis(null);
    setPlan(null);
    addLog(AgentType.SCANNER, `Initiating full repository scan: ${repoUrl}`, 'info');

    try {
      const treePaths = await fetchGithubTree(repoUrl, githubToken);
      if (treePaths.length === 0) throw new Error("Repository appears empty or unreachable.");

      addLog(AgentType.SCANNER, `Found ${treePaths.length} source files.`, 'success');
      
      const criticalFiles = ['package.json', 'angular.json', 'src/main.ts', 'src/app/app.module.ts'];
      const filesToFetch = treePaths.filter(p => criticalFiles.some(cf => p.includes(cf))).slice(0, 10);
      
      const newFiles: VirtualFile[] = [];
      for (const path of filesToFetch) {
        const content = await fetchGithubFile(repoUrl, path, githubToken);
        if (content) newFiles.push({ path, content });
      }
      setFiles(newFiles);
      
      const pkgJson = newFiles.find(f => f.path === 'package.json');
      if (!pkgJson) throw new Error("package.json not found.");

      const result = await analyzeProject(repoUrl, pkgJson.content);
      setAnalysis(result);
      addLog(AgentType.SCANNER, `Analysis complete. Angular v${result.angularVersion}`, 'success');
      
      // Node Switch Logic
      const nodeVer = result.nodeVersion || "18.13.0";
      addLog(AgentType.EXECUTOR, `Environment Setup: Switching to Node.js ${nodeVer}...`, 'command');
      await wait(800);
      setCurrentNodeVersion(nodeVer);
      addLog(AgentType.EXECUTOR, `Node ${nodeVer} is now active.`, 'success');
      
      setCurrentAgent(AgentType.QA);
      addLog(AgentType.QA, `Compiling source code for initial preview...`, 'info');
      const html = await generateSimulatedPreview(newFiles, result.angularVersion, nodeVer);
      setPreviewContent(html);
      setCurrentPreviewVersion(result.angularVersion);
      setActiveTab('preview');
      
      runStrategist(result);
    } catch (error) {
      addLog(AgentType.SCANNER, `Error: ${(error as Error).message}`, 'error');
      setIsProcessing(false);
      setCurrentAgent(AgentType.IDLE);
    }
  };

  const runStrategist = async (analysisData: ProjectAnalysis) => {
    setCurrentAgent(AgentType.STRATEGIST);
    try {
      const result = await createUpgradeStrategy(analysisData, targetVersion);
      setPlan(result);
      addLog(AgentType.STRATEGIST, `Upgrade plan ready: ${result.steps.length} steps.`, 'success');
      setIsProcessing(false);
      setCurrentAgent(AgentType.IDLE);
    } catch (error) {
      addLog(AgentType.STRATEGIST, `Failed: ${(error as Error).message}`, 'error');
      setIsProcessing(false);
      setCurrentAgent(AgentType.IDLE);
    }
  };

  const executeStep = async (stepIndex: number) => {
    if (!plan) return;
    const step = plan.steps[stepIndex];
    setIsProcessing(true);
    setCurrentStepIndex(stepIndex);
    setCurrentAgent(AgentType.EXECUTOR);

    try {
        const nodeVer = step.nodeVersionRequired || "18.13.0";
        addLog(AgentType.EXECUTOR, `Step ${stepIndex + 1}: v${step.fromVersion} -> v${step.toVersion}`, 'info');
        
        // Node Install Verification
        addLog(AgentType.EXECUTOR, `Switching to required Node.js ${nodeVer}...`, 'command');
        await wait(500);
        setCurrentNodeVersion(nodeVer);
        addLog(AgentType.EXECUTOR, `Environment ready with Node.js ${nodeVer}.`, 'success');

        const stepFileChanges: FileDiff[] = [];
        const updatedFiles = [...files];

        for (const file of updatedFiles) {
            if (!file.path.endsWith('.ts') && !file.path.endsWith('.html') && file.path !== 'package.json') continue;
            
            const newContent = await executeMigrationCode(file.path, file.content, step.fromVersion, step.toVersion);
            if (newContent !== file.content) {
                stepFileChanges.push({ fileName: file.path, originalContent: file.content, modifiedContent: newContent });
                file.content = newContent;
            }
        }
        
        setFiles(updatedFiles);
        setCurrentDiffs(stepFileChanges);
        
        setCurrentAgent(AgentType.QA);
        addLog(AgentType.QA, `Building updated app (Angular v${step.toVersion}) with Node ${nodeVer}...`, 'info');
        const buildOutput = await generateSimulatedPreview(updatedFiles, step.toVersion, nodeVer);
        
        setPreviewContent(buildOutput);
        setCurrentPreviewVersion(step.toVersion);
        setActiveTab('preview');
        
        const newPlan = { ...plan };
        newPlan.steps[stepIndex].status = UpgradeStatus.WAITING_CONFIRMATION;
        setPlan(newPlan);
        setIsProcessing(false);
        setCurrentAgent(AgentType.IDLE);
    } catch (error) {
        addLog(AgentType.EXECUTOR, `Step Failed: ${(error as Error).message}`, 'error');
        setIsProcessing(false);
        setCurrentAgent(AgentType.IDLE);
    }
  };

  const startMigration = () => {
      const nextStep = plan?.steps.findIndex(s => s.status === UpgradeStatus.PENDING) ?? 0;
      executeStep(nextStep);
  };

  const handleConfirmStep = () => {
      if (!plan) return;
      const newPlan = { ...plan };
      newPlan.steps[currentStepIndex].status = UpgradeStatus.SUCCESS;
      setPlan(newPlan);
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < newPlan.steps.length) executeStep(nextIndex);
  };

  const isPlanReady = plan && plan.steps.length > 0;
  const isMigrationComplete = isPlanReady && plan?.steps.every(s => s.status === UpgradeStatus.SUCCESS);
  const currentStep = plan?.steps[currentStepIndex];
  const isWaitingConfirmation = currentStep?.status === UpgradeStatus.WAITING_CONFIRMATION;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-4 md:p-8 flex flex-col font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">NgUpgrade AI Agent</h1>
          <p className="text-gray-500 mt-1">Multi-Agent Version Upgrade System</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
           <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
               <button onClick={() => setIsTerminalOpen(!isTerminalOpen)} className={`p-1.5 rounded ${isTerminalOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><TerminalIcon size={18} /></button>
               <button onClick={() => setIsPlanOpen(!isPlanOpen)} className={`p-1.5 rounded ${isPlanOpen ? 'bg-purple-50 text-purple-600' : 'text-gray-400'}`}><Network size={18} /></button>
           </div>
           <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <Github size={18} className="text-gray-400 ml-2" />
              <input type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} className="bg-transparent border-none outline-none text-sm w-48 md:w-64" placeholder="GitHub URL" />
              <button onClick={handleSetToken} className={`p-1 rounded ${githubToken ? 'text-emerald-600' : 'text-gray-400'}`} title="Set Token"><Key size={16} /></button>
           </div>
           {!isPlanReady ? (
             <button onClick={runScanner} disabled={isProcessing} className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm">
               {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />} Start Analysis
             </button>
           ) : isWaitingConfirmation ? (
             <button onClick={handleConfirmStep} className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-amber-500 hover:bg-amber-400 text-white animate-pulse">
               <CheckCircle size={18} /> Confirm Step
             </button>
           ) : (
             <button onClick={startMigration} disabled={isProcessing || isMigrationComplete} className="flex items-center gap-2 px-6 py-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-500 text-white">
               {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />} {isMigrationComplete ? 'Upgrade Complete' : 'Execute Migration'}
             </button>
           )}
        </div>
      </header>

      <AgentStatusCard currentAgent={currentAgent} isProcessing={isProcessing} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-300px)] min-h-[600px]">
        {isTerminalOpen && <div className="lg:col-span-4 h-full"><Terminal logs={logs} /></div>}
        {isPlanOpen && <div className="lg:col-span-3 h-full"><PlanOverview plan={plan} currentStepIndex={currentStepIndex} onStepClick={(idx) => { setCurrentStepIndex(idx); setViewingStepIndex(idx); }} /></div>}
        <div className={`flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-${(isTerminalOpen && isPlanOpen) ? 5 : (isTerminalOpen || isPlanOpen) ? 8 : 12}`}>
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button onClick={() => setActiveTab('diff')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'diff' ? 'bg-white text-blue-600 border-b-2 border-blue-500' : 'text-gray-500'}`}>CHANGES</button>
            <button onClick={() => setActiveTab('preview')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'preview' ? 'bg-white text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500'}`}>SANDBOX PREVIEW</button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'diff' ? <CodeDiffViewer diffs={viewingStepIndex !== null ? (plan?.steps[viewingStepIndex].fileChanges || []) : currentDiffs} nodeVersion={currentNodeVersion} /> : <AppPreview htmlContent={previewContent} version={currentPreviewVersion} nodeVersion={currentNodeVersion} onVerify={handleConfirmStep} canVerify={isWaitingConfirmation} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
