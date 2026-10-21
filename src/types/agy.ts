export type PermissionPolicy = 'always-proceed' | 'request-review' | 'proceed-in-sandbox' | 'strict';
export type AgentExecutionMode = 'default' | 'auto' | 'accept-edits' | 'plan';
export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

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

export interface AgyModelInfo {
  id: string;
  label: string;
  family: string;
  effort: string;
  provider: string;
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
  permissions?: any;
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
  toolPermission?: PermissionPolicy | string;
  trustedWorkspaces?: string[];
  useG1Credits?: boolean;
  useTerminalCursor?: boolean;
  verbosity?: string;
  vimInsertFirst?: boolean;
  [key: string]: any;
}

export interface ConfigFieldDefinition {
  key: keyof AgySettings;
  label: string;
  category: 'permissions' | 'agent' | 'interface' | 'editor' | 'system';
  type: 'select' | 'boolean' | 'number' | 'text' | 'string-array' | 'json';
  description: string;
  cliFlag?: string;
  options?: { value: string; label: string; description?: string }[];
  defaultValue: any;
}

export const ALL_CONFIG_FIELDS: ConfigFieldDefinition[] = [
  // PERMISSIONS & SECURITY
  {
    key: 'toolPermission',
    label: 'Política de Permissão de Comandos (toolPermission)',
    category: 'permissions',
    type: 'select',
    cliFlag: '--dangerously-skip-permissions',
    description: 'Define se o Antigravity CLI deve pedir permissão do usuário antes de executar comandos e ferramentas ou se a execução será automática.',
    defaultValue: 'always-proceed',
    options: [
      { value: 'always-proceed', label: 'Automático (always-proceed)', description: 'Executa comandos e ferramentas automaticamente sem solicitar confirmação manual' },
      { value: 'request-review', label: 'Pedir Permissão (request-review)', description: 'Solicita confirmação interativa do usuário antes de executar comandos ou alterações' },
      { value: 'proceed-in-sandbox', label: 'Automático em Sandbox (proceed-in-sandbox)', description: 'Executa comandos automaticamente dentro do ambiente isolado de sandbox' },
      { value: 'strict', label: 'Estrito (strict)', description: 'Exige aprovação explícita para todas as ações externas ou mutações' },
    ],
  },
  {
    key: 'enableTerminalSandbox',
    label: 'Sandbox de Terminal (enableTerminalSandbox)',
    category: 'permissions',
    type: 'boolean',
    cliFlag: '--sandbox',
    description: 'Executa os comandos de terminal do agente dentro de um ambiente sandbox restrito para segurança adicional.',
    defaultValue: false,
  },
  {
    key: 'allowNonWorkspaceAccess',
    label: 'Acesso Fora do Workspace (allowNonWorkspaceAccess)',
    category: 'permissions',
    type: 'boolean',
    description: 'Permite que o agente leia e escreva arquivos fora do diretório raiz do workspace ativo.',
    defaultValue: false,
  },
  {
    key: 'artifactReviewPolicy',
    label: 'Revisão de Artefatos (artifactReviewPolicy)',
    category: 'permissions',
    type: 'select',
    description: 'Controla quando o agente solicita revisão do usuário em planos e artefatos gerados.',
    defaultValue: 'asks-for-review',
    options: [
      { value: 'asks-for-review', label: 'Solicitar Revisão (asks-for-review)' },
      { value: 'agent-decides', label: 'Agente Decide (agent-decides)' },
      { value: 'always-proceed', label: 'Prosseguir Sempre (always-proceed)' },
    ],
  },
  {
    key: 'sandboxProxy',
    label: 'Proxy do Sandbox (sandboxProxy)',
    category: 'permissions',
    type: 'text',
    description: 'Endereço de proxy HTTP/SOCKS opcional para conexões de rede dentro do terminal sandbox.',
    defaultValue: '',
  },
  {
    key: 'trustedWorkspaces',
    label: 'Workspaces Confiáveis (trustedWorkspaces)',
    category: 'permissions',
    type: 'string-array',
    cliFlag: '--add-dir',
    description: 'Lista de diretórios locais marcados como confiáveis para execução do Antigravity CLI.',
    defaultValue: [],
  },
  {
    key: 'permissions',
    label: 'Regras Globais de Permissão (permissions)',
    category: 'permissions',
    type: 'json',
    description: 'Regras customizadas de allow/ask/deny para ferramentas, caminhos de arquivos e domínios.',
    defaultValue: '',
  },

  // AGENT & MODEL
  {
    key: 'model',
    label: 'Modelo Padrão (model)',
    category: 'agent',
    type: 'select',
    cliFlag: '--model',
    description: 'Modelo padrão utilizado ao iniciar novas sessões do Antigravity CLI.',
    defaultValue: 'gemini-4-argon-medium',
    options: [
      { value: '', label: 'Padrão do Sistema (Automático)' },
      { value: 'gemini-4-argon-medium', label: 'Gemini 4 Argon (Medium)' },
      { value: 'gemini-4-argon-high', label: 'Gemini 4 Argon (High)' },
      { value: 'gemini-4-argon-low', label: 'Gemini 4 Argon (Low)' },
      { value: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash (High)' },
      { value: 'gemini-3.8-flash-medium', label: 'Gemini 3.8 Flash (Medium)' },
      { value: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low)' },
      { value: 'claude-opus-5-5-high', label: 'Claude Opus 5.5 (High)' },
      { value: 'claude-opus-5-5-medium', label: 'Claude Opus 5.5 (Medium)' },
      { value: 'claude-opus-5-5-low', label: 'Claude Opus 5.5 (Low)' },
      { value: 'claude-sonnet-5-5-high', label: 'Claude Sonnet 5.5 (High)' },
      { value: 'claude-sonnet-5-5-medium', label: 'Claude Sonnet 5.5 (Medium)' },
      { value: 'claude-sonnet-5-5-low', label: 'Claude Sonnet 5.5 (Low)' },
      { value: 'gpt-oss-120b-medium', label: 'GPT-OSS 120B (Medium)' },
    ],
  },
  {
    key: 'agentMode',
    label: 'Modo de Execução do Agente (agentMode)',
    category: 'agent',
    type: 'select',
    cliFlag: '--mode',
    description: 'Define o modo operacional do agente (Default, Auto, Accept Edits ou Plan).',
    defaultValue: 'default',
    options: [
      { value: 'default', label: 'Padrão (default / request-review)' },
      { value: 'auto', label: 'Auto (aprova edições e comandos seguros automaticamente)' },
      { value: 'accept-edits', label: 'Accept Edits (aceita edições de arquivos automaticamente)' },
      { value: 'plan', label: 'Plan Mode (planejamento antes da execução)' },
    ],
  },
  {
    key: 'modelProvider',
    label: 'Provedor de Modelo (modelProvider)',
    category: 'agent',
    type: 'select',
    description: 'Provedor de inferência principal para os modelos do CLI.',
    defaultValue: '',
    options: [
      { value: '', label: 'Padrão Antigravity Cloud' },
      { value: 'google', label: 'Google Gemini API / Vertex AI' },
      { value: 'anthropic', label: 'Anthropic Vertex / Partner' },
      { value: 'custom', label: 'Endpoint Customizado' },
    ],
  },
  {
    key: 'contextWindow',
    label: 'Janela de Contexto (contextWindow)',
    category: 'agent',
    type: 'text',
    description: 'Limite customizado da janela de tokens ou configuração de compactação automática.',
    defaultValue: '',
  },
  {
    key: 'queuedMessages',
    label: 'Mensagens na Fila (queuedMessages)',
    category: 'agent',
    type: 'select',
    description: 'Define se mensagens enviadas durante a resposta aguardam o fim do turno (queue) ou interrompem imediatamente (send-immediately).',
    defaultValue: 'queue',
    options: [
      { value: 'queue', label: 'Enfileirar (queue) — aguarda o turno atual terminar' },
      { value: 'send-immediately', label: 'Enviar Imediatamente (send-immediately) — interrompe o turno' },
    ],
  },
  {
    key: 'disableSlashCommands',
    label: 'Desativar Slash Commands (disableSlashCommands)',
    category: 'agent',
    type: 'boolean',
    cliFlag: '--disable-slash-commands',
    description: 'Desativa a expansão automática de comandos /slash e skills no modo print.',
    defaultValue: false,
  },
  {
    key: 'verbosity',
    label: 'Verbosidade das Respostas (verbosity)',
    category: 'agent',
    type: 'select',
    description: 'Nível de detalhamento exibido pelo agente e pelos logs de ferramentas.',
    defaultValue: 'medium',
    options: [
      { value: 'low', label: 'Baixa (low)' },
      { value: 'medium', label: 'Média (medium)' },
      { value: 'high', label: 'Alta (high)' },
    ],
  },
  {
    key: 'customModelsConfig',
    label: 'Configuração de Modelos Customizados (customModelsConfig)',
    category: 'agent',
    type: 'text',
    description: 'Caminho ou JSON para configuração de modelos BYOK/customizados.',
    defaultValue: '',
  },

  // INTERFACE & APPEARANCE
  {
    key: 'colorScheme',
    label: 'Esquema de Cores (colorScheme)',
    category: 'interface',
    type: 'select',
    description: 'Esquema de cores para destaque de sintaxe, diffs e visualização.',
    defaultValue: 'terminal',
    options: [
      { value: 'terminal', label: 'Terminal (Detecta automático Dark/Light)' },
      { value: 'dark', label: 'Antigravity Dark (#000000)' },
      { value: 'dracula', label: 'Dracula' },
      { value: 'monokai', label: 'Monokai' },
      { value: 'solarized-dark', label: 'Solarized Dark' },
      { value: 'solarized-light', label: 'Solarized Light' },
      { value: 'gruvbox', label: 'Gruvbox' },
    ],
  },
  {
    key: 'pickerGrouping',
    label: 'Agrupamento de Conversas em /resume (pickerGrouping)',
    category: 'interface',
    type: 'select',
    description: 'Configura a visualização padrão da lista de conversas (plana ou agrupada por workspace).',
    defaultValue: 'none',
    options: [
      { value: 'none', label: 'Lista Plana (none)' },
      { value: 'workspace', label: 'Agrupado por Workspace (workspace)' },
    ],
  },
  {
    key: 'altScreenMode',
    label: 'Modo de Tela Alternativa (altScreenMode)',
    category: 'interface',
    type: 'select',
    description: 'Controla o uso do buffer de tela alternativa (altscreen vs inline) no TUI.',
    defaultValue: 'default',
    options: [
      { value: 'default', label: 'Padrão (default)' },
      { value: 'always', label: 'Sempre AltScreen (always)' },
      { value: 'inline', label: 'Inline no Terminal (inline)' },
    ],
  },
  {
    key: 'runningLightSpeed',
    label: 'Velocidade da Animação (runningLightSpeed)',
    category: 'interface',
    type: 'select',
    description: 'Velocidade das animações de progresso enquanto o agente está executando.',
    defaultValue: 'medium',
    options: [
      { value: 'off', label: 'Desativada (off)' },
      { value: 'slow', label: 'Lenta (slow)' },
      { value: 'medium', label: 'Média (medium)' },
      { value: 'fast', label: 'Rápida (fast)' },
    ],
  },
  {
    key: 'hideActiveItems',
    label: 'Ocultar Itens Ativos (hideActiveItems)',
    category: 'interface',
    type: 'boolean',
    description: 'Oculta a barra de arquivos e tarefas ativas acima do prompt.',
    defaultValue: false,
  },
  {
    key: 'showTips',
    label: 'Exibir Dicas na Inicialização (showTips)',
    category: 'interface',
    type: 'boolean',
    description: 'Mostra dicas de atalhos e comandos úteis no painel inicial.',
    defaultValue: true,
  },
  {
    key: 'showFeedbackSurvey',
    label: 'Exibir Pesquisa de Feedback (showFeedbackSurvey)',
    category: 'interface',
    type: 'boolean',
    description: 'Permite prompts ocasionais de avaliação de qualidade da sessão.',
    defaultValue: true,
  },
  {
    key: 'seasonalThemesOptIn',
    label: 'Ativar Temas Sazonais (seasonalThemesOptIn)',
    category: 'interface',
    type: 'boolean',
    description: 'Habilita temas comemorativos e artes sazonais no logo do Antigravity.',
    defaultValue: false,
  },
  {
    key: 'seasonalThemesOff',
    label: 'Desativar Temas Sazonais (seasonalThemesOff)',
    category: 'interface',
    type: 'boolean',
    description: 'Força a desativação permanente de temas sazonais.',
    defaultValue: false,
  },
  {
    key: 'statusLine',
    label: 'Template da Linha de Status (statusLine)',
    category: 'interface',
    type: 'text',
    description: 'Formato customizado da barra de status inferior (/statusline).',
    defaultValue: '',
  },
  {
    key: 'title',
    label: 'Título da Janela / Sessão (title)',
    category: 'interface',
    type: 'text',
    description: 'Título personalizado fixo ou dinâmico para a janela do terminal/GUI.',
    defaultValue: '',
  },

  // EDITOR & INPUT
  {
    key: 'editor',
    label: 'Editor Externo (editor)',
    category: 'editor',
    type: 'select',
    description: 'Editor externo aberto pelo comando /open ou atalho de edição.',
    defaultValue: 'auto',
    options: [
      { value: 'auto', label: 'Automático ($EDITOR / auto)' },
      { value: 'code', label: 'VS Code / Antigravity IDE (code)' },
      { value: 'vim', label: 'Vim (vim)' },
      { value: 'nvim', label: 'Neovim (nvim)' },
      { value: 'nano', label: 'Nano (nano)' },
    ],
  },
  {
    key: 'editorMode',
    label: 'Modo de Teclado no Prompt (editorMode)',
    category: 'editor',
    type: 'select',
    description: 'Modo de edição de texto no campo de prompt (Padrão ou Vim).',
    defaultValue: 'default',
    options: [
      { value: 'default', label: 'Padrão (Standard Keybindings)' },
      { value: 'vim', label: 'Vim Mode (Modal Normal/Insert/Visual)' },
    ],
  },
  {
    key: 'vimInsertFirst',
    label: 'Iniciar Vim em Modo Insert (vimInsertFirst)',
    category: 'editor',
    type: 'boolean',
    description: 'Quando o modo Vim está ativo, inicia novos prompts diretamente em INSERT mode.',
    defaultValue: false,
  },
  {
    key: 'copyOnSelect',
    label: 'Copiar ao Selecionar (copyOnSelect)',
    category: 'editor',
    type: 'boolean',
    description: 'Copia automaticamente qualquer texto selecionado para a área de transferência.',
    defaultValue: true,
  },
  {
    key: 'useTerminalCursor',
    label: 'Usar Cursor Nativo do Terminal (useTerminalCursor)',
    category: 'editor',
    type: 'boolean',
    description: 'Usa o cursor nativo em vez do cursor renderizado pelo componente.',
    defaultValue: false,
  },
  {
    key: 'clearScrollbackOnResize',
    label: 'Limpar Scrollback ao Redimensionar (clearScrollbackOnResize)',
    category: 'editor',
    type: 'boolean',
    description: 'Limpa o buffer de rolagem quando a janela muda de tamanho para evitar artefatos.',
    defaultValue: true,
  },

  // SYSTEM & CLOUD
  {
    key: 'notifications',
    label: 'Notificações do Sistema (notifications)',
    category: 'system',
    type: 'boolean',
    description: 'Envia notificações nativas do sistema operacional quando tarefas longas terminam ou pedem permissão.',
    defaultValue: false,
  },
  {
    key: 'historySize',
    label: 'Tamanho do Histórico (historySize)',
    category: 'system',
    type: 'number',
    description: 'Número máximo de entradas salvas em ~/.gemini/antigravity-cli/history.jsonl.',
    defaultValue: 2000,
  },
  {
    key: 'useG1Credits',
    label: 'Usar Créditos G1 (useG1Credits)',
    category: 'system',
    type: 'boolean',
    description: 'Permite o consumo de créditos Google One AI quando a cota padrão é atingida (/credits).',
    defaultValue: false,
  },
  {
    key: 'gcp',
    label: 'Projeto Google Cloud / Vertex AI (gcp)',
    category: 'system',
    type: 'text',
    description: 'ID do projeto GCP configurado para autenticação empresarial / ADC.',
    defaultValue: '',
  },
];

export interface SlashCommandItem {
  command: string;
  label: string;
  description: string;
  category: 'session' | 'config' | 'tools' | 'workflow';
  actionType: 'open-view' | 'prompt-slash' | 'cli-headless' | 'local-action';
  targetView?: string;
  argHint?: string;
}

export const CLI_SLASH_COMMANDS: SlashCommandItem[] = [
  { command: '/config', label: 'Configurações (/config)', description: 'Abre a tela completa com todas as 36 opções do Antigravity CLI', category: 'config', actionType: 'open-view', targetView: 'config' },
  { command: '/permissions', label: 'Permissões (/permissions)', description: 'Gerencia permissões de execução de comandos, sandbox e diretórios confiáveis', category: 'config', actionType: 'open-view', targetView: 'permissions' },
  { command: '/model', label: 'Selecionar Modelo (/model)', description: 'Escolhe o modelo ativo ou abre o catálogo completo de modelos', category: 'config', actionType: 'open-view', targetView: 'models', argHint: '<nome-do-modelo>' },
  { command: '/effort', label: 'Esforço de Raciocínio (/effort)', description: 'Ajusta o nível de raciocínio (low, medium, high, xhigh, max)', category: 'config', actionType: 'prompt-slash', argHint: '[low|medium|high|xhigh|max]' },
  { command: '/compact', label: 'Compactar Contexto (/compact)', description: 'Resume a conversa atual para liberar espaço na janela de contexto', category: 'session', actionType: 'prompt-slash', argHint: '[mensagem opcional]' },
  { command: '/btw', label: 'Pergunta Paralela (/btw)', description: 'Faz uma pergunta rápida sem interromper o objetivo principal da conversa', category: 'session', actionType: 'prompt-slash', argHint: '<pergunta>' },
  { command: '/diff', label: 'Visualizar Diff Git (/diff)', description: 'Exibe as alterações de código atuais no workspace com syntax highlighting', category: 'tools', actionType: 'open-view', targetView: 'diff' },
  { command: '/skills', label: 'Skills Disponíveis (/skills)', description: 'Lista e inspeciona as skills built-in, globais e do workspace', category: 'tools', actionType: 'open-view', targetView: 'skills' },
  { command: '/mcp', label: 'Servidores MCP (/mcp)', description: 'Gerencia servidores Model Context Protocol (adicionar, remover, ativar)', category: 'tools', actionType: 'open-view', targetView: 'mcp' },
  { command: '/plugin', label: 'Plugins (/plugin)', description: 'Descobre, instala, valida, ativa e desativa plugins do Antigravity', category: 'tools', actionType: 'open-view', targetView: 'plugins' },
  { command: '/agents', label: 'Subagentes (/agents)', description: 'Lista agentes disponíveis (self, research, image-generator e customizados)', category: 'tools', actionType: 'open-view', targetView: 'agents' },
  { command: '/hooks', label: 'Hooks de Ciclo de Vida (/hooks)', description: 'Gerencia scripts e hooks para eventos de execução de ferramentas', category: 'tools', actionType: 'cli-headless' },
  { command: '/tasks', label: 'Tarefas em Background (/tasks)', description: 'Monitora processos e tarefas em execução na sessão atual', category: 'tools', actionType: 'local-action' },
  { command: '/usage', label: 'Uso de Cota (/usage)', description: 'Exibe o consumo atual de cota dos modelos', category: 'config', actionType: 'cli-headless' },
  { command: '/credits', label: 'Créditos G1 (/credits)', description: 'Exibe saldo de créditos G1 e link de recarga', category: 'config', actionType: 'cli-headless' },
  { command: '/changelog', label: 'Notas de Lançamento (/changelog)', description: 'Mostra o histórico de versões e novidades do Antigravity CLI', category: 'config', actionType: 'open-view', targetView: 'system' },
  { command: '/help', label: 'Ajuda e Atalhos (/help)', description: 'Exibe todos os comandos disponíveis e atalhos de teclado', category: 'session', actionType: 'cli-headless' },
  { command: '/clear', label: 'Limpar Conversa (/clear)', description: 'Limpa o histórico visual da conversa atual e inicia novo turno', category: 'session', actionType: 'local-action' },
  { command: '/fork', label: 'Ramificar Conversa (/fork)', description: 'Cria uma nova conversa ramificada a partir do estado atual', category: 'session', actionType: 'local-action' },
  { command: '/rewind', label: 'Retroceder Turno (/rewind)', description: 'Remove o último turno da conversa para refazer o prompt', category: 'session', actionType: 'local-action' },
  { command: '/copy', label: 'Copiar Última Resposta (/copy)', description: 'Copia a última resposta do agente para a área de transferência', category: 'session', actionType: 'local-action' },
  { command: '/plan', label: 'Modo Planejamento (/plan)', description: 'Solicita um plano estruturado passo a passo antes de executar', category: 'workflow', actionType: 'prompt-slash', argHint: '<tarefa>' },
  { command: '/goal', label: 'Modo Goal Autônomo (/goal)', description: 'Executa uma tarefa longa de forma autônoma até atingir o objetivo completo', category: 'workflow', actionType: 'prompt-slash', argHint: '<objetivo>' },
  { command: '/boost', label: 'Modo Boost Profundo (/boost)', description: 'Ativa raciocínio profundo, múltiplas perspectivas e verificação rigorosa', category: 'workflow', actionType: 'prompt-slash', argHint: '<problema>' },
  { command: '/teamwork', label: 'Equipe de Subagentes (/teamwork)', description: 'Orquestra múltiplos subagentes autônomos trabalhando em paralelo', category: 'workflow', actionType: 'prompt-slash', argHint: '<projeto>' },
  { command: '/grill-me', label: 'Entrevista de Design (/grill-me)', description: 'Alinha decisões de arquitetura através de perguntas interativas', category: 'workflow', actionType: 'prompt-slash', argHint: '<tema>' },
  { command: '/learn', label: 'Aprender Regra/Skill (/learn)', description: 'Persiste um aprendizado ou configuração para futuras tarefas', category: 'workflow', actionType: 'prompt-slash', argHint: '<instrução>' },
  { command: '/schedule', label: 'Agendar Tarefa (/schedule)', description: 'Agenda uma instrução recorrente (cron) ou timer único', category: 'workflow', actionType: 'prompt-slash', argHint: '<agendamento>' },
  { command: '/browser', label: 'Automação de Browser (/browser)', description: 'Inicia tarefa de navegação ou teste de aplicação web', category: 'workflow', actionType: 'prompt-slash', argHint: '<url ou tarefa>' },
];

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'permission-request';
  content: string;
  timestamp: string;
  model?: string;
  effort?: string;
  mode?: string;
  permissionPolicy?: string;
  commandLine?: string;
  thinking?: string;
  toolCalls?: {
    name: string;
    args: Record<string, any>;
    status?: 'running' | 'done' | 'approved' | 'rejected';
    output?: string;
  }[];
  status?: 'streaming' | 'done' | 'error' | 'awaiting-permission';
  pendingAction?: {
    prompt: string;
    commandDescription: string;
    workspace: string;
    model: string;
    effort: string;
    mode: string;
  };
}
