import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Component, createElement } from '../createElement';
import { Ternary } from './ternary';
import { createRoot } from '../createRoot';

describe('Ternary', () => {
    it('should mount the truthy node on initialization', () => {
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
                    createElement('div', {
                        textContent: new BehaviorSubject('false'),
                    })
            );
        };

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
                    createElement('div', {
                        textContent: new BehaviorSubject('false'),
                    })
            );
        };

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
});
