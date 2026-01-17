import React from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { motion } from 'framer-motion';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: string | null;
  isLoading: boolean;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  isOpen,
  onClose,
  analysis,
  isLoading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Análise Financeira com IA"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 min-h-[300px]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="size-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
              <Icon 
                name="auto_awesome" 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400 animate-pulse" 
              />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg">Processando Dados...</h3>
              <p className="text-gray-400 text-sm">Nossa inteligência está analisando suas transações.</p>
            </div>
          </div>
        ) : analysis ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6 text-gray-300 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <Icon name="error" className="text-4xl text-red-400 mb-2" />
            <p className="text-gray-400">Não foi possível gerar a análise no momento.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
