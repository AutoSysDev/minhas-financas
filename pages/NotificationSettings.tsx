import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { useNotifications } from '../context/NotificationContext';
import { NotificationSettings } from '../types/notifications';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { useToast } from '../context/ToastContext';

const NotificationSettingsPage: React.FC = () => {
    const { settings, updateSettings } = useNotifications();
    const { user } = useAuth();
    const { toast } = useToast();
    const [localSettings, setLocalSettings] = useState<NotificationSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await updateSettings(localSettings);
        setIsSaving(false);
    };

    const toggleSetting = (category: keyof NotificationSettings, field: 'enabled') => {
        setLocalSettings({
            ...localSettings,
            [category]: {
                ...localSettings[category],
                [field]: !localSettings[category][field]
            }
        });
    };

    const updateValue = (category: keyof NotificationSettings, field: string, value: any) => {
        setLocalSettings({
            ...localSettings,
            [category]: {
                ...localSettings[category],
                [field]: value
            }
        });
    };

    const notificationTypes = [
        {
            key: 'billReminder' as keyof NotificationSettings,
            icon: 'receipt_long',
            title: 'Lembrete de Contas',
            description: 'Notificar antes do vencimento',
            color: '#3b82f6',
            settings: [
                {
                    label: 'Dias antes do vencimento',
                    type: 'number',
                    field: 'daysBeforeDue',
                    min: 1,
                    max: 30
                }
            ]
        },
        {
            key: 'budgetAlert' as keyof NotificationSettings,
            icon: 'warning',
            title: 'Alertas de Orçamento',
            description: 'Avisar quando atingir o limite',
            color: '#f59e0b',
            settings: [
                {
                    label: 'Percentual de alerta (%)',
                    type: 'number',
                    field: 'threshold',
                    min: 50,
                    max: 100
                }
            ]
        },
        {
            key: 'weeklySummary' as keyof NotificationSettings,
            icon: 'assessment',
            title: 'Resumo Semanal',
            description: 'Receber relatório de gastos',
            color: '#8b5cf6',
            settings: [
                {
                    label: 'Dia da semana',
                    type: 'select',
                    field: 'dayOfWeek',
                    options: [
                        { value: 0, label: 'Domingo' },
                        { value: 1, label: 'Segunda' },
                        { value: 2, label: 'Terça' },
                        { value: 3, label: 'Quarta' },
                        { value: 4, label: 'Quinta' },
                        { value: 5, label: 'Sexta' },
                        { value: 6, label: 'Sábado' }
                    ]
                }
            ]
        },
        {
            key: 'savingsTips' as keyof NotificationSettings,
            icon: 'lightbulb',
            title: 'Dicas de Economia',
            description: 'Sugestões personalizadas',
            color: '#10b981',
            settings: [
                {
                    label: 'Frequência',
                    type: 'select',
                    field: 'frequency',
                    options: [
                        { value: 'daily', label: 'Diária' },
                        { value: 'weekly', label: 'Semanal' },
                        { value: 'monthly', label: 'Mensal' }
                    ]
                }
            ]
        }
    ];

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">
            <div>
                <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">
                    Notificações
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                    Configure como e quando deseja receber notificações
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {notificationTypes.map((type) => {
                    const isEnabled = localSettings[type.key].enabled;

                    return (
                        <div
                            key={type.key}
                            className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] p-5 transition-all hover:bg-white/[0.04]"
                        >
                            <div className="flex items-start gap-4">
                                {/* Ícone */}
                                <div
                                    className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${type.color}20` }}
                                >
                                    <Icon name={type.icon} className="text-2xl" style={{ color: type.color }} />
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-white mb-1">{type.title}</h3>
                                            <p className="text-sm text-gray-400">{type.description}</p>
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => toggleSetting(type.key, 'enabled')}
                                            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isEnabled ? 'bg-teal-500' : 'bg-gray-700'
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Configurações adicionais */}
                                    {isEnabled && type.settings && (
                                        <div className="space-y-3 pt-3 border-t border-white/[0.05]">
                                            {type.settings.map((setting: any) => (
                                                <div key={setting.field}>
                                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                                        {setting.label}
                                                    </label>

                                                    {setting.type === 'number' && (
                                                        <input
                                                            type="number"
                                                            min={setting.min}
                                                            max={setting.max}
                                                            value={(localSettings[type.key] as any)[setting.field]}
                                                            onChange={(e) =>
                                                                updateValue(type.key, setting.field, parseInt(e.target.value))
                                                            }
                                                            className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        />
                                                    )}

                                                    {setting.type === 'select' && (
                                                        <select
                                                            value={(localSettings[type.key] as any)[setting.field]}
                                                            onChange={(e) =>
                                                                updateValue(
                                                                    type.key,
                                                                    setting.field,
                                                                    setting.field === 'dayOfWeek'
                                                                        ? parseInt(e.target.value)
                                                                        : e.target.value
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                        >
                                                            {setting.options.map((option: any) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div
                className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] p-5 transition-all hover:bg-white/[0.04]"
            >
                <div className="flex items-start gap-4">
                    <div
                        className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `#ef444420` }}
                    >
                        <Icon name="lock_reset" className="text-2xl" style={{ color: '#ef4444' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <h3 className="text-base font-bold text-white mb-1">Redefinir Senha</h3>
                                <p className="text-sm text-gray-400">
                                    Envie um e-mail para redefinir sua senha.
                                </p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!user?.email) {
                                        toast.error('E-mail do usuário não encontrado.');
                                        return;
                                    }
                                    try {
                                        setIsSendingReset(true);
                                        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                                            redirectTo: `${window.location.origin}/#/reset-password`
                                        });
                                        if (error) {
                                            toast.error('Erro ao enviar e-mail de redefinição.');
                                        } else {
                                            toast.success('E-mail de redefinição enviado.');
                                        }
                                    } finally {
                                        setIsSendingReset(false);
                                    }
                                }}
                                disabled={isSendingReset}
                                className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 bg-red-500 text-white text-base font-medium leading-normal gap-2 hover:bg-red-600 transition-colors shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]"
                            >
                                <Icon name="send" />
                                <span className="truncate hidden md:inline">{isSendingReset ? 'Enviando...' : 'Enviar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botão Salvar */}
            <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isSaving ? (
                    <>
                        <Icon name="sync" className="text-xl animate-spin" />
                        Salvando...
                    </>
                ) : (
                    <>
                        <Icon name="check" className="text-xl" />
                        Salvar Configurações
                    </>
                )}
            </button>
        </div>
    );
};

export default NotificationSettingsPage;
