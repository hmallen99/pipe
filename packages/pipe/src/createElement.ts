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
    const cleanup$ = new Subject<void>();
    const element =
        typeof component === 'string'
            ? initializeDomElement(component, props, cleanup$)
            : initializePipeElement(component, props, cleanup$);

    cleanup$.subscribe({
        complete: () => {
            element.remove();
        },
    });

    if (children) {
        for (const { element: child, cleanup$: childCleanup$ } of children) {
            element.appendChild(child);
            cleanup$.subscribe(childCleanup$);
        }
    }

    return { element, cleanup$ };
}

function initializeDomElement<
    Props extends Record<string, Observable<unknown>>,
>(component: string, props: Props, cleanup$: Observable<void>): HTMLElement {
    const element = document.createElement(component);
    for (const [key, obs$] of Object.entries(props)) {
        obs$.pipe(takeUntil(cleanup$)).subscribe((value) => {
            element[key] = value;
        });
    }

    return element;
}

function initializePipeElement<
    Props extends Record<string, Observable<unknown>>,
>(
    component: Component<Props>,
    props: Props,
    cleanup$: Observable<void>
): HTMLElement {
    const { element, cleanup$: childCleanup$ } = component(props, cleanup$);
    cleanup$.subscribe({
        complete: () => {
            childCleanup$.next();
            childCleanup$.complete();
        },
    });

    return element;
}
