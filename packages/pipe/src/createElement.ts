import { Observable, Subject, takeUntil } from 'rxjs';
import { Context, initializeContext } from './Context';

export type Component<Props extends Record<string, Observable<unknown> | unknown>> = (
    props: Props,
    cleanup$: Observable<void>,
    context: Context,
) => PipeNode;

export type PipeNode<T extends HTMLElement = HTMLElement> = {
    element: T;
    cleanup$: Subject<void>;
    contextValues$: Subject<[string, unknown]>;
};

type HTMLElementProps<Tag extends keyof HTMLElementTagNameMap> = {
    [Property in keyof HTMLElementTagNameMap[Tag]]?:
        | Observable<HTMLElementTagNameMap[Tag][Property]>
        | HTMLElementTagNameMap[Tag][Property];
};

export function createElement<
    C extends Component<Props> | keyof HTMLElementTagNameMap,
    Props extends C extends keyof HTMLElementTagNameMap
        ? HTMLElementProps<C>
        : Record<string, Observable<unknown> | unknown>,
>(
    component: C,
    props: Props,
    children?: PipeNode[] | Observable<[string, PipeNode | null]>,
): PipeNode {
    const cleanup$ = new Subject<void>();
    const { context, contextValues$ } = initializeContext(cleanup$);

    const element =
        typeof component === 'string'
            ? initializeDomElement(component, props, cleanup$)
            : initializePipeElement(component, props, cleanup$, context, contextValues$);

    cleanup$.subscribe({
        complete: () => {
            element.remove();
        },
    });

    const node = { element, cleanup$, contextValues$ };

    if (Array.isArray(children)) {
        for (const {
            element: child,
            cleanup$: childCleanup$,
            contextValues$: childContextValues$,
        } of children) {
            element.appendChild(child);
            cleanup$.subscribe(childCleanup$);
            contextValues$.subscribe(childContextValues$);
        }
    } else if (children) {
        mergeChildNodes(children, node);
    }

    return node;
}

const mergeChildNodes = (source: Observable<[string, PipeNode | null]>, parentNode: PipeNode) => {
    const nodes = new Map<string, PipeNode>();

    source.pipe(takeUntil(parentNode.cleanup$)).subscribe({
        next: ([key, nextNode]) => {
            const existingNode = nodes.get(key);
            const nextSibling = existingNode?.element.nextSibling;
            existingNode?.cleanup$.next();
            existingNode?.cleanup$.complete();
            parentNode.contextValues$.subscribe(nextNode.contextValues$);

            if (!nextNode) {
                nodes.delete(key);
                return;
            }
            nodes.set(key, nextNode);
            parentNode.cleanup$.subscribe(nextNode.cleanup$);

            if (nextSibling) {
                parentNode.element.insertBefore(nextNode.element, nextSibling);
                return;
            }

            parentNode.element.appendChild(nextNode.element);
            return;
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
    ElementType extends keyof HTMLElementTagNameMap,
    Element extends HTMLElementTagNameMap[ElementType],
>(
    component: ElementType,
    props: {
        [Property in keyof Element]?: Observable<Element[Property]> | Element[Property];
    },
    cleanup$: Observable<void>,
): Element {
    const element = document.createElement(component) as Element;
    for (const key of Object.keys(props) as (keyof Element)[]) {
        if (props[key] instanceof Observable) {
            props[key].pipe(takeUntil(cleanup$)).subscribe((value) => {
                element[key] = value;
            });
        } else {
            element[key] = props[key] as Element[typeof key];
        }
    }

    return element;
}

function initializePipeElement<Props extends Record<string, Observable<unknown> | unknown>>(
    component: Component<Props>,
    props: Props,
    cleanup$: Observable<void>,
    context: Context,
    contextValues$: Subject<[string, unknown]>,
): HTMLElement {
    const {
        element,
        cleanup$: childCleanup$,
        contextValues$: childContextValues$,
    } = component(props, cleanup$, context);
    cleanup$.subscribe(childCleanup$);
    contextValues$.subscribe(childContextValues$);

    return element;
}
