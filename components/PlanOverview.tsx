import React from 'react';
import { UpgradePlan, UpgradeStatus } from '../types';
import { AlertTriangle, RotateCcw, Hourglass, FileText } from 'lucide-react';

interface PlanOverviewProps {
  plan: UpgradePlan | null;
  currentStepIndex: number;
  onStepClick?: (index: number) => void;
}

const PlanOverview: React.FC<PlanOverviewProps> = ({ plan, currentStepIndex, onStepClick }) => {
  if (!plan || !plan.steps) return (
    <div className="h-full flex items-center justify-center border border-gray-200 rounded-xl bg-white text-gray-400 p-8 text-center">
      <p>No upgrade strategy generated yet.<br/>Run the Scanner to begin.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-bold text-gray-800">Upgrade Path Strategy</h3>
          <span className={`text-xs px-2 py-0.5 rounded border ${
            plan.riskLevel === 'High' ? 'border-red-200 bg-red-50 text-red-700' :
            plan.riskLevel === 'Medium' ? 'border-amber-200 bg-amber-50 text-amber-700' :
            'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>Risk: {plan.riskLevel}</span>
        </div>
        <div className="text-xs text-gray-500">Est. Duration: {plan.estimatedDuration}</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        {plan.steps.map((step, idx) => {
          const isCompleted = step.status === UpgradeStatus.SUCCESS;
          const isCurrent = step.status === UpgradeStatus.IN_PROGRESS;
          const isWaiting = step.status === UpgradeStatus.WAITING_CONFIRMATION;
          const isFailed = step.status === UpgradeStatus.FAILED;
          const isRolledBack = step.status === UpgradeStatus.ROLLED_BACK;
          const hasDiffs = step.fileChanges && step.fileChanges.length > 0;

          let borderColor = 'border-gray-200';
          let nodeColor = 'border-gray-200 bg-gray-100';
          
          if (isCurrent) { borderColor = 'border-blue-500'; nodeColor = 'border-blue-500 bg-white'; }
          else if (isWaiting) { borderColor = 'border-amber-500'; nodeColor = 'border-amber-500 bg-white'; }
          else if (isCompleted) { borderColor = 'border-emerald-500'; nodeColor = 'border-emerald-500 bg-emerald-500'; }
          else if (isFailed) { borderColor = 'border-red-500'; nodeColor = 'border-red-500 bg-red-500'; }
          else if (isRolledBack) { borderColor = 'border-orange-500'; nodeColor = 'border-orange-500 bg-orange-100'; }

          return (
            <div 
              key={step.stepId}
              onClick={() => onStepClick && onStepClick(idx)}
              className={`
                relative pl-6 border-l-2 ${borderColor} pb-6 last:pb-0 transition-colors duration-300 cursor-pointer group
                ${isCurrent || isWaiting ? 'bg-blue-50/50 -ml-2 pl-8 rounded-r pr-2 py-2 mb-2' : ''}
              `}
            >
              <div className={`absolute ${isCurrent || isWaiting ? '-left-[1px]' : '-left-[9px]'} top-0 w-4 h-4 rounded-full border-2 ${nodeColor} flex items-center justify-center`}>
                 {isCompleted && <div className="w-2 h-2 bg-white rounded-full" />}
                 {isRolledBack && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                 {isCurrent && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                 {isWaiting && <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h4 className={`text-sm font-bold ${
                    isCurrent ? 'text-blue-700' : 
                    isWaiting ? 'text-amber-700' :
                    isRolledBack ? 'text-orange-700' :
                    isCompleted ? 'text-emerald-700' : 'text-gray-700'
                }`}>
                   v{step.fromVersion} &rarr; v{step.toVersion}
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 border border-gray-200">
                  Node {step.nodeVersionRequired || '?'}
                </span>
                {isRolledBack && (
                    <span className="flex items-center gap-1 text-[10px] text-orange-700 font-bold ml-auto border border-orange-200 px-1 rounded bg-orange-50">
                        <RotateCcw size={10} /> Rolled Back
                    </span>
                )}
                {isWaiting && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-700 font-bold ml-auto border border-amber-200 px-1 rounded bg-amber-50 animate-pulse">
                        <Hourglass size={10} /> Confirm
                    </span>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mb-2">{step.description}</p>
              
              {hasDiffs && (
                 <div className="flex items-center gap-1 text-[10px] text-blue-500/80 group-hover:text-blue-600 transition-colors">
                    <FileText size={10} /> View stored diffs
                 </div>
              )}

              {step.breakingChanges && step.breakingChanges.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                  <div className="flex items-center gap-1 text-amber-700 text-[10px] font-bold mb-1">
                    <AlertTriangle size={10} /> Breaking Changes
                  </div>
                  <ul className="list-disc list-inside text-[10px] text-amber-800/80">
                    {step.breakingChanges.map((bc, i) => <li key={i}>{bc}</li>)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanOverview;