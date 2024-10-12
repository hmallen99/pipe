import {
  BehaviorSubject,
  Component,
  createElement,
  createRoot,
  map,
  Observable,
  scan,
  Subject,
} from '@pipe/pipe';

import './index.css';

const rootElement = document.querySelector<HTMLDivElement>('#root')!;

const root = createRoot(rootElement);

const Counter: Component<Record<string, Observable<void>>> = () => {
  const click$ = new Subject<void>();
  const onclick = new BehaviorSubject<() => void>(() => {
    click$.next();
  });
  const textContent = click$.pipe(
    scan((x) => x + 1, 0),
    map((x) => String(x)),
  );

  return createElement('button', {
    onclick,
    textContent,
  });
};

root.render(createElement(Counter, {}));
