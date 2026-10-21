import express from 'express';
import cors from 'cors';
import { agyService } from './agyService';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // System & Binary Info
  app.get('/api/status', async (_req, res) => {
    const check = await agyService.checkAgyInstalled();
    const settings = agyService.readSettings();
    res.json({
      ok: true,
      platform: process.platform,
      arch: process.arch,
      agyBinary: check.binaryPath,
      agyInstalled: check.installed,
      agyVersion: check.version,
      settingsPath: agyService.getSettingsPath(),
      dataDir: agyService.getAgyDataDir(),
      cwd: process.cwd(),
      activeRuns: agyService.getActiveRuns(),
      settings,
    });
  });

  // /config - Read & Write all 36 CLI settings
  app.get('/api/config', (_req, res) => {
    res.json(agyService.readSettings());
  });

  app.post('/api/config', (req, res) => {
    try {
      const updated = agyService.writeSettings(req.body || {});
      res.json({ ok: true, settings: updated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Projects (~/.gemini/config/projects/*.json - Per-Project Settings & Folders)
  app.get('/api/projects', (_req, res) => {
    res.json({ projects: agyService.listProjects() });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const { name, folderPath, settings, permissionPolicy } = req.body || {};
      if (!folderPath) {
        res.status(400).json({ error: 'folderPath é obrigatório para criar um projeto' });
        return;
      }
      const created = agyService.createProject({
        name: name || '',
        folderPath,
        settings,
        permissionPolicy,
      });
      res.json({ ok: true, project: created });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get('/api/projects/:id', (req, res) => {
    const proj = agyService.getProject(req.params.id);
    if (!proj) {
      res.status(404).json({ error: 'Projeto não encontrado' });
      return;
    }
    res.json({ project: proj });
  });

  app.put('/api/projects/:id', (req, res) => {
    try {
      const updated = agyService.updateProject(req.params.id, req.body || {});
      if (!updated) {
        res.status(404).json({ error: 'Projeto não encontrado' });
        return;
      }
      res.json({ ok: true, project: updated });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.delete('/api/projects/:id', (req, res) => {
    const deleted = agyService.deleteProject(req.params.id);
    res.json({ ok: deleted });
  });

  // Models (agy models)
  app.get('/api/models', async (_req, res) => {
    const models = await agyService.getModels();
    res.json({ models });
  });

  // Conversations (/resume) & Transcripts
  app.get('/api/conversations', async (_req, res) => {
    const conversations = await agyService.getConversations();
    res.json({ conversations });
  });

  app.get('/api/conversations/:id', (req, res) => {
    const data = agyService.getConversationTranscript(req.params.id);
    res.json(data);
  });

  // Skills (/skills)
  app.get('/api/skills', (req, res) => {
    const workspace = (req.query.workspace as string) || process.cwd();
    const skills = agyService.getDiscoveredSkills(workspace);
    res.json({ skills });
  });

  // MCP Servers (agy mcp & ~/.gemini/antigravity-cli/mcp)
  app.get('/api/mcp', async (_req, res) => {
    const discovered = agyService.getDiscoveredMcpServers();
    const cliList = await agyService.execAgy(['mcp', 'list'], undefined, 8000);
    res.json({
      servers: discovered,
      cliOutput: cliList.stdout || cliList.stderr,
    });
  });

  app.post('/api/mcp/action', async (req, res) => {
    const { action, name, command, args = [] } = req.body || {};
    if (!action) {
      res.status(400).json({ error: 'Action required' });
      return;
    }
    const cliArgs = ['mcp', action];
    if (name) cliArgs.push(name);
    if (command) cliArgs.push(command);
    if (Array.isArray(args)) cliArgs.push(...args);
    const out = await agyService.execAgy(cliArgs, undefined, 15000);
    res.json(out);
  });

  // Plugins (agy plugin)
  app.get('/api/plugins', async (_req, res) => {
    const out = await agyService.execAgy(['plugin', 'list'], undefined, 10000);
    res.json({ output: out.stdout || out.stderr, code: out.code });
  });

  app.post('/api/plugins/action', async (req, res) => {
    const { action, target } = req.body || {};
    const cliArgs = ['plugin', action || 'list'];
    if (target) cliArgs.push(target);
    const out = await agyService.execAgy(cliArgs, undefined, 20000);
    res.json(out);
  });

  // Agents (agy agents)
  app.get('/api/agents', async (_req, res) => {
    const out = await agyService.execAgy(['agents'], undefined, 10000);
    res.json({ output: out.stdout || out.stderr, code: out.code });
  });

  // Remote Control (agy remote-control)
  app.post('/api/remote-control', async (req, res) => {
    const { subcommand = 'status' } = req.body || {};
    const out = await agyService.execAgy(['remote-control', subcommand], undefined, 10000);
    res.json(out);
  });

  // Changelog (agy changelog)
  app.get('/api/changelog', async (_req, res) => {
    const out = await agyService.execAgy(['changelog'], undefined, 10000);
    res.json({ changelog: out.stdout || out.stderr });
  });

  // Workspace Files (@ mentions) & Git Diff (/diff)
  app.get('/api/workspace/files', (req, res) => {
    const workspace = (req.query.workspace as string) || process.cwd();
    const files = agyService.getWorkspaceFiles(workspace);
    res.json({ workspace, files });
  });

  app.get('/api/workspace/diff', async (req, res) => {
    const workspace = (req.query.workspace as string) || process.cwd();
    const diff = await agyService.getWorkspaceDiff(workspace);
    res.json(diff);
  });

  // Command History
  app.get('/api/history', (_req, res) => {
    res.json({ history: agyService.getCommandHistory(60) });
  });

  // Generic CLI Subcommand or Headless Slash Command Runner
  app.post('/api/cli/exec', async (req, res) => {
    const { args = [], workspace } = req.body || {};
    const out = await agyService.execAgy(args, workspace, 25000);
    res.json(out);
  });

  // Direct Shell Command Execution (used when user approves a command or runs terminal commands)
  app.post('/api/shell/exec', async (req, res) => {
    const { commandLine, workspace } = req.body || {};
    if (!commandLine) {
      res.status(400).json({ error: 'commandLine required' });
      return;
    }
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh';
    const shellFlag = process.platform === 'win32' ? '/c' : '-c';
    const out = await agyService.execShellCommand(shell, [shellFlag, commandLine], workspace);
    res.json(out);
  });

  // Streaming Prompt Execution via Server-Sent Events (SSE)
  app.post('/api/chat/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    let streamFinished = false;
    const runId = req.body?.runId || `run-${Date.now()}`;
    const cancel = agyService.streamPrompt(
      {
        runId,
        prompt: req.body?.prompt || '',
        workspace: req.body?.workspace || process.cwd(),
        model: req.body?.model,
        effort: req.body?.effort,
        mode: req.body?.mode,
        permissionPolicy: req.body?.permissionPolicy,
        conversationId: req.body?.conversationId,
        projectId: req.body?.projectId,
        continueRecent: req.body?.continueRecent,
        sandbox: req.body?.sandbox,
        agent: req.body?.agent,
        additionalDirs: req.body?.additionalDirs,
      },
      (event) => {
        if (streamFinished) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === 'done' || event.type === 'error') {
          streamFinished = true;
          res.end();
        }
      }
    );

    res.on('close', () => {
      if (!streamFinished && !res.writableEnded) {
        streamFinished = true;
        cancel();
      }
    });
  });

  app.post('/api/chat/cancel', (req, res) => {
    const { runId } = req.body || {};
    const cancelled = agyService.cancelRun(runId);
    res.json({ ok: cancelled });
  });

  return app;
}

export function startBackendServer(port = 4747): Promise<number> {
  return new Promise((resolve) => {
    const app = createApp();
    const server = app.listen(port, '127.0.0.1', () => {
      console.log(`[Antigravity GUI Backend] Listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
    server.on('error', () => {
      // Port already in use (e.g., dev server already running)
      resolve(port);
    });
  });
}

if (require.main === module) {
  const port = Number(process.env.AGY_GUI_PORT || 4747);
  startBackendServer(port);
}
