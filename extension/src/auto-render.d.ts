declare module 'katex/dist/contrib/auto-render' {
  interface RenderOptions {
    delimiters?: Array<{
      left: string;
      right: string;
      display: boolean;
    }>;
    throwOnError?: boolean;
    errorColor?: string;
    strict?: boolean;
    trust?: boolean;
  }

  function renderMathInElement(elem: HTMLElement, options?: RenderOptions): void;
  export default renderMathInElement;
}
