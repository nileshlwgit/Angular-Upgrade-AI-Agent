
import { GoogleGenAI, Type } from "@google/genai";
import { ProjectAnalysis, UpgradePlan, UpgradeStep, UpgradeStatus, VirtualFile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to strip markdown code blocks and extract pure content
const cleanResponseText = (text: string): string => {
  if (!text) return "";
  // Check for markdown code blocks using a regex that captures content inside backticks
  const codeBlockRegex = /```(?:json|html|typescript|ts|js|css|scss)?\n([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  if (match) {
    return match[1].trim();
  }
  // Fallback cleanup
  return text.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim();
};

// Helper to infer Node version if AI misses it
const inferNodeVersion = (angularVersion: string): string => {
  if (!angularVersion) return '18.13.0';
  const cleanVer = angularVersion.replace(/[^0-9\.]/g, '');
  const major = parseInt(cleanVer.split('.')[0] || '0', 10);

  if (major <= 9) return '10.13.0';
  if (major <= 12) return '12.14.0';
  if (major === 13) return '16.10.0';
  if (major === 14) return '16.13.0';
  if (major === 15) return '18.10.0';
  if (major === 16) return '18.13.0';
  if (major === 17) return '18.19.0';
  if (major >= 18) return '20.9.0';
  
  return '18.13.0'; // Safe default
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 4, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        const errMsg = (error as Error).message;
        const isTransient = 
            errMsg.includes('500') || 
            errMsg.includes('xhr error') || 
            errMsg.includes('ProxyUnaryCall') ||
            errMsg.includes('DEADLINE_EXCEEDED');

        if (isTransient && retries > 0) {
            console.warn(`Transient API error detected. Retrying in ${delay}ms... (${retries} left). Error: ${errMsg}`);
            await new Promise(res => setTimeout(res, delay));
            return callWithRetry(fn, retries - 1, delay * 1.5);
        }
        throw error;
    }
}

// ----------------------------------------------------------------------
// PROMPT TEMPLATES
// ----------------------------------------------------------------------
export const PROMPT_TEMPLATES = {
  SCANNER: (repoUrl: string, fileContent: string) => `
    You are an expert Angular Repository Scanner.
    Analyze the following package.json content from the repository ${repoUrl}.
    
    CRITICAL:
    1. Look specifically for "@angular/core" version.
    2. Extract the numeric version. 
    3. Infer the Node version based on the Angular version found.
    4. Categorize dependencies.
    
    File Content:
    ${fileContent}
  `,

  STRATEGIST: (currentVer: string, targetVer: string, dependencies: string, customizations: string) => `
    You are a Senior Angular Architect.
    Current Angular Version: ${currentVer}
    Target Angular Version: ${targetVer}
    Current Dependencies: ${dependencies}
    
    Create a precise, step-by-step upgrade plan.
    Each step must specify the required Node.js version.
    Your plan should contain an array of steps.
  `,

  EXECUTOR: (fileName: string, fromVer: string, toVer: string, fileContent: string) => `
    Upgrade the following Angular file "${fileName}" from v${fromVer} to v${toVer}.
    Apply new syntax (standalone components, signals, control flow if v14+ to v17+).
    RETURN ONLY THE NEW CODE. NO MARKDOWN.
    
    File Content:
    ${fileContent}
  `,

  SIMULATOR: (angularVersion: string, nodeVersion: string, contextContent: string) => `
        Act as an Angular Runtime Simulator (ng serve). 
        Return ONLY the raw HTML body content.
        Angular: ${angularVersion}, Node: ${nodeVersion}
        
        Files:
        ${contextContent}
    `
};

export const generatePromptsFile = (): string => {
    return `# NgUpgrade AI Agent - System Prompts\n\n(Generated version snapshot)`;
};

export const analyzeProject = async (repoUrl: string, mockFileContent: string): Promise<ProjectAnalysis> => {
  return callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: PROMPT_TEMPLATES.SCANNER(repoUrl, mockFileContent),
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              angularVersion: { type: Type.STRING },
              nodeVersion: { type: Type.STRING },
              dependencies: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, currentVersion: { type: Type.STRING }, isDev: { type: Type.BOOLEAN } } } },
              customizations: { type: Type.ARRAY, items: { type: Type.STRING } },
              complexityScore: { type: Type.NUMBER }
            },
            required: ["angularVersion"]
          }
        }
      });

      const cleanText = cleanResponseText(response.text || "{}");
      const result = JSON.parse(cleanText);
      const nodeVer = result.nodeVersion || inferNodeVersion(result.angularVersion);

      return {
        ...result,
        nodeVersion: nodeVer,
        dependencies: Array.isArray(result.dependencies) ? result.dependencies : [],
        customizations: Array.isArray(result.customizations) ? result.customizations : []
      };
  });
};

export const createUpgradeStrategy = async (analysis: ProjectAnalysis, targetVersion: string): Promise<UpgradePlan> => {
  return callWithRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: PROMPT_TEMPLATES.STRATEGIST(analysis.angularVersion, targetVersion, JSON.stringify(analysis.dependencies.slice(0, 5)), analysis.customizations.join(', ')),
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepId: { type: Type.INTEGER },
                    fromVersion: { type: Type.STRING },
                    toVersion: { type: Type.STRING },
                    nodeVersionRequired: { type: Type.STRING },
                    description: { type: Type.STRING },
                    commands: { type: Type.ARRAY, items: { type: Type.STRING } },
                    breakingChanges: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              estimatedDuration: { type: Type.STRING },
              riskLevel: { type: Type.STRING }
            }
          }
        }
      });

      const plan = JSON.parse(cleanResponseText(response.text || "{}"));
      const sanitizedSteps = (plan.steps || []).map((step: any) => ({
          ...step,
          nodeVersionRequired: step.nodeVersionRequired || inferNodeVersion(step.toVersion),
          status: UpgradeStatus.PENDING
      }));

      return { ...plan, steps: sanitizedSteps };
  });
};

export const executeMigrationCode = async (fileName: string, fileContent: string, fromVer: string, toVer: string): Promise<string> => {
  return callWithRetry(async () => {
    // Use gemini-2.5-flash for code transformations - it is significantly more stable for bulk XHR calls
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: PROMPT_TEMPLATES.EXECUTOR(fileName, fromVer, toVer, fileContent),
        config: {
            maxOutputTokens: 8000, // Safety limit to avoid truncated responses or proxy errors
            thinkingConfig: { thinkingBudget: 0 } // Disable thinking for pure code transform
        }
    });
    return cleanResponseText(response.text || fileContent);
  });
};

export const generateSimulatedPreview = async (files: VirtualFile[], angularVersion: string, nodeVersion: string): Promise<string> => {
    return callWithRetry(async () => {
        const contextContent = files.slice(0, 15).map(f => `--- ${f.path} ---\n${f.content}\n`).join('\n');
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: PROMPT_TEMPLATES.SIMULATOR(angularVersion, nodeVersion, contextContent),
        });
        return cleanResponseText(response.text || "");
    });
};
