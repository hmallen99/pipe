# pipe

A Reactive DOM UI Library built on RxJS and TypeScript.

## What is Pipe?

Pipe is a declarative UI library, similar to React.js or Solid.js. This library seeks to provide a lightweight scripting layer on top of HTML/CSS, allowing developers to create simple and interactive web sites. In its current form, the library does not provides only utilities for dynamically rendering HTML into a document. It is not opinionated about state management, single page vs. multi-page applications, or styling. In theory, the library could be used as a drop-in replacement for React, though it is unclear how well that would scale. However, it would also be possible to create many pipe `roots`, as there is minimal overhead for creating a root, and scheduling is delegated to RxJS.

Pipe is built around observables, specifically the `RxJS` implementation of observables. Observables are reactive and functional in nature, which makes them ideal for programming declarative UI interfaces. Observables are passed as props to DOM elements, which are initialized immediately when `createElement` is called. The DOM element subscribes to each observable prop, and updates immediately when a value is received. There is some overhead here from RxJS to schedule these state updates. This is slightly different from a library like React, which inserts element creation and state updates into an event queue, and constructs/updates a Virtual DOM from these updates before committing them to the actual DOM. The latter approach may scale better with more complex components, avoiding potential issues like screen tearing with batched updates. The former approach is likely faster for less complex components, though.

Each component function is only called once. This allows us to avoid the need to memoize state updates in most situations. The only exception is when an observable passes a large table of props that need to be parsed separately. In this case, the `distinctUntilKeyChanged` operator is quite useful.

## Installation

```
npm install --save @hmallen99/pipe
```

## Usage

Creating a root:

```ts
const rootElement = document.querySelector<HTMLDivElement>('#root');

const root = createRoot(rootElement);

root.render(createElement(App, {}));
```

Creating a component:

```ts
const Counter: Component<Record<string, Observable<void>>> = () => {
    const click$ = new Subject<void>();
    const onclick = of(() => {
        click$.next();
    });
    const textContent = click$.pipe(
        scan((x) => x + 1, 0),
        map((x) => String(x)),
    );

    return createElement('button', {
        onclick,
        textContent: concat(of('Click Me!'), textContent),
    });
};

const App: Component<Record<string, Observable<void>>> = () => {
    return createElement('div', {}, [createElement(Counter, {})]);
};
```

Child elements can be either static or dynamic. If a child component is never updated, it can be passed through a list of child elements, as shown above. If child components need to be removed or inserted, an observable can be passed instead of a static array. This allows for rendering lists of children or conditional children. A stable key must be passed with every child element in this configuration to allow for updating and removing the correct child element.

Conditional children:

```ts
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
            ]),
        ),
    );
};
```

List of children:

```ts
const TextList: Component<{
    addChild$: Observable<[string, string]>;
}> = ({ addChild$ }) => {
    return createElement(
        'div',
        {},
        addChild$.pipe(
            map(([key, value]) => [
                key,
                createElement('p', {
                    textContent: of(value),
                }),
            ]),
        ),
    );
};
```

RxJS observables are re-exported through the pipe library. To avoid importing multiple versions of RxJS, import RxJS observables and operators through `@hmallen99/pipe`

```ts
import { createElement, createRoot, Subject, of } from '@hmallen99/pipe';
```

For a more detailed exploration of usage, view the [example todo app](./apps/todo-app/src/TodoApp.ts).
