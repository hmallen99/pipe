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
    children?: PipeNode[] | Observable<[string, PipeNode | null]>
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

    const node = { element, cleanup$ };

    if (Array.isArray(children)) {
        for (const { element: child, cleanup$: childCleanup$ } of children) {
            element.appendChild(child);
            cleanup$.subscribe(childCleanup$);
        }
    } else if (children) {
        mergeChildNodes(children, node);
    }

    return node;
}

const mergeChildNodes = (
    source: Observable<[string, PipeNode | null]>,
    parentNode: PipeNode
) => {
    const nodes = new Map<string, PipeNode>();

    source.pipe(takeUntil(parentNode.cleanup$)).subscribe({
        next: ([key, nextNode]) => {
            const existingNode = nodes.get(key);

            if (existingNode) {
                existingNode.cleanup$.next();
                existingNode.cleanup$.complete();
            }

            if (nextNode) {
                parentNode.cleanup$.subscribe(nextNode.cleanup$);
                parentNode.element.appendChild(nextNode.element);
                nodes.set(key, nextNode);
            } else {
                nodes.delete(key);
            }
        },
        complete: () => {
            for (const node of nodes.values()) {
                node.cleanup$.next();
                node.cleanup$.complete();
            }
        },
    });
};

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
