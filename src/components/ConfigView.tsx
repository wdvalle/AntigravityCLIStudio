import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Layout,
  Terminal,
  Cloud,
  Search,
  Save,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2,
  FileJson,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import {
  AgySettings,
  ALL_CONFIG_FIELDS,
  ConfigFieldDefinition,
  AgyModelInfo,
  AgyProject,
  AgyProjectSettings,
} from '../types/agy';
import { useI18n } from '../i18n';

interface ConfigViewProps {
  settings: AgySettings;
  models: AgyModelInfo[];
  settingsPath: string;
  activeProject?: AgyProject | null;
  onSaveSettings: (patch: Partial<AgySettings>) => Promise<void>;
  onSaveProjectSettings?: (projectId: string, patch: Partial<AgyProjectSettings>) => Promise<void>;
  onRunHeadlessConfig?: () => void;
}

export const ConfigView: React.FC<ConfigViewProps> = ({
  settings,
  models,
  settingsPath,
  activeProject,
  onSaveSettings,
  onSaveProjectSettings,
  onRunHeadlessConfig,
}) => {
  const { t } = useI18n();
  const [scopeMode, setScopeMode] = useState<'global' | 'project'>('global');
  const [localSettings, setLocalSettings] = useState<AgySettings>(settings);
  const [projectSettings, setProjectSettings] = useState<AgyProjectSettings>(
    activeProject?.settings || {}
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newWorkspaceInput, setNewWorkspaceInput] = useState('');
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJsonText, setRawJsonText] = useState('');
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
    if (scopeMode === 'global') {
      setRawJsonText(JSON.stringify(settings, null, 2));
    }
  }, [settings]);

  useEffect(() => {
    if (activeProject) {
      setProjectSettings(activeProject.settings || {});
      if (scopeMode === 'project') {
        setRawJsonText(JSON.stringify(activeProject, null, 2));
      }
    }
  }, [activeProject, scopeMode]);

  const triggerToast = (msg: string) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(null), 2800);
  };

  const handleProjectSettingChange = async (key: keyof AgyProjectSettings, value: any) => {
    if (!activeProject || !onSaveProjectSettings) return;
    const next = { ...projectSettings, [key]: value };
    setProjectSettings(next);
    await onSaveProjectSettings(activeProject.id, { [key]: value });
    triggerToast(`Configuração do projeto salva em ~/.gemini/config/projects/${activeProject.id}.json`);
  };

  const handleFieldChange = async (key: keyof AgySettings, value: any) => {
    const next = { ...localSettings, [key]: value };
    setLocalSettings(next);
    setRawJsonText(JSON.stringify(next, null, 2));
    await onSaveSettings({ [key]: value });
    triggerToast(`Configuração "${String(key)}" salva em settings.json`);
  };

  const handleAddWorkspace = async () => {
    const trimmed = newWorkspaceInput.trim();
    if (!trimmed) return;
    const current = Array.isArray(localSettings.trustedWorkspaces)
      ? localSettings.trustedWorkspaces
      : [];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      setNewWorkspaceInput('');
      await handleFieldChange('trustedWorkspaces', updated);
    }
  };

  const handleSelectDirectoryNative = async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        const current = Array.isArray(localSettings.trustedWorkspaces)
          ? localSettings.trustedWorkspaces
          : [];
        if (!current.includes(selected)) {
          await handleFieldChange('trustedWorkspaces', [...current, selected]);
        }
      }
    }
  };

  const handleRemoveWorkspace = async (ws: string) => {
    const current = Array.isArray(localSettings.trustedWorkspaces)
      ? localSettings.trustedWorkspaces
      : [];
    const updated = current.filter((w) => w !== ws);
    await handleFieldChange('trustedWorkspaces', updated);
  };

  const handleSaveRawJson = async () => {
    try {
      const parsed = JSON.parse(rawJsonText);
      setRawJsonError(null);
      setLocalSettings(parsed);
      await onSaveSettings(parsed);
      triggerToast('settings.json salvo com sucesso!');
    } catch (err: any) {
      setRawJsonError(`JSON inválido: ${err.message}`);
    }
  };

  const handleResetDefaults = async () => {
    const defaults: Partial<AgySettings> = {};
    for (const f of ALL_CONFIG_FIELDS) {
      defaults[f.key] = f.defaultValue;
    }
    setLocalSettings(defaults as AgySettings);
    await onSaveSettings(defaults);
    triggerToast('Configurações restauradas para os valores padrão');
  };

  const categories = [
    { id: 'all', label: `Todas (${ALL_CONFIG_FIELDS.length})`, icon: Settings },
    { id: 'permissions', label: 'Permissões & Execução', icon: Shield },
    { id: 'agent', label: 'Agente & Modelos', icon: Cpu },
    { id: 'interface', label: 'Interface & Tema', icon: Layout },
    { id: 'editor', label: 'Editor & Vim', icon: Terminal },
    { id: 'system', label: 'Sistema & Cloud', icon: Cloud },
  ];

  const filteredFields = ALL_CONFIG_FIELDS.filter((field) => {
    const matchesCat = activeCategory === 'all' || field.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(field.key).toLowerCase().includes(q) ||
      field.label.toLowerCase().includes(q) ||
      field.description.toLowerCase().includes(q) ||
      (field.cliFlag && field.cliFlag.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const renderControl = (field: ConfigFieldDefinition) => {
    const val =
      localSettings[field.key] !== undefined ? localSettings[field.key] : field.defaultValue;

    if (field.key === 'model' && models.length > 0) {
      return (
        <select
          className="agy-select"
          value={String(val || '')}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
        >
          <option value="">Padrão do Sistema (Automático)</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — [{m.id}]
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'select' && field.options) {
      return (
        <select
          className="agy-select"
          value={String(val ?? '')}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'boolean') {
      const checked = Boolean(val);
      return (
        <button
          type="button"
          onClick={() => handleFieldChange(field.key, !checked)}
          className={`agy-switch ${checked ? 'active' : ''}`}
          aria-pressed={checked}
        >
          <span className="agy-switch-thumb" />
          <span className="agy-switch-label">{checked ? 'Ativado (true)' : 'Desativado (false)'}</span>
        </button>
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          className="agy-input"
          value={Number(val ?? 2000)}
          onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
        />
      );
    }

    if (field.type === 'string-array') {
      const list: string[] = Array.isArray(val) ? val : [];
      return (
        <div className="agy-workspace-list-editor">
          <div className="agy-workspace-tags">
            {list.length === 0 && (
              <span className="agy-muted-text">Nenhum diretório registrado</span>
            )}
            {list.map((ws) => (
              <div key={ws} className="agy-workspace-chip">
                <code>{ws}</code>
                <button
                  type="button"
                  className="agy-icon-btn-sm"
                  onClick={() => handleRemoveWorkspace(ws)}
                  title="Remover workspace"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="agy-workspace-add-row">
            <input
              type="text"
              className="agy-input"
              placeholder="/caminho/para/workspace..."
              value={newWorkspaceInput}
              onChange={(e) => setNewWorkspaceInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWorkspace()}
            />
            <button type="button" className="agy-btn agy-btn-secondary" onClick={handleAddWorkspace}>
              <Plus size={14} /> Adicionar
            </button>
            {window.electronAPI?.isElectron && (
              <button
                type="button"
                className="agy-btn agy-btn-secondary"
                onClick={handleSelectDirectoryNative}
              >
                <FolderPlus size={14} /> Procurar...
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <input
        type="text"
        className="agy-input"
        placeholder={`Valor para ${String(field.key)}...`}
        value={typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
        onChange={(e) => handleFieldChange(field.key, e.target.value)}
      />
    );
  };

  return (
    <div className="agy-panel-container">
      {/* Header */}
      <div className="agy-panel-header">
        <div>
          <div className="agy-panel-title-row">
            <Settings size={20} className="agy-accent-icon" />
            <h2>{t('config.title')} (<code>/config</code>)</h2>
            <span className="agy-badge agy-badge-blue">
              {scopeMode === 'global' ? '36 Opções' : t('config.scopeProject')}
            </span>
          </div>
          <p className="agy-panel-subtitle">
            {scopeMode === 'global' ? (
              <>Sincronizado com <code>{settingsPath || '~/.gemini/antigravity-cli/settings.json'}</code></>
            ) : (
              <>Sincronizado com <code>~/.gemini/config/projects/{activeProject?.id}.json</code></>
            )}
          </p>
        </div>
        <div className="agy-header-actions">
          {activeProject && (
            <div className="agy-category-tabs">
              <button
                type="button"
                className={`agy-tab-btn ${scopeMode === 'global' ? 'active' : ''}`}
                onClick={() => setScopeMode('global')}
              >
                {t('config.scopeGlobal')}
              </button>
              <button
                type="button"
                className={`agy-tab-btn ${scopeMode === 'project' ? 'active' : ''}`}
                onClick={() => setScopeMode('project')}
              >
                {t('config.scopeProject')}: {activeProject.name}
              </button>
            </div>
          )}
          {onRunHeadlessConfig && scopeMode === 'global' && (
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={onRunHeadlessConfig}
              title="Executar agy -p /config no CLI"
            >
              <Sparkles size={14} /> {t('config.inspectHeadless')}
            </button>
          )}
          <button
            type="button"
            className={`agy-btn ${rawJsonMode ? 'agy-btn-primary' : 'agy-btn-secondary'}`}
            onClick={() => setRawJsonMode(!rawJsonMode)}
          >
            <FileJson size={14} /> {rawJsonMode ? t('config.visualMode') : t('config.jsonMode')}
          </button>
          {scopeMode === 'global' && (
            <button
              type="button"
              className="agy-btn agy-btn-secondary"
              onClick={handleResetDefaults}
            >
              <RotateCcw size={14} /> {t('config.restoreDefaults')}
            </button>
          )}
        </div>
      </div>

      {savedToast && (
        <div className="agy-toast-banner">
          <CheckCircle2 size={16} />
          <span>{savedToast}</span>
        </div>
      )}

      {/* When scopeMode === 'project', render project-scoped settings */}
      {scopeMode === 'project' && activeProject && !rawJsonMode && (
        <div className="agy-section-card">
          <div className="agy-detail-header">
            <div>
              <h3>Configurações Específicas do Projeto: <code>{activeProject.name}</code></h3>
              <p className="agy-muted-text">
                Salvas no formato oficial do Antigravity CLI em <code>~/.gemini/config/projects/{activeProject.id}.json</code> (tem precedência sobre as configurações globais).
              </p>
            </div>
            <span className="agy-badge agy-badge-green">Projeto Ativo</span>
          </div>

          <div className="agy-config-grid" style={{ marginTop: 16 }}>
            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Política de Execução de Comandos</strong>
                <span className="agy-cat-pill permissions">projeto</span>
              </div>
              <p className="agy-config-desc">Define a execução automática de comandos para este projeto.</p>
              <select
                className="agy-select"
                value={projectSettings.autoExecutionPolicy || 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER'}
                onChange={(e) => handleProjectSettingChange('autoExecutionPolicy', e.target.value)}
              >
                <option value="CASCADE_COMMANDS_AUTO_EXECUTION_EAGER">Execução Automática Imediata (EAGER)</option>
                <option value="CASCADE_COMMANDS_AUTO_EXECUTION_AUTO">Automático Inteligente (AUTO)</option>
                <option value="CASCADE_COMMANDS_AUTO_EXECUTION_OFF">Pedir Aprovação do Usuário (OFF)</option>
                <option value="CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX">Automático em Sandbox (SANDBOX)</option>
              </select>
            </div>

            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Modo Sandbox do Terminal</strong>
                <span className="agy-cat-pill permissions">projeto</span>
              </div>
              <p className="agy-config-desc">Executa comandos do terminal do agente em sandbox para este projeto.</p>
              <button
                type="button"
                onClick={() => handleProjectSettingChange('sandboxMode', !projectSettings.sandboxMode)}
                className={`agy-switch ${projectSettings.sandboxMode ? 'active' : ''}`}
              >
                <span className="agy-switch-thumb" />
                <span className="agy-switch-label">{projectSettings.sandboxMode ? 'Ativado (true)' : 'Desativado (false)'}</span>
              </button>
            </div>

            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Acesso a Arquivos Fora do Workspace</strong>
                <span className="agy-cat-pill permissions">projeto</span>
              </div>
              <p className="agy-config-desc">Permite ou bloqueia leitura/escrita de arquivos fora da pasta do projeto.</p>
              <select
                className="agy-select"
                value={projectSettings.fileAccessPolicy || 'AGENT_SETTING_POLICY_ALLOW'}
                onChange={(e) => handleProjectSettingChange('fileAccessPolicy', e.target.value)}
              >
                <option value="AGENT_SETTING_POLICY_ALLOW">Permitir (ALLOW)</option>
                <option value="AGENT_SETTING_POLICY_ASK">Perguntar ao Usuário (ASK)</option>
                <option value="AGENT_SETTING_POLICY_DENY">Negar (DENY)</option>
              </select>
            </div>

            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Acesso à Internet</strong>
                <span className="agy-cat-pill permissions">projeto</span>
              </div>
              <p className="agy-config-desc">Permite ou bloqueia chamadas de rede externas para este projeto.</p>
              <select
                className="agy-select"
                value={projectSettings.internetPolicy || 'AGENT_SETTING_POLICY_ALLOW'}
                onChange={(e) => handleProjectSettingChange('internetPolicy', e.target.value)}
              >
                <option value="AGENT_SETTING_POLICY_ALLOW">Permitir (ALLOW)</option>
                <option value="AGENT_SETTING_POLICY_ASK">Perguntar ao Usuário (ASK)</option>
                <option value="AGENT_SETTING_POLICY_DENY">Negar (DENY)</option>
              </select>
            </div>

            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Modo de Revisão de Artefatos</strong>
                <span className="agy-cat-pill agent">projeto</span>
              </div>
              <p className="agy-config-desc">Comportamento de revisão de planos e artefatos neste projeto.</p>
              <select
                className="agy-select"
                value={projectSettings.artifactReviewMode || 'ARTIFACT_REVIEW_MODE_TURBO'}
                onChange={(e) => handleProjectSettingChange('artifactReviewMode', e.target.value)}
              >
                <option value="ARTIFACT_REVIEW_MODE_TURBO">Prosseguir Sempre (TURBO)</option>
                <option value="ARTIFACT_REVIEW_MODE_AUTO">Agente Decide (AUTO)</option>
                <option value="ARTIFACT_REVIEW_MODE_ALWAYS">Sempre Solicitar Revisão (ALWAYS)</option>
              </select>
            </div>

            <div className="agy-config-card">
              <div className="agy-config-card-top">
                <strong>Preset de Permissões</strong>
                <span className="agy-cat-pill permissions">projeto</span>
              </div>
              <p className="agy-config-desc">Preset de segurança aplicado ao projeto.</p>
              <select
                className="agy-select"
                value={projectSettings.permissionPreset || 'AGENT_PERMISSION_PRESET_TURBO'}
                onChange={(e) => handleProjectSettingChange('permissionPreset', e.target.value)}
              >
                <option value="AGENT_PERMISSION_PRESET_TURBO">Turbo (Execução Rápida)</option>
                <option value="AGENT_PERMISSION_PRESET_DEFAULT">Padrão</option>
                <option value="AGENT_PERMISSION_PRESET_REQUEST_REVIEW">Pedir Revisão</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Highlight Card for Command Execution Permission */}
      <div className="agy-permission-hero-card">
        <div className="agy-permission-hero-info">
          <div className="agy-permission-hero-title">
            <Shield size={18} className="agy-accent-icon" />
            <span>Modo de Permissão de Execução de Comandos (<code>toolPermission</code>)</span>
          </div>
          <p>
            Escolha se o Antigravity CLI deve solicitar sua aprovação antes de executar comandos no terminal/editar arquivos ou se deve executar automaticamente.
          </p>
        </div>
        <div className="agy-permission-segmented">
          <button
            type="button"
            className={`agy-seg-btn ${localSettings.toolPermission === 'request-review' ? 'active warning' : ''}`}
            onClick={() => handleFieldChange('toolPermission', 'request-review')}
          >
            ✋ Pedir Permissão (<code>request-review</code>)
          </button>
          <button
            type="button"
            className={`agy-seg-btn ${localSettings.toolPermission === 'always-proceed' ? 'active success' : ''}`}
            onClick={() => handleFieldChange('toolPermission', 'always-proceed')}
          >
            ⚡ Automático (<code>always-proceed</code>)
          </button>
          <button
            type="button"
            className={`agy-seg-btn ${localSettings.toolPermission === 'proceed-in-sandbox' ? 'active info' : ''}`}
            onClick={() => handleFieldChange('toolPermission', 'proceed-in-sandbox')}
          >
            🔒 Sandbox Automático (<code>proceed-in-sandbox</code>)
          </button>
        </div>
      </div>

      {rawJsonMode ? (
        <div className="agy-raw-json-editor">
          <div className="agy-raw-json-toolbar">
            <span>Editando diretamente <code>{settingsPath}</code></span>
            <button type="button" className="agy-btn agy-btn-primary" onClick={handleSaveRawJson}>
              <Save size={14} /> Salvar JSON
            </button>
          </div>
          {rawJsonError && <div className="agy-error-banner">{rawJsonError}</div>}
          <textarea
            className="agy-code-textarea"
            value={rawJsonText}
            onChange={(e) => setRawJsonText(e.target.value)}
            spellCheck={false}
          />
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="agy-config-toolbar">
            <div className="agy-category-tabs">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`agy-tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <Icon size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="agy-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder={t('config.filterPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Fields Grid */}
          <div className="agy-config-grid">
            {filteredFields.map((field) => (
              <div key={String(field.key)} className="agy-config-card">
                <div className="agy-config-card-top">
                  <div>
                    <div className="agy-config-field-title">
                      <span>{field.label}</span>
                      {field.cliFlag && (
                        <code className="agy-cli-flag-badge">{field.cliFlag}</code>
                      )}
                    </div>
                    <code className="agy-config-key-name">{String(field.key)}</code>
                  </div>
                  <span className={`agy-cat-pill ${field.category}`}>{field.category}</span>
                </div>
                <p className="agy-config-desc">{field.description}</p>
                <div className="agy-config-control">{renderControl(field)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
