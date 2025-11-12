/**
 * IP Restriction Test View
 * Manual testing interface for IP-based access control
 */

import React, { useState } from 'react';
import { ipRestriction } from '@/middleware/ipRestriction';
import { SECURITY_CONFIG, addToWhitelist, addToBlacklist, removeFromWhitelist, removeFromBlacklist } from '@/config/security';
import { Card } from '@/components/Card';

export function IPRestrictionTestView() {
  const [currentIP, setCurrentIP] = useState<string>('Loading...');
  const [ipInfo, setIPInfo] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [blockedLogs, setBlockedLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customIP, setCustomIP] = useState('');

  // Get current IP on mount
  React.useEffect(() => {
    detectCurrentIP();
  }, []);

  const detectCurrentIP = async () => {
    setLoading(true);
    try {
      const ip = await ipRestriction.getClientIP();
      setCurrentIP(ip);
      
      // Also get geo info
      if (ip !== 'unknown') {
        const geo = await ipRestriction.getIPGeoLocation(ip);
        setIPInfo(geo);
      }
    } catch (error) {
      console.error('Error detecting IP:', error);
      setCurrentIP('Error');
    } finally {
      setLoading(false);
    }
  };

  const testCurrentIP = async () => {
    setLoading(true);
    try {
      const result = await ipRestriction.middleware();
      setValidationResult(result);
    } catch (error) {
      console.error('Error testing IP:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCustomIP = async () => {
    if (!customIP) return;
    
    setLoading(true);
    try {
      const result = await ipRestriction.validateIPAccess(customIP);
      setValidationResult(result);
      
      // Get geo info
      const geo = await ipRestriction.getIPGeoLocation(customIP);
      setIPInfo(geo);
    } catch (error) {
      console.error('Error testing custom IP:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCurrentToWhitelist = () => {
    if (currentIP && currentIP !== 'unknown') {
      addToWhitelist(currentIP);
      alert(`Added ${currentIP} to whitelist`);
    }
  };

  const addCurrentToBlacklist = () => {
    if (currentIP && currentIP !== 'unknown') {
      addToBlacklist(currentIP);
      alert(`Added ${currentIP} to blacklist`);
    }
  };

  const removeCurrentFromWhitelist = () => {
    if (currentIP && currentIP !== 'unknown') {
      removeFromWhitelist(currentIP);
      alert(`Removed ${currentIP} from whitelist`);
    }
  };

  const removeCurrentFromBlacklist = () => {
    if (currentIP && currentIP !== 'unknown') {
      removeFromBlacklist(currentIP);
      alert(`Removed ${currentIP} from blacklist`);
    }
  };

  const loadBlockedLogs = async () => {
    setLoading(true);
    try {
      const logs = await ipRestriction.getBlockedIPLogs(20);
      setBlockedLogs(logs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">🔒 IP Restriction Testing</h1>
        <p className="text-gray-600">Test IP-based access control and geo-location features</p>
      </div>

      {/* Current IP Info */}
      <Card title="Your Current IP">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-gray-600">IP Address</div>
              <div className="text-2xl font-mono font-bold">{currentIP}</div>
            </div>
            <button
              onClick={detectCurrentIP}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              🔄 Refresh
            </button>
          </div>

          {ipInfo && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
              <div>
                <div className="text-sm text-gray-600">Country</div>
                <div className="font-semibold">{ipInfo.country} ({ipInfo.countryCode})</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">City</div>
                <div className="font-semibold">{ipInfo.city}, {ipInfo.region}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">ISP</div>
                <div className="font-semibold">{ipInfo.isp}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Timezone</div>
                <div className="font-semibold">{ipInfo.timezone}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={testCurrentIP}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              ✅ Test Access
            </button>
            <button
              onClick={addCurrentToWhitelist}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              ➕ Add to Whitelist
            </button>
            <button
              onClick={addCurrentToBlacklist}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              ➕ Add to Blacklist
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={removeCurrentFromWhitelist}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Remove from Whitelist
            </button>
            <button
              onClick={removeCurrentFromBlacklist}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Remove from Blacklist
            </button>
          </div>
        </div>
      </Card>

      {/* Test Custom IP */}
      <Card title="Test Custom IP">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={customIP}
              onChange={(e) => setCustomIP(e.target.value)}
              placeholder="Enter IP address (e.g., 8.8.8.8)"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={testCustomIP}
              disabled={loading || !customIP}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Test IP
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Test examples: 8.8.8.8 (Google DNS), 1.1.1.1 (Cloudflare)
          </p>
        </div>
      </Card>

      {/* Validation Result */}
      {validationResult && (
        <Card title="Validation Result">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-2xl ${validationResult.allowed ? 'text-green-500' : 'text-red-500'}`}>
                {validationResult.allowed ? '✅ ALLOWED' : '❌ BLOCKED'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Reason:</span>{' '}
              <span className="font-semibold">{validationResult.reason}</span>
            </div>
            <div>
              <span className="text-gray-600">Action:</span>{' '}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{validationResult.action}</span>
            </div>
            {validationResult.ipInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <div className="font-semibold mb-2">Geo Information:</div>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(validationResult.ipInfo, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Security Configuration */}
      <Card title="Current Security Configuration">
        <div className="space-y-4">
          <div>
            <div className="font-semibold mb-2">IP Restrictions:</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Enabled</div>
                <div className={SECURITY_CONFIG.ipRestriction.enabled ? 'text-green-600' : 'text-red-600'}>
                  {SECURITY_CONFIG.ipRestriction.enabled ? '✅ Yes' : '❌ No'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Geo-Location</div>
                <div className={SECURITY_CONFIG.geoLocation.enabled ? 'text-green-600' : 'text-red-600'}>
                  {SECURITY_CONFIG.geoLocation.enabled ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">Whitelist ({SECURITY_CONFIG.ipRestriction.whitelist.length}):</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto">
              {SECURITY_CONFIG.ipRestriction.whitelist.map((ip, i) => (
                <div key={i} className="font-mono text-sm">{ip}</div>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">Blacklist ({SECURITY_CONFIG.ipRestriction.blacklist.length}):</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto">
              {SECURITY_CONFIG.ipRestriction.blacklist.length === 0 ? (
                <div className="text-gray-400 text-sm">Empty</div>
              ) : (
                SECURITY_CONFIG.ipRestriction.blacklist.map((ip, i) => (
                  <div key={i} className="font-mono text-sm">{ip}</div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="font-semibold mb-2">Allowed Countries ({SECURITY_CONFIG.ipRestriction.allowedCountries.length}):</div>
            <div className="bg-gray-50 p-2 rounded max-h-32 overflow-auto">
              <div className="flex flex-wrap gap-2">
                {SECURITY_CONFIG.ipRestriction.allowedCountries.map((code, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Blocked IP Logs */}
      <Card title="Recent Blocked IPs">
        <div className="space-y-4">
          <button
            onClick={loadBlockedLogs}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            📋 Load Logs
          </button>

          {blockedLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blockedLogs.map((log, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm font-mono">{log.ip}</td>
                      <td className="px-4 py-2 text-sm">{log.reason}</td>
                      <td className="px-4 py-2 text-sm">{log.geoInfo?.country || 'N/A'}</td>
                      <td className="px-4 py-2 text-sm">{log.timestamp?.toDate?.()?.toLocaleString() || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default IPRestrictionTestView;
