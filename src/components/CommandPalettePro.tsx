/**
 * CommandPalettePro - Professional Command Palette
 * 
 * VS Code-style command palette with:
 * - Keyboard shortcut (Cmd/Ctrl+K)
 * - Fuzzy search
 * - Categorized commands
 * - Recent commands
 * - Custom actions
 * - Keyboard navigation
 * - Accessible
 * 
 * @component
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Command, ArrowRight, Clock, Hash } from 'lucide-react';
import { ModalPro } from './ModalPro';
import { BadgePro } from './BadgePro';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  onExecute: () => void;
  keywords?: string[]; // For fuzzy search
}

interface CommandPalettePro {
  /** List of available commands */
  commands: CommandItem[];
  
  /** Show/hide palette */
  open: boolean;
  
  /** On close callback */
  onClose: () => void;
  
  /** Custom placeholder */
  placeholder?: string;
  
  /** Show recent commands */
  showRecent?: boolean;
  
  /** Max recent commands to show */
  maxRecent?: number;
}

const RECENT_COMMANDS_KEY = 'commandPalette_recent';

/**
 * Professional Command Palette Component
 */
export function CommandPalettePro({
  commands,
  open,
  onClose,
  placeholder = 'Type a command or search...',
  showRecent = true,
  maxRecent = 5,
}: CommandPalettePro) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_COMMANDS_KEY);
    if (stored) {
      try {
        setRecentCommands(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load recent commands:', e);
      }
    }
  }, []);

  // Save recent commands to localStorage
  const saveRecentCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, maxRecent);
      localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [maxRecent]);

  // Filter commands based on search
  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    
    const searchLower = search.toLowerCase();
    const matchLabel = cmd.label.toLowerCase().includes(searchLower);
    const matchDesc = cmd.description?.toLowerCase().includes(searchLower);
    const matchCategory = cmd.category?.toLowerCase().includes(searchLower);
    const matchKeywords = cmd.keywords?.some((kw) => kw.toLowerCase().includes(searchLower));
    
    return matchLabel || matchDesc || matchCategory || matchKeywords;
  });

  // Get recent command items
  const recentCommandItems = showRecent && !search
    ? recentCommands
        .map((id) => commands.find((cmd) => cmd.id === id))
        .filter(Boolean) as CommandItem[]
    : [];

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Flatten for keyboard navigation
  const allFilteredCommands = [
    ...recentCommandItems.map(cmd => ({ ...cmd, isRecent: true })),
    ...filteredCommands,
  ];

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Execute command
  const executeCommand = useCallback((command: CommandItem) => {
    command.onExecute();
    saveRecentCommand(command.id);
    onClose();
    setSearch('');
  }, [onClose, saveRecentCommand]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < allFilteredCommands.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (allFilteredCommands[selectedIndex]) {
          executeCommand(allFilteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [selectedIndex, allFilteredCommands, executeCommand, onClose]);

  return (
    <ModalPro
      isOpen={open}
      onClose={onClose}
      size="lg"
      className="!p-0"
    >
      <div className="flex flex-col h-[600px] max-h-[80vh]">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="
                w-full pl-11 pr-4 py-3 text-base
                bg-transparent border-0
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none
              "
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <kbd className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600">
                Esc
              </kbd>
              <span className="text-xs text-gray-400">to close</span>
            </div>
          </div>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2"
        >
          {/* Recent Commands */}
          {recentCommandItems.length > 0 && !search && (
            <div className="mb-4">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Recent
              </div>
              {recentCommandItems.map((cmd, index) => (
                <CommandItemRow
                  key={cmd.id}
                  command={cmd}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => executeCommand(cmd)}
                  onHover={() => setSelectedIndex(index)}
                  showCategory={false}
                />
              ))}
            </div>
          )}

          {/* Grouped Commands */}
          {search ? (
            // Show all filtered when searching
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {filteredCommands.length} results
              </div>
              {filteredCommands.map((cmd, index) => (
                <CommandItemRow
                  key={cmd.id}
                  command={cmd}
                  index={recentCommandItems.length + index}
                  isSelected={selectedIndex === recentCommandItems.length + index}
                  onClick={() => executeCommand(cmd)}
                  onHover={() => setSelectedIndex(recentCommandItems.length + index)}
                  showCategory
                />
              ))}
            </div>
          ) : (
            // Show by category when not searching
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2">
                  <Hash className="w-3 h-3" />
                  {category}
                </div>
                {cmds.map((cmd, index) => {
                  const globalIndex = recentCommandItems.length + 
                    Object.entries(groupedCommands)
                      .slice(0, Object.keys(groupedCommands).indexOf(category))
                      .reduce((sum, [, items]) => sum + items.length, 0) + 
                    index;
                  
                  return (
                    <CommandItemRow
                      key={cmd.id}
                      command={cmd}
                      index={globalIndex}
                      isSelected={selectedIndex === globalIndex}
                      onClick={() => executeCommand(cmd)}
                      onHover={() => setSelectedIndex(globalIndex)}
                      showCategory={false}
                    />
                  );
                })}
              </div>
            ))
          )}

          {/* Empty State */}
          {filteredCommands.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No commands found for "<span className="font-medium">{search}</span>"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">↵</kbd>
                <span>Execute</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>+K to open</span>
            </div>
          </div>
        </div>
      </div>
    </ModalPro>
  );
}

/**
 * Command Item Row Component
 */
function CommandItemRow({
  command,
  index,
  isSelected,
  onClick,
  onHover,
  showCategory,
}: {
  command: CommandItem;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
  showCategory: boolean;
}) {
  const Icon = command.icon;

  return (
    <button
      data-index={index}
      onClick={onClick}
      onMouseEnter={onHover}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
        text-left transition-all duration-150
        ${isSelected
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-900 dark:text-primary-100'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Icon */}
      {Icon && (
        <div className={`
          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          ${isSelected
            ? 'bg-primary-200 dark:bg-primary-800'
            : 'bg-gray-100 dark:bg-gray-700'
          }
        `}>
          <Icon className="w-4 h-4" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{command.label}</span>
          {showCategory && command.category && (
            <BadgePro variant="default" size="sm">
              {command.category}
            </BadgePro>
          )}
        </div>
        {command.description && (
          <p className={`text-xs truncate ${
            isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {command.description}
          </p>
        )}
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <div className="flex-shrink-0 flex items-center gap-1">
          {command.shortcut.map((key, i) => (
            <kbd
              key={i}
              className={`
                px-1.5 py-0.5 text-xs font-medium rounded border
                ${isSelected
                  ? 'bg-primary-200 dark:bg-primary-800 border-primary-300 dark:border-primary-700 text-primary-900 dark:text-primary-100'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                }
              `}
            >
              {key}
            </kbd>
          ))}
        </div>
      )}

      {/* Arrow */}
      {isSelected && (
        <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary-600 dark:text-primary-400" />
      )}
    </button>
  );
}

/**
 * Hook to use Command Palette with keyboard shortcut
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default CommandPalettePro;

