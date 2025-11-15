import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface NavigationDebugProps {
  currentView: string;
  availableViews: string[];
  userPermissions?: string[];
}

export const NavigationDebug: React.FC<NavigationDebugProps> = ({
  currentView,
  availableViews,
  userPermissions = [],
}) => {
  const isViewAvailable = availableViews.includes(currentView);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl max-w-sm border border-slate-700">
      <div className="flex items-center space-x-2 mb-3">
        <Info className="w-4 h-4 text-blue-400" />
        <h3 className="font-bold text-sm">Navigation Debug</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          {isViewAvailable ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : (
            <XCircle className="w-3 h-3 text-red-400" />
          )}
          <span className="font-medium">Current View:</span>
          <code className="bg-slate-800 px-2 py-0.5 rounded">{currentView}</code>
        </div>

        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-3 h-3 text-yellow-400 mt-0.5" />
          <div>
            <span className="font-medium">Status:</span>
            <p className="text-slate-400 mt-1">
              {isViewAvailable
                ? `✅ View "${currentView}" is registered and available`
                : `❌ View "${currentView}" not found in viewComponents`}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-700">
          <p className="font-medium mb-1">Available Views ({availableViews.length}):</p>
          <div className="max-h-32 overflow-y-auto bg-slate-800 p-2 rounded text-[10px]">
            {availableViews.sort().map((view, idx) => (
              <div
                key={idx}
                className={`${view === currentView ? 'text-green-400 font-bold' : 'text-slate-400'}`}
              >
                {idx + 1}. {view}
              </div>
            ))}
          </div>
        </div>

        {userPermissions.length > 0 && (
          <div className="pt-2 border-t border-slate-700">
            <p className="font-medium mb-1">User Permissions ({userPermissions.length}):</p>
            <div className="flex flex-wrap gap-1">
              {userPermissions.map((perm, idx) => (
                <span
                  key={idx}
                  className="bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded text-[9px]"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

