import { BehaviorSubject, Observable, Subject, count, map } from 'rxjs';
import { Component, createElement } from '../createElement';
import { Ternary } from './ternary';
import { createRoot } from '../createRoot';

const SwitchComponent: Component<{
    bool$: Observable<boolean>;
}> = ({ bool$ }) => {
    return Ternary(
        bool$,
        () =>
            createElement('p', {
                textContent: new BehaviorSubject('true'),
            }),
        () =>
            createElement('p', {
                textContent: new BehaviorSubject('false'),
            })
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
    return Ternary(
        bool$,
        () =>
            createElement('div', {}, [
                createElement(CountListenerComponent, { count$ }),
            ]),
        () =>
            createElement('div', {}, [
                createElement(CountListenerComponent, {
                    count$: count$.pipe(map((count) => count * 2)),
                }),
            ])
    );
};

const TernaryChildComponent: Component<{
    bool$: Observable<boolean>;
}> = ({ bool$ }) => {
    return createElement('div', {}, [
        createElement(SwitchComponent, { bool$ }),
    ]);
};

describe('Ternary', () => {
    it('should mount the truthy node on initialization', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const truthyText = container.firstChild as HTMLParagraphElement;
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

        const truthyText = container.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        expect(container.childNodes.length).toEqual(1);

        bool$.next(false);

        const falsyText = container.firstChild as HTMLParagraphElement;
        expect(falsyText).toBeInstanceOf(HTMLParagraphElement);
        expect(falsyText.textContent).toEqual('false');

        expect(container.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should switch between truthy and falsy values', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const truthyText = container.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        expect(container.childNodes.length).toEqual(1);

        bool$.next(false);

        const falsyText = container.firstChild as HTMLParagraphElement;
        expect(falsyText).toBeInstanceOf(HTMLParagraphElement);
        expect(falsyText.textContent).toEqual('false');

        expect(container.childNodes.length).toEqual(1);

        bool$.next(true);

        const truthyText2 = container.firstChild as HTMLParagraphElement;
        expect(truthyText2).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText2.textContent).toEqual('true');

        expect(container.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should not re-create the child if the boolean does not change', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(SwitchComponent, { bool$ }));

        const truthyText = container.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        bool$.next(true);

        expect(container.firstChild).toEqual(truthyText);

        bool$.next(false);

        expect(container.firstChild).not.toEqual(truthyText);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should render components with children', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();
        const count$ = new BehaviorSubject(0);

        render(createElement(ComplexSwitchComponent, { bool$, count$ }));

        const truthyDiv = container.firstChild as HTMLDivElement;
        expect(truthyDiv).toBeInstanceOf(HTMLDivElement);

        const singleCount = truthyDiv.firstChild as HTMLParagraphElement;
        expect(singleCount.textContent).toEqual('0');

        count$.next(1);

        expect(singleCount.textContent).toEqual('1');

        expect(container.childNodes.length).toEqual(1);

        bool$.next(false);

        const falsyDiv = container.firstChild as HTMLDivElement;
        expect(falsyDiv).toBeInstanceOf(HTMLDivElement);

        const doubleCount = falsyDiv.firstChild as HTMLParagraphElement;
        expect(doubleCount.textContent).toEqual('2');

        count$.next(2);

        expect(doubleCount.textContent).toEqual('4');

        expect(container.childNodes.length).toEqual(1);

        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should render a Ternary as a child', () => {
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const bool$ = new Subject<boolean>();

        render(createElement(TernaryChildComponent, { bool$ }));

        const div = container.firstChild as HTMLDivElement;
        const truthyText = div.firstChild as HTMLParagraphElement;
        expect(truthyText).toBeInstanceOf(HTMLParagraphElement);
        expect(truthyText.textContent).toEqual('true');

        bool$.next(false);

        const falsyText = div.firstChild as HTMLParagraphElement;
        expect(falsyText).toBeInstanceOf(HTMLParagraphElement);
        expect(falsyText.textContent).toEqual('false');

        unmount();

        expect(container.firstChild).toBeFalsy();
    });
});
