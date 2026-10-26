components/Market/InvestorLevelBadgeImpl.tsx
// Badge de nível do investidor - Implementation

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon";
import { useInvestorProfile } from "../../context/InvestorProfileContext";
import type { InvestorLevel } from "../../types/market";
import { LEVEL_CONFIG } from "./InvestorLevelBadge";

// ============================================
// DROPDOWN CONTENT (rendered via Portal)
// ============================================

const DropdownContent: React.FC<{
  config: typeof LEVEL_CONFIG[keyof typeof LEVEL_CONFIG];
  level: InvestorLevel;
  onClose: () => void;
  onLevelChange: (lvl: InvestorLevel) => void;
  onSettingsClick: () => void;
}> = ({ config, level, onClose, onLevelChange, onSettingsClick }) => (
  <>
    <div className="fixed inset-0 z-[9999]" onClick={onClose} aria-hidden="true" />
    <div className="fixed right-4 top-20 z-[10000] w-56 min-w-[200px] animate-slide-down">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Seu Perfil
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Altera a densidade de informações no dashboard
          </p>
        </div>
        
        <div className="py-1" role="listbox" aria-label="Selecionar nível de investidor">
          {(Object.keys(LEVEL_CONFIG) as InvestorLevel[]).map((lvl) => {
            const c = LEVEL_CONFIG[lvl];
            const isActive = lvl === level;
            
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => { onLevelChange(lvl); }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${isActive 
                    ? `${c.bgColor} text-${c.color.replace("#", "")}-700 dark:text-${c.color.replace("#", "")}-300` 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }
                `}
                role="option"
                aria-selected={isActive}
              >
                <div className={`p-1.5 rounded-lg ${c.bgColor} text-${c.color.replace("#", "")}-600 dark:text-${c.color.replace("#", "")}-400`}>
                  <Icon name={c.icon} className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{c.description}</p>
                </div>
                {isActive && (
                  <Icon name="check_circle" className={`size-5 ${c.color}`} />
                )}
              </button>
            );
          })}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onSettingsClick}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
          >
            <Icon name="settings" className="size-4" />
            Configurações completas
          </button>
        </div>
      </div>
    </div>
  </>
);

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const InvestorLevelBadge: React.FC<{
  level: InvestorLevel;
  onClick?: () => void;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({
  level,
  onClick,
  showLabel = true,
  size = "md",
  className = "",
}) => {
  const { updatePreferences, completeOnboarding } = useInvestorProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const config = LEVEL_CONFIG[level];
  
  // Ensure portal only renders client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1 text-[10px] gap-1",
    md: "px-3 py-1.5 text-xs gap-1.5",
    lg: "px-4 py-2 text-sm gap-2",
  };
  
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);
  
  const handleLevelChange = (newLevel: InvestorLevel) => {
    setIsOpen(false);
    if (onClick) onClick();
    // If user wants to change level, re-run onboarding
    completeOnboarding(newLevel);
  };
  
  const handleSettingsClick = () => {
    setIsOpen(false);
    if (onClick) onClick();
  };
  
  // Only render portal after client-side hydration
  const portalContent = isMounted && isOpen ? createPortal(
    <DropdownContent
      config={config}
      level={level}
      onClose={() => setIsOpen(false)}
      onLevelChange={handleLevelChange}
      onSettingsClick={handleSettingsClick}
    />,
    document.body
  ) : null;
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Badge Principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center ${sizeClasses[size]} rounded-full border transition-all
          ${config.bgColor} border-current/20 text-${config.color.replace("#", "")}-700 dark:text-${config.color.replace("#", "")}-300
          ${onClick ? "cursor-pointer hover:bg-current/10" : "cursor-default"}
          ${className}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Perfil de investidor: ${config.label}`}
      >
        <Icon name={config.icon} className="size-4" aria-hidden="true" />
        {showLabel && <span className="font-bold">{config.shortLabel}</span>}
        <Icon name="expand_more" className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      
      {/* Dropdown via Portal - renders at body level */}
      {isMounted && isOpen && createPortal(
        <DropdownContent
          config={config}
          level={level}
          onClose={() => setIsOpen(false)}
          onLevelChange={handleLevelChange}
          onSettingsClick={handleSettingsClick}
        />,
        document.body
      )}
    </div>
  );
};

// ============================================
// VARIANTE SIMPLES (apenas display)
// ============================================

export const SimpleLevelBadge: React.FC<{
  level: InvestorLevel;
  size?: "sm" | "md";
  className?: string;
}> = ({ 
  level, 
  size = "md", 
  className = "" 
}) => {
  const config = LEVEL_CONFIG[level];
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
  };
  
  return (
    <span className={`
      inline-flex items-center ${sizeClasses[size]} rounded-full
      ${config.bgColor} border border-current/20 text-${config.color.replace("#", "")}-700 dark:text-${config.color.replace("#", "")}-300
      font-bold uppercase tracking-wider
      ${className}
    `}>
    <Icon name={config.icon} className="size-3" />
    <span>{config.shortLabel}</span>
  </span>
);
}
