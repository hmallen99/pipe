import { Component, createElement } from '@hmallen99/pipe';

export const BasicPage: Component<Record<string, unknown>> = () => {
  return createElement('div', {}, [
    createElement('p', { textContent: 'Hello World' }),
  ]);
};
