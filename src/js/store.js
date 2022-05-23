export const TodoStore = class extends EventTarget {
    constructor(localStorageKey) {
      super();
      this.localStorageKey = localStorageKey;
      this.todos = JSON.parse(
        window.localStorage.getItem(localStorageKey) || "[]"
      );
    }
    _save() {
      window.localStorage.setItem(
        this.localStorageKey,
        JSON.stringify(this.todos)
      );
      this.dispatchEvent(new CustomEvent("save"));
    }
    // GETTER methods
    all(viewFilter) {
      if (viewFilter === "active") {
        return this.todos.filter((todo) => !todo.completed);
      }
      if (viewFilter === "completed") {
        return this.todos.filter((todo) => todo.completed);
      }
      return this.todos;
    }
    hasCompleted() {
      return this.todos.some((todo) => todo.completed);
    }
    isAllCompleted() {
      return this.todos.every((todo) => todo.completed);
    }
    // MUTATE methods
    add(title) {
        console.log(title)
      this.todos.push({
        title: title,
        completed: false,
        id: "id_" + Date.now(),
        dayOfWeek: this.todos.length + 1,
      });
      this._save();
    }
    remove({ id }) {
      this.todos = this.todos.filter((todo) => todo.id !== id);
      this._save();
    }
    toggle({ id }) {
      this.todos = this.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      this._save();
    }
    clearCompleted() {
      this.todos = this.todos.filter((todo) => !todo.completed);
      this._save();
    }
    update(todo) {
      this.todos = this.todos.map((t) => (t.id === todo.id ? todo : t));
      this._save();
    }
    toggleAll() {
      const completed = !this.hasCompleted() || !this.isAllCompleted();
      this.todos = this.todos.map((todo) => ({ ...todo, completed }));
      this._save();
    }
    get dayOfWeekDescription() {

    }
  };
  