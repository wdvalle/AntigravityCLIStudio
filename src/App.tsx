import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquarePlus,
  Settings,
  Shield,
  Cpu,
  Server,
  Puzzle,
  BookOpen,
  Bot,
  GitBranch,
  Radio,
  FolderOpen,
  Send,
  Square,
  Terminal,
  FileText,
  History,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Check,
  AlertTriangle,
  Unlock,
  Lock,
  Copy,
  RotateCcw,
  GitFork,
  Trash2,
  HelpCircle,
  Layers,
  AtSign,
  Slash,
  PanelRightClose,
  PanelRightOpen,
  Play,
  X,
  FolderPlus,
} from 'lucide-react';
import { AntigravityLogo } from './components/AntigravityLogo';
import { ConfigView } from './components/ConfigView';
import { CliModulesView } from './components/CliModulesView';
import { ProjectModal } from './components/ProjectModal';
import {
  AgyModelInfo,
  AgySettings,
  ChatMessageItem,
  CLI_SLASH_COMMANDS,
  SlashCommandItem,
  AgyProject,
  AgyProjectSettings,
} from './types/agy';
import { agyApi } from './services/api';

type MainViewType =
  | 'chat'
  | 'config'
  | 'permissions'
  | 'models'
  | 'mcp'
  | 'plugins'
  | 'skills'
  | 'agents'
  | 'diff'
  | 'system';

