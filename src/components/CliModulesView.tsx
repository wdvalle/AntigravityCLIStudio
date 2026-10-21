import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cpu,
  Server,
  Puzzle,
  BookOpen,
  Bot,
  GitBranch,
  Radio,
  RefreshCw,
  Plus,
  Play,
  Check,
  Terminal,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  ExternalLink,
  FolderCheck,
  Trash2,
} from 'lucide-react';
import { AgyModelInfo, AgySettings } from '../types/agy';
import { agyApi } from '../services/api';

interface CliModulesViewProps {
  activeTab: 'permissions' | 'models' | 'mcp' | 'plugins' | 'skills' | 'agents' | 'diff' | 'system';
  settings: AgySettings;
  models: AgyModelInfo[];
  workspace: string;
  selectedModel: string;
  selectedEffort: string;
  onSelectModel: (modelId: string) => void;
  onSelectEffort: (effort: string) => void;
  onSaveSettings: (patch: Partial<AgySettings>) => Promise<void>;
  onSendPromptFromModule: (promptText: string) => void;
}

export const CliModulesView: React.FC<CliModulesViewProps> = ({
  activeTab,
  settings,
  models,
  workspace,
  selectedModel,
  selectedEffort,
  onSelectModel,
  onSelectEffort,
  onSaveSettings,
  onSendPromptFromModule,
}) => {
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [mcpCliOutput, setMcpCliOutput] = useState('');
  const [selectedMcpServer, setSelectedMcpServer] = useState<any | null>(null);
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpCmd, setNewMcpCmd] = useState('');

  const [pluginsOutput, setPluginsOutput] = useState('');
  const [pluginTarget, setPluginTarget] = useState('');

  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  const [agentsOutput, setAgentsOutput] = useState('');
  const [diffData, setDiffData] = useState<{ branch: string; status: string; diff: string }>({
    branch: 'main',
    status: '',
    diff: '',
  });

  const [changelogText, setChangelogText] = useState('');
  const [remoteStatus, setRemoteStatus] = useState('');
  const [loadingModule, setLoadingModule] = useState(false);
  const [moduleActionResult, setModuleActionResult] = useState<string | null>(null);
  const [newTrustedWs, setNewTrustedWs] = useState('');

  useEffect(() => {
    loadActiveTabData();
  }, [activeTab, workspace]);

  const loadActiveTabData = async () => {
    setLoadingModule(true);
    setModuleActionResult(null);
    try {
      if (activeTab === 'mcp') {
        const data = await agyApi.getMcpServers();
        setMcpServers(data.servers || []);
        setMcpCliOutput(data.cliOutput || '');
        if (data.servers?.length > 0 && !selectedMcpServer) {
          setSelectedMcpServer(data.servers[0]);
        }
      } else if (activeTab === 'plugins') {
        const data = await agyApi.getPlugins();
        setPluginsOutput(data.output || 'Nenhum plugin instalado no momento.');
      } else if (activeTab === 'skills') {
        const data = await agyApi.getSkills(workspace);
        setSkills(data.skills || []);
        if (data.skills?.length > 0 && !selectedSkill) {
          setSelectedSkill(data.skills[0]);
        }
      } else if (activeTab === 'agents') {
        const data = await agyApi.getAgents();
        setAgentsOutput(data.output || '');
      } else if (activeTab === 'diff') {
        const data = await agyApi.getWorkspaceDiff(workspace);
        setDiffData(data);
      } else if (activeTab === 'system') {
        const [cl, rc] = await Promise.all([
          agyApi.getChangelog(),
          agyApi.runRemoteControl('status'),
        ]);
        setChangelogText(cl.changelog || '');
        setRemoteStatus(rc.stdout || rc.stderr || 'Daemon parado');
      }
    } catch (err: any) {
      setModuleActionResult(`Erro: ${err.message}`);
    } finally {
      setLoadingModule(false);
    }
  };

  // 1. PERMISSIONS VIEW (/permissions)
  if (activeTab === 'permissions') {
    const currentPolicy = settings.toolPermission || 'always-proceed';
    const trustedList = Array.isArray(settings.trustedWorkspaces) ? settings.trustedWorkspaces : [];

    const defaultRules = [
      { rule: 'run_command(*)', scope: 'Global', policy: currentPolicy === 'always-proceed' ? 'allowed' : 'ask' },
      { rule: 'write_file(workspace/**)', scope: 'Workspace', policy: currentPolicy === 'always-proceed' ? 'allowed' : 'ask' },
      { rule: 'read_file(~/.gemini/antigravity-cli/scratch)', scope: 'System', policy: 'allowed' },
      { rule: 'read_file(~/.gemini/antigravity-cli/builtin)', scope: 'System', policy: 'allowed' },
      { rule: 'read_file(~/.gemini/config/skills)', scope: 'Global', policy: 'allowed' },
      { rule: 'write_file(.env*)', scope: 'Security Guard', policy: 'ask' },
      { rule: 'write_file(.git-credentials)', scope: 'Security Guard', policy: 'ask' },
    ];

    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <Shield size={20} className="agy-accent-icon" />
              <h2>Permissões e Execução de Comandos (<code>/permissions</code>)</h2>
            </div>
            <p className="agy-panel-subtitle">
              Configure se o usuário deve aprovar comandos manualmente ou se o Antigravity CLI deve executá-los automaticamente
            </p>
          </div>
          <button
            type="button"
            className="agy-btn agy-btn-secondary"
            onClick={() => onSendPromptFromModule('/permissions')}
          >
            <Terminal size={14} /> Executar <code>/permissions</code> no Chat
          </button>
        </div>

        {/* Policy Cards */}
        <div className="agy-policy-cards-grid">
          <div
            className={`agy-policy-card ${currentPolicy === 'always-proceed' ? 'selected success' : ''}`}
            onClick={() => onSaveSettings({ toolPermission: 'always-proceed' })}
          >
            <div className="agy-policy-card-header">
              <Unlock size={20} className="text-emerald" />
              <span className="agy-badge agy-badge-green">Automático</span>
            </div>
            <h3>Execução Automática (<code>always-proceed</code>)</h3>
            <p>
              Executa comandos de terminal, edições de arquivos e ferramentas MCP automaticamente sem interromper o fluxo para pedir confirmação (equivalente a <code>--dangerously-skip-permissions</code>).
            </p>
          </div>

          <div
            className={`agy-policy-card ${currentPolicy === 'request-review' ? 'selected warning' : ''}`}
            onClick={() => onSaveSettings({ toolPermission: 'request-review' })}
          >
            <div className="agy-policy-card-header">
              <AlertTriangle size={20} className="text-amber" />
              <span className="agy-badge agy-badge-amber">Pedir Permissão</span>
            </div>
            <h3>Solicitar Aprovação do Usuário (<code>request-review</code>)</h3>
            <p>
              Pausa antes de executar comandos ou modificar arquivos e exibe um cartão interativo na GUI para você aprovar, editar ou recusar a execução.
            </p>
          </div>

          <div
            className={`agy-policy-card ${currentPolicy === 'proceed-in-sandbox' ? 'selected info' : ''}`}
            onClick={() => onSaveSettings({ toolPermission: 'proceed-in-sandbox', enableTerminalSandbox: true })}
          >
            <div className="agy-policy-card-header">
              <Lock size={20} className="text-blue" />
              <span className="agy-badge agy-badge-blue">Sandbox</span>
            </div>
            <h3>Automático em Sandbox (<code>proceed-in-sandbox</code>)</h3>
            <p>
              Executa comandos automaticamente dentro do sandbox restrito do Antigravity CLI (<code>--sandbox</code>), solicitando permissão apenas se precisar sair do sandbox.
            </p>
          </div>
        </div>

        {/* Additional Security Toggles */}
        <div className="agy-section-card">
          <h3>Controles Adicionais de Segurança</h3>
          <div className="agy-security-toggles-row">
            <label className="agy-toggle-item">
              <div>
                <strong>Terminal Sandbox (<code>--sandbox</code>)</strong>
                <p>Isola comandos de shell contra acesso não autorizado à rede ou sistema.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.enableTerminalSandbox)}
                onChange={(e) => onSaveSettings({ enableTerminalSandbox: e.target.checked })}
              />
            </label>

            <label className="agy-toggle-item">
              <div>
                <strong>Acesso a Arquivos Fora do Workspace (<code>allowNonWorkspaceAccess</code>)</strong>
                <p>Permite leitura e escrita em diretórios fora do projeto atual.</p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(settings.allowNonWorkspaceAccess)}
                onChange={(e) => onSaveSettings({ allowNonWorkspaceAccess: e.target.checked })}
              />
            </label>
          </div>
        </div>

        {/* Trusted Workspaces */}
        <div className="agy-section-card">
          <h3>Workspaces Confiáveis (<code>trustedWorkspaces</code> / <code>--add-dir</code>)</h3>
          <div className="agy-workspace-tags">
            {trustedList.map((ws) => (
              <div key={ws} className="agy-workspace-chip">
                <FolderCheck size={14} className="text-emerald" />
                <code>{ws}</code>
                <button
                  type="button"
                  className="agy-icon-btn-sm"
                  onClick={() =>
                    onSaveSettings({
                      trustedWorkspaces: trustedList.filter((w) => w !== ws),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="agy-workspace-add-row" style={{ marginTop: 12 }}>
            <input
              type="text"
              className="agy-input"
              placeholder="Adicionar caminho confiável (ex: /Users/voce/projeto)..."
              value={newTrustedWs}
              onChange={(e) => setNewTrustedWs(e.target.value)}
            />
            <button
              type="button"
              className="agy-btn agy-btn-primary"
              onClick={() => {
                if (newTrustedWs.trim() && !trustedList.includes(newTrustedWs.trim())) {
                  onSaveSettings({ trustedWorkspaces: [...trustedList, newTrustedWs.trim()] });
                  setNewTrustedWs('');
                }
              }}
            >
              <Plus size={14} /> Confiar no Diretório
            </button>
          </div>
        </div>

        {/* Active Grants Table */}
        <div className="agy-section-card">
          <h3>Regras de Permissão Ativas</h3>
          <table className="agy-table">
            <thead>
              <tr>
                <th>Regra / Recurso</th>
                <th>Escopo</th>
                <th>Política Efetiva</th>
              </tr>
            </thead>
            <tbody>
              {defaultRules.map((r, i) => (
                <tr key={i}>
                  <td><code>{r.rule}</code></td>
                  <td>{r.scope}</td>
                  <td>
                    <span className={`agy-badge ${r.policy === 'allowed' ? 'agy-badge-green' : 'agy-badge-amber'}`}>
                      {r.policy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. MODELS VIEW (agy models / /model)
  if (activeTab === 'models') {
    const efforts = ['low', 'medium', 'high', 'xhigh', 'max'];
    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <Cpu size={20} className="agy-accent-icon" />
              <h2>Catálogo de Modelos (<code>agy models</code> / <code>/model</code>)</h2>
              <span className="agy-badge agy-badge-blue">{models.length} Modelos Disponíveis</span>
            </div>
            <p className="agy-panel-subtitle">
              Selecione o modelo ativo para a sessão e o nível de esforço de raciocínio (<code>--effort</code>)
            </p>
          </div>
          <div className="agy-header-actions">
            <div className="agy-effort-pills">
              <span>Esforço (<code>/effort</code>):</span>
              {efforts.map((ef) => (
                <button
                  key={ef}
                  type="button"
                  className={`agy-pill-btn ${selectedEffort === ef ? 'active' : ''}`}
                  onClick={() => onSelectEffort(ef)}
                >
                  {ef.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="agy-models-grid">
          {models.map((m) => {
            const isSelected = selectedModel === m.id;
            return (
              <div
                key={m.id}
                className={`agy-model-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectModel(m.id);
                  onSaveSettings({ model: m.id });
                }}
              >
                <div className="agy-model-card-top">
                  <span className="agy-provider-tag">{m.provider}</span>
                  <span className={`agy-effort-badge ${m.effort}`}>{m.effort.toUpperCase()}</span>
                </div>
                <h3>{m.label}</h3>
                <code className="agy-model-slug">{m.id}</code>
                <div className="agy-model-card-footer">
                  {isSelected ? (
                    <span className="agy-active-indicator">
                      <Check size={14} /> Modelo Ativo
                    </span>
                  ) : (
                    <span className="agy-click-hint">Clique para ativar</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. MCP SERVERS VIEW (agy mcp / /mcp)
  if (activeTab === 'mcp') {
    const handleAddMcp = async () => {
      if (!newMcpName.trim() || !newMcpCmd.trim()) return;
      setLoadingModule(true);
      const res = await agyApi.runMcpAction({
        action: 'add',
        name: newMcpName.trim(),
        command: newMcpCmd.trim(),
      });
      setModuleActionResult(res.stdout || res.stderr || 'Servidor MCP adicionado.');
      setNewMcpName('');
      setNewMcpCmd('');
      await loadActiveTabData();
    };

    const handleToggleMcp = async (name: string, action: 'enable' | 'disable' | 'remove') => {
      const res = await agyApi.runMcpAction({ action, name });
      setModuleActionResult(res.stdout || res.stderr || `Ação ${action} executada em ${name}`);
      await loadActiveTabData();
    };

    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <Server size={20} className="agy-accent-icon" />
              <h2>Servidores MCP (<code>agy mcp</code> / <code>/mcp</code>)</h2>
              <span className="agy-badge agy-badge-blue">{mcpServers.length} Servidores Descobertos</span>
            </div>
            <p className="agy-panel-subtitle">
              Gerencie integrações Model Context Protocol (<code>add</code>, <code>remove</code>, <code>list</code>, <code>enable</code>, <code>disable</code>)
            </p>
          </div>
          <button type="button" className="agy-btn agy-btn-secondary" onClick={loadActiveTabData}>
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {moduleActionResult && <div className="agy-info-banner">{moduleActionResult}</div>}

        {/* Add MCP Server Form */}
        <div className="agy-section-card">
          <h3>Adicionar Servidor MCP (<code>agy mcp add</code>)</h3>
          <div className="agy-workspace-add-row">
            <input
              type="text"
              className="agy-input"
              style={{ maxWidth: 220 }}
              placeholder="Nome (ex: github-mcp)"
              value={newMcpName}
              onChange={(e) => setNewMcpName(e.target.value)}
            />
            <input
              type="text"
              className="agy-input"
              placeholder="Comando ou URL (ex: npx -y @modelcontextprotocol/server-github)"
              value={newMcpCmd}
              onChange={(e) => setNewMcpCmd(e.target.value)}
            />
            <button type="button" className="agy-btn agy-btn-primary" onClick={handleAddMcp}>
              <Plus size={14} /> Adicionar MCP
            </button>
          </div>
        </div>

        <div className="agy-split-view">
          <div className="agy-split-list">
            {mcpServers.map((srv) => (
              <div
                key={srv.name}
                className={`agy-list-item-card ${selectedMcpServer?.name === srv.name ? 'active' : ''}`}
                onClick={() => setSelectedMcpServer(srv)}
              >
                <div className="agy-list-item-top">
                  <strong>{srv.name}</strong>
                  <span className="agy-badge agy-badge-green">{srv.toolCount} tools</span>
                </div>
                <code className="agy-small-code">{srv.path}</code>
                <div className="agy-list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="agy-btn-xs"
                    onClick={() => handleToggleMcp(srv.name, 'enable')}
                  >
                    Enable
                  </button>
                  <button
                    type="button"
                    className="agy-btn-xs"
                    onClick={() => handleToggleMcp(srv.name, 'disable')}
                  >
                    Disable
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="agy-split-detail">
            {selectedMcpServer ? (
              <>
                <div className="agy-detail-header">
                  <h3>Ferramentas do Servidor <code>{selectedMcpServer.name}</code></h3>
                  <span className="agy-badge agy-badge-blue">
                    {selectedMcpServer.tools?.length || 0} ferramentas registradas
                  </span>
                </div>
                <div className="agy-tools-list">
                  {selectedMcpServer.tools?.map((t: any) => (
                    <div key={t.name} className="agy-tool-chip-card">
                      <code>mcp_{selectedMcpServer.name}_{t.name}</code>
                      {t.description && <p>{t.description}</p>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="agy-muted-text">Selecione um servidor MCP para inspecionar suas ferramentas.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. PLUGINS VIEW (agy plugin / /plugin)
  if (activeTab === 'plugins') {
    const runAction = async (action: string, target?: string) => {
      setLoadingModule(true);
      const res = await agyApi.runPluginAction({ action, target });
      setModuleActionResult(res.stdout || res.stderr || `Comando agy plugin ${action} concluído.`);
      await loadActiveTabData();
    };

    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <Puzzle size={20} className="agy-accent-icon" />
              <h2>Gerenciador de Plugins (<code>agy plugin</code> / <code>/plugin</code>)</h2>
            </div>
            <p className="agy-panel-subtitle">
              Instale, valide, importe do Gemini/Claude, ative ou desative plugins empacotados
            </p>
          </div>
          <div className="agy-header-actions">
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => runAction('import', 'gemini')}
            >
              Importar Gemini
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => runAction('import', 'claude')}
            >
              Importar Claude
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => runAction('validate', workspace)}
            >
              Validar Workspace
            </button>
          </div>
        </div>

        {moduleActionResult && <div className="agy-info-banner">{moduleActionResult}</div>}

        <div className="agy-section-card">
          <h3>Instalar ou Gerenciar Plugin (<code>agy plugin install &lt;target&gt;</code>)</h3>
          <div className="agy-workspace-add-row">
            <input
              type="text"
              className="agy-input"
              placeholder="Nome do plugin, plugin@marketplace ou diretório local..."
              value={pluginTarget}
              onChange={(e) => setPluginTarget(e.target.value)}
            />
            <button
              type="button"
              className="agy-btn agy-btn-primary"
              onClick={() => pluginTarget.trim() && runAction('install', pluginTarget.trim())}
            >
              <Plus size={14} /> Instalar
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => pluginTarget.trim() && runAction('enable', pluginTarget.trim())}
            >
              Ativar
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => pluginTarget.trim() && runAction('disable', pluginTarget.trim())}
            >
              Desativar
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => pluginTarget.trim() && runAction('uninstall', pluginTarget.trim())}
            >
              Desinstalar
            </button>
          </div>
        </div>

        <div className="agy-section-card">
          <h3>Saída de <code>agy plugin list</code></h3>
          <pre className="agy-terminal-pre">{pluginsOutput || 'Nenhum plugin listado.'}</pre>
        </div>
      </div>
    );
  }

  // 5. SKILLS & HOOKS VIEW (/skills & /hooks)
  if (activeTab === 'skills') {
    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <BookOpen size={20} className="agy-accent-icon" />
              <h2>Skills & Customizações (<code>/skills</code> & <code>/hooks</code>)</h2>
              <span className="agy-badge agy-badge-blue">{skills.length} Skills Encontradas</span>
            </div>
            <p className="agy-panel-subtitle">
              Skills descobertas nos escopos Workspace (<code>.agents/skills</code>), Global (<code>~/.gemini/config/skills</code>) e Built-in
            </p>
          </div>
          <div className="agy-header-actions">
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => onSendPromptFromModule('/hooks')}
            >
              Inspecionar <code>/hooks</code>
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => onSendPromptFromModule('/skills')}
            >
              Executar <code>/skills</code>
            </button>
          </div>
        </div>

        <div className="agy-split-view">
          <div className="agy-split-list">
            {skills.map((sk) => (
              <div
                key={sk.id}
                className={`agy-list-item-card ${selectedSkill?.id === sk.id ? 'active' : ''}`}
                onClick={() => setSelectedSkill(sk)}
              >
                <div className="agy-list-item-top">
                  <strong>{sk.name}</strong>
                  <span className={`agy-badge ${sk.scope === 'built-in' ? 'agy-badge-blue' : 'agy-badge-green'}`}>
                    {sk.scope}
                  </span>
                </div>
                <p className="agy-clamp-2">{sk.description}</p>
              </div>
            ))}
          </div>

          <div className="agy-split-detail">
            {selectedSkill ? (
              <>
                <div className="agy-detail-header">
                  <div>
                    <h3>{selectedSkill.name}</h3>
                    <code className="agy-small-code">{selectedSkill.path}</code>
                  </div>
                  <button
                    type="button"
                    className="agy-btn agy-btn-primary"
                    onClick={() =>
                      onSendPromptFromModule(`Use the ${selectedSkill.name} skill to help me with: `)
                    }
                  >
                    <Sparkles size={14} /> Usar Skill no Chat
                  </button>
                </div>
                <pre className="agy-markdown-pre">{selectedSkill.content}</pre>
              </>
            ) : (
              <p className="agy-muted-text">Selecione uma skill para visualizar seu arquivo SKILL.md.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. AGENTS VIEW (agy agents / /agents)
  if (activeTab === 'agents') {
    const builtinAgents = [
      {
        name: 'self',
        role: 'Agente Principal Autônomo',
        description:
          'Herda a configuração completa, ferramentas de leitura/escrita, execução de comandos, subagentes e modelo atual.',
      },
      {
        name: 'research',
        role: 'Pesquisador de Código & Web (Read-Only)',
        description:
          'Subagente especializado com ferramentas somente leitura para exploração profunda de repositórios, logs e busca web.',
      },
      {
        name: 'image-generator',
        role: 'Gerador e Editor de Imagens',
        description:
          'Gera e edita ativos visuais e imagens a partir de descrições detalhadas e retorna os caminhos salvos.',
      },
    ];

    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <Bot size={20} className="agy-accent-icon" />
              <h2>Agentes e Subagentes (<code>agy agents</code> / <code>/agents</code>)</h2>
            </div>
            <p className="agy-panel-subtitle">
              Inicie sessões com agentes especializados (<code>--agent &lt;nome&gt;</code>) ou orquestre subagentes
            </p>
          </div>
        </div>

        <div className="agy-policy-cards-grid">
          {builtinAgents.map((ag) => (
            <div key={ag.name} className="agy-policy-card">
              <div className="agy-policy-card-header">
                <Bot size={20} className="agy-accent-icon" />
                <span className="agy-badge agy-badge-blue">Built-in</span>
              </div>
              <h3><code>{ag.name}</code> — {ag.role}</h3>
              <p>{ag.description}</p>
              <button
                type="button"
                className="agy-btn agy-btn-secondary"
                style={{ marginTop: 12 }}
                onClick={() => onSendPromptFromModule(`/agents`)}
              >
                <Play size={14} /> Selecionar Agente
              </button>
            </div>
          ))}
        </div>

        <div className="agy-section-card">
          <h3>Saída do CLI (<code>agy agents</code>)</h3>
          <pre className="agy-terminal-pre">
            {agentsOutput || 'Agentes built-in ativos: self, research, image-generator'}
          </pre>
        </div>
      </div>
    );
  }

  // 7. GIT DIFF VIEW (/diff)
  if (activeTab === 'diff') {
    const diffLines = (diffData.diff || '').split('\n');
    return (
      <div className="agy-panel-container">
        <div className="agy-panel-header">
          <div>
            <div className="agy-panel-title-row">
              <GitBranch size={20} className="agy-accent-icon" />
              <h2>Visualizador de Alterações Git (<code>/diff</code>)</h2>
              <span className="agy-badge agy-badge-blue">Branch: {diffData.branch}</span>
            </div>
            <p className="agy-panel-subtitle">Workspace: <code>{workspace}</code></p>
          </div>
          <button type="button" className="agy-btn agy-btn-secondary" onClick={loadActiveTabData}>
            <RefreshCw size={14} /> Atualizar Diff
          </button>
        </div>

        <div className="agy-section-card">
          <h3>Status dos Arquivos (<code>git status --short</code>)</h3>
          <pre className="agy-terminal-pre">
            {diffData.status || 'Working tree clean (nenhum arquivo modificado).'}
          </pre>
        </div>

        <div className="agy-section-card">
          <h3>Unified Diff</h3>
          <div className="agy-diff-viewer">
            {diffLines.map((line, idx) => {
              let cls = 'agy-diff-line';
              if (line.startsWith('+') && !line.startsWith('+++')) cls += ' added';
              else if (line.startsWith('-') && !line.startsWith('---')) cls += ' removed';
              else if (line.startsWith('@@')) cls += ' hunk';
              return (
                <div key={idx} className={cls}>
                  <span className="agy-diff-ln">{idx + 1}</span>
                  <span className="agy-diff-code">{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 8. SYSTEM, REMOTE CONTROL & CHANGELOG VIEW
  const handleRemoteControl = async (sub: 'status' | 'start' | 'stop') => {
    setLoadingModule(true);
    const res = await agyApi.runRemoteControl(sub);
    setRemoteStatus(res.stdout || res.stderr || `Comando remote-control ${sub} executado.`);
    setLoadingModule(false);
  };

  const handleSystemCmd = async (args: string[]) => {
    setLoadingModule(true);
    const res = await agyApi.execCli(args, workspace);
    setModuleActionResult(res.stdout || res.stderr || `Comando agy ${args.join(' ')} concluído.`);
    setLoadingModule(false);
  };

  return (
    <div className="agy-panel-container">
      <div className="agy-panel-header">
        <div>
          <div className="agy-panel-title-row">
            <Radio size={20} className="agy-accent-icon" />
            <h2>Remote Control, Atualizações & Changelog</h2>
          </div>
          <p className="agy-panel-subtitle">
            Comandos de sistema: <code>agy remote-control</code>, <code>agy update</code>, <code>agy install</code>, <code>agy mic-serve</code> e <code>agy changelog</code>
          </p>
        </div>
        <div className="agy-header-actions">
          <button
            type="button"
            className="agy-btn agy-btn-secondary"
            onClick={() => handleSystemCmd(['install'])}
          >
            Executar <code>agy install</code>
          </button>
          <button
            type="button"
            className="agy-btn agy-btn-primary"
            onClick={() => handleSystemCmd(['update'])}
          >
            <RefreshCw size={14} /> Verificar Atualização (<code>agy update</code>)
          </button>
        </div>
      </div>

      {moduleActionResult && <div className="agy-info-banner">{moduleActionResult}</div>}

      <div className="agy-section-card">
        <div className="agy-detail-header">
          <div>
            <h3>Daemon Remote Control (<code>agy remote-control</code>)</h3>
            <p className="agy-muted-text">
              Permite conectar e controlar sessões do Antigravity CLI remotamente
            </p>
          </div>
          <div className="agy-header-actions">
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => handleRemoteControl('status')}
            >
              Status
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-primary"
              onClick={() => handleRemoteControl('start')}
            >
              Iniciar Daemon (<code>start</code>)
            </button>
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={() => handleRemoteControl('stop')}
            >
              Parar Daemon (<code>stop</code>)
            </button>
          </div>
        </div>
        <pre className="agy-terminal-pre">{remoteStatus || 'Consultando status...'}</pre>
      </div>

      <div className="agy-section-card">
        <h3>Notas de Lançamento (<code>agy changelog</code>)</h3>
        <pre className="agy-markdown-pre" style={{ maxHeight: 420 }}>
          {changelogText || (loadingModule ? 'Carregando changelog...' : 'Sem dados.')}
        </pre>
      </div>
    </div>
  );
};
