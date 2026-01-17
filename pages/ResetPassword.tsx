import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Icon } from '../components/Icon';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      toast.error('As senhas não coincidem.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error('Não foi possível redefinir a senha.');
        return;
      }
      toast.success('Senha redefinida com sucesso.');
      navigate('/settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1216] p-4">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
            <Icon name="lock_reset" className="text-2xl" />
          </div>
          <h1 className="text-white text-xl font-black">Redefinir Senha</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">Digite sua nova senha para concluir a redefinição.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Nova Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none"
              placeholder="Digite a nova senha"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Confirmar Senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none"
              placeholder="Confirme a nova senha"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-colors ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-teal-500 hover:bg-teal-600'}`}
          >
            {loading ? (
              <>
                <span className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processando...
              </>
            ) : (
              <>
                <Icon name="check" />
                Redefinir Senha
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

