import { BehaviorSubject, map, Observable, scan, Subject, tap } from 'rxjs';
import { Component, createElement, PipeNode } from './createElement';
import { createRoot } from './createRoot';

describe('Context', () => {
    const CounterContext: Component<{ children: PipeNode[] | Observable<[string, PipeNode]> }> = (
        props,
        _,
        context,
    ) => {
        const click$ = new Subject<void>();
        const textContent = click$.pipe(
            scan((x) => x + 1, 0),
            map((x) => String(x)),
            tap((x) => {
                context.set('counter', x);
            }),
        );

        return createElement(
            'div',
            {
                onclick: () => {
                    click$.next();
                },
                textContent,
            },
            props.children,
        );
    };

    it('should not pass context up', () => {
        const TextOutput: Component<Record<string, Observable<void>>> = (
            _props,
            _cleanup,
            context,
        ) => {
            return createElement('div', {
                onclick: () => {
                    context.set('counter', 4);
                },
                textContent: context.get('counter'),
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        render(createElement(CounterContext, { children: [createElement(TextOutput, {})] }));

        const button = container.firstChild as HTMLDivElement;
        expect(button).toBeInstanceOf(HTMLDivElement);
        const paragraph = button.firstChild as HTMLDivElement;
        expect(paragraph).toBeInstanceOf(HTMLDivElement);

        button.click();

        expect(button.textContent).toEqual('1');
        expect(paragraph.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        expect(paragraph.textContent).toEqual('2');

        paragraph.click();
        expect(button.textContent).toEqual('2');
        expect(paragraph.textContent).toEqual('4');

        button.click();
        expect(button.textContent).toEqual('3');
        expect(paragraph.textContent).toEqual('3');
        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should pass context to a child', () => {
        const TextOutput: Component<Record<string, Observable<void>>> = (
            _props,
            _cleanup,
            context,
        ) => {
            return createElement('div', {
                textContent: context.get('counter'),
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        render(createElement(CounterContext, { children: [createElement(TextOutput, {})] }));

        const button = container.firstChild as HTMLDivElement;
        expect(button).toBeInstanceOf(HTMLDivElement);
        const paragraph = button.firstChild as HTMLDivElement;
        expect(paragraph).toBeInstanceOf(HTMLDivElement);

        button.click();

        expect(button.textContent).toEqual('1');
        expect(paragraph.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        expect(paragraph.textContent).toEqual('2');
        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should pass context to a descendant', () => {
        const IntermediateComponent: Component<Record<string, Observable<void>>> = () => {
            return createElement(TextOutput, {});
        };

        const TextOutput: Component<Record<string, Observable<void>>> = (
            _props,
            _cleanup,
            context,
        ) => {
            return createElement('div', {
                textContent: context.get('counter'),
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        render(
            createElement(CounterContext, { children: [createElement(IntermediateComponent, {})] }),
        );

        const button = container.firstChild as HTMLDivElement;
        expect(button).toBeInstanceOf(HTMLDivElement);
        const paragraph = button.firstChild as HTMLDivElement;
        expect(paragraph).toBeInstanceOf(HTMLDivElement);

        button.click();

        expect(button.textContent).toEqual('1');
        expect(paragraph.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        expect(paragraph.textContent).toEqual('2');
        unmount();

        expect(container.firstChild).toBeFalsy();
    });

    it('should pass context to an observable descendant', () => {
        const IntermediateComponent: Component<Record<string, Observable<void>>> = () => {
            return createElement(TextOutput, {});
        };

        const TextOutput: Component<Record<string, Observable<void>>> = (
            _props,
            _cleanup,
            context,
        ) => {
            return createElement('div', {
                textContent: context.get('counter'),
            });
        };
        const container = document.createElement('div');

        const { render, unmount } = createRoot(container);

        const children = new BehaviorSubject(['x', createElement(IntermediateComponent, {})] as [
            string,
            PipeNode,
        ]);

        render(
            createElement(CounterContext, {
                children,
            }),
        );

        const button = container.firstChild as HTMLDivElement;
        expect(button).toBeInstanceOf(HTMLDivElement);
        const paragraph = button.firstChild as HTMLDivElement;
        expect(paragraph).toBeInstanceOf(HTMLDivElement);

        button.click();

        expect(button.textContent).toEqual('1');
        expect(paragraph.textContent).toEqual('1');

        button.click();

        expect(button.textContent).toEqual('2');
        expect(paragraph.textContent).toEqual('2');

        children.next(['x', createElement(IntermediateComponent, {})]);

        const paragraph2 = button.firstChild.nextSibling as HTMLDivElement;
        expect(paragraph2).toBeInstanceOf(HTMLDivElement);
        expect(paragraph2.textContent).toEqual('2');

        button.click();
        expect(button.textContent).toEqual('3');
        expect(paragraph2.textContent).toEqual('3');

        unmount();

        expect(container.firstChild).toBeFalsy();
    });
});
