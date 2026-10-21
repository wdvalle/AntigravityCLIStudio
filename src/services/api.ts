import { AgyModelInfo, AgySettings } from '../types/agy';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      selectDirectory: () => Promise<string | null>;
      getBackendUrl: () => Promise<string>;
      openExternal?: (url: string) => Promise<void>;
      openPath?: (path: string) => Promise<void>;
    };
  }
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'http://127.0.0.1:4747';
  }
  return 'http://127.0.0.1:4747';
}

async function requestJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const base = getBaseUrl();
  const url = `${base}${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP ${res.status}`);
  }
  return res.json();
}

export const agyApi = {
  getStatus: () =>
    requestJson<{
      ok: boolean;
      platform: string;
      arch: string;
      agyBinary: string;
      settingsPath: string;
      dataDir: string;
      cwd: string;
      activeRuns: string[];
      settings: AgySettings;
    }>('/api/status'),

  getConfig: () => requestJson<AgySettings>('/api/config'),

  saveConfig: (patch: Partial<AgySettings>) =>
    requestJson<{ ok: boolean; settings: AgySettings }>('/api/config', {
      method: 'POST',
      body: JSON.stringify(patch),
    }),

  // Projects (~/.gemini/config/projects/)
  getProjects: () => requestJson<{ projects: any[] }>('/api/projects'),

  createProject: (payload: {
    name: string;
    folderPath: string;
    settings?: any;
    permissionPolicy?: string;
  }) =>
    requestJson<{ ok: boolean; project: any }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getProject: (id: string) => requestJson<{ project: any }>(`/api/projects/${encodeURIComponent(id)}`),

  updateProject: (id: string, patch: any) =>
    requestJson<{ ok: boolean; project: any }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    }),

  deleteProject: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  getModels: () => requestJson<{ models: AgyModelInfo[] }>('/api/models'),

  getConversations: () => requestJson<{ conversations: any[] }>('/api/conversations'),

  getConversationDetail: (id: string) =>
    requestJson<{ steps: any[]; artifacts: any[] }>(`/api/conversations/${encodeURIComponent(id)}`),

  getSkills: (workspace?: string) =>
    requestJson<{ skills: any[] }>(
      `/api/skills${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`
    ),

  getMcpServers: () =>
    requestJson<{ servers: any[]; cliOutput: string }>('/api/mcp'),

  runMcpAction: (payload: { action: string; name?: string; command?: string; args?: string[] }) =>
    requestJson<{ stdout: string; stderr: string; code: number }>('/api/mcp/action', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPlugins: () =>
    requestJson<{ output: string; code: number }>('/api/plugins'),

  runPluginAction: (payload: { action: string; target?: string }) =>
    requestJson<{ stdout: string; stderr: string; code: number }>('/api/plugins/action', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAgents: () =>
    requestJson<{ output: string; code: number }>('/api/agents'),

  runRemoteControl: (subcommand: 'status' | 'start' | 'stop') =>
    requestJson<{ stdout: string; stderr: string; code: number }>('/api/remote-control', {
      method: 'POST',
      body: JSON.stringify({ subcommand }),
    }),

  getChangelog: () =>
    requestJson<{ changelog: string }>('/api/changelog'),

  getWorkspaceFiles: (workspace: string) =>
    requestJson<{ workspace: string; files: string[] }>(
      `/api/workspace/files?workspace=${encodeURIComponent(workspace)}`
    ),

  getWorkspaceDiff: (workspace: string) =>
    requestJson<{ branch: string; status: string; diff: string }>(
      `/api/workspace/diff?workspace=${encodeURIComponent(workspace)}`
    ),

  getHistory: () =>
    requestJson<{ history: any[] }>('/api/history'),

  execCli: (args: string[], workspace?: string) =>
    requestJson<{ stdout: string; stderr: string; code: number }>('/api/cli/exec', {
      method: 'POST',
      body: JSON.stringify({ args, workspace }),
    }),

  execShell: (commandLine: string, workspace?: string) =>
    requestJson<{ stdout: string; stderr: string; code: number }>('/api/shell/exec', {
      method: 'POST',
      body: JSON.stringify({ commandLine, workspace }),
    }),

  cancelRun: (runId: string) =>
    requestJson<{ ok: boolean }>('/api/chat/cancel', {
      method: 'POST',
      body: JSON.stringify({ runId }),
    }),

  streamChat: async (
    payload: {
      runId: string;
      prompt: string;
      workspace: string;
      model?: string;
      effort?: string;
      mode?: string;
      permissionPolicy?: string;
      conversationId?: string;
      projectId?: string;
      continueRecent?: boolean;
      sandbox?: boolean;
      agent?: string;
      additionalDirs?: string[];
    },
    onEvent: (ev: { type: string; data: any }) => void
  ) => {
    const base = getBaseUrl();
    const res = await fetch(`${base}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Falha ao iniciar stream do Antigravity CLI (${res.status})`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() || '';
      for (const part of parts) {
        const line = part.trim();
        if (line.startsWith('data:')) {
          const jsonStr = line.slice(5).trim();
          try {
            const parsed = JSON.parse(jsonStr);
            onEvent(parsed);
          } catch {}
        }
      }
    }
  },
};
