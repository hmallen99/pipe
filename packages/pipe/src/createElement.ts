import { Observable, Subject, takeUntil } from 'rxjs';

export type Component<Props extends Record<string, Observable<unknown>>> = (
    props: Props,
    cleanup$: Observable<void>,
) => PipeNode;

export type PipeNode<T extends HTMLElement = HTMLElement> = {
    element: T;
    cleanup$: Subject<void>;
};

type HTMLElementProps<Tag extends keyof HTMLElementTagNameMap> = {
    [Property in keyof HTMLElementTagNameMap[Tag]]?: Observable<
        HTMLElementTagNameMap[Tag][Property]
    >;
};

export function createElement<
    C extends Component<Props> | keyof HTMLElementTagNameMap,
    Props extends C extends keyof HTMLElementTagNameMap
        ? HTMLElementProps<C>
        : Record<string, Observable<unknown>>,
>(
    component: C,
    props: Props,
    children?: PipeNode[] | Observable<[string, PipeNode | null]>,
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

const mergeChildNodes = (source: Observable<[string, PipeNode | null]>, parentNode: PipeNode) => {
    const nodes = new Map<string, PipeNode>();

    source.pipe(takeUntil(parentNode.cleanup$)).subscribe({
        next: ([key, nextNode]) => {
            const existingNode = nodes.get(key);
            const nextSibling = existingNode?.element.nextSibling;
            existingNode?.cleanup$.next();
            existingNode?.cleanup$.complete();

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
        [Property in keyof Element]?: Observable<Element[Property]>;
    },
    cleanup$: Observable<void>,
): Element {
    const element = document.createElement(component) as Element;
    for (const key of Object.keys(props) as (keyof Element)[]) {
        props[key].pipe(takeUntil(cleanup$)).subscribe((value) => {
            element[key] = value;
        });
    }

    return element;
}

function initializePipeElement<Props extends Record<string, Observable<unknown>>>(
    component: Component<Props>,
    props: Props,
    cleanup$: Observable<void>,
): HTMLElement {
    const { element, cleanup$: childCleanup$ } = component(props, cleanup$);
    cleanup$.subscribe(childCleanup$);

    return element;
}
