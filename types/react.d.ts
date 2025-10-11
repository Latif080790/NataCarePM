declare module 'react' {
  export = React;

  namespace React {
    type ReactNode = any;
    type ReactElement = any;
    type ComponentType<P = {}> = any;
    type FunctionComponent<P = {}> = (props: P) => ReactElement | null;
    type FC<P = {}> = FunctionComponent<P>;
    
    interface Component<P = {}, S = {}> {
      props: P;
      state: S;
      render(): ReactNode;
    }
    
    interface RefObject<T> {
      readonly current: T | null;
    }
    
    type Ref<T> = RefObject<T> | ((instance: T | null) => void) | null;
    
    interface HTMLAttributes<T> {
      className?: string;
      id?: string;
      style?: any;
      onClick?: (event: any) => void;
      onMouseDown?: (event: any) => void;
      onBlur?: (event: any) => void;
      onChange?: (event: any) => void;
    }
    
    interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
      type?: string;
      value?: string | number;
      placeholder?: string;
      disabled?: boolean;
    }
    
    interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }
    
    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | number;
      placeholder?: string;
      disabled?: boolean;
    }
    
    function forwardRef<T, P = {}>(
      render: (props: P, ref: Ref<T>) => ReactElement | null
    ): ComponentType<P & { ref?: Ref<T> }>;
  }
}