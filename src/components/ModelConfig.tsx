import React, { useState } from 'react';
import { Settings, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { ModelConfig as ModelConfigType, ModelName } from '../types/sat';

interface ModelConfigProps {
  config: ModelConfigType;
  onConfigChange: (config: Partial<ModelConfigType>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const ModelConfig: React.FC<ModelConfigProps> = ({ 
  config, 
  onConfigChange, 
  isOpen, 
  onToggle 
}) => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempConfig, setTempConfig] = useState<Partial<ModelConfigType>>(config);

  // Initialize with environment variables if available
  React.useEffect(() => {
    setTempConfig({
      ...config,
      openai_api_key: config.openai_api_key || (import.meta.env.VITE_OPENAI_API_KEY || ''),
      anthropic_api_key: config.anthropic_api_key || (import.meta.env.VITE_ANTHROPIC_API_KEY || ''),
      google_api_key: config.google_api_key || (import.meta.env.VITE_GOOGLE_API_KEY || ''),
    });
  }, [config]);

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    onConfigChange(tempConfig);
    onToggle();
  };

  const handleModelToggle = (model: ModelName) => {
    const currentModels = tempConfig.enabled_models || config.enabled_models;
    const newModels = currentModels.includes(model)
      ? currentModels.filter(m => m !== model)
      : [...currentModels, model];
    
    setTempConfig(prev => ({ ...prev, enabled_models: newModels }));
  };

  const getModelStatus = (model: ModelName) => {
    const enabled = (tempConfig.enabled_models || config.enabled_models).includes(model);
    const hasKey = getRequiredKey(model) ? !!tempConfig[getRequiredKey(model) as keyof ModelConfigType] : true;
    
    if (enabled && hasKey) return 'enabled';
    if (enabled && !hasKey) return 'needs-key';
    return 'disabled';
  };

  const getRequiredKey = (model: ModelName): string | null => {
    if (model.startsWith('gpt-') || model.startsWith('o4-')) return 'openai_api_key';
    if (model.startsWith('claude-')) return 'anthropic_api_key';
    if (model.startsWith('gemini-')) return 'google_api_key';
    if (model.startsWith('qwen')) return 'azure_api_key';
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="btn-secondary flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Configure Models
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Model Configuration</h2>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Configure API keys and model settings for optimal SAT solving performance
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* API Keys */}
          <div>
            <h3 className="font-medium text-slate-800 mb-3">API Keys</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={tempConfig.openai_api_key || ''}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, openai_api_key: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="sk-..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('openai')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.anthropic ? 'text' : 'password'}
                    value={tempConfig.anthropic_api_key || ''}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="sk-ant-..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('anthropic')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Google API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.google ? 'text' : 'password'}
                    value={tempConfig.google_api_key || ''}
                    onChange={(e) => setTempConfig(prev => ({ ...prev, google_api_key: e.target.value }))}
                    className="input-field pr-10"
                    placeholder="AIza..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('google')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showKeys.google ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <h3 className="font-medium text-slate-800 mb-3">Enabled Models</h3>
            <div className="space-y-2">
              {(['gpt-5', 'gpt-5-thinking', 'o4-mini', 'claude-3.5-sonnet', 'gemini-2.5-pro', 'qwen2.5-math-72b'] as ModelName[]).map((model) => {
                const status = getModelStatus(model);
                return (
                  <div key={model} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={(tempConfig.enabled_models || config.enabled_models).includes(model)}
                        onChange={() => handleModelToggle(model)}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-slate-800">{model}</div>
                        <div className="text-xs text-slate-600">
                          {model.startsWith('gpt-') || model.startsWith('o4-') ? 'OpenAI' :
                           model.startsWith('claude-') ? 'Anthropic' :
                           model.startsWith('gemini-') ? 'Google' : 'Azure/OSS'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {status === 'enabled' && <CheckCircle className="w-4 h-4 text-success-500" />}
                      {status === 'needs-key' && <XCircle className="w-4 h-4 text-error-500" />}
                      {status === 'disabled' && <div className="w-4 h-4 rounded-full bg-slate-300" />}
                      <span className={`text-xs ${
                        status === 'enabled' ? 'text-success-600' :
                        status === 'needs-key' ? 'text-error-600' : 'text-slate-500'
                      }`}>
                        {status === 'enabled' ? 'Ready' :
                         status === 'needs-key' ? 'Need Key' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Settings */}
          <div>
            <h3 className="font-medium text-slate-800 mb-3">Advanced Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reasoning Effort
                </label>
                <select
                  value={tempConfig.reasoning_effort || config.reasoning_effort}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, reasoning_effort: e.target.value as any }))}
                  className="input-field"
                >
                  <option value="minimal">Minimal</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={tempConfig.max_tokens || config.max_tokens}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                  className="input-field"
                  min="100"
                  max="4000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  value={tempConfig.temperature || config.temperature}
                  onChange={(e) => setTempConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="input-field"
                  min="0"
                  max="1"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onToggle}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};