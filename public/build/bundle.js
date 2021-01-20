
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.31.2 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (202:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(202:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Router", slots, []);
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		scrollstateHistoryHandler,
    		createEventDispatcher,
    		afterUpdate,
    		regexparam,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		lastLoc,
    		componentObj
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    async function loadWeb3 () {
        // window.Web3 = Web3
        if (window.ethereum) {
            window.web3 = new window.Web3(window.ethereum);
            // await window.ethereum.enable()
        }
        else if (window.web3) {
            window.web3 = new window.Web3(window.web3.currentProvider);
        }
        else {
            window.alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
        return window.web3;
    }

    var contractName = "EvieCoin";
    var abi = [
    	{
    		inputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "constructor"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "owner",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "address",
    				name: "approved",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "Approval",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "owner",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "address",
    				name: "operator",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "bool",
    				name: "approved",
    				type: "bool"
    			}
    		],
    		name: "ApprovalForAll",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "user",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "uint256",
    				name: "timestamp",
    				type: "uint256"
    			}
    		],
    		name: "ClockInTimeEvent",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "user",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "uint256",
    				name: "timestamp",
    				type: "uint256"
    			},
    			{
    				indexed: false,
    				internalType: "bool",
    				name: "newPendingTok",
    				type: "bool"
    			}
    		],
    		name: "ClockOutTimeEvent",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "previousOwner",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "address",
    				name: "newOwner",
    				type: "address"
    			}
    		],
    		name: "OwnershipTransferred",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "_to",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "uint256",
    				name: "tokId",
    				type: "uint256"
    			}
    		],
    		name: "PayoutMadeEvent",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "_to",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "uint256",
    				name: "numbToks",
    				type: "uint256"
    			}
    		],
    		name: "PayoutMadeMultEvent",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: false,
    				internalType: "address",
    				name: "sup",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "address",
    				name: "student",
    				type: "address"
    			}
    		],
    		name: "StudentStatusChange",
    		type: "event"
    	},
    	{
    		anonymous: false,
    		inputs: [
    			{
    				indexed: true,
    				internalType: "address",
    				name: "from",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "address",
    				name: "to",
    				type: "address"
    			},
    			{
    				indexed: true,
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "Transfer",
    		type: "event"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "to",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "approve",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "owner",
    				type: "address"
    			}
    		],
    		name: "balanceOf",
    		outputs: [
    			{
    				internalType: "uint256",
    				name: "",
    				type: "uint256"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "baseURI",
    		outputs: [
    			{
    				internalType: "string",
    				name: "",
    				type: "string"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "clockEndTime",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    		],
    		name: "clockStartTime",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "",
    				type: "address"
    			}
    		],
    		name: "clock_in_times",
    		outputs: [
    			{
    				internalType: "uint256",
    				name: "",
    				type: "uint256"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "supervisor",
    				type: "address"
    			}
    		],
    		name: "createPotentialStudent",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "getApproved",
    		outputs: [
    			{
    				internalType: "address",
    				name: "",
    				type: "address"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "student",
    				type: "address"
    			}
    		],
    		name: "getPendingCollectibles",
    		outputs: [
    			{
    				internalType: "uint256[]",
    				name: "",
    				type: "uint256[]"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "getSupsPotentialStudents",
    		outputs: [
    			{
    				internalType: "address[]",
    				name: "",
    				type: "address[]"
    			},
    			{
    				internalType: "uint256[]",
    				name: "",
    				type: "uint256[]"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "getSupsStudents",
    		outputs: [
    			{
    				internalType: "address[]",
    				name: "",
    				type: "address[]"
    			},
    			{
    				internalType: "uint256[]",
    				name: "",
    				type: "uint256[]"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "owner",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "operator",
    				type: "address"
    			}
    		],
    		name: "isApprovedForAll",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "name",
    		outputs: [
    			{
    				internalType: "string",
    				name: "",
    				type: "string"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "owner",
    		outputs: [
    			{
    				internalType: "address",
    				name: "",
    				type: "address"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "ownerOf",
    		outputs: [
    			{
    				internalType: "address",
    				name: "",
    				type: "address"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "pendingStudentInd",
    				type: "uint256"
    			}
    		],
    		name: "potentialSupApproveStudent",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    		],
    		name: "renounceOwnership",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "from",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "to",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "safeTransferFrom",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "from",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "to",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			},
    			{
    				internalType: "bytes",
    				name: "_data",
    				type: "bytes"
    			}
    		],
    		name: "safeTransferFrom",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "operator",
    				type: "address"
    			},
    			{
    				internalType: "bool",
    				name: "approved",
    				type: "bool"
    			}
    		],
    		name: "setApprovalForAll",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "student",
    				type: "address"
    			}
    		],
    		name: "studentStatus",
    		outputs: [
    			{
    				internalType: "enum StudentAndSup.StudentType",
    				name: "",
    				type: "uint8"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "bytes4",
    				name: "interfaceId",
    				type: "bytes4"
    			}
    		],
    		name: "supportsInterface",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "symbol",
    		outputs: [
    			{
    				internalType: "string",
    				name: "",
    				type: "string"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "index",
    				type: "uint256"
    			}
    		],
    		name: "tokenByIndex",
    		outputs: [
    			{
    				internalType: "uint256",
    				name: "",
    				type: "uint256"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "owner",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "index",
    				type: "uint256"
    			}
    		],
    		name: "tokenOfOwnerByIndex",
    		outputs: [
    			{
    				internalType: "uint256",
    				name: "",
    				type: "uint256"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "tokenURI",
    		outputs: [
    			{
    				internalType: "string",
    				name: "",
    				type: "string"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    		],
    		name: "totalSupply",
    		outputs: [
    			{
    				internalType: "uint256",
    				name: "",
    				type: "uint256"
    			}
    		],
    		stateMutability: "view",
    		type: "function",
    		constant: true
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "from",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "to",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "tokenId",
    				type: "uint256"
    			}
    		],
    		name: "transferFrom",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "newOwner",
    				type: "address"
    			}
    		],
    		name: "transferOwnership",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "student",
    				type: "address"
    			}
    		],
    		name: "SupervisorApproveAll",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "student",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "tokInd",
    				type: "uint256"
    			}
    		],
    		name: "SupervisorApprove",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	}
    ];
    var metadata = "{\"compiler\":{\"version\":\"0.7.0+commit.9e61f92b\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"approved\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"ApprovalForAll\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"}],\"name\":\"ClockInTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"newPendingTok\",\"type\":\"bool\"}],\"name\":\"ClockOutTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"tokId\",\"type\":\"uint256\"}],\"name\":\"PayoutMadeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"numbToks\",\"type\":\"uint256\"}],\"name\":\"PayoutMadeMultEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":false,\"internalType\":\"address\",\"name\":\"sup\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"StudentStatusChange\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokInd\",\"type\":\"uint256\"}],\"name\":\"SupervisorApprove\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"SupervisorApproveAll\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"baseURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockEndTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockStartTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"clock_in_times\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"supervisor\",\"type\":\"address\"}],\"name\":\"createPotentialStudent\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"getApproved\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"getPendingCollectibles\",\"outputs\":[{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getSupsPotentialStudents\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getSupsStudents\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"isApprovedForAll\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"ownerOf\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"pendingStudentInd\",\"type\":\"uint256\"}],\"name\":\"potentialSupApproveStudent\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"_data\",\"type\":\"bytes\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"setApprovalForAll\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"studentStatus\",\"outputs\":[{\"internalType\":\"enum StudentAndSup.StudentType\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes4\",\"name\":\"interfaceId\",\"type\":\"bytes4\"}],\"name\":\"supportsInterface\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"tokenByIndex\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"tokenOfOwnerByIndex\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"tokenURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"devdoc\":{\"details\":\"a coin which is rewarded to a student upon completition of clocking in and out within less than an hour A supervisor can then approve the coin\",\"kind\":\"dev\",\"methods\":{\"approve(address,uint256)\":{\"details\":\"See {IERC721-approve}.\"},\"balanceOf(address)\":{\"details\":\"See {IERC721-balanceOf}.\"},\"baseURI()\":{\"details\":\"Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.\"},\"clockStartTime()\":{\"details\":\"a user clocks in their start time\"},\"createPotentialStudent(address)\":{\"details\":\"msg.sender is the student's address\",\"params\":{\"supervisor\":\"- The student's desired supervisor\"}},\"getApproved(uint256)\":{\"details\":\"See {IERC721-getApproved}.\"},\"getSupsPotentialStudents()\":{\"returns\":{\"_0\":\"the students' addresses, their index in the address array\"}},\"isApprovedForAll(address,address)\":{\"details\":\"See {IERC721-isApprovedForAll}.\"},\"name()\":{\"details\":\"See {IERC721Metadata-name}.\"},\"owner()\":{\"details\":\"Returns the address of the current owner.\"},\"ownerOf(uint256)\":{\"details\":\"See {IERC721-ownerOf}.\"},\"renounceOwnership()\":{\"details\":\"Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.\"},\"safeTransferFrom(address,address,uint256)\":{\"details\":\"See {IERC721-safeTransferFrom}.\"},\"safeTransferFrom(address,address,uint256,bytes)\":{\"details\":\"See {IERC721-safeTransferFrom}.\"},\"setApprovalForAll(address,bool)\":{\"details\":\"See {IERC721-setApprovalForAll}.\"},\"studentStatus(address)\":{\"details\":\"get whether the student is a pending potential student, initialized, or nothing at all \"},\"supportsInterface(bytes4)\":{\"details\":\"See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.\"},\"symbol()\":{\"details\":\"See {IERC721Metadata-symbol}.\"},\"tokenByIndex(uint256)\":{\"details\":\"See {IERC721Enumerable-tokenByIndex}.\"},\"tokenOfOwnerByIndex(address,uint256)\":{\"details\":\"See {IERC721Enumerable-tokenOfOwnerByIndex}.\"},\"tokenURI(uint256)\":{\"details\":\"See {IERC721Metadata-tokenURI}.\"},\"totalSupply()\":{\"details\":\"See {IERC721Enumerable-totalSupply}.\"},\"transferFrom(address,address,uint256)\":{\"details\":\"See {IERC721-transferFrom}.\"},\"transferOwnership(address)\":{\"details\":\"Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.\"}},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":\"EvieCoin\"},\"evmVersion\":\"istanbul\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"ipfs\"},\"optimizer\":{\"enabled\":false,\"runs\":200},\"remappings\":[]},\"sources\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":{\"keccak256\":\"0x3cef19849bf262ea9edf07afe2cca47f58c0e2813fc78309333d574957485aa6\",\"urls\":[\"bzz-raw://0a58e271bcf91a81c68d7882afc460159bce247aefc6674a530fcd224e3a09f1\",\"dweb:/ipfs/QmPZo9epEcBid89G282zPtvoU8eZzWyH1G1DbZwDycr6dM\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/StudentAndSup.sol\":{\"keccak256\":\"0x63c175dc35e1cb2949a278ff051efac69589c8760bb2633b4f181df54f83b09e\",\"urls\":[\"bzz-raw://f1b2c965b99158ac5b0f915fee252d63dfa3b6e4f7c5f5eda12978b86595d1e3\",\"dweb:/ipfs/QmUSVHZA8nizrKM7vZTQaj1dwpQLj3wzpEGiuKdVVS2WTY\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/StudentColl.sol\":{\"keccak256\":\"0x758f7cef9a6325f41927f708ebc98700c4dc5fc1f488f6bf955225238d358215\",\"urls\":[\"bzz-raw://dd3c843418cf0c908aa5b54d8e993278df567fdd0d1e01a934e67bf8b9387fc4\",\"dweb:/ipfs/QmU9uLv4Fp1eiD5kkGeSSZDwxfpPXY5evc7Gf4qGVbyhkh\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/utils/RArrAddress.sol\":{\"keccak256\":\"0xab8ead0659217e4c2e2a9dd137d65ddcb2e2df43203bdce6969581a57bfa8675\",\"urls\":[\"bzz-raw://eb4ce519533727a1a30a5cca88596698c7cbf868d14594b241d21d1004fadc3e\",\"dweb:/ipfs/QmUMVBc16RMBpgp6YaLrzT4PrXAy4aC6iFDY6mNSX9PCD9\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/utils/RArrUint256.sol\":{\"keccak256\":\"0xe58ffc01d3e8c4710a294b48ea83b4b08ffe75cf052f54a0e7cc5bcee09e9bae\",\"urls\":[\"bzz-raw://d06d4a7168197874de2a738647beb13d295b881d4d16a543481f01b9636b4270\",\"dweb:/ipfs/QmZenMeVTMX9Fz2GHQBGB91xRFjmwCYeuR4PhKktDGTfqT\"]},\"@openzeppelin/contracts/GSN/Context.sol\":{\"keccak256\":\"0x8d3cb350f04ff49cfb10aef08d87f19dcbaecc8027b0bed12f3275cd12f38cf0\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://ded47ec7c96750f9bd04bbbc84f659992d4ba901cb7b532a52cd468272cf378f\",\"dweb:/ipfs/QmfBrGtQP7rZEqEg6Wz6jh2N2Kukpj1z5v3CGWmAqrzm96\"]},\"@openzeppelin/contracts/access/Ownable.sol\":{\"keccak256\":\"0xf7c39c7e6d06ed3bda90cfefbcbf2ddc32c599c3d6721746546ad64946efccaa\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://cb57a28e189cd8b05748db44bdd51d608e6f1364dd1b35ad921e1bc82c10631e\",\"dweb:/ipfs/QmaWWTBbVu2pRR9XUbE4iC159NoP59cRF9ZJwhf4ghFN9i\"]},\"@openzeppelin/contracts/introspection/ERC165.sol\":{\"keccak256\":\"0xd6b90e604fb2eb2d641c7110c72440bf2dc999ec6ab8ff60f200e71ca75d1d90\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7b92d8ab83b21ff984b1f0d6d66897d5afb1f2052004cbcb133cea023e0ae468\",\"dweb:/ipfs/QmTarypkQrFp4UMjTh7Zzhz2nZLz5uPS4nJQtHDEuwBVe6\"]},\"@openzeppelin/contracts/introspection/IERC165.sol\":{\"keccak256\":\"0xf70bc25d981e4ec9673a995ad2995d5d493ea188d3d8f388bba9c227ce09fb82\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://bd970f51e3a77790c2f02b5b1759827c3b897c3d98c407b3631e8af32e3dc93c\",\"dweb:/ipfs/QmPF85Amgbqjk3SNZKsPCsqCw8JfwYEPMnnhvMJUyX58je\"]},\"@openzeppelin/contracts/math/SafeMath.sol\":{\"keccak256\":\"0x3b21f2c8d626de3b9925ae33e972d8bf5c8b1bffb3f4ee94daeed7d0679036e6\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7f8d45329fecbf0836ad7543330c3ecd0f8d0ffa42d4016278c3eb2215fdcdfe\",\"dweb:/ipfs/QmXWLT7GcnHtA5NiD6MFi2CV3EWJY4wv5mLNnypqYDrxL3\"]},\"@openzeppelin/contracts/token/ERC20/ERC20.sol\":{\"keccak256\":\"0xcbd85c86627a47fd939f1f4ee3ba626575ff2a182e1804b29f5136394449b538\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://53c6a80c519bb9356aad28efa9a1ec31603860eb759d2dc57f545fcae1dd1aca\",\"dweb:/ipfs/QmfRS6TtMNUHhvgLHXK21qKNnpn2S7g2Yd1fKaHKyFiJsR\"]},\"@openzeppelin/contracts/token/ERC20/IERC20.sol\":{\"keccak256\":\"0x5f02220344881ce43204ae4a6281145a67bc52c2bb1290a791857df3d19d78f5\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://24427744bd3e6cb73c17010119af12a318289c0253a4d9acb8576c9fb3797b08\",\"dweb:/ipfs/QmTLDqpKRBuxGxRAmjgXt9AkXyACW3MtKzi7PYjm5iMfGC\"]},\"@openzeppelin/contracts/token/ERC721/ERC721.sol\":{\"keccak256\":\"0x5a3de7f7f76e47a071195cf42e2a702265694a6b32037de709463bd8ad784fb5\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://678cbad1f972a4d8c9d47bc39fa6d39560b4fc143c8d9c812a63fe99bb13062e\",\"dweb:/ipfs/QmUhLDvUndcbQLakDNg9G4UXz8UPzRqC6S3rWGKupB6DYs\"]},\"@openzeppelin/contracts/token/ERC721/IERC721.sol\":{\"keccak256\":\"0x5a9f5c29bd7cf0b345e14d97d5f685f68c07e1e5bfdd47e5bcec045e81b0b6ac\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://321cbaa1412fc8d013d8ad3fb5f98c0db7401ddacfb09b70828ea2cebe37397e\",\"dweb:/ipfs/Qmd3Hoc71w6rmxAR6A5VKW9at677VP1L5KDcJnyvu4ksu3\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol\":{\"keccak256\":\"0xe6bd1b1218338b6f9fe17776f48623b4ac3d8a40405f74a44bc23c00abe2ca13\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://0c354c3f6e9c487759aa7869be4fba68e0b2efc777b514d289c4cbd3ff8f7e1a\",\"dweb:/ipfs/QmdF9LcSYVmiUCL7JxLEYmSLrjga6zJsujfi6sgEJD4M1z\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol\":{\"keccak256\":\"0xccb917776f826ac6b68bd5a15a5f711e3967848a52ba11e6104d9a4f593314a7\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://430255ad2229ced6d880e61a67bdc6e48dbbaed8354a7c1fe918cd8b8714a886\",\"dweb:/ipfs/QmTHY56odzqEpEC6v6tafaWMYY7vmULw25q5XHJLCCAeox\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol\":{\"keccak256\":\"0x52146049d6709c870e8ddcd988b5155cb6c5d640cfcd8978aee52bc1ba2ec4eb\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://ada84513617b7c1b2f890b44503735abaec73a1acd030112a17aac7e6c66a4a1\",\"dweb:/ipfs/QmaiFwdio67iJrfjAdkMac24eJ5sS1qD7CZW6PhUU6KjiK\"]},\"@openzeppelin/contracts/utils/Address.sol\":{\"keccak256\":\"0xa6a15ddddcbf29d2922a1e0d4151b5d2d33da24b93cc9ebc12390e0d855532f8\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7c119bcaecfa853d564ac88d312777f75fa1126a3bca88a3371adb0ad9f35cb0\",\"dweb:/ipfs/QmY9UPuXeSKq86Zh38fE43VGQPhKMN34mkuFSFqPcr6nvZ\"]},\"@openzeppelin/contracts/utils/Counters.sol\":{\"keccak256\":\"0x21662e4254ce4ac8570b30cc7ab31435966b3cb778a56ba4d09276881cfb2437\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://acce8fe6adc670f9987a8b6aedc4cc0abcd0dcd2e152d649a12099d735bd7bad\",\"dweb:/ipfs/QmXAk17oK3daBmA8CGyVcU56L496jW3U6Ef1WkfHyB1JAV\"]},\"@openzeppelin/contracts/utils/EnumerableMap.sol\":{\"keccak256\":\"0xf6bdf22fe038e5310b6f0372ecd01f221e2c0b248b45efc404542d94fcac9133\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://6e798f3492180627d6616fa94925b61a9f105347eed9e895f3e18a0eb3dfcd3d\",\"dweb:/ipfs/QmQcTro5nv3Lopf4c4rEe1BuykCfPsjRsJmysdNXtHNUdt\"]},\"@openzeppelin/contracts/utils/EnumerableSet.sol\":{\"keccak256\":\"0xae0992eb1ec30fd1ecdf2e04a6036decfc9797bf11dc1ec84b546b74318d5ec2\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://3b61f99a64e999682ad7bfbb3a1c762a20a0a5b30f9f2011693fa857969af61f\",\"dweb:/ipfs/QmZystFY76wkWCf7V3yKh3buZuKVKbswiE7y6yU62kk3zi\"]},\"@openzeppelin/contracts/utils/Strings.sol\":{\"keccak256\":\"0x16b5422892fbdd9648f12e59de85b42efd57d76b6d6b2358cb46e0f6d4a71aaf\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://4ef38821a4ee756757dc1ce9074ef6096d1b5c760627e92c0852d788dc636ea7\",\"dweb:/ipfs/QmdGwP6BtRMcp4VVJUWwTmXEjYmL52A8WZpBdFJYmzc9pJ\"]}},\"version\":1}";
    var bytecode = "0x60806040523480156200001157600080fd5b506040518060400160405280600b81526020017f53747564656e74436f6c6c0000000000000000000000000000000000000000008152506040518060400160405280600381526020017f5354550000000000000000000000000000000000000000000000000000000000815250620000966301ffc9a760e01b620001da60201b60201c565b8160069080519060200190620000ae92919062000506565b508060079080519060200190620000c792919062000506565b50620000e06380ac58cd60e01b620001da60201b60201c565b620000f8635b5e139f60e01b620001da60201b60201c565b6200011063780e9d6360e01b620001da60201b60201c565b5050600062000124620002e360201b60201c565b905080600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350620001d433620002eb60201b60201c565b620005ac565b63ffffffff60e01b817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916141562000277576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433136353a20696e76616c696420696e746572666163652069640000000081525060200191505060405180910390fd5b6001600080837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b600033905090565b620002fb620002e360201b60201c565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614620003be576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141562000446576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180620053ac6026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200054957805160ff19168380011785556200057a565b828001600101855582156200057a579182015b82811115620005795782518255916020019190600101906200055c565b5b5090506200058991906200058d565b5090565b5b80821115620005a85760008160009055506001016200058e565b5090565b614df080620005bc6000396000f3fe608060405234801561001057600080fd5b50600436106101e55760003560e01c80636c0360eb1161010f578063b88d4fde116100a2578063db68f61211610071578063db68f61214610bcd578063e985e9c514610c25578063f2fde38b14610c9f578063f86b010d14610ce3576101e5565b8063b88d4fde146109d3578063b939df5914610ad8578063c87b56dd14610ae2578063d25eab2d14610b89576101e5565b80638da5cb5b116100de5780638da5cb5b146108c257806395d89b41146108f6578063a22cb46514610979578063a481aada146109c9576101e5565b80636c0360eb1461078f57806370a0823114610812578063715018a61461086a5780637aa0c58914610874576101e5565b80631e99dd471161018757806342842e0e1161015657806342842e0e146105e05780634f6ccce71461064e5780636352211e1461069057806367712570146106e8576101e5565b80631e99dd471461043b57806323b872dd146104695780632ce0ece6146104d75780632f745c591461057e576101e5565b8063095ea7b3116101c3578063095ea7b314610328578063097b009a1461037657806318160ddd146103d95780631e5792a0146103f7576101e5565b806301ffc9a7146101ea57806306fdde031461024d578063081812fc146102d0575b600080fd5b6102356004803603602081101561020057600080fd5b8101908080357bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19169060200190929190505050610d7c565b60405180821515815260200191505060405180910390f35b610255610de3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561029557808201518184015260208101905061027a565b50505050905090810190601f1680156102c25780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102fc600480360360208110156102e657600080fd5b8101908080359060200190929190505050610e85565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103746004803603604081101561033e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610f20565b005b6103b86004803603602081101561038c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611064565b604051808260028111156103c857fe5b815260200191505060405180910390f35b6103e16111a7565b6040518082815260200191505060405180910390f35b6104396004803603602081101561040d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506111b8565b005b6104676004803603602081101561045157600080fd5b81019080803590602001909291905050506115ca565b005b6104d56004803603606081101561047f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506115d6565b005b6104df61164c565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b8381101561052657808201518184015260208101905061050b565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561056857808201518184015260208101905061054d565b5050505090500194505050505060405180910390f35b6105ca6004803603604081101561059457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611664565b6040518082815260200191505060405180910390f35b61064c600480360360608110156105f657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506116bf565b005b61067a6004803603602081101561066457600080fd5b81019080803590602001909291905050506116df565b6040518082815260200191505060405180910390f35b6106bc600480360360208110156106a657600080fd5b8101908080359060200190929190505050611702565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6106f0611739565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b8381101561073757808201518184015260208101905061071c565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561077957808201518184015260208101905061075e565b5050505090500194505050505060405180910390f35b610797611751565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156107d75780820151818401526020810190506107bc565b50505050905090810190601f1680156108045780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6108546004803603602081101561082857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506117f3565b6040518082815260200191505060405180910390f35b6108726118c8565b005b6108c06004803603604081101561088a57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611a53565b005b6108ca611ab9565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6108fe611ae3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561093e578082015181840152602081019050610923565b50505050905090810190601f16801561096b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6109c76004803603604081101561098f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803515159060200190929190505050611b85565b005b6109d1611d3b565b005b610ad6600480360360808110156109e957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919080359060200190640100000000811115610a5057600080fd5b820183602082011115610a6257600080fd5b80359060200191846001830284011164010000000083111715610a8457600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050611f4d565b005b610ae0611fc5565b005b610b0e60048036036020811015610af857600080fd5b8101908080359060200190929190505050612175565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610b4e578082015181840152602081019050610b33565b50505050905090810190601f168015610b7b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610bcb60048036036020811015610b9f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061245e565b005b610c0f60048036036020811015610be357600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506125a1565b6040518082815260200191505060405180910390f35b610c8760048036036040811015610c3b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506125b9565b60405180821515815260200191505060405180910390f35b610ce160048036036020811015610cb557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061264d565b005b610d2560048036036020811015610cf957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061285d565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b83811015610d68578082015181840152602081019050610d4d565b505050509050019250505060405180910390f35b6000806000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff169050919050565b606060068054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610e7b5780601f10610e5057610100808354040283529160200191610e7b565b820191906000526020600020905b815481529060010190602001808311610e5e57829003601f168201915b5050505050905090565b6000610e90826128f4565b610ee5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614cbb602c913960400191505060405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b6000610f2b82611702565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610fb2576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180614d696021913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610fd1612911565b73ffffffffffffffffffffffffffffffffffffffff1614806110005750610fff81610ffa612911565b6125b9565b5b611055576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526038815260200180614be66038913960400191505060405180910390fd5b61105f8383612919565b505050565b60008073ffffffffffffffffffffffffffffffffffffffff16600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461110157600090506111a2565b600073ffffffffffffffffffffffffffffffffffffffff16600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461119d57600190506111a2565b600290505b919050565b60006111b360026129d2565b905090565b60005b600c80549050811015611298573373ffffffffffffffffffffffffffffffffffffffff16600c82815481106111ec57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561128b57600061128a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180614a876025913960400191505060405180910390fd5b5b80806001019150506111bb565b5060005b600b80549050811015611396573373ffffffffffffffffffffffffffffffffffffffff16600b82815481106112cd57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611389576000611388576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f53656e6465722063616e6e6f7420626520612073747564656e7400000000000081525060200191505060405180910390fd5b5b808060010191505061129c565b50600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461147b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614c936028913960400191505060405180910390fd5b80600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600c339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507f84cb897df1462f1adef179f717c830907aec4ae17a71a0c62001e7fa560e211a8133604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a150565b6115d3816129e7565b50565b6115e76115e1612911565b82612db0565b61163c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614d8a6031913960400191505060405180910390fd5b611647838383612ea4565b505050565b60608061165c600b600e336130e7565b915091509091565b60006116b782600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002061342d90919063ffffffff16565b905092915050565b6116da83838360405180602001604052806000815250611f4d565b505050565b6000806116f683600261344790919063ffffffff16565b50905080915050919050565b600061173282604051806060016040528060298152602001614c486029913960026134739092919063ffffffff16565b9050919050565b606080611749600c600d336130e7565b915091509091565b606060098054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156117e95780601f106117be576101008083540402835291602001916117e9565b820191906000526020600020905b8154815290600101906020018083116117cc57829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561187a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614c1e602a913960400191505060405180910390fd5b6118c1600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613492565b9050919050565b6118d0612911565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614611992576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b611a5d82826134a7565b611a67828261350f565b8173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b6000600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060078054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015611b7b5780601f10611b5057610100808354040283529160200191611b7b565b820191906000526020600020905b815481529060010190602001808311611b5e57829003601f168201915b5050505050905090565b611b8d612911565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611c2e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f4552433732313a20617070726f766520746f2063616c6c65720000000000000081525060200191505060405180910390fd5b8060056000611c3b612911565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff16611ce8612911565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16611da3620151804261360b90919063ffffffff16565b61ffff1611611db157600080fd5b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611e4a57600080fd5b42601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611ea4620151804261360b90919063ffffffff16565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b611f5e611f58612911565b83612db0565b611fb3576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614d8a6031913960400191505060405180910390fd5b611fbf84848484613655565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561205e57600080fd5b6000429050601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548110156120af57600080fd5b6000610e10612106601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054846136c790919063ffffffff16565b11612119576001905061211833613711565b5b3373ffffffffffffffffffffffffffffffffffffffff167f1169a57bcca659f54ea0d65ec6297c90d18a47b10a1e955cb7f8bea526ca87bd42836040518083815260200182151581526020019250505060405180910390a25050565b6060612180826128f4565b6121d5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602f815260200180614d10602f913960400191505060405180910390fd5b6060600860008481526020019081526020016000208054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561227e5780601f106122535761010080835404028352916020019161227e565b820191906000526020600020905b81548152906001019060200180831161226157829003601f168201915b505050505090506000600980546001816001161561010002031660029004905014156122ad5780915050612459565b6000815111156123865760098160405160200180838054600181600116156101000203166002900480156123185780601f106122f6576101008083540402835291820191612318565b820191906000526020600020905b815481529060010190602001808311612304575b505082805190602001908083835b602083106123495780518252602082019150602081019050602083039250612326565b6001836020036101000a03801982511681845116808217855250505050505090500192505050604051602081830303815290604052915050612459565b60096123918461382c565b60405160200180838054600181600116156101000203166002900480156123ef5780601f106123cd5761010080835404028352918201916123ef565b820191906000526020600020905b8154815290600101906020018083116123db575b505082805190602001908083835b6020831061242057805182526020820191506020810190506020830392506123fd565b6001836020036101000a038019825116818451168082178552505050505050905001925050506040516020818303038152906040529150505b919050565b60005b601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020805490508110156124c2576124b582826134a7565b8080600101915050612461565b508073ffffffffffffffffffffffffffffffffffffffff167ff43fa0f98e476cf52c3528cedf54a09f9edcea6b7e17fd50f33d65953cc10d84601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020805490506040518082815260200191505060405180910390a2601060008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600061259e9190614a26565b50565b60116020528060005260406000206000915090505481565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b612655612911565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612717576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561279d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180614b256026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054806020026020016040519081016040528092919081815260200182805480156128e857602002820191906000526020600020905b8154815260200190600101908083116128d4575b50505050509050919050565b600061290a82600261397390919063ffffffff16565b9050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff1661298c83611702565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60006129e08260000161398d565b9050919050565b6000600c82815481106129f657fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff16600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612b07576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614c936028913960400191505060405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16600d60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612bea576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180614b6f6025913960400191505060405180910390fd5b33600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600b819080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550612cdf82600c61399e90919063ffffffff16565b600d60008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690557f84cb897df1462f1adef179f717c830907aec4ae17a71a0c62001e7fa560e211a3382604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a15050565b6000612dbb826128f4565b612e10576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614bba602c913960400191505060405180910390fd5b6000612e1b83611702565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480612e8a57508373ffffffffffffffffffffffffffffffffffffffff16612e7284610e85565b73ffffffffffffffffffffffffffffffffffffffff16145b80612e9b5750612e9a81856125b9565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16612ec482611702565b73ffffffffffffffffffffffffffffffffffffffff1614612f30576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526029815260200180614ce76029913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612fb6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526024815260200180614b4b6024913960400191505060405180910390fd5b612fc1838383613ae2565b612fcc600082612919565b61301d81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613ae790919063ffffffff16565b5061306f81600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613b0190919063ffffffff16565b5061308681836002613b1b9092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b6060806000805b86805490508110156131fa57600087828154811061310857fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508573ffffffffffffffffffffffffffffffffffffffff168760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156131de576131db600184613b5090919063ffffffff16565b92505b506131f3600182613b5090919063ffffffff16565b90506130ee565b5060608167ffffffffffffffff8111801561321457600080fd5b506040519080825280602002602001820160405280156132435781602001602082028036833780820191505090505b50905060608267ffffffffffffffff8111801561325f57600080fd5b5060405190808252806020026020018201604052801561328e5781602001602082028036833780820191505090505b5090506000805b89805490508110156134195760008a82815481106132af57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508873ffffffffffffffffffffffffffffffffffffffff168a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156133fd578085848151811061337b57fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff1681525050818484815181106133c257fe5b6020026020010181815250506133e2600184613b5090919063ffffffff16565b92508286116133fc57848497509750505050505050613425565b5b50613412600182613b5090919063ffffffff16565b9050613295565b50828295509550505050505b935093915050565b600061343c8360000183613bd8565b60001c905092915050565b60008060008061345a8660000186613c5b565b915091508160001c8160001c9350935050509250929050565b6000613486846000018460001b84613cf4565b60001c90509392505050565b60006134a082600001613dea565b9050919050565b6000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002082815481106134f357fe5b9060005260206000200154905061350a8382613dfb565b505050565b806000111580156135615750601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054905081105b6135b6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526047815260200180614aac6047913960600191505060405180910390fd5b61360781601060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613e1990919063ffffffff16565b5050565b600061364d83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250613ee4565b905092915050565b613660848484612ea4565b61366c84848484613faa565b6136c1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526032815260200180614af36032913960400191505060405180910390fd5b50505050565b600061370983836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506141c3565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156137aa57600080fd5b6137b4600f614283565b60006137c0600f614299565b9050601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190806001815401808255809150506001900390600052602060002001600090919091909150555050565b60606000821415613874576040518060400160405280600181526020017f3000000000000000000000000000000000000000000000000000000000000000815250905061396e565b600082905060005b6000821461389e578080600101915050600a828161389657fe5b04915061387c565b60608167ffffffffffffffff811180156138b757600080fd5b506040519080825280601f01601f1916602001820160405280156138ea5781602001600182028036833780820191505090505b50905060006001830390508593505b6000841461396657600a848161390b57fe5b0660300160f81b8282806001900393508151811061392557fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a848161395e57fe5b0493506138f9565b819450505050505b919050565b6000613985836000018360001b6142a7565b905092915050565b600081600001805490509050919050565b806000111580156139b25750818054905081105b613a07576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614d3f602a913960400191505060405180910390fd5b600060018380549050039050828181548110613a1f57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16838381548110613a5657fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555082805480613aa857fe5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690559055505050565b505050565b6000613af9836000018360001b6142ca565b905092915050565b6000613b13836000018360001b6143b2565b905092915050565b6000613b47846000018460001b8473ffffffffffffffffffffffffffffffffffffffff1660001b614422565b90509392505050565b600080828401905083811015613bce576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b600081836000018054905011613c39576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614a656022913960400191505060405180910390fd5b826000018281548110613c4857fe5b9060005260206000200154905092915050565b60008082846000018054905011613cbd576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614c716022913960400191505060405180910390fd5b6000846000018481548110613cce57fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b60008084600101600085815260200190815260200160002054905060008114158390613dbb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613d80578082015181840152602081019050613d65565b50505050905090810190601f168015613dad5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50846000016001820381548110613dce57fe5b9060005260206000209060020201600101549150509392505050565b600081600001805490509050919050565b613e158282604051806020016040528060008152506144fe565b5050565b80600011158015613e2d5750818054905081105b613e82576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614d3f602a913960400191505060405180910390fd5b600060018380549050039050828181548110613e9a57fe5b9060005260206000200154838381548110613eb157fe5b906000526020600020018190555082805480613ec957fe5b60019003818190600052602060002001600090559055505050565b60008083118290613f90576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613f55578082015181840152602081019050613f3a565b50505050905090810190601f168015613f825780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581613f9c57fe5b049050809150509392505050565b6000613fcb8473ffffffffffffffffffffffffffffffffffffffff1661456f565b613fd857600190506141bb565b606061414263150b7a0260e01b613fed612911565b888787604051602401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff16815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015614071578082015181840152602081019050614056565b50505050905090810190601f16801561409e5780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050604051806060016040528060328152602001614af3603291398773ffffffffffffffffffffffffffffffffffffffff166145829092919063ffffffff16565b9050600081806020019051602081101561415b57600080fd5b8101908080519060200190929190505050905063150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614925050505b949350505050565b6000838311158290614270576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561423557808201518184015260208101905061421a565b50505050905090810190601f1680156142625780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b6001816000016000828254019250508190555050565b600081600001549050919050565b600080836001016000848152602001908152602001600020541415905092915050565b600080836001016000848152602001908152602001600020549050600081146143a6576000600182039050600060018660000180549050039050600086600001828154811061431557fe5b906000526020600020015490508087600001848154811061433257fe5b906000526020600020018190555060018301876001016000838152602001908152602001600020819055508660000180548061436a57fe5b600190038181906000526020600020016000905590558660010160008781526020019081526020016000206000905560019450505050506143ac565b60009150505b92915050565b60006143be838361459a565b61441757826000018290806001815401808255809150506001900390600052602060002001600090919091909150558260000180549050836001016000848152602001908152602001600020819055506001905061441c565b600090505b92915050565b60008084600101600085815260200190815260200160002054905060008114156144c9578460000160405180604001604052808681526020018581525090806001815401808255809150506001900390600052602060002090600202016000909190919091506000820151816000015560208201518160010155505084600001805490508560010160008681526020019081526020016000208190555060019150506144f7565b828560000160018303815481106144dc57fe5b90600052602060002090600202016001018190555060009150505b9392505050565b61450883836145bd565b6145156000848484613faa565b61456a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526032815260200180614af36032913960400191505060405180910390fd5b505050565b600080823b905060008111915050919050565b606061459184846000856147b1565b90509392505050565b600080836001016000848152602001908152602001600020541415905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415614660576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4552433732313a206d696e7420746f20746865207a65726f206164647265737381525060200191505060405180910390fd5b614669816128f4565b156146dc576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433732313a20746f6b656e20616c7265616479206d696e7465640000000081525060200191505060405180910390fd5b6146e860008383613ae2565b61473981600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613b0190919063ffffffff16565b5061475081836002613b1b9092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b60608247101561480c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180614b946026913960400191505060405180910390fd5b6148158561456f565b614887576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000081525060200191505060405180910390fd5b600060608673ffffffffffffffffffffffffffffffffffffffff1685876040518082805190602001908083835b602083106148d757805182526020820191506020810190506020830392506148b4565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114614939576040519150601f19603f3d011682016040523d82523d6000602084013e61493e565b606091505b509150915061494e82828661495a565b92505050949350505050565b6060831561496a57829050614a1f565b60008351111561497d5782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b838110156149e45780820151818401526020810190506149c9565b50505050905090810190601f168015614a115780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b9392505050565b5080546000825590600052602060002090810190614a449190614a47565b50565b5b80821115614a60576000816000905550600101614a48565b509056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e647353747564656e74206d757374206e6f7420626520612070656e64696e672073747564656e7454686520746f6b656e20696e646578206d7573742062652077697468696e2072616e6765206f66207468652073747564656e7427732070656e64696e67206964732061727261794552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734552433732313a207472616e7366657220746f20746865207a65726f206164647265737353747564656e74206d75737420686176652073657420746869732073757065727669736f72416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c4552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e647353747564656e742063616e6e6f7420616c7265616479206861766520612073757065727669736f724552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e54686520696e646578206d7573742062652077697468696e2072616e6765206f6620746865206c6973744552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a2646970667358221220662592201f077822012f05b0e404086cf7a32ebedc84b6d61c25a5653018429864736f6c634300070000334f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373";
    var deployedBytecode = "0x608060405234801561001057600080fd5b50600436106101e55760003560e01c80636c0360eb1161010f578063b88d4fde116100a2578063db68f61211610071578063db68f61214610bcd578063e985e9c514610c25578063f2fde38b14610c9f578063f86b010d14610ce3576101e5565b8063b88d4fde146109d3578063b939df5914610ad8578063c87b56dd14610ae2578063d25eab2d14610b89576101e5565b80638da5cb5b116100de5780638da5cb5b146108c257806395d89b41146108f6578063a22cb46514610979578063a481aada146109c9576101e5565b80636c0360eb1461078f57806370a0823114610812578063715018a61461086a5780637aa0c58914610874576101e5565b80631e99dd471161018757806342842e0e1161015657806342842e0e146105e05780634f6ccce71461064e5780636352211e1461069057806367712570146106e8576101e5565b80631e99dd471461043b57806323b872dd146104695780632ce0ece6146104d75780632f745c591461057e576101e5565b8063095ea7b3116101c3578063095ea7b314610328578063097b009a1461037657806318160ddd146103d95780631e5792a0146103f7576101e5565b806301ffc9a7146101ea57806306fdde031461024d578063081812fc146102d0575b600080fd5b6102356004803603602081101561020057600080fd5b8101908080357bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19169060200190929190505050610d7c565b60405180821515815260200191505060405180910390f35b610255610de3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561029557808201518184015260208101905061027a565b50505050905090810190601f1680156102c25780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102fc600480360360208110156102e657600080fd5b8101908080359060200190929190505050610e85565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103746004803603604081101561033e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610f20565b005b6103b86004803603602081101561038c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611064565b604051808260028111156103c857fe5b815260200191505060405180910390f35b6103e16111a7565b6040518082815260200191505060405180910390f35b6104396004803603602081101561040d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506111b8565b005b6104676004803603602081101561045157600080fd5b81019080803590602001909291905050506115ca565b005b6104d56004803603606081101561047f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506115d6565b005b6104df61164c565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b8381101561052657808201518184015260208101905061050b565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561056857808201518184015260208101905061054d565b5050505090500194505050505060405180910390f35b6105ca6004803603604081101561059457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611664565b6040518082815260200191505060405180910390f35b61064c600480360360608110156105f657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506116bf565b005b61067a6004803603602081101561066457600080fd5b81019080803590602001909291905050506116df565b6040518082815260200191505060405180910390f35b6106bc600480360360208110156106a657600080fd5b8101908080359060200190929190505050611702565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6106f0611739565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b8381101561073757808201518184015260208101905061071c565b50505050905001838103825284818151815260200191508051906020019060200280838360005b8381101561077957808201518184015260208101905061075e565b5050505090500194505050505060405180910390f35b610797611751565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156107d75780820151818401526020810190506107bc565b50505050905090810190601f1680156108045780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6108546004803603602081101561082857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506117f3565b6040518082815260200191505060405180910390f35b6108726118c8565b005b6108c06004803603604081101561088a57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050611a53565b005b6108ca611ab9565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6108fe611ae3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561093e578082015181840152602081019050610923565b50505050905090810190601f16801561096b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6109c76004803603604081101561098f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803515159060200190929190505050611b85565b005b6109d1611d3b565b005b610ad6600480360360808110156109e957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919080359060200190640100000000811115610a5057600080fd5b820183602082011115610a6257600080fd5b80359060200191846001830284011164010000000083111715610a8457600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050611f4d565b005b610ae0611fc5565b005b610b0e60048036036020811015610af857600080fd5b8101908080359060200190929190505050612175565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610b4e578082015181840152602081019050610b33565b50505050905090810190601f168015610b7b5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610bcb60048036036020811015610b9f57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061245e565b005b610c0f60048036036020811015610be357600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506125a1565b6040518082815260200191505060405180910390f35b610c8760048036036040811015610c3b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506125b9565b60405180821515815260200191505060405180910390f35b610ce160048036036020811015610cb557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061264d565b005b610d2560048036036020811015610cf957600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061285d565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b83811015610d68578082015181840152602081019050610d4d565b505050509050019250505060405180910390f35b6000806000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff169050919050565b606060068054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610e7b5780601f10610e5057610100808354040283529160200191610e7b565b820191906000526020600020905b815481529060010190602001808311610e5e57829003601f168201915b5050505050905090565b6000610e90826128f4565b610ee5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614cbb602c913960400191505060405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b6000610f2b82611702565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610fb2576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180614d696021913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610fd1612911565b73ffffffffffffffffffffffffffffffffffffffff1614806110005750610fff81610ffa612911565b6125b9565b5b611055576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526038815260200180614be66038913960400191505060405180910390fd5b61105f8383612919565b505050565b60008073ffffffffffffffffffffffffffffffffffffffff16600e60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461110157600090506111a2565b600073ffffffffffffffffffffffffffffffffffffffff16600d60008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461119d57600190506111a2565b600290505b919050565b60006111b360026129d2565b905090565b60005b600c80549050811015611298573373ffffffffffffffffffffffffffffffffffffffff16600c82815481106111ec57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561128b57600061128a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180614a876025913960400191505060405180910390fd5b5b80806001019150506111bb565b5060005b600b80549050811015611396573373ffffffffffffffffffffffffffffffffffffffff16600b82815481106112cd57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611389576000611388576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601a8152602001807f53656e6465722063616e6e6f7420626520612073747564656e7400000000000081525060200191505060405180910390fd5b5b808060010191505061129c565b50600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461147b576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614c936028913960400191505060405180910390fd5b80600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600c339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055507f84cb897df1462f1adef179f717c830907aec4ae17a71a0c62001e7fa560e211a8133604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a150565b6115d3816129e7565b50565b6115e76115e1612911565b82612db0565b61163c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614d8a6031913960400191505060405180910390fd5b611647838383612ea4565b505050565b60608061165c600b600e336130e7565b915091509091565b60006116b782600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002061342d90919063ffffffff16565b905092915050565b6116da83838360405180602001604052806000815250611f4d565b505050565b6000806116f683600261344790919063ffffffff16565b50905080915050919050565b600061173282604051806060016040528060298152602001614c486029913960026134739092919063ffffffff16565b9050919050565b606080611749600c600d336130e7565b915091509091565b606060098054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156117e95780601f106117be576101008083540402835291602001916117e9565b820191906000526020600020905b8154815290600101906020018083116117cc57829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561187a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614c1e602a913960400191505060405180910390fd5b6118c1600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613492565b9050919050565b6118d0612911565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614611992576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b611a5d82826134a7565b611a67828261350f565b8173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b6000600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060078054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015611b7b5780601f10611b5057610100808354040283529160200191611b7b565b820191906000526020600020905b815481529060010190602001808311611b5e57829003601f168201915b5050505050905090565b611b8d612911565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611c2e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f4552433732313a20617070726f766520746f2063616c6c65720000000000000081525060200191505060405180910390fd5b8060056000611c3b612911565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff16611ce8612911565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16611da3620151804261360b90919063ffffffff16565b61ffff1611611db157600080fd5b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611e4a57600080fd5b42601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611ea4620151804261360b90919063ffffffff16565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b611f5e611f58612911565b83612db0565b611fb3576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614d8a6031913960400191505060405180910390fd5b611fbf84848484613655565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561205e57600080fd5b6000429050601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548110156120af57600080fd5b6000610e10612106601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054846136c790919063ffffffff16565b11612119576001905061211833613711565b5b3373ffffffffffffffffffffffffffffffffffffffff167f1169a57bcca659f54ea0d65ec6297c90d18a47b10a1e955cb7f8bea526ca87bd42836040518083815260200182151581526020019250505060405180910390a25050565b6060612180826128f4565b6121d5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602f815260200180614d10602f913960400191505060405180910390fd5b6060600860008481526020019081526020016000208054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561227e5780601f106122535761010080835404028352916020019161227e565b820191906000526020600020905b81548152906001019060200180831161226157829003601f168201915b505050505090506000600980546001816001161561010002031660029004905014156122ad5780915050612459565b6000815111156123865760098160405160200180838054600181600116156101000203166002900480156123185780601f106122f6576101008083540402835291820191612318565b820191906000526020600020905b815481529060010190602001808311612304575b505082805190602001908083835b602083106123495780518252602082019150602081019050602083039250612326565b6001836020036101000a03801982511681845116808217855250505050505090500192505050604051602081830303815290604052915050612459565b60096123918461382c565b60405160200180838054600181600116156101000203166002900480156123ef5780601f106123cd5761010080835404028352918201916123ef565b820191906000526020600020905b8154815290600101906020018083116123db575b505082805190602001908083835b6020831061242057805182526020820191506020810190506020830392506123fd565b6001836020036101000a038019825116818451168082178552505050505050905001925050506040516020818303038152906040529150505b919050565b60005b601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020805490508110156124c2576124b582826134a7565b8080600101915050612461565b508073ffffffffffffffffffffffffffffffffffffffff167ff43fa0f98e476cf52c3528cedf54a09f9edcea6b7e17fd50f33d65953cc10d84601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020805490506040518082815260200191505060405180910390a2601060008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600061259e9190614a26565b50565b60116020528060005260406000206000915090505481565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b612655612911565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612717576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561279d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180614b256026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054806020026020016040519081016040528092919081815260200182805480156128e857602002820191906000526020600020905b8154815260200190600101908083116128d4575b50505050509050919050565b600061290a82600261397390919063ffffffff16565b9050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff1661298c83611702565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b60006129e08260000161398d565b9050919050565b6000600c82815481106129f657fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff16600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612b07576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614c936028913960400191505060405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16600d60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612bea576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180614b6f6025913960400191505060405180910390fd5b33600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600b819080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550612cdf82600c61399e90919063ffffffff16565b600d60008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690557f84cb897df1462f1adef179f717c830907aec4ae17a71a0c62001e7fa560e211a3382604051808373ffffffffffffffffffffffffffffffffffffffff1681526020018273ffffffffffffffffffffffffffffffffffffffff1681526020019250505060405180910390a15050565b6000612dbb826128f4565b612e10576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614bba602c913960400191505060405180910390fd5b6000612e1b83611702565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480612e8a57508373ffffffffffffffffffffffffffffffffffffffff16612e7284610e85565b73ffffffffffffffffffffffffffffffffffffffff16145b80612e9b5750612e9a81856125b9565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16612ec482611702565b73ffffffffffffffffffffffffffffffffffffffff1614612f30576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526029815260200180614ce76029913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612fb6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526024815260200180614b4b6024913960400191505060405180910390fd5b612fc1838383613ae2565b612fcc600082612919565b61301d81600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613ae790919063ffffffff16565b5061306f81600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613b0190919063ffffffff16565b5061308681836002613b1b9092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b6060806000805b86805490508110156131fa57600087828154811061310857fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508573ffffffffffffffffffffffffffffffffffffffff168760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156131de576131db600184613b5090919063ffffffff16565b92505b506131f3600182613b5090919063ffffffff16565b90506130ee565b5060608167ffffffffffffffff8111801561321457600080fd5b506040519080825280602002602001820160405280156132435781602001602082028036833780820191505090505b50905060608267ffffffffffffffff8111801561325f57600080fd5b5060405190808252806020026020018201604052801561328e5781602001602082028036833780820191505090505b5090506000805b89805490508110156134195760008a82815481106132af57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508873ffffffffffffffffffffffffffffffffffffffff168a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156133fd578085848151811061337b57fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff1681525050818484815181106133c257fe5b6020026020010181815250506133e2600184613b5090919063ffffffff16565b92508286116133fc57848497509750505050505050613425565b5b50613412600182613b5090919063ffffffff16565b9050613295565b50828295509550505050505b935093915050565b600061343c8360000183613bd8565b60001c905092915050565b60008060008061345a8660000186613c5b565b915091508160001c8160001c9350935050509250929050565b6000613486846000018460001b84613cf4565b60001c90509392505050565b60006134a082600001613dea565b9050919050565b6000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002082815481106134f357fe5b9060005260206000200154905061350a8382613dfb565b505050565b806000111580156135615750601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054905081105b6135b6576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526047815260200180614aac6047913960600191505060405180910390fd5b61360781601060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613e1990919063ffffffff16565b5050565b600061364d83836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250613ee4565b905092915050565b613660848484612ea4565b61366c84848484613faa565b6136c1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526032815260200180614af36032913960400191505060405180910390fd5b50505050565b600061370983836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506141c3565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156137aa57600080fd5b6137b4600f614283565b60006137c0600f614299565b9050601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190806001815401808255809150506001900390600052602060002001600090919091909150555050565b60606000821415613874576040518060400160405280600181526020017f3000000000000000000000000000000000000000000000000000000000000000815250905061396e565b600082905060005b6000821461389e578080600101915050600a828161389657fe5b04915061387c565b60608167ffffffffffffffff811180156138b757600080fd5b506040519080825280601f01601f1916602001820160405280156138ea5781602001600182028036833780820191505090505b50905060006001830390508593505b6000841461396657600a848161390b57fe5b0660300160f81b8282806001900393508151811061392557fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a848161395e57fe5b0493506138f9565b819450505050505b919050565b6000613985836000018360001b6142a7565b905092915050565b600081600001805490509050919050565b806000111580156139b25750818054905081105b613a07576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614d3f602a913960400191505060405180910390fd5b600060018380549050039050828181548110613a1f57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16838381548110613a5657fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555082805480613aa857fe5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690559055505050565b505050565b6000613af9836000018360001b6142ca565b905092915050565b6000613b13836000018360001b6143b2565b905092915050565b6000613b47846000018460001b8473ffffffffffffffffffffffffffffffffffffffff1660001b614422565b90509392505050565b600080828401905083811015613bce576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b600081836000018054905011613c39576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614a656022913960400191505060405180910390fd5b826000018281548110613c4857fe5b9060005260206000200154905092915050565b60008082846000018054905011613cbd576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614c716022913960400191505060405180910390fd5b6000846000018481548110613cce57fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b60008084600101600085815260200190815260200160002054905060008114158390613dbb576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613d80578082015181840152602081019050613d65565b50505050905090810190601f168015613dad5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50846000016001820381548110613dce57fe5b9060005260206000209060020201600101549150509392505050565b600081600001805490509050919050565b613e158282604051806020016040528060008152506144fe565b5050565b80600011158015613e2d5750818054905081105b613e82576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614d3f602a913960400191505060405180910390fd5b600060018380549050039050828181548110613e9a57fe5b9060005260206000200154838381548110613eb157fe5b906000526020600020018190555082805480613ec957fe5b60019003818190600052602060002001600090559055505050565b60008083118290613f90576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613f55578082015181840152602081019050613f3a565b50505050905090810190601f168015613f825780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581613f9c57fe5b049050809150509392505050565b6000613fcb8473ffffffffffffffffffffffffffffffffffffffff1661456f565b613fd857600190506141bb565b606061414263150b7a0260e01b613fed612911565b888787604051602401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff16815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015614071578082015181840152602081019050614056565b50505050905090810190601f16801561409e5780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff8381831617835250505050604051806060016040528060328152602001614af3603291398773ffffffffffffffffffffffffffffffffffffffff166145829092919063ffffffff16565b9050600081806020019051602081101561415b57600080fd5b8101908080519060200190929190505050905063150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614925050505b949350505050565b6000838311158290614270576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561423557808201518184015260208101905061421a565b50505050905090810190601f1680156142625780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b6001816000016000828254019250508190555050565b600081600001549050919050565b600080836001016000848152602001908152602001600020541415905092915050565b600080836001016000848152602001908152602001600020549050600081146143a6576000600182039050600060018660000180549050039050600086600001828154811061431557fe5b906000526020600020015490508087600001848154811061433257fe5b906000526020600020018190555060018301876001016000838152602001908152602001600020819055508660000180548061436a57fe5b600190038181906000526020600020016000905590558660010160008781526020019081526020016000206000905560019450505050506143ac565b60009150505b92915050565b60006143be838361459a565b61441757826000018290806001815401808255809150506001900390600052602060002001600090919091909150558260000180549050836001016000848152602001908152602001600020819055506001905061441c565b600090505b92915050565b60008084600101600085815260200190815260200160002054905060008114156144c9578460000160405180604001604052808681526020018581525090806001815401808255809150506001900390600052602060002090600202016000909190919091506000820151816000015560208201518160010155505084600001805490508560010160008681526020019081526020016000208190555060019150506144f7565b828560000160018303815481106144dc57fe5b90600052602060002090600202016001018190555060009150505b9392505050565b61450883836145bd565b6145156000848484613faa565b61456a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526032815260200180614af36032913960400191505060405180910390fd5b505050565b600080823b905060008111915050919050565b606061459184846000856147b1565b90509392505050565b600080836001016000848152602001908152602001600020541415905092915050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415614660576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4552433732313a206d696e7420746f20746865207a65726f206164647265737381525060200191505060405180910390fd5b614669816128f4565b156146dc576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433732313a20746f6b656e20616c7265616479206d696e7465640000000081525060200191505060405180910390fd5b6146e860008383613ae2565b61473981600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613b0190919063ffffffff16565b5061475081836002613b1b9092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b60608247101561480c576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180614b946026913960400191505060405180910390fd5b6148158561456f565b614887576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000081525060200191505060405180910390fd5b600060608673ffffffffffffffffffffffffffffffffffffffff1685876040518082805190602001908083835b602083106148d757805182526020820191506020810190506020830392506148b4565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d8060008114614939576040519150601f19603f3d011682016040523d82523d6000602084013e61493e565b606091505b509150915061494e82828661495a565b92505050949350505050565b6060831561496a57829050614a1f565b60008351111561497d5782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b838110156149e45780820151818401526020810190506149c9565b50505050905090810190601f168015614a115780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b9392505050565b5080546000825590600052602060002090810190614a449190614a47565b50565b5b80821115614a60576000816000905550600101614a48565b509056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e647353747564656e74206d757374206e6f7420626520612070656e64696e672073747564656e7454686520746f6b656e20696e646578206d7573742062652077697468696e2072616e6765206f66207468652073747564656e7427732070656e64696e67206964732061727261794552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734552433732313a207472616e7366657220746f20746865207a65726f206164647265737353747564656e74206d75737420686176652073657420746869732073757065727669736f72416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c4552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e647353747564656e742063616e6e6f7420616c7265616479206861766520612073757065727669736f724552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e54686520696e646578206d7573742062652077697468696e2072616e6765206f6620746865206c6973744552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a2646970667358221220662592201f077822012f05b0e404086cf7a32ebedc84b6d61c25a5653018429864736f6c63430007000033";
    var immutableReferences = {
    };
    var sourceMap = "371:898:0:-:0;;;475:30;;;;;;;;;;3575:369:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;768:40:9;435:10;787:20;;768:18;;;:40;;:::i;:::-;3657:5:14;3649;:13;;;;;;;;;;;;:::i;:::-;;3682:7;3672;:17;;;;;;;;;;;;:::i;:::-;;3777:40;2740:10;3796:20;;3777:18;;;:40;;:::i;:::-;3827:49;3072:10;3846:29;;3827:18;;;:49;;:::i;:::-;3886:51;3445:10;3905:31;;3886:18;;;:51;;:::i;:::-;3575:369;;882:17:8;902:12;:10;;;:12;;:::i;:::-;882:32;;933:9;924:6;;:18;;;;;;;;;;;;;;;;;;990:9;957:43;;986:1;957:43;;;;;;;;;;;;848:159;1423:29:3::2;1441:10;1423:17;;;:29;;:::i;:::-;371:898:0::0;;1499:198:9;1597:10;1582:25;;:11;:25;;;;;1574:66;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1686:4;1650:20;:33;1671:11;1650:33;;;;;;;;;;;;;;;;;;:40;;;;;;;;;;;;;;;;;;1499:198;:::o;598:104:7:-;651:15;685:10;678:17;;598:104;:::o;2000:240:8:-;1297:12;:10;;;:12;;:::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;371:898:0:-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;";
    var deployedSourceMap = "371:898:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;965:140:9;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;4500:90:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7107:209;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;6665:381;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1786:366:2;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;6175:200:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;2268:432:2;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;2706:119;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;7955:300:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;3533:198:2;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5952:152:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;8321:149;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;6447:161;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;4271:167;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;3812:296:2;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5786:87:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4003:211;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;1706:145:8;;;:::i;:::-;;875:210:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1083:77:8;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;4654:94:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7383:290;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1690:257:3;;;:::i;:::-;;8536:282:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1999:443:3;;;:::i;:::-;;4814:740:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;511:358:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;679:49:3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;7739:154:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;2000:240:8;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1465:172:3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;965:140:9;1042:4;1065:20;:33;1086:11;1065:33;;;;;;;;;;;;;;;;;;;;;;;;;;;1058:40;;965:140;;;:::o;4500:90:14:-;4546:13;4578:5;4571:12;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4500:90;:::o;7107:209::-;7175:7;7202:16;7210:7;7202;:16::i;:::-;7194:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7285:15;:24;7301:7;7285:24;;;;;;;;;;;;;;;;;;;;;7278:31;;7107:209;;;:::o;6665:381::-;6745:13;6761:16;6769:7;6761;:16::i;:::-;6745:32;;6801:5;6795:11;;:2;:11;;;;6787:57;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;6879:5;6863:21;;:12;:10;:12::i;:::-;:21;;;:62;;;;6888:37;6905:5;6912:12;:10;:12::i;:::-;6888:16;:37::i;:::-;6863:62;6855:152;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7018:21;7027:2;7031:7;7018:8;:21::i;:::-;6665:381;;;:::o;1786:366:2:-;1846:11;1913:1;1873:42;;:19;:28;1893:7;1873:28;;;;;;;;;;;;;;;;;;;;;;;;;:42;;;1869:277;;1938:23;1931:30;;;;1869:277;2030:1;1982:50;;:27;:36;2010:7;1982:36;;;;;;;;;;;;;;;;;;;;;;;;;:50;;;1978:168;;2055:26;2048:33;;;;1978:168;2119:16;2112:23;;1786:366;;;;:::o;6175:200:14:-;6228:7;6347:21;:12;:19;:21::i;:::-;6340:28;;6175:200;:::o;2268:432:2:-;1204:9;1199:203;1223:15;:22;;;;1219:1;:26;1199:203;;;1292:10;1270:32;;:15;1286:1;1270:18;;;;;;;;;;;;;;;;;;;;;;;;;:32;;;1266:126;;;1330:5;1322:55;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1266:126;1247:3;;;;;;;1199:203;;;;1467:6:::1;1462:178;1483:8;:15;;;;1479:1;:19;1462:178;;;1538:10;1523:25;;:8;1532:1;1523:11;;;;;;;;;;;;;;;;;;;;;;;;;:25;;;1519:108;;;1576:5;1568:44;;;;;;;;;;;;;;;;;;;;;;;;;;;::::0;::::1;;;;;;;;;;;;;1519:108;1500:3;;;;;;;1462:178;;;;2463:1:::2;2420:45;;:19;:31;2440:10;2420:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;2399:132;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2583:10;2541:27;:39;2569:10;2541:39;;;;;;;;;;;;;;;;:52;;;;;;;;;;;;;;;;;;2603:15;2624:10;2603:32;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2650:43;2670:10;2682;2650:43;;;;;;;;;;;;;;;;;;;;;;;;;;;;2268:432:::0;:::o;2706:119::-;2788:30;2800:17;2788:11;:30::i;:::-;2706:119;:::o;7955:300:14:-;8114:41;8133:12;:10;:12::i;:::-;8147:7;8114:18;:41::i;:::-;8106:103;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;8220:28;8230:4;8236:2;8240:7;8220:9;:28::i;:::-;7955:300;;;:::o;3533:198:2:-;3607:16;3625;3664:60;3682:8;3692:19;3713:10;3664:17;:60::i;:::-;3657:67;;;;3533:198;;:::o;5952:152:14:-;6041:7;6067:30;6091:5;6067:13;:20;6081:5;6067:20;;;;;;;;;;;;;;;:23;;:30;;;;:::i;:::-;6060:37;;5952:152;;;;:::o;8321:149::-;8424:39;8441:4;8447:2;8451:7;8424:39;;;;;;;;;;;;:16;:39::i;:::-;8321:149;;;:::o;6447:161::-;6514:7;6534:15;6555:22;6571:5;6555:12;:15;;:22;;;;:::i;:::-;6533:44;;;6594:7;6587:14;;;6447:161;;;:::o;4271:167::-;4335:7;4361:70;4378:7;4361:70;;;;;;;;;;;;;;;;;:12;:16;;:70;;;;;:::i;:::-;4354:77;;4271:167;;;:::o;3812:296:2:-;3895:16;3913;3964:137;3999:15;4032:27;4077:10;3964:17;:137::i;:::-;3945:156;;;;3812:296;;:::o;5786:87:14:-;5826:13;5858:8;5851:15;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5786:87;:::o;4003:211::-;4067:7;4111:1;4094:19;;:5;:19;;;;4086:74;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4178:29;:13;:20;4192:5;4178:20;;;;;;;;;;;;;;;:27;:29::i;:::-;4171:36;;4003:211;;;:::o;1706:145:8:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1812:1:::1;1775:40;;1796:6;;;;;;;;;;;1775:40;;;;;;;;;;;;1842:1;1825:6;;:19;;;;;;;;;;;;;;;;;;1706:145::o:0;875:210:0:-;952:35;971:7;980:6;952:18;:35::i;:::-;997:34;1015:7;1024:6;997:17;:34::i;:::-;1062:7;1046:32;;;1071:6;1046:32;;;;;;;;;;;;;;;;;;875:210;;:::o;1083:77:8:-;1121:7;1147:6;;;;;;;;;;;1140:13;;1083:77;:::o;4654:94:14:-;4702:13;4734:7;4727:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4654:94;:::o;7383:290::-;7497:12;:10;:12::i;:::-;7485:24;;:8;:24;;;;7477:62;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7595:8;7550:18;:32;7569:12;:10;:12::i;:::-;7550:32;;;;;;;;;;;;;;;:42;7583:8;7550:42;;;;;;;;;;;;;;;;:53;;;;;;;;;;;;;;;;;;7647:8;7618:48;;7633:12;:10;:12::i;:::-;7618:48;;;7657:8;7618:48;;;;;;;;;;;;;;;;;;;;7383:290;;:::o;1690:257:3:-;998:17;:29;1016:10;998:29;;;;;;;;;;;;;;;;;;;;;;;;;960:67;;967:27;987:6;967:15;:19;;:27;;;;:::i;:::-;960:67;;;939:98;;;;;;1135:1:2::1;1092:45;;:19;:31;1112:10;1092:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1084:54;;;::::0;::::1;;1788:15:3::2;1759:14;:26;1774:10;1759:26;;;;;;;;;;;;;;;:44;;;;1852:27;1872:6;1852:15;:19;;:27;;;;:::i;:::-;1813:17;:29;1831:10;1813:29;;;;;;;;;;;;;;;;:67;;;;;;;;;;;;;;;;;;1912:10;1895:45;;;1924:15;1895:45;;;;;;;;;;;;;;;;;;1690:257::o:0;8536:282:14:-;8667:41;8686:12;:10;:12::i;:::-;8700:7;8667:18;:41::i;:::-;8659:103;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;8772:39;8786:4;8792:2;8796:7;8805:5;8772:13;:39::i;:::-;8536:282;;;;:::o;1999:443:3:-;1135:1:2;1092:45;;:19;:31;1112:10;1092:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1084:54;;;;;;2052:16:3::1;2071:15;2052:34;;2116:14;:26;2131:10;2116:26;;;;;;;;;;;;;;;;2104:8;:38;;2096:47;;;::::0;::::1;;2153:18;2237:7;2193:40;2206:14;:26;2221:10;2206:26;;;;;;;;;;;;;;;;2193:8;:12;;:40;;;;:::i;:::-;:51;2189:171;;2312:4;2296:20;;2330:19;2338:10;2330:7;:19::i;:::-;2189:171;2392:10;2374:61;;;2404:15;2421:13;2374:61;;;;;;;;;;;;;;;;;;;;;;;;;;1148:1:2;;1999:443:3:o:0;4814:740:14:-;4879:13;4912:16;4920:7;4912;:16::i;:::-;4904:76;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4991:23;5017:10;:19;5028:7;5017:19;;;;;;;;;;;4991:45;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5135:1;5115:8;5109:22;;;;;;;;;;;;;;;;:27;5105:74;;;5159:9;5152:16;;;;;5105:74;5307:1;5287:9;5281:23;:27;5277:110;;;5355:8;5365:9;5338:37;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5324:52;;;;;5277:110;5517:8;5527:18;:7;:16;:18::i;:::-;5500:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5486:61;;;4814:740;;;;:::o;511:358:0:-;582:9;577:123;601:21;:30;623:7;601:30;;;;;;;;;;;;;;;:37;;;;597:1;:41;577:123;;;659:30;678:7;687:1;659:18;:30::i;:::-;640:3;;;;;;;577:123;;;;747:7;714:101;;;768:21;:30;790:7;768:30;;;;;;;;;;;;;;;:37;;;;714:101;;;;;;;;;;;;;;;;;;832:21;:30;854:7;832:30;;;;;;;;;;;;;;;;825:37;;;;:::i;:::-;511:358;:::o;679:49:3:-;;;;;;;;;;;;;;;;;:::o;7739:154:14:-;7828:4;7851:18;:25;7870:5;7851:25;;;;;;;;;;;;;;;:35;7877:8;7851:35;;;;;;;;;;;;;;;;;;;;;;;;;7844:42;;7739:154;;;;:::o;2000:240:8:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;1465:172:3:-;1561:16;1600:21;:30;1622:7;1600:30;;;;;;;;;;;;;;;1593:37;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1465:172;;;:::o;10252:117:14:-;10309:4;10332:30;10354:7;10332:12;:21;;:30;;;;:::i;:::-;10325:37;;10252:117;;;:::o;598:104:7:-;651:15;685:10;678:17;;598:104;:::o;15908:155:14:-;16000:2;15973:15;:24;15989:7;15973:24;;;;;;;;;;;;:29;;;;;;;;;;;;;;;;;;16048:7;16044:2;16017:39;;16026:16;16034:7;16026;:16::i;:::-;16017:39;;;;;;;;;;;;15908:155;;:::o;7031:121:21:-;7100:7;7126:19;7134:3;:10;;7126:7;:19::i;:::-;7119:26;;7031:121;;;:::o;2873:654:2:-;2939:15;2957;2973:17;2957:34;;;;;;;;;;;;;;;;;;;;;;;;;2939:52;;3062:1;3022:42;;:19;:28;3042:7;3022:28;;;;;;;;;;;;;;;;;;;;;;;;;:42;;;3001:129;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3201:10;3161:50;;:27;:36;3189:7;3161:36;;;;;;;;;;;;;;;;;;;;;;;;;:50;;;3140:134;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3316:10;3285:19;:28;3305:7;3285:28;;;;;;;;;;;;;;;;:41;;;;;;;;;;;;;;;;;;3336:8;3350:7;3336:22;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3368:44;3394:17;3368:15;:25;;:44;;;;:::i;:::-;3429:27;:36;3457:7;3429:36;;;;;;;;;;;;;;;;3422:43;;;;;;;;;;;3480:40;3500:10;3512:7;3480:40;;;;;;;;;;;;;;;;;;;;;;;;;;;;2873:654;;:::o;10527:329:14:-;10612:4;10636:16;10644:7;10636;:16::i;:::-;10628:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;10711:13;10727:16;10735:7;10727;:16::i;:::-;10711:32;;10772:5;10761:16;;:7;:16;;;:51;;;;10805:7;10781:31;;:20;10793:7;10781:11;:20::i;:::-;:31;;;10761:51;:87;;;;10816:32;10833:5;10840:7;10816:16;:32::i;:::-;10761:87;10753:96;;;10527:329;;;;:::o;13521:559::-;13638:4;13618:24;;:16;13626:7;13618;:16::i;:::-;:24;;;13610:78;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;13720:1;13706:16;;:2;:16;;;;13698:65;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;13774:39;13795:4;13801:2;13805:7;13774:20;:39::i;:::-;13875:29;13892:1;13896:7;13875:8;:29::i;:::-;13915:35;13942:7;13915:13;:19;13929:4;13915:19;;;;;;;;;;;;;;;:26;;:35;;;;:::i;:::-;;13960:30;13982:7;13960:13;:17;13974:2;13960:17;;;;;;;;;;;;;;;:21;;:30;;;;:::i;:::-;;14001:29;14018:7;14027:2;14001:12;:16;;:29;;;;;:::i;:::-;;14065:7;14061:2;14046:27;;14055:4;14046:27;;;;;;;;;;;;13521:559;;;:::o;4114:1225:2:-;4293:16;4311;4339:13;4371:9;4366:219;4390:9;:16;;;;4386:1;:20;4366:219;;;4436:15;4454:9;4464:1;4454:12;;;;;;;;;;;;;;;;;;;;;;;;;4436:30;;4510:10;4484:36;;:13;:22;4498:7;4484:22;;;;;;;;;;;;;;;;;;;;;;;;;:36;;;4480:95;;;4548:12;4558:1;4548:5;:9;;:12;;;;:::i;:::-;4540:20;;4480:95;4366:219;4412:8;4418:1;4412;:5;;:8;;;;:::i;:::-;4408:12;;4366:219;;;;4594:29;4640:5;4626:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4594:52;;4656:33;4706:5;4692:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4656:56;;4723:9;4751;4746:538;4770:9;:16;;;;4766:1;:20;4746:538;;;4816:15;4834:9;4844:1;4834:12;;;;;;;;;;;;;;;;;;;;;;;;;4816:30;;4890:10;4864:36;;:13;:22;4878:7;4864:22;;;;;;;;;;;;;;;;;;;;;;;;;:36;;;4860:414;;;4938:7;4920:12;4933:1;4920:15;;;;;;;;;;;;;:25;;;;;;;;;;;4985:1;4963:16;4980:1;4963:19;;;;;;;;;;;;;:23;;;;;5008:8;5014:1;5008;:5;;:8;;;;:::i;:::-;5004:12;;5177:1;5168:5;:10;5164:96;;5210:12;5224:16;5202:39;;;;;;;;;;;;5164:96;4860:414;4746:538;4792:8;4798:1;4792;:5;;:8;;;;:::i;:::-;4788:12;;4746:538;;;;5301:12;5315:16;5293:39;;;;;;;;4114:1225;;;;;;;:::o;9214:135:22:-;9285:7;9319:22;9323:3;:10;;9335:5;9319:3;:22::i;:::-;9311:31;;9304:38;;9214:135;;;;:::o;7480:224:21:-;7560:7;7569;7589:11;7602:13;7619:22;7623:3;:10;;7635:5;7619:3;:22::i;:::-;7588:53;;;;7667:3;7659:12;;7689:5;7681:14;;7651:46;;;;;;7480:224;;;;;:::o;8123:202::-;8230:7;8272:44;8277:3;:10;;8297:3;8289:12;;8303;8272:4;:44::i;:::-;8264:53;;8249:69;;8123:202;;;;;:::o;8770:112:22:-;8830:7;8856:19;8864:3;:10;;8856:7;:19::i;:::-;8849:26;;8770:112;;;:::o;1091:176:0:-;1171:13;1187:21;:30;1209:7;1187:30;;;;;;;;;;;;;;;1218:6;1187:38;;;;;;;;;;;;;;;;1171:54;;1235:25;1245:7;1254:5;1235:9;:25::i;:::-;1091:176;;;:::o;2641:323:3:-;2746:6;2741:1;:11;;:61;;;;;2765:21;:30;2787:7;2765:30;;;;;;;;;;;;;;;:37;;;;2756:6;:46;2741:61;2720:179;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2909:48;2950:6;2909:21;:30;2931:7;2909:30;;;;;;;;;;;;;;;:40;;:48;;;;:::i;:::-;2641:323;;:::o;3109:130:11:-;3167:7;3193:39;3197:1;3200;3193:39;;;;;;;;;;;;;;;;;:3;:39::i;:::-;3186:46;;3109:130;;;;:::o;9680:269:14:-;9793:28;9803:4;9809:2;9813:7;9793:9;:28::i;:::-;9839:48;9862:4;9868:2;9872:7;9881:5;9839:22;:48::i;:::-;9831:111;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;9680:269;;;;:::o;1329:134:11:-;1387:7;1413:43;1417:1;1420;1413:43;;;;;;;;;;;;;;;;;:3;:43::i;:::-;1406:50;;1329:134;;;;:::o;2448:187:3:-;1135:1:2;1092:45;;:19;:31;1112:10;1092:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1084:54;;;;;;2508:21:3::1;:9;:19;:21::i;:::-;2539:16;2558:19;:9;:17;:19::i;:::-;2539:38;;2587:21;:26;2609:3;2587:26;;;;;;;;;;;;;;;2619:8;2587:41;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1148:1:2;2448:187:3::0;:::o;210:723:23:-;266:13;492:1;483:5;:10;479:51;;;509:10;;;;;;;;;;;;;;;;;;;;;479:51;539:12;554:5;539:20;;569:14;593:75;608:1;600:4;:9;593:75;;625:8;;;;;;;655:2;647:10;;;;;;;;;593:75;;;677:19;709:6;699:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;677:39;;726:13;751:1;742:6;:10;726:26;;769:5;762:12;;784:112;799:1;791:4;:9;784:112;;857:2;850:4;:9;;;;;;845:2;:14;834:27;;816:6;823:7;;;;;;;816:15;;;;;;;;;;;:45;;;;;;;;;;;883:2;875:10;;;;;;;;;784:112;;;919:6;905:21;;;;;;210:723;;;;:::o;6799:149:21:-;6883:4;6906:35;6916:3;:10;;6936:3;6928:12;;6906:9;:35::i;:::-;6899:42;;6799:149;;;;:::o;4491:108::-;4547:7;4573:3;:12;;:19;;;;4566:26;;4491:108;;;:::o;93:300:5:-;193:3;188:1;:8;;:28;;;;;206:3;:10;;;;200:3;:16;188:28;167:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;294:19;329:1;316:3;:10;;;;:14;294:36;;351:3;355:11;351:16;;;;;;;;;;;;;;;;;;;;;;;;;340:3;344;340:8;;;;;;;;;;;;;;;;:27;;;;;;;;;;;;;;;;;;377:3;:9;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;93:300;;;:::o;16659:93:14:-;;;;:::o;8329:135:22:-;8399:4;8422:35;8430:3;:10;;8450:5;8442:14;;8422:7;:35::i;:::-;8415:42;;8329:135;;;;:::o;8032:129::-;8099:4;8122:32;8127:3;:10;;8147:5;8139:14;;8122:4;:32::i;:::-;8115:39;;8032:129;;;;:::o;6247:174:21:-;6336:4;6359:55;6364:3;:10;;6384:3;6376:12;;6406:5;6398:14;;6390:23;;6359:4;:55::i;:::-;6352:62;;6247:174;;;;;:::o;882:176:11:-;940:7;959:9;975:1;971;:5;959:17;;999:1;994;:6;;986:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1050:1;1043:8;;;882:176;;;;:::o;4452:201:22:-;4519:7;4567:5;4546:3;:11;;:18;;;;:26;4538:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4628:3;:11;;4640:5;4628:18;;;;;;;;;;;;;;;;4621:25;;4452:201;;;;:::o;4942:274:21:-;5009:7;5018;5067:5;5045:3;:12;;:19;;;;:27;5037:74;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5122:22;5147:3;:12;;5160:5;5147:19;;;;;;;;;;;;;;;;;;5122:44;;5184:5;:10;;;5196:5;:12;;;5176:33;;;;;4942:274;;;;;:::o;5623:315::-;5717:7;5736:16;5755:3;:12;;:17;5768:3;5755:17;;;;;;;;;;;;5736:36;;5802:1;5790:8;:13;;5805:12;5782:36;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5871:3;:12;;5895:1;5884:8;:12;5871:26;;;;;;;;;;;;;;;;;;:33;;;5864:40;;;5623:315;;;;;:::o;4013:107:22:-;4069:7;4095:3;:11;;:18;;;;4088:25;;4013:107;;;:::o;11187:108:14:-;11262:26;11272:2;11276:7;11262:26;;;;;;;;;;;;:9;:26::i;:::-;11187:108;;:::o;93:300:6:-;193:3;188:1;:8;;:28;;;;;206:3;:10;;;;200:3;:16;188:28;167:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;294:19;329:1;316:3;:10;;;;:14;294:36;;351:3;355:11;351:16;;;;;;;;;;;;;;;;340:3;344;340:8;;;;;;;;;;;;;;;:27;;;;377:3;:9;;;;;;;;;;;;;;;;;;;;;;;;93:300;;;:::o;3721:272:11:-;3807:7;3838:1;3834;:5;3841:12;3826:28;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3864:9;3880:1;3876;:5;;;;;;3864:17;;3985:1;3978:8;;;3721:272;;;;;:::o;15313:589:14:-;15433:4;15458:15;:2;:13;;;:15::i;:::-;15453:58;;15496:4;15489:11;;;;15453:58;15520:23;15546:246;15598:45;;;15657:12;:10;:12::i;:::-;15683:4;15701:7;15722:5;15562:175;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;15546:246;;;;;;;;;;;;;;;;;:2;:15;;;;:246;;;;;:::i;:::-;15520:272;;15802:13;15829:10;15818:32;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;15802:48;;1076:10;15878:16;;15868:26;;;:6;:26;;;;15860:35;;;;15313:589;;;;;;;:::o;1754:187:11:-;1840:7;1872:1;1867;:6;;1875:12;1859:29;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1898:9;1914:1;1910;:5;1898:17;;1933:1;1926:8;;;1754:187;;;;;:::o;1224:178:20:-;1394:1;1376:7;:14;;;:19;;;;;;;;;;;1224:178;:::o;1106:112::-;1171:7;1197;:14;;;1190:21;;1106:112;;;:::o;4278:123:21:-;4349:4;4393:1;4372:3;:12;;:17;4385:3;4372:17;;;;;;;;;;;;:22;;4365:29;;4278:123;;;;:::o;2212:1512:22:-;2278:4;2394:18;2415:3;:12;;:19;2428:5;2415:19;;;;;;;;;;;;2394:40;;2463:1;2449:10;:15;2445:1273;;2806:21;2843:1;2830:10;:14;2806:38;;2858:17;2899:1;2878:3;:11;;:18;;;;:22;2858:42;;3140:17;3160:3;:11;;3172:9;3160:22;;;;;;;;;;;;;;;;3140:42;;3303:9;3274:3;:11;;3286:13;3274:26;;;;;;;;;;;;;;;:38;;;;3420:1;3404:13;:17;3378:3;:12;;:23;3391:9;3378:23;;;;;;;;;;;:43;;;;3527:3;:11;;:17;;;;;;;;;;;;;;;;;;;;;;;;3619:3;:12;;:19;3632:5;3619:19;;;;;;;;;;;3612:26;;;3660:4;3653:11;;;;;;;;2445:1273;3702:5;3695:12;;;2212:1512;;;;;:::o;1640:404::-;1703:4;1724:21;1734:3;1739:5;1724:9;:21::i;:::-;1719:319;;1761:3;:11;;1778:5;1761:23;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1941:3;:11;;:18;;;;1919:3;:12;;:19;1932:5;1919:19;;;;;;;;;;;:40;;;;1980:4;1973:11;;;;1719:319;2022:5;2015:12;;1640:404;;;;;:::o;1836:678:21:-;1912:4;2026:16;2045:3;:12;;:17;2058:3;2045:17;;;;;;;;;;;;2026:36;;2089:1;2077:8;:13;2073:435;;;2143:3;:12;;2161:38;;;;;;;;2178:3;2161:38;;;;2191:5;2161:38;;;2143:57;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2355:3;:12;;:19;;;;2335:3;:12;;:17;2348:3;2335:17;;;;;;;;;;;:39;;;;2395:4;2388:11;;;;;2073:435;2466:5;2430:3;:12;;2454:1;2443:8;:12;2430:26;;;;;;;;;;;;;;;;;;:33;;:41;;;;2492:5;2485:12;;;1836:678;;;;;;:::o;11516:247:14:-;11611:18;11617:2;11621:7;11611:5;:18::i;:::-;11647:54;11678:1;11682:2;11686:7;11695:5;11647:22;:54::i;:::-;11639:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;11516:247;;;:::o;726:413:19:-;786:4;989:12;1098:7;1086:20;1078:28;;1131:1;1124:4;:8;1117:15;;;726:413;;;:::o;3581:193::-;3684:12;3715:52;3737:6;3745:4;3751:1;3754:12;3715:21;:52::i;:::-;3708:59;;3581:193;;;;;:::o;3805:127:22:-;3878:4;3924:1;3901:3;:12;;:19;3914:5;3901:19;;;;;;;;;;;;:24;;3894:31;;3805:127;;;;:::o;12085:393:14:-;12178:1;12164:16;;:2;:16;;;;12156:61;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;12236:16;12244:7;12236;:16::i;:::-;12235:17;12227:58;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;12296:45;12325:1;12329:2;12333:7;12296:20;:45::i;:::-;12352:30;12374:7;12352:13;:17;12366:2;12352:17;;;;;;;;;;;;;;;:21;;:30;;;;:::i;:::-;;12393:29;12410:7;12419:2;12393:12;:16;;:29;;;;;:::i;:::-;;12463:7;12459:2;12438:33;;12455:1;12438:33;;;;;;;;;;;;12085:393;;:::o;4608:523:19:-;4735:12;4792:5;4767:21;:30;;4759:81;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4858:18;4869:6;4858:10;:18::i;:::-;4850:60;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4981:12;4995:23;5022:6;:11;;5042:5;5050:4;5022:33;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4980:75;;;;5072:52;5090:7;5099:10;5111:12;5072:17;:52::i;:::-;5065:59;;;;4608:523;;;;;;:::o;6111:725::-;6226:12;6254:7;6250:580;;;6284:10;6277:17;;;;6250:580;6415:1;6395:10;:17;:21;6391:429;;;6653:10;6647:17;6713:15;6700:10;6696:2;6692:19;6685:44;6602:145;6792:12;6785:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;6111:725;;;;;;:::o;-1:-1:-1:-;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;:::o";
    var source = "pragma solidity ^0.7.0;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\nimport \"@openzeppelin/contracts/math/SafeMath.sol\";\nimport \"./StudentColl.sol\";\n\n/// @dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour\n/// A supervisor can then approve the coin\ncontract EvieCoin is StudentColl {\n    using SafeMath for uint256;\n    using SafeMath for uint256;\n\n    constructor() StudentColl() {}\n\n    function SupervisorApproveAll(address student) external {\n        for (uint256 i = 0; i < pendingCollectibleIds[student].length; i++) {\n            _supervisorApprove(student, i);\n        }\n        emit PayoutMadeMultEvent(\n            student,\n            pendingCollectibleIds[student].length\n        );\n        delete pendingCollectibleIds[student];\n    }\n\n    function SupervisorApprove(address student, uint256 tokInd) public {\n        _supervisorApprove(student, tokInd);\n        removeFromPending(student, tokInd);\n        emit PayoutMadeEvent(student, tokInd);\n    }\n\n    function _supervisorApprove(address student, uint256 tokInd) internal {\n        uint256 tokId = pendingCollectibleIds[student][tokInd];\n        _safeMint(student, tokId);\n    }\n}\n";
    var sourcePath = "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol";
    var ast = {
    	absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    	exportedSymbols: {
    		EvieCoin: [
    			104
    		]
    	},
    	id: 105,
    	license: null,
    	nodeType: "SourceUnit",
    	nodes: [
    		{
    			id: 1,
    			literals: [
    				"solidity",
    				"^",
    				"0.7",
    				".0"
    			],
    			nodeType: "PragmaDirective",
    			src: "0:23:0"
    		},
    		{
    			absolutePath: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    			file: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    			id: 2,
    			nodeType: "ImportDirective",
    			scope: 105,
    			sourceUnit: 1888,
    			src: "25:55:0",
    			symbolAliases: [
    			],
    			unitAlias: ""
    		},
    		{
    			absolutePath: "@openzeppelin/contracts/access/Ownable.sol",
    			file: "@openzeppelin/contracts/access/Ownable.sol",
    			id: 3,
    			nodeType: "ImportDirective",
    			scope: 105,
    			sourceUnit: 1120,
    			src: "81:52:0",
    			symbolAliases: [
    			],
    			unitAlias: ""
    		},
    		{
    			absolutePath: "@openzeppelin/contracts/math/SafeMath.sol",
    			file: "@openzeppelin/contracts/math/SafeMath.sol",
    			id: 4,
    			nodeType: "ImportDirective",
    			scope: 105,
    			sourceUnit: 1385,
    			src: "134:51:0",
    			symbolAliases: [
    			],
    			unitAlias: ""
    		},
    		{
    			absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/StudentColl.sol",
    			file: "./StudentColl.sol",
    			id: 5,
    			nodeType: "ImportDirective",
    			scope: 105,
    			sourceUnit: 895,
    			src: "186:27:0",
    			symbolAliases: [
    			],
    			unitAlias: ""
    		},
    		{
    			abstract: false,
    			baseContracts: [
    				{
    					"arguments": null,
    					baseName: {
    						contractScope: null,
    						id: 7,
    						name: "StudentColl",
    						nodeType: "UserDefinedTypeName",
    						referencedDeclaration: 894,
    						src: "392:11:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_StudentColl_$894",
    							typeString: "contract StudentColl"
    						}
    					},
    					id: 8,
    					nodeType: "InheritanceSpecifier",
    					src: "392:11:0"
    				}
    			],
    			contractDependencies: [
    				630,
    				894,
    				1010,
    				1119,
    				1176,
    				1188,
    				2896,
    				3012,
    				3043,
    				3070
    			],
    			contractKind: "contract",
    			documentation: {
    				id: 6,
    				nodeType: "StructuredDocumentation",
    				src: "215:156:0",
    				text: "@dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour\n A supervisor can then approve the coin"
    			},
    			fullyImplemented: true,
    			id: 104,
    			linearizedBaseContracts: [
    				104,
    				894,
    				630,
    				1119,
    				2896,
    				3043,
    				3070,
    				3012,
    				1176,
    				1188,
    				1010
    			],
    			name: "EvieCoin",
    			nodeType: "ContractDefinition",
    			nodes: [
    				{
    					id: 11,
    					libraryName: {
    						contractScope: null,
    						id: 9,
    						name: "SafeMath",
    						nodeType: "UserDefinedTypeName",
    						referencedDeclaration: 1384,
    						src: "416:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$1384",
    							typeString: "library SafeMath"
    						}
    					},
    					nodeType: "UsingForDirective",
    					src: "410:27:0",
    					typeName: {
    						id: 10,
    						name: "uint256",
    						nodeType: "ElementaryTypeName",
    						src: "429:7:0",
    						typeDescriptions: {
    							typeIdentifier: "t_uint256",
    							typeString: "uint256"
    						}
    					}
    				},
    				{
    					id: 14,
    					libraryName: {
    						contractScope: null,
    						id: 12,
    						name: "SafeMath",
    						nodeType: "UserDefinedTypeName",
    						referencedDeclaration: 1384,
    						src: "448:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$1384",
    							typeString: "library SafeMath"
    						}
    					},
    					nodeType: "UsingForDirective",
    					src: "442:27:0",
    					typeName: {
    						id: 13,
    						name: "uint256",
    						nodeType: "ElementaryTypeName",
    						src: "461:7:0",
    						typeDescriptions: {
    							typeIdentifier: "t_uint256",
    							typeString: "uint256"
    						}
    					}
    				},
    				{
    					body: {
    						id: 19,
    						nodeType: "Block",
    						src: "503:2:0",
    						statements: [
    						]
    					},
    					documentation: null,
    					id: 20,
    					implemented: true,
    					kind: "constructor",
    					modifiers: [
    						{
    							"arguments": [
    							],
    							id: 17,
    							modifierName: {
    								argumentTypes: null,
    								id: 16,
    								name: "StudentColl",
    								nodeType: "Identifier",
    								overloadedDeclarations: [
    								],
    								referencedDeclaration: 894,
    								src: "489:11:0",
    								typeDescriptions: {
    									typeIdentifier: "t_type$_t_contract$_StudentColl_$894_$",
    									typeString: "type(contract StudentColl)"
    								}
    							},
    							nodeType: "ModifierInvocation",
    							src: "489:13:0"
    						}
    					],
    					name: "",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 15,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "486:2:0"
    					},
    					returnParameters: {
    						id: 18,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "503:0:0"
    					},
    					scope: 104,
    					src: "475:30:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 58,
    						nodeType: "Block",
    						src: "567:302:0",
    						statements: [
    							{
    								body: {
    									id: 43,
    									nodeType: "Block",
    									src: "645:55:0",
    									statements: [
    										{
    											expression: {
    												argumentTypes: null,
    												"arguments": [
    													{
    														argumentTypes: null,
    														id: 39,
    														name: "student",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 22,
    														src: "678:7:0",
    														typeDescriptions: {
    															typeIdentifier: "t_address",
    															typeString: "address"
    														}
    													},
    													{
    														argumentTypes: null,
    														id: 40,
    														name: "i",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 26,
    														src: "687:1:0",
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													}
    												],
    												expression: {
    													argumentTypes: [
    														{
    															typeIdentifier: "t_address",
    															typeString: "address"
    														},
    														{
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													],
    													id: 38,
    													name: "_supervisorApprove",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 103,
    													src: "659:18:0",
    													typeDescriptions: {
    														typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    														typeString: "function (address,uint256)"
    													}
    												},
    												id: 41,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												kind: "functionCall",
    												lValueRequested: false,
    												names: [
    												],
    												nodeType: "FunctionCall",
    												src: "659:30:0",
    												tryCall: false,
    												typeDescriptions: {
    													typeIdentifier: "t_tuple$__$",
    													typeString: "tuple()"
    												}
    											},
    											id: 42,
    											nodeType: "ExpressionStatement",
    											src: "659:30:0"
    										}
    									]
    								},
    								condition: {
    									argumentTypes: null,
    									commonType: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									},
    									id: 34,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									leftExpression: {
    										argumentTypes: null,
    										id: 29,
    										name: "i",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 26,
    										src: "597:1:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									nodeType: "BinaryOperation",
    									operator: "<",
    									rightExpression: {
    										argumentTypes: null,
    										expression: {
    											argumentTypes: null,
    											baseExpression: {
    												argumentTypes: null,
    												id: 30,
    												name: "pendingCollectibleIds",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 664,
    												src: "601:21:0",
    												typeDescriptions: {
    													typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    													typeString: "mapping(address => uint256[] storage ref)"
    												}
    											},
    											id: 32,
    											indexExpression: {
    												argumentTypes: null,
    												id: 31,
    												name: "student",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 22,
    												src: "623:7:0",
    												typeDescriptions: {
    													typeIdentifier: "t_address",
    													typeString: "address"
    												}
    											},
    											isConstant: false,
    											isLValue: true,
    											isPure: false,
    											lValueRequested: false,
    											nodeType: "IndexAccess",
    											src: "601:30:0",
    											typeDescriptions: {
    												typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    												typeString: "uint256[] storage ref"
    											}
    										},
    										id: 33,
    										isConstant: false,
    										isLValue: false,
    										isPure: false,
    										lValueRequested: false,
    										memberName: "length",
    										nodeType: "MemberAccess",
    										referencedDeclaration: null,
    										src: "601:37:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									src: "597:41:0",
    									typeDescriptions: {
    										typeIdentifier: "t_bool",
    										typeString: "bool"
    									}
    								},
    								id: 44,
    								initializationExpression: {
    									assignments: [
    										26
    									],
    									declarations: [
    										{
    											constant: false,
    											id: 26,
    											mutability: "mutable",
    											name: "i",
    											nodeType: "VariableDeclaration",
    											overrides: null,
    											scope: 44,
    											src: "582:9:0",
    											stateVariable: false,
    											storageLocation: "default",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											},
    											typeName: {
    												id: 25,
    												name: "uint256",
    												nodeType: "ElementaryTypeName",
    												src: "582:7:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											value: null,
    											visibility: "internal"
    										}
    									],
    									id: 28,
    									initialValue: {
    										argumentTypes: null,
    										hexValue: "30",
    										id: 27,
    										isConstant: false,
    										isLValue: false,
    										isPure: true,
    										kind: "number",
    										lValueRequested: false,
    										nodeType: "Literal",
    										src: "594:1:0",
    										subdenomination: null,
    										typeDescriptions: {
    											typeIdentifier: "t_rational_0_by_1",
    											typeString: "int_const 0"
    										},
    										value: "0"
    									},
    									nodeType: "VariableDeclarationStatement",
    									src: "582:13:0"
    								},
    								loopExpression: {
    									expression: {
    										argumentTypes: null,
    										id: 36,
    										isConstant: false,
    										isLValue: false,
    										isPure: false,
    										lValueRequested: false,
    										nodeType: "UnaryOperation",
    										operator: "++",
    										prefix: false,
    										src: "640:3:0",
    										subExpression: {
    											argumentTypes: null,
    											id: 35,
    											name: "i",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 26,
    											src: "640:1:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										},
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									id: 37,
    									nodeType: "ExpressionStatement",
    									src: "640:3:0"
    								},
    								nodeType: "ForStatement",
    								src: "577:123:0"
    							},
    							{
    								eventCall: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 46,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 22,
    											src: "747:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												baseExpression: {
    													argumentTypes: null,
    													id: 47,
    													name: "pendingCollectibleIds",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 664,
    													src: "768:21:0",
    													typeDescriptions: {
    														typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    														typeString: "mapping(address => uint256[] storage ref)"
    													}
    												},
    												id: 49,
    												indexExpression: {
    													argumentTypes: null,
    													id: 48,
    													name: "student",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 22,
    													src: "790:7:0",
    													typeDescriptions: {
    														typeIdentifier: "t_address",
    														typeString: "address"
    													}
    												},
    												isConstant: false,
    												isLValue: true,
    												isPure: false,
    												lValueRequested: false,
    												nodeType: "IndexAccess",
    												src: "768:30:0",
    												typeDescriptions: {
    													typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    													typeString: "uint256[] storage ref"
    												}
    											},
    											id: 50,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "length",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "768:37:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 45,
    										name: "PayoutMadeMultEvent",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 700,
    										src: "714:19:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_event_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 51,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "714:101:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 52,
    								nodeType: "EmitStatement",
    								src: "709:106:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									id: 56,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									nodeType: "UnaryOperation",
    									operator: "delete",
    									prefix: true,
    									src: "825:37:0",
    									subExpression: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 53,
    											name: "pendingCollectibleIds",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 664,
    											src: "832:21:0",
    											typeDescriptions: {
    												typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    												typeString: "mapping(address => uint256[] storage ref)"
    											}
    										},
    										id: 55,
    										indexExpression: {
    											argumentTypes: null,
    											id: 54,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 22,
    											src: "854:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										isConstant: false,
    										isLValue: true,
    										isPure: false,
    										lValueRequested: true,
    										nodeType: "IndexAccess",
    										src: "832:30:0",
    										typeDescriptions: {
    											typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    											typeString: "uint256[] storage ref"
    										}
    									},
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 57,
    								nodeType: "ExpressionStatement",
    								src: "825:37:0"
    							}
    						]
    					},
    					documentation: null,
    					functionSelector: "d25eab2d",
    					id: 59,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    					],
    					name: "SupervisorApproveAll",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 23,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 22,
    								mutability: "mutable",
    								name: "student",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 59,
    								src: "541:15:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 21,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "541:7:0",
    									stateMutability: "nonpayable",
    									typeDescriptions: {
    										typeIdentifier: "t_address",
    										typeString: "address"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "540:17:0"
    					},
    					returnParameters: {
    						id: 24,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "567:0:0"
    					},
    					scope: 104,
    					src: "511:358:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "external"
    				},
    				{
    					body: {
    						id: 81,
    						nodeType: "Block",
    						src: "942:143:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 67,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "971:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 68,
    											name: "tokInd",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 63,
    											src: "980:6:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 66,
    										name: "_supervisorApprove",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 103,
    										src: "952:18:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 69,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "952:35:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 70,
    								nodeType: "ExpressionStatement",
    								src: "952:35:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 72,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "1015:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 73,
    											name: "tokInd",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 63,
    											src: "1024:6:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 71,
    										name: "removeFromPending",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 893,
    										src: "997:17:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 74,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "997:34:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 75,
    								nodeType: "ExpressionStatement",
    								src: "997:34:0"
    							},
    							{
    								eventCall: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 77,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "1062:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 78,
    											name: "tokInd",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 63,
    											src: "1071:6:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 76,
    										name: "PayoutMadeEvent",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 706,
    										src: "1046:15:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_event_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 79,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1046:32:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 80,
    								nodeType: "EmitStatement",
    								src: "1041:37:0"
    							}
    						]
    					},
    					documentation: null,
    					functionSelector: "7aa0c589",
    					id: 82,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    					],
    					name: "SupervisorApprove",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 64,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 61,
    								mutability: "mutable",
    								name: "student",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 82,
    								src: "902:15:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 60,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "902:7:0",
    									stateMutability: "nonpayable",
    									typeDescriptions: {
    										typeIdentifier: "t_address",
    										typeString: "address"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							},
    							{
    								constant: false,
    								id: 63,
    								mutability: "mutable",
    								name: "tokInd",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 82,
    								src: "919:14:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 62,
    									name: "uint256",
    									nodeType: "ElementaryTypeName",
    									src: "919:7:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "901:33:0"
    					},
    					returnParameters: {
    						id: 65,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "942:0:0"
    					},
    					scope: 104,
    					src: "875:210:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 102,
    						nodeType: "Block",
    						src: "1161:106:0",
    						statements: [
    							{
    								assignments: [
    									90
    								],
    								declarations: [
    									{
    										constant: false,
    										id: 90,
    										mutability: "mutable",
    										name: "tokId",
    										nodeType: "VariableDeclaration",
    										overrides: null,
    										scope: 102,
    										src: "1171:13:0",
    										stateVariable: false,
    										storageLocation: "default",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										},
    										typeName: {
    											id: 89,
    											name: "uint256",
    											nodeType: "ElementaryTypeName",
    											src: "1171:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										},
    										value: null,
    										visibility: "internal"
    									}
    								],
    								id: 96,
    								initialValue: {
    									argumentTypes: null,
    									baseExpression: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 91,
    											name: "pendingCollectibleIds",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 664,
    											src: "1187:21:0",
    											typeDescriptions: {
    												typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    												typeString: "mapping(address => uint256[] storage ref)"
    											}
    										},
    										id: 93,
    										indexExpression: {
    											argumentTypes: null,
    											id: 92,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 84,
    											src: "1209:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										isConstant: false,
    										isLValue: true,
    										isPure: false,
    										lValueRequested: false,
    										nodeType: "IndexAccess",
    										src: "1187:30:0",
    										typeDescriptions: {
    											typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    											typeString: "uint256[] storage ref"
    										}
    									},
    									id: 95,
    									indexExpression: {
    										argumentTypes: null,
    										id: 94,
    										name: "tokInd",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 86,
    										src: "1218:6:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									isConstant: false,
    									isLValue: true,
    									isPure: false,
    									lValueRequested: false,
    									nodeType: "IndexAccess",
    									src: "1187:38:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								nodeType: "VariableDeclarationStatement",
    								src: "1171:54:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 98,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 84,
    											src: "1245:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 99,
    											name: "tokId",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 90,
    											src: "1254:5:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 97,
    										name: "_safeMint",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    											2544,
    											2573
    										],
    										referencedDeclaration: 2544,
    										src: "1235:9:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 100,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1235:25:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 101,
    								nodeType: "ExpressionStatement",
    								src: "1235:25:0"
    							}
    						]
    					},
    					documentation: null,
    					id: 103,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    					],
    					name: "_supervisorApprove",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 87,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 84,
    								mutability: "mutable",
    								name: "student",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 103,
    								src: "1119:15:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 83,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "1119:7:0",
    									stateMutability: "nonpayable",
    									typeDescriptions: {
    										typeIdentifier: "t_address",
    										typeString: "address"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							},
    							{
    								constant: false,
    								id: 86,
    								mutability: "mutable",
    								name: "tokInd",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 103,
    								src: "1136:14:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 85,
    									name: "uint256",
    									nodeType: "ElementaryTypeName",
    									src: "1136:7:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "1118:33:0"
    					},
    					returnParameters: {
    						id: 88,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1161:0:0"
    					},
    					scope: 104,
    					src: "1091:176:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "internal"
    				}
    			],
    			scope: 105,
    			src: "371:898:0"
    		}
    	],
    	src: "0:1270:0"
    };
    var legacyAST = {
    	attributes: {
    		absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    		exportedSymbols: {
    			EvieCoin: [
    				104
    			]
    		},
    		license: null
    	},
    	children: [
    		{
    			attributes: {
    				literals: [
    					"solidity",
    					"^",
    					"0.7",
    					".0"
    				]
    			},
    			id: 1,
    			name: "PragmaDirective",
    			src: "0:23:0"
    		},
    		{
    			attributes: {
    				SourceUnit: 1888,
    				absolutePath: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				file: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				scope: 105,
    				symbolAliases: [
    					null
    				],
    				unitAlias: ""
    			},
    			id: 2,
    			name: "ImportDirective",
    			src: "25:55:0"
    		},
    		{
    			attributes: {
    				SourceUnit: 1120,
    				absolutePath: "@openzeppelin/contracts/access/Ownable.sol",
    				file: "@openzeppelin/contracts/access/Ownable.sol",
    				scope: 105,
    				symbolAliases: [
    					null
    				],
    				unitAlias: ""
    			},
    			id: 3,
    			name: "ImportDirective",
    			src: "81:52:0"
    		},
    		{
    			attributes: {
    				SourceUnit: 1385,
    				absolutePath: "@openzeppelin/contracts/math/SafeMath.sol",
    				file: "@openzeppelin/contracts/math/SafeMath.sol",
    				scope: 105,
    				symbolAliases: [
    					null
    				],
    				unitAlias: ""
    			},
    			id: 4,
    			name: "ImportDirective",
    			src: "134:51:0"
    		},
    		{
    			attributes: {
    				SourceUnit: 895,
    				absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/StudentColl.sol",
    				file: "./StudentColl.sol",
    				scope: 105,
    				symbolAliases: [
    					null
    				],
    				unitAlias: ""
    			},
    			id: 5,
    			name: "ImportDirective",
    			src: "186:27:0"
    		},
    		{
    			attributes: {
    				abstract: false,
    				contractDependencies: [
    					630,
    					894,
    					1010,
    					1119,
    					1176,
    					1188,
    					2896,
    					3012,
    					3043,
    					3070
    				],
    				contractKind: "contract",
    				fullyImplemented: true,
    				linearizedBaseContracts: [
    					104,
    					894,
    					630,
    					1119,
    					2896,
    					3043,
    					3070,
    					3012,
    					1176,
    					1188,
    					1010
    				],
    				name: "EvieCoin",
    				scope: 105
    			},
    			children: [
    				{
    					attributes: {
    						text: "@dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour\n A supervisor can then approve the coin"
    					},
    					id: 6,
    					name: "StructuredDocumentation",
    					src: "215:156:0"
    				},
    				{
    					attributes: {
    						"arguments": null
    					},
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "StudentColl",
    								referencedDeclaration: 894,
    								type: "contract StudentColl"
    							},
    							id: 7,
    							name: "UserDefinedTypeName",
    							src: "392:11:0"
    						}
    					],
    					id: 8,
    					name: "InheritanceSpecifier",
    					src: "392:11:0"
    				},
    				{
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "SafeMath",
    								referencedDeclaration: 1384,
    								type: "library SafeMath"
    							},
    							id: 9,
    							name: "UserDefinedTypeName",
    							src: "416:8:0"
    						},
    						{
    							attributes: {
    								name: "uint256",
    								type: "uint256"
    							},
    							id: 10,
    							name: "ElementaryTypeName",
    							src: "429:7:0"
    						}
    					],
    					id: 11,
    					name: "UsingForDirective",
    					src: "410:27:0"
    				},
    				{
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "SafeMath",
    								referencedDeclaration: 1384,
    								type: "library SafeMath"
    							},
    							id: 12,
    							name: "UserDefinedTypeName",
    							src: "448:8:0"
    						},
    						{
    							attributes: {
    								name: "uint256",
    								type: "uint256"
    							},
    							id: 13,
    							name: "ElementaryTypeName",
    							src: "461:7:0"
    						}
    					],
    					id: 14,
    					name: "UsingForDirective",
    					src: "442:27:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						implemented: true,
    						isConstructor: true,
    						kind: "constructor",
    						name: "",
    						overrides: null,
    						scope: 104,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "public"
    					},
    					children: [
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 15,
    							name: "ParameterList",
    							src: "486:2:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 18,
    							name: "ParameterList",
    							src: "503:0:0"
    						},
    						{
    							attributes: {
    								"arguments": [
    									null
    								]
    							},
    							children: [
    								{
    									attributes: {
    										argumentTypes: null,
    										overloadedDeclarations: [
    											null
    										],
    										referencedDeclaration: 894,
    										type: "type(contract StudentColl)",
    										value: "StudentColl"
    									},
    									id: 16,
    									name: "Identifier",
    									src: "489:11:0"
    								}
    							],
    							id: 17,
    							name: "ModifierInvocation",
    							src: "489:13:0"
    						},
    						{
    							attributes: {
    								statements: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 19,
    							name: "Block",
    							src: "503:2:0"
    						}
    					],
    					id: 20,
    					name: "FunctionDefinition",
    					src: "475:30:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						functionSelector: "d25eab2d",
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						modifiers: [
    							null
    						],
    						name: "SupervisorApproveAll",
    						overrides: null,
    						scope: 104,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "external"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "student",
    										overrides: null,
    										scope: 59,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "address",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "address",
    												stateMutability: "nonpayable",
    												type: "address"
    											},
    											id: 21,
    											name: "ElementaryTypeName",
    											src: "541:7:0"
    										}
    									],
    									id: 22,
    									name: "VariableDeclaration",
    									src: "541:15:0"
    								}
    							],
    							id: 23,
    							name: "ParameterList",
    							src: "540:17:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 24,
    							name: "ParameterList",
    							src: "567:0:0"
    						},
    						{
    							children: [
    								{
    									children: [
    										{
    											attributes: {
    												assignments: [
    													26
    												]
    											},
    											children: [
    												{
    													attributes: {
    														constant: false,
    														mutability: "mutable",
    														name: "i",
    														overrides: null,
    														scope: 44,
    														stateVariable: false,
    														storageLocation: "default",
    														type: "uint256",
    														value: null,
    														visibility: "internal"
    													},
    													children: [
    														{
    															attributes: {
    																name: "uint256",
    																type: "uint256"
    															},
    															id: 25,
    															name: "ElementaryTypeName",
    															src: "582:7:0"
    														}
    													],
    													id: 26,
    													name: "VariableDeclaration",
    													src: "582:9:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														hexvalue: "30",
    														isConstant: false,
    														isLValue: false,
    														isPure: true,
    														lValueRequested: false,
    														subdenomination: null,
    														token: "number",
    														type: "int_const 0",
    														value: "0"
    													},
    													id: 27,
    													name: "Literal",
    													src: "594:1:0"
    												}
    											],
    											id: 28,
    											name: "VariableDeclarationStatement",
    											src: "582:13:0"
    										},
    										{
    											attributes: {
    												argumentTypes: null,
    												commonType: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												},
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												lValueRequested: false,
    												operator: "<",
    												type: "bool"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 26,
    														type: "uint256",
    														value: "i"
    													},
    													id: 29,
    													name: "Identifier",
    													src: "597:1:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "length",
    														referencedDeclaration: null,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: true,
    																isPure: false,
    																lValueRequested: false,
    																type: "uint256[] storage ref"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 664,
    																		type: "mapping(address => uint256[] storage ref)",
    																		value: "pendingCollectibleIds"
    																	},
    																	id: 30,
    																	name: "Identifier",
    																	src: "601:21:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 22,
    																		type: "address",
    																		value: "student"
    																	},
    																	id: 31,
    																	name: "Identifier",
    																	src: "623:7:0"
    																}
    															],
    															id: 32,
    															name: "IndexAccess",
    															src: "601:30:0"
    														}
    													],
    													id: 33,
    													name: "MemberAccess",
    													src: "601:37:0"
    												}
    											],
    											id: 34,
    											name: "BinaryOperation",
    											src: "597:41:0"
    										},
    										{
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														operator: "++",
    														prefix: false,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 26,
    																type: "uint256",
    																value: "i"
    															},
    															id: 35,
    															name: "Identifier",
    															src: "640:1:0"
    														}
    													],
    													id: 36,
    													name: "UnaryOperation",
    													src: "640:3:0"
    												}
    											],
    											id: 37,
    											name: "ExpressionStatement",
    											src: "640:3:0"
    										},
    										{
    											children: [
    												{
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: false,
    																isPure: false,
    																isStructConstructorCall: false,
    																lValueRequested: false,
    																names: [
    																	null
    																],
    																tryCall: false,
    																type: "tuple()",
    																type_conversion: false
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: [
    																			{
    																				typeIdentifier: "t_address",
    																				typeString: "address"
    																			},
    																			{
    																				typeIdentifier: "t_uint256",
    																				typeString: "uint256"
    																			}
    																		],
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 103,
    																		type: "function (address,uint256)",
    																		value: "_supervisorApprove"
    																	},
    																	id: 38,
    																	name: "Identifier",
    																	src: "659:18:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 22,
    																		type: "address",
    																		value: "student"
    																	},
    																	id: 39,
    																	name: "Identifier",
    																	src: "678:7:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 26,
    																		type: "uint256",
    																		value: "i"
    																	},
    																	id: 40,
    																	name: "Identifier",
    																	src: "687:1:0"
    																}
    															],
    															id: 41,
    															name: "FunctionCall",
    															src: "659:30:0"
    														}
    													],
    													id: 42,
    													name: "ExpressionStatement",
    													src: "659:30:0"
    												}
    											],
    											id: 43,
    											name: "Block",
    											src: "645:55:0"
    										}
    									],
    									id: 44,
    									name: "ForStatement",
    									src: "577:123:0"
    								},
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												isStructConstructorCall: false,
    												lValueRequested: false,
    												names: [
    													null
    												],
    												tryCall: false,
    												type: "tuple()",
    												type_conversion: false
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: [
    															{
    																typeIdentifier: "t_address",
    																typeString: "address"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 700,
    														type: "function (address,uint256)",
    														value: "PayoutMadeMultEvent"
    													},
    													id: 45,
    													name: "Identifier",
    													src: "714:19:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 22,
    														type: "address",
    														value: "student"
    													},
    													id: 46,
    													name: "Identifier",
    													src: "747:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "length",
    														referencedDeclaration: null,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: true,
    																isPure: false,
    																lValueRequested: false,
    																type: "uint256[] storage ref"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 664,
    																		type: "mapping(address => uint256[] storage ref)",
    																		value: "pendingCollectibleIds"
    																	},
    																	id: 47,
    																	name: "Identifier",
    																	src: "768:21:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 22,
    																		type: "address",
    																		value: "student"
    																	},
    																	id: 48,
    																	name: "Identifier",
    																	src: "790:7:0"
    																}
    															],
    															id: 49,
    															name: "IndexAccess",
    															src: "768:30:0"
    														}
    													],
    													id: 50,
    													name: "MemberAccess",
    													src: "768:37:0"
    												}
    											],
    											id: 51,
    											name: "FunctionCall",
    											src: "714:101:0"
    										}
    									],
    									id: 52,
    									name: "EmitStatement",
    									src: "709:106:0"
    								},
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												lValueRequested: false,
    												operator: "delete",
    												prefix: true,
    												type: "tuple()"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: true,
    														isPure: false,
    														lValueRequested: true,
    														type: "uint256[] storage ref"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 664,
    																type: "mapping(address => uint256[] storage ref)",
    																value: "pendingCollectibleIds"
    															},
    															id: 53,
    															name: "Identifier",
    															src: "832:21:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 22,
    																type: "address",
    																value: "student"
    															},
    															id: 54,
    															name: "Identifier",
    															src: "854:7:0"
    														}
    													],
    													id: 55,
    													name: "IndexAccess",
    													src: "832:30:0"
    												}
    											],
    											id: 56,
    											name: "UnaryOperation",
    											src: "825:37:0"
    										}
    									],
    									id: 57,
    									name: "ExpressionStatement",
    									src: "825:37:0"
    								}
    							],
    							id: 58,
    							name: "Block",
    							src: "567:302:0"
    						}
    					],
    					id: 59,
    					name: "FunctionDefinition",
    					src: "511:358:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						functionSelector: "7aa0c589",
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						modifiers: [
    							null
    						],
    						name: "SupervisorApprove",
    						overrides: null,
    						scope: 104,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "public"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "student",
    										overrides: null,
    										scope: 82,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "address",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "address",
    												stateMutability: "nonpayable",
    												type: "address"
    											},
    											id: 60,
    											name: "ElementaryTypeName",
    											src: "902:7:0"
    										}
    									],
    									id: 61,
    									name: "VariableDeclaration",
    									src: "902:15:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "tokInd",
    										overrides: null,
    										scope: 82,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint256",
    												type: "uint256"
    											},
    											id: 62,
    											name: "ElementaryTypeName",
    											src: "919:7:0"
    										}
    									],
    									id: 63,
    									name: "VariableDeclaration",
    									src: "919:14:0"
    								}
    							],
    							id: 64,
    							name: "ParameterList",
    							src: "901:33:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 65,
    							name: "ParameterList",
    							src: "942:0:0"
    						},
    						{
    							children: [
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												isStructConstructorCall: false,
    												lValueRequested: false,
    												names: [
    													null
    												],
    												tryCall: false,
    												type: "tuple()",
    												type_conversion: false
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: [
    															{
    																typeIdentifier: "t_address",
    																typeString: "address"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 103,
    														type: "function (address,uint256)",
    														value: "_supervisorApprove"
    													},
    													id: 66,
    													name: "Identifier",
    													src: "952:18:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 61,
    														type: "address",
    														value: "student"
    													},
    													id: 67,
    													name: "Identifier",
    													src: "971:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 63,
    														type: "uint256",
    														value: "tokInd"
    													},
    													id: 68,
    													name: "Identifier",
    													src: "980:6:0"
    												}
    											],
    											id: 69,
    											name: "FunctionCall",
    											src: "952:35:0"
    										}
    									],
    									id: 70,
    									name: "ExpressionStatement",
    									src: "952:35:0"
    								},
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												isStructConstructorCall: false,
    												lValueRequested: false,
    												names: [
    													null
    												],
    												tryCall: false,
    												type: "tuple()",
    												type_conversion: false
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: [
    															{
    																typeIdentifier: "t_address",
    																typeString: "address"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 893,
    														type: "function (address,uint256)",
    														value: "removeFromPending"
    													},
    													id: 71,
    													name: "Identifier",
    													src: "997:17:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 61,
    														type: "address",
    														value: "student"
    													},
    													id: 72,
    													name: "Identifier",
    													src: "1015:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 63,
    														type: "uint256",
    														value: "tokInd"
    													},
    													id: 73,
    													name: "Identifier",
    													src: "1024:6:0"
    												}
    											],
    											id: 74,
    											name: "FunctionCall",
    											src: "997:34:0"
    										}
    									],
    									id: 75,
    									name: "ExpressionStatement",
    									src: "997:34:0"
    								},
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												isStructConstructorCall: false,
    												lValueRequested: false,
    												names: [
    													null
    												],
    												tryCall: false,
    												type: "tuple()",
    												type_conversion: false
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: [
    															{
    																typeIdentifier: "t_address",
    																typeString: "address"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 706,
    														type: "function (address,uint256)",
    														value: "PayoutMadeEvent"
    													},
    													id: 76,
    													name: "Identifier",
    													src: "1046:15:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 61,
    														type: "address",
    														value: "student"
    													},
    													id: 77,
    													name: "Identifier",
    													src: "1062:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 63,
    														type: "uint256",
    														value: "tokInd"
    													},
    													id: 78,
    													name: "Identifier",
    													src: "1071:6:0"
    												}
    											],
    											id: 79,
    											name: "FunctionCall",
    											src: "1046:32:0"
    										}
    									],
    									id: 80,
    									name: "EmitStatement",
    									src: "1041:37:0"
    								}
    							],
    							id: 81,
    							name: "Block",
    							src: "942:143:0"
    						}
    					],
    					id: 82,
    					name: "FunctionDefinition",
    					src: "875:210:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						modifiers: [
    							null
    						],
    						name: "_supervisorApprove",
    						overrides: null,
    						scope: 104,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "internal"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "student",
    										overrides: null,
    										scope: 103,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "address",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "address",
    												stateMutability: "nonpayable",
    												type: "address"
    											},
    											id: 83,
    											name: "ElementaryTypeName",
    											src: "1119:7:0"
    										}
    									],
    									id: 84,
    									name: "VariableDeclaration",
    									src: "1119:15:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "tokInd",
    										overrides: null,
    										scope: 103,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint256",
    												type: "uint256"
    											},
    											id: 85,
    											name: "ElementaryTypeName",
    											src: "1136:7:0"
    										}
    									],
    									id: 86,
    									name: "VariableDeclaration",
    									src: "1136:14:0"
    								}
    							],
    							id: 87,
    							name: "ParameterList",
    							src: "1118:33:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 88,
    							name: "ParameterList",
    							src: "1161:0:0"
    						},
    						{
    							children: [
    								{
    									attributes: {
    										assignments: [
    											90
    										]
    									},
    									children: [
    										{
    											attributes: {
    												constant: false,
    												mutability: "mutable",
    												name: "tokId",
    												overrides: null,
    												scope: 102,
    												stateVariable: false,
    												storageLocation: "default",
    												type: "uint256",
    												value: null,
    												visibility: "internal"
    											},
    											children: [
    												{
    													attributes: {
    														name: "uint256",
    														type: "uint256"
    													},
    													id: 89,
    													name: "ElementaryTypeName",
    													src: "1171:7:0"
    												}
    											],
    											id: 90,
    											name: "VariableDeclaration",
    											src: "1171:13:0"
    										},
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: true,
    												isPure: false,
    												lValueRequested: false,
    												type: "uint256"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: true,
    														isPure: false,
    														lValueRequested: false,
    														type: "uint256[] storage ref"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 664,
    																type: "mapping(address => uint256[] storage ref)",
    																value: "pendingCollectibleIds"
    															},
    															id: 91,
    															name: "Identifier",
    															src: "1187:21:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 84,
    																type: "address",
    																value: "student"
    															},
    															id: 92,
    															name: "Identifier",
    															src: "1209:7:0"
    														}
    													],
    													id: 93,
    													name: "IndexAccess",
    													src: "1187:30:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 86,
    														type: "uint256",
    														value: "tokInd"
    													},
    													id: 94,
    													name: "Identifier",
    													src: "1218:6:0"
    												}
    											],
    											id: 95,
    											name: "IndexAccess",
    											src: "1187:38:0"
    										}
    									],
    									id: 96,
    									name: "VariableDeclarationStatement",
    									src: "1171:54:0"
    								},
    								{
    									children: [
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												isStructConstructorCall: false,
    												lValueRequested: false,
    												names: [
    													null
    												],
    												tryCall: false,
    												type: "tuple()",
    												type_conversion: false
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: [
    															{
    																typeIdentifier: "t_address",
    																typeString: "address"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															2544,
    															2573
    														],
    														referencedDeclaration: 2544,
    														type: "function (address,uint256)",
    														value: "_safeMint"
    													},
    													id: 97,
    													name: "Identifier",
    													src: "1235:9:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 84,
    														type: "address",
    														value: "student"
    													},
    													id: 98,
    													name: "Identifier",
    													src: "1245:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 90,
    														type: "uint256",
    														value: "tokId"
    													},
    													id: 99,
    													name: "Identifier",
    													src: "1254:5:0"
    												}
    											],
    											id: 100,
    											name: "FunctionCall",
    											src: "1235:25:0"
    										}
    									],
    									id: 101,
    									name: "ExpressionStatement",
    									src: "1235:25:0"
    								}
    							],
    							id: 102,
    							name: "Block",
    							src: "1161:106:0"
    						}
    					],
    					id: 103,
    					name: "FunctionDefinition",
    					src: "1091:176:0"
    				}
    			],
    			id: 104,
    			name: "ContractDefinition",
    			src: "371:898:0"
    		}
    	],
    	id: 105,
    	name: "SourceUnit",
    	src: "0:1270:0"
    };
    var compiler = {
    	name: "solc",
    	version: "0.7.0+commit.9e61f92b.Emscripten.clang"
    };
    var networks = {
    	"5777": {
    		events: {
    			"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "owner",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "address",
    						name: "approved",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "uint256",
    						name: "tokenId",
    						type: "uint256"
    					}
    				],
    				name: "Approval",
    				type: "event"
    			},
    			"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "owner",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "address",
    						name: "operator",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "bool",
    						name: "approved",
    						type: "bool"
    					}
    				],
    				name: "ApprovalForAll",
    				type: "event"
    			},
    			"0xd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "user",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "timestamp",
    						type: "uint256"
    					}
    				],
    				name: "ClockInTimeEvent",
    				type: "event"
    			},
    			"0xd6d4a83c50f8452f78f64b946692a111c56aa380e4e5f2a42deff2e69a03ba9a": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "user",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "timestamp",
    						type: "uint256"
    					}
    				],
    				name: "ClockOutTimeEvent",
    				type: "event"
    			},
    			"0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "previousOwner",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "address",
    						name: "newOwner",
    						type: "address"
    					}
    				],
    				name: "OwnershipTransferred",
    				type: "event"
    			},
    			"0x206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "_to",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "tokId",
    						type: "uint256"
    					}
    				],
    				name: "PayoutMadeEvent",
    				type: "event"
    			},
    			"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "from",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "address",
    						name: "to",
    						type: "address"
    					},
    					{
    						indexed: true,
    						internalType: "uint256",
    						name: "tokenId",
    						type: "uint256"
    					}
    				],
    				name: "Transfer",
    				type: "event"
    			},
    			"0x84cb897df1462f1adef179f717c830907aec4ae17a71a0c62001e7fa560e211a": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: false,
    						internalType: "address",
    						name: "sup",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "address",
    						name: "student",
    						type: "address"
    					}
    				],
    				name: "StudentStatusChange",
    				type: "event"
    			},
    			"0x1169a57bcca659f54ea0d65ec6297c90d18a47b10a1e955cb7f8bea526ca87bd": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "user",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "timestamp",
    						type: "uint256"
    					},
    					{
    						indexed: false,
    						internalType: "bool",
    						name: "newPendingTok",
    						type: "bool"
    					}
    				],
    				name: "ClockOutTimeEvent",
    				type: "event"
    			},
    			"0xf43fa0f98e476cf52c3528cedf54a09f9edcea6b7e17fd50f33d65953cc10d84": {
    				anonymous: false,
    				inputs: [
    					{
    						indexed: true,
    						internalType: "address",
    						name: "_to",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "numbToks",
    						type: "uint256"
    					}
    				],
    				name: "PayoutMadeMultEvent",
    				type: "event"
    			}
    		},
    		links: {
    		},
    		address: "0x8b4646B591fde30731dC29663cf93cAD9959Ed74",
    		transactionHash: "0x5229ece97083f33a44828e4b929a93cc21d0c8340118dd5e4c2b7d83a3269931"
    	}
    };
    var schemaVersion = "3.3.3";
    var updatedAt = "2021-01-20T15:20:36.197Z";
    var networkType = "ethereum";
    var devdoc = {
    	details: "a coin which is rewarded to a student upon completition of clocking in and out within less than an hour A supervisor can then approve the coin",
    	kind: "dev",
    	methods: {
    		"approve(address,uint256)": {
    			details: "See {IERC721-approve}."
    		},
    		"balanceOf(address)": {
    			details: "See {IERC721-balanceOf}."
    		},
    		"baseURI()": {
    			details: "Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID."
    		},
    		"clockStartTime()": {
    			details: "a user clocks in their start time"
    		},
    		"createPotentialStudent(address)": {
    			details: "msg.sender is the student's address",
    			params: {
    				supervisor: "- The student's desired supervisor"
    			}
    		},
    		"getApproved(uint256)": {
    			details: "See {IERC721-getApproved}."
    		},
    		"getSupsPotentialStudents()": {
    			returns: {
    				_0: "the students' addresses, their index in the address array"
    			}
    		},
    		"isApprovedForAll(address,address)": {
    			details: "See {IERC721-isApprovedForAll}."
    		},
    		"name()": {
    			details: "See {IERC721Metadata-name}."
    		},
    		"owner()": {
    			details: "Returns the address of the current owner."
    		},
    		"ownerOf(uint256)": {
    			details: "See {IERC721-ownerOf}."
    		},
    		"renounceOwnership()": {
    			details: "Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner."
    		},
    		"safeTransferFrom(address,address,uint256)": {
    			details: "See {IERC721-safeTransferFrom}."
    		},
    		"safeTransferFrom(address,address,uint256,bytes)": {
    			details: "See {IERC721-safeTransferFrom}."
    		},
    		"setApprovalForAll(address,bool)": {
    			details: "See {IERC721-setApprovalForAll}."
    		},
    		"studentStatus(address)": {
    			details: "get whether the student is a pending potential student, initialized, or nothing at all "
    		},
    		"supportsInterface(bytes4)": {
    			details: "See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas."
    		},
    		"symbol()": {
    			details: "See {IERC721Metadata-symbol}."
    		},
    		"tokenByIndex(uint256)": {
    			details: "See {IERC721Enumerable-tokenByIndex}."
    		},
    		"tokenOfOwnerByIndex(address,uint256)": {
    			details: "See {IERC721Enumerable-tokenOfOwnerByIndex}."
    		},
    		"tokenURI(uint256)": {
    			details: "See {IERC721Metadata-tokenURI}."
    		},
    		"totalSupply()": {
    			details: "See {IERC721Enumerable-totalSupply}."
    		},
    		"transferFrom(address,address,uint256)": {
    			details: "See {IERC721-transferFrom}."
    		},
    		"transferOwnership(address)": {
    			details: "Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner."
    		}
    	},
    	version: 1
    };
    var userdoc = {
    	kind: "user",
    	methods: {
    	},
    	version: 1
    };
    var EvieCoinContract = {
    	contractName: contractName,
    	abi: abi,
    	metadata: metadata,
    	bytecode: bytecode,
    	deployedBytecode: deployedBytecode,
    	immutableReferences: immutableReferences,
    	sourceMap: sourceMap,
    	deployedSourceMap: deployedSourceMap,
    	source: source,
    	sourcePath: sourcePath,
    	ast: ast,
    	legacyAST: legacyAST,
    	compiler: compiler,
    	networks: networks,
    	schemaVersion: schemaVersion,
    	updatedAt: updatedAt,
    	networkType: networkType,
    	devdoc: devdoc,
    	userdoc: userdoc
    };

    function ethTimestampToDate(timestamp) {
        return new Date(parseInt(timestamp) * 1000);
    }

    function weiToCoinNumber(wei) {
        return window.web3.utils.fromWei(wei.toString());
    }

    const APIWriteable = writable({
        EvieCoin: undefined,
        address: "",
        reloadPage: false
    });
    const StudentInfoWriteable = writable({});
    const APIStore = {
        subscribe: APIWriteable.subscribe,
        update: APIWriteable.update,
        set: APIWriteable.set,
    };
    const StudentInfoStore = {
        subscribe: StudentInfoWriteable.subscribe,
        update: StudentInfoWriteable.update,
    };

    function wrapper(f) {
        return (err, event) => {
            if (err) {
                console.error("Event Listener failed at function", f.name, "due to", err);
            }
            else {
                f(event);
            }
        };
    }
    function _clockOutListener(event) {
        const { newPendingTok } = event.returnValues;
        if (newPendingTok) {
            alert('Congrats! You will get a new token if your supervisor approves this!');
            APIStore.update((u) => {
                return Object.assign(Object.assign({}, u), { reloadPage: true });
            });
        }
    }
    function _clockInListener(event) {
        const { timestamp } = event.returnValues;
        let startTime = ethTimestampToDate(timestamp);
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { startTime });
        });
    }
    function _payoutListener(event) {
        alert(`One of your tokens just got approved`);
        APIStore.update((u) => {
            return Object.assign(Object.assign({}, u), { reloadPage: true });
        });
    }
    function _studentApprovalStatusChanged(event) {
        APIStore.update((u) => {
            return Object.assign(Object.assign({}, u), { reloadPage: true });
        });
    }
    const clockInListener = wrapper(_clockInListener);
    const clockOutListener = wrapper(_clockOutListener);
    const payoutListener = wrapper(_payoutListener);
    const studentApprovalStatusChanged = wrapper(_studentApprovalStatusChanged);

    async function initEvieCoin(web3) {
        const { EvieCoin, address } = await loadBlockchainData(web3);
        await setEventListeners(EvieCoin, address);
    }
    async function loadBlockchainData(web3) {
        const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
        const address = accounts[0];
        const networkId = await window.web3.eth.net.getId();
        const evieCoinData = EvieCoinContract.networks[networkId];
        if (evieCoinData) {
            const evieCoin = new web3.eth.Contract(EvieCoinContract.abi, evieCoinData.address);
            APIStore.set({
                EvieCoin: evieCoin,
                address,
                reloadPage: false,
            });
            return {
                EvieCoin: evieCoin,
                address,
            };
        }
        else {
            alert("Please use a web3.js enabled browser and make sure that EvieCoin is loaded");
            throw "Please use a web3.js enabled browser and make sure that EvieCoin is loaded";
        }
    }
    async function setEventListeners(evieCoin, address) {
        evieCoin.events.ClockInTimeEvent({ filter: { user: address } }, clockInListener);
        evieCoin.events.ClockOutTimeEvent({ filter: { user: address } }, clockOutListener);
        evieCoin.events.PayoutMadeEvent({ filter: { _to: address } }, payoutListener);
        evieCoin.events.PayoutMadeMultEvent({ filter: { _to: address } }, payoutListener);
        evieCoin.events.StudentStatusChange({ filter: { sup: address } }, studentApprovalStatusChanged);
        evieCoin.events.StudentStatusChange({ filter: { student: address } }, studentApprovalStatusChanged);
    }

    const btnStyle = `margin: "1rem";`;

    function ie(n){return l=>{const o=Object.keys(n.$$.callbacks),i=[];return o.forEach(o=>i.push(listen(l,o,e=>bubble(n,e)))),{destroy:()=>{i.forEach(e=>e());}}}}function se(){return "undefined"!=typeof window&&!(window.CSS&&window.CSS.supports&&window.CSS.supports("(--foo: red)"))}function re(e){var t;return "r"===e.charAt(0)?e=(t=(t=e).match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i))&&4===t.length?"#"+("0"+parseInt(t[1],10).toString(16)).slice(-2)+("0"+parseInt(t[2],10).toString(16)).slice(-2)+("0"+parseInt(t[3],10).toString(16)).slice(-2):"":"transparent"===e.toLowerCase()&&(e="#00000000"),e}const{document:ae}=globals;function ce(e){let t;return {c(){t=element("div"),attr(t,"class","ripple svelte-po4fcb");},m(n,l){insert(n,t,l),e[5](t);},p:noop,i:noop,o:noop,d(n){n&&detach(t),e[5](null);}}}function de(e,t){e.style.transform=t,e.style.webkitTransform=t;}function ue(e,t){e.style.opacity=t.toString();}const pe=function(e,t){const n=["touchcancel","mouseleave","dragstart"];let l=t.currentTarget||t.target;if(l&&!l.classList.contains("ripple")&&(l=l.querySelector(".ripple")),!l)return;const o=l.dataset.event;if(o&&o!==e)return;l.dataset.event=e;const i=document.createElement("span"),{radius:s,scale:r,x:a,y:c,centerX:d,centerY:u}=((e,t)=>{const n=t.getBoundingClientRect(),l=function(e){return "TouchEvent"===e.constructor.name}(e)?e.touches[e.touches.length-1]:e,o=l.clientX-n.left,i=l.clientY-n.top;let s=0,r=.3;const a=t.dataset.center;t.dataset.circle?(r=.15,s=t.clientWidth/2,s=a?s:s+Math.sqrt((o-s)**2+(i-s)**2)/4):s=Math.sqrt(t.clientWidth**2+t.clientHeight**2)/2;const c=(t.clientWidth-2*s)/2+"px",d=(t.clientHeight-2*s)/2+"px";return {radius:s,scale:r,x:a?c:o-s+"px",y:a?d:i-s+"px",centerX:c,centerY:d}})(t,l),p=l.dataset.color,f=2*s+"px";i.className="animation",i.style.width=f,i.style.height=f,i.style.background=p,i.classList.add("animation--enter"),i.classList.add("animation--visible"),de(i,`translate(${a}, ${c}) scale3d(${r},${r},${r})`),ue(i,0),i.dataset.activated=String(performance.now()),l.appendChild(i),setTimeout(()=>{i.classList.remove("animation--enter"),i.classList.add("animation--in"),de(i,`translate(${d}, ${u}) scale3d(1,1,1)`),ue(i,.25);},0);const v="mousedown"===e?"mouseup":"touchend",h=function(){document.removeEventListener(v,h),n.forEach(e=>{document.removeEventListener(e,h);});const e=performance.now()-Number(i.dataset.activated),t=Math.max(250-e,0);setTimeout(()=>{i.classList.remove("animation--in"),i.classList.add("animation--out"),ue(i,0),setTimeout(()=>{i&&l.removeChild(i),0===l.children.length&&delete l.dataset.event;},300);},t);};document.addEventListener(v,h),n.forEach(e=>{document.addEventListener(e,h,{passive:!0});});},fe=function(e){0===e.button&&pe(e.type,e);},ve=function(e){if(e.changedTouches)for(let t=0;t<e.changedTouches.length;++t)pe(e.type,e.changedTouches[t]);};function he(e,t,n){let l,o,{center:i=!1}=t,{circle:s=!1}=t,{color:r="currentColor"}=t;return onMount(async()=>{await tick();try{i&&n(0,l.dataset.center="true",l),s&&n(0,l.dataset.circle="true",l),n(0,l.dataset.color=r,l),o=l.parentElement;}catch(e){}if(!o)return void console.error("Ripple: Trigger element not found.");let e=window.getComputedStyle(o);0!==e.position.length&&"static"!==e.position||(o.style.position="relative"),o.addEventListener("touchstart",ve,{passive:!0}),o.addEventListener("mousedown",fe,{passive:!0});}),onDestroy(()=>{o&&(o.removeEventListener("mousedown",fe),o.removeEventListener("touchstart",ve));}),e.$set=e=>{"center"in e&&n(1,i=e.center),"circle"in e&&n(2,s=e.circle),"color"in e&&n(3,r=e.color);},[l,i,s,r,o,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(0,l=e);});}]}class ge extends SvelteComponent{constructor(e){var t;super(),ae.getElementById("svelte-po4fcb-style")||((t=element("style")).id="svelte-po4fcb-style",t.textContent=".ripple.svelte-po4fcb{display:block;position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;border-radius:inherit;color:inherit;pointer-events:none;z-index:0;contain:strict}.ripple.svelte-po4fcb .animation{color:inherit;position:absolute;top:0;left:0;border-radius:50%;opacity:0;pointer-events:none;overflow:hidden;will-change:transform, opacity}.ripple.svelte-po4fcb .animation--enter{transition:none}.ripple.svelte-po4fcb .animation--in{transition:opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);transition:transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.1s cubic-bezier(0.4, 0, 0.2, 1)}.ripple.svelte-po4fcb .animation--out{transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)}",append(ae.head,t)),init(this,e,he,ce,safe_not_equal,{center:1,circle:2,color:3});}}function me(e){let t;const n=new ge({props:{center:e[3],circle:e[3]}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p(e,t){const l={};8&t&&(l.center=e[3]),8&t&&(l.circle=e[3]),n.$set(l);},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function be(t){let n,l,i,a;const d=t[22].default,p=create_slot(d,t,t[21],null);let v=t[10]&&me(t),h=[{class:t[1]},{style:t[2]},t[14]],b={};for(let e=0;e<h.length;e+=1)b=assign(b,h[e]);return {c(){n=element("button"),p&&p.c(),l=space(),v&&v.c(),set_attributes(n,b),toggle_class(n,"raised",t[6]),toggle_class(n,"outlined",t[8]&&!(t[6]||t[7])),toggle_class(n,"shaped",t[9]&&!t[3]),toggle_class(n,"dense",t[5]),toggle_class(n,"fab",t[4]&&t[3]),toggle_class(n,"icon-button",t[3]),toggle_class(n,"toggle",t[11]),toggle_class(n,"active",t[11]&&t[0]),toggle_class(n,"full-width",t[12]&&!t[3]),toggle_class(n,"svelte-6bcb3a",!0);},m(s,d){insert(s,n,d),p&&p.m(n,null),append(n,l),v&&v.m(n,null),t[23](n),i=!0,a=[listen(n,"click",t[16]),action_destroyer(t[15].call(null,n))];},p(e,[t]){p&&p.p&&2097152&t&&p.p(get_slot_context(d,e,e[21],null),get_slot_changes(d,e[21],t,null)),e[10]?v?(v.p(e,t),transition_in(v,1)):(v=me(e),v.c(),transition_in(v,1),v.m(n,null)):v&&(group_outros(),transition_out(v,1,1,()=>{v=null;}),check_outros()),set_attributes(n,get_spread_update(h,[2&t&&{class:e[1]},4&t&&{style:e[2]},16384&t&&e[14]])),toggle_class(n,"raised",e[6]),toggle_class(n,"outlined",e[8]&&!(e[6]||e[7])),toggle_class(n,"shaped",e[9]&&!e[3]),toggle_class(n,"dense",e[5]),toggle_class(n,"fab",e[4]&&e[3]),toggle_class(n,"icon-button",e[3]),toggle_class(n,"toggle",e[11]),toggle_class(n,"active",e[11]&&e[0]),toggle_class(n,"full-width",e[12]&&!e[3]),toggle_class(n,"svelte-6bcb3a",!0);},i(e){i||(transition_in(p,e),transition_in(v),i=!0);},o(e){transition_out(p,e),transition_out(v),i=!1;},d(e){e&&detach(n),p&&p.d(e),v&&v.d(),t[23](null),run_all(a);}}}function ye(e,t,n){const l=createEventDispatcher(),o=ie(current_component);let i,{class:s=""}=t,{style:r=null}=t,{icon:a=!1}=t,{fab:c=!1}=t,{dense:d=!1}=t,{raised:u=!1}=t,{unelevated:f=!1}=t,{outlined:v=!1}=t,{shaped:h=!1}=t,{color:g=null}=t,{ripple:m=!0}=t,{toggle:b=!1}=t,{active:x=!1}=t,{fullWidth:w=!1}=t,$={};beforeUpdate(()=>{if(!i)return;let e=i.getElementsByTagName("svg"),t=e.length;for(let n=0;n<t;n++)e[n].setAttribute("width",z+(b&&!a?2:0)),e[n].setAttribute("height",z+(b&&!a?2:0));n(13,i.style.backgroundColor=u||f?g:"transparent",i);let l=getComputedStyle(i).getPropertyValue("background-color");n(13,i.style.color=u||f?function(e="#ffffff"){let t,n,l,o,i,s;if(0===e.length&&(e="#ffffff"),e=re(e),e=String(e).replace(/[^0-9a-f]/gi,""),!new RegExp(/^(?:[0-9a-f]{3}){1,2}$/i).test(e))throw new Error("Invalid HEX color!");e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]);const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t=parseInt(r[1],16)/255,n=parseInt(r[2],16)/255,l=parseInt(r[3],16)/255,o=t<=.03928?t/12.92:Math.pow((t+.055)/1.055,2.4),i=n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4),s=l<=.03928?l/12.92:Math.pow((l+.055)/1.055,2.4),.2126*o+.7152*i+.0722*s}(l)>.5?"#000":"#fff":g,i);});let z,{$$slots:k={},$$scope:D}=t;return e.$set=e=>{n(20,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(1,s=e.class),"style"in e&&n(2,r=e.style),"icon"in e&&n(3,a=e.icon),"fab"in e&&n(4,c=e.fab),"dense"in e&&n(5,d=e.dense),"raised"in e&&n(6,u=e.raised),"unelevated"in e&&n(7,f=e.unelevated),"outlined"in e&&n(8,v=e.outlined),"shaped"in e&&n(9,h=e.shaped),"color"in e&&n(17,g=e.color),"ripple"in e&&n(10,m=e.ripple),"toggle"in e&&n(11,b=e.toggle),"active"in e&&n(0,x=e.active),"fullWidth"in e&&n(12,w=e.fullWidth),"$$scope"in e&&n(21,D=e.$$scope);},e.$$.update=()=>{{const{style:e,icon:l,fab:o,dense:i,raised:s,unelevated:r,outlined:a,shaped:c,color:d,ripple:u,toggle:p,active:f,fullWidth:v,...h}=t;!h.disabled&&delete h.disabled,delete h.class,n(14,$=h);}56&e.$$.dirty&&(z=a?c?24:d?20:24:d?16:18),139264&e.$$.dirty&&("primary"===g?n(17,g=se()?"#1976d2":"var(--primary, #1976d2)"):"accent"==g?n(17,g=se()?"#f50057":"var(--accent, #f50057)"):!g&&i&&n(17,g=i.style.color||i.parentElement.style.color||(se()?"#333":"var(--color, #333)")));},t=exclude_internal_props(t),[x,s,r,a,c,d,u,f,v,h,m,b,w,i,$,o,function(e){b&&(n(0,x=!x),l("change",x));},g,z,l,t,D,k,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(13,i=e);});}]}class xe extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-6bcb3a-style")||((t=element("style")).id="svelte-6bcb3a-style",t.textContent="button.svelte-6bcb3a:disabled{cursor:default}button.svelte-6bcb3a{cursor:pointer;font-family:Roboto, Helvetica, sans-serif;font-family:var(--button-font-family, Roboto, Helvetica, sans-serif);font-size:0.875rem;font-weight:500;letter-spacing:0.75px;text-decoration:none;text-transform:uppercase;will-change:transform, opacity;margin:0;padding:0 16px;display:-ms-inline-flexbox;display:inline-flex;position:relative;align-items:center;justify-content:center;box-sizing:border-box;height:36px;border:none;outline:none;line-height:inherit;user-select:none;overflow:hidden;vertical-align:middle;border-radius:4px}button.svelte-6bcb3a::-moz-focus-inner{border:0}button.svelte-6bcb3a:-moz-focusring{outline:none}button.svelte-6bcb3a:before{box-sizing:inherit;border-radius:inherit;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.2s cubic-bezier(0.25, 0.8, 0.5, 1);will-change:background-color, opacity}.toggle.svelte-6bcb3a:before{box-sizing:content-box}.active.svelte-6bcb3a:before{background-color:currentColor;opacity:0.3}.raised.svelte-6bcb3a{box-shadow:0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 5px 0 rgba(0, 0, 0, 0.12)}.outlined.svelte-6bcb3a{padding:0 14px;border-style:solid;border-width:2px}.shaped.svelte-6bcb3a{border-radius:18px}.dense.svelte-6bcb3a{height:32px}.icon-button.svelte-6bcb3a{line-height:0.5;border-radius:50%;padding:8px;width:40px;height:40px;vertical-align:middle}.icon-button.outlined.svelte-6bcb3a{padding:6px}.icon-button.fab.svelte-6bcb3a{border:none;width:56px;height:56px;box-shadow:0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 18px 0 rgba(0, 0, 0, 0.12)}.icon-button.dense.svelte-6bcb3a{width:36px;height:36px}.icon-button.fab.dense.svelte-6bcb3a{width:40px;height:40px}.outlined.svelte-6bcb3a:not(.shaped) .ripple{border-radius:0 !important}.full-width.svelte-6bcb3a{width:100%}@media(hover: hover){button.svelte-6bcb3a:hover:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}button.focus-visible.svelte-6bcb3a:focus:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.3}button.focus-visible.toggle.svelte-6bcb3a:focus:not(.active):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}}",append(document.head,t)),init(this,e,ye,be,safe_not_equal,{class:1,style:2,icon:3,fab:4,dense:5,raised:6,unelevated:7,outlined:8,shaped:9,color:17,ripple:10,toggle:11,active:0,fullWidth:12});}}function Oe(e){let t;return {c(){t=element("span"),t.textContent="*",attr(t,"class","required svelte-1dzu4e7");},m(e,n){insert(e,t,n);},d(e){e&&detach(t);}}}function Pe(e){let t,n,l;return {c(){t=element("div"),n=space(),l=element("div"),attr(t,"class","input-line svelte-1dzu4e7"),attr(l,"class","focus-line svelte-1dzu4e7");},m(e,o){insert(e,t,o),insert(e,n,o),insert(e,l,o);},d(e){e&&detach(t),e&&detach(n),e&&detach(l);}}}function We(e){let t,n,l,o=(e[11]||e[10])+"";return {c(){t=element("div"),n=element("div"),l=text(o),attr(n,"class","message"),attr(t,"class","help svelte-1dzu4e7"),toggle_class(t,"persist",e[9]),toggle_class(t,"error",e[11]);},m(e,o){insert(e,t,o),append(t,n),append(n,l);},p(e,n){3072&n&&o!==(o=(e[11]||e[10])+"")&&set_data(l,o),512&n&&toggle_class(t,"persist",e[9]),2048&n&&toggle_class(t,"error",e[11]);},d(e){e&&detach(t);}}}function Xe(t){let n,l,i,p,f,v,h,g,m,b,k,D,C=[{class:"input"},t[12]],M={};for(let e=0;e<C.length;e+=1)M=assign(M,C[e]);let Y=t[2]&&!t[0].length&&Oe(),j=(!t[7]||t[8])&&Pe(),A=(!!t[10]||!!t[11])&&We(t);return {c(){n=element("div"),l=element("input"),i=space(),p=element("div"),f=space(),v=element("div"),h=text(t[6]),g=space(),Y&&Y.c(),m=space(),j&&j.c(),b=space(),A&&A.c(),set_attributes(l,M),toggle_class(l,"svelte-1dzu4e7",!0),attr(p,"class","focus-ring svelte-1dzu4e7"),attr(v,"class","label svelte-1dzu4e7"),attr(n,"class",k=null_to_empty(`text-field ${t[7]&&!t[8]?"outlined":"baseline"} ${t[3]}`)+" svelte-1dzu4e7"),attr(n,"style",t[4]),attr(n,"title",t[5]),toggle_class(n,"filled",t[8]),toggle_class(n,"dirty",t[13]),toggle_class(n,"disabled",t[1]);},m(s,a){insert(s,n,a),append(n,l),set_input_value(l,t[0]),append(n,i),append(n,p),append(n,f),append(n,v),append(v,h),append(v,g),Y&&Y.m(v,null),append(n,m),j&&j.m(n,null),append(n,b),A&&A.m(n,null),D=[listen(l,"input",t[19]),action_destroyer(t[14].call(null,l))];},p(e,[t]){set_attributes(l,get_spread_update(C,[{class:"input"},4096&t&&e[12]])),1&t&&l.value!==e[0]&&set_input_value(l,e[0]),toggle_class(l,"svelte-1dzu4e7",!0),64&t&&set_data(h,e[6]),e[2]&&!e[0].length?Y||(Y=Oe(),Y.c(),Y.m(v,null)):Y&&(Y.d(1),Y=null),!e[7]||e[8]?j||(j=Pe(),j.c(),j.m(n,b)):j&&(j.d(1),j=null),e[10]||e[11]?A?A.p(e,t):(A=We(e),A.c(),A.m(n,null)):A&&(A.d(1),A=null),392&t&&k!==(k=null_to_empty(`text-field ${e[7]&&!e[8]?"outlined":"baseline"} ${e[3]}`)+" svelte-1dzu4e7")&&attr(n,"class",k),16&t&&attr(n,"style",e[4]),32&t&&attr(n,"title",e[5]),392&t&&toggle_class(n,"filled",e[8]),8584&t&&toggle_class(n,"dirty",e[13]),394&t&&toggle_class(n,"disabled",e[1]);},i:noop,o:noop,d(e){e&&detach(n),Y&&Y.d(),j&&j.d(),A&&A.d(),run_all(D);}}}function Ve(e,t,n){const l=ie(current_component);let o,{value:i=""}=t,{disabled:s=!1}=t,{required:r=!1}=t,{class:a=""}=t,{style:c=null}=t,{title:d=null}=t,{label:u=""}=t,{outlined:p=!1}=t,{filled:f=!1}=t,{messagePersist:v=!1}=t,{message:h=""}=t,{error:g=""}=t,m={};const b=["date","datetime-local","email","month","number","password","search","tel","text","time","url","week"],x=["date","datetime-local","month","time","week"];let w;return e.$set=e=>{n(18,t=assign(assign({},t),exclude_internal_props(e))),"value"in e&&n(0,i=e.value),"disabled"in e&&n(1,s=e.disabled),"required"in e&&n(2,r=e.required),"class"in e&&n(3,a=e.class),"style"in e&&n(4,c=e.style),"title"in e&&n(5,d=e.title),"label"in e&&n(6,u=e.label),"outlined"in e&&n(7,p=e.outlined),"filled"in e&&n(8,f=e.filled),"messagePersist"in e&&n(9,v=e.messagePersist),"message"in e&&n(10,h=e.message),"error"in e&&n(11,g=e.error);},e.$$.update=()=>{{const{value:e,style:l,title:i,label:s,outlined:r,filled:a,messagePersist:c,message:d,error:u,...p}=t;!p.readonly&&delete p.readonly,!p.disabled&&delete p.disabled,delete p.class,p.type=b.indexOf(p.type)<0?"text":p.type,n(15,o=p.placeholder),n(12,m=p);}36865&e.$$.dirty&&n(13,w="string"==typeof i&&i.length>0||"number"==typeof i||o||x.indexOf(m.type)>=0);},t=exclude_internal_props(t),[i,s,r,a,c,d,u,p,f,v,h,g,m,w,l,o,b,x,t,function(){i=this.value,n(0,i);}]}class Re extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1dzu4e7-style")||((t=element("style")).id="svelte-1dzu4e7-style",t.textContent=".text-field.svelte-1dzu4e7.svelte-1dzu4e7{font-family:Roboto, 'Segoe UI', sans-serif;font-weight:400;font-size:inherit;text-decoration:inherit;text-transform:inherit;box-sizing:border-box;margin:0 0 20px;position:relative;width:100%;background-color:inherit;will-change:opacity, transform, color}.outlined.svelte-1dzu4e7.svelte-1dzu4e7{margin-top:12px}.required.svelte-1dzu4e7.svelte-1dzu4e7{position:relative;top:0.175em;left:0.125em;color:#ff5252}.input.svelte-1dzu4e7.svelte-1dzu4e7{box-sizing:border-box;font:inherit;width:100%;min-height:32px;background:none;text-align:left;color:#333;color:var(--color, #333);caret-color:#1976d2;caret-color:var(--primary, #1976d2);border:none;margin:0;padding:2px 0 0;outline:none}.input.svelte-1dzu4e7.svelte-1dzu4e7::placeholder{color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));font-weight:100}.input.svelte-1dzu4e7.svelte-1dzu4e7::-moz-focus-inner{padding:0;border:0}.input.svelte-1dzu4e7.svelte-1dzu4e7:-moz-focusring{outline:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:required{box-shadow:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:invalid{box-shadow:none}.input.svelte-1dzu4e7.svelte-1dzu4e7:active{outline:none}.input:hover~.input-line.svelte-1dzu4e7.svelte-1dzu4e7{background:#333;background:var(--color, #333)}.label.svelte-1dzu4e7.svelte-1dzu4e7{font:inherit;display:inline-flex;position:absolute;left:0;top:28px;padding-right:0.2em;color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));background-color:inherit;pointer-events:none;-webkit-backface-visibility:hidden;backface-visibility:hidden;overflow:hidden;max-width:90%;white-space:nowrap;transform-origin:left top;transition:0.18s cubic-bezier(0.25, 0.8, 0.5, 1)}.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7{pointer-events:none;margin:0;padding:0;border:2px solid transparent;border-radius:4px;position:absolute;left:0;top:0;right:0;bottom:0}.input-line.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;left:0;right:0;bottom:0;margin:0;height:1px;background:rgba(0, 0, 0, 0.3755);background:var(--label, rgba(0, 0, 0, 0.3755))}.focus-line.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;bottom:0;left:0;right:0;height:2px;-webkit-transform:scaleX(0);transform:scaleX(0);transition:transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\t-webkit-transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);transition:transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.18s cubic-bezier(0.4, 0, 0.2, 1);opacity:0;z-index:2;background:#1976d2;background:var(--primary, #1976d2)}.help.svelte-1dzu4e7.svelte-1dzu4e7{position:absolute;left:0;right:0;bottom:-18px;display:flex;justify-content:space-between;font-size:12px;line-height:normal;letter-spacing:0.4px;color:rgba(0, 0, 0, 0.3755);color:var(--label, rgba(0, 0, 0, 0.3755));opacity:0;overflow:hidden;max-width:90%;white-space:nowrap}.persist.svelte-1dzu4e7.svelte-1dzu4e7,.error.svelte-1dzu4e7.svelte-1dzu4e7,.input:focus~.help.svelte-1dzu4e7.svelte-1dzu4e7{opacity:1}.error.svelte-1dzu4e7.svelte-1dzu4e7{color:#ff5252}.baseline.dirty.svelte-1dzu4e7 .label.svelte-1dzu4e7{letter-spacing:0.4px;top:6px;bottom:unset;font-size:13px}.baseline .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{letter-spacing:0.4px;top:6px;bottom:unset;font-size:13px;color:#1976d2;color:var(--primary, #1976d2)}.baseline .input:focus~.focus-line.svelte-1dzu4e7.svelte-1dzu4e7{transform:scaleX(1);opacity:1}.baseline.svelte-1dzu4e7 .input.svelte-1dzu4e7{height:52px;padding-top:22px}.baseline.filled.svelte-1dzu4e7.svelte-1dzu4e7{background:rgba(0, 0, 0, 0.0555);background:var(--bg-input-filled, rgba(0, 0, 0, 0.0555));border-radius:4px 4px 0 0}.baseline.filled.svelte-1dzu4e7 .label.svelte-1dzu4e7{background:none}.baseline.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7,.baseline.filled.svelte-1dzu4e7 .label.svelte-1dzu4e7{padding-left:8px;padding-right:8px}.baseline.filled .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{top:6px}.baseline.filled.svelte-1dzu4e7 .help.svelte-1dzu4e7{padding-left:8px}.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7:hover,.filled.svelte-1dzu4e7 .input.svelte-1dzu4e7:focus{background:rgba(0, 0, 0, 0.0555);background:var(--bg-input-filled, rgba(0, 0, 0, 0.0555))}.outlined.svelte-1dzu4e7 .help.svelte-1dzu4e7{left:18px}.outlined.svelte-1dzu4e7 .input.svelte-1dzu4e7{padding:11px 16px 9px;border-radius:4px;border:1px solid;border-color:rgba(0, 0, 0, 0.3755);border-color:var(--label, rgba(0, 0, 0, 0.3755))}.outlined.svelte-1dzu4e7 .label.svelte-1dzu4e7{top:12px;bottom:unset;left:17px}.outlined.dirty.svelte-1dzu4e7 .label.svelte-1dzu4e7{top:-6px;bottom:unset;font-size:12px;letter-spacing:0.4px;padding:0 4px;left:13px}.outlined.svelte-1dzu4e7 .input.svelte-1dzu4e7:hover{border-color:#333;border-color:var(--color, #333)}.outlined .input:focus~.label.svelte-1dzu4e7.svelte-1dzu4e7{top:-6px;bottom:unset;font-size:12px;letter-spacing:0.4px;padding:0 4px;left:13px;color:#1976d2;color:var(--primary, #1976d2)}.outlined .input:focus~.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7,.outlined .input.focus-visible~.focus-ring.svelte-1dzu4e7.svelte-1dzu4e7{border-color:#1976d2;border-color:var(--primary, #1976d2)}",append(document.head,t)),init(this,e,Ve,Xe,safe_not_equal,{value:0,disabled:1,required:2,class:3,style:4,title:5,label:6,outlined:7,filled:8,messagePersist:9,message:10,error:11});}}

    /* src/Pages/SelectUserTypePage.svelte generated by Svelte v3.31.2 */
    const file = "src/Pages/SelectUserTypePage.svelte";

    // (9:2) <Button raised on:click={() => push("/student")}>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Student");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(9:2) <Button raised on:click={() => push(\\\"/student\\\")}>",
    		ctx
    	});

    	return block;
    }

    // (10:2) <Button raised on:click={() => push("/supervisor")}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Supervisor");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(10:2) <Button raised on:click={() => push(\\\"/supervisor\\\")}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let button0;
    	let t2;
    	let button1;
    	let current;

    	button0 = new xe({
    			props: {
    				raised: true,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*click_handler*/ ctx[0]);

    	button1 = new xe({
    			props: {
    				raised: true,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*click_handler_1*/ ctx[1]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Are you a student or supervisor?";
    			t1 = space();
    			create_component(button0.$$.fragment);
    			t2 = space();
    			create_component(button1.$$.fragment);
    			set_style(h2, "grid-column", "span 2");
    			add_location(h2, file, 7, 2, 193);
    			attr_dev(div, "class", "container svelte-xqczfr");
    			add_location(div, file, 6, 0, 167);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			mount_component(button0, div, null);
    			append_dev(div, t2);
    			mount_component(button1, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SelectUserTypePage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SelectUserTypePage> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => push("/student");
    	const click_handler_1 = () => push("/supervisor");
    	$$self.$capture_state = () => ({ btnStyle, push, pop, replace, Button: xe });
    	return [click_handler, click_handler_1];
    }

    class SelectUserTypePage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SelectUserTypePage",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/Pages/Supervisor/SupervisorPage.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/Pages/Supervisor/SupervisorPage.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (1:0) <script>   import { APIStore }
    function create_catch_block_1(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block_1.name,
    		type: "catch",
    		source: "(1:0) <script>   import { APIStore }",
    		ctx
    	});

    	return block;
    }

    // (49:0) {:then info}
    function create_then_block(ctx) {
    	let div0;
    	let h20;
    	let t1;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let div1;
    	let h21;
    	let t4;
    	let current_block_type_index_1;
    	let if_block1;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*info*/ ctx[9].potStudents.pendingAddrs.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	const if_block_creators_1 = [create_if_block$1, create_else_block_1];
    	const if_blocks_1 = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*info*/ ctx[9].currStudents.addrs.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index_1 = select_block_type_1(ctx);
    	if_block1 = if_blocks_1[current_block_type_index_1] = if_block_creators_1[current_block_type_index_1](ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Potential Students";
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Current Students";
    			t4 = space();
    			if_block1.c();
    			add_location(h20, file$1, 50, 4, 1351);
    			add_location(div0, file$1, 49, 2, 1341);
    			add_location(h21, file$1, 71, 4, 1994);
    			add_location(div1, file$1, 70, 2, 1984);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			if_blocks[current_block_type_index].m(div0, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h21);
    			append_dev(div1, t4);
    			if_blocks_1[current_block_type_index_1].m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block0.p(ctx, dirty);
    			if_block1.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    			if_blocks_1[current_block_type_index_1].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(49:0) {:then info}",
    		ctx
    	});

    	return block;
    }

    // (63:4) {:else}
    function create_else_block_2(ctx) {
    	let p;
    	let t0;
    	let a;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("It looks like you have no pending students. To find out more, please\n        visit our\n        ");
    			a = element("a");
    			a.textContent = "Info page";
    			attr_dev(a, "href", "#");
    			add_location(a, file$1, 66, 8, 1924);
    			add_location(p, file$1, 63, 6, 1817);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(63:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (52:4) {#if info.potStudents.pendingAddrs.length > 0}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_1 = /*info*/ ctx[9].potStudents.pendingAddrs;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*approveStudent, prom*/ 3) {
    				each_value_1 = /*info*/ ctx[9].potStudents.pendingAddrs;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(52:4) {#if info.potStudents.pendingAddrs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (59:12) <Button type="submit" name="">
    function create_default_slot_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Approve Student");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(59:12) <Button type=\\\"submit\\\" name=\\\"\\\">",
    		ctx
    	});

    	return block;
    }

    // (53:6) {#each info.potStudents.pendingAddrs as potStud, i}
    function create_each_block_1(ctx) {
    	let div;
    	let p;
    	let t0;
    	let t1_value = /*potStud*/ ctx[14] + "";
    	let t1;
    	let t2;
    	let form;
    	let button;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	button = new xe({
    			props: {
    				type: "submit",
    				name: "",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function submit_handler() {
    		return /*submit_handler*/ ctx[3](/*info*/ ctx[9], /*i*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("Pending student with address: ");
    			t1 = text(t1_value);
    			t2 = space();
    			form = element("form");
    			create_component(button.$$.fragment);
    			t3 = space();
    			add_location(p, file$1, 54, 10, 1532);
    			add_location(form, file$1, 55, 10, 1589);
    			attr_dev(div, "class", "pot-student svelte-1piaiq3");
    			add_location(div, file$1, 53, 8, 1496);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(div, t2);
    			append_dev(div, form);
    			mount_component(button, form, null);
    			append_dev(div, t3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", submit_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 65536) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(53:6) {#each info.potStudents.pendingAddrs as potStud, i}",
    		ctx
    	});

    	return block;
    }

    // (96:4) {:else}
    function create_else_block_1(ctx) {
    	let p;
    	let t0;
    	let a;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("It looks like you have no current students. To find out more, please\n        visit our\n        ");
    			a = element("a");
    			a.textContent = "Info page";
    			attr_dev(a, "href", "#");
    			add_location(a, file$1, 99, 8, 3010);
    			add_location(p, file$1, 96, 6, 2903);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(96:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:4) {#if info.currStudents.addrs.length > 0}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*info*/ ctx[9].currStudents.addrs;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*prom, approveToks*/ 5) {
    				each_value = /*info*/ ctx[9].currStudents.addrs;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(73:4) {#if info.currStudents.addrs.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { APIStore }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { APIStore }",
    		ctx
    	});

    	return block;
    }

    // (78:10) {:then newPendingToks}
    function create_then_block_1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*newPendingToks*/ ctx[13].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block_1.name,
    		type: "then",
    		source: "(78:10) {:then newPendingToks}",
    		ctx
    	});

    	return block;
    }

    // (81:12) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t0;
    	let t1_value = /*currStud*/ ctx[10] + "";
    	let t1;
    	let t2;
    	let t3_value = /*newPendingToks*/ ctx[13].length + "";
    	let t3;
    	let t4;
    	let t5;
    	let form;
    	let button;
    	let current;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*currStud*/ ctx[10]);
    	}

    	button = new xe({
    			props: {
    				type: "submit",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button.$on("click", click_handler);

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Current student with address: ");
    			t1 = text(t1_value);
    			t2 = text(" has a pending balance of\n                ");
    			t3 = text(t3_value);
    			t4 = text("\n                new tokens");
    			t5 = space();
    			form = element("form");
    			create_component(button.$$.fragment);
    			add_location(p, file$1, 81, 14, 2448);
    			attr_dev(form, "action", "");
    			add_location(form, file$1, 86, 14, 2634);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(button, form, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 65536) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(form);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(81:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (79:12) {#if newPendingToks.length === 0}
    function create_if_block_1(ctx) {
    	let t0;
    	let t1_value = /*currStud*/ ctx[10] + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("It looks like student with address ");
    			t1 = text(t1_value);
    			t2 = text(" has no new pending balance");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(79:12) {#if newPendingToks.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (88:16) <Button type="submit" on:click={() => approveToks(currStud)}                   >
    function create_default_slot$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Approve pending balance");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(88:16) <Button type=\\\"submit\\\" on:click={() => approveToks(currStud)}                   >",
    		ctx
    	});

    	return block;
    }

    // (76:55)              Loading pending balance...           {:then newPendingToks}
    function create_pending_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading pending balance...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block_1.name,
    		type: "pending",
    		source: "(76:55)              Loading pending balance...           {:then newPendingToks}",
    		ctx
    	});

    	return block;
    }

    // (74:6) {#each info.currStudents.addrs as currStud, i}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block_1,
    		then: create_then_block_1,
    		catch: create_catch_block,
    		value: 13,
    		blocks: [,,,]
    	};

    	handle_promise(ctx[9].currStudents.pendingBalProms[/*i*/ ctx[12]], info);

    	const block = {
    		c: function create() {
    			div = element("div");
    			info.block.c();
    			t = space();
    			attr_dev(div, "class", "curr-student svelte-1piaiq3");
    			add_location(div, file$1, 74, 8, 2126);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			info.block.m(div, info.anchor = null);
    			info.mount = () => div;
    			info.anchor = t;
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[13] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(74:6) {#each info.currStudents.addrs as currStud, i}",
    		ctx
    	});

    	return block;
    }

    // (47:13)    Loading... {:then info}
    function create_pending_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(47:13)    Loading... {:then info}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let await_block_anchor;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block_1,
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(ctx[0], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[9] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $APIStore;
    	validate_store(APIStore, "APIStore");
    	component_subscribe($$self, APIStore, $$value => $$invalidate(5, $APIStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SupervisorPage", slots, []);

    	async function getPendingStudents() {
    		const pending = await $APIStore.EvieCoin.methods.getSupsPotentialStudents().call({ from: $APIStore.address });

    		return {
    			pendingAddrs: pending[0],
    			pendingIdxs: pending[1]
    		};
    	}

    	async function getCurrStudents() {
    		const curr = await $APIStore.EvieCoin.methods.getSupsStudents().call({ from: $APIStore.address });
    		const pendingBalProms = curr[0].map(addr => $APIStore.EvieCoin.methods.getPendingCollectibles(addr).call());

    		return {
    			addrs: curr[0],
    			addrsIdx: curr[1],
    			pendingBalProms
    		};
    	}

    	async function loadData() {
    		const pend = getPendingStudents();
    		const curr = getCurrStudents();
    		const ret = await Promise.all([pend, curr]);

    		return {
    			potStudents: ret[0],
    			currStudents: ret[1]
    		};
    	}

    	const prom = loadData();

    	async function approveStudent(potStudIdx) {
    		await $APIStore.EvieCoin.methods.potentialSupApproveStudent(potStudIdx).send({ from: $APIStore.address });
    	}

    	async function approveToks(studAddr) {
    		await $APIStore.EvieCoin.methods.SupervisorApproveAll(studAddr).send({ from: $APIStore.address });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SupervisorPage> was created with unknown prop '${key}'`);
    	});

    	const submit_handler = (info, i) => approveStudent(info.potStudents.pendingIdxs[i]);
    	const click_handler = currStud => approveToks(currStud);

    	$$self.$capture_state = () => ({
    		APIStore,
    		Button: xe,
    		getPendingStudents,
    		getCurrStudents,
    		loadData,
    		prom,
    		approveStudent,
    		approveToks,
    		$APIStore
    	});

    	return [prom, approveStudent, approveToks, submit_handler, click_handler];
    }

    class SupervisorPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SupervisorPage",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const constants = {
        dateFormatStr: "dddd, mmmm dS, yyyy, h:MM:ss TT"
    };

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var dateformat = createCommonjsModule(function (module, exports) {
    function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj};}else {_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj};}return _typeof(obj)}(function(global){var _arguments=arguments;var dateFormat=function(){var token=/d{1,4}|D{3,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LlopSZWN]|"[^"]*"|'[^']*'/g;var timezone=/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;var timezoneClip=/[^-+\dA-Z]/g;return function(date,mask,utc,gmt){if(_arguments.length===1&&kindOf(date)==="string"&&!/\d/.test(date)){mask=date;date=undefined;}date=date||date===0?date:new Date;if(!(date instanceof Date)){date=new Date(date);}if(isNaN(date)){throw TypeError("Invalid date")}mask=String(dateFormat.masks[mask]||mask||dateFormat.masks["default"]);var maskSlice=mask.slice(0,4);if(maskSlice==="UTC:"||maskSlice==="GMT:"){mask=mask.slice(4);utc=true;if(maskSlice==="GMT:"){gmt=true;}}var _=function _(){return utc?"getUTC":"get"};var _d=function d(){return date[_()+"Date"]()};var D=function D(){return date[_()+"Day"]()};var _m=function m(){return date[_()+"Month"]()};var y=function y(){return date[_()+"FullYear"]()};var _H=function H(){return date[_()+"Hours"]()};var _M=function M(){return date[_()+"Minutes"]()};var _s=function s(){return date[_()+"Seconds"]()};var _L=function L(){return date[_()+"Milliseconds"]()};var _o=function o(){return utc?0:date.getTimezoneOffset()};var _W=function W(){return getWeek(date)};var _N=function N(){return getDayOfWeek(date)};var flags={d:function d(){return _d()},dd:function dd(){return pad(_d())},ddd:function ddd(){return dateFormat.i18n.dayNames[D()]},DDD:function DDD(){return getDayName({y:y(),m:_m(),D:D(),_:_(),dayName:dateFormat.i18n.dayNames[D()],short:true})},dddd:function dddd(){return dateFormat.i18n.dayNames[D()+7]},DDDD:function DDDD(){return getDayName({y:y(),m:_m(),D:D(),_:_(),dayName:dateFormat.i18n.dayNames[D()+7]})},m:function m(){return _m()+1},mm:function mm(){return pad(_m()+1)},mmm:function mmm(){return dateFormat.i18n.monthNames[_m()]},mmmm:function mmmm(){return dateFormat.i18n.monthNames[_m()+12]},yy:function yy(){return String(y()).slice(2)},yyyy:function yyyy(){return pad(y(),4)},h:function h(){return _H()%12||12},hh:function hh(){return pad(_H()%12||12)},H:function H(){return _H()},HH:function HH(){return pad(_H())},M:function M(){return _M()},MM:function MM(){return pad(_M())},s:function s(){return _s()},ss:function ss(){return pad(_s())},l:function l(){return pad(_L(),3)},L:function L(){return pad(Math.floor(_L()/10))},t:function t(){return _H()<12?dateFormat.i18n.timeNames[0]:dateFormat.i18n.timeNames[1]},tt:function tt(){return _H()<12?dateFormat.i18n.timeNames[2]:dateFormat.i18n.timeNames[3]},T:function T(){return _H()<12?dateFormat.i18n.timeNames[4]:dateFormat.i18n.timeNames[5]},TT:function TT(){return _H()<12?dateFormat.i18n.timeNames[6]:dateFormat.i18n.timeNames[7]},Z:function Z(){return gmt?"GMT":utc?"UTC":(String(date).match(timezone)||[""]).pop().replace(timezoneClip,"").replace(/GMT\+0000/g,"UTC")},o:function o(){return (_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60)*100+Math.abs(_o())%60,4)},p:function p(){return (_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60),2)+":"+pad(Math.floor(Math.abs(_o())%60),2)},S:function S(){return ["th","st","nd","rd"][_d()%10>3?0:(_d()%100-_d()%10!=10)*_d()%10]},W:function W(){return _W()},N:function N(){return _N()}};return mask.replace(token,function(match){if(match in flags){return flags[match]()}return match.slice(1,match.length-1)})}}();dateFormat.masks={default:"ddd mmm dd yyyy HH:MM:ss",shortDate:"m/d/yy",paddedShortDate:"mm/dd/yyyy",mediumDate:"mmm d, yyyy",longDate:"mmmm d, yyyy",fullDate:"dddd, mmmm d, yyyy",shortTime:"h:MM TT",mediumTime:"h:MM:ss TT",longTime:"h:MM:ss TT Z",isoDate:"yyyy-mm-dd",isoTime:"HH:MM:ss",isoDateTime:"yyyy-mm-dd'T'HH:MM:sso",isoUtcDateTime:"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",expiresHeaderFormat:"ddd, dd mmm yyyy HH:MM:ss Z"};dateFormat.i18n={dayNames:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],monthNames:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","January","February","March","April","May","June","July","August","September","October","November","December"],timeNames:["a","p","am","pm","A","P","AM","PM"]};var pad=function pad(val,len){val=String(val);len=len||2;while(val.length<len){val="0"+val;}return val};var getDayName=function getDayName(_ref){var y=_ref.y,m=_ref.m,D=_ref.D,_=_ref._,dayName=_ref.dayName,_ref$short=_ref["short"],_short=_ref$short===void 0?false:_ref$short;var today=new Date;var yesterday=new Date;yesterday.setDate(yesterday[_+"Date"]()-1);var tomorrow=new Date;tomorrow.setDate(tomorrow[_+"Date"]()+1);var today_D=function today_D(){return today[_+"Day"]()};var today_m=function today_m(){return today[_+"Month"]()};var today_y=function today_y(){return today[_+"FullYear"]()};var yesterday_D=function yesterday_D(){return yesterday[_+"Day"]()};var yesterday_m=function yesterday_m(){return yesterday[_+"Month"]()};var yesterday_y=function yesterday_y(){return yesterday[_+"FullYear"]()};var tomorrow_D=function tomorrow_D(){return tomorrow[_+"Day"]()};var tomorrow_m=function tomorrow_m(){return tomorrow[_+"Month"]()};var tomorrow_y=function tomorrow_y(){return tomorrow[_+"FullYear"]()};if(today_y()===y&&today_m()===m&&today_D()===D){return _short?"Tdy":"Today"}else if(yesterday_y()===y&&yesterday_m()===m&&yesterday_D()===D){return _short?"Ysd":"Yesterday"}else if(tomorrow_y()===y&&tomorrow_m()===m&&tomorrow_D()===D){return _short?"Tmw":"Tomorrow"}return dayName};var getWeek=function getWeek(date){var targetThursday=new Date(date.getFullYear(),date.getMonth(),date.getDate());targetThursday.setDate(targetThursday.getDate()-(targetThursday.getDay()+6)%7+3);var firstThursday=new Date(targetThursday.getFullYear(),0,4);firstThursday.setDate(firstThursday.getDate()-(firstThursday.getDay()+6)%7+3);var ds=targetThursday.getTimezoneOffset()-firstThursday.getTimezoneOffset();targetThursday.setHours(targetThursday.getHours()-ds);var weekDiff=(targetThursday-firstThursday)/(864e5*7);return 1+Math.floor(weekDiff)};var getDayOfWeek=function getDayOfWeek(date){var dow=date.getDay();if(dow===0){dow=7;}return dow};var kindOf=function kindOf(val){if(val===null){return "null"}if(val===undefined){return "undefined"}if(_typeof(val)!=="object"){return _typeof(val)}if(Array.isArray(val)){return "array"}return {}.toString.call(val).slice(8,-1).toLowerCase()};if((_typeof(exports))==="object"){module.exports=dateFormat;}else {global.dateFormat=dateFormat;}})(void 0);
    });

    async function loadStudentType(evieCoin, address) {
        const status = await evieCoin.methods.studentStatus(address).call();
        return parseInt(status);
    }
    async function loadInitClockIn(evieCoin, address) {
        try {
            const startTimeEth = await evieCoin.methods.clock_in_times(address).call();
            const startTime = ethTimestampToDate(startTimeEth);
            StudentInfoStore.update((u) => {
                return Object.assign(Object.assign({}, u), { startTime });
            });
        }
        catch (error) {
            console.error(error);
            throw "Error getting initial clock in time";
        }
    }
    async function loadBal(evieCoin, address) {
        const bal = await evieCoin.methods.balanceOf(address).call();
        const pendingToks = await evieCoin.methods.getPendingCollectibles(address).call();
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { address, pendingToks: pendingToks.length, approvedToks: bal });
        });
    }

    /* src/Pages/Student/Approved.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/Pages/Student/Approved.svelte";

    // (51:2) <Button raised on:click={clockIn}>
    function create_default_slot_1$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Clock in");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(51:2) <Button raised on:click={clockIn}>",
    		ctx
    	});

    	return block;
    }

    // (52:2) <Button raised on:click={clockOut}>
    function create_default_slot$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Clock out");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(52:2) <Button raised on:click={clockOut}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let t3_value = (/*$StudentInfoStore*/ ctx[0].pendingToks || 0) + "";
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7_value = (/*$StudentInfoStore*/ ctx[0].approvedToks || 0) + "";
    	let t7;
    	let t8;
    	let t9;
    	let p2;
    	let t10;
    	let div1;
    	let p3;
    	let t11;

    	let t12_value = (/*$StudentInfoStore*/ ctx[0].startTime && /*$StudentInfoStore*/ ctx[0].startTime.getTime() !== new Date(0).getTime()
    	? dateformat(/*$StudentInfoStore*/ ctx[0].startTime, constants.dateFormatStr)
    	: "Please clock in to see your start time") + "";

    	let t12;
    	let t13;
    	let button0;
    	let t14;
    	let button1;
    	let current;

    	button0 = new xe({
    			props: {
    				raised: true,
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button0.$on("click", /*clockIn*/ ctx[1]);

    	button1 = new xe({
    			props: {
    				raised: true,
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1.$on("click", /*clockOut*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Your balances";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Your currently have ");
    			t3 = text(t3_value);
    			t4 = text("\n      pending tokens");
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Your currently have ");
    			t7 = text(t7_value);
    			t8 = text("\n      approved tokens");
    			t9 = space();
    			p2 = element("p");
    			t10 = space();
    			div1 = element("div");
    			p3 = element("p");
    			t11 = text("Start time: ");
    			t12 = text(t12_value);
    			t13 = space();
    			create_component(button0.$$.fragment);
    			t14 = space();
    			create_component(button1.$$.fragment);
    			attr_dev(h2, "class", "svelte-1afbjty");
    			add_location(h2, file$2, 31, 4, 933);
    			attr_dev(p0, "class", "svelte-1afbjty");
    			add_location(p0, file$2, 32, 4, 960);
    			attr_dev(p1, "class", "svelte-1afbjty");
    			add_location(p1, file$2, 36, 4, 1061);
    			attr_dev(div0, "class", "balances svelte-1afbjty");
    			set_style(div0, "grid-column", "1 / span 2");
    			add_location(div0, file$2, 30, 2, 873);
    			set_style(p2, "grid-column", "1 / span 2");
    			attr_dev(p2, "class", "svelte-1afbjty");
    			add_location(p2, file$2, 41, 2, 1171);
    			attr_dev(p3, "class", "svelte-1afbjty");
    			add_location(p3, file$2, 43, 4, 1255);
    			set_style(div1, "grid-column", "1 / span 2");
    			attr_dev(div1, "class", "svelte-1afbjty");
    			add_location(div1, file$2, 42, 2, 1212);
    			attr_dev(div2, "class", "container svelte-1afbjty");
    			add_location(div2, file$2, 29, 0, 847);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    			append_dev(div2, t9);
    			append_dev(div2, p2);
    			append_dev(div2, t10);
    			append_dev(div2, div1);
    			append_dev(div1, p3);
    			append_dev(p3, t11);
    			append_dev(p3, t12);
    			append_dev(div2, t13);
    			mount_component(button0, div2, null);
    			append_dev(div2, t14);
    			mount_component(button1, div2, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$StudentInfoStore*/ 1) && t3_value !== (t3_value = (/*$StudentInfoStore*/ ctx[0].pendingToks || 0) + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*$StudentInfoStore*/ 1) && t7_value !== (t7_value = (/*$StudentInfoStore*/ ctx[0].approvedToks || 0) + "")) set_data_dev(t7, t7_value);

    			if ((!current || dirty & /*$StudentInfoStore*/ 1) && t12_value !== (t12_value = (/*$StudentInfoStore*/ ctx[0].startTime && /*$StudentInfoStore*/ ctx[0].startTime.getTime() !== new Date(0).getTime()
    			? dateformat(/*$StudentInfoStore*/ ctx[0].startTime, constants.dateFormatStr)
    			: "Please clock in to see your start time") + "")) set_data_dev(t12, t12_value);

    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(button0);
    			destroy_component(button1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $APIStore;
    	let $StudentInfoStore;
    	validate_store(APIStore, "APIStore");
    	component_subscribe($$self, APIStore, $$value => $$invalidate(3, $APIStore = $$value));
    	validate_store(StudentInfoStore, "StudentInfoStore");
    	component_subscribe($$self, StudentInfoStore, $$value => $$invalidate(0, $StudentInfoStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Approved", slots, []);

    	onMount(async () => {
    		const proms = [
    			loadBal($APIStore.EvieCoin, $APIStore.address),
    			loadInitClockIn($APIStore.EvieCoin, $APIStore.address)
    		];

    		await Promise.all(proms);
    	});

    	async function clockIn() {
    		await $APIStore.EvieCoin.methods.clockStartTime().send({ from: $APIStore.address });
    	}

    	async function clockOut() {
    		await $APIStore.EvieCoin.methods.clockEndTime().send({ from: $APIStore.address });
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Approved> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		weiToCoinNumber,
    		constants,
    		APIStore,
    		StudentInfoStore,
    		Button: xe,
    		dateformat,
    		onMount,
    		loadBal,
    		loadInitClockIn,
    		clockIn,
    		clockOut,
    		$APIStore,
    		$StudentInfoStore
    	});

    	return [$StudentInfoStore, clockIn, clockOut];
    }

    class Approved extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Approved",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Pages/Student/PendingStudent.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/Pages/Student/PendingStudent.svelte";

    // (22:2) {:else}
    function create_else_block$2(ctx) {
    	let h2;
    	let t1;
    	let form;
    	let textfield;
    	let updating_value;
    	let t2;
    	let button;
    	let current;
    	let mounted;
    	let dispose;

    	function textfield_value_binding(value) {
    		/*textfield_value_binding*/ ctx[3].call(null, value);
    	}

    	let textfield_props = {
    		type: "text",
    		label: "Supervisor Address",
    		required: true
    	};

    	if (/*supervisor*/ ctx[1] !== void 0) {
    		textfield_props.value = /*supervisor*/ ctx[1];
    	}

    	textfield = new Re({ props: textfield_props, $$inline: true });
    	binding_callbacks.push(() => bind(textfield, "value", textfield_value_binding));

    	button = new xe({
    			props: {
    				type: "submit",
    				value: "submit",
    				raised: true,
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Request a supervisor";
    			t1 = space();
    			form = element("form");
    			create_component(textfield.$$.fragment);
    			t2 = space();
    			create_component(button.$$.fragment);
    			add_location(h2, file$3, 22, 4, 671);
    			attr_dev(form, "action", "");
    			add_location(form, file$3, 23, 4, 705);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(textfield, form, null);
    			append_dev(form, t2);
    			mount_component(button, form, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", /*submit_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const textfield_changes = {};

    			if (!updating_value && dirty & /*supervisor*/ 2) {
    				updating_value = true;
    				textfield_changes.value = /*supervisor*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			textfield.$set(textfield_changes);
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			destroy_component(textfield);
    			destroy_component(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(22:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {#if studentAlreadyPending}
    function create_if_block$2(ctx) {
    	let h2;
    	let t1;
    	let form;
    	let button;
    	let current;

    	button = new xe({
    			props: {
    				type: "submit",
    				disabled: true,
    				raised: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Your requested supervisor is reviewing your request";
    			t1 = space();
    			form = element("form");
    			create_component(button.$$.fragment);
    			add_location(h2, file$3, 17, 4, 482);
    			attr_dev(form, "action", "");
    			add_location(form, file$3, 18, 4, 547);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			mount_component(button, form, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 64) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(17:2) {#if studentAlreadyPending}",
    		ctx
    	});

    	return block;
    }

    // (31:6) <Button type="submit" value="submit" raised>
    function create_default_slot_1$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Submit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(31:6) <Button type=\\\"submit\\\" value=\\\"submit\\\" raised>",
    		ctx
    	});

    	return block;
    }

    // (20:6) <Button type="submit" disabled raised>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Change requested supervisor");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(20:6) <Button type=\\\"submit\\\" disabled raised>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*studentAlreadyPending*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			add_location(div, file$3, 15, 0, 442);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $APIStore;
    	validate_store(APIStore, "APIStore");
    	component_subscribe($$self, APIStore, $$value => $$invalidate(5, $APIStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("PendingStudent", slots, []);
    	let { studentAlreadyPending = false } = $$props;
    	let supervisor;

    	async function createPotStudent() {
    		console.log("a");
    		await $APIStore.EvieCoin.methods.createPotentialStudent(supervisor).send({ from: $APIStore.address });
    	} // TODO: add pending shtuff to events and student info

    	const writable_props = ["studentAlreadyPending"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<PendingStudent> was created with unknown prop '${key}'`);
    	});

    	function textfield_value_binding(value) {
    		supervisor = value;
    		$$invalidate(1, supervisor);
    	}

    	const submit_handler = () => createPotStudent();

    	$$self.$$set = $$props => {
    		if ("studentAlreadyPending" in $$props) $$invalidate(0, studentAlreadyPending = $$props.studentAlreadyPending);
    	};

    	$$self.$capture_state = () => ({
    		APIStore,
    		StudentInfoStore,
    		Button: xe,
    		Textfield: Re,
    		studentAlreadyPending,
    		supervisor,
    		createPotStudent,
    		$APIStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("studentAlreadyPending" in $$props) $$invalidate(0, studentAlreadyPending = $$props.studentAlreadyPending);
    		if ("supervisor" in $$props) $$invalidate(1, supervisor = $$props.supervisor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		studentAlreadyPending,
    		supervisor,
    		createPotStudent,
    		textfield_value_binding,
    		submit_handler
    	];
    }

    class PendingStudent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { studentAlreadyPending: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PendingStudent",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get studentAlreadyPending() {
    		throw new Error("<PendingStudent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set studentAlreadyPending(value) {
    		throw new Error("<PendingStudent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var StudentStatus;
    (function (StudentStatus) {
        StudentStatus[StudentStatus["FullStudent"] = 0] = "FullStudent";
        StudentStatus[StudentStatus["PendingStudent"] = 1] = "PendingStudent";
        StudentStatus[StudentStatus["None"] = 2] = "None";
    })(StudentStatus || (StudentStatus = {}));

    /* src/Pages/Student/StudentPage.svelte generated by Svelte v3.31.2 */

    // (28:0) {:else}
    function create_else_block_1$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(28:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if connected}
    function create_if_block$3(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block$3];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*studentType*/ ctx[1] === StudentStatus.FullStudent) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(20:0) {#if connected}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {:else}
    function create_else_block$3(ctx) {
    	let pendingstudent;
    	let current;

    	pendingstudent = new PendingStudent({
    			props: {
    				studentAlreadyPending: /*studentType*/ ctx[1] === StudentStatus.PendingStudent
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(pendingstudent.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(pendingstudent, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const pendingstudent_changes = {};
    			if (dirty & /*studentType*/ 2) pendingstudent_changes.studentAlreadyPending = /*studentType*/ ctx[1] === StudentStatus.PendingStudent;
    			pendingstudent.$set(pendingstudent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(pendingstudent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(pendingstudent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(pendingstudent, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(23:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#if studentType === StudentStatus.FullStudent}
    function create_if_block_1$1(ctx) {
    	let approved;
    	let current;
    	approved = new Approved({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(approved.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(approved, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(approved.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(approved.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(approved, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(21:2) {#if studentType === StudentStatus.FullStudent}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*connected*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $APIStore;
    	validate_store(APIStore, "APIStore");
    	component_subscribe($$self, APIStore, $$value => $$invalidate(2, $APIStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StudentPage", slots, []);
    	let connected;
    	let studentType;

    	onMount(async () => {
    		const { EvieCoin, address } = $APIStore;
    		$$invalidate(1, studentType = await loadStudentType(EvieCoin, address));
    		$$invalidate(0, connected = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StudentPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Approved,
    		PendingStudent,
    		APIStore,
    		onMount,
    		loadStudentType,
    		StudentStatus,
    		connected,
    		studentType,
    		$APIStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("connected" in $$props) $$invalidate(0, connected = $$props.connected);
    		if ("studentType" in $$props) $$invalidate(1, studentType = $$props.studentType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [connected, studentType];
    }

    class StudentPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentPage",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$4 = "src/App.svelte";

    // (42:2) {:else}
    function create_else_block$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(42:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:2) {#if connected}
    function create_if_block$4(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: { routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(40:2) {#if connected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$4, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*connected*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container svelte-1xodwuc");
    			add_location(div, file$4, 38, 0, 1593);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let connected = false;
    	let web3;

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		if (!connected) {
    			const instance = yield loadWeb3();
    			yield initEvieCoin(instance);
    		}

    		$$invalidate(0, connected = true);

    		APIStore.subscribe(store => {
    			if (store.reloadPage) {
    				window.location.reload();
    			}
    		});
    	}));

    	const routes = {
    		"/": SelectUserTypePage,
    		"/student": StudentPage,
    		"/supervisor": SupervisorPage
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		Router,
    		loadWeb3,
    		onMount,
    		initEvieCoin,
    		APIStore,
    		StudentInfoStore,
    		SelectUserTypePage,
    		SupervisorPage,
    		StudentPage,
    		connected,
    		web3,
    		routes
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("connected" in $$props) $$invalidate(0, connected = $$props.connected);
    		if ("web3" in $$props) web3 = $$props.web3;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [connected, routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
