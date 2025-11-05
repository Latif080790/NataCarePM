import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { Input } from './FormControls';
import { useHotkeys } from '@/hooks/useHotkeys';
import { navLinksConfig } from '@/constants';
import { Search } from 'lucide-react';

interface CommandPaletteProps {
  // Remove onNavigate prop since we'll use useNavigate hook
}

export function CommandPalette({}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  // Map view IDs to routes
  const routeMap: Record<string, string> = {
    dashboard: '/',
    analytics: '/analytics',
    rab_ahsp: '/rab',
    rab_basic: '/rab/basic',
    rab_approval: '/rab/approval',
    jadwal: '/schedule',
    tasks: '/tasks',
    task_list: '/tasks/list',
    kanban: '/tasks/kanban',
    kanban_board: '/tasks/kanban/board',
    dependencies: '/tasks/dependencies',
    notifications: '/notifications',
    monitoring: '/monitoring',
    laporan_harian: '/reports/daily',
    progres: '/reports/progress',
    absensi: '/attendance',
    biaya_proyek: '/finance',
    arus_kas: '/finance/cashflow',
    strategic_cost: '/finance/strategic',
    chart_of_accounts: '/finance/chart-of-accounts',
    journal_entries: '/finance/journal-entries',
    accounts_payable: '/finance/accounts-payable',
    accounts_receivable: '/finance/accounts-receivable',
    wbs_management: '/wbs',
    goods_receipt: '/logistics/goods-receipt',
    material_request: '/logistics/material-request',
    vendor_management: '/logistics/vendor-management',
    inventory_management: '/logistics/inventory',
    integration_dashboard: '/logistics/integration',
    cost_control: '/finance/cost-control',
    logistik: '/logistics',
    dokumen: '/documents',
    documents: '/documents/intelligent',
    laporan: '/reports',
    user_management: '/settings/users',
    master_data: '/settings/master-data',
    audit_trail: '/settings/audit-trail',
    profile: '/profile',
    ai_resource_optimization: '/ai/resource-optimization',
    predictive_analytics: '/ai/predictive-analytics',
    advanced_analytics: '/analytics/advanced',
    chat: '/chat',
    custom_report_builder: '/reports/custom-builder',
  };

  const handleSelect = (viewId: string) => {
    const route = routeMap[viewId] || '/';
    navigate(route);
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