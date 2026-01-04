
interface GithubResponse {
  content: string;
  encoding: string;
}

interface GithubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

interface GithubTreeResponse {
  sha: string;
  url: string;
  tree: GithubTreeItem[];
  truncated: boolean;
}

const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleaned = url.replace(/\/$/, ''); // Remove trailing slash
    const parts = cleaned.split('/');
    const repo = parts.pop();
    const owner = parts.pop();
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch (e) {
    return null;
  }
};

const getHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json'
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
};

const getStatusText = (status: number, originalText?: string): string => {
    if (originalText && originalText !== 'OK' && originalText !== '') return originalText;
    switch (status) {
        case 401: return 'Unauthorized';
        case 403: return 'Forbidden (Rate Limit Exceeded)';
        case 404: return 'Not Found';
        case 500: return 'Internal Server Error';
        default: return 'Unknown Error';
    }
};

const handleGithubError = async (response: Response, context: string) => {
    let errorBody = '';
    try {
        errorBody = await response.text();
    } catch (e) {
        errorBody = '{ "message": "Could not read error body" }';
    }

    const status = response.status;
    const statusText = getStatusText(status, response.statusText);
    
    // Construct a specific message for known critical errors
    if (status === 403) {
        throw new Error(`Rate Limit Exceeded (403). Please set a GitHub Token using the Key icon.`);
    }
    if (status === 401) {
        throw new Error(`Authentication Failed (401). Please check your GitHub Token.`);
    }
    if (status === 404) {
        throw new Error(`Repository or File Not Found (404). Check URL or permissions.`);
    }

    // For other errors, log to console and throw generic
    const msg = `GitHub API Error ${status} (${context}): ${statusText} - ${errorBody}`;
    console.error(msg);
    throw new Error(`GitHub API Error ${status}: ${statusText}`);
};

export const fetchGithubFile = async (repoUrl: string, filePath: string, token?: string): Promise<string | null> => {
  const repoInfo = parseRepoUrl(repoUrl);
  if (!repoInfo) {
    console.error("Invalid GitHub URL format");
    return null;
  }

  const apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${filePath}`;

  try {
    const response = await fetch(apiUrl, { headers: getHeaders(token) });
    
    if (!response.ok) {
        // For 404 on individual files, we just return null (skip file) instead of throwing
        if (response.status === 404) {
            console.warn(`File skipped (404): ${filePath}`);
            return null;
        }
        await handleGithubError(response, `Fetching ${filePath}`);
    }

    const data: GithubResponse = await response.json();
    if (data.encoding === 'base64') {
      return atob(data.content);
    }
    return null;
  } catch (error) {
    // Re-throw if it's one of our typed errors, otherwise return null for generic fetch failures
    if ((error as Error).message.includes('Rate Limit') || (error as Error).message.includes('Authentication')) {
        throw error;
    }
    console.warn(`Failed to fetch ${filePath}:`, error);
    return null;
  }
};

export const fetchGithubTree = async (repoUrl: string, token?: string): Promise<string[]> => {
  const repoInfo = parseRepoUrl(repoUrl);
  if (!repoInfo) return [];

  const headers = getHeaders(token);

  try {
    // 1. Get Repo Details to find default branch
    const repoResp = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`, { headers });
    
    if (!repoResp.ok) {
        await handleGithubError(repoResp, 'Repo Details');
    }
    
    const repoData = await repoResp.json();
    const defaultBranch = repoData.default_branch || 'main';

    // 2. Fetch Tree Recursively
    const treeUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${defaultBranch}?recursive=1`;
    const treeResp = await fetch(treeUrl, { headers });
    
    if (!treeResp.ok) {
        await handleGithubError(treeResp, 'File Tree');
    }
    
    const treeData: GithubTreeResponse = await treeResp.json();
    
    if (treeData.truncated) {
        console.warn("Repo is too large, file tree truncated by GitHub.");
    }
    
    const relevantExtensions = ['.ts', '.html', '.scss', '.css', '.json'];
    
    return treeData.tree
      .filter(item => 
        item.type === 'blob' && 
        relevantExtensions.some(ext => item.path.endsWith(ext)) &&
        !item.path.includes('node_modules') &&
        !item.path.includes('dist/') &&
        !item.path.includes('coverage/') &&
        !item.path.includes('.spec.ts') && 
        !item.path.includes('test.ts')
      )
      .map(item => item.path);

  } catch (error) {
    // If it's a critical auth error, propagate it without extra logging
    const errMsg = (error as Error).message;
    if (errMsg.includes('Rate Limit') || errMsg.includes('Authentication')) {
        throw error;
    }
    console.error("Error fetching file tree:", error);
    return [];
  }
};
