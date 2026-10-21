import React, { useState } from 'react';
import {
  FolderPlus,
  Folder,
  Shield,
  X,
  Check,
  Cpu,
  Lock,
  Globe,
  FileCode,
} from 'lucide-react';
import { AgyProject, AgyProjectSettings } from '../types/agy';
import { agyApi } from '../services/api';
import { useI18n } from '../i18n';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: AgyProject) => void;
  initialPath?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onProjectCreated,
  initialPath = '',
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [folderPath, setFolderPath] = useState(initialPath);
  const [permissionPolicy, setPermissionPolicy] = useState<'always-proceed' | 'request-review' | 'proceed-in-sandbox'>('always-proceed');
  const [fileAccessPolicy, setFileAccessPolicy] = useState('AGENT_SETTING_POLICY_ALLOW');
  const [internetPolicy, setInternetPolicy] = useState('AGENT_SETTING_POLICY_ALLOW');
  const [sandboxMode, setSandboxMode] = useState(false);
  const [autoExecutionPolicy, setAutoExecutionPolicy] = useState('CASCADE_COMMANDS_AUTO_EXECUTION_EAGER');
  const [artifactReviewMode, setArtifactReviewMode] = useState('ARTIFACT_REVIEW_MODE_TURBO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectFolder = async () => {
    if (window.electronAPI?.selectDirectory) {
      const selected = await window.electronAPI.selectDirectory();
      if (selected) {
        setFolderPath(selected);
        if (!name.trim()) {
          const base = selected.split(/[\/\\]/).pop() || '';
          setName(base);
        }
      }
    }
  };

  const handleCreate = async () => {
    if (!folderPath.trim()) {
      setError(t('projectModal.folderPlaceholder'));
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const projSettings: Partial<AgyProjectSettings> = {
        fileAccessPolicy,
        internetPolicy,
        sandboxMode: permissionPolicy === 'proceed-in-sandbox' || sandboxMode,
        autoExecutionPolicy:
          permissionPolicy === 'always-proceed'
            ? 'CASCADE_COMMANDS_AUTO_EXECUTION_EAGER'
            : permissionPolicy === 'proceed-in-sandbox'
            ? 'CASCADE_COMMANDS_AUTO_EXECUTION_PROCEED_IN_SANDBOX'
            : 'CASCADE_COMMANDS_AUTO_EXECUTION_OFF',
        artifactReviewMode,
        permissionPreset:
          permissionPolicy === 'always-proceed'
            ? 'AGENT_PERMISSION_PRESET_TURBO'
            : permissionPolicy === 'proceed-in-sandbox'
            ? 'AGENT_PERMISSION_PRESET_AUTO'
            : 'AGENT_PERMISSION_PRESET_REQUEST_REVIEW',
      };

      const res = await agyApi.createProject({
        name: name.trim() || folderPath.split(/[\/\\]/).pop() || 'Novo Projeto',
        folderPath: folderPath.trim(),
        settings: projSettings,
        permissionPolicy,
      });

      if (res.ok && res.project) {
        onProjectCreated(res.project);
        onClose();
      } else {
        setError('Falha ao criar arquivo de projeto.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao criar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agy-modal-overlay" onClick={onClose}>
      <div className="agy-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="agy-modal-header">
          <div className="agy-modal-title">
            <FolderPlus size={18} className="agy-accent-icon" />
            <span>{t('projectModal.title')}</span>
          </div>
          <button type="button" className="agy-icon-btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="agy-modal-body">
          {error && <div className="agy-error-banner">{error}</div>}

          {/* Nome do Projeto */}
          <div className="agy-form-field">
            <label>{t('projectModal.nameLabel')}</label>
            <input
              type="text"
              className="agy-input"
              placeholder={t('projectModal.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Pasta do Projeto */}
          <div className="agy-form-field">
            <label>{t('projectModal.folderLabel')}</label>
            <div className="agy-workspace-add-row" style={{ marginTop: 0 }}>
              <input
                type="text"
                className="agy-input"
                placeholder={t('projectModal.folderPlaceholder')}
                value={folderPath}
                onChange={(e) => {
                  setFolderPath(e.target.value);
                  if (!name.trim()) {
                    setName(e.target.value.split(/[\/\\]/).pop() || '');
                  }
                }}
              />
              <button
                type="button"
                className="agy-btn agy-btn-secondary"
                onClick={handleSelectFolder}
              >
                <Folder size={14} /> {t('projectModal.selectFolderBtn')}
              </button>
            </div>
            <span className="agy-form-field-hint">
              {t('projectModal.subtitle')}
            </span>
          </div>

          {/* Política de Execução por Projeto */}
          <div className="agy-form-field">
            <label>{t('projectModal.execPolicyLabel')}</label>
            <div className="agy-permission-segmented">
              <button
                type="button"
                className={`agy-seg-btn ${permissionPolicy === 'always-proceed' ? 'active success' : ''}`}
                onClick={() => setPermissionPolicy('always-proceed')}
              >
                ⚡ {t('prompt.commandsAuto')}
              </button>
              <button
                type="button"
                className={`agy-seg-btn ${permissionPolicy === 'request-review' ? 'active warning' : ''}`}
                onClick={() => setPermissionPolicy('request-review')}
              >
                ✋ {t('prompt.commandsAsk')}
              </button>
              <button
                type="button"
                className={`agy-seg-btn ${permissionPolicy === 'proceed-in-sandbox' ? 'active info' : ''}`}
                onClick={() => setPermissionPolicy('proceed-in-sandbox')}
              >
                🔒 {t('prompt.commandsSandbox')}
              </button>
            </div>
          </div>

          {/* Configurações Avançadas por Projeto */}
          <div className="agy-section-card" style={{ padding: 12 }}>
            <h3 style={{ fontSize: 13, marginBottom: 10 }}>Configurações Scoped (CLI ProjectSettings)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="agy-form-field">
                <label>{t('projectModal.fileAccessLabel')}</label>
                <select
                  className="agy-select"
                  value={fileAccessPolicy}
                  onChange={(e) => setFileAccessPolicy(e.target.value)}
                >
                  <option value="AGENT_SETTING_POLICY_ALLOW">Permitir (ALLOW)</option>
                  <option value="AGENT_SETTING_POLICY_ASK">Perguntar (ASK)</option>
                  <option value="AGENT_SETTING_POLICY_DENY">Negar (DENY)</option>
                </select>
              </div>

              <div className="agy-form-field">
                <label>{t('projectModal.internetAccessLabel')}</label>
                <select
                  className="agy-select"
                  value={internetPolicy}
                  onChange={(e) => setInternetPolicy(e.target.value)}
                >
                  <option value="AGENT_SETTING_POLICY_ALLOW">Permitir (ALLOW)</option>
                  <option value="AGENT_SETTING_POLICY_ASK">Perguntar (ASK)</option>
                  <option value="AGENT_SETTING_POLICY_DENY">Negar (DENY)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="agy-modal-footer">
          <button type="button" className="agy-btn agy-btn-secondary" onClick={onClose}>
            {t('projectModal.cancelBtn')}
          </button>
          <button
            type="button"
            className="agy-btn agy-btn-primary"
            onClick={handleCreate}
            disabled={loading || !folderPath.trim()}
          >
            <Check size={14} /> {loading ? '...' : t('projectModal.createBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
