import { AsyncLocalStorage } from "node:async_hooks";
const dreamChildStorage = new AsyncLocalStorage();
export function withDreamChildBinding(binding, action) {
    return dreamChildStorage.run(binding, action);
}
export function currentDreamChildBinding() {
    return dreamChildStorage.getStore();
}
//# sourceMappingURL=dream-scope.js.map