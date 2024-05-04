import { Component, createElement } from './createElement';
import { createRoot } from './createRoot';
import { Observable, Subject, BehaviorSubject, scan, map } from 'rxjs';

describe('Pipe', () => {
    it('should render a child into a node', () => {
        const Counter: Component<{ render$: Observable<void> }> = ({
            render$,
        }) => {
            const click$ = new Subject<void>();
            const onclick = new BehaviorSubject<() => void>(() => {
                click$.next();
            });
            const textContent = click$.pipe(
                scan((x) => x + 1, 0),
                map((x) => String(x))
            );

            render$.subscribe({
                complete: () => {
                    click$.complete();
                    onclick.complete();
                },
            });

            return createElement('button', {
                onclick,
                textContent,
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container, Counter);

        render();

        const button = container.firstChild as HTMLButtonElement;
        expect(button).toBeInstanceOf(HTMLButtonElement);

        button.click();

        expect(button.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        unmount();
    });
});
