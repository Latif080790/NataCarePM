import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { Modal } from './Modal';
import { Input } from './FormControls';
import { useHotkeys } from '@/hooks/useHotkeys';
import { navLinksConfig } from '@/constants';
import { Search } from 'lucide-react';

interface CommandPaletteProps {
  onNavigate: (viewId: string) => void;
}

export function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const allCommands = useMemo(() => {
    return navLinksConfig.flatMap((group) =>
      group.children.map((link) => ({
        id: link.id,
        name: link.name,
        group: group.name,
        icon: link.icon,
      }))
    );
  }, []);

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return allCommands;
    return allCommands.filter((command) =>
      command.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allCommands]);

  const togglePalette = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const hotkeys = useMemo(() => new Map([['cmd+k', togglePalette]]), [togglePalette]);
  useHotkeys(hotkeys);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleSelect = (viewId: string) => {
    onNavigate(viewId);
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Pusat Komando">
      <div className="flex flex-col space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-palladium" />
          <Input
            type="text"
            placeholder="Cari atau lompat ke..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => (
              <button
                key={command.id}
                onClick={() => handleSelect(command.id)}
                className="w-full text-left p-2 flex items-center rounded-md hover:bg-violet-essence/50"
              >
                <command.icon className="h-5 w-5 mr-3 text-palladium" />
                <span>{command.name}</span>
              </button>
            ))
          ) : (
            <p className="text-center text-sm text-palladium p-4">Tidak ada hasil ditemukan.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
