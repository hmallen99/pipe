import { Component, createElement } from '@hmallen99/pipe';
import { Link } from '@hmallen99/pipe-router';

export const NavigationBar: Component<Record<string, unknown>> = () => {
  return createElement('div', { id: 'navigation-bar' }, [
    createElement(Link, { url: '/', id: 'home' }, [
      createElement('p', { textContent: 'Home' }),
    ]),
    createElement(Link, { url: '/basic', id: 'basic' }, [
      createElement('p', { textContent: 'Basic' }),
    ]),
  ]);
};
