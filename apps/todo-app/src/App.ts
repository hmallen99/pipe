import { Component, createElement } from '@hmallen99/pipe';
import { TodoApp } from './TodoApp';
import { Router, Routes } from '@hmallen99/pipe-router';
import { BasicPage } from './BasicPage';
import { NavigationBar } from './NavigationBar';

export const App: Component<Record<string, unknown>> = () => {
  const routes: Routes = {
    '/': TodoApp,
    '/basic': BasicPage,
  };

  return createElement(Router, { routes, id: 'pageRouter' }, [
    createElement(NavigationBar, {}),
  ]);
};
