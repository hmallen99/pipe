import { createElement, createRoot } from '@pipe/pipe';

import './index.css';
import { TodoApp } from './TodoApp';

const rootElement = document.querySelector<HTMLDivElement>('#root')!;

const root = createRoot(rootElement);

root.render(createElement(TodoApp, {}));
