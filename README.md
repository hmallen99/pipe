# Pipe

Pipe is an observable-driven JavaScript library for creating User Interfaces (UI).

-   Composable and Declarative Components: Pipe components can be easily chained together without the need to manage complex setup and teardown state. Components can be reused across the codebase, exposing a strongly-typed interface of observable props.
-   Built on RxJS: Pipe uses RxJS under the hood to manage UI views. RxJS observables are passed as props between components, allowing complex application logic to be composed and shared throughtout the app. All RxJS operators and observables can be used in Pipe, and any libraries that are built on top of RxJS can be used with pipe.
-   Reactive Principles: Pipe should feel similar to other reactive UI libraries, and concepts like memoization, side effects, and state management should transfer over. Pipe is inspired by libraries like React, Solid, and Cycle.js.
-   No virtual DOM: Pipe directly modifies the DOM on initialization, update, and teardown, rather than reconstructing the DOM in memory and committing changes in batches (as implemented in React). This is a tradeoff, not a pure performance gain. Batched commits can allow an app to scale better, since work can be spread out across multiple frames, generating a smoother experience for the user. Work can still be batched with custom RxJS observables, but this behavior is not implemented by default. Thus, Pipe is well-suited for small blogs and websites, but less suited for applications with lots of state that updates frequently.

## Further Reading

[Pipe library documentation](./packages/pipe/README.md)
[Example app](./apps/todo-app/README.md)
