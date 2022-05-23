import { addEvent, escapeForHTML, getURLHash } from "./helpers.js";
import { TodoStore } from "./store.js";

const Todos = new TodoStore("todo-vanillajs-2022");

const DAYS_OF_THE_WEEK = {
    1: 'Sunday',
    2: 'Monday',
    3: 'Tuesday',
    4: 'Wednesday',
    5: 'Thursday',
    6: 'Friday',
    7: 'Saturday',
}

const App = {
  $: {
    input: document.querySelector(".new-todo"),
    list: document.querySelector(".todo-list"),
    count: document.querySelector(".todo-count strong"),
    footer: document.querySelector(".footer"),
    toggleAll: document.querySelector(".toggle-all"),
    main: document.querySelector(".main"),
    clear: document.querySelector(".clear-completed"),
    filters: document.querySelector(".filters")
  },
  filter: getURLHash(),
  init() {
    Todos.addEventListener("save", App.render);
    window.addEventListener("hashchange", () => {
      App.filter = getURLHash();
      App.render();
    });
    App.$.input.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        App.addTodo(e.target.value);
        App.$.input.value = "";
      }
    });
    App.$.toggleAll.addEventListener("click", (e) => {
      Todos.toggleAll();
    });
    App.$.clear.addEventListener("click", (e) => {
      Todos.clearCompleted();
    });
    App.render();
  },
  addTodo(title) {
    Todos.add(title);
  },
  removeTodo(todo) {
    Todos.remove(todo);
  },
  toggleTodo(todo) {
    Todos.toggle(todo);
  },
  editingTodo(todo, li) {
    li.classList.add("editing");
    li.querySelector(".edit").focus();
  },
  updateTodo(todo, li) {
    Todos.update(todo);
    li.querySelector(".edit").value = todo.title;
  },
  createTodoItem(todo) {
    const li = document.createElement("li");
    if (todo.completed) {
      li.classList.add("completed");
    }

    li.innerHTML = `
			<div class="view">
                <span class="day-of-week">${DAYS_OF_THE_WEEK[todo.dayOfWeek]?.substr(0,3).toUpperCase() ?? 'Next Week'}</span>
				<input class="toggle" type="checkbox" ${todo.completed ? "checked" : ""}>
				<label>${escapeForHTML(todo.title)}</label>
				<button class="destroy">X</button>
			</div>
			<input class="edit" value="${escapeForHTML(todo.title)}">
		`;

    addEvent(li, ".destroy", "click", () => App.removeTodo(todo, li));
    addEvent(li, ".toggle", "click", () => App.toggleTodo(todo, li));
    addEvent(li, "label", "dblclick", () => App.editingTodo(todo, li));
    addEvent(li, ".edit", "keyup", (e) => {
      if (e.key === "Enter")
        App.updateTodo({ ...todo, title: e.target.value }, li);
    });
    addEvent(li, ".edit", "blur", (e) =>
      App.updateTodo({ ...todo, title: e.target.value }, li)
    );

    return li;
  },
  render() {
    const todosCount = Todos.all().length;
    App.$.filters
      .querySelectorAll("a")
      .forEach((el) => el.classList.remove("selected"));
    App.$.filters
      .querySelector(`[href="#/${App.filter}"]`)
      .classList.add("selected");
    App.$.list.innerHTML = "";
    Todos.all(App.filter).forEach((todo, index) => {
        if (index === 7) {
            const li = document.createElement('li')
            li.innerHTML = '<hr />'
            App.$.list.appendChild(li);
        }
      App.$.list.appendChild(App.createTodoItem(todo));
    });
    App.$.footer.style.display = todosCount ? "block" : "none";
    App.$.main.style.display = todosCount ? "block" : "none";
    App.$.clear.style.display = Todos.hasCompleted() ? "block" : "none";
    App.$.toggleAll.checked = todosCount && Todos.isAllCompleted();
    App.$.count.innerHTML = Todos.all("active").length;
  }
};

App.init();
