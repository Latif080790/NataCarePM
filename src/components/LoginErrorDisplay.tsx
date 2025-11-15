import { AlertCircle, Home, RefreshCw, ShieldAlert, WifiOff, XCircle } from 'lucide-react';
import { ButtonPro } from '@/components/ButtonPro';
import { CardPro } from '@/components/CardPro';

export interface LoginErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

type ErrorKind = 'auth' | 'network' | 'server';

function determineErrorKind(error: string): ErrorKind {
  const lower = error.toLowerCase();

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'network';
  }

  if (lower.includes('server') || lower.includes('err-') || lower.includes('500')) {
    return 'server';
  }

  return 'auth';
}

const errorHeading: Record<ErrorKind, string> = {
  auth: 'Login gagal',
  network: 'Masalah koneksi jaringan',
  server: 'Kesalahan server',
};

const errorDescription: Record<ErrorKind, string> = {
  auth: 'Periksa kembali email dan kata sandi Anda, kemudian coba lagi.',
  network: 'Pastikan koneksi internet stabil lalu coba kembali.',
  server: 'Kami sedang mengalami kendala. Silakan coba beberapa saat lagi.',
};

const errorIcon: Record<ErrorKind, JSX.Element> = {
  auth: <ShieldAlert className="h-5 w-5" />,
  network: <WifiOff className="h-5 w-5" />,
  server: <AlertCircle className="h-5 w-5" />,
};

export function LoginErrorDisplay({ error, onRetry, onGoHome }: LoginErrorDisplayProps) {
  const kind = determineErrorKind(error);
  const accentClass = kind === 'auth' ? 'text-amber-600' : 'text-red-600';

  return (
    <CardPro className="mb-6 bg-red-50 border border-red-100" variant="flat">
      <div className="flex items-start gap-3">
        <div className={`${accentClass}`}>{errorIcon[kind]}</div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1" role="heading" aria-level={3}>
            {errorHeading[kind]}
          </p>
          <p className="text-sm text-gray-700 mb-2" data-testid="login-error-message">
            {error}
          </p>
          <p className="text-xs text-gray-500 mb-4" data-testid="login-error-hint">
            {errorDescription[kind]}
          </p>
          <div className="flex flex-wrap gap-2">
            {onRetry && (
              <ButtonPro
                type="button"
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
                data-testid="login-error-retry"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </ButtonPro>
            )}
            {onGoHome && (
              <ButtonPro
                type="button"
                variant="ghost"
                size="sm"
                onClick={onGoHome}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Kembali ke Beranda
              </ButtonPro>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Sembunyikan pesan kesalahan"
          className="text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onRetry ?? (() => undefined)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </CardPro>
  );
}

export default LoginErrorDisplay;

