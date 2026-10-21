import { spawn, execFile, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export interface AgyProjectResource {
  folderUri?: string;
  gitFolder?: {
    folderUri: string;
    defaultBranch?: string;
  };
}

export interface AgyProjectSettings {
  fileAccessPolicy?: 'AGENT_SETTING_POLICY_ALLOW' | 'AGENT_SETTING_POLICY_ASK' | 'AGENT_SETTING_POLICY_DENY' | string;
  internetPolicy?: 'AGENT_SETTING_POLICY_ALLOW' | 'AGENT_SETTING_POLICY_ASK' | 'AGENT_SETTING_POLICY_DENY' | string;
  sandboxMode?: boolean;
  autoExecutionPolicy?: 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER' | 'CASCADE_COMMANDS_AUTO_EXECUTION_AUTO' | 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF' | 'CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX' | string;
  artifactReviewMode?: 'ARTIFACT_REVIEW_MODE_TURBO' | 'ARTIFACT_REVIEW_MODE_AUTO' | 'ARTIFACT_REVIEW_MODE_ALWAYS' | string;
  permissionPreset?: 'AGENT_PERMISSION_PRESET_TURBO' | 'AGENT_PERMISSION_PRESET_DEFAULT' | 'AGENT_PERMISSION_PRESET_REQUEST_REVIEW' | string;
  shellSetupScript?: string;
  [key: string]: any;
}

export interface AgyProject {
  id: string;
  name: string;
  projectResources?: {
    resources?: AgyProjectResource[];
  };
  permissionGrants?: {
    permissionGrants?: {
      allow?: string[];
      deny?: string[];
      ask?: string[];
    };
    v2Migrated?: boolean;
  };
  settings?: AgyProjectSettings;
  updatedAt?: string;
  isWorkspaceOnly?: boolean;
  folderPath?: string;
}

export interface AgySettings {
  agentMode?: string;
  allowNonWorkspaceAccess?: boolean;
  altScreenMode?: string;
  artifactReviewPolicy?: string;
  clearScrollbackOnResize?: boolean;
  colorScheme?: string;
  contextWindow?: string;
  copyOnSelect?: boolean;
  customModelsConfig?: string;
  disableSlashCommands?: boolean;
  editor?: string;
  editorMode?: string;
  enableTerminalSandbox?: boolean;
  gcp?: string;
  hideActiveItems?: boolean;
  historySize?: number;
  model?: string;
  modelProvider?: string;
  notifications?: boolean;
  permissions?: Record<string, any> | string;
  pickerGrouping?: string;
  queuedMessages?: string;
  runningLightSpeed?: string;
  sandboxProxy?: string;
  seasonalThemesOff?: boolean | string;
  seasonalThemesOptIn?: boolean | string;
  showFeedbackSurvey?: boolean;
  showTips?: boolean;
  statusLine?: string;
  title?: string;
  toolPermission?: 'always-proceed' | 'request-review' | 'proceed-in-sandbox' | 'strict' | string;
  trustedWorkspaces?: string[];
  useG1Credits?: boolean;
  useTerminalCursor?: boolean;
  verbosity?: string;
  vimInsertFirst?: boolean;
  [key: string]: any;
}

export const DEFAULT_AGY_SETTINGS: AgySettings = {
  agentMode: 'default',
  allowNonWorkspaceAccess: false,
  altScreenMode: 'default',
  artifactReviewPolicy: 'asks-for-review',
  clearScrollbackOnResize: true,
  colorScheme: 'terminal',
  contextWindow: '',
  copyOnSelect: true,
  customModelsConfig: '',
  disableSlashCommands: false,
  editor: 'auto',
  editorMode: 'default',
  enableTerminalSandbox: false,
  gcp: '',
  hideActiveItems: false,
  historySize: 2000,
  model: 'gemini-4-argon-medium',
  modelProvider: 'google',
  notifications: false,
  permissions: '',
  pickerGrouping: 'none',
  queuedMessages: 'queue',
  runningLightSpeed: 'medium',
  sandboxProxy: '',
  seasonalThemesOff: false,
  seasonalThemesOptIn: false,
  showFeedbackSurvey: true,
  showTips: true,
  statusLine: '',
  title: '',
  toolPermission: 'always-proceed',
  trustedWorkspaces: [],
  useG1Credits: false,
  useTerminalCursor: false,
  verbosity: 'medium',
  vimInsertFirst: false,
};

export interface AgyModelInfo {
  id: string;
  label: string;
  family: string;
  effort: string;
  provider: string;
}

export const DEFAULT_MODELS: AgyModelInfo[] = [
  { id: 'gemini-4-argon-medium', label: 'Gemini 4 Argon (Medium)', family: 'Gemini 4 Argon', effort: 'medium', provider: 'Google DeepMind' },
  { id: 'gemini-4-argon-high', label: 'Gemini 4 Argon (High)', family: 'Gemini 4 Argon', effort: 'high', provider: 'Google DeepMind' },
  { id: 'gemini-4-argon-low', label: 'Gemini 4 Argon (Low)', family: 'Gemini 4 Argon', effort: 'low', provider: 'Google DeepMind' },
  { id: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash (High)', family: 'Gemini 3.8 Flash', effort: 'high', provider: 'Google DeepMind' },
  { id: 'gemini-3.8-flash-medium', label: 'Gemini 3.8 Flash (Medium)', family: 'Gemini 3.8 Flash', effort: 'medium', provider: 'Google DeepMind' },
  { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)', family: 'Gemini 3.8 Flash', effort: 'low', provider: 'Google DeepMind' },
  { id: 'claude-opus-5-5-high', label: 'Claude Opus 5.5 (High)', family: 'Claude Opus 5.5', effort: 'high', provider: 'Anthropic' },
  { id: 'claude-opus-5-5-medium', label: 'Claude Opus 5.5 (Medium)', family: 'Claude Opus 5.5', effort: 'medium', provider: 'Anthropic' },
  { id: 'claude-opus-5-5-low', label: 'Claude Opus 5.5 (Low)', family: 'Claude Opus 5.5', effort: 'low', provider: 'Anthropic' },
  { id: 'claude-sonnet-5-5-high', label: 'Claude Sonnet 5.5 (High)', family: 'Claude Sonnet 5.5', effort: 'high', provider: 'Anthropic' },
  { id: 'claude-sonnet-5-5-medium', label: 'Claude Sonnet 5.5 (Medium)', family: 'Claude Sonnet 5.5', effort: 'medium', provider: 'Anthropic' },
  { id: 'claude-sonnet-5-5-low', label: 'Claude Sonnet 5.5 (Low)', family: 'Claude Sonnet 5.5', effort: 'low', provider: 'Anthropic' },
  { id: 'gpt-oss-120b-medium', label: 'GPT-OSS 120B (Medium)', family: 'GPT-OSS 120B', effort: 'medium', provider: 'OpenAI OSS' },
];

export class AgyService {
  private activeProcesses: Map<string, ChildProcess> = new Map();

  public getHomeDir(): string {
    return os.homedir();
  }

  public getAgyDataDir(): string {
    return path.join(this.getHomeDir(), '.gemini', 'antigravity-cli');
  }

  public getGlobalConfigDir(): string {
    return path.join(this.getHomeDir(), '.gemini', 'config');
  }

  public getProjectsDir(): string {
    return path.join(this.getGlobalConfigDir(), 'projects');
  }

  public listProjects(): AgyProject[] {
    const dir = this.getProjectsDir();
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        return [];
      }
    }

    const projects: AgyProject[] = [];
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
      for (const f of files) {
        try {
          const filePath = path.join(dir, f);
          const raw = fs.readFileSync(filePath, 'utf-8');
          const p: AgyProject = JSON.parse(raw);
          if (!p.id) p.id = f.replace(/\.json$/, '');
          // Extract folderPath from resources
          const firstResource = p.projectResources?.resources?.[0];
          if (firstResource?.folderUri) {
            p.folderPath = firstResource.folderUri.replace(/^file:\/\//, '');
          } else if (firstResource?.gitFolder?.folderUri) {
            p.folderPath = firstResource.gitFolder.folderUri.replace(/^file:\/\//, '');
          }
          projects.push(p);
        } catch {}
      }
    } catch {}

    return projects.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  public getProject(id: string): AgyProject | null {
    const filePath = path.join(this.getProjectsDir(), `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const p: AgyProject = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const firstResource = p.projectResources?.resources?.[0];
      if (firstResource?.folderUri) {
        p.folderPath = firstResource.folderUri.replace(/^file:\/\//, '');
      } else if (firstResource?.gitFolder?.folderUri) {
        p.folderPath = firstResource.gitFolder.folderUri.replace(/^file:\/\//, '');
      }
      return p;
    } catch {
      return null;
    }
  }

  public createProject(options: {
    name: string;
    folderPath: string;
    settings?: Partial<AgyProjectSettings>;
    permissionPolicy?: 'always-proceed' | 'request-review' | 'proceed-in-sandbox' | 'strict' | string;
  }): AgyProject {
    const dir = this.getProjectsDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const id = crypto.randomUUID();
    const folderUri = `file://${path.resolve(options.folderPath)}`;

    // Map UI permission policies to Antigravity CLI project protobuf enums
    let autoExec = 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER';
    let preset = 'AGENT_PERMISSION_PRESET_TURBO';
    let sandbox = false;

    if (options.permissionPolicy === 'request-review') {
      autoExec = 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF';
      preset = 'AGENT_PERMISSION_PRESET_REQUEST_REVIEW';
    } else if (options.permissionPolicy === 'proceed-in-sandbox') {
      autoExec = 'CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX';
      sandbox = true;
    } else if (options.permissionPolicy === 'strict') {
      autoExec = 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF';
      preset = 'AGENT_PERMISSION_PRESET_DEFAULT';
    }

    const project: AgyProject = {
      id,
      name: options.name.trim() || path.basename(options.folderPath) || 'Novo Projeto',
      projectResources: {
        resources: [
          {
            folderUri,
          },
        ],
      },
      permissionGrants: {
        permissionGrants: {
          allow: [],
        },
        v2Migrated: true,
      },
      settings: {
        fileAccessPolicy: 'AGENT_SETTING_POLICY_ALLOW',
        internetPolicy: 'AGENT_SETTING_POLICY_ALLOW',
        sandboxMode: sandbox,
        autoExecutionPolicy: autoExec,
        artifactReviewMode: 'ARTIFACT_REVIEW_MODE_TURBO',
        permissionPreset: preset,
        shellSetupScript: '',
        ...options.settings,
      },
      updatedAt: new Date().toISOString(),
      isWorkspaceOnly: false,
      folderPath: path.resolve(options.folderPath),
    };

    const filePath = path.join(dir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(project, null, 2) + '\n', 'utf-8');

    // Also add to trustedWorkspaces in ~/.gemini/antigravity-cli/settings.json
    try {
      const currentSettings = this.readSettings();
      const trusted = Array.isArray(currentSettings.trustedWorkspaces)
        ? [...currentSettings.trustedWorkspaces]
        : [];
      const resolvedPath = path.resolve(options.folderPath);
      if (!trusted.includes(resolvedPath)) {
        trusted.push(resolvedPath);
        this.writeSettings({ trustedWorkspaces: trusted });
      }
    } catch {}

    return project;
  }

  public updateProject(id: string, patch: { name?: string; folderPath?: string; settings?: Partial<AgyProjectSettings>; permissionGrants?: any }): AgyProject | null {
    const existing = this.getProject(id);
    if (!existing) return null;

    if (patch.name !== undefined) {
      existing.name = patch.name;
    }
    if (patch.folderPath !== undefined) {
      const folderUri = `file://${path.resolve(patch.folderPath)}`;
      existing.projectResources = {
        resources: [{ folderUri }],
      };
      existing.folderPath = path.resolve(patch.folderPath);
    }
    if (patch.settings) {
      existing.settings = {
        ...existing.settings,
        ...patch.settings,
      };
    }
    if (patch.permissionGrants) {
      existing.permissionGrants = {
        ...existing.permissionGrants,
        ...patch.permissionGrants,
      };
    }
    existing.updatedAt = new Date().toISOString();

    const filePath = path.join(this.getProjectsDir(), `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    return existing;
  }

  public deleteProject(id: string): boolean {
    const filePath = path.join(this.getProjectsDir(), `${id}.json`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        return true;
      } catch {}
    }
    return false;
  }

  public getSettingsPath(): string {
    return path.join(this.getAgyDataDir(), 'settings.json');
  }

  public resolveAgyBinary(): string {
    const isWin = process.platform === 'win32';
    const binName = isWin ? 'agy.exe' : 'agy';
    const candidates = [
      process.env.AGY_BIN_PATH,
      path.join(this.getHomeDir(), '.local', 'bin', binName),
      path.join(this.getHomeDir(), '.gemini', 'antigravity-cli', 'bin', binName),
      isWin ? path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity', binName) : '/usr/local/bin/agy',
      isWin ? path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'bin', binName) : '/opt/homebrew/bin/agy',
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      } catch {
        // ignore
      }
    }
    return binName;
  }

  public readSettings(): AgySettings {
    const settingsPath = this.getSettingsPath();
    let fileSettings: Partial<AgySettings> = {};
    try {
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf-8');
        fileSettings = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading settings.json:', err);
    }
    return {
      ...DEFAULT_AGY_SETTINGS,
      ...fileSettings,
      trustedWorkspaces: Array.isArray(fileSettings.trustedWorkspaces)
        ? fileSettings.trustedWorkspaces
        : [process.cwd()],
    };
  }

  public writeSettings(patch: Partial<AgySettings>): AgySettings {
    const settingsPath = this.getSettingsPath();
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existingDisk: Record<string, any> = {};
    try {
      if (fs.existsSync(settingsPath)) {
        existingDisk = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      }
    } catch {
      existingDisk = {};
    }

    const updatedDisk: Record<string, any> = {
      ...existingDisk,
      ...patch,
    };

    // Clean empty strings unless explicitly kept
    for (const [k, v] of Object.entries(updatedDisk)) {
      if (v === undefined || v === null) {
        delete updatedDisk[k];
      }
    }

    fs.writeFileSync(settingsPath, JSON.stringify(updatedDisk, null, 2) + '\n', 'utf-8');
    return this.readSettings();
  }

  public stripAnsi(input: string): string {
    return input
      .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
      .replace(/\x1B\][^\x07]*(\x07|\x1B\\)/g, '')
      .replace(/[\r][^\n]*[\r]/g, '')
      .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
      .replace(/Fetching available models\.\.\./g, '')
      .trim();
  }

  public execAgy(args: string[], cwd?: string, timeoutMs = 25000): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const bin = this.resolveAgyBinary();
      const workDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();
      const child = spawn(bin, args, {
        cwd: workDir,
        env: {
          ...process.env,
          NO_COLOR: '1',
          TERM: 'dumb',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        try {
          child.kill('SIGTERM');
        } catch {}
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({ stdout: this.stripAnsi(stdout), stderr: err.message, code: 1 });
      });
      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          stdout: this.stripAnsi(stdout),
          stderr: this.stripAnsi(stderr),
          code: code ?? 0,
        });
      });
    });
  }

  public execShellCommand(command: string, args: string[], cwd?: string): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const workDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();
      execFile(command, args, { cwd: workDir, timeout: 15000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        resolve({
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
          code: err && typeof (err as any).code === 'number' ? (err as any).code : err ? 1 : 0,
        });
      });
    });
  }

  public async getModels(): Promise<AgyModelInfo[]> {
    try {
      const res = await this.execAgy(['models'], undefined, 12000);
      const lines = res.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
      const parsed: AgyModelInfo[] = [];
      for (const line of lines) {
        const match = line.match(/^([a-z0-9.-]+)\s+(.+)$/i);
        if (match) {
          const id = match[1].trim();
          const label = match[2].trim();
          if (id.startsWith('gemini') || id.startsWith('claude') || id.startsWith('gpt')) {
            const effortMatch = label.match(/\((Low|Medium|High|XHigh|Max)\)/i);
            const effort = effortMatch ? effortMatch[1].toLowerCase() : 'medium';
            const family = label.replace(/\s*\([^)]+\)\s*$/, '').trim();
            const provider = id.startsWith('gemini')
              ? 'Google DeepMind'
              : id.startsWith('claude')
              ? 'Anthropic'
              : 'OpenAI OSS';
            parsed.push({ id, label, family, effort, provider });
          }
        }
      }
      if (parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fallback to DEFAULT_MODELS
    }
    return DEFAULT_MODELS;
  }

  public async getConversations(): Promise<any[]> {
    const dbPath = path.join(this.getAgyDataDir(), 'conversation_summaries.db');
    const brainDir = path.join(this.getAgyDataDir(), 'brain');
    const results: any[] = [];

    if (fs.existsSync(dbPath)) {
      try {
        const sql = `SELECT conversation_id, title, preview, step_count, last_modified_time, workspace_uris, status, agent_name, parent_conversation_id FROM conversation_summaries ORDER BY last_modified_time DESC LIMIT 100;`;
        const out = await this.execShellCommand('sqlite3', ['-json', dbPath, sql]);
        if (out.stdout.trim().startsWith('[')) {
          const rows = JSON.parse(out.stdout.trim());
          for (const r of rows) {
            let workspaces: string[] = [];
            try {
              workspaces = JSON.parse(r.workspace_uris || '[]').map((u: string) => u.replace(/^file:\/\//, ''));
            } catch {}
            results.push({
              id: r.conversation_id,
              title: r.title || r.preview || `Conversa ${r.conversation_id.slice(0, 8)}`,
              preview: r.preview || r.title || '',
              stepCount: r.step_count || 0,
              lastModifiedTime: r.last_modified_time,
              workspaces,
              workspace: workspaces[0] || '',
              status: r.status || 'IDLE',
              agentName: r.agent_name || 'agy',
              parentConversationId: r.parent_conversation_id || '',
            });
          }
        }
      } catch {
        // Fallback to directory scan below
      }
    }

    if (results.length === 0 && fs.existsSync(brainDir)) {
      try {
        const dirs = fs.readdirSync(brainDir, { withFileTypes: true }).filter((d) => d.isDirectory());
        for (const d of dirs) {
          const tPath = path.join(brainDir, d.name, '.system_generated', 'logs', 'transcript.jsonl');
          let preview = `Conversa ${d.name.slice(0, 8)}`;
          let stepCount = 0;
          let mtime = new Date().toISOString();
          if (fs.existsSync(tPath)) {
            const stat = fs.statSync(tPath);
            mtime = stat.mtime.toISOString();
            const lines = fs.readFileSync(tPath, 'utf-8').split('\n').filter(Boolean);
            stepCount = lines.length;
            if (lines[0]) {
              try {
                const first = JSON.parse(lines[0]);
                const reqMatch = (first.content || '').match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
                preview = (reqMatch ? reqMatch[1] : first.content || preview).trim().slice(0, 90);
              } catch {}
            }
          }
          results.push({
            id: d.name,
            title: preview,
            preview,
            stepCount,
            lastModifiedTime: mtime,
            workspaces: [process.cwd()],
            workspace: process.cwd(),
            status: 'IDLE',
            agentName: 'agy',
          });
        }
      } catch {}
    }

    return results;
  }

  public getConversationTranscript(conversationId: string): { steps: any[]; artifacts: any[] } {
    const convDir = path.join(this.getAgyDataDir(), 'brain', conversationId);
    const transcriptPath = path.join(convDir, '.system_generated', 'logs', 'transcript.jsonl');
    const steps: any[] = [];
    const artifacts: any[] = [];

    if (fs.existsSync(transcriptPath)) {
      try {
        const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const step = JSON.parse(line);
            if (step.type === 'USER_INPUT' && typeof step.content === 'string') {
              const reqMatch = step.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
              step.cleanContent = reqMatch ? reqMatch[1].trim() : step.content;
            }
            steps.push(step);
          } catch {}
        }
      } catch {}
    }

    if (fs.existsSync(convDir)) {
      try {
        const entries = fs.readdirSync(convDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && !entry.name.startsWith('.')) {
            const fullPath = path.join(convDir, entry.name);
            const stat = fs.statSync(fullPath);
            artifacts.push({
              name: entry.name,
              path: fullPath,
              size: stat.size,
              updatedAt: stat.mtime.toISOString(),
              content: stat.size < 200000 ? fs.readFileSync(fullPath, 'utf-8') : '(Arquivo grande)',
            });
          }
        }
      } catch {}
    }

    return { steps, artifacts };
  }

  public getDiscoveredSkills(workspaceDir?: string): any[] {
    const skills: any[] = [];
    const locations = [
      { scope: 'built-in', dir: path.join(this.getAgyDataDir(), 'builtin', 'skills') },
      { scope: 'global', dir: path.join(this.getGlobalConfigDir(), 'skills') },
    ];
    if (workspaceDir) {
      locations.unshift(
        { scope: 'workspace', dir: path.join(workspaceDir, '.agents', 'skills') },
        { scope: 'workspace', dir: path.join(workspaceDir, '.agent', 'skills') }
      );
    }

    for (const loc of locations) {
      if (!fs.existsSync(loc.dir)) continue;
      try {
        const entries = fs.readdirSync(loc.dir, { withFileTypes: true }).filter((d) => d.isDirectory());
        for (const entry of entries) {
          const skillMd = path.join(loc.dir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            const content = fs.readFileSync(skillMd, 'utf-8');
            const nameMatch = content.match(/^name:\s*(.+)$/m);
            const descMatch = content.match(/^description:\s*(?:>-?\s*\n\s*)?(.+)$/m);
            skills.push({
              id: `${loc.scope}:${entry.name}`,
              name: nameMatch ? nameMatch[1].trim() : entry.name,
              description: descMatch ? descMatch[1].trim() : 'Skill customizada do Antigravity',
              scope: loc.scope,
              path: skillMd,
              content,
            });
          }
        }
      } catch {}
    }
    return skills;
  }

  public getDiscoveredMcpServers(): any[] {
    const mcpDir = path.join(this.getAgyDataDir(), 'mcp');
    const servers: any[] = [];
    if (fs.existsSync(mcpDir)) {
      try {
        const dirs = fs.readdirSync(mcpDir, { withFileTypes: true }).filter((d) => d.isDirectory());
        for (const d of dirs) {
          const serverPath = path.join(mcpDir, d.name);
          const files = fs.readdirSync(serverPath).filter((f) => f.endsWith('.json'));
          const tools = files.map((f) => {
            try {
              const raw = JSON.parse(fs.readFileSync(path.join(serverPath, f), 'utf-8'));
              return {
                name: raw.name || f.replace(/\.json$/, ''),
                description: raw.description || '',
              };
            } catch {
              return { name: f.replace(/\.json$/, ''), description: '' };
            }
          });
          servers.push({
            name: d.name,
            path: serverPath,
            enabled: true,
            toolCount: tools.length,
            tools,
          });
        }
      } catch {}
    }
    return servers;
  }

  public getCommandHistory(limit = 50): any[] {
    const historyPath = path.join(this.getAgyDataDir(), 'history.jsonl');
    if (!fs.existsSync(historyPath)) return [];
    try {
      const lines = fs.readFileSync(historyPath, 'utf-8').split('\n').filter(Boolean);
      return lines
        .slice(-limit)
        .reverse()
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  public getWorkspaceFiles(workspaceDir: string): string[] {
    const results: string[] = [];
    const ignore = new Set(['node_modules', '.git', 'dist', 'dist-electron', 'release', '.next', 'target', 'build']);
    const walk = (dir: string, rel = '') => {
      if (results.length >= 250) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (ignore.has(e.name) || e.name.startsWith('.')) continue;
          const relPath = rel ? `${rel}/${e.name}` : e.name;
          if (e.isDirectory()) {
            results.push(`${relPath}/`);
            walk(path.join(dir, e.name), relPath);
          } else {
            results.push(relPath);
          }
          if (results.length >= 250) break;
        }
      } catch {}
    };
    if (fs.existsSync(workspaceDir)) {
      walk(workspaceDir);
    }
    return results;
  }

  public async getWorkspaceDiff(workspaceDir: string): Promise<{ status: string; diff: string; branch: string }> {
    const branchRes = await this.execShellCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], workspaceDir);
    const statusRes = await this.execShellCommand('git', ['status', '--short'], workspaceDir);
    const diffRes = await this.execShellCommand('git', ['diff', 'HEAD'], workspaceDir);
    return {
      branch: branchRes.stdout.trim() || 'main',
      status: statusRes.stdout,
      diff: diffRes.stdout || '(Sem alterações pendentes no repositório Git)',
    };
  }

  public streamPrompt(
    options: {
      runId: string;
      prompt: string;
      workspace: string;
      model?: string;
      effort?: string;
      mode?: string;
      permissionPolicy?: 'always-proceed' | 'request-review' | 'proceed-in-sandbox' | 'strict' | string;
      conversationId?: string;
      projectId?: string;
      continueRecent?: boolean;
      sandbox?: boolean;
      agent?: string;
      additionalDirs?: string[];
    },
    onEvent: (event: { type: string; data: any }) => void
  ): () => void {
    const bin = this.resolveAgyBinary();
    const trimmedPrompt = (options.prompt || '').trim();

    // Built-in print-mode slash commands output plain text rather than stream-json
    const plainTextSlashCmds = [
      '/help',
      '/config',
      '/settings',
      '/credits',
      '/usage',
      '/quota',
      '/skills',
      '/hooks',
      '/permissions',
      '/agents',
      '/plugin',
      '/plugins',
      '/changelog',
    ];
    const isPlainSlash = plainTextSlashCmds.some(
      (cmd) => trimmedPrompt === cmd || trimmedPrompt.startsWith(`${cmd} `)
    );

    const args: string[] = ['-p', trimmedPrompt];

    if (!isPlainSlash) {
      args.push('--output-format', 'stream-json');
    }

    if (options.model) {
      args.push('--model', options.model);
    }
    const modelHasEffortSuffix =
      options.model && /-(low|medium|high|xhigh|max)$/i.test(options.model);
    if (options.effort && !modelHasEffortSuffix) {
      args.push('--effort', options.effort);
    }
    if (options.mode && options.mode !== 'default') {
      args.push('--mode', options.mode);
    }
    if (options.permissionPolicy === 'always-proceed') {
      args.push('--dangerously-skip-permissions');
    }
    if (options.permissionPolicy === 'proceed-in-sandbox' || options.sandbox) {
      args.push('--sandbox');
    }
    if (options.conversationId) {
      args.push('--conversation', options.conversationId);
    } else if (options.continueRecent) {
      args.push('--continue');
    }
    if (options.projectId) {
      args.push('--project', options.projectId);
    }
    if (options.agent && options.agent !== 'default') {
      args.push('--agent', options.agent);
    }
    if (options.additionalDirs && options.additionalDirs.length > 0) {
      for (const dir of options.additionalDirs) {
        args.push('--add-dir', dir);
      }
    }

    const workDir = options.workspace && fs.existsSync(options.workspace) ? options.workspace : process.cwd();

    onEvent({
      type: 'command_started',
      data: {
        runId: options.runId,
        binary: bin,
        args,
        commandLine: `agy ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`,
        workspace: workDir,
        permissionPolicy: options.permissionPolicy || 'always-proceed',
      },
    });

    const child = spawn(bin, args, {
      cwd: workDir,
      env: {
        ...process.env,
        NO_COLOR: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    this.activeProcesses.set(options.runId, child);

    let stdoutBuffer = '';

    const processLine = (rawLine: string) => {
      const line = rawLine.trim();
      if (!line) return;

      if (!isPlainSlash && line.startsWith('{') && line.endsWith('}')) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.event === 'init') {
            onEvent({
              type: 'init',
              data: {
                conversationId: parsed.conversation_id,
                model: parsed.init?.model,
                permissionMode: parsed.init?.permission_mode,
              },
            });
            return;
          }
          if (parsed.event === 'step_update' && parsed.step_update) {
            const su = parsed.step_update;
            if (typeof su.thinking_delta === 'string' && su.thinking_delta.length > 0) {
              onEvent({
                type: 'thinking_delta',
                data: { delta: su.thinking_delta, stepIndex: su.step_index },
              });
            } else if (typeof su.thinking === 'string' && su.thinking.length > 0) {
              onEvent({
                type: 'thinking',
                data: { thinking: su.thinking, stepIndex: su.step_index },
              });
            }

            if (typeof su.text_delta === 'string' && su.text_delta.length > 0) {
              onEvent({
                type: 'text_delta',
                data: { delta: su.text_delta, stepIndex: su.step_index },
              });
            } else if (typeof su.text === 'string' && su.text.length > 0) {
              onEvent({
                type: 'text_delta',
                data: { delta: su.text, stepIndex: su.step_index },
              });
            }

            // Detect tool actions inside step_update
            const toolKeys = [
              'list_directory',
              'find_file',
              'search_directory',
              'view_file',
              'create_file',
              'edit_file',
              'run_command',
              'compaction',
              'invoke_subagent',
              'generate_image',
              'mcp_tool',
              'search_web',
              'read_url_content',
              'custom_tool',
              'skill_lookup',
              'run_workflow',
            ];
            for (const tk of toolKeys) {
              if (su[tk]) {
                onEvent({
                  type: 'tool_step',
                  data: {
                    stepIndex: su.step_index,
                    state: su.state,
                    name: tk,
                    args: su[tk],
                  },
                });
              }
            }
            if (su.step_type && su.step_type !== 'user_input' && su.step_type !== 'agent_response') {
              onEvent({
                type: 'tool_step',
                data: {
                  stepIndex: su.step_index,
                  state: su.state,
                  name: su.step_type,
                  args: su,
                },
              });
            }
            return;
          }
          if (parsed.event === 'result' && parsed.result) {
            if (parsed.result.status === 'ERROR') {
              onEvent({
                type: 'error',
                data: {
                  message:
                    parsed.result.error ||
                    parsed.result.response ||
                    'O Antigravity CLI reportou um erro na execução.',
                },
              });
              return;
            }
            onEvent({
              type: 'result',
              data: {
                conversationId: parsed.result.conversation_id,
                status: parsed.result.status,
                response: parsed.result.response,
                durationSeconds: parsed.result.duration_seconds,
                usage: parsed.result.usage,
              },
            });
            return;
          }
        } catch {
          // Not valid JSON, fall through to plain text
        }
      }

      const clean = this.stripAnsi(rawLine);
      if (clean) {
        onEvent({ type: 'stdout', data: { text: clean } });
      }
    };

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || '';
      for (const line of lines) {
        processLine(line);
      }
    });

    child.stderr.on('data', (chunk) => {
      const text = this.stripAnsi(chunk.toString());
      if (text) {
        onEvent({ type: 'stderr', data: { text } });
      }
    });

    child.on('error', (err) => {
      this.activeProcesses.delete(options.runId);
      onEvent({ type: 'error', data: { message: err.message } });
    });

    child.on('close', (code) => {
      if (stdoutBuffer.trim()) {
        processLine(stdoutBuffer);
        stdoutBuffer = '';
      }
      this.activeProcesses.delete(options.runId);
      onEvent({ type: 'done', data: { exitCode: code ?? 0 } });
    });

    return () => {
      if (this.activeProcesses.has(options.runId)) {
        try {
          child.kill('SIGTERM');
        } catch {}
        this.activeProcesses.delete(options.runId);
      }
    };
  }

  public cancelRun(runId: string): boolean {
    const proc = this.activeProcesses.get(runId);
    if (proc) {
      try {
        proc.kill('SIGTERM');
      } catch {}
      this.activeProcesses.delete(runId);
      return true;
    }
    return false;
  }

  public getActiveRuns(): string[] {
    return Array.from(this.activeProcesses.keys());
  }
}

export const agyService = new AgyService();
