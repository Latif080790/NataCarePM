import { useEffect, useCallback } from 'react';

export const useHotkeys = (hotkeys: Map<string, (e: KeyboardEvent) => void>) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore hotkeys if user is in an input field
      const target = event.target as HTMLElement;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();
      const modifier =
        (event.ctrlKey ? 'ctrl+' : '') +
        (event.metaKey ? 'meta+' : '') + // Command key on Mac
        (event.altKey ? 'alt+' : '') +
        (event.shiftKey ? 'shift+' : '');

      // Normalize for Mac/Windows (Cmd/Ctrl)
      const hotkey = (modifier + key).replace('meta+', 'cmd+').replace('control+', 'cmd+');

      if (hotkeys.has(hotkey)) {
        event.preventDefault();
        hotkeys.get(hotkey)?.(event);
      }
    },
    [hotkeys]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
