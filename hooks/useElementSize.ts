import { useState, useCallback, useEffect } from 'react';

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  (node: T | null) => void,
  { width: number; height: number }
] {
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  const handleSize = useCallback(() => {
    setSize({
      width: ref?.offsetWidth || 0,
      height: ref?.offsetHeight || 0,
    });
  }, [ref]);

  useEffect(() => {
    if (!ref) {
      return;
    }

    handleSize();

    const resizeObserver = new ResizeObserver(() => handleSize());
    resizeObserver.observe(ref);

    return () => {
      resizeObserver.disconnect();
    };
  }, [ref, handleSize]);

  return [setRef, size];
}
