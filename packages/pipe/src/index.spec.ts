import { Component, createElement } from './createElement';
import { createRoot } from './createRoot';
import {
    Observable,
    Subject,
    BehaviorSubject,
    scan,
    map,
    tap,
    distinctUntilChanged,
} from 'rxjs';

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

    it('should render a list of children from an observable', () => {
        const TextWrapper: Component<{
            addChild$: Observable<[string, string]>;
        }> = ({ addChild$ }) => {
            return createElement(
                'div',
                {},
                addChild$.pipe(
                    map(([key, value]) => [
                        key,
                        createElement('p', {
                            textContent: new BehaviorSubject(value),
                        }),
                    ])
                )
            );
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const addChild$ = new Subject<[string, string]>();

        render(
            createElement(TextWrapper, {
                addChild$,
            })
        );

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeInstanceOf(HTMLDivElement);

        expect(div.textContent).toEqual('');

        addChild$.next(['a', 'foo']);

        expect(div.textContent).toEqual('foo');
        const childA = div.firstChild as HTMLParagraphElement;
        expect(childA.textContent).toEqual('foo');

        addChild$.next(['b', 'bar']);

        expect(div.textContent).toEqual('foobar');
        const childB = childA.nextSibling as HTMLParagraphElement;
        expect(childB.textContent).toEqual('bar');

        addChild$.next(['a', 'baz']);

        expect(div.textContent).toEqual('bazbar');
        const childAVersion2 = div.firstChild as HTMLParagraphElement;
        expect(childAVersion2.textContent).toEqual('baz');

        expect(childAVersion2.nextSibling).toEqual(childB);

        addChild$.next(['b', null]);
        expect(div.textContent).toEqual('baz');

        addChild$.next(['a', null]);
        expect(div.textContent).toEqual('');

        unmount();

        expect(container.firstChild).toBeFalsy();
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

describe('Boolean Operator', () => {
    const SwitchComponent: Component<{
        bool$: Observable<boolean>;
    }> = ({ bool$ }) => {
        return createElement(
            'div',
            {},
            bool$.pipe(
                map((value) => [
                    'default',
                    value
                        ? createElement('p', {
                            textContent: new BehaviorSubject('true'),
                        })
                        : createElement('p', {
                            textContent: new BehaviorSubject('false'),
                        }),
                ])
            )
        );
    };

    const CountListenerComponent: Component<{ count$: Observable<number> }> = ({
        count$,
    }) => {
        return createElement('p', {
            textContent: count$,
        });
    };

    const ComplexSwitchComponent: Component<{
        bool$: Observable<boolean>;
        count$: Observable<number>;
    }> = ({ bool$, count$ }) => {
        return createElement(
            'div',
            {},
            bool$.pipe(
                distinctUntilChanged(),
                map((value) => [
                    'default',
                    value
                        ? createElement(CountListenerComponent, { count$ })
                        : createElement(CountListenerComponent, {
                            count$: count$.pipe(map((count) => count * 2)),
                        }),
                ])
            )
        );
    };

    it('should not mount a node on initialization', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeTruthy();
        expect(div.firstChild).toBeFalsy();

        bool$.next(true);

        const truthyText = div.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should switch to the falsy value when the bool is updated', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeTruthy();
        expect(div.firstChild).toBeFalsy();

        bool$.next(true);

        const truthyText = div.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        expect(div.childNodes.length).toEqual(1);

        bool$.next(false);

        const falsyText = div.firstChild as HTMLParagraphElement;
        expect(falsyText).toBeInstanceOf(HTMLParagraphElement);
        expect(falsyText.textContent).toEqual('false');

        expect(div.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should switch between truthy and falsy values', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeTruthy();
        expect(div.firstChild).toBeFalsy();

        bool$.next(true);

        const truthyText = div.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        expect(div.childNodes.length).toEqual(1);

        bool$.next(false);

        const falsyText = div.firstChild as HTMLParagraphElement;
        expect(falsyText).toBeInstanceOf(HTMLParagraphElement);
        expect(falsyText.textContent).toEqual('false');

        expect(div.childNodes.length).toEqual(1);

        bool$.next(true);

        const truthyText2 = div.firstChild as HTMLParagraphElement;
        expect(truthyText2).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText2.textContent).toEqual('true');

        expect(div.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should not re-create the child if the boolean does not change', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeTruthy();
        expect(div.firstChild).toBeFalsy();

        bool$.next(true);

        const truthyText = div.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        bool$.next(true);

        expect(div.firstChild).toEqual(truthyText);

        bool$.next(false);

        expect(div.firstChild).not.toEqual(truthyText);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should render components with children', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();
        const count$ = new BehaviorSubject(0);

        render(createElement(ComplexSwitchComponent, { bool$, count$ }));

        const div = container.firstChild as HTMLDivElement;
        expect(div).toBeInstanceOf(HTMLDivElement);

        bool$.next(true);

        const singleCount = div.firstChild as HTMLParagraphElement;
        expect(singleCount.textContent).toEqual('0');

        count$.next(1);

        expect(singleCount.textContent).toEqual('1');

        expect(container.childNodes.length).toEqual(1);

        bool$.next(false);

        const doubleCount = div.firstChild as HTMLParagraphElement;
        expect(doubleCount.textContent).toEqual('2');

        count$.next(2);

        expect(doubleCount.textContent).toEqual('4');

        expect(container.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });
});