export const App: React.FC = () => {
  // Navigation & Layout State
  const [activeView, setActiveView] = useState<MainViewType>('chat');
  const [rightDrawerOpen, setRightDrawerOpen] = useState<boolean>(true);
  const [rightDrawerTab, setRightDrawerTab] = useState<'terminal' | 'artifacts' | 'history'>('terminal');

  // Backend & Settings State
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [settings, setSettings] = useState<AgySettings>({
    toolPermission: 'always-proceed',
    agentMode: 'default',
    pickerGrouping: 'none',
  });
  const [models, setModels] = useState<AgyModelInfo[]>([]);
  const [workspace, setWorkspace] = useState<string>('');
  const [projects, setProjects] = useState<AgyProject[]>([]);
  const [activeProject, setActiveProject] = useState<AgyProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  // Below-Prompt Controls State
  const [selectedModel, setSelectedModel] = useState<string>('gemini-4-argon-medium');
  const [selectedEffort, setSelectedEffort] = useState<string>('medium');
  const [selectedMode, setSelectedMode] = useState<string>('default');
  const [permissionPolicy, setPermissionPolicy] = useState<string>('always-proceed');

  // Chat & Conversations State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [artifacts, setArtifacts] = useState<any[]>([]);
  const [promptInput, setPromptInput] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Popups above Prompt (/ Slash & @ Mention)
  const [showSlashPopup, setShowSlashPopup] = useState<boolean>(false);
  const [slashFilter, setSlashFilter] = useState<string>('');
  const [showMentionPopup, setShowMentionPopup] = useState<boolean>(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<string[]>([]);
  const [mentionFilter, setMentionFilter] = useState<string>('');

  // Auxiliary Logs & History
  const [terminalLogs, setTerminalLogs] = useState<
    { id: string; time: string; type: 'cmd' | 'stdout' | 'stderr' | 'info'; text: string }[]
  >([]);
  const [cliHistory, setCliHistory] = useState<any[]>([]);
  const [directCliInput, setDirectCliInput] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const promptTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const appendLog = (type: 'cmd' | 'stdout' | 'stderr' | 'info', text: string) => {
    setTerminalLogs((prev) => [
      ...prev.slice(-150),
      {
        id: `${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString(),
        type,
        text,
      },
    ]);
  };

  const pathMatches = (p1: string, p2: string) => {
    const clean1 = p1.replace(/[\/\\]+$/, '').toLowerCase();
    const clean2 = p2.replace(/[\/\\]+$/, '').toLowerCase();
    return clean1 === clean2;
  };

  const handleSaveProjectSettings = async (projectId: string, patch: Partial<AgyProjectSettings>) => {
    try {
      const res = await agyApi.updateProject(projectId, { settings: patch });
      if (res.ok && res.project) {
        setProjects((prev) => prev.map((p) => (p.id === projectId ? res.project : p)));
        if (activeProject?.id === projectId) {
          setActiveProject(res.project);
        }
        appendLog('info', `Configurações do projeto ${res.project.name} salvas com sucesso.`);
      }
    } catch (err: any) {
      appendLog('stderr', `Falha ao salvar configurações do projeto: ${err.message}`);
    }
  };

  const handleProjectCreated = (newProj: AgyProject) => {
    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    if (newProj.folderPath) {
      setWorkspace(newProj.folderPath);
    }
    appendLog('info', `Projeto "${newProj.name}" criado com sucesso em ~/.gemini/config/projects/${newProj.id}.json`);
  };

  const initializeApp = async () => {
    try {
      const [statusRes, modelsRes, convsRes, histRes, projsRes] = await Promise.all([
        agyApi.getStatus(),
        agyApi.getModels(),
        agyApi.getConversations(),
        agyApi.getHistory(),
        agyApi.getProjects(),
      ]);

      setSystemStatus(statusRes);
      setSettings(statusRes.settings || {});
      const loadedProjects = projsRes.projects || [];
      setProjects(loadedProjects);

      const initialWs =
        statusRes.cwd ||
        (Array.isArray(statusRes.settings?.trustedWorkspaces) &&
          statusRes.settings.trustedWorkspaces[0]) ||
        '';
      setWorkspace(initialWs);

      const matchedProj = loadedProjects.find(
        (p: AgyProject) => p.folderPath && pathMatches(p.folderPath, initialWs)
      );
      if (matchedProj) {
        setActiveProject(matchedProj);
      }

      if (modelsRes.models && modelsRes.models.length > 0) {
        setModels(modelsRes.models);
      }

      const savedModel = statusRes.settings?.model || 'gemini-4-argon-medium';
      setSelectedModel(savedModel);
      setSelectedMode(statusRes.settings?.agentMode || 'default');
      setPermissionPolicy(statusRes.settings?.toolPermission || 'always-proceed');

      setConversations(convsRes.conversations || []);
      setCliHistory(histRes.history || []);

      appendLog(
        'info',
        `Antigravity CLI conectado: ${statusRes.agyBinary} (${statusRes.platform}/${statusRes.arch})`
      );

      if (initialWs) {
        const filesRes = await agyApi.getWorkspaceFiles(initialWs);
        setWorkspaceFiles(filesRes.files || []);
      }
    } catch (err: any) {
      appendLog('stderr', `Erro ao inicializar comunicação com o backend: ${err.message}`);
    }
  };

  const handleSaveSettings = async (patch: Partial<AgySettings>) => {
    try {
      const res = await agyApi.saveConfig(patch);
      if (res.ok) {
        setSettings(res.settings);
        if (patch.toolPermission) {
          setPermissionPolicy(String(patch.toolPermission));
        }
        if (patch.model !== undefined && patch.model !== '') {
          setSelectedModel(String(patch.model));
        }
        if (patch.agentMode !== undefined) {
          setSelectedMode(String(patch.agentMode || 'default'));
        }
        appendLog('info', `settings.json atualizado: ${JSON.stringify(patch)}`);
      }
    } catch (err: any) {
      appendLog('stderr', `Falha ao salvar settings.json: ${err.message}`);
    }
  };

  const handleLoadConversation = async (convId: string) => {
    try {
      setActiveConversationId(convId);
      setActiveView('chat');
      const detail = await agyApi.getConversationDetail(convId);
      setArtifacts(detail.artifacts || []);

      const loadedMessages: ChatMessageItem[] = [];
      for (const step of detail.steps || []) {
        if (step.type === 'USER_INPUT') {
          loadedMessages.push({
            id: `step-${step.step_index}`,
            role: 'user',
            content: step.cleanContent || step.content || '',
            timestamp: step.created_at || new Date().toISOString(),
            status: 'done',
          });
        } else if (step.type === 'PLANNER_RESPONSE') {
          const toolCalls = Array.isArray(step.tool_calls)
            ? step.tool_calls.map((tc: any) => ({
                name: tc.name || 'tool',
                args: tc.args || {},
                status: 'done' as const,
              }))
            : undefined;
          if (step.content || step.thinking || (toolCalls && toolCalls.length > 0)) {
            loadedMessages.push({
              id: `step-${step.step_index}`,
              role: 'assistant',
              content: step.content || '',
              thinking: step.thinking || undefined,
              toolCalls,
              timestamp: step.created_at || new Date().toISOString(),
              status: 'done',
            });
          }
        }
      }

      setMessages(loadedMessages);
      appendLog('info', `Conversa ${convId.slice(0, 8)} carregada (${loadedMessages.length} mensagens).`);
    } catch (err: any) {
      appendLog('stderr', `Erro ao carregar conversa: ${err.message}`);
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(undefined);
    setMessages([]);
    setArtifacts([]);
    setActiveView('chat');
    promptTextareaRef.current?.focus();
  };

  const handleSelectWorkspaceFolder = async () => {
    if (window.electronAPI?.selectDirectory) {
      const folder = await window.electronAPI.selectDirectory();
      if (folder) {
        setWorkspace(folder);
        const trusted = Array.isArray(settings.trustedWorkspaces) ? settings.trustedWorkspaces : [];
        if (!trusted.includes(folder)) {
          await handleSaveSettings({ trustedWorkspaces: [...trusted, folder] });
        }
        const filesRes = await agyApi.getWorkspaceFiles(folder);
        setWorkspaceFiles(filesRes.files || []);
      }
    }
  };

  const handlePromptChange = (val: string) => {
    setPromptInput(val);

    // Check for / slash command trigger at start of input
    if (val.startsWith('/')) {
      const firstWord = val.split(/\s+/)[0];
      if (!val.includes(' ')) {
        setShowSlashPopup(true);
        setSlashFilter(firstWord.toLowerCase());
      } else {
        setShowSlashPopup(false);
      }
    } else {
      setShowSlashPopup(false);
    }

    // Check for @ mention trigger
    const atMatch = val.match(/(?:^|\s)@([^\s]*)$/);
    if (atMatch) {
      setShowMentionPopup(true);
      setMentionFilter(atMatch[1].toLowerCase());
    } else {
      setShowMentionPopup(false);
    }
  };

  const handleSelectSlashItem = (item: SlashCommandItem) => {
    setShowSlashPopup(false);

    if (item.actionType === 'open-view' && item.targetView) {
      setPromptInput('');
      setActiveView(item.targetView as MainViewType);
      return;
    }

    if (item.actionType === 'local-action') {
      setPromptInput('');
      handleLocalSlashAction(item.command);
      return;
    }

    if (item.actionType === 'cli-headless') {
      setPromptInput('');
      executePromptThroughCli(item.command, true);
      return;
    }

    // prompt-slash with argument hint
    setPromptInput(`${item.command} `);
    promptTextareaRef.current?.focus();
  };

  const handleSelectMentionFile = (filePath: string) => {
    const replaced = promptInput.replace(/(?:^|\s)@([^\s]*)$/, (m) => {
      const prefix = m.startsWith(' ') ? ' ' : '';
      return `${prefix}@${filePath} `;
    });
    setPromptInput(replaced);
    setShowMentionPopup(false);
    promptTextareaRef.current?.focus();
  };

  const handleLocalSlashAction = (cmd: string) => {
    if (cmd === '/clear') {
      setMessages([]);
      appendLog('info', 'Histórico visual da sessão limpo (/clear).');
    } else if (cmd === '/rewind') {
      setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
      appendLog('info', 'Último turno removido (/rewind).');
    } else if (cmd === '/fork') {
      setActiveConversationId(undefined);
      appendLog('info', 'Conversa ramificada em uma nova sessão (/fork).');
    } else if (cmd === '/copy') {
      const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
      if (lastAssistant?.content) {
        navigator.clipboard.writeText(lastAssistant.content);
        appendLog('info', 'Última resposta copiada para a área de transferência (/copy).');
      }
    } else if (cmd === '/tasks') {
      setRightDrawerOpen(true);
      setRightDrawerTab('terminal');
    }
  };

  const handleSendPrompt = async (overrideText?: string) => {
    const text = (overrideText !== undefined ? overrideText : promptInput).trim();
    if (!text || isStreaming) return;

    setShowSlashPopup(false);
    setShowMentionPopup(false);
    if (overrideText === undefined) {
      setPromptInput('');
    }

    // Intercept /config or /settings to open the full 36-option /config screen directly!
    if (text === '/config' || text === '/settings') {
      setActiveView('config');
      return;
    }
    if (text === '/permissions') {
      setActiveView('permissions');
      return;
    }
    if (text === '/diff') {
      setActiveView('diff');
      return;
    }
    if (text === '/mcp') {
      setActiveView('mcp');
      return;
    }
    if (text === '/plugin' || text === '/plugins') {
      setActiveView('plugins');
      return;
    }
    if (text === '/skills') {
      setActiveView('skills');
      return;
    }
    if (text === '/agents') {
      setActiveView('agents');
      return;
    }
    if (text === '/model') {
      setActiveView('models');
      return;
    }
    if (text.startsWith('/model ')) {
      const modelArg = text.slice(7).trim();
      const found = models.find(
        (m) =>
          m.id.toLowerCase() === modelArg.toLowerCase() ||
          m.label.toLowerCase().includes(modelArg.toLowerCase())
      );
      if (found) {
        setSelectedModel(found.id);
        await handleSaveSettings({ model: found.id });
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `Modelo ativo alterado para **${found.label}** (\`${found.id}\`) e salvo em \`settings.json\`.`,
            timestamp: new Date().toISOString(),
            status: 'done',
          },
        ]);
        return;
      }
    }
    if (text.startsWith('/effort ')) {
      const effArg = text.slice(8).trim().toLowerCase();
      if (['low', 'medium', 'high', 'xhigh', 'max'].includes(effArg)) {
        setSelectedEffort(effArg);
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'system',
            content: `Esforço de raciocínio alterado para **${effArg.toUpperCase()}**.`,
            timestamp: new Date().toISOString(),
            status: 'done',
          },
        ]);
        return;
      }
    }
    if (['/clear', '/rewind', '/fork', '/copy', '/tasks'].includes(text)) {
      handleLocalSlashAction(text);
      return;
    }

    setActiveView('chat');

    // Add User Message
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      model: selectedModel,
      effort: selectedEffort,
      mode: selectedMode,
      permissionPolicy,
      status: 'done',
    };
    setMessages((prev) => [...prev, userMsg]);

    // Check if Permission Policy requires User Confirmation before executing commands
    const requiresUserApproval =
      (permissionPolicy === 'request-review' || permissionPolicy === 'strict') &&
      !text.startsWith('/help') &&
      !text.startsWith('/credits') &&
      !text.startsWith('/usage');

    if (requiresUserApproval) {
      const cmdFlags = [
        `--model ${selectedModel}`,
        `--effort ${selectedEffort}`,
        selectedMode !== 'default' ? `--mode ${selectedMode}` : '',
      ]
        .filter(Boolean)
        .join(' ');

      const approvalMsg: ChatMessageItem = {
        id: `perm-${Date.now()}`,
        role: 'permission-request',
        content: `O modo **Pedir Permissão (${permissionPolicy})** está ativo. Confirme se autoriza o Antigravity CLI a executar este comando/prompt no workspace \`${workspace}\`.`,
        timestamp: new Date().toISOString(),
        commandLine: `agy -p "${text.replace(/"/g, '\\"')}" ${cmdFlags}`,
        status: 'awaiting-permission',
        pendingAction: {
          prompt: text,
          commandDescription: `agy -p "${text.slice(0, 80)}" ${cmdFlags}`,
          workspace,
          model: selectedModel,
          effort: selectedEffort,
          mode: selectedMode,
        },
      };
      setMessages((prev) => [...prev, approvalMsg]);
      appendLog('info', `Aguardando aprovação do usuário para executar: ${approvalMsg.commandLine}`);
      return;
    }

    await executePromptThroughCli(text, false);
  };

  const handleApprovePendingCommand = async (
    msgId: string,
    action: 'approve-once' | 'approve-always' | 'approve-sandbox' | 'reject'
  ) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg || !targetMsg.pendingAction) return;

    if (action === 'reject') {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                status: 'error',
                content: '✕ Execução cancelada pelo usuário (Permissão negada).',
              }
            : m
        )
      );
      appendLog('stderr', 'Execução recusada pelo usuário.');
      return;
    }

    let policyToUse = permissionPolicy;
    if (action === 'approve-always') {
      policyToUse = 'always-proceed';
      setPermissionPolicy('always-proceed');
      await handleSaveSettings({ toolPermission: 'always-proceed' });
    } else if (action === 'approve-sandbox') {
      policyToUse = 'proceed-in-sandbox';
    } else {
      policyToUse = 'always-proceed';
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              status: 'done',
              content: `✓ Execução autorizada pelo usuário (${
                action === 'approve-always'
                  ? 'Modo Automático ativado'
                  : action === 'approve-sandbox'
                  ? 'Em Sandbox'
                  : 'Aprovado para este turno'
              }).`,
            }
          : m
      )
    );

    await executePromptThroughCli(targetMsg.pendingAction.prompt, true, policyToUse);
  };

  const executePromptThroughCli = async (
    promptText: string,
    skipUserAdd = false,
    overridePolicy?: string
  ) => {
    if (!skipUserAdd && messages[messages.length - 1]?.content !== promptText) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: promptText,
          timestamp: new Date().toISOString(),
          status: 'done',
        },
      ]);
    }

    const runId = `run-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;
    const effectivePolicy = overridePolicy || permissionPolicy;

    setIsStreaming(true);
    setActiveRunId(runId);

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        model: selectedModel,
        effort: selectedEffort,
        mode: selectedMode,
        permissionPolicy: effectivePolicy,
        status: 'streaming',
      },
    ]);

    try {
      await agyApi.streamChat(
        {
          runId,
          prompt: promptText,
          workspace,
          model: selectedModel,
          effort: selectedEffort,
          mode: selectedMode,
          permissionPolicy: effectivePolicy,
          conversationId: activeConversationId,
          projectId: activeProject?.id,
          sandbox: effectivePolicy === 'proceed-in-sandbox' || Boolean(settings.enableTerminalSandbox),
        },
        (ev) => {
          if (ev.type === 'command_started') {
            appendLog('cmd', ev.data.commandLine);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, commandLine: ev.data.commandLine } : m
              )
            );
          } else if (ev.type === 'init') {
            if (ev.data.conversationId) {
              setActiveConversationId(ev.data.conversationId);
              appendLog(
                'info',
                `Sessão iniciada: ${ev.data.conversationId.slice(0, 8)} (modelo: ${ev.data.model || selectedModel})`
              );
            }
          } else if (ev.type === 'thinking_delta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, thinking: (m.thinking || '') + ev.data.delta }
                  : m
              )
            );
          } else if (ev.type === 'thinking') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, thinking: ev.data.thinking } : m
              )
            );
          } else if (ev.type === 'text_delta') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: (m.content || '') + ev.data.delta }
                  : m
              )
            );
          } else if (ev.type === 'tool_step') {
            const toolName = ev.data.name || 'tool';
            const toolArgs = ev.data.args || {};
            appendLog('info', `[Tool] ${toolName}: ${JSON.stringify(toolArgs).slice(0, 120)}`);
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantMsgId) return m;
                const existing = m.toolCalls || [];
                return {
                  ...m,
                  toolCalls: [
                    ...existing,
                    {
                      name: toolName,
                      args: toolArgs,
                      status: ev.data.state === 'DONE' ? 'done' : 'running',
                    },
                  ],
                };
              })
            );
          } else if (ev.type === 'result') {
            if (ev.data.conversationId) {
              setActiveConversationId(ev.data.conversationId);
            }
            if (ev.data.usage) {
              appendLog(
                'info',
                `Concluído em ${(ev.data.durationSeconds || 0).toFixed(1)}s | Tokens: ${ev.data.usage.total_tokens || 0}`
              );
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: m.content || ev.data.response || '',
                      status: 'done',
                    }
                  : m
              )
            );
          } else if (ev.type === 'stdout') {
            appendLog('stdout', ev.data.text);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: (m.content ? m.content + '\n' : '') + ev.data.text }
                  : m
              )
            );
          } else if (ev.type === 'stderr') {
            appendLog('stderr', ev.data.text);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId && !m.content
                  ? { ...m, content: ev.data.text }
                  : m
              )
            );
          } else if (ev.type === 'error') {
            appendLog('stderr', `Erro: ${ev.data.message}`);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      status: 'error',
                      content: m.content || `Erro ao executar o Antigravity CLI: ${ev.data.message}`,
                    }
                  : m
              )
            );
          } else if (ev.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      status: 'done',
                      content: m.content || '(Comando executado com sucesso sem saída adicional)',
                    }
                  : m
              )
            );
          }
        }
      );

      // Refresh conversations list after turn finishes
      const convsRes = await agyApi.getConversations();
      setConversations(convsRes.conversations || []);
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, status: 'error', content: `Falha na execução: ${err.message}` }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setActiveRunId(null);
    }
  };

  const handleStopStream = async () => {
    if (activeRunId) {
      await agyApi.cancelRun(activeRunId);
      appendLog('info', `Execução ${activeRunId} interrompida pelo usuário.`);
      setIsStreaming(false);
      setActiveRunId(null);
    }
  };

  const handleRunDirectTerminalCmd = async () => {
    const cmd = directCliInput.trim();
    if (!cmd) return;
    setDirectCliInput('');
    appendLog('cmd', `$ ${cmd}`);

    try {
      if (cmd.startsWith('agy ')) {
        const args = cmd
          .slice(4)
          .match(/(?:[^\s"]+|"[^"]*")+/g)
          ?.map((s) => s.replace(/^"|"$/g, '')) || [];
        const res = await agyApi.execCli(args, workspace);
        if (res.stdout) appendLog('stdout', res.stdout);
        if (res.stderr) appendLog('stderr', res.stderr);
      } else {
        const res = await agyApi.execShell(cmd, workspace);
        if (res.stdout) appendLog('stdout', res.stdout);
        if (res.stderr) appendLog('stderr', res.stderr);
      }
    } catch (err: any) {
      appendLog('stderr', err.message);
    }
  };

  const handleCycleModeKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault();
      const modes = ['default', 'auto', 'accept-edits', 'plan'];
      const nextIdx = (modes.indexOf(selectedMode) + 1) % modes.length;
      const nextMode = modes[nextIdx];
      setSelectedMode(nextMode);
      handleSaveSettings({ agentMode: nextMode });
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showSlashPopup) {
        const matching = CLI_SLASH_COMMANDS.filter((c) =>
          c.command.toLowerCase().startsWith(slashFilter)
        );
        if (matching.length > 0 && promptInput.trim() === matching[0].command) {
          handleSelectSlashItem(matching[0]);
          return;
        }
      }
      handleSendPrompt();
    }
  };

  const filteredSlashCommands = CLI_SLASH_COMMANDS.filter(
    (c) =>
      !slashFilter ||
      c.command.toLowerCase().includes(slashFilter) ||
      c.label.toLowerCase().includes(slashFilter)
  );

  const filteredMentions = workspaceFiles
    .filter((f) => !mentionFilter || f.toLowerCase().includes(mentionFilter))
    .slice(0, 12);

  // Group conversations if pickerGrouping === 'workspace'
  const groupedConversations = React.useMemo(() => {
    if (settings.pickerGrouping !== 'workspace') {
      return { Todos: conversations };
    }
    const groups: Record<string, any[]> = {};
    for (const c of conversations) {
      const wsName = c.workspace ? c.workspace.split('/').pop() || c.workspace : 'Global';
      if (!groups[wsName]) groups[wsName] = [];
      groups[wsName].push(c);
    }
    return groups;
  }, [conversations, settings.pickerGrouping]);

  return (
    <div className="agy-app-shell">
      {/* TOP DRAGGABLE WINDOW TITLEBAR */}
      <header
        className={`agy-window-titlebar ${
          window.electronAPI?.platform === 'darwin' || navigator.userAgent.includes('Mac')
            ? 'is-mac'
            : ''
        }`}
      >
        <div className="agy-titlebar-left">
          <AntigravityLogo size={18} pulsing={isStreaming} />
          <span>Antigravity CLI Studio</span>
        </div>

        <div className="agy-titlebar-center">
          {activeProject && (
            <span className="agy-project-active-tag">Projeto: {activeProject.name}</span>
          )}
          <span className="agy-workspace-pill">
            <FolderOpen size={12} />
            <code>{workspace || '~'}</code>
          </span>
          {activeConversationId && (
            <span className="agy-conv-badge">
              Sessão: <code>{activeConversationId.slice(0, 8)}</code>
            </span>
          )}
        </div>

        <div className="agy-titlebar-right">
          <span className="agy-msg-meta-pill">{selectedModel}</span>
          <button
            type="button"
            className="agy-icon-btn"
            onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
            title="Alternar Painel Auxiliar"
          >
            {rightDrawerOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>
      </header>

      <div className="agy-app-body">
        {/* LEFT-HAND SIDEBAR (Antigravity 2.0 Surface) */}
        <aside className="agy-sidebar">
          {/* New Conversation Button */}
          <div className="agy-sidebar-cta" style={{ paddingTop: 14 }}>
            <button
              type="button"
              className="agy-new-conv-btn"
              onClick={handleNewConversation}
            >
              <MessageSquarePlus size={16} />
              <span>Nova Conversa</span>
            </button>
          </div>

          {/* Projects & Workspace Section (CLI Projects in ~/.gemini/config/projects/) */}
          <div className="agy-sidebar-workspace">
            <div className="agy-projects-header-row">
              <span className="agy-sidebar-section-label" style={{ marginBottom: 0 }}>
                PROJETO / WORKSPACE
              </span>
              <button
                type="button"
                className="agy-link-btn"
                onClick={() => setIsProjectModalOpen(true)}
                title="Criar novo projeto indicando a pasta no disco"
              >
                + Novo Projeto
              </button>
            </div>

            <select
              className="agy-workspace-select"
              value={activeProject?.id || workspace}
              onChange={(e) => {
                const val = e.target.value;
                const foundProj = projects.find((p) => p.id === val);
                if (foundProj) {
                  setActiveProject(foundProj);
                  if (foundProj.folderPath) {
                    setWorkspace(foundProj.folderPath);
                  }
                  if (foundProj.settings?.autoExecutionPolicy === 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF') {
                    setPermissionPolicy('request-review');
                  } else if (foundProj.settings?.autoExecutionPolicy === 'CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX') {
                    setPermissionPolicy('proceed-in-sandbox');
                  } else if (foundProj.settings?.autoExecutionPolicy === 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER') {
                    setPermissionPolicy('always-proceed');
                  }
                } else {
                  setActiveProject(null);
                  setWorkspace(val);
                }
              }}
            >
              {projects.length > 0 && (
                <optgroup label="Projetos Registrados (~/.gemini/config/projects/)">
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      📁 {p.name} {p.folderPath ? `(${p.folderPath.split(/[\/\\]/).pop()})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Pastas Confiáveis (trustedWorkspaces)">
                {Array.isArray(settings.trustedWorkspaces) &&
                  settings.trustedWorkspaces.map((ws) => (
                    <option key={ws} value={ws}>
                      📂 {ws.split(/[\/\\]/).pop() || ws}
                    </option>
                  ))}
              </optgroup>
            </select>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              {window.electronAPI?.isElectron && (
                <button
                  type="button"
                  className="agy-link-btn"
                  onClick={handleSelectWorkspaceFolder}
                >
                  Abrir outra pasta...
                </button>
              )}
            </div>
          </div>

        {/* Navigation: CLI Commands as UI Items */}
        <nav className="agy-sidebar-nav">
          <div className="agy-sidebar-section-label">COMANDOS & SUPERFÍCIES DO CLI</div>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveView('chat')}
          >
            <Sparkles size={16} />
            <span>Chat Canvas</span>
            <code className="agy-nav-cmd">agy</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'config' ? 'active' : ''}`}
            onClick={() => setActiveView('config')}
          >
            <Settings size={16} />
            <span>Configurações</span>
            <code className="agy-nav-cmd">/config</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveView('permissions')}
          >
            <Shield size={16} />
            <span>Permissões</span>
            <code className="agy-nav-cmd">/permissions</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'models' ? 'active' : ''}`}
            onClick={() => setActiveView('models')}
          >
            <Cpu size={16} />
            <span>Modelos & Esforço</span>
            <code className="agy-nav-cmd">models</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'mcp' ? 'active' : ''}`}
            onClick={() => setActiveView('mcp')}
          >
            <Server size={16} />
            <span>Servidores MCP</span>
            <code className="agy-nav-cmd">mcp</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'plugins' ? 'active' : ''}`}
            onClick={() => setActiveView('plugins')}
          >
            <Puzzle size={16} />
            <span>Plugins</span>
            <code className="agy-nav-cmd">plugin</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveView('skills')}
          >
            <BookOpen size={16} />
            <span>Skills & Hooks</span>
            <code className="agy-nav-cmd">/skills</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'agents' ? 'active' : ''}`}
            onClick={() => setActiveView('agents')}
          >
            <Bot size={16} />
            <span>Subagentes</span>
            <code className="agy-nav-cmd">agents</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'diff' ? 'active' : ''}`}
            onClick={() => setActiveView('diff')}
          >
            <GitBranch size={16} />
            <span>Git Diff</span>
            <code className="agy-nav-cmd">/diff</code>
          </button>

          <button
            type="button"
            className={`agy-nav-item ${activeView === 'system' ? 'active' : ''}`}
            onClick={() => setActiveView('system')}
          >
            <Radio size={16} />
            <span>Remote & Sistema</span>
            <code className="agy-nav-cmd">remote</code>
          </button>
        </nav>

        {/* Conversations List (/resume) */}
        <div className="agy-sidebar-conversations">
          <div className="agy-sidebar-section-label">
            <span> SESSÕES (<code>/resume</code>)</span>
            <button
              type="button"
              className="agy-link-btn"
              title="Alternar agrupamento por workspace (pickerGrouping)"
              onClick={() =>
                handleSaveSettings({
                  pickerGrouping: settings.pickerGrouping === 'workspace' ? 'none' : 'workspace',
                })
              }
            >
              {settings.pickerGrouping === 'workspace' ? 'Por Pasta' : 'Plano'}
            </button>
          </div>

          <div className="agy-conv-scroll">
            {Object.entries(groupedConversations).map(([groupName, list]) => (
              <div key={groupName} className="agy-conv-group">
                {settings.pickerGrouping === 'workspace' && (
                  <div className="agy-conv-group-header">{groupName}</div>
                )}
                {list.slice(0, 20).map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className={`agy-conv-item ${activeConversationId === conv.id ? 'active' : ''}`}
                    onClick={() => handleLoadConversation(conv.id)}
                  >
                    <div className="agy-conv-item-title">{conv.title}</div>
                    <div className="agy-conv-item-meta">
                      <span>{conv.stepCount} passos</span>
                      <span>•</span>
                      <span>{conv.id.slice(0, 6)}</span>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER MAIN WORKSPACE */}
      <main className="agy-main-area">
        {/* View Switcher */}
        <div className="agy-content-body">
          {activeView === 'config' ? (
            <ConfigView
              settings={settings}
              models={models}
              settingsPath={systemStatus?.settingsPath || '~/.gemini/antigravity-cli/settings.json'}
              activeProject={activeProject}
              onSaveSettings={handleSaveSettings}
              onSaveProjectSettings={handleSaveProjectSettings}
              onRunHeadlessConfig={() => {
                setActiveView('chat');
                executePromptThroughCli('/config', false);
              }}
            />
          ) : activeView !== 'chat' ? (
            <CliModulesView
              activeTab={activeView}
              settings={settings}
              models={models}
              workspace={workspace}
              selectedModel={selectedModel}
              selectedEffort={selectedEffort}
              onSelectModel={setSelectedModel}
              onSelectEffort={setSelectedEffort}
              onSaveSettings={handleSaveSettings}
              onSendPromptFromModule={(text) => {
                setActiveView('chat');
                if (text.endsWith(': ')) {
                  setPromptInput(text);
                  setTimeout(() => promptTextareaRef.current?.focus(), 50);
                } else {
                  handleSendPrompt(text);
                }
              }}
            />
          ) : (
            /* CHAT CANVAS */
            <div className="agy-chat-canvas">
              <div className="agy-messages-scroll">
                {messages.length === 0 ? (
                  <div className="agy-empty-hero">
                    <div className="agy-empty-logo-wrap">
                      <AntigravityLogo size={64} pulsing={false} />
                    </div>
                    <h1>Antigravity CLI Studio</h1>
                    <p>
                      Interface gráfica multiplataforma (Linux, Windows & macOS) integrada ao{' '}
                      <code>agy</code>. Digite um prompt, use <code>/</code> para comandos do CLI ou{' '}
                      <code>@</code> para anexar arquivos do workspace.
                    </p>

                    <div className="agy-quick-actions-grid">
                      <button
                        type="button"
                        className="agy-quick-card"
                        onClick={() => setActiveView('config')}
                      >
                        <Settings size={18} className="agy-accent-icon" />
                        <div>
                          <strong>Abrir <code>/config</code> Completo</strong>
                          <span>Todas as 36 configurações do Antigravity CLI</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="agy-quick-card"
                        onClick={() => setActiveView('permissions')}
                      >
                        <Shield size={18} className="agy-accent-icon" />
                        <div>
                          <strong>Permissão de Comandos</strong>
                          <span>
                            Atual:{' '}
                            {permissionPolicy === 'always-proceed'
                              ? '⚡ Automático'
                              : '✋ Pedir Permissão'}
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="agy-quick-card"
                        onClick={() => handleSendPrompt('/skills')}
                      >
                        <BookOpen size={18} className="agy-accent-icon" />
                        <div>
                          <strong>Listar Skills (<code>/skills</code>)</strong>
                          <span>Inspecionar skills ativas no CLI</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="agy-quick-card"
                        onClick={() => handleSendPrompt('/credits')}
                      >
                        <Sparkles size={18} className="agy-accent-icon" />
                        <div>
                          <strong>Consultar Cota & Créditos (<code>/credits</code>)</strong>
                          <span>Verificar status da conta no Antigravity</span>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="agy-messages-list">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`agy-message-row ${msg.role}`}>
                        <div className="agy-message-card">
                          <div className="agy-message-header">
                            <span className="agy-message-author">
                              {msg.role === 'user'
                                ? 'Você'
                                : msg.role === 'permission-request'
                                ? '🛡️ Controle de Permissão de Execução'
                                : msg.role === 'system'
                                ? '⚙️ Sistema Antigravity'
                                : 'Antigravity Agent'}
                            </span>
                            {msg.model && (
                              <span className="agy-msg-meta-pill">{msg.model}</span>
                            )}
                            {msg.effort && (
                              <span className="agy-msg-meta-pill">effort: {msg.effort}</span>
                            )}
                            {msg.permissionPolicy && (
                              <span
                                className={`agy-msg-meta-pill ${
                                  msg.permissionPolicy === 'always-proceed' ? 'auto' : 'review'
                                }`}
                              >
                                {msg.permissionPolicy === 'always-proceed'
                                  ? '⚡ Auto'
                                  : '✋ Revisão'}
                              </span>
                            )}
                          </div>

                          {/* Collapsible Thinking / Reasoning */}
                          {msg.thinking && (
                            <details className="agy-thinking-box">
                              <summary>
                                <ChevronRight size={14} /> Raciocínio do Modelo (Thinking)
                              </summary>
                              <pre>{msg.thinking}</pre>
                            </details>
                          )}

                          {/* Tool Calls */}
                          {msg.toolCalls && msg.toolCalls.length > 0 && (
                            <div className="agy-toolcalls-stack">
                              {msg.toolCalls.map((tc, idx) => (
                                <div key={idx} className="agy-toolcall-item">
                                  <Terminal size={13} className="agy-accent-icon" />
                                  <code>{tc.name}</code>
                                  <span className="agy-toolcall-args">
                                    {JSON.stringify(tc.args).slice(0, 120)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* CLI Command Line Executed */}
                          {msg.commandLine && (
                            <div className="agy-cmdline-chip">
                              <Terminal size={12} />
                              <code>{msg.commandLine}</code>
                            </div>
                          )}

                          {/* Content */}
                          <div className="agy-message-content">
                            {msg.status === 'streaming' && !msg.content ? (
                              <div className="agy-streaming-indicator">
                                <span className="dot" />
                                <span className="dot" />
                                <span className="dot" />
                                <span>Executando no Antigravity CLI...</span>
                              </div>
                            ) : (
                              <pre className="agy-message-text">{msg.content}</pre>
                            )}
                          </div>

                          {/* Interactive Permission Approval Buttons */}
                          {msg.role === 'permission-request' &&
                            msg.status === 'awaiting-permission' && (
                              <div className="agy-permission-actions-bar">
                                <button
                                  type="button"
                                  className="agy-btn agy-btn-primary"
                                  onClick={() =>
                                    handleApprovePendingCommand(msg.id, 'approve-once')
                                  }
                                >
                                  <Check size={14} /> Aprovar e Executar Comando
                                </button>
                                <button
                                  type="button"
                                  className="agy-btn agy-btn-success"
                                  onClick={() =>
                                    handleApprovePendingCommand(msg.id, 'approve-always')
                                  }
                                >
                                  <Unlock size={14} /> Mudar para Automático (Sempre Aprovar)
                                </button>
                                <button
                                  type="button"
                                  className="agy-btn agy-btn-secondary"
                                  onClick={() =>
                                    handleApprovePendingCommand(msg.id, 'approve-sandbox')
                                  }
                                >
                                  <Lock size={14} /> Executar em Sandbox
                                </button>
                                <button
                                  type="button"
                                  className="agy-btn agy-btn-danger"
                                  onClick={() => handleApprovePendingCommand(msg.id, 'reject')}
                                >
                                  <X size={14} /> Recusar
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* PROMPT COMPOSER + BELOW-PROMPT MODEL & PERMISSION BAR */}
              <div className="agy-composer-Dock">
                {/* / Slash Command Palette Popup */}
                {showSlashPopup && (
                  <div className="agy-floating-palette">
                    <div className="agy-palette-header">
                      <span>Comandos Slash do Antigravity CLI (<code>/</code>)</span>
                      <button
                        type="button"
                        className="agy-icon-btn-sm"
                        onClick={() => setShowSlashPopup(false)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="agy-palette-list">
                      {filteredSlashCommands.map((item) => (
                        <button
                          key={item.command}
                          type="button"
                          className="agy-palette-item"
                          onClick={() => handleSelectSlashItem(item)}
                        >
                          <div className="agy-palette-item-left">
                            <code>{item.command}</code>
                            {item.argHint && (
                              <span className="agy-arg-hint">{item.argHint}</span>
                            )}
                          </div>
                          <span className="agy-palette-desc">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* @ Context Mention Popup */}
                {showMentionPopup && (
                  <div className="agy-floating-palette">
                    <div className="agy-palette-header">
                      <span>Anexar Arquivo do Workspace (<code>@</code>)</span>
                      <button
                        type="button"
                        className="agy-icon-btn-sm"
                        onClick={() => setShowMentionPopup(false)}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="agy-palette-list">
                      {filteredMentions.map((f) => (
                        <button
                          key={f}
                          type="button"
                          className="agy-palette-item"
                          onClick={() => handleSelectMentionFile(f)}
                        >
                          <code>@{f}</code>
                          <span className="agy-palette-desc">Arquivo do workspace</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="agy-prompt-box">
                  <textarea
                    ref={promptTextareaRef}
                    className="agy-prompt-textarea"
                    rows={3}
                    placeholder="Envie uma instrução ao Antigravity CLI... (Digite /config para todas as opções, / para comandos, @ para arquivos)"
                    value={promptInput}
                    onChange={(e) => handlePromptChange(e.target.value)}
                    onKeyDown={handleCycleModeKey}
                  />

                  {/* BELOW-PROMPT CONTROL BAR (Requested: Model Combo + Command Permission Selector + Mode/Effort) */}
                  <div className="agy-prompt-footer-bar">
                    <div className="agy-prompt-controls-left">
                      {/* Quick / and @ triggers */}
                      <button
                        type="button"
                        className="agy-footer-icon-btn"
                        title="Abrir menu de Slash Commands (/)"
                        onClick={() => {
                          setShowSlashPopup(!showSlashPopup);
                          setSlashFilter('');
                        }}
                      >
                        <Slash size={14} />
                      </button>
                      <button
                        type="button"
                        className="agy-footer-icon-btn"
                        title="Mencionar arquivo do workspace (@)"
                        onClick={() => {
                          setShowMentionPopup(!showMentionPopup);
                          setMentionFilter('');
                        }}
                      >
                        <AtSign size={14} />
                      </button>

                      {/* 1. COMBO ABAIXO DO PROMPT PARA ESCOLHER O MODELO */}
                      <div className="agy-control-group" title="Escolher o modelo do Antigravity CLI (--model)">
                        <Cpu size={14} className="agy-accent-icon" />
                        <select
                          aria-label="Selecionar Modelo"
                          className="agy-footer-select model-combo"
                          value={selectedModel}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedModel(val);
                            const suffixMatch = val.match(/-(low|medium|high|xhigh|max)$/i);
                            if (suffixMatch) {
                              setSelectedEffort(suffixMatch[1].toLowerCase());
                            }
                            handleSaveSettings({ model: val });
                          }}
                        >
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. COMBO DE ESFORÇO DE RACIOCÍNIO (--effort) */}
                      <div className="agy-control-group" title="Esforço de raciocínio (--effort)">
                        <select
                          aria-label="Esforço de Raciocínio"
                          className="agy-footer-select"
                          value={selectedEffort}
                          onChange={(e) => {
                            const nextEffort = e.target.value;
                            setSelectedEffort(nextEffort);
                            const basePrefix = selectedModel.replace(/-(low|medium|high|xhigh|max)$/i, '');
                            const candidate = `${basePrefix}-${nextEffort}`;
                            if (models.some((m) => m.id === candidate)) {
                              setSelectedModel(candidate);
                              handleSaveSettings({ model: candidate });
                            }
                          }}
                        >
                          <option value="low">Effort: Low</option>
                          <option value="medium">Effort: Medium</option>
                          <option value="high">Effort: High</option>
                          <option value="xhigh">Effort: X-High</option>
                          <option value="max">Effort: Max</option>
                        </select>
                      </div>

                      {/* 3. SELETOR DE PERMISSÃO DE EXECUÇÃO DE COMANDOS (Automático vs Pedir Permissão) */}
                      <div
                        className={`agy-control-group permission-selector ${
                          permissionPolicy === 'always-proceed'
                            ? 'is-auto'
                            : permissionPolicy === 'request-review'
                            ? 'is-ask'
                            : 'is-sandbox'
                        }`}
                        title="Indicar se o usuário deve dar permissão para execução de comandos ou se será automático"
                      >
                        {permissionPolicy === 'always-proceed' ? (
                          <Unlock size={14} />
                        ) : permissionPolicy === 'request-review' ? (
                          <AlertTriangle size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                        <select
                          aria-label="Política de Permissão de Execução de Comandos"
                          className="agy-footer-select"
                          value={permissionPolicy}
                          onChange={(e) => {
                            const nextPolicy = e.target.value;
                            setPermissionPolicy(nextPolicy);
                            handleSaveSettings({ toolPermission: nextPolicy });
                          }}
                        >
                          <option value="always-proceed">
                            ⚡ Comandos: Automático (Sem pedir permissão)
                          </option>
                          <option value="request-review">
                            ✋ Comandos: Pedir Permissão ao Usuário
                          </option>
                          <option value="proceed-in-sandbox">
                            🔒 Comandos: Automático em Sandbox
                          </option>
                          <option value="strict">
                            🛡️ Comandos: Modo Estrito (Sempre pedir)
                          </option>
                        </select>
                      </div>

                      {/* 4. COMBO DE MODO DO AGENTE (--mode) */}
                      <div className="agy-control-group" title="Modo de execução da sessão (--mode / Shift+Tab)">
                        <select
                          aria-label="Modo de Execução"
                          className="agy-footer-select"
                          value={selectedMode}
                          onChange={(e) => {
                            setSelectedMode(e.target.value);
                            handleSaveSettings({ agentMode: e.target.value });
                          }}
                        >
                          <option value="default">Modo: Padrão</option>
                          <option value="auto">Modo: Auto</option>
                          <option value="accept-edits">Modo: Accept Edits</option>
                          <option value="plan">Modo: Plan</option>
                        </select>
                      </div>
                    </div>

                    <div className="agy-prompt-controls-right">
                      {isStreaming ? (
                        <button
                          type="button"
                          className="agy-send-btn stop"
                          onClick={handleStopStream}
                        >
                          <Square size={14} /> Parar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="agy-send-btn"
                          onClick={() => handleSendPrompt()}
                          disabled={!promptInput.trim()}
                        >
                          <Send size={14} /> Enviar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RIGHT AUXILIARY PANE (Antigravity 2.0 Auxiliary Pane) */}
      {rightDrawerOpen && (
        <aside className="agy-aux-drawer">
          <div className="agy-aux-tabs">
            <button
              type="button"
              className={`agy-aux-tab ${rightDrawerTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setRightDrawerTab('terminal')}
            >
              <Terminal size={14} /> CLI & Terminal
            </button>
            <button
              type="button"
              className={`agy-aux-tab ${rightDrawerTab === 'artifacts' ? 'active' : ''}`}
              onClick={() => setRightDrawerTab('artifacts')}
            >
              <FileText size={14} /> Artefatos ({artifacts.length})
            </button>
            <button
              type="button"
              className={`agy-aux-tab ${rightDrawerTab === 'history' ? 'active' : ''}`}
              onClick={() => setRightDrawerTab('history')}
            >
              <History size={14} /> Histórico
            </button>
          </div>

          <div className="agy-aux-body">
            {rightDrawerTab === 'terminal' && (
              <div className="agy-aux-terminal">
                <div className="agy-aux-terminal-logs">
                  {terminalLogs.map((l) => (
                    <div key={l.id} className={`agy-term-line ${l.type}`}>
                      <span className="agy-term-time">{l.time}</span>
                      <span className="agy-term-text">{l.text}</span>
                    </div>
                  ))}
                </div>
                <div className="agy-aux-terminal-input">
                  <input
                    type="text"
                    placeholder="Executar comando CLI (ex: agy models)..."
                    value={directCliInput}
                    onChange={(e) => setDirectCliInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunDirectTerminalCmd()}
                  />
                  <button
                    type="button"
                    className="agy-icon-btn"
                    onClick={handleRunDirectTerminalCmd}
                  >
                    <Play size={14} />
                  </button>
                </div>
              </div>
            )}

            {rightDrawerTab === 'artifacts' && (
              <div className="agy-aux-list">
                {artifacts.length === 0 ? (
                  <p className="agy-muted-text" style={{ padding: 16 }}>
                    Nenhum artefato gerado nesta conversa ainda.
                  </p>
                ) : (
                  artifacts.map((art) => (
                    <details key={art.path} className="agy-artifact-card">
                      <summary>
                        <FileText size={14} className="agy-accent-icon" />
                        <span>{art.name}</span>
                      </summary>
                      <pre className="agy-artifact-pre">{art.content}</pre>
                    </details>
                  ))
                )}
              </div>
            )}

            {rightDrawerTab === 'history' && (
              <div className="agy-aux-list">
                {cliHistory.map((h, i) => (
                  <button
                    key={i}
                    type="button"
                    className="agy-history-item"
                    onClick={() => {
                      setPromptInput(h.display || '');
                      setActiveView('chat');
                    }}
                  >
                    <code>{h.display}</code>
                    <span>{h.workspace ? h.workspace.split('/').pop() : 'CLI'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
        initialPath={workspace}
      />
    </div>
  );
};
