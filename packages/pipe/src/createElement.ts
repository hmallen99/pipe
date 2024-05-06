import { Observable, Subject, takeUntil } from 'rxjs';

export type Component<Props extends Record<string, Observable<unknown>>> = (
    props: Props,
    cleanup$: Observable<void>
) => PipeNode;

export type PipeNode<T extends HTMLElement = HTMLElement> = {
    element: T;
    cleanup$: Subject<void>;
};

export function createElement<
    Props extends Record<string, Observable<unknown>>,
>(
    component: Component<Props> | string,
    props: Props,
    children?: PipeNode[]
): PipeNode {
    const outCleanup$ = new Subject<void>();

    let outElement: HTMLElement;

    if (typeof component === 'string') {
        outElement = document.createElement(component);
        for (const [key, obs$] of Object.entries(props)) {
            obs$.pipe(takeUntil(outCleanup$)).subscribe((value) => {
                outElement[key] = value;
            });
        }
    } else {
        const { element, cleanup$ } = component(props, outCleanup$);
        outElement = element;
        outCleanup$.subscribe({
            complete: () => {
                cleanup$.next();
                cleanup$.complete();
            },
        });
    }

    if (children) {
        for (const { element: child, cleanup$: childCleanup$ } of children) {
            outElement.appendChild(child);
            outCleanup$.subscribe({
                complete: () => {
                    childCleanup$.next();
                    childCleanup$.complete();
                },
            });
        }
    }

    outCleanup$.subscribe({
        complete: () => {
            outElement.remove();
        },
    });

    return { element: outElement, cleanup$: outCleanup$ };
}
