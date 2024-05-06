import { Component, createElement } from './createElement';
import { createRoot } from './createRoot';
import { Observable, Subject, BehaviorSubject, scan, map } from 'rxjs';

describe('Pipe', () => {
    it('should render a child into a node', () => {
        const Counter: Component<Record<string, Observable<void>>> = () => {
            const click$ = new Subject<void>();
            const onclick = new BehaviorSubject<() => void>(() => {
                click$.next();
            });
            const textContent = click$.pipe(
                scan((x) => x + 1, 0),
                map((x) => String(x))
            );

            return createElement('button', {
                onclick,
                textContent,
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        render(createElement(Counter, {}));

        const button = container.firstChild as HTMLButtonElement;
        expect(button).toBeInstanceOf(HTMLButtonElement);

        button.click();

        expect(button.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        unmount();

        expect(container.firstChild).toBeFalsy();
    });
});
