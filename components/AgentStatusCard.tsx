import React from 'react';
import { AGENT_CONFIG } from '../constants';
import { AgentType } from '../types';

interface AgentStatusCardProps {
  currentAgent: AgentType;
  isProcessing: boolean;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ currentAgent, isProcessing }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Object.values(AgentType).filter(type => type !== AgentType.IDLE).map((type) => {
        const config = AGENT_CONFIG[type];
        const isActive = currentAgent === type;
        const Icon = config.icon;

        return (
          <div 
            key={type}
            className={`
              relative p-4 rounded-xl border transition-all duration-300
              ${isActive 
                ? `${config.bgColor} ${config.borderColor} shadow-lg shadow-gray-200` 
                : 'bg-white border-gray-200 opacity-60'}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-white/80' : 'bg-gray-100'} ${config.color}`}>
                <Icon size={20} />
              </div>
              <h3 className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {config.name}
              </h3>
            </div>
            <p className="text-xs text-gray-500 h-8 overflow-hidden">
              {config.description}
            </p>
            {isActive && isProcessing && (
              <div className="absolute top-2 right-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color.replace('text-', 'bg-').replace('600', '400')}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${config.color.replace('text-', 'bg-').replace('600', '500')}`}></span>
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AgentStatusCard;