import { createElement, createRoot } from '@hmallen99/pipe';

import './index.css';
import { App } from './App';

const rootElement = document.querySelector<HTMLDivElement>('#root')!;

const root = createRoot(rootElement);

root.render(createElement(App, {}));
