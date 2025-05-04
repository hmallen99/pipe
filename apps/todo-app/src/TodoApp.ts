import {
  Component,
  createElement,
  map,
  merge,
  Observable,
  of,
  PipeNode,
  scan,
  Subject,
  takeUntil,
} from '@hmallen99/pipe';

export const TodoApp: Component<Record<string, Observable<void>>> = (
  _,
  cleanup$,
) => {
  const clickAdd$ = new Subject<string>();
  const clickRemove$ = new Subject<string>();

  const addChild$: Observable<[string, PipeNode]> = clickAdd$.pipe(
    takeUntil(cleanup$),
    scan(({ count }, todoText) => ({ count: count + 1, todoText }), {
      count: 0,
      todoText: '' as string,
    }),
    map(({ count, todoText }) => {
      const key = String(count);
      return [
        key,
        createElement(TodoItem, {
          onRemove: () => {
            clickRemove$.next(key);
          },
          text: todoText,
        }),
      ];
    }),
  );

  const removeChild$: Observable<[string, null]> = clickRemove$.pipe(
    takeUntil(cleanup$),
    map((key) => [key, null]),
  );

  return createElement(
    'div',
    {
      id: 'content',
    },
    [
      createElement('h2', { textContent: 'Todo List' }),
      createElement('div', {}, merge(addChild$, removeChild$)),
      createElement(
        'form',
        {
          id: 'add-todo-form',
          onsubmit: (e: Event) => {
            e.preventDefault();
            const formElement = e.target as HTMLFormElement;
            const formData = new FormData(formElement);
            const todoText = formData.get('todo');
            clickAdd$.next(todoText as string);
            const inputElement =
              formElement.firstElementChild as HTMLInputElement;
            inputElement.value = '';
          },
        },
        [
          createElement('input', {
            type: 'text',
            name: 'todo',
            placeholder: 'Add Todo',
          }),
        ],
      ),
    ],
  );
};

export const TodoItem: Component<{
  onRemove: () => void;
  text: string;
}> = ({ onRemove, text }) => {
  return createElement(
    'div',
    {
      id: 'todo-item',
    },
    [
      createElement('div', { id: of('button-container') }, [
        createElement('button', {
          id: 'todo-button',
          textContent: of(''),
          onclick: onRemove,
        }),
      ]),
      createElement('p', { textContent: text }),
    ],
  );
};
