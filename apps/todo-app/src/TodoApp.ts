import {
  BehaviorSubject,
  Component,
  createElement,
  map,
  merge,
  Observable,
  of,
  PipeNode,
  scan,
  Subject,
} from '@pipe/pipe';

export const TodoApp: Component<Record<string, Observable<void>>> = () => {
  const clickAdd$ = new Subject<string>();
  const clickRemove$ = new Subject<string>();

  const addChild$: Observable<[string, PipeNode]> = clickAdd$.pipe(
    scan(({ count }, todoText) => ({ count: count + 1, todoText }), {
      count: 0,
      todoText: '' as string,
    }),
    map(({ count, todoText }) => {
      const key = String(count);
      return [
        key,
        createElement(TodoItem, {
          onRemove: of(() => {
            clickRemove$.next(key);
          }),
          text: of(todoText),
        }),
      ];
    }),
  );

  const removeChild$: Observable<[string, null]> = clickRemove$.pipe(
    map((key) => [key, null]),
  );

  return createElement(
    'div',
    {
      id: of('content'),
    },
    [
      createElement('h2', { textContent: of('Todo List') }),
      createElement('div', {}, merge(addChild$, removeChild$)),
      createElement(
        'form',
        {
          id: of('add-todo-form'),
          onsubmit: of((e: Event) => {
            e.preventDefault();
            const formElement = e.target as HTMLFormElement;
            const formData = new FormData(formElement);
            const todoText = formData.get('todo');
            clickAdd$.next(todoText as string);
            const inputElement =
              formElement.firstElementChild as HTMLInputElement;
            inputElement.value = '';
          }),
        },
        [
          createElement('input', {
            type: of('text'),
            name: of('todo'),
            placeholder: of('Add Todo'),
          }),
        ],
      ),
    ],
  );
};

export const TodoItem: Component<{
  onRemove: Observable<() => void>;
  text: Observable<string>;
}> = ({ onRemove, text }) => {
  return createElement(
    'div',
    {
      id: of('todo-item'),
    },
    [
      createElement('div', { id: of('button-container') }, [
        createElement('button', {
          id: of('todo-button'),
          textContent: of(''),
          onclick: onRemove,
        }),
      ]),
      createElement('p', { textContent: text }),
    ],
  );
};
