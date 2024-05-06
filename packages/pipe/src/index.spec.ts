import { Component, createElement } from './createElement';
import { createRoot } from './createRoot';
import { Observable, Subject, BehaviorSubject, scan, map, tap } from 'rxjs';

describe('Pipe', () => {
    it('should render an HTML element in a component', () => {
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

    it('should create a pipe element in a component', () => {
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

        const CounterWrapper: Component<
            Record<string, Observable<void>>
        > = () => {
            return createElement(Counter, {});
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        render(createElement(CounterWrapper, {}));

        const button = container.firstChild as HTMLButtonElement;
        expect(button).toBeInstanceOf(HTMLButtonElement);

        button.click();

        expect(button.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should nest children in a pipe element', () => {
        const spy = jest.fn();
        const Text: Component<{
            count$: Observable<number>;
        }> = ({ count$ }) => {
            const textContent = count$.pipe(
                map((x) => String(x)),
                tap((value) => spy(value))
            );

            return createElement('p', {
                textContent,
            });
        };

        const TextWrapper: Component<{
            count$: Observable<number>;
        }> = ({ count$ }) => {
            return createElement('div', {}, [
                createElement(Text, { count$ }),
                createElement(Text, { count$: count$.pipe(map((x) => x * 2)) }),
            ]);
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const count$ = new Subject<number>();

        render(
            createElement(TextWrapper, {
                count$,
            })
        );

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeInstanceOf(HTMLDivElement);

        const singleText = div.firstChild;
        const doubleText = singleText.nextSibling;

        expect(singleText.textContent).toEqual('');
        expect(doubleText.textContent).toEqual('');

        count$.next(1);

        expect(singleText.textContent).toEqual('1');
        expect(doubleText.textContent).toEqual('2');
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith('1');
        expect(spy).toHaveBeenCalledWith('2');

        count$.next(2);

        expect(singleText.textContent).toEqual('2');
        expect(doubleText.textContent).toEqual('4');
        expect(spy).toHaveBeenCalledTimes(4);
        expect(spy).toHaveBeenCalledWith('2');
        expect(spy).toHaveBeenCalledWith('4');

        unmount();

        expect(container.firstChild).toBeFalsy();
        count$.next(3);

        expect(spy).toHaveBeenCalledTimes(4);
    });

    it('should clean up observables on unmount', () => {
        const spy = jest.fn();
        const Text: Component<{
            count$: Observable<number>;
        }> = ({ count$ }) => {
            const textContent = count$.pipe(
                map((x) => String(x)),
                tap((value) => spy(value))
            );

            return createElement('p', {
                textContent,
            });
        };

        const TextWrapper: Component<{
            count$: Observable<number>;
        }> = ({ count$ }) => {
            return createElement(Text, { count$ });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const count$ = new Subject<number>();

        render(
            createElement(TextWrapper, {
                count$,
            })
        );

        const textElement = container.firstChild as HTMLParagraphElement;
        expect(textElement).toBeInstanceOf(HTMLParagraphElement);

        expect(textElement.textContent).toEqual('');

        count$.next(1);

        expect(textElement.textContent).toEqual('1');
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('1');

        count$.next(2);

        expect(textElement.textContent).toEqual('2');
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith('2');

        unmount();

        expect(container.firstChild).toBeFalsy();
        count$.next(3);

        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith('2');
    });
});
