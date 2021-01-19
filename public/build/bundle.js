
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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
    function children(element) {
        return Array.from(element.childNodes);
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
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
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		name: "getPendingCollectibles",
    		outputs: [
    			{
    				internalType: "uint256[]",
    				name: "",
    				type: "uint256[]"
    			}
    		],
    		stateMutability: "view",
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		name: "ownerOf",
    		outputs: [
    			{
    				internalType: "address",
    				name: "",
    				type: "address"
    			}
    		],
    		stateMutability: "view",
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		type: "function"
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
    		name: "tokenURI",
    		outputs: [
    			{
    				internalType: "string",
    				name: "",
    				type: "string"
    			}
    		],
    		stateMutability: "view",
    		type: "function"
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
    var metadata = "{\"compiler\":{\"version\":\"0.7.0+commit.9e61f92b\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"approved\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"ApprovalForAll\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"}],\"name\":\"ClockInTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"}],\"name\":\"ClockOutTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"tokId\",\"type\":\"uint256\"}],\"name\":\"PayoutMadeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokInd\",\"type\":\"uint256\"}],\"name\":\"SupervisorApprove\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"SupervisorApproveAll\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"baseURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockEndTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockStartTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"clock_in_times\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"supervisor\",\"type\":\"address\"}],\"name\":\"createPotentialStudent\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"getApproved\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"student\",\"type\":\"address\"}],\"name\":\"getPendingCollectibles\",\"outputs\":[{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getSupsPotentialStudents\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"getSupsStudents\",\"outputs\":[{\"internalType\":\"address[]\",\"name\":\"\",\"type\":\"address[]\"},{\"internalType\":\"uint256[]\",\"name\":\"\",\"type\":\"uint256[]\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"}],\"name\":\"isApprovedForAll\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"ownerOf\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"pendingStudentInd\",\"type\":\"uint256\"}],\"name\":\"potentialSupApproveStudent\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"_data\",\"type\":\"bytes\"}],\"name\":\"safeTransferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"operator\",\"type\":\"address\"},{\"internalType\":\"bool\",\"name\":\"approved\",\"type\":\"bool\"}],\"name\":\"setApprovalForAll\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"studentStatus\",\"outputs\":[{\"internalType\":\"enum StudentAndSup.StudentType\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"bytes4\",\"name\":\"interfaceId\",\"type\":\"bytes4\"}],\"name\":\"supportsInterface\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"tokenByIndex\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"index\",\"type\":\"uint256\"}],\"name\":\"tokenOfOwnerByIndex\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"tokenURI\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"tokenId\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"devdoc\":{\"details\":\"a coin which is rewarded to a student upon completition of clocking in and out within less than an hour A supervisor can then approve the coin\",\"kind\":\"dev\",\"methods\":{\"approve(address,uint256)\":{\"details\":\"See {IERC721-approve}.\"},\"balanceOf(address)\":{\"details\":\"See {IERC721-balanceOf}.\"},\"baseURI()\":{\"details\":\"Returns the base URI set via {_setBaseURI}. This will be automatically added as a prefix in {tokenURI} to each token's URI, or to the token ID if no specific URI is set for that token ID.\"},\"clockStartTime()\":{\"details\":\"a user clocks in their start time\"},\"createPotentialStudent(address)\":{\"details\":\"msg.sender is the student's address\",\"params\":{\"supervisor\":\"- The student's desired supervisor\"}},\"getApproved(uint256)\":{\"details\":\"See {IERC721-getApproved}.\"},\"isApprovedForAll(address,address)\":{\"details\":\"See {IERC721-isApprovedForAll}.\"},\"name()\":{\"details\":\"See {IERC721Metadata-name}.\"},\"owner()\":{\"details\":\"Returns the address of the current owner.\"},\"ownerOf(uint256)\":{\"details\":\"See {IERC721-ownerOf}.\"},\"renounceOwnership()\":{\"details\":\"Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.\"},\"safeTransferFrom(address,address,uint256)\":{\"details\":\"See {IERC721-safeTransferFrom}.\"},\"safeTransferFrom(address,address,uint256,bytes)\":{\"details\":\"See {IERC721-safeTransferFrom}.\"},\"setApprovalForAll(address,bool)\":{\"details\":\"See {IERC721-setApprovalForAll}.\"},\"studentStatus()\":{\"details\":\"get whether the student is a pending potential student, initialized, or nothing at all \"},\"supportsInterface(bytes4)\":{\"details\":\"See {IERC165-supportsInterface}. Time complexity O(1), guaranteed to always use less than 30 000 gas.\"},\"symbol()\":{\"details\":\"See {IERC721Metadata-symbol}.\"},\"tokenByIndex(uint256)\":{\"details\":\"See {IERC721Enumerable-tokenByIndex}.\"},\"tokenOfOwnerByIndex(address,uint256)\":{\"details\":\"See {IERC721Enumerable-tokenOfOwnerByIndex}.\"},\"tokenURI(uint256)\":{\"details\":\"See {IERC721Metadata-tokenURI}.\"},\"totalSupply()\":{\"details\":\"See {IERC721Enumerable-totalSupply}.\"},\"transferFrom(address,address,uint256)\":{\"details\":\"See {IERC721-transferFrom}.\"},\"transferOwnership(address)\":{\"details\":\"Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.\"}},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":\"EvieCoin\"},\"evmVersion\":\"istanbul\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"ipfs\"},\"optimizer\":{\"enabled\":false,\"runs\":200},\"remappings\":[]},\"sources\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":{\"keccak256\":\"0x6b176c6e6c1f9fcfa6b2a179344864de998370d41b82f4ac11188cd800cf1f00\",\"urls\":[\"bzz-raw://4306664c4f39ad66a5756585f778c402ef46262ca1d8839a17aeabb08a2ba951\",\"dweb:/ipfs/QmbYj1nifhKYnBUKPPQYwVaqPCNAkCQ5WsHWG5Vu2FVQ6T\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/StudentAndSup.sol\":{\"keccak256\":\"0x3d10bfe9d684a5d81dc6fc30e99b31586f4486524795ec066a3989949c57ee29\",\"urls\":[\"bzz-raw://3ae850d8699be1d1e448f45eb6d22eaa19da3f00452f5c56e6e4b28d72bd3157\",\"dweb:/ipfs/QmaW4af798KTRC2wf8hjXvCQYe7QS5PWY1Q2uDET1CQk2M\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/StudentColl.sol\":{\"keccak256\":\"0x1dca957187064c81b7d843df7faf02ea328aadfe825c683a966d802e9f861664\",\"urls\":[\"bzz-raw://51a0cf3ba9b6bcf46a0d0c1a04606cc33f4e9f0b8ca84b92ac34d0ced5fc5bd9\",\"dweb:/ipfs/QmdC6NfnrvBpppLAopWs5DMd5mLfBWdbTFsXSNX7G9Vsit\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/utils/RArrAddress.sol\":{\"keccak256\":\"0xab8ead0659217e4c2e2a9dd137d65ddcb2e2df43203bdce6969581a57bfa8675\",\"urls\":[\"bzz-raw://eb4ce519533727a1a30a5cca88596698c7cbf868d14594b241d21d1004fadc3e\",\"dweb:/ipfs/QmUMVBc16RMBpgp6YaLrzT4PrXAy4aC6iFDY6mNSX9PCD9\"]},\"/home/lev/code/blockchain/eth/evie-timer/contracts/utils/RArrUint256.sol\":{\"keccak256\":\"0xe58ffc01d3e8c4710a294b48ea83b4b08ffe75cf052f54a0e7cc5bcee09e9bae\",\"urls\":[\"bzz-raw://d06d4a7168197874de2a738647beb13d295b881d4d16a543481f01b9636b4270\",\"dweb:/ipfs/QmZenMeVTMX9Fz2GHQBGB91xRFjmwCYeuR4PhKktDGTfqT\"]},\"@openzeppelin/contracts/GSN/Context.sol\":{\"keccak256\":\"0x8d3cb350f04ff49cfb10aef08d87f19dcbaecc8027b0bed12f3275cd12f38cf0\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://ded47ec7c96750f9bd04bbbc84f659992d4ba901cb7b532a52cd468272cf378f\",\"dweb:/ipfs/QmfBrGtQP7rZEqEg6Wz6jh2N2Kukpj1z5v3CGWmAqrzm96\"]},\"@openzeppelin/contracts/access/Ownable.sol\":{\"keccak256\":\"0xf7c39c7e6d06ed3bda90cfefbcbf2ddc32c599c3d6721746546ad64946efccaa\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://cb57a28e189cd8b05748db44bdd51d608e6f1364dd1b35ad921e1bc82c10631e\",\"dweb:/ipfs/QmaWWTBbVu2pRR9XUbE4iC159NoP59cRF9ZJwhf4ghFN9i\"]},\"@openzeppelin/contracts/introspection/ERC165.sol\":{\"keccak256\":\"0xd6b90e604fb2eb2d641c7110c72440bf2dc999ec6ab8ff60f200e71ca75d1d90\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7b92d8ab83b21ff984b1f0d6d66897d5afb1f2052004cbcb133cea023e0ae468\",\"dweb:/ipfs/QmTarypkQrFp4UMjTh7Zzhz2nZLz5uPS4nJQtHDEuwBVe6\"]},\"@openzeppelin/contracts/introspection/IERC165.sol\":{\"keccak256\":\"0xf70bc25d981e4ec9673a995ad2995d5d493ea188d3d8f388bba9c227ce09fb82\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://bd970f51e3a77790c2f02b5b1759827c3b897c3d98c407b3631e8af32e3dc93c\",\"dweb:/ipfs/QmPF85Amgbqjk3SNZKsPCsqCw8JfwYEPMnnhvMJUyX58je\"]},\"@openzeppelin/contracts/math/SafeMath.sol\":{\"keccak256\":\"0x3b21f2c8d626de3b9925ae33e972d8bf5c8b1bffb3f4ee94daeed7d0679036e6\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7f8d45329fecbf0836ad7543330c3ecd0f8d0ffa42d4016278c3eb2215fdcdfe\",\"dweb:/ipfs/QmXWLT7GcnHtA5NiD6MFi2CV3EWJY4wv5mLNnypqYDrxL3\"]},\"@openzeppelin/contracts/token/ERC20/ERC20.sol\":{\"keccak256\":\"0xcbd85c86627a47fd939f1f4ee3ba626575ff2a182e1804b29f5136394449b538\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://53c6a80c519bb9356aad28efa9a1ec31603860eb759d2dc57f545fcae1dd1aca\",\"dweb:/ipfs/QmfRS6TtMNUHhvgLHXK21qKNnpn2S7g2Yd1fKaHKyFiJsR\"]},\"@openzeppelin/contracts/token/ERC20/IERC20.sol\":{\"keccak256\":\"0x5f02220344881ce43204ae4a6281145a67bc52c2bb1290a791857df3d19d78f5\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://24427744bd3e6cb73c17010119af12a318289c0253a4d9acb8576c9fb3797b08\",\"dweb:/ipfs/QmTLDqpKRBuxGxRAmjgXt9AkXyACW3MtKzi7PYjm5iMfGC\"]},\"@openzeppelin/contracts/token/ERC721/ERC721.sol\":{\"keccak256\":\"0x5a3de7f7f76e47a071195cf42e2a702265694a6b32037de709463bd8ad784fb5\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://678cbad1f972a4d8c9d47bc39fa6d39560b4fc143c8d9c812a63fe99bb13062e\",\"dweb:/ipfs/QmUhLDvUndcbQLakDNg9G4UXz8UPzRqC6S3rWGKupB6DYs\"]},\"@openzeppelin/contracts/token/ERC721/IERC721.sol\":{\"keccak256\":\"0x5a9f5c29bd7cf0b345e14d97d5f685f68c07e1e5bfdd47e5bcec045e81b0b6ac\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://321cbaa1412fc8d013d8ad3fb5f98c0db7401ddacfb09b70828ea2cebe37397e\",\"dweb:/ipfs/Qmd3Hoc71w6rmxAR6A5VKW9at677VP1L5KDcJnyvu4ksu3\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol\":{\"keccak256\":\"0xe6bd1b1218338b6f9fe17776f48623b4ac3d8a40405f74a44bc23c00abe2ca13\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://0c354c3f6e9c487759aa7869be4fba68e0b2efc777b514d289c4cbd3ff8f7e1a\",\"dweb:/ipfs/QmdF9LcSYVmiUCL7JxLEYmSLrjga6zJsujfi6sgEJD4M1z\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol\":{\"keccak256\":\"0xccb917776f826ac6b68bd5a15a5f711e3967848a52ba11e6104d9a4f593314a7\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://430255ad2229ced6d880e61a67bdc6e48dbbaed8354a7c1fe918cd8b8714a886\",\"dweb:/ipfs/QmTHY56odzqEpEC6v6tafaWMYY7vmULw25q5XHJLCCAeox\"]},\"@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol\":{\"keccak256\":\"0x52146049d6709c870e8ddcd988b5155cb6c5d640cfcd8978aee52bc1ba2ec4eb\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://ada84513617b7c1b2f890b44503735abaec73a1acd030112a17aac7e6c66a4a1\",\"dweb:/ipfs/QmaiFwdio67iJrfjAdkMac24eJ5sS1qD7CZW6PhUU6KjiK\"]},\"@openzeppelin/contracts/utils/Address.sol\":{\"keccak256\":\"0xa6a15ddddcbf29d2922a1e0d4151b5d2d33da24b93cc9ebc12390e0d855532f8\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7c119bcaecfa853d564ac88d312777f75fa1126a3bca88a3371adb0ad9f35cb0\",\"dweb:/ipfs/QmY9UPuXeSKq86Zh38fE43VGQPhKMN34mkuFSFqPcr6nvZ\"]},\"@openzeppelin/contracts/utils/Counters.sol\":{\"keccak256\":\"0x21662e4254ce4ac8570b30cc7ab31435966b3cb778a56ba4d09276881cfb2437\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://acce8fe6adc670f9987a8b6aedc4cc0abcd0dcd2e152d649a12099d735bd7bad\",\"dweb:/ipfs/QmXAk17oK3daBmA8CGyVcU56L496jW3U6Ef1WkfHyB1JAV\"]},\"@openzeppelin/contracts/utils/EnumerableMap.sol\":{\"keccak256\":\"0xf6bdf22fe038e5310b6f0372ecd01f221e2c0b248b45efc404542d94fcac9133\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://6e798f3492180627d6616fa94925b61a9f105347eed9e895f3e18a0eb3dfcd3d\",\"dweb:/ipfs/QmQcTro5nv3Lopf4c4rEe1BuykCfPsjRsJmysdNXtHNUdt\"]},\"@openzeppelin/contracts/utils/EnumerableSet.sol\":{\"keccak256\":\"0xae0992eb1ec30fd1ecdf2e04a6036decfc9797bf11dc1ec84b546b74318d5ec2\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://3b61f99a64e999682ad7bfbb3a1c762a20a0a5b30f9f2011693fa857969af61f\",\"dweb:/ipfs/QmZystFY76wkWCf7V3yKh3buZuKVKbswiE7y6yU62kk3zi\"]},\"@openzeppelin/contracts/utils/Strings.sol\":{\"keccak256\":\"0x16b5422892fbdd9648f12e59de85b42efd57d76b6d6b2358cb46e0f6d4a71aaf\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://4ef38821a4ee756757dc1ce9074ef6096d1b5c760627e92c0852d788dc636ea7\",\"dweb:/ipfs/QmdGwP6BtRMcp4VVJUWwTmXEjYmL52A8WZpBdFJYmzc9pJ\"]}},\"version\":1}";
    var bytecode = "0x60806040523480156200001157600080fd5b506040518060400160405280600b81526020017f53747564656e74436f6c6c0000000000000000000000000000000000000000008152506040518060400160405280600381526020017f5354550000000000000000000000000000000000000000000000000000000000815250620000966301ffc9a760e01b620001da60201b60201c565b8160069080519060200190620000ae92919062000506565b508060079080519060200190620000c792919062000506565b50620000e06380ac58cd60e01b620001da60201b60201c565b620000f8635b5e139f60e01b620001da60201b60201c565b6200011063780e9d6360e01b620001da60201b60201c565b5050600062000124620002e360201b60201c565b905080600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350620001d433620002eb60201b60201c565b620005ac565b63ffffffff60e01b817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916141562000277576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433136353a20696e76616c696420696e746572666163652069640000000081525060200191505060405180910390fd5b6001600080837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060006101000a81548160ff02191690831515021790555050565b600033905090565b620002fb620002e360201b60201c565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614620003be576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141562000446576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180620051476026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106200054957805160ff19168380011785556200057a565b828001600101855582156200057a579182015b82811115620005795782518255916020019190600101906200055c565b5b5090506200058991906200058d565b5090565b5b80821115620005a85760008160009055506001016200058e565b5090565b614b8b80620005bc6000396000f3fe608060405234801561001057600080fd5b50600436106101e55760003560e01c806370a082311161010f578063b939df59116100a2578063e985e9c511610071578063e985e9c514610bc2578063f2fde38b14610c3c578063f86b010d14610c80578063fa06524b14610d19576101e5565b8063b939df5914610a75578063c87b56dd14610a7f578063d25eab2d14610b26578063db68f61214610b6a576101e5565b806395d89b41116100de57806395d89b4114610893578063a22cb46514610916578063a481aada14610966578063b88d4fde14610970576101e5565b806370a08231146107af578063715018a6146108075780637aa0c589146108115780638da5cb5b1461085f576101e5565b806323b872dd116101875780634f6ccce7116101565780634f6ccce7146105eb5780636352211e1461062d57806367712570146106855780636c0360eb1461072c576101e5565b806323b872dd146104065780632ce0ece6146104745780632f745c591461051b57806342842e0e1461057d576101e5565b8063095ea7b3116101c3578063095ea7b31461032857806318160ddd146103765780631e5792a0146103945780631e99dd47146103d8576101e5565b806301ffc9a7146101ea57806306fdde031461024d578063081812fc146102d0575b600080fd5b6102356004803603602081101561020057600080fd5b8101908080357bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19169060200190929190505050610d42565b60405180821515815260200191505060405180910390f35b610255610da9565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561029557808201518184015260208101905061027a565b50505050905090810190601f1680156102c25780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102fc600480360360208110156102e657600080fd5b8101908080359060200190929190505050610e4b565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103746004803603604081101561033e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ee6565b005b61037e61102a565b6040518082815260200191505060405180910390f35b6103d6600480360360208110156103aa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061103b565b005b610404600480360360208110156103ee57600080fd5b81019080803590602001909291905050506112e4565b005b6104726004803603606081101561041c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506112f0565b005b61047c611366565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156104c35780820151818401526020810190506104a8565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156105055780820151818401526020810190506104ea565b5050505090500194505050505060405180910390f35b6105676004803603604081101561053157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061137e565b6040518082815260200191505060405180910390f35b6105e96004803603606081101561059357600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506113d9565b005b6106176004803603602081101561060157600080fd5b81019080803590602001909291905050506113f9565b6040518082815260200191505060405180910390f35b6106596004803603602081101561064357600080fd5b810190808035906020019092919050505061141c565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61068d611453565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156106d45780820151818401526020810190506106b9565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156107165780820151818401526020810190506106fb565b5050505090500194505050505060405180910390f35b61073461146b565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610774578082015181840152602081019050610759565b50505050905090810190601f1680156107a15780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6107f1600480360360208110156107c557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061150d565b6040518082815260200191505060405180910390f35b61080f6115e2565b005b61085d6004803603604081101561082757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061176d565b005b6108676117df565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61089b611809565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156108db5780820151818401526020810190506108c0565b50505050905090810190601f1680156109085780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6109646004803603604081101561092c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035151590602001909291905050506118ab565b005b61096e611a61565b005b610a736004803603608081101561098657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190803590602001906401000000008111156109ed57600080fd5b8201836020820111156109ff57600080fd5b80359060200191846001830284011164010000000083111715610a2157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050611c73565b005b610a7d611ceb565b005b610aab60048036036020811015610a9557600080fd5b8101908080359060200190929190505050611e8a565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610aeb578082015181840152602081019050610ad0565b50505050905090810190601f168015610b185780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610b6860048036036020811015610b3c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612173565b005b610bac60048036036020811015610b8057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612280565b6040518082815260200191505060405180910390f35b610c2460048036036040811015610bd857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612298565b60405180821515815260200191505060405180910390f35b610c7e60048036036020811015610c5257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061232c565b005b610cc260048036036020811015610c9657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061253c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b83811015610d05578082015181840152602081019050610cea565b505050509050019250505060405180910390f35b610d216125d3565b60405180826002811115610d3157fe5b815260200191505060405180910390f35b6000806000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff169050919050565b606060068054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610e415780601f10610e1657610100808354040283529160200191610e41565b820191906000526020600020905b815481529060010190602001808311610e2457829003601f168201915b5050505050905090565b6000610e5682612714565b610eab576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614a56602c913960400191505060405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b6000610ef18261141c565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610f78576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180614b046021913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610f97612731565b73ffffffffffffffffffffffffffffffffffffffff161480610fc65750610fc581610fc0612731565b612298565b5b61101b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260388152602001806149816038913960400191505060405180910390fd5b6110258383612739565b505050565b600061103660026127f2565b905090565b60005b600c8054905081101561111b573373ffffffffffffffffffffffffffffffffffffffff16600c828154811061106f57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561110e57600061110d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260258152602001806148226025913960400191505060405180910390fd5b5b808060010191505061103e565b50600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614611200576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614a2e6028913960400191505060405180910390fd5b80600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600c339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6112ed81612807565b50565b6113016112fb612731565b82612b65565b611356576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614b256031913960400191505060405180910390fd5b611361838383612c59565b505050565b606080611376600b600e33612e9c565b915091509091565b60006113d182600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206131e290919063ffffffff16565b905092915050565b6113f483838360405180602001604052806000815250611c73565b505050565b6000806114108360026131fc90919063ffffffff16565b50905080915050919050565b600061144c826040518060600160405280602981526020016149e36029913960026132289092919063ffffffff16565b9050919050565b606080611463600c600d33612e9c565b915091509091565b606060098054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156115035780601f106114d857610100808354040283529160200191611503565b820191906000526020600020905b8154815290600101906020018083116114e657829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611594576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a8152602001806149b9602a913960400191505060405180910390fd5b6115db600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613247565b9050919050565b6115ea612731565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146116ac576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b6000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002082815481106117b957fe5b906000526020600020015490506117d0838361325c565b6117da8382613358565b505050565b6000600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060078054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156118a15780601f10611876576101008083540402835291602001916118a1565b820191906000526020600020905b81548152906001019060200180831161188457829003601f168201915b5050505050905090565b6118b3612731565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611954576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f4552433732313a20617070726f766520746f2063616c6c65720000000000000081525060200191505060405180910390fd5b8060056000611961612731565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff16611a0e612731565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16611ac9620151804261337690919063ffffffff16565b61ffff1611611ad757600080fd5b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611b7057600080fd5b42601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611bca620151804261337690919063ffffffff16565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b611c84611c7e612731565b83612b65565b611cd9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614b256031913960400191505060405180910390fd5b611ce5848484846133c0565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611d8457600080fd5b6000429050601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054811015611dd557600080fd5b610e10611e2a601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548361343290919063ffffffff16565b11611e3957611e383361347c565b5b3373ffffffffffffffffffffffffffffffffffffffff167fd6d4a83c50f8452f78f64b946692a111c56aa380e4e5f2a42deff2e69a03ba9a426040518082815260200191505060405180910390a250565b6060611e9582612714565b611eea576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602f815260200180614aab602f913960400191505060405180910390fd5b6060600860008481526020019081526020016000208054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015611f935780601f10611f6857610100808354040283529160200191611f93565b820191906000526020600020905b815481529060010190602001808311611f7657829003601f168201915b50505050509050600060098054600181600116156101000203166002900490501415611fc2578091505061216e565b60008151111561209b57600981604051602001808380546001816001161561010002031660029004801561202d5780601f1061200b57610100808354040283529182019161202d565b820191906000526020600020905b815481529060010190602001808311612019575b505082805190602001908083835b6020831061205e578051825260208201915060208101905060208303925061203b565b6001836020036101000a0380198251168184511680821785525050505050509050019250505060405160208183030381529060405291505061216e565b60096120a6846135e5565b60405160200180838054600181600116156101000203166002900480156121045780601f106120e2576101008083540402835291820191612104565b820191906000526020600020905b8154815290600101906020018083116120f0575b505082805190602001908083835b602083106121355780518252602082019150602081019050602083039250612112565b6001836020036101000a038019825116818451168082178552505050505050905001925050506040516020818303038152906040529150505b919050565b60005b601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002080549050811015612231576000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020828154811061220c57fe5b906000526020600020015490506122238382613358565b508080600101915050612176565b50601060008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600061227d91906147c1565b50565b60116020528060005260406000206000915090505481565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b612334612731565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146123f6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561247c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806148c06026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054806020026020016040519081016040528092919081815260200182805480156125c757602002820191906000526020600020905b8154815260200190600101908083116125b3575b50505050509050919050565b60008073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146126705760009050612711565b600073ffffffffffffffffffffffffffffffffffffffff16600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461270c5760019050612711565b600290505b90565b600061272a82600261372c90919063ffffffff16565b9050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff166127ac8361141c565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b600061280082600001613746565b9050919050565b6000600c828154811061281657fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff16600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612927576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614a2e6028913960400191505060405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16600d60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612a0a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602581526020018061490a6025913960400191505060405180910390fd5b33600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600b819080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550612aff82600c61375790919063ffffffff16565b600d60008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555050565b6000612b7082612714565b612bc5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614955602c913960400191505060405180910390fd5b6000612bd08361141c565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480612c3f57508373ffffffffffffffffffffffffffffffffffffffff16612c2784610e4b565b73ffffffffffffffffffffffffffffffffffffffff16145b80612c505750612c4f8185612298565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16612c798261141c565b73ffffffffffffffffffffffffffffffffffffffff1614612ce5576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526029815260200180614a826029913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612d6b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260248152602001806148e66024913960400191505060405180910390fd5b612d7683838361389b565b612d81600082612739565b612dd281600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138a090919063ffffffff16565b50612e2481600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138ba90919063ffffffff16565b50612e3b818360026138d49092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b6060806000805b8680549050811015612faf576000878281548110612ebd57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508573ffffffffffffffffffffffffffffffffffffffff168760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415612f9357612f9060018461390990919063ffffffff16565b92505b50612fa860018261390990919063ffffffff16565b9050612ea3565b5060608167ffffffffffffffff81118015612fc957600080fd5b50604051908082528060200260200182016040528015612ff85781602001602082028036833780820191505090505b50905060608267ffffffffffffffff8111801561301457600080fd5b506040519080825280602002602001820160405280156130435781602001602082028036833780820191505090505b5090506000805b89805490508110156131ce5760008a828154811061306457fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508873ffffffffffffffffffffffffffffffffffffffff168a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156131b2578085848151811061313057fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508184848151811061317757fe5b60200260200101818152505061319760018461390990919063ffffffff16565b92508286116131b1578484975097505050505050506131da565b5b506131c760018261390990919063ffffffff16565b905061304a565b50828295509550505050505b935093915050565b60006131f18360000183613991565b60001c905092915050565b60008060008061320f8660000186613a14565b915091508160001c8160001c9350935050509250929050565b600061323b846000018460001b84613aad565b60001c90509392505050565b600061325582600001613ba3565b9050919050565b806000111580156132ae5750601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054905081105b613303576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260478152602001806148476047913960600191505060405180910390fd5b61335481601060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613bb490919063ffffffff16565b5050565b613372828260405180602001604052806000815250613c7f565b5050565b60006133b883836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250613cf0565b905092915050565b6133cb848484612c59565b6133d784848484613db6565b61342c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603281526020018061488e6032913960400191505060405180910390fd5b50505050565b600061347483836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250613fcf565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561351557600080fd5b61351f600f61408f565b600061352b600f6140a5565b9050601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190806001815401808255809150506001900390600052602060002001600090919091909150558173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b6060600082141561362d576040518060400160405280600181526020017f30000000000000000000000000000000000000000000000000000000000000008152509050613727565b600082905060005b60008214613657578080600101915050600a828161364f57fe5b049150613635565b60608167ffffffffffffffff8111801561367057600080fd5b506040519080825280601f01601f1916602001820160405280156136a35781602001600182028036833780820191505090505b50905060006001830390508593505b6000841461371f57600a84816136c457fe5b0660300160f81b828280600190039350815181106136de57fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a848161371757fe5b0493506136b2565b819450505050505b919050565b600061373e836000018360001b6140b3565b905092915050565b600081600001805490509050919050565b8060001115801561376b5750818054905081105b6137c0576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614ada602a913960400191505060405180910390fd5b6000600183805490500390508281815481106137d857fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1683838154811061380f57fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508280548061386157fe5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690559055505050565b505050565b60006138b2836000018360001b6140d6565b905092915050565b60006138cc836000018360001b6141be565b905092915050565b6000613900846000018460001b8473ffffffffffffffffffffffffffffffffffffffff1660001b61422e565b90509392505050565b600080828401905083811015613987576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b6000818360000180549050116139f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806148006022913960400191505060405180910390fd5b826000018281548110613a0157fe5b9060005260206000200154905092915050565b60008082846000018054905011613a76576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614a0c6022913960400191505060405180910390fd5b6000846000018481548110613a8757fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b60008084600101600085815260200190815260200160002054905060008114158390613b74576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613b39578082015181840152602081019050613b1e565b50505050905090810190601f168015613b665780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50846000016001820381548110613b8757fe5b9060005260206000209060020201600101549150509392505050565b600081600001805490509050919050565b80600011158015613bc85750818054905081105b613c1d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614ada602a913960400191505060405180910390fd5b600060018380549050039050828181548110613c3557fe5b9060005260206000200154838381548110613c4c57fe5b906000526020600020018190555082805480613c6457fe5b60019003818190600052602060002001600090559055505050565b613c89838361430a565b613c966000848484613db6565b613ceb576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603281526020018061488e6032913960400191505060405180910390fd5b505050565b60008083118290613d9c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613d61578082015181840152602081019050613d46565b50505050905090810190601f168015613d8e5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581613da857fe5b049050809150509392505050565b6000613dd78473ffffffffffffffffffffffffffffffffffffffff166144fe565b613de45760019050613fc7565b6060613f4e63150b7a0260e01b613df9612731565b888787604051602401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff16815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015613e7d578082015181840152602081019050613e62565b50505050905090810190601f168015613eaa5780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405180606001604052806032815260200161488e603291398773ffffffffffffffffffffffffffffffffffffffff166145119092919063ffffffff16565b90506000818060200190516020811015613f6757600080fd5b8101908080519060200190929190505050905063150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614925050505b949350505050565b600083831115829061407c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015614041578082015181840152602081019050614026565b50505050905090810190601f16801561406e5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b6001816000016000828254019250508190555050565b600081600001549050919050565b600080836001016000848152602001908152602001600020541415905092915050565b600080836001016000848152602001908152602001600020549050600081146141b2576000600182039050600060018660000180549050039050600086600001828154811061412157fe5b906000526020600020015490508087600001848154811061413e57fe5b906000526020600020018190555060018301876001016000838152602001908152602001600020819055508660000180548061417657fe5b600190038181906000526020600020016000905590558660010160008781526020019081526020016000206000905560019450505050506141b8565b60009150505b92915050565b60006141ca8383614529565b614223578260000182908060018154018082558091505060019003906000526020600020016000909190919091505582600001805490508360010160008481526020019081526020016000208190555060019050614228565b600090505b92915050565b60008084600101600085815260200190815260200160002054905060008114156142d557846000016040518060400160405280868152602001858152509080600181540180825580915050600190039060005260206000209060020201600090919091909150600082015181600001556020820151816001015550508460000180549050856001016000868152602001908152602001600020819055506001915050614303565b828560000160018303815481106142e857fe5b90600052602060002090600202016001018190555060009150505b9392505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156143ad576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4552433732313a206d696e7420746f20746865207a65726f206164647265737381525060200191505060405180910390fd5b6143b681612714565b15614429576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433732313a20746f6b656e20616c7265616479206d696e7465640000000081525060200191505060405180910390fd5b6144356000838361389b565b61448681600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138ba90919063ffffffff16565b5061449d818360026138d49092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b600080823b905060008111915050919050565b6060614520848460008561454c565b90509392505050565b600080836001016000848152602001908152602001600020541415905092915050565b6060824710156145a7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602681526020018061492f6026913960400191505060405180910390fd5b6145b0856144fe565b614622576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000081525060200191505060405180910390fd5b600060608673ffffffffffffffffffffffffffffffffffffffff1685876040518082805190602001908083835b60208310614672578051825260208201915060208101905060208303925061464f565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d80600081146146d4576040519150601f19603f3d011682016040523d82523d6000602084013e6146d9565b606091505b50915091506146e98282866146f5565b92505050949350505050565b60608315614705578290506147ba565b6000835111156147185782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561477f578082015181840152602081019050614764565b50505050905090810190601f1680156147ac5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b9392505050565b50805460008255906000526020600020908101906147df91906147e2565b50565b5b808211156147fb5760008160009055506001016147e3565b509056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e647353747564656e74206d757374206e6f7420626520612070656e64696e672073747564656e7454686520746f6b656e20696e646578206d7573742062652077697468696e2072616e6765206f66207468652073747564656e7427732070656e64696e67206964732061727261794552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734552433732313a207472616e7366657220746f20746865207a65726f206164647265737353747564656e74206d75737420686176652073657420746869732073757065727669736f72416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c4552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e647353747564656e742063616e6e6f7420616c7265616479206861766520612073757065727669736f724552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e54686520696e646578206d7573742062652077697468696e2072616e6765206f6620746865206c6973744552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a26469706673582212200e553b381f2c865b458b9a3a9a019a7ec716011e221bd59b50a8eba1c938066c64736f6c634300070000334f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373";
    var deployedBytecode = "0x608060405234801561001057600080fd5b50600436106101e55760003560e01c806370a082311161010f578063b939df59116100a2578063e985e9c511610071578063e985e9c514610bc2578063f2fde38b14610c3c578063f86b010d14610c80578063fa06524b14610d19576101e5565b8063b939df5914610a75578063c87b56dd14610a7f578063d25eab2d14610b26578063db68f61214610b6a576101e5565b806395d89b41116100de57806395d89b4114610893578063a22cb46514610916578063a481aada14610966578063b88d4fde14610970576101e5565b806370a08231146107af578063715018a6146108075780637aa0c589146108115780638da5cb5b1461085f576101e5565b806323b872dd116101875780634f6ccce7116101565780634f6ccce7146105eb5780636352211e1461062d57806367712570146106855780636c0360eb1461072c576101e5565b806323b872dd146104065780632ce0ece6146104745780632f745c591461051b57806342842e0e1461057d576101e5565b8063095ea7b3116101c3578063095ea7b31461032857806318160ddd146103765780631e5792a0146103945780631e99dd47146103d8576101e5565b806301ffc9a7146101ea57806306fdde031461024d578063081812fc146102d0575b600080fd5b6102356004803603602081101561020057600080fd5b8101908080357bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19169060200190929190505050610d42565b60405180821515815260200191505060405180910390f35b610255610da9565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561029557808201518184015260208101905061027a565b50505050905090810190601f1680156102c25780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6102fc600480360360208110156102e657600080fd5b8101908080359060200190929190505050610e4b565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103746004803603604081101561033e57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610ee6565b005b61037e61102a565b6040518082815260200191505060405180910390f35b6103d6600480360360208110156103aa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061103b565b005b610404600480360360208110156103ee57600080fd5b81019080803590602001909291905050506112e4565b005b6104726004803603606081101561041c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506112f0565b005b61047c611366565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156104c35780820151818401526020810190506104a8565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156105055780820151818401526020810190506104ea565b5050505090500194505050505060405180910390f35b6105676004803603604081101561053157600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061137e565b6040518082815260200191505060405180910390f35b6105e96004803603606081101561059357600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001909291905050506113d9565b005b6106176004803603602081101561060157600080fd5b81019080803590602001909291905050506113f9565b6040518082815260200191505060405180910390f35b6106596004803603602081101561064357600080fd5b810190808035906020019092919050505061141c565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61068d611453565b604051808060200180602001838103835285818151815260200191508051906020019060200280838360005b838110156106d45780820151818401526020810190506106b9565b50505050905001838103825284818151815260200191508051906020019060200280838360005b838110156107165780820151818401526020810190506106fb565b5050505090500194505050505060405180910390f35b61073461146b565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610774578082015181840152602081019050610759565b50505050905090810190601f1680156107a15780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6107f1600480360360208110156107c557600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061150d565b6040518082815260200191505060405180910390f35b61080f6115e2565b005b61085d6004803603604081101561082757600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061176d565b005b6108676117df565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b61089b611809565b6040518080602001828103825283818151815260200191508051906020019080838360005b838110156108db5780820151818401526020810190506108c0565b50505050905090810190601f1680156109085780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6109646004803603604081101561092c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035151590602001909291905050506118ab565b005b61096e611a61565b005b610a736004803603608081101561098657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190803590602001906401000000008111156109ed57600080fd5b8201836020820111156109ff57600080fd5b80359060200191846001830284011164010000000083111715610a2157600080fd5b91908080601f016020809104026020016040519081016040528093929190818152602001838380828437600081840152601f19601f820116905080830192505050505050509192919290505050611c73565b005b610a7d611ceb565b005b610aab60048036036020811015610a9557600080fd5b8101908080359060200190929190505050611e8a565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610aeb578082015181840152602081019050610ad0565b50505050905090810190601f168015610b185780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b610b6860048036036020811015610b3c57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612173565b005b610bac60048036036020811015610b8057600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612280565b6040518082815260200191505060405180910390f35b610c2460048036036040811015610bd857600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050612298565b60405180821515815260200191505060405180910390f35b610c7e60048036036020811015610c5257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061232c565b005b610cc260048036036020811015610c9657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061253c565b6040518080602001828103825283818151815260200191508051906020019060200280838360005b83811015610d05578082015181840152602081019050610cea565b505050509050019250505060405180910390f35b610d216125d3565b60405180826002811115610d3157fe5b815260200191505060405180910390f35b6000806000837bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19167bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916815260200190815260200160002060009054906101000a900460ff169050919050565b606060068054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610e415780601f10610e1657610100808354040283529160200191610e41565b820191906000526020600020905b815481529060010190602001808311610e2457829003601f168201915b5050505050905090565b6000610e5682612714565b610eab576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614a56602c913960400191505060405180910390fd5b6004600083815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050919050565b6000610ef18261141c565b90508073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610f78576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526021815260200180614b046021913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16610f97612731565b73ffffffffffffffffffffffffffffffffffffffff161480610fc65750610fc581610fc0612731565b612298565b5b61101b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260388152602001806149816038913960400191505060405180910390fd5b6110258383612739565b505050565b600061103660026127f2565b905090565b60005b600c8054905081101561111b573373ffffffffffffffffffffffffffffffffffffffff16600c828154811061106f57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561110e57600061110d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260258152602001806148226025913960400191505060405180910390fd5b5b808060010191505061103e565b50600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614611200576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614a2e6028913960400191505060405180910390fd5b80600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600c339080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6112ed81612807565b50565b6113016112fb612731565b82612b65565b611356576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614b256031913960400191505060405180910390fd5b611361838383612c59565b505050565b606080611376600b600e33612e9c565b915091509091565b60006113d182600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206131e290919063ffffffff16565b905092915050565b6113f483838360405180602001604052806000815250611c73565b505050565b6000806114108360026131fc90919063ffffffff16565b50905080915050919050565b600061144c826040518060600160405280602981526020016149e36029913960026132289092919063ffffffff16565b9050919050565b606080611463600c600d33612e9c565b915091509091565b606060098054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156115035780601f106114d857610100808354040283529160200191611503565b820191906000526020600020905b8154815290600101906020018083116114e657829003601f168201915b5050505050905090565b60008073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611594576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a8152602001806149b9602a913960400191505060405180910390fd5b6115db600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613247565b9050919050565b6115ea612731565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146116ac576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b6000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002082815481106117b957fe5b906000526020600020015490506117d0838361325c565b6117da8382613358565b505050565b6000600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060078054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156118a15780601f10611876576101008083540402835291602001916118a1565b820191906000526020600020905b81548152906001019060200180831161188457829003601f168201915b5050505050905090565b6118b3612731565b73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611954576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260198152602001807f4552433732313a20617070726f766520746f2063616c6c65720000000000000081525060200191505060405180910390fd5b8060056000611961612731565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff16611a0e612731565b73ffffffffffffffffffffffffffffffffffffffff167f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c318360405180821515815260200191505060405180910390a35050565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16611ac9620151804261337690919063ffffffff16565b61ffff1611611ad757600080fd5b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611b7057600080fd5b42601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611bca620151804261337690919063ffffffff16565b601260003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b611c84611c7e612731565b83612b65565b611cd9576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526031815260200180614b256031913960400191505060405180910390fd5b611ce5848484846133c0565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415611d8457600080fd5b6000429050601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054811015611dd557600080fd5b610e10611e2a601160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020548361343290919063ffffffff16565b11611e3957611e383361347c565b5b3373ffffffffffffffffffffffffffffffffffffffff167fd6d4a83c50f8452f78f64b946692a111c56aa380e4e5f2a42deff2e69a03ba9a426040518082815260200191505060405180910390a250565b6060611e9582612714565b611eea576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602f815260200180614aab602f913960400191505060405180910390fd5b6060600860008481526020019081526020016000208054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015611f935780601f10611f6857610100808354040283529160200191611f93565b820191906000526020600020905b815481529060010190602001808311611f7657829003601f168201915b50505050509050600060098054600181600116156101000203166002900490501415611fc2578091505061216e565b60008151111561209b57600981604051602001808380546001816001161561010002031660029004801561202d5780601f1061200b57610100808354040283529182019161202d565b820191906000526020600020905b815481529060010190602001808311612019575b505082805190602001908083835b6020831061205e578051825260208201915060208101905060208303925061203b565b6001836020036101000a0380198251168184511680821785525050505050509050019250505060405160208183030381529060405291505061216e565b60096120a6846135e5565b60405160200180838054600181600116156101000203166002900480156121045780601f106120e2576101008083540402835291820191612104565b820191906000526020600020905b8154815290600101906020018083116120f0575b505082805190602001908083835b602083106121355780518252602082019150602081019050602083039250612112565b6001836020036101000a038019825116818451168082178552505050505050905001925050506040516020818303038152906040529150505b919050565b60005b601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002080549050811015612231576000601060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020828154811061220c57fe5b906000526020600020015490506122238382613358565b508080600101915050612176565b50601060008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600061227d91906147c1565b50565b60116020528060005260406000206000915090505481565b6000600560008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900460ff16905092915050565b612334612731565b73ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146123f6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141561247c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806148c06026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600a60009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600a60006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6060601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054806020026020016040519081016040528092919081815260200182805480156125c757602002820191906000526020600020905b8154815260200190600101908083116125b3575b50505050509050919050565b60008073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16146126705760009050612711565b600073ffffffffffffffffffffffffffffffffffffffff16600d60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461270c5760019050612711565b600290505b90565b600061272a82600261372c90919063ffffffff16565b9050919050565b600033905090565b816004600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550808273ffffffffffffffffffffffffffffffffffffffff166127ac8361141c565b73ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b600061280082600001613746565b9050919050565b6000600c828154811061281657fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050600073ffffffffffffffffffffffffffffffffffffffff16600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612927576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526028815260200180614a2e6028913960400191505060405180910390fd5b3373ffffffffffffffffffffffffffffffffffffffff16600d60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614612a0a576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602581526020018061490a6025913960400191505060405180910390fd5b33600e60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550600b819080600181540180825580915050600190039060005260206000200160009091909190916101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550612aff82600c61375790919063ffffffff16565b600d60008273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690555050565b6000612b7082612714565b612bc5576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602c815260200180614955602c913960400191505060405180910390fd5b6000612bd08361141c565b90508073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161480612c3f57508373ffffffffffffffffffffffffffffffffffffffff16612c2784610e4b565b73ffffffffffffffffffffffffffffffffffffffff16145b80612c505750612c4f8185612298565b5b91505092915050565b8273ffffffffffffffffffffffffffffffffffffffff16612c798261141c565b73ffffffffffffffffffffffffffffffffffffffff1614612ce5576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526029815260200180614a826029913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415612d6b576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260248152602001806148e66024913960400191505060405180910390fd5b612d7683838361389b565b612d81600082612739565b612dd281600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138a090919063ffffffff16565b50612e2481600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138ba90919063ffffffff16565b50612e3b818360026138d49092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a4505050565b6060806000805b8680549050811015612faf576000878281548110612ebd57fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508573ffffffffffffffffffffffffffffffffffffffff168760008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161415612f9357612f9060018461390990919063ffffffff16565b92505b50612fa860018261390990919063ffffffff16565b9050612ea3565b5060608167ffffffffffffffff81118015612fc957600080fd5b50604051908082528060200260200182016040528015612ff85781602001602082028036833780820191505090505b50905060608267ffffffffffffffff8111801561301457600080fd5b506040519080825280602002602001820160405280156130435781602001602082028036833780820191505090505b5090506000805b89805490508110156131ce5760008a828154811061306457fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508873ffffffffffffffffffffffffffffffffffffffff168a60008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614156131b2578085848151811061313057fe5b602002602001019073ffffffffffffffffffffffffffffffffffffffff16908173ffffffffffffffffffffffffffffffffffffffff16815250508184848151811061317757fe5b60200260200101818152505061319760018461390990919063ffffffff16565b92508286116131b1578484975097505050505050506131da565b5b506131c760018261390990919063ffffffff16565b905061304a565b50828295509550505050505b935093915050565b60006131f18360000183613991565b60001c905092915050565b60008060008061320f8660000186613a14565b915091508160001c8160001c9350935050509250929050565b600061323b846000018460001b84613aad565b60001c90509392505050565b600061325582600001613ba3565b9050919050565b806000111580156132ae5750601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208054905081105b613303576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260478152602001806148476047913960600191505060405180910390fd5b61335481601060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020613bb490919063ffffffff16565b5050565b613372828260405180602001604052806000815250613c7f565b5050565b60006133b883836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250613cf0565b905092915050565b6133cb848484612c59565b6133d784848484613db6565b61342c576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603281526020018061488e6032913960400191505060405180910390fd5b50505050565b600061347483836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f770000815250613fcf565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff16600e60003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16141561351557600080fd5b61351f600f61408f565b600061352b600f6140a5565b9050601060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000208190806001815401808255809150506001900390600052602060002001600090919091909150558173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b6060600082141561362d576040518060400160405280600181526020017f30000000000000000000000000000000000000000000000000000000000000008152509050613727565b600082905060005b60008214613657578080600101915050600a828161364f57fe5b049150613635565b60608167ffffffffffffffff8111801561367057600080fd5b506040519080825280601f01601f1916602001820160405280156136a35781602001600182028036833780820191505090505b50905060006001830390508593505b6000841461371f57600a84816136c457fe5b0660300160f81b828280600190039350815181106136de57fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a905350600a848161371757fe5b0493506136b2565b819450505050505b919050565b600061373e836000018360001b6140b3565b905092915050565b600081600001805490509050919050565b8060001115801561376b5750818054905081105b6137c0576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614ada602a913960400191505060405180910390fd5b6000600183805490500390508281815481106137d857fe5b9060005260206000200160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1683838154811061380f57fe5b9060005260206000200160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508280548061386157fe5b6001900381819060005260206000200160006101000a81549073ffffffffffffffffffffffffffffffffffffffff02191690559055505050565b505050565b60006138b2836000018360001b6140d6565b905092915050565b60006138cc836000018360001b6141be565b905092915050565b6000613900846000018460001b8473ffffffffffffffffffffffffffffffffffffffff1660001b61422e565b90509392505050565b600080828401905083811015613987576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b6000818360000180549050116139f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806148006022913960400191505060405180910390fd5b826000018281548110613a0157fe5b9060005260206000200154905092915050565b60008082846000018054905011613a76576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180614a0c6022913960400191505060405180910390fd5b6000846000018481548110613a8757fe5b906000526020600020906002020190508060000154816001015492509250509250929050565b60008084600101600085815260200190815260200160002054905060008114158390613b74576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613b39578082015181840152602081019050613b1e565b50505050905090810190601f168015613b665780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50846000016001820381548110613b8757fe5b9060005260206000209060020201600101549150509392505050565b600081600001805490509050919050565b80600011158015613bc85750818054905081105b613c1d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602a815260200180614ada602a913960400191505060405180910390fd5b600060018380549050039050828181548110613c3557fe5b9060005260206000200154838381548110613c4c57fe5b906000526020600020018190555082805480613c6457fe5b60019003818190600052602060002001600090559055505050565b613c89838361430a565b613c966000848484613db6565b613ceb576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603281526020018061488e6032913960400191505060405180910390fd5b505050565b60008083118290613d9c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015613d61578082015181840152602081019050613d46565b50505050905090810190601f168015613d8e5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581613da857fe5b049050809150509392505050565b6000613dd78473ffffffffffffffffffffffffffffffffffffffff166144fe565b613de45760019050613fc7565b6060613f4e63150b7a0260e01b613df9612731565b888787604051602401808573ffffffffffffffffffffffffffffffffffffffff1681526020018473ffffffffffffffffffffffffffffffffffffffff16815260200183815260200180602001828103825283818151815260200191508051906020019080838360005b83811015613e7d578082015181840152602081019050613e62565b50505050905090810190601f168015613eaa5780820380516001836020036101000a031916815260200191505b5095505050505050604051602081830303815290604052907bffffffffffffffffffffffffffffffffffffffffffffffffffffffff19166020820180517bffffffffffffffffffffffffffffffffffffffffffffffffffffffff838183161783525050505060405180606001604052806032815260200161488e603291398773ffffffffffffffffffffffffffffffffffffffff166145119092919063ffffffff16565b90506000818060200190516020811015613f6757600080fd5b8101908080519060200190929190505050905063150b7a0260e01b7bffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916817bffffffffffffffffffffffffffffffffffffffffffffffffffffffff191614925050505b949350505050565b600083831115829061407c576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015614041578082015181840152602081019050614026565b50505050905090810190601f16801561406e5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b6001816000016000828254019250508190555050565b600081600001549050919050565b600080836001016000848152602001908152602001600020541415905092915050565b600080836001016000848152602001908152602001600020549050600081146141b2576000600182039050600060018660000180549050039050600086600001828154811061412157fe5b906000526020600020015490508087600001848154811061413e57fe5b906000526020600020018190555060018301876001016000838152602001908152602001600020819055508660000180548061417657fe5b600190038181906000526020600020016000905590558660010160008781526020019081526020016000206000905560019450505050506141b8565b60009150505b92915050565b60006141ca8383614529565b614223578260000182908060018154018082558091505060019003906000526020600020016000909190919091505582600001805490508360010160008481526020019081526020016000208190555060019050614228565b600090505b92915050565b60008084600101600085815260200190815260200160002054905060008114156142d557846000016040518060400160405280868152602001858152509080600181540180825580915050600190039060005260206000209060020201600090919091909150600082015181600001556020820151816001015550508460000180549050856001016000868152602001908152602001600020819055506001915050614303565b828560000160018303815481106142e857fe5b90600052602060002090600202016001018190555060009150505b9392505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1614156143ad576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4552433732313a206d696e7420746f20746865207a65726f206164647265737381525060200191505060405180910390fd5b6143b681612714565b15614429576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601c8152602001807f4552433732313a20746f6b656e20616c7265616479206d696e7465640000000081525060200191505060405180910390fd5b6144356000838361389b565b61448681600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206138ba90919063ffffffff16565b5061449d818360026138d49092919063ffffffff16565b50808273ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef60405160405180910390a45050565b600080823b905060008111915050919050565b6060614520848460008561454c565b90509392505050565b600080836001016000848152602001908152602001600020541415905092915050565b6060824710156145a7576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602681526020018061492f6026913960400191505060405180910390fd5b6145b0856144fe565b614622576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601d8152602001807f416464726573733a2063616c6c20746f206e6f6e2d636f6e747261637400000081525060200191505060405180910390fd5b600060608673ffffffffffffffffffffffffffffffffffffffff1685876040518082805190602001908083835b60208310614672578051825260208201915060208101905060208303925061464f565b6001836020036101000a03801982511681845116808217855250505050505090500191505060006040518083038185875af1925050503d80600081146146d4576040519150601f19603f3d011682016040523d82523d6000602084013e6146d9565b606091505b50915091506146e98282866146f5565b92505050949350505050565b60608315614705578290506147ba565b6000835111156147185782518084602001fd5b816040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561477f578082015181840152602081019050614764565b50505050905090810190601f1680156147ac5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b9392505050565b50805460008255906000526020600020908101906147df91906147e2565b50565b5b808211156147fb5760008160009055506001016147e3565b509056fe456e756d657261626c655365743a20696e646578206f7574206f6620626f756e647353747564656e74206d757374206e6f7420626520612070656e64696e672073747564656e7454686520746f6b656e20696e646578206d7573742062652077697468696e2072616e6765206f66207468652073747564656e7427732070656e64696e67206964732061727261794552433732313a207472616e7366657220746f206e6f6e20455243373231526563656976657220696d706c656d656e7465724f776e61626c653a206e6577206f776e657220697320746865207a65726f20616464726573734552433732313a207472616e7366657220746f20746865207a65726f206164647265737353747564656e74206d75737420686176652073657420746869732073757065727669736f72416464726573733a20696e73756666696369656e742062616c616e636520666f722063616c6c4552433732313a206f70657261746f7220717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a20617070726f76652063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f76656420666f7220616c6c4552433732313a2062616c616e636520717565727920666f7220746865207a65726f20616464726573734552433732313a206f776e657220717565727920666f72206e6f6e6578697374656e7420746f6b656e456e756d657261626c654d61703a20696e646578206f7574206f6620626f756e647353747564656e742063616e6e6f7420616c7265616479206861766520612073757065727669736f724552433732313a20617070726f76656420717565727920666f72206e6f6e6578697374656e7420746f6b656e4552433732313a207472616e73666572206f6620746f6b656e2074686174206973206e6f74206f776e4552433732314d657461646174613a2055524920717565727920666f72206e6f6e6578697374656e7420746f6b656e54686520696e646578206d7573742062652077697468696e2072616e6765206f6620746865206c6973744552433732313a20617070726f76616c20746f2063757272656e74206f776e65724552433732313a207472616e736665722063616c6c6572206973206e6f74206f776e6572206e6f7220617070726f766564a26469706673582212200e553b381f2c865b458b9a3a9a019a7ec716011e221bd59b50a8eba1c938066c64736f6c63430007000033";
    var immutableReferences = {
    };
    var sourceMap = "371:666:0:-:0;;;475:30;;;;;;;;;;3575:369:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;768:40:9;435:10;787:20;;768:18;;;:40;;:::i;:::-;3657:5:14;3649;:13;;;;;;;;;;;;:::i;:::-;;3682:7;3672;:17;;;;;;;;;;;;:::i;:::-;;3777:40;2740:10;3796:20;;3777:18;;;:40;;:::i;:::-;3827:49;3072:10;3846:29;;3827:18;;;:49;;:::i;:::-;3886:51;3445:10;3905:31;;3886:18;;;:51;;:::i;:::-;3575:369;;882:17:8;902:12;:10;;;:12;;:::i;:::-;882:32;;933:9;924:6;;:18;;;;;;;;;;;;;;;;;;990:9;957:43;;986:1;957:43;;;;;;;;;;;;848:159;1333:29:3::2;1351:10;1333:17;;;:29;;:::i;:::-;371:666:0::0;;1499:198:9;1597:10;1582:25;;:11;:25;;;;;1574:66;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1686:4;1650:20;:33;1671:11;1650:33;;;;;;;;;;;;;;;;;;:40;;;;;;;;;;;;;;;;;;1499:198;:::o;598:104:7:-;651:15;685:10;678:17;;598:104;:::o;2000:240:8:-;1297:12;:10;;;:12;;:::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;371:666:0:-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;";
    var deployedSourceMap = "371:666:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;965:140:9;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;4500:90:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7107:209;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;6665:381;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;6175:200;;;:::i;:::-;;;;;;;;;;;;;;;;;;;1959:350:2;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;2315:119;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;7955:300:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;3087:198:2;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5952:152:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;8321:149;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;6447:161;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;4271:167;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;3291:296:2;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5786:87:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4003:211;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;1706:145:8;;;:::i;:::-;;817:217:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1083:77:8;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;4654:94:14;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7383:290;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1571:257:3;;;:::i;:::-;;8536:282:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1880:358:3;;;:::i;:::-;;4814:740:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;511:300:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;679:49:3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;7739:154:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;2000:240:8;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;1375:143:3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1486:357:2;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;965:140:9;1042:4;1065:20;:33;1086:11;1065:33;;;;;;;;;;;;;;;;;;;;;;;;;;;1058:40;;965:140;;;:::o;4500:90:14:-;4546:13;4578:5;4571:12;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4500:90;:::o;7107:209::-;7175:7;7202:16;7210:7;7202;:16::i;:::-;7194:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7285:15;:24;7301:7;7285:24;;;;;;;;;;;;;;;;;;;;;7278:31;;7107:209;;;:::o;6665:381::-;6745:13;6761:16;6769:7;6761;:16::i;:::-;6745:32;;6801:5;6795:11;;:2;:11;;;;6787:57;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;6879:5;6863:21;;:12;:10;:12::i;:::-;:21;;;:62;;;;6888:37;6905:5;6912:12;:10;:12::i;:::-;6888:16;:37::i;:::-;6863:62;6855:152;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7018:21;7027:2;7031:7;7018:8;:21::i;:::-;6665:381;;;:::o;6175:200::-;6228:7;6347:21;:12;:19;:21::i;:::-;6340:28;;6175:200;:::o;1959:350:2:-;1142:9;1137:203;1161:15;:22;;;;1157:1;:26;1137:203;;;1230:10;1208:32;;:15;1224:1;1208:18;;;;;;;;;;;;;;;;;;;;;;;;;:32;;;1204:126;;;1268:5;1260:55;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1204:126;1185:3;;;;;;;1137:203;;;;2130:1:::1;2087:45;;:19;:31;2107:10;2087:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;2066:132;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2250:10;2208:27;:39;2236:10;2208:39;;;;;;;;;;;;;;;;:52;;;;;;;;;;;;;;;;;;2270:15;2291:10;2270:32;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1959:350:::0;:::o;2315:119::-;2397:30;2409:17;2397:11;:30::i;:::-;2315:119;:::o;7955:300:14:-;8114:41;8133:12;:10;:12::i;:::-;8147:7;8114:18;:41::i;:::-;8106:103;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;8220:28;8230:4;8236:2;8240:7;8220:9;:28::i;:::-;7955:300;;;:::o;3087:198:2:-;3161:16;3179;3218:60;3236:8;3246:19;3267:10;3218:17;:60::i;:::-;3211:67;;;;3087:198;;:::o;5952:152:14:-;6041:7;6067:30;6091:5;6067:13;:20;6081:5;6067:20;;;;;;;;;;;;;;;:23;;:30;;;;:::i;:::-;6060:37;;5952:152;;;;:::o;8321:149::-;8424:39;8441:4;8447:2;8451:7;8424:39;;;;;;;;;;;;:16;:39::i;:::-;8321:149;;;:::o;6447:161::-;6514:7;6534:15;6555:22;6571:5;6555:12;:15;;:22;;;;:::i;:::-;6533:44;;;6594:7;6587:14;;;6447:161;;;:::o;4271:167::-;4335:7;4361:70;4378:7;4361:70;;;;;;;;;;;;;;;;;:12;:16;;:70;;;;;:::i;:::-;4354:77;;4271:167;;;:::o;3291:296:2:-;3374:16;3392;3443:137;3478:15;3511:27;3556:10;3443:17;:137::i;:::-;3424:156;;;;3291:296;;:::o;5786:87:14:-;5826:13;5858:8;5851:15;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5786:87;:::o;4003:211::-;4067:7;4111:1;4094:19;;:5;:19;;;;4086:74;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4178:29;:13;:20;4192:5;4178:20;;;;;;;;;;;;;;;:27;:29::i;:::-;4171:36;;4003:211;;;:::o;1706:145:8:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1812:1:::1;1775:40;;1796:6;;;;;;;;;;;1775:40;;;;;;;;;;;;1842:1;1825:6;;:19;;;;;;;;;;;;;;;;;;1706:145::o:0;817:217:0:-;894:13;910:21;:30;932:7;910:30;;;;;;;;;;;;;;;941:6;910:38;;;;;;;;;;;;;;;;894:54;;958:34;976:7;985:6;958:17;:34::i;:::-;1002:25;1012:7;1021:5;1002:9;:25::i;:::-;817:217;;;:::o;1083:77:8:-;1121:7;1147:6;;;;;;;;;;;1140:13;;1083:77;:::o;4654:94:14:-;4702:13;4734:7;4727:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4654:94;:::o;7383:290::-;7497:12;:10;:12::i;:::-;7485:24;;:8;:24;;;;7477:62;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7595:8;7550:18;:32;7569:12;:10;:12::i;:::-;7550:32;;;;;;;;;;;;;;;:42;7583:8;7550:42;;;;;;;;;;;;;;;;:53;;;;;;;;;;;;;;;;;;7647:8;7618:48;;7633:12;:10;:12::i;:::-;7618:48;;;7657:8;7618:48;;;;;;;;;;;;;;;;;;;;7383:290;;:::o;1571:257:3:-;998:17;:29;1016:10;998:29;;;;;;;;;;;;;;;;;;;;;;;;;960:67;;967:27;987:6;967:15;:19;;:27;;;;:::i;:::-;960:67;;;939:98;;;;;;1073:1:2::1;1030:45;;:19;:31;1050:10;1030:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1022:54;;;::::0;::::1;;1669:15:3::2;1640:14;:26;1655:10;1640:26;;;;;;;;;;;;;;;:44;;;;1733:27;1753:6;1733:15;:19;;:27;;;;:::i;:::-;1694:17;:29;1712:10;1694:29;;;;;;;;;;;;;;;;:67;;;;;;;;;;;;;;;;;;1793:10;1776:45;;;1805:15;1776:45;;;;;;;;;;;;;;;;;;1571:257::o:0;8536:282:14:-;8667:41;8686:12;:10;:12::i;:::-;8700:7;8667:18;:41::i;:::-;8659:103;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;8772:39;8786:4;8792:2;8796:7;8805:5;8772:13;:39::i;:::-;8536:282;;;;:::o;1880:358:3:-;1073:1:2;1030:45;;:19;:31;1050:10;1030:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1022:54;;;;;;1933:16:3::1;1952:15;1933:34;;1997:14;:26;2012:10;1997:26;;;;;;;;;;;;;;;;1985:8;:38;;1977:47;;;::::0;::::1;;2082:7;2038:40;2051:14;:26;2066:10;2051:26;;;;;;;;;;;;;;;;2038:8;:12;;:40;;;;:::i;:::-;:51;2034:137;;2141:19;2149:10;2141:7;:19::i;:::-;2034:137;2203:10;2185:46;;;2215:15;2185:46;;;;;;;;;;;;;;;;;;1086:1:2;1880:358:3:o:0;4814:740:14:-;4879:13;4912:16;4920:7;4912;:16::i;:::-;4904:76;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4991:23;5017:10;:19;5028:7;5017:19;;;;;;;;;;;4991:45;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5135:1;5115:8;5109:22;;;;;;;;;;;;;;;;:27;5105:74;;;5159:9;5152:16;;;;;5105:74;5307:1;5287:9;5281:23;:27;5277:110;;;5355:8;5365:9;5338:37;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5324:52;;;;;5277:110;5517:8;5527:18;:7;:16;:18::i;:::-;5500:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5486:61;;;4814:740;;;;:::o;511:300:0:-;582:9;577:181;601:21;:30;623:7;601:30;;;;;;;;;;;;;;;:37;;;;597:1;:41;577:181;;;659:13;675:21;:30;697:7;675:30;;;;;;;;;;;;;;;706:1;675:33;;;;;;;;;;;;;;;;659:49;;722:25;732:7;741:5;722:9;:25::i;:::-;577:181;640:3;;;;;;;577:181;;;;774:21;:30;796:7;774:30;;;;;;;;;;;;;;;;767:37;;;;:::i;:::-;511:300;:::o;679:49:3:-;;;;;;;;;;;;;;;;;:::o;7739:154:14:-;7828:4;7851:18;:25;7870:5;7851:25;;;;;;;;;;;;;;;:35;7877:8;7851:35;;;;;;;;;;;;;;;;;;;;;;;;;7844:42;;7739:154;;;;:::o;2000:240:8:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;1375:143:3:-;1446:16;1481:21;:30;1503:7;1481:30;;;;;;;;;;;;;;;1474:37;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1375:143;;;:::o;1486:357:2:-;1531:11;1601:1;1558:45;;:19;:31;1578:10;1558:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;1554:283;;1626:23;1619:30;;;;1554:283;1721:1;1670:53;;:27;:39;1698:10;1670:39;;;;;;;;;;;;;;;;;;;;;;;;;:53;;;1666:171;;1746:26;1739:33;;;;1666:171;1810:16;1803:23;;1486:357;;:::o;10252:117:14:-;10309:4;10332:30;10354:7;10332:12;:21;;:30;;;;:::i;:::-;10325:37;;10252:117;;;:::o;598:104:7:-;651:15;685:10;678:17;;598:104;:::o;15908:155:14:-;16000:2;15973:15;:24;15989:7;15973:24;;;;;;;;;;;;:29;;;;;;;;;;;;;;;;;;16048:7;16044:2;16017:39;;16026:16;16034:7;16026;:16::i;:::-;16017:39;;;;;;;;;;;;15908:155;;:::o;7031:121:21:-;7100:7;7126:19;7134:3;:10;;7126:7;:19::i;:::-;7119:26;;7031:121;;;:::o;2482:599:2:-;2548:15;2566;2582:17;2566:34;;;;;;;;;;;;;;;;;;;;;;;;;2548:52;;2671:1;2631:42;;:19;:28;2651:7;2631:28;;;;;;;;;;;;;;;;;;;;;;;;;:42;;;2610:129;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2810:10;2770:50;;:27;:36;2798:7;2770:36;;;;;;;;;;;;;;;;;;;;;;;;;:50;;;2749:134;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2925:10;2894:19;:28;2914:7;2894:28;;;;;;;;;;;;;;;;:41;;;;;;;;;;;;;;;;;;2945:8;2959:7;2945:22;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2977:44;3003:17;2977:15;:25;;:44;;;;:::i;:::-;3038:27;:36;3066:7;3038:36;;;;;;;;;;;;;;;;3031:43;;;;;;;;;;;2482:599;;:::o;10527:329:14:-;10612:4;10636:16;10644:7;10636;:16::i;:::-;10628:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;10711:13;10727:16;10735:7;10727;:16::i;:::-;10711:32;;10772:5;10761:16;;:7;:16;;;:51;;;;10805:7;10781:31;;:20;10793:7;10781:11;:20::i;:::-;:31;;;10761:51;:87;;;;10816:32;10833:5;10840:7;10816:16;:32::i;:::-;10761:87;10753:96;;;10527:329;;;;:::o;13521:559::-;13638:4;13618:24;;:16;13626:7;13618;:16::i;:::-;:24;;;13610:78;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;13720:1;13706:16;;:2;:16;;;;13698:65;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;13774:39;13795:4;13801:2;13805:7;13774:20;:39::i;:::-;13875:29;13892:1;13896:7;13875:8;:29::i;:::-;13915:35;13942:7;13915:13;:19;13929:4;13915:19;;;;;;;;;;;;;;;:26;;:35;;;;:::i;:::-;;13960:30;13982:7;13960:13;:17;13974:2;13960:17;;;;;;;;;;;;;;;:21;;:30;;;;:::i;:::-;;14001:29;14018:7;14027:2;14001:12;:16;;:29;;;;;:::i;:::-;;14065:7;14061:2;14046:27;;14055:4;14046:27;;;;;;;;;;;;13521:559;;;:::o;3593:1225:2:-;3772:16;3790;3818:13;3850:9;3845:219;3869:9;:16;;;;3865:1;:20;3845:219;;;3915:15;3933:9;3943:1;3933:12;;;;;;;;;;;;;;;;;;;;;;;;;3915:30;;3989:10;3963:36;;:13;:22;3977:7;3963:22;;;;;;;;;;;;;;;;;;;;;;;;;:36;;;3959:95;;;4027:12;4037:1;4027:5;:9;;:12;;;;:::i;:::-;4019:20;;3959:95;3845:219;3891:8;3897:1;3891;:5;;:8;;;;:::i;:::-;3887:12;;3845:219;;;;4073:29;4119:5;4105:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4073:52;;4135:33;4185:5;4171:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4135:56;;4202:9;4230;4225:538;4249:9;:16;;;;4245:1;:20;4225:538;;;4295:15;4313:9;4323:1;4313:12;;;;;;;;;;;;;;;;;;;;;;;;;4295:30;;4369:10;4343:36;;:13;:22;4357:7;4343:22;;;;;;;;;;;;;;;;;;;;;;;;;:36;;;4339:414;;;4417:7;4399:12;4412:1;4399:15;;;;;;;;;;;;;:25;;;;;;;;;;;4464:1;4442:16;4459:1;4442:19;;;;;;;;;;;;;:23;;;;;4487:8;4493:1;4487;:5;;:8;;;;:::i;:::-;4483:12;;4656:1;4647:5;:10;4643:96;;4689:12;4703:16;4681:39;;;;;;;;;;;;4643:96;4339:414;4225:538;4271:8;4277:1;4271;:5;;:8;;;;:::i;:::-;4267:12;;4225:538;;;;4780:12;4794:16;4772:39;;;;;;;;3593:1225;;;;;;;:::o;9214:135:22:-;9285:7;9319:22;9323:3;:10;;9335:5;9319:3;:22::i;:::-;9311:31;;9304:38;;9214:135;;;;:::o;7480:224:21:-;7560:7;7569;7589:11;7602:13;7619:22;7623:3;:10;;7635:5;7619:3;:22::i;:::-;7588:53;;;;7667:3;7659:12;;7689:5;7681:14;;7651:46;;;;;;7480:224;;;;;:::o;8123:202::-;8230:7;8272:44;8277:3;:10;;8297:3;8289:12;;8303;8272:4;:44::i;:::-;8264:53;;8249:69;;8123:202;;;;;:::o;8770:112:22:-;8830:7;8856:19;8864:3;:10;;8856:7;:19::i;:::-;8849:26;;8770:112;;;:::o;2482:323:3:-;2587:6;2582:1;:11;;:61;;;;;2606:21;:30;2628:7;2606:30;;;;;;;;;;;;;;;:37;;;;2597:6;:46;2582:61;2561:179;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2750:48;2791:6;2750:21;:30;2772:7;2750:30;;;;;;;;;;;;;;;:40;;:48;;;;:::i;:::-;2482:323;;:::o;11187:108:14:-;11262:26;11272:2;11276:7;11262:26;;;;;;;;;;;;:9;:26::i;:::-;11187:108;;:::o;3109:130:11:-;3167:7;3193:39;3197:1;3200;3193:39;;;;;;;;;;;;;;;;;:3;:39::i;:::-;3186:46;;3109:130;;;;:::o;9680:269:14:-;9793:28;9803:4;9809:2;9813:7;9793:9;:28::i;:::-;9839:48;9862:4;9868:2;9872:7;9881:5;9839:22;:48::i;:::-;9831:111;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;9680:269;;;;:::o;1329:134:11:-;1387:7;1413:43;1417:1;1420;1413:43;;;;;;;;;;;;;;;;;:3;:43::i;:::-;1406:50;;1329:134;;;;:::o;2244:232:3:-;1073:1:2;1030:45;;:19;:31;1050:10;1030:31;;;;;;;;;;;;;;;;;;;;;;;;;:45;;;;1022:54;;;;;;2304:21:3::1;:9;:19;:21::i;:::-;2335:16;2354:19;:9;:17;:19::i;:::-;2335:38;;2383:21;:26;2405:3;2383:26;;;;;;;;;;;;;;;2415:8;2383:41;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2455:3;2439:30;;;2460:8;2439:30;;;;;;;;;;;;;;;;;;1086:1:2;2244:232:3::0;:::o;210:723:23:-;266:13;492:1;483:5;:10;479:51;;;509:10;;;;;;;;;;;;;;;;;;;;;479:51;539:12;554:5;539:20;;569:14;593:75;608:1;600:4;:9;593:75;;625:8;;;;;;;655:2;647:10;;;;;;;;;593:75;;;677:19;709:6;699:17;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;677:39;;726:13;751:1;742:6;:10;726:26;;769:5;762:12;;784:112;799:1;791:4;:9;784:112;;857:2;850:4;:9;;;;;;845:2;:14;834:27;;816:6;823:7;;;;;;;816:15;;;;;;;;;;;:45;;;;;;;;;;;883:2;875:10;;;;;;;;;784:112;;;919:6;905:21;;;;;;210:723;;;;:::o;6799:149:21:-;6883:4;6906:35;6916:3;:10;;6936:3;6928:12;;6906:9;:35::i;:::-;6899:42;;6799:149;;;;:::o;4491:108::-;4547:7;4573:3;:12;;:19;;;;4566:26;;4491:108;;;:::o;93:300:5:-;193:3;188:1;:8;;:28;;;;;206:3;:10;;;;200:3;:16;188:28;167:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;294:19;329:1;316:3;:10;;;;:14;294:36;;351:3;355:11;351:16;;;;;;;;;;;;;;;;;;;;;;;;;340:3;344;340:8;;;;;;;;;;;;;;;;:27;;;;;;;;;;;;;;;;;;377:3;:9;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;93:300;;;:::o;16659:93:14:-;;;;:::o;8329:135:22:-;8399:4;8422:35;8430:3;:10;;8450:5;8442:14;;8422:7;:35::i;:::-;8415:42;;8329:135;;;;:::o;8032:129::-;8099:4;8122:32;8127:3;:10;;8147:5;8139:14;;8122:4;:32::i;:::-;8115:39;;8032:129;;;;:::o;6247:174:21:-;6336:4;6359:55;6364:3;:10;;6384:3;6376:12;;6406:5;6398:14;;6390:23;;6359:4;:55::i;:::-;6352:62;;6247:174;;;;;:::o;882:176:11:-;940:7;959:9;975:1;971;:5;959:17;;999:1;994;:6;;986:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1050:1;1043:8;;;882:176;;;;:::o;4452:201:22:-;4519:7;4567:5;4546:3;:11;;:18;;;;:26;4538:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4628:3;:11;;4640:5;4628:18;;;;;;;;;;;;;;;;4621:25;;4452:201;;;;:::o;4942:274:21:-;5009:7;5018;5067:5;5045:3;:12;;:19;;;;:27;5037:74;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5122:22;5147:3;:12;;5160:5;5147:19;;;;;;;;;;;;;;;;;;5122:44;;5184:5;:10;;;5196:5;:12;;;5176:33;;;;;4942:274;;;;;:::o;5623:315::-;5717:7;5736:16;5755:3;:12;;:17;5768:3;5755:17;;;;;;;;;;;;5736:36;;5802:1;5790:8;:13;;5805:12;5782:36;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;5871:3;:12;;5895:1;5884:8;:12;5871:26;;;;;;;;;;;;;;;;;;:33;;;5864:40;;;5623:315;;;;;:::o;4013:107:22:-;4069:7;4095:3;:11;;:18;;;;4088:25;;4013:107;;;:::o;93:300:6:-;193:3;188:1;:8;;:28;;;;;206:3;:10;;;;200:3;:16;188:28;167:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;294:19;329:1;316:3;:10;;;;:14;294:36;;351:3;355:11;351:16;;;;;;;;;;;;;;;;340:3;344;340:8;;;;;;;;;;;;;;;:27;;;;377:3;:9;;;;;;;;;;;;;;;;;;;;;;;;93:300;;;:::o;11516:247:14:-;11611:18;11617:2;11621:7;11611:5;:18::i;:::-;11647:54;11678:1;11682:2;11686:7;11695:5;11647:22;:54::i;:::-;11639:117;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;11516:247;;;:::o;3721:272:11:-;3807:7;3838:1;3834;:5;3841:12;3826:28;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3864:9;3880:1;3876;:5;;;;;;3864:17;;3985:1;3978:8;;;3721:272;;;;;:::o;15313:589:14:-;15433:4;15458:15;:2;:13;;;:15::i;:::-;15453:58;;15496:4;15489:11;;;;15453:58;15520:23;15546:246;15598:45;;;15657:12;:10;:12::i;:::-;15683:4;15701:7;15722:5;15562:175;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;15546:246;;;;;;;;;;;;;;;;;:2;:15;;;;:246;;;;;:::i;:::-;15520:272;;15802:13;15829:10;15818:32;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;15802:48;;1076:10;15878:16;;15868:26;;;:6;:26;;;;15860:35;;;;15313:589;;;;;;;:::o;1754:187:11:-;1840:7;1872:1;1867;:6;;1875:12;1859:29;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1898:9;1914:1;1910;:5;1898:17;;1933:1;1926:8;;;1754:187;;;;;:::o;1224:178:20:-;1394:1;1376:7;:14;;;:19;;;;;;;;;;;1224:178;:::o;1106:112::-;1171:7;1197;:14;;;1190:21;;1106:112;;;:::o;4278:123:21:-;4349:4;4393:1;4372:3;:12;;:17;4385:3;4372:17;;;;;;;;;;;;:22;;4365:29;;4278:123;;;;:::o;2212:1512:22:-;2278:4;2394:18;2415:3;:12;;:19;2428:5;2415:19;;;;;;;;;;;;2394:40;;2463:1;2449:10;:15;2445:1273;;2806:21;2843:1;2830:10;:14;2806:38;;2858:17;2899:1;2878:3;:11;;:18;;;;:22;2858:42;;3140:17;3160:3;:11;;3172:9;3160:22;;;;;;;;;;;;;;;;3140:42;;3303:9;3274:3;:11;;3286:13;3274:26;;;;;;;;;;;;;;;:38;;;;3420:1;3404:13;:17;3378:3;:12;;:23;3391:9;3378:23;;;;;;;;;;;:43;;;;3527:3;:11;;:17;;;;;;;;;;;;;;;;;;;;;;;;3619:3;:12;;:19;3632:5;3619:19;;;;;;;;;;;3612:26;;;3660:4;3653:11;;;;;;;;2445:1273;3702:5;3695:12;;;2212:1512;;;;;:::o;1640:404::-;1703:4;1724:21;1734:3;1739:5;1724:9;:21::i;:::-;1719:319;;1761:3;:11;;1778:5;1761:23;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1941:3;:11;;:18;;;;1919:3;:12;;:19;1932:5;1919:19;;;;;;;;;;;:40;;;;1980:4;1973:11;;;;1719:319;2022:5;2015:12;;1640:404;;;;;:::o;1836:678:21:-;1912:4;2026:16;2045:3;:12;;:17;2058:3;2045:17;;;;;;;;;;;;2026:36;;2089:1;2077:8;:13;2073:435;;;2143:3;:12;;2161:38;;;;;;;;2178:3;2161:38;;;;2191:5;2161:38;;;2143:57;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2355:3;:12;;:19;;;;2335:3;:12;;:17;2348:3;2335:17;;;;;;;;;;;:39;;;;2395:4;2388:11;;;;;2073:435;2466:5;2430:3;:12;;2454:1;2443:8;:12;2430:26;;;;;;;;;;;;;;;;;;:33;;:41;;;;2492:5;2485:12;;;1836:678;;;;;;:::o;12085:393:14:-;12178:1;12164:16;;:2;:16;;;;12156:61;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;12236:16;12244:7;12236;:16::i;:::-;12235:17;12227:58;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;12296:45;12325:1;12329:2;12333:7;12296:20;:45::i;:::-;12352:30;12374:7;12352:13;:17;12366:2;12352:17;;;;;;;;;;;;;;;:21;;:30;;;;:::i;:::-;;12393:29;12410:7;12419:2;12393:12;:16;;:29;;;;;:::i;:::-;;12463:7;12459:2;12438:33;;12455:1;12438:33;;;;;;;;;;;;12085:393;;:::o;726:413:19:-;786:4;989:12;1098:7;1086:20;1078:28;;1131:1;1124:4;:8;1117:15;;;726:413;;;:::o;3581:193::-;3684:12;3715:52;3737:6;3745:4;3751:1;3754:12;3715:21;:52::i;:::-;3708:59;;3581:193;;;;;:::o;3805:127:22:-;3878:4;3924:1;3901:3;:12;;:19;3914:5;3901:19;;;;;;;;;;;;:24;;3894:31;;3805:127;;;;:::o;4608:523:19:-;4735:12;4792:5;4767:21;:30;;4759:81;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4858:18;4869:6;4858:10;:18::i;:::-;4850:60;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4981:12;4995:23;5022:6;:11;;5042:5;5050:4;5022:33;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4980:75;;;;5072:52;5090:7;5099:10;5111:12;5072:17;:52::i;:::-;5065:59;;;;4608:523;;;;;;:::o;6111:725::-;6226:12;6254:7;6250:580;;;6284:10;6277:17;;;;6250:580;6415:1;6395:10;:17;:21;6391:429;;;6653:10;6647:17;6713:15;6700:10;6696:2;6692:19;6685:44;6602:145;6792:12;6785:20;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;6111:725;;;;;;:::o;-1:-1:-1:-;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;:::o";
    var source = "pragma solidity ^0.7.0;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\nimport \"@openzeppelin/contracts/math/SafeMath.sol\";\nimport \"./StudentColl.sol\";\n\n/// @dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour\n/// A supervisor can then approve the coin\ncontract EvieCoin is StudentColl {\n    using SafeMath for uint256;\n    using SafeMath for uint256;\n\n    constructor() StudentColl() {}\n\n    function SupervisorApproveAll(address student) external {\n        for (uint256 i = 0; i < pendingCollectibleIds[student].length; i++) {\n            uint256 tokId = pendingCollectibleIds[student][i];\n            _safeMint(student, tokId);\n        }\n        delete pendingCollectibleIds[student];\n    }\n\n    function SupervisorApprove(address student, uint256 tokInd) public {\n        uint256 tokId = pendingCollectibleIds[student][tokInd];\n        removeFromPending(student, tokInd);\n        _safeMint(student, tokId);\n    }\n\n}\n";
    var sourcePath = "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol";
    var ast = {
    	absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    	exportedSymbols: {
    		EvieCoin: [
    			86
    		]
    	},
    	id: 87,
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
    			scope: 87,
    			sourceUnit: 1807,
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
    			scope: 87,
    			sourceUnit: 1039,
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
    			scope: 87,
    			sourceUnit: 1304,
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
    			scope: 87,
    			sourceUnit: 814,
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
    						referencedDeclaration: 813,
    						src: "392:11:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_StudentColl_$813",
    							typeString: "contract StudentColl"
    						}
    					},
    					id: 8,
    					nodeType: "InheritanceSpecifier",
    					src: "392:11:0"
    				}
    			],
    			contractDependencies: [
    				561,
    				813,
    				929,
    				1038,
    				1095,
    				1107,
    				2815,
    				2931,
    				2962,
    				2989
    			],
    			contractKind: "contract",
    			documentation: {
    				id: 6,
    				nodeType: "StructuredDocumentation",
    				src: "215:156:0",
    				text: "@dev a coin which is rewarded to a student upon completition of clocking in and out within less than an hour\n A supervisor can then approve the coin"
    			},
    			fullyImplemented: true,
    			id: 86,
    			linearizedBaseContracts: [
    				86,
    				813,
    				561,
    				1038,
    				2815,
    				2962,
    				2989,
    				2931,
    				1095,
    				1107,
    				929
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
    						referencedDeclaration: 1303,
    						src: "416:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$1303",
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
    						referencedDeclaration: 1303,
    						src: "448:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$1303",
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
    								referencedDeclaration: 813,
    								src: "489:11:0",
    								typeDescriptions: {
    									typeIdentifier: "t_type$_t_contract$_StudentColl_$813_$",
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
    					scope: 86,
    					src: "475:30:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 58,
    						nodeType: "Block",
    						src: "567:244:0",
    						statements: [
    							{
    								body: {
    									id: 51,
    									nodeType: "Block",
    									src: "645:113:0",
    									statements: [
    										{
    											assignments: [
    												39
    											],
    											declarations: [
    												{
    													constant: false,
    													id: 39,
    													mutability: "mutable",
    													name: "tokId",
    													nodeType: "VariableDeclaration",
    													overrides: null,
    													scope: 51,
    													src: "659:13:0",
    													stateVariable: false,
    													storageLocation: "default",
    													typeDescriptions: {
    														typeIdentifier: "t_uint256",
    														typeString: "uint256"
    													},
    													typeName: {
    														id: 38,
    														name: "uint256",
    														nodeType: "ElementaryTypeName",
    														src: "659:7:0",
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													},
    													value: null,
    													visibility: "internal"
    												}
    											],
    											id: 45,
    											initialValue: {
    												argumentTypes: null,
    												baseExpression: {
    													argumentTypes: null,
    													baseExpression: {
    														argumentTypes: null,
    														id: 40,
    														name: "pendingCollectibleIds",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 595,
    														src: "675:21:0",
    														typeDescriptions: {
    															typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    															typeString: "mapping(address => uint256[] storage ref)"
    														}
    													},
    													id: 42,
    													indexExpression: {
    														argumentTypes: null,
    														id: 41,
    														name: "student",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 22,
    														src: "697:7:0",
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
    													src: "675:30:0",
    													typeDescriptions: {
    														typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    														typeString: "uint256[] storage ref"
    													}
    												},
    												id: 44,
    												indexExpression: {
    													argumentTypes: null,
    													id: 43,
    													name: "i",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 26,
    													src: "706:1:0",
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
    												src: "675:33:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											nodeType: "VariableDeclarationStatement",
    											src: "659:49:0"
    										},
    										{
    											expression: {
    												argumentTypes: null,
    												"arguments": [
    													{
    														argumentTypes: null,
    														id: 47,
    														name: "student",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 22,
    														src: "732:7:0",
    														typeDescriptions: {
    															typeIdentifier: "t_address",
    															typeString: "address"
    														}
    													},
    													{
    														argumentTypes: null,
    														id: 48,
    														name: "tokId",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: 39,
    														src: "741:5:0",
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
    													id: 46,
    													name: "_safeMint",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    														2463,
    														2492
    													],
    													referencedDeclaration: 2463,
    													src: "722:9:0",
    													typeDescriptions: {
    														typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    														typeString: "function (address,uint256)"
    													}
    												},
    												id: 49,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												kind: "functionCall",
    												lValueRequested: false,
    												names: [
    												],
    												nodeType: "FunctionCall",
    												src: "722:25:0",
    												tryCall: false,
    												typeDescriptions: {
    													typeIdentifier: "t_tuple$__$",
    													typeString: "tuple()"
    												}
    											},
    											id: 50,
    											nodeType: "ExpressionStatement",
    											src: "722:25:0"
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
    												referencedDeclaration: 595,
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
    								id: 52,
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
    											scope: 52,
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
    								src: "577:181:0"
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
    									src: "767:37:0",
    									subExpression: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 53,
    											name: "pendingCollectibleIds",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 595,
    											src: "774:21:0",
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
    											src: "796:7:0",
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
    										src: "774:30:0",
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
    								src: "767:37:0"
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
    					scope: 86,
    					src: "511:300:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "external"
    				},
    				{
    					body: {
    						id: 84,
    						nodeType: "Block",
    						src: "884:150:0",
    						statements: [
    							{
    								assignments: [
    									67
    								],
    								declarations: [
    									{
    										constant: false,
    										id: 67,
    										mutability: "mutable",
    										name: "tokId",
    										nodeType: "VariableDeclaration",
    										overrides: null,
    										scope: 84,
    										src: "894:13:0",
    										stateVariable: false,
    										storageLocation: "default",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										},
    										typeName: {
    											id: 66,
    											name: "uint256",
    											nodeType: "ElementaryTypeName",
    											src: "894:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										},
    										value: null,
    										visibility: "internal"
    									}
    								],
    								id: 73,
    								initialValue: {
    									argumentTypes: null,
    									baseExpression: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 68,
    											name: "pendingCollectibleIds",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 595,
    											src: "910:21:0",
    											typeDescriptions: {
    												typeIdentifier: "t_mapping$_t_address_$_t_array$_t_uint256_$dyn_storage_$",
    												typeString: "mapping(address => uint256[] storage ref)"
    											}
    										},
    										id: 70,
    										indexExpression: {
    											argumentTypes: null,
    											id: 69,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "932:7:0",
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
    										src: "910:30:0",
    										typeDescriptions: {
    											typeIdentifier: "t_array$_t_uint256_$dyn_storage",
    											typeString: "uint256[] storage ref"
    										}
    									},
    									id: 72,
    									indexExpression: {
    										argumentTypes: null,
    										id: 71,
    										name: "tokInd",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 63,
    										src: "941:6:0",
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
    									src: "910:38:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								nodeType: "VariableDeclarationStatement",
    								src: "894:54:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 75,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "976:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 76,
    											name: "tokInd",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 63,
    											src: "985:6:0",
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
    										id: 74,
    										name: "removeFromPending",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 812,
    										src: "958:17:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 77,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "958:34:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 78,
    								nodeType: "ExpressionStatement",
    								src: "958:34:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 80,
    											name: "student",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 61,
    											src: "1012:7:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 81,
    											name: "tokId",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 67,
    											src: "1021:5:0",
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
    										id: 79,
    										name: "_safeMint",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    											2463,
    											2492
    										],
    										referencedDeclaration: 2463,
    										src: "1002:9:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 82,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1002:25:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 83,
    								nodeType: "ExpressionStatement",
    								src: "1002:25:0"
    							}
    						]
    					},
    					documentation: null,
    					functionSelector: "7aa0c589",
    					id: 85,
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
    								scope: 85,
    								src: "844:15:0",
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
    									src: "844:7:0",
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
    								scope: 85,
    								src: "861:14:0",
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
    									src: "861:7:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "843:33:0"
    					},
    					returnParameters: {
    						id: 65,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "884:0:0"
    					},
    					scope: 86,
    					src: "817:217:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				}
    			],
    			scope: 87,
    			src: "371:666:0"
    		}
    	],
    	src: "0:1038:0"
    };
    var legacyAST = {
    	attributes: {
    		absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    		exportedSymbols: {
    			EvieCoin: [
    				86
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
    				SourceUnit: 1807,
    				absolutePath: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				file: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				scope: 87,
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
    				SourceUnit: 1039,
    				absolutePath: "@openzeppelin/contracts/access/Ownable.sol",
    				file: "@openzeppelin/contracts/access/Ownable.sol",
    				scope: 87,
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
    				SourceUnit: 1304,
    				absolutePath: "@openzeppelin/contracts/math/SafeMath.sol",
    				file: "@openzeppelin/contracts/math/SafeMath.sol",
    				scope: 87,
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
    				SourceUnit: 814,
    				absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/StudentColl.sol",
    				file: "./StudentColl.sol",
    				scope: 87,
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
    					561,
    					813,
    					929,
    					1038,
    					1095,
    					1107,
    					2815,
    					2931,
    					2962,
    					2989
    				],
    				contractKind: "contract",
    				fullyImplemented: true,
    				linearizedBaseContracts: [
    					86,
    					813,
    					561,
    					1038,
    					2815,
    					2962,
    					2989,
    					2931,
    					1095,
    					1107,
    					929
    				],
    				name: "EvieCoin",
    				scope: 87
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
    								referencedDeclaration: 813,
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
    								referencedDeclaration: 1303,
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
    								referencedDeclaration: 1303,
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
    						scope: 86,
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
    										referencedDeclaration: 813,
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
    						scope: 86,
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
    														scope: 52,
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
    																		referencedDeclaration: 595,
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
    													attributes: {
    														assignments: [
    															39
    														]
    													},
    													children: [
    														{
    															attributes: {
    																constant: false,
    																mutability: "mutable",
    																name: "tokId",
    																overrides: null,
    																scope: 51,
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
    																	id: 38,
    																	name: "ElementaryTypeName",
    																	src: "659:7:0"
    																}
    															],
    															id: 39,
    															name: "VariableDeclaration",
    															src: "659:13:0"
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
    																				referencedDeclaration: 595,
    																				type: "mapping(address => uint256[] storage ref)",
    																				value: "pendingCollectibleIds"
    																			},
    																			id: 40,
    																			name: "Identifier",
    																			src: "675:21:0"
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
    																			id: 41,
    																			name: "Identifier",
    																			src: "697:7:0"
    																		}
    																	],
    																	id: 42,
    																	name: "IndexAccess",
    																	src: "675:30:0"
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
    																	id: 43,
    																	name: "Identifier",
    																	src: "706:1:0"
    																}
    															],
    															id: 44,
    															name: "IndexAccess",
    															src: "675:33:0"
    														}
    													],
    													id: 45,
    													name: "VariableDeclarationStatement",
    													src: "659:49:0"
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
    																			2463,
    																			2492
    																		],
    																		referencedDeclaration: 2463,
    																		type: "function (address,uint256)",
    																		value: "_safeMint"
    																	},
    																	id: 46,
    																	name: "Identifier",
    																	src: "722:9:0"
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
    																	id: 47,
    																	name: "Identifier",
    																	src: "732:7:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 39,
    																		type: "uint256",
    																		value: "tokId"
    																	},
    																	id: 48,
    																	name: "Identifier",
    																	src: "741:5:0"
    																}
    															],
    															id: 49,
    															name: "FunctionCall",
    															src: "722:25:0"
    														}
    													],
    													id: 50,
    													name: "ExpressionStatement",
    													src: "722:25:0"
    												}
    											],
    											id: 51,
    											name: "Block",
    											src: "645:113:0"
    										}
    									],
    									id: 52,
    									name: "ForStatement",
    									src: "577:181:0"
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
    																referencedDeclaration: 595,
    																type: "mapping(address => uint256[] storage ref)",
    																value: "pendingCollectibleIds"
    															},
    															id: 53,
    															name: "Identifier",
    															src: "774:21:0"
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
    															src: "796:7:0"
    														}
    													],
    													id: 55,
    													name: "IndexAccess",
    													src: "774:30:0"
    												}
    											],
    											id: 56,
    											name: "UnaryOperation",
    											src: "767:37:0"
    										}
    									],
    									id: 57,
    									name: "ExpressionStatement",
    									src: "767:37:0"
    								}
    							],
    							id: 58,
    							name: "Block",
    							src: "567:244:0"
    						}
    					],
    					id: 59,
    					name: "FunctionDefinition",
    					src: "511:300:0"
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
    						scope: 86,
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
    										scope: 85,
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
    											src: "844:7:0"
    										}
    									],
    									id: 61,
    									name: "VariableDeclaration",
    									src: "844:15:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "tokInd",
    										overrides: null,
    										scope: 85,
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
    											src: "861:7:0"
    										}
    									],
    									id: 63,
    									name: "VariableDeclaration",
    									src: "861:14:0"
    								}
    							],
    							id: 64,
    							name: "ParameterList",
    							src: "843:33:0"
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
    							src: "884:0:0"
    						},
    						{
    							children: [
    								{
    									attributes: {
    										assignments: [
    											67
    										]
    									},
    									children: [
    										{
    											attributes: {
    												constant: false,
    												mutability: "mutable",
    												name: "tokId",
    												overrides: null,
    												scope: 84,
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
    													id: 66,
    													name: "ElementaryTypeName",
    													src: "894:7:0"
    												}
    											],
    											id: 67,
    											name: "VariableDeclaration",
    											src: "894:13:0"
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
    																referencedDeclaration: 595,
    																type: "mapping(address => uint256[] storage ref)",
    																value: "pendingCollectibleIds"
    															},
    															id: 68,
    															name: "Identifier",
    															src: "910:21:0"
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
    															id: 69,
    															name: "Identifier",
    															src: "932:7:0"
    														}
    													],
    													id: 70,
    													name: "IndexAccess",
    													src: "910:30:0"
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
    													id: 71,
    													name: "Identifier",
    													src: "941:6:0"
    												}
    											],
    											id: 72,
    											name: "IndexAccess",
    											src: "910:38:0"
    										}
    									],
    									id: 73,
    									name: "VariableDeclarationStatement",
    									src: "894:54:0"
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
    														referencedDeclaration: 812,
    														type: "function (address,uint256)",
    														value: "removeFromPending"
    													},
    													id: 74,
    													name: "Identifier",
    													src: "958:17:0"
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
    													id: 75,
    													name: "Identifier",
    													src: "976:7:0"
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
    													id: 76,
    													name: "Identifier",
    													src: "985:6:0"
    												}
    											],
    											id: 77,
    											name: "FunctionCall",
    											src: "958:34:0"
    										}
    									],
    									id: 78,
    									name: "ExpressionStatement",
    									src: "958:34:0"
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
    															2463,
    															2492
    														],
    														referencedDeclaration: 2463,
    														type: "function (address,uint256)",
    														value: "_safeMint"
    													},
    													id: 79,
    													name: "Identifier",
    													src: "1002:9:0"
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
    													id: 80,
    													name: "Identifier",
    													src: "1012:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 67,
    														type: "uint256",
    														value: "tokId"
    													},
    													id: 81,
    													name: "Identifier",
    													src: "1021:5:0"
    												}
    											],
    											id: 82,
    											name: "FunctionCall",
    											src: "1002:25:0"
    										}
    									],
    									id: 83,
    									name: "ExpressionStatement",
    									src: "1002:25:0"
    								}
    							],
    							id: 84,
    							name: "Block",
    							src: "884:150:0"
    						}
    					],
    					id: 85,
    					name: "FunctionDefinition",
    					src: "817:217:0"
    				}
    			],
    			id: 86,
    			name: "ContractDefinition",
    			src: "371:666:0"
    		}
    	],
    	id: 87,
    	name: "SourceUnit",
    	src: "0:1038:0"
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
    			}
    		},
    		links: {
    		},
    		address: "0xf3F72a838E080B49B005F8b9aA5d4B54B2323A8d",
    		transactionHash: "0xccfad2ead4dfc30a52a1cf72ffe80221a8344a846c16865a2f85b09cad8081c5"
    	}
    };
    var schemaVersion = "3.3.3";
    var updatedAt = "2021-01-19T14:44:16.015Z";
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
    		"studentStatus()": {
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
    	devdoc: devdoc,
    	userdoc: userdoc
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

    function ethTimestampToDate(timestamp) {
        return new Date(parseInt(timestamp) * 1000);
    }

    function weiToCoinNumber(wei) {
        return window.web3.utils.fromWei(wei.toString());
    }

    const APIWriteable = writable({
        EvieCoin: undefined,
        address: "",
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
        const { timestamp } = event.returnValues;
        let endTime = ethTimestampToDate(timestamp);
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { endTime });
        });
    }
    function _clockInListener(event) {
        const { timestamp } = event.returnValues;
        let startTime = ethTimestampToDate(timestamp);
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { startTime });
        });
    }
    function _payoutListener(event) {
        const valWei = event.returnValues.value;
        const value = weiToCoinNumber(valWei);
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { bal: u.bal + valWei });
        });
        alert(`You just got paid out ${value}`);
    }
    const clockInListener = wrapper(_clockInListener);
    const clockOutListener = wrapper(_clockOutListener);
    const payoutListener = wrapper(_payoutListener);

    async function initEvieCoin() {
        const { EvieCoin, address } = await loadBlockchainData();
        await setEventListeners(EvieCoin, address);
    }
    async function loadBlockchainData() {
        const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
        const address = accounts[0];
        const evieCoin = new window.web3.eth.Contract(EvieCoinContract.abi, address);
        APIStore.set({
            EvieCoin: evieCoin,
            address,
        });
        return {
            EvieCoin: evieCoin,
            address,
        };
    }
    async function setEventListeners(evieCoin, address) {
        evieCoin.events.ClockInTimeEvent({ filter: { user: address } }, clockInListener);
        evieCoin.events.ClockOutTimeEvent({ filter: { user: address } }, clockOutListener);
        evieCoin.events.PayoutMadeEvent({ filter: { _to: address } }, payoutListener);
    }

    /* src/Pages/SelectUserTypePage.svelte generated by Svelte v3.31.2 */
    const file = "src/Pages/SelectUserTypePage.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let h2;
    	let t1;
    	let button0;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Are you a student or supervisor?";
    			t1 = space();
    			button0 = element("button");
    			button0.textContent = "Student";
    			button1 = element("button");
    			button1.textContent = "Supervisor";
    			add_location(h2, file, 5, 2, 100);
    			add_location(button0, file, 6, 2, 144);
    			add_location(button1, file, 6, 61, 203);
    			attr_dev(div, "class", "modal");
    			add_location(div, file, 4, 0, 78);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(div, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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
    	$$self.$capture_state = () => ({ push, pop, replace });
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

    /* src/Pages/SupervisorPage.svelte generated by Svelte v3.31.2 */

    function create_fragment$2(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SupervisorPage", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SupervisorPage> was created with unknown prop '${key}'`);
    	});

    	return [];
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

    var dateformat = createCommonjsModule(function (module, exports) {
    function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj};}else {_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj};}return _typeof(obj)}(function(global){var _arguments=arguments;var dateFormat=function(){var token=/d{1,4}|D{3,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LlopSZWN]|"[^"]*"|'[^']*'/g;var timezone=/\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;var timezoneClip=/[^-+\dA-Z]/g;return function(date,mask,utc,gmt){if(_arguments.length===1&&kindOf(date)==="string"&&!/\d/.test(date)){mask=date;date=undefined;}date=date||date===0?date:new Date;if(!(date instanceof Date)){date=new Date(date);}if(isNaN(date)){throw TypeError("Invalid date")}mask=String(dateFormat.masks[mask]||mask||dateFormat.masks["default"]);var maskSlice=mask.slice(0,4);if(maskSlice==="UTC:"||maskSlice==="GMT:"){mask=mask.slice(4);utc=true;if(maskSlice==="GMT:"){gmt=true;}}var _=function _(){return utc?"getUTC":"get"};var _d=function d(){return date[_()+"Date"]()};var D=function D(){return date[_()+"Day"]()};var _m=function m(){return date[_()+"Month"]()};var y=function y(){return date[_()+"FullYear"]()};var _H=function H(){return date[_()+"Hours"]()};var _M=function M(){return date[_()+"Minutes"]()};var _s=function s(){return date[_()+"Seconds"]()};var _L=function L(){return date[_()+"Milliseconds"]()};var _o=function o(){return utc?0:date.getTimezoneOffset()};var _W=function W(){return getWeek(date)};var _N=function N(){return getDayOfWeek(date)};var flags={d:function d(){return _d()},dd:function dd(){return pad(_d())},ddd:function ddd(){return dateFormat.i18n.dayNames[D()]},DDD:function DDD(){return getDayName({y:y(),m:_m(),D:D(),_:_(),dayName:dateFormat.i18n.dayNames[D()],short:true})},dddd:function dddd(){return dateFormat.i18n.dayNames[D()+7]},DDDD:function DDDD(){return getDayName({y:y(),m:_m(),D:D(),_:_(),dayName:dateFormat.i18n.dayNames[D()+7]})},m:function m(){return _m()+1},mm:function mm(){return pad(_m()+1)},mmm:function mmm(){return dateFormat.i18n.monthNames[_m()]},mmmm:function mmmm(){return dateFormat.i18n.monthNames[_m()+12]},yy:function yy(){return String(y()).slice(2)},yyyy:function yyyy(){return pad(y(),4)},h:function h(){return _H()%12||12},hh:function hh(){return pad(_H()%12||12)},H:function H(){return _H()},HH:function HH(){return pad(_H())},M:function M(){return _M()},MM:function MM(){return pad(_M())},s:function s(){return _s()},ss:function ss(){return pad(_s())},l:function l(){return pad(_L(),3)},L:function L(){return pad(Math.floor(_L()/10))},t:function t(){return _H()<12?dateFormat.i18n.timeNames[0]:dateFormat.i18n.timeNames[1]},tt:function tt(){return _H()<12?dateFormat.i18n.timeNames[2]:dateFormat.i18n.timeNames[3]},T:function T(){return _H()<12?dateFormat.i18n.timeNames[4]:dateFormat.i18n.timeNames[5]},TT:function TT(){return _H()<12?dateFormat.i18n.timeNames[6]:dateFormat.i18n.timeNames[7]},Z:function Z(){return gmt?"GMT":utc?"UTC":(String(date).match(timezone)||[""]).pop().replace(timezoneClip,"").replace(/GMT\+0000/g,"UTC")},o:function o(){return (_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60)*100+Math.abs(_o())%60,4)},p:function p(){return (_o()>0?"-":"+")+pad(Math.floor(Math.abs(_o())/60),2)+":"+pad(Math.floor(Math.abs(_o())%60),2)},S:function S(){return ["th","st","nd","rd"][_d()%10>3?0:(_d()%100-_d()%10!=10)*_d()%10]},W:function W(){return _W()},N:function N(){return _N()}};return mask.replace(token,function(match){if(match in flags){return flags[match]()}return match.slice(1,match.length-1)})}}();dateFormat.masks={default:"ddd mmm dd yyyy HH:MM:ss",shortDate:"m/d/yy",paddedShortDate:"mm/dd/yyyy",mediumDate:"mmm d, yyyy",longDate:"mmmm d, yyyy",fullDate:"dddd, mmmm d, yyyy",shortTime:"h:MM TT",mediumTime:"h:MM:ss TT",longTime:"h:MM:ss TT Z",isoDate:"yyyy-mm-dd",isoTime:"HH:MM:ss",isoDateTime:"yyyy-mm-dd'T'HH:MM:sso",isoUtcDateTime:"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",expiresHeaderFormat:"ddd, dd mmm yyyy HH:MM:ss Z"};dateFormat.i18n={dayNames:["Sun","Mon","Tue","Wed","Thu","Fri","Sat","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],monthNames:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","January","February","March","April","May","June","July","August","September","October","November","December"],timeNames:["a","p","am","pm","A","P","AM","PM"]};var pad=function pad(val,len){val=String(val);len=len||2;while(val.length<len){val="0"+val;}return val};var getDayName=function getDayName(_ref){var y=_ref.y,m=_ref.m,D=_ref.D,_=_ref._,dayName=_ref.dayName,_ref$short=_ref["short"],_short=_ref$short===void 0?false:_ref$short;var today=new Date;var yesterday=new Date;yesterday.setDate(yesterday[_+"Date"]()-1);var tomorrow=new Date;tomorrow.setDate(tomorrow[_+"Date"]()+1);var today_D=function today_D(){return today[_+"Day"]()};var today_m=function today_m(){return today[_+"Month"]()};var today_y=function today_y(){return today[_+"FullYear"]()};var yesterday_D=function yesterday_D(){return yesterday[_+"Day"]()};var yesterday_m=function yesterday_m(){return yesterday[_+"Month"]()};var yesterday_y=function yesterday_y(){return yesterday[_+"FullYear"]()};var tomorrow_D=function tomorrow_D(){return tomorrow[_+"Day"]()};var tomorrow_m=function tomorrow_m(){return tomorrow[_+"Month"]()};var tomorrow_y=function tomorrow_y(){return tomorrow[_+"FullYear"]()};if(today_y()===y&&today_m()===m&&today_D()===D){return _short?"Tdy":"Today"}else if(yesterday_y()===y&&yesterday_m()===m&&yesterday_D()===D){return _short?"Ysd":"Yesterday"}else if(tomorrow_y()===y&&tomorrow_m()===m&&tomorrow_D()===D){return _short?"Tmw":"Tomorrow"}return dayName};var getWeek=function getWeek(date){var targetThursday=new Date(date.getFullYear(),date.getMonth(),date.getDate());targetThursday.setDate(targetThursday.getDate()-(targetThursday.getDay()+6)%7+3);var firstThursday=new Date(targetThursday.getFullYear(),0,4);firstThursday.setDate(firstThursday.getDate()-(firstThursday.getDay()+6)%7+3);var ds=targetThursday.getTimezoneOffset()-firstThursday.getTimezoneOffset();targetThursday.setHours(targetThursday.getHours()-ds);var weekDiff=(targetThursday-firstThursday)/(864e5*7);return 1+Math.floor(weekDiff)};var getDayOfWeek=function getDayOfWeek(date){var dow=date.getDay();if(dow===0){dow=7;}return dow};var kindOf=function kindOf(val){if(val===null){return "null"}if(val===undefined){return "undefined"}if(_typeof(val)!=="object"){return _typeof(val)}if(Array.isArray(val)){return "array"}return {}.toString.call(val).slice(8,-1).toLowerCase()};if((_typeof(exports))==="object"){module.exports=dateFormat;}else {global.dateFormat=dateFormat;}})(void 0);
    });

    /* src/Pages/Student/Approved.svelte generated by Svelte v3.31.2 */
    const file$1 = "src/Pages/Student/Approved.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0;
    	let t1_value = weiToCoinNumber(/*$StudentInfoStore*/ ctx[0].bal || 0) + "";
    	let t1;
    	let t2;
    	let div5;
    	let div2;
    	let p1;
    	let t3;

    	let t4_value = (/*$StudentInfoStore*/ ctx[0].startTime && /*$StudentInfoStore*/ ctx[0].startTime.getTime() !== new Date(0).getTime()
    	? dateformat(/*$StudentInfoStore*/ ctx[0].startTime, constants.dateFormatStr)
    	: "Please clock in to see your start time") + "";

    	let t4;
    	let t5;
    	let div3;
    	let button0;
    	let t7;
    	let div4;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text("Your current balance: ");
    			t1 = text(t1_value);
    			t2 = space();
    			div5 = element("div");
    			div2 = element("div");
    			p1 = element("p");
    			t3 = text("Start time: ");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Clock in";
    			t7 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "Clock out";
    			add_location(p0, file$1, 21, 4, 568);
    			attr_dev(div0, "class", "col-8");
    			add_location(div0, file$1, 20, 2, 544);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$1, 19, 0, 524);
    			add_location(p1, file$1, 26, 4, 703);
    			attr_dev(div2, "class", "col-4");
    			add_location(div2, file$1, 25, 2, 679);
    			add_location(button0, file$1, 33, 21, 993);
    			attr_dev(div3, "class", "col-4");
    			add_location(div3, file$1, 33, 2, 974);
    			add_location(button1, file$1, 34, 21, 1065);
    			attr_dev(div4, "class", "col-4");
    			add_location(div4, file$1, 34, 2, 1046);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$1, 24, 0, 659);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div2);
    			append_dev(div2, p1);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*clockIn*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*clockOut*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$StudentInfoStore*/ 1 && t1_value !== (t1_value = weiToCoinNumber(/*$StudentInfoStore*/ ctx[0].bal || 0) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$StudentInfoStore*/ 1 && t4_value !== (t4_value = (/*$StudentInfoStore*/ ctx[0].startTime && /*$StudentInfoStore*/ ctx[0].startTime.getTime() !== new Date(0).getTime()
    			? dateformat(/*$StudentInfoStore*/ ctx[0].startTime, constants.dateFormatStr)
    			: "Please clock in to see your start time") + "")) set_data_dev(t4, t4_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			run_all(dispose);
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

    	async function clockIn() {
    		await $APIStore.EvieCoin.methods.clockStartTime().send({ from: $StudentInfoStore.address });
    	}

    	async function clockOut() {
    		await $APIStore.EvieCoin.methods.clockEndTime().send({ from: $StudentInfoStore.address });
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
    		dateformat,
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

    async function loadStudentType(evieCoin, address) {
        const status = await evieCoin.methods.studentStatus().call();
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
        StudentInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { address,
                bal });
        });
    }
    async function loadInitClockOut(evieCoin, address) {
        let endTime;
        try {
            const pastevents = await evieCoin.getPastEvents("ClockOutTimeEvent", {
                user: address,
            });
            if (pastevents.length === 0)
                return;
            const mostRecent = pastevents[pastevents.length - 1];
            // Date is returned in seconds, needs to be changed to millis
            endTime = ethTimestampToDate(mostRecent.returnValues.timestamp);
            StudentInfoStore.update((u) => {
                return Object.assign(Object.assign({}, u), { endTime });
            });
        }
        catch (error) {
            console.error(error);
            throw "Error getting initial clock in time";
        }
    }

    /* src/Pages/Student/StudentPage.svelte generated by Svelte v3.31.2 */

    const { console: console_1$1 } = globals;

    // (37:0) {:else}
    function create_else_block_1(ctx) {
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(37:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:0) {#if connected}
    function create_if_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_if_block_2, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*studentType*/ ctx[1].FullStudent) return 0;
    		if (/*studentType*/ ctx[1].PendingStudent) return 1;
    		return 2;
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

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
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
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:0) {#if connected}",
    		ctx
    	});

    	return block;
    }

    // (34:2) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("None");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(34:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:39) 
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("PendingStudent");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(32:39) ",
    		ctx
    	});

    	return block;
    }

    // (30:2) {#if studentType.FullStudent}
    function create_if_block_1(ctx) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(30:2) {#if studentType.FullStudent}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block_1];
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
    	component_subscribe($$self, APIStore, $$value => $$invalidate(2, $APIStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("StudentPage", slots, []);
    	let connected;
    	let studentType;

    	onMount(async () => {
    		const { EvieCoin, address } = $APIStore;
    		console.log($APIStore);
    		$$invalidate(1, studentType = await loadStudentType(EvieCoin));
    		console.log(studentType);

    		// const proms = [
    		//   loadInitClockIn(EvieCoin, address),
    		//   loadInitClockOut(EvieCoin, address),
    		//   loadBal(EvieCoin, address),
    		// ];
    		// await Promise.all(proms);
    		$$invalidate(0, connected = true);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<StudentPage> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Approved,
    		APIStore,
    		onMount,
    		loadBal,
    		loadInitClockIn,
    		loadInitClockOut,
    		loadStudentType,
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "StudentPage",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file$2 = "src/App.svelte";

    // (37:2) {:else}
    function create_else_block$2(ctx) {
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(37:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:2) {#if connected}
    function create_if_block$2(ctx) {
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(35:2) {#if connected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block$2];
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
    			attr_dev(div, "class", "container");
    			add_location(div, file$2, 33, 0, 1450);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    			yield initEvieCoin();
    		}

    		$$invalidate(0, connected = true);
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
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
