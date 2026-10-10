/**
 * lazyModules — a module store loads the first time something reads it.
 *
 * The app used to fill every store at boot: eleven module pulls plus the ERP
 * collections went out together, and the first screen could not paint until
 * that burst cleared. Nothing forced that — a store is only interesting to the
 * screen that reads it, so hydration now hangs off the read instead of off the
 * boot sequence.
 *
 * A store registered here hands back a hook that behaves exactly like the
 * zustand one it wraps (`.getState()`, `.setState()`, `.subscribe()` included);
 * the only addition is that calling it as a hook asks this registry to fill the
 * store once. The request is deduplicated, deferred out of the render pass, and
 * remembered, so a page with twenty components reading the same store still
 * produces one pull.
 */
import { getStoredToken } from '../utils/authUtils';
import { useAppStore } from '../stores/appStore';
import { canOpenPath, canUse } from '../utils/navAccess';

/**
 * Whether the signed-in user holds `permission` (a code, or an any-of list).
 * A store's `hydrate` asks this before reading a collection the server would
 * only answer with 403 — a self-service employee has no business pulling the
 * staff directory just because their own leave screen shares its store.
 */
export function sessionCan(permission) {
  return canUse(permission, useAppStore.getState().permissions || []);
}

/** How long a failed hydration is left alone before a read may retry it. */
const RETRY_AFTER_MS = 15000;

function isCustomerSession() {
  const user = useAppStore.getState().currentUser;
  return Boolean(
    user?.isCustomer ||
    user?.role?.code === 'CU' ||
    String(user?.role?.name || user?.role || '').toLowerCase() === 'customer'
  );
}

/**
 * name → { hydrate, loaded, promise, failedAt }
 *
 * `appStore` and this file import each other, and a store registers itself
 * (`lazyStore*` → `entry`) while it is being evaluated -- which, depending on
 * which file the app happens to load first, can be before this file's body has
 * run. A `const` would still be uninitialised then ("Cannot access 'modules'
 * before initialization"); a hoisted function is not.
 */
function registry() {
  if (!registry.map) registry.map = new Map();
  return registry.map;
}

function entry(name) {
  let found = registry().get(name);
  if (!found) {
    found = { hydrate: null, loaded: false, promise: null, failedAt: 0 };
    registry().set(name, found);
  }
  return found;
}

/** Run after the current render pass: a store write during render is not safe. */
function defer(fn) {
  if (typeof queueMicrotask === 'function') queueMicrotask(fn);
  else setTimeout(fn, 0);
}

/**
 * Fill `name` unless it is already filled, already loading, or failed moments
 * ago. Returns nothing: callers are renders, and the data arrives as a store
 * update.
 */
export function ensureModule(name) {
  if (!name) return;
  // No session → no server. `useModuleHydration` empties the stores on sign-out;
  // hydrating here would only bounce state on every render of the login screen.
  if (!getStoredToken()) return;
  // Customer role has portal access only — do not hydrate internal ERP/CRM/PMS modules
  if (isCustomerSession()) return;

  const permissions = useAppStore.getState().permissions || [];
  // Employees without PMS access still load the projects they are assigned to.
  if (name === 'pms' && !canOpenPath('/pms', permissions) && !canOpenPath('/pms/my-tasks', permissions)) return;
  if (name === 'crm' && !canOpenPath('/crm', permissions) && !canOpenPath('/crm/tasks', permissions)) return;

  const mod = entry(name);
  if (!mod.hydrate || mod.loaded || mod.promise) return;
  if (mod.failedAt && Date.now() - mod.failedAt < RETRY_AFTER_MS) return;

  mod.promise = Promise.resolve()
    .then(() => mod.hydrate())
    .then(() => {
      mod.loaded = true;
      mod.failedAt = 0;
    })
    .catch((err) => {
      mod.failedAt = Date.now();
      console.warn(`[lazyModules] ${name} failed to load:`, err?.message || err);
    })
    .finally(() => {
      mod.promise = null;
    });
}

/** True once a read has already asked for this module — the probe can stop. */
export function isModuleRequested(name) {
  const mod = registry().get(name);
  return Boolean(mod && (mod.loaded || mod.promise || mod.failedAt));
}

/**
 * Forget what has been loaded. Called when the session changes: the next read
 * of a store pulls it again, for whoever is signed in now.
 */
export function resetLazyModules() {
  registry().forEach((mod) => {
    mod.loaded = false;
    mod.promise = null;
    mod.failedAt = 0;
  });
}

/**
 * Re-pull the modules this session has actually used. Signing in from another
 * tab has to reach the screens that are already mounted — they will not read
 * their store again on their own.
 */
export function refreshRequestedModules(names) {
  names.forEach((name) => {
    const mod = registry().get(name);
    if (!mod?.hydrate) return;
    mod.loaded = false;
    mod.promise = null;
    mod.failedAt = 0;
    ensureModule(name);
  });
}

/** The modules that have been read so far, for a session-change refresh. */
export function requestedModuleNames() {
  return [...registry().keys()].filter((name) => isModuleRequested(name));
}

/**
 * Wrap a store so that using it as a hook hydrates it once.
 *
 * `hydrate` defaults to the store's own `hydrate()` action, which every module
 * store already has and which is where the "is there anything to do?" check
 * lives.
 */
export function lazyStore(store, name, hydrate) {
  entry(name).hydrate = hydrate || (() => store.getState().hydrate?.());

  const hook = (...args) => {
    if (!isModuleRequested(name)) defer(() => ensureModule(name));
    return store(...args);
  };
  // `.getState()` / `.setState()` / `.subscribe()` keep working untouched:
  // reads outside React are not what a screen needs loaded.
  const wrapped = Object.assign(hook, store);
  // `.raw` subscribes without asking for the data — for shell furniture like a
  // nav badge, which shows the module's data when it is there but must not be
  // the reason a page loads it. Pair it with `useModuleWhenIdle`.
  wrapped.raw = store;
  return wrapped;
}

/**
 * Wrap a store that holds server data *and* plain UI state — `appStore`, whose
 * theme and sidebar width every screen reads but whose HRMS collections only
 * the HRMS screens do.
 *
 * The selector is run once against a recording proxy to see whether it touches
 * one of `keys`; only then is the module hydrated. That probe stops for good as
 * soon as it has said yes once, so the double call costs nothing after the
 * first HRMS screen opens. A selector-less `useAppStore()` hands the whole
 * state out, so it counts as a read of everything.
 */
export function lazyStoreForKeys(store, name, keys, hydrate) {
  entry(name).hydrate = hydrate || (() => store.getState().hydrate?.());
  const watched = new Set(keys);

  const hook = (selector, ...rest) => {
    if (!isModuleRequested(name) && touches(store, selector, watched)) {
      defer(() => ensureModule(name));
    }
    return store(selector, ...rest);
  };
  return Object.assign(hook, store);
}

function touches(store, selector, watched) {
  if (typeof selector !== 'function') return true;
  let hit = false;
  try {
    selector(new Proxy(store.getState(), {
      get(target, key) {
        if (watched.has(key)) hit = true;
        return target[key];
      },
    }));
  } catch {
    // A selector that cannot run against the proxy tells us nothing, so assume
    // it wanted the data rather than leaving a screen empty.
    return true;
  }
  return hit;
}
