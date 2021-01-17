
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
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

    const constants = {
        dateFormatStr: "dddd, mmmm dS, yyyy, h:MM:ss TT"
    };

    const subscriber_queue = [];
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

    var contractName = "EvieCoin";
    var abi = [
    	{
    		inputs: [
    			{
    				internalType: "uint256",
    				name: "initialSupply",
    				type: "uint256"
    			}
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
    				name: "spender",
    				type: "address"
    			},
    			{
    				indexed: false,
    				internalType: "uint256",
    				name: "value",
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
    				name: "value",
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
    				indexed: false,
    				internalType: "uint256",
    				name: "value",
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
    				name: "owner",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "spender",
    				type: "address"
    			}
    		],
    		name: "allowance",
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
    				name: "spender",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "amount",
    				type: "uint256"
    			}
    		],
    		name: "approve",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "account",
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
    		],
    		name: "decimals",
    		outputs: [
    			{
    				internalType: "uint8",
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
    				internalType: "address",
    				name: "spender",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "subtractedValue",
    				type: "uint256"
    			}
    		],
    		name: "decreaseAllowance",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "spender",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "addedValue",
    				type: "uint256"
    			}
    		],
    		name: "increaseAllowance",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "nonpayable",
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
    		],
    		name: "renounceOwnership",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
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
    				name: "recipient",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "amount",
    				type: "uint256"
    			}
    		],
    		name: "transfer",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	},
    	{
    		inputs: [
    			{
    				internalType: "address",
    				name: "sender",
    				type: "address"
    			},
    			{
    				internalType: "address",
    				name: "recipient",
    				type: "address"
    			},
    			{
    				internalType: "uint256",
    				name: "amount",
    				type: "uint256"
    			}
    		],
    		name: "transferFrom",
    		outputs: [
    			{
    				internalType: "bool",
    				name: "",
    				type: "bool"
    			}
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
    		],
    		name: "clockStartTime",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
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
    			{
    				internalType: "uint256",
    				name: "amount",
    				type: "uint256"
    			}
    		],
    		name: "mint_new",
    		outputs: [
    		],
    		stateMutability: "nonpayable",
    		type: "function"
    	}
    ];
    var metadata = "{\"compiler\":{\"version\":\"0.7.0+commit.9e61f92b\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"initialSupply\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"}],\"name\":\"ClockInTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"user\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"timestamp\",\"type\":\"uint256\"}],\"name\":\"ClockOutTimeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"previousOwner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"OwnershipTransferred\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"_to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"PayoutMadeEvent\",\"type\":\"event\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockEndTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"clockStartTime\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"name\":\"clock_in_times\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"subtractedValue\",\"type\":\"uint256\"}],\"name\":\"decreaseAllowance\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"addedValue\",\"type\":\"uint256\"}],\"name\":\"increaseAllowance\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"mint_new\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"owner\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"renounceOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"newOwner\",\"type\":\"address\"}],\"name\":\"transferOwnership\",\"outputs\":[],\"stateMutability\":\"nonpayable\",\"type\":\"function\"}],\"devdoc\":{\"kind\":\"dev\",\"methods\":{\"allowance(address,address)\":{\"details\":\"See {IERC20-allowance}.\"},\"approve(address,uint256)\":{\"details\":\"See {IERC20-approve}. Requirements: - `spender` cannot be the zero address.\"},\"balanceOf(address)\":{\"details\":\"See {IERC20-balanceOf}.\"},\"clockStartTime()\":{\"details\":\"a user clocks in their start time\"},\"decimals()\":{\"details\":\"Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5,05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is called. NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}.\"},\"decreaseAllowance(address,uint256)\":{\"details\":\"Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`.\"},\"increaseAllowance(address,uint256)\":{\"details\":\"Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address.\"},\"name()\":{\"details\":\"Returns the name of the token.\"},\"owner()\":{\"details\":\"Returns the address of the current owner.\"},\"renounceOwnership()\":{\"details\":\"Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.\"},\"symbol()\":{\"details\":\"Returns the symbol of the token, usually a shorter version of the name.\"},\"totalSupply()\":{\"details\":\"See {IERC20-totalSupply}.\"},\"transfer(address,uint256)\":{\"details\":\"See {IERC20-transfer}. Requirements: - `recipient` cannot be the zero address. - the caller must have a balance of at least `amount`.\"},\"transferFrom(address,address,uint256)\":{\"details\":\"See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. Requirements: - `sender` and `recipient` cannot be the zero address. - `sender` must have a balance of at least `amount`. - the caller must have allowance for ``sender``'s tokens of at least `amount`.\"},\"transferOwnership(address)\":{\"details\":\"Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.\"}},\"stateVariables\":{\"clock_in_times\":{\"details\":\"the clock in time for an account on a given day\"},\"last_clock_in_day\":{\"details\":\"check the last clock out day for working. Used to ensure that only one clock out is done per day\"}},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":\"EvieCoin\"},\"evmVersion\":\"istanbul\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"ipfs\"},\"optimizer\":{\"enabled\":false,\"runs\":200},\"remappings\":[]},\"sources\":{\"/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol\":{\"keccak256\":\"0x32fecf0f7661233cb4b6ce678f78f886b4d2cc63da009f92b40d444458285bc3\",\"urls\":[\"bzz-raw://af546e767703a0049f0e961107969906bd29748e16b88be0e651c8cc3be19095\",\"dweb:/ipfs/QmQexTFWEQ945ZeSEkzDtoLf8QSX5exCWEz7wFUA9T45tk\"]},\"@openzeppelin/contracts/GSN/Context.sol\":{\"keccak256\":\"0x8d3cb350f04ff49cfb10aef08d87f19dcbaecc8027b0bed12f3275cd12f38cf0\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://ded47ec7c96750f9bd04bbbc84f659992d4ba901cb7b532a52cd468272cf378f\",\"dweb:/ipfs/QmfBrGtQP7rZEqEg6Wz6jh2N2Kukpj1z5v3CGWmAqrzm96\"]},\"@openzeppelin/contracts/access/Ownable.sol\":{\"keccak256\":\"0xf7c39c7e6d06ed3bda90cfefbcbf2ddc32c599c3d6721746546ad64946efccaa\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://cb57a28e189cd8b05748db44bdd51d608e6f1364dd1b35ad921e1bc82c10631e\",\"dweb:/ipfs/QmaWWTBbVu2pRR9XUbE4iC159NoP59cRF9ZJwhf4ghFN9i\"]},\"@openzeppelin/contracts/math/SafeMath.sol\":{\"keccak256\":\"0x3b21f2c8d626de3b9925ae33e972d8bf5c8b1bffb3f4ee94daeed7d0679036e6\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://7f8d45329fecbf0836ad7543330c3ecd0f8d0ffa42d4016278c3eb2215fdcdfe\",\"dweb:/ipfs/QmXWLT7GcnHtA5NiD6MFi2CV3EWJY4wv5mLNnypqYDrxL3\"]},\"@openzeppelin/contracts/token/ERC20/ERC20.sol\":{\"keccak256\":\"0xcbd85c86627a47fd939f1f4ee3ba626575ff2a182e1804b29f5136394449b538\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://53c6a80c519bb9356aad28efa9a1ec31603860eb759d2dc57f545fcae1dd1aca\",\"dweb:/ipfs/QmfRS6TtMNUHhvgLHXK21qKNnpn2S7g2Yd1fKaHKyFiJsR\"]},\"@openzeppelin/contracts/token/ERC20/IERC20.sol\":{\"keccak256\":\"0x5f02220344881ce43204ae4a6281145a67bc52c2bb1290a791857df3d19d78f5\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://24427744bd3e6cb73c17010119af12a318289c0253a4d9acb8576c9fb3797b08\",\"dweb:/ipfs/QmTLDqpKRBuxGxRAmjgXt9AkXyACW3MtKzi7PYjm5iMfGC\"]}},\"version\":1}";
    var bytecode = "0x60806040523480156200001157600080fd5b50604051620024db380380620024db833981810160405260208110156200003757600080fd5b81019080805190602001909291905050506040518060400160405280600881526020017f45766965434f494e0000000000000000000000000000000000000000000000008152506040518060400160405280600381526020017f45564500000000000000000000000000000000000000000000000000000000008152508160039080519060200190620000cc9291906200069c565b508060049080519060200190620000e59291906200069c565b506012600560006101000a81548160ff021916908360ff1602179055505050600062000116620001f660201b60201c565b905080600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508073ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350620001c633620001fe60201b60201c565b620001ef33620001db6200041960201b60201c565b60ff16600a0a83026200043060201b60201c565b5062000742565b600033905090565b6200020e620001f660201b60201c565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614620002d1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141562000359576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180620024b56026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000600560009054906101000a900460ff16905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415620004d4576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f45524332303a206d696e7420746f20746865207a65726f20616464726573730081525060200191505060405180910390fd5b620004e8600083836200060e60201b60201c565b62000504816002546200061360201b620012741790919060201c565b60028190555062000562816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546200061360201b620012741790919060201c565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b505050565b60008082840190508381101562000692576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620006df57805160ff191683800117855562000710565b8280016001018555821562000710579182015b828111156200070f578251825591602001919060010190620006f2565b5b5090506200071f919062000723565b5090565b5b808211156200073e57600081600090555060010162000724565b5090565b611d6380620007526000396000f3fe608060405234801561001057600080fd5b50600436106101165760003560e01c80638da5cb5b116100a2578063a9059cbb11610071578063a9059cbb146104de578063b939df5914610542578063db68f6121461054c578063dd62ed3e146105a4578063f2fde38b1461061c57610116565b80638da5cb5b146103b957806395d89b41146103ed578063a457c2d714610470578063a481aada146104d457610116565b8063313ce567116100e9578063313ce567146102a457806339509351146102c55780635a9ece241461032957806370a0823114610357578063715018a6146103af57610116565b806306fdde031461011b578063095ea7b31461019e57806318160ddd1461020257806323b872dd14610220575b600080fd5b610123610660565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610163578082015181840152602081019050610148565b50505050905090810190601f1680156101905780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101ea600480360360408110156101b457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610702565b60405180821515815260200191505060405180910390f35b61020a610720565b6040518082815260200191505060405180910390f35b61028c6004803603606081101561023657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061072a565b60405180821515815260200191505060405180910390f35b6102ac610803565b604051808260ff16815260200191505060405180910390f35b610311600480360360408110156102db57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061081a565b60405180821515815260200191505060405180910390f35b6103556004803603602081101561033f57600080fd5b81019080803590602001909291905050506108cd565b005b6103996004803603602081101561036d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506109ab565b6040518082815260200191505060405180910390f35b6103b76109f3565b005b6103c1610b7e565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103f5610ba8565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561043557808201518184015260208101905061041a565b50505050905090810190601f1680156104625780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6104bc6004803603604081101561048657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610c4a565b60405180821515815260200191505060405180910390f35b6104dc610d17565b005b61052a600480360360408110156104f457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610e90565b60405180821515815260200191505060405180910390f35b61054a610eae565b005b61058e6004803603602081101561056257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610fc5565b6040518082815260200191505060405180910390f35b610606600480360360408110156105ba57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610fdd565b6040518082815260200191505060405180910390f35b61065e6004803603602081101561063257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611064565b005b606060038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156106f85780601f106106cd576101008083540402835291602001916106f8565b820191906000526020600020905b8154815290600101906020018083116106db57829003601f168201915b5050505050905090565b600061071661070f6112fc565b8484611304565b6001905092915050565b6000600254905090565b60006107378484846114fb565b6107f8846107436112fc565b6107f385604051806060016040528060288152602001611c9860289139600160008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006107a96112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b611304565b600190509392505050565b6000600560009054906101000a900460ff16905090565b60006108c36108276112fc565b846108be85600160006108386112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b611304565b6001905092915050565b6108d56112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610997576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b6109a86109a2610b7e565b8261187c565b50565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6109fb6112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610abd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b6000600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060048054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610c405780601f10610c1557610100808354040283529160200191610c40565b820191906000526020600020905b815481529060010190602001808311610c2357829003601f168201915b5050505050905090565b6000610d0d610c576112fc565b84610d0885604051806060016040528060258152602001611d096025913960016000610c816112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b611304565b6001905092915050565b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16610d7f6201518042611a4390919063ffffffff16565b61ffff1611610d8d57600080fd5b42600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610de76201518042611a4390919063ffffffff16565b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b6000610ea4610e9d6112fc565b84846114fb565b6001905092915050565b6000429050600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054811015610eff57600080fd5b610e10610f54600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205483611a8d90919063ffffffff16565b11610f7457610f7333610f65610803565b60ff16600a0a600102611ad7565b5b3373ffffffffffffffffffffffffffffffffffffffff167fd6d4a83c50f8452f78f64b946692a111c56aa380e4e5f2a42deff2e69a03ba9a426040518082815260200191505060405180910390a250565b60066020528060005260406000206000915090505481565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b61106c6112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461112e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156111b4576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180611c2a6026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000808284019050838110156112f2576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141561138a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526024815260200180611ce56024913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611410576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180611c506022913960400191505060405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040518082815260200191505060405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415611581576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180611cc06025913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611607576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526023815260200180611c076023913960400191505060405180910390fd5b611612838383611b3b565b61167d81604051806060016040528060268152602001611c72602691396000808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b6000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611710816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b6000838311158290611869576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561182e578082015181840152602081019050611813565b50505050905090810190601f16801561185b5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561191f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f45524332303a206d696e7420746f20746865207a65726f20616464726573730081525060200191505060405180910390fd5b61192b60008383611b3b565b6119408160025461127490919063ffffffff16565b600281905550611997816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b6000611a8583836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250611b40565b905092915050565b6000611acf83836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506117bc565b905092915050565b611ae9611ae2610b7e565b83836114fb565b8173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b505050565b60008083118290611bec576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015611bb1578082015181840152602081019050611b96565b50505050905090810190601f168015611bde5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581611bf857fe5b04905080915050939250505056fe45524332303a207472616e7366657220746f20746865207a65726f20616464726573734f776e61626c653a206e6577206f776e657220697320746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa264697066735822122053eb51ddd48e34dc1a45fd72be9c5e01c08232df7b25efc47ead94dba94f4ff564736f6c634300070000334f776e61626c653a206e6577206f776e657220697320746865207a65726f2061646472657373";
    var deployedBytecode = "0x608060405234801561001057600080fd5b50600436106101165760003560e01c80638da5cb5b116100a2578063a9059cbb11610071578063a9059cbb146104de578063b939df5914610542578063db68f6121461054c578063dd62ed3e146105a4578063f2fde38b1461061c57610116565b80638da5cb5b146103b957806395d89b41146103ed578063a457c2d714610470578063a481aada146104d457610116565b8063313ce567116100e9578063313ce567146102a457806339509351146102c55780635a9ece241461032957806370a0823114610357578063715018a6146103af57610116565b806306fdde031461011b578063095ea7b31461019e57806318160ddd1461020257806323b872dd14610220575b600080fd5b610123610660565b6040518080602001828103825283818151815260200191508051906020019080838360005b83811015610163578082015181840152602081019050610148565b50505050905090810190601f1680156101905780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6101ea600480360360408110156101b457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610702565b60405180821515815260200191505060405180910390f35b61020a610720565b6040518082815260200191505060405180910390f35b61028c6004803603606081101561023657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061072a565b60405180821515815260200191505060405180910390f35b6102ac610803565b604051808260ff16815260200191505060405180910390f35b610311600480360360408110156102db57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019092919050505061081a565b60405180821515815260200191505060405180910390f35b6103556004803603602081101561033f57600080fd5b81019080803590602001909291905050506108cd565b005b6103996004803603602081101561036d57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506109ab565b6040518082815260200191505060405180910390f35b6103b76109f3565b005b6103c1610b7e565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6103f5610ba8565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561043557808201518184015260208101905061041a565b50505050905090810190601f1680156104625780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b6104bc6004803603604081101561048657600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610c4a565b60405180821515815260200191505060405180910390f35b6104dc610d17565b005b61052a600480360360408110156104f457600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610e90565b60405180821515815260200191505060405180910390f35b61054a610eae565b005b61058e6004803603602081101561056257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610fc5565b6040518082815260200191505060405180910390f35b610606600480360360408110156105ba57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050610fdd565b6040518082815260200191505060405180910390f35b61065e6004803603602081101561063257600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190505050611064565b005b606060038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156106f85780601f106106cd576101008083540402835291602001916106f8565b820191906000526020600020905b8154815290600101906020018083116106db57829003601f168201915b5050505050905090565b600061071661070f6112fc565b8484611304565b6001905092915050565b6000600254905090565b60006107378484846114fb565b6107f8846107436112fc565b6107f385604051806060016040528060288152602001611c9860289139600160008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006107a96112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b611304565b600190509392505050565b6000600560009054906101000a900460ff16905090565b60006108c36108276112fc565b846108be85600160006108386112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b611304565b6001905092915050565b6108d56112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610997576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b6109a86109a2610b7e565b8261187c565b50565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6109fb6112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610abd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a36000600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550565b6000600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b606060048054600181600116156101000203166002900480601f016020809104026020016040519081016040528092919081815260200182805460018160011615610100020316600290048015610c405780601f10610c1557610100808354040283529160200191610c40565b820191906000526020600020905b815481529060010190602001808311610c2357829003601f168201915b5050505050905090565b6000610d0d610c576112fc565b84610d0885604051806060016040528060258152602001611d096025913960016000610c816112fc565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b611304565b6001905092915050565b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060009054906101000a900461ffff1661ffff16610d7f6201518042611a4390919063ffffffff16565b61ffff1611610d8d57600080fd5b42600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610de76201518042611a4390919063ffffffff16565b600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060006101000a81548161ffff021916908361ffff1602179055503373ffffffffffffffffffffffffffffffffffffffff167fd43639c22edfa44378754c6d9b9b75b749d1512256727b73d99ba6f758ad2817426040518082815260200191505060405180910390a2565b6000610ea4610e9d6112fc565b84846114fb565b6001905092915050565b6000429050600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054811015610eff57600080fd5b610e10610f54600660003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205483611a8d90919063ffffffff16565b11610f7457610f7333610f65610803565b60ff16600a0a600102611ad7565b5b3373ffffffffffffffffffffffffffffffffffffffff167fd6d4a83c50f8452f78f64b946692a111c56aa380e4e5f2a42deff2e69a03ba9a426040518082815260200191505060405180910390a250565b60066020528060005260406000206000915090505481565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b61106c6112fc565b73ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461112e576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260208152602001807f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657281525060200191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156111b4576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526026815260200180611c2a6026913960400191505060405180910390fd5b8073ffffffffffffffffffffffffffffffffffffffff16600560019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a380600560016101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000808284019050838110156112f2576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601b8152602001807f536166654d6174683a206164646974696f6e206f766572666c6f77000000000081525060200191505060405180910390fd5b8091505092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16141561138a576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526024815260200180611ce56024913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611410576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526022815260200180611c506022913960400191505060405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040518082815260200191505060405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415611581576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526025815260200180611cc06025913960400191505060405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415611607576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401808060200182810382526023815260200180611c076023913960400191505060405180910390fd5b611612838383611b3b565b61167d81604051806060016040528060268152602001611c72602691396000808773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546117bc9092919063ffffffff16565b6000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550611710816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a3505050565b6000838311158290611869576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b8381101561182e578082015181840152602081019050611813565b50505050905090810190601f16801561185b5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b5060008385039050809150509392505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16141561191f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601f8152602001807f45524332303a206d696e7420746f20746865207a65726f20616464726573730081525060200191505060405180910390fd5b61192b60008383611b3b565b6119408160025461127490919063ffffffff16565b600281905550611997816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461127490919063ffffffff16565b6000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040518082815260200191505060405180910390a35050565b6000611a8583836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250611b40565b905092915050565b6000611acf83836040518060400160405280601e81526020017f536166654d6174683a207375627472616374696f6e206f766572666c6f7700008152506117bc565b905092915050565b611ae9611ae2610b7e565b83836114fb565b8173ffffffffffffffffffffffffffffffffffffffff167f206f9d86997f19b3edba08c74d5d6c53f9b51edccccfbc4b826afe94403e8594826040518082815260200191505060405180910390a25050565b505050565b60008083118290611bec576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825283818151815260200191508051906020019080838360005b83811015611bb1578082015181840152602081019050611b96565b50505050905090810190601f168015611bde5780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b506000838581611bf857fe5b04905080915050939250505056fe45524332303a207472616e7366657220746f20746865207a65726f20616464726573734f776e61626c653a206e6577206f776e657220697320746865207a65726f206164647265737345524332303a20617070726f766520746f20746865207a65726f206164647265737345524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a207472616e736665722066726f6d20746865207a65726f206164647265737345524332303a20617070726f76652066726f6d20746865207a65726f206164647265737345524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa264697066735822122053eb51ddd48e34dc1a45fd72be9c5e01c08232df7b25efc47ead94dba94f4ff564736f6c63430007000033";
    var immutableReferences = {
    };
    var sourceMap = "314:1860:0:-:0;;;897:169;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1956:145:5;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2038:5;2030;:13;;;;;;;;;;;;:::i;:::-;;2063:7;2053;:17;;;;;;;;;;;;:::i;:::-;;2092:2;2080:9;;:14;;;;;;;;;;;;;;;;;;1956:145;;882:17:3;902:12;:10;;;:12;;:::i;:::-;882:32;;933:9;924:6;;:18;;;;;;;;;;;;;;;;;;990:9;957:43;;986:1;957:43;;;;;;;;;;;;848:159;967:29:0::1;985:10;967:17;;;:29;;:::i;:::-;1006:53;1012:10;1047;:8;;;:10;;:::i;:::-;1041:16;;:2;:16;1024:13;:34;1006:5;;;:53;;:::i;:::-;897:169:::0;314:1860;;598:104:2;651:15;685:10;678:17;;598:104;:::o;2000:240:3:-;1297:12;:10;;;:12;;:::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;3068:81:5:-;3109:5;3133:9;;;;;;;;;;;3126:16;;3068:81;:::o;7790:370::-;7892:1;7873:21;;:7;:21;;;;7865:65;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7941:49;7970:1;7974:7;7983:6;7941:20;;;:49;;:::i;:::-;8016:24;8033:6;8016:12;;:16;;;;;;:24;;;;:::i;:::-;8001:12;:39;;;;8071:30;8094:6;8071:9;:18;8081:7;8071:18;;;;;;;;;;;;;;;;:22;;;;;;:30;;;;:::i;:::-;8050:9;:18;8060:7;8050:18;;;;;;;;;;;;;;;:51;;;;8137:7;8116:37;;8133:1;8116:37;;;8146:6;8116:37;;;;;;;;;;;;;;;;;;7790:370;;:::o;10651:92::-;;;;:::o;882:176:4:-;940:7;959:9;975:1;971;:5;959:17;;999:1;994;:6;;986:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1050:1;1043:8;;;882:176;;;;:::o;314:1860:0:-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;:::o;:::-;;;;;;;;;;;;;;;;;;;;;:::o;:::-;;;;;;;";
    var deployedSourceMap = "314:1860:0:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2166:81:5;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;4202:166;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;3209:98;;;:::i;:::-;;;;;;;;;;;;;;;;;;;4835:317;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;3068:81;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;5547:215;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;1925:87:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;3365:117:5;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;1706:145:3;;;:::i;:::-;;1083:77;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;2360:85:5;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;6249:266;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;1255:245:0;;;:::i;:::-;;3685:172:5;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;1552:367:0;;;:::i;:::-;;479:47;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;3915:149:5;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;;;;;;;;;;;;;;;;;;2000:240:3;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;;2166:81:5;2203:13;2235:5;2228:12;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2166:81;:::o;4202:166::-;4285:4;4301:39;4310:12;:10;:12::i;:::-;4324:7;4333:6;4301:8;:39::i;:::-;4357:4;4350:11;;4202:166;;;;:::o;3209:98::-;3262:7;3288:12;;3281:19;;3209:98;:::o;4835:317::-;4941:4;4957:36;4967:6;4975:9;4986:6;4957:9;:36::i;:::-;5003:121;5012:6;5020:12;:10;:12::i;:::-;5034:89;5072:6;5034:89;;;;;;;;;;;;;;;;;:11;:19;5046:6;5034:19;;;;;;;;;;;;;;;:33;5054:12;:10;:12::i;:::-;5034:33;;;;;;;;;;;;;;;;:37;;:89;;;;;:::i;:::-;5003:8;:121::i;:::-;5141:4;5134:11;;4835:317;;;;;:::o;3068:81::-;3109:5;3133:9;;;;;;;;;;;3126:16;;3068:81;:::o;5547:215::-;5635:4;5651:83;5660:12;:10;:12::i;:::-;5674:7;5683:50;5722:10;5683:11;:25;5695:12;:10;:12::i;:::-;5683:25;;;;;;;;;;;;;;;:34;5709:7;5683:34;;;;;;;;;;;;;;;;:38;;:50;;;;:::i;:::-;5651:8;:83::i;:::-;5751:4;5744:11;;5547:215;;;;:::o;1925:87:0:-;1297:12:3;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1983:22:0::1;1989:7;:5;:7::i;:::-;1998:6;1983:5;:22::i;:::-;1925:87:::0;:::o;3365:117:5:-;3431:7;3457:9;:18;3467:7;3457:18;;;;;;;;;;;;;;;;3450:25;;3365:117;;;:::o;1706:145:3:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1812:1:::1;1775:40;;1796:6;;;;;;;;;;;1775:40;;;;;;;;;;;;1842:1;1825:6;;:19;;;;;;;;;;;;;;;;;;1706:145::o:0;1083:77::-;1121:7;1147:6;;;;;;;;;;;1140:13;;1083:77;:::o;2360:85:5:-;2399:13;2431:7;2424:14;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2360:85;:::o;6249:266::-;6342:4;6358:129;6367:12;:10;:12::i;:::-;6381:7;6390:96;6429:15;6390:96;;;;;;;;;;;;;;;;;:11;:25;6402:12;:10;:12::i;:::-;6390:25;;;;;;;;;;;;;;;:34;6416:7;6390:34;;;;;;;;;;;;;;;;:38;;:96;;;;;:::i;:::-;6358:8;:129::i;:::-;6504:4;6497:11;;6249:266;;;;:::o;1255:245:0:-;1154:17;:29;1172:10;1154:29;;;;;;;;;;;;;;;;;;;;;;;;;1115:68;;1122:27;1142:6;1122:15;:19;;:27;;;;:::i;:::-;1115:68;;;1107:77;;;;;;1341:15:::1;1312:14;:26;1327:10;1312:26;;;;;;;;;;;;;;;:44;;;;1405:27;1425:6;1405:15;:19;;:27;;;;:::i;:::-;1366:17;:29;1384:10;1366:29;;;;;;;;;;;;;;;;:67;;;;;;;;;;;;;;;;;;1465:10;1448:45;;;1477:15;1448:45;;;;;;;;;;;;;;;;;;1255:245::o:0;3685:172:5:-;3771:4;3787:42;3797:12;:10;:12::i;:::-;3811:9;3822:6;3787:9;:42::i;:::-;3846:4;3839:11;;3685:172;;;;:::o;1552:367:0:-;1593:13;1609:15;1593:31;;1654:14;:26;1669:10;1654:26;;;;;;;;;;;;;;;;1642:8;:38;;1634:47;;;;;;1739:7;1695:40;1708:14;:26;1723:10;1708:26;;;;;;;;;;;;;;;;1695:8;:12;;:40;;;;:::i;:::-;:51;1691:161;;1798:43;1806:10;1829;:8;:10::i;:::-;1823:16;;:2;:16;1818:1;:22;1798:7;:43::i;:::-;1691:161;1884:10;1866:46;;;1896:15;1866:46;;;;;;;;;;;;;;;;;;1552:367;:::o;479:47::-;;;;;;;;;;;;;;;;;:::o;3915:149:5:-;4004:7;4030:11;:18;4042:5;4030:18;;;;;;;;;;;;;;;:27;4049:7;4030:27;;;;;;;;;;;;;;;;4023:34;;3915:149;;;;:::o;2000:240:3:-;1297:12;:10;:12::i;:::-;1287:22;;:6;;;;;;;;;;;:22;;;1279:67;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2108:1:::1;2088:22;;:8;:22;;;;2080:73;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;2197:8;2168:38;;2189:6;;;;;;;;;;;2168:38;;;;;;;;;;;;2225:8;2216:6;;:17;;;;;;;;;;;;;;;;;;2000:240:::0;:::o;882:176:4:-;940:7;959:9;975:1;971;:5;959:17;;999:1;994;:6;;986:46;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1050:1;1043:8;;;882:176;;;;:::o;598:104:2:-;651:15;685:10;678:17;;598:104;:::o;9313:340:5:-;9431:1;9414:19;;:5;:19;;;;9406:68;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;9511:1;9492:21;;:7;:21;;;;9484:68;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;9593:6;9563:11;:18;9575:5;9563:18;;;;;;;;;;;;;;;:27;9582:7;9563:27;;;;;;;;;;;;;;;:36;;;;9630:7;9614:32;;9623:5;9614:32;;;9639:6;9614:32;;;;;;;;;;;;;;;;;;9313:340;;;:::o;6989:530::-;7112:1;7094:20;;:6;:20;;;;7086:70;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7195:1;7174:23;;:9;:23;;;;7166:71;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7248:47;7269:6;7277:9;7288:6;7248:20;:47::i;:::-;7326:71;7348:6;7326:71;;;;;;;;;;;;;;;;;:9;:17;7336:6;7326:17;;;;;;;;;;;;;;;;:21;;:71;;;;;:::i;:::-;7306:9;:17;7316:6;7306:17;;;;;;;;;;;;;;;:91;;;;7430:32;7455:6;7430:9;:20;7440:9;7430:20;;;;;;;;;;;;;;;;:24;;:32;;;;:::i;:::-;7407:9;:20;7417:9;7407:20;;;;;;;;;;;;;;;:55;;;;7494:9;7477:35;;7486:6;7477:35;;;7505:6;7477:35;;;;;;;;;;;;;;;;;;6989:530;;;:::o;1754:187:4:-;1840:7;1872:1;1867;:6;;1875:12;1859:29;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;1898:9;1914:1;1910;:5;1898:17;;1933:1;1926:8;;;1754:187;;;;;:::o;7790:370:5:-;7892:1;7873:21;;:7;:21;;;;7865:65;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;7941:49;7970:1;7974:7;7983:6;7941:20;:49::i;:::-;8016:24;8033:6;8016:12;;:16;;:24;;;;:::i;:::-;8001:12;:39;;;;8071:30;8094:6;8071:9;:18;8081:7;8071:18;;;;;;;;;;;;;;;;:22;;:30;;;;:::i;:::-;8050:9;:18;8060:7;8050:18;;;;;;;;;;;;;;;:51;;;;8137:7;8116:37;;8133:1;8116:37;;;8146:6;8116:37;;;;;;;;;;;;;;;;;;7790:370;;:::o;3109:130:4:-;3167:7;3193:39;3197:1;3200;3193:39;;;;;;;;;;;;;;;;;:3;:39::i;:::-;3186:46;;3109:130;;;;:::o;1329:134::-;1387:7;1413:43;1417:1;1420;1413:43;;;;;;;;;;;;;;;;;:3;:43::i;:::-;1406:50;;1329:134;;;;:::o;2018:154:0:-;2083:35;2093:7;:5;:7::i;:::-;2102:3;2107:10;2083:9;:35::i;:::-;2149:3;2133:32;;;2154:10;2133:32;;;;;;;;;;;;;;;;;;2018:154;;:::o;10651:92:5:-;;;;:::o;3721:272:4:-;3807:7;3838:1;3834;:5;3841:12;3826:28;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;3864:9;3880:1;3876;:5;;;;;;3864:17;;3985:1;3978:8;;;3721:272;;;;;:::o";
    var source = "pragma solidity ^0.7.0;\n\nimport \"@openzeppelin/contracts/token/ERC20/ERC20.sol\";\nimport \"@openzeppelin/contracts/access/Ownable.sol\";\nimport \"@openzeppelin/contracts/math/SafeMath.sol\";\n\n\n// TODO: add an event emit for start time which is listened to on the front end. \n// TODO: find way to incroperate an oracle\n\ncontract EvieCoin is ERC20, Ownable {\n    using SafeMath for uint256;\n    using SafeMath for uint;\n\n    /// @dev the clock in time for an account on a given day\n    mapping (address => uint) public clock_in_times;\n\n    /// @dev check the last clock out day for working. Used to ensure that only one clock out is done per day\n    mapping (address => uint16) private last_clock_in_day;\n\n    event PayoutMadeEvent(address indexed _to, uint value);\n    event ClockInTimeEvent(address indexed user, uint timestamp);\n    event ClockOutTimeEvent(address indexed user, uint timestamp);\n\n    constructor(uint256 initialSupply) ERC20(\"EvieCOIN\", \"EVE\") {\n        transferOwnership(msg.sender);\n        _mint(msg.sender, initialSupply * (10 ** decimals()));\n    }\n\n    modifier _once_per_day() {\n        require(uint16(block.timestamp.div(1 days)) >  last_clock_in_day[msg.sender]);\n        _;\n    }\n\n    /// @dev a user clocks in their start time\n    function clockStartTime() public _once_per_day {\n        clock_in_times[msg.sender] = block.timestamp;\n        last_clock_in_day[msg.sender] = uint16(block.timestamp.div(1 days));\n        emit ClockInTimeEvent(msg.sender, block.timestamp);\n    }\n\n    // Not exact, it is off by a few minutes?\n    function clockEndTime() public {\n        uint end_time = block.timestamp;\n        require(end_time >= clock_in_times[msg.sender]);\n        if (end_time.sub(clock_in_times[msg.sender]) <= 1 hours) {\n            // Payout one full coin\n            _payout(msg.sender, 1 * (10 ** decimals()));\n        }\n        emit ClockOutTimeEvent(msg.sender, block.timestamp);\n    }\n\n    function mint_new(uint amount) public onlyOwner {\n        _mint(owner(), amount);\n    }\n\n    function _payout(address _to, uint reward_val) private {\n        _transfer(owner(), _to, reward_val);\n        emit PayoutMadeEvent(_to, reward_val);\n    }\n}\n";
    var sourcePath = "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol";
    var ast = {
    	absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    	exportedSymbols: {
    		EvieCoin: [
    			208
    		]
    	},
    	id: 209,
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
    			scope: 209,
    			sourceUnit: 1097,
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
    			scope: 209,
    			sourceUnit: 398,
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
    			scope: 209,
    			sourceUnit: 594,
    			src: "134:51:0",
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
    						id: 5,
    						name: "ERC20",
    						nodeType: "UserDefinedTypeName",
    						referencedDeclaration: 1096,
    						src: "335:5:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_ERC20_$1096",
    							typeString: "contract ERC20"
    						}
    					},
    					id: 6,
    					nodeType: "InheritanceSpecifier",
    					src: "335:5:0"
    				},
    				{
    					"arguments": null,
    					baseName: {
    						contractScope: null,
    						id: 7,
    						name: "Ownable",
    						nodeType: "UserDefinedTypeName",
    						referencedDeclaration: 397,
    						src: "342:7:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_Ownable_$397",
    							typeString: "contract Ownable"
    						}
    					},
    					id: 8,
    					nodeType: "InheritanceSpecifier",
    					src: "342:7:0"
    				}
    			],
    			contractDependencies: [
    				288,
    				397,
    				1096,
    				1174
    			],
    			contractKind: "contract",
    			documentation: null,
    			fullyImplemented: true,
    			id: 208,
    			linearizedBaseContracts: [
    				208,
    				397,
    				1096,
    				1174,
    				288
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
    						referencedDeclaration: 593,
    						src: "362:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$593",
    							typeString: "library SafeMath"
    						}
    					},
    					nodeType: "UsingForDirective",
    					src: "356:27:0",
    					typeName: {
    						id: 10,
    						name: "uint256",
    						nodeType: "ElementaryTypeName",
    						src: "375:7:0",
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
    						referencedDeclaration: 593,
    						src: "394:8:0",
    						typeDescriptions: {
    							typeIdentifier: "t_contract$_SafeMath_$593",
    							typeString: "library SafeMath"
    						}
    					},
    					nodeType: "UsingForDirective",
    					src: "388:24:0",
    					typeName: {
    						id: 13,
    						name: "uint",
    						nodeType: "ElementaryTypeName",
    						src: "407:4:0",
    						typeDescriptions: {
    							typeIdentifier: "t_uint256",
    							typeString: "uint256"
    						}
    					}
    				},
    				{
    					constant: false,
    					documentation: {
    						id: 15,
    						nodeType: "StructuredDocumentation",
    						src: "418:56:0",
    						text: "@dev the clock in time for an account on a given day"
    					},
    					functionSelector: "db68f612",
    					id: 19,
    					mutability: "mutable",
    					name: "clock_in_times",
    					nodeType: "VariableDeclaration",
    					overrides: null,
    					scope: 208,
    					src: "479:47:0",
    					stateVariable: true,
    					storageLocation: "default",
    					typeDescriptions: {
    						typeIdentifier: "t_mapping$_t_address_$_t_uint256_$",
    						typeString: "mapping(address => uint256)"
    					},
    					typeName: {
    						id: 18,
    						keyType: {
    							id: 16,
    							name: "address",
    							nodeType: "ElementaryTypeName",
    							src: "488:7:0",
    							typeDescriptions: {
    								typeIdentifier: "t_address",
    								typeString: "address"
    							}
    						},
    						nodeType: "Mapping",
    						src: "479:25:0",
    						typeDescriptions: {
    							typeIdentifier: "t_mapping$_t_address_$_t_uint256_$",
    							typeString: "mapping(address => uint256)"
    						},
    						valueType: {
    							id: 17,
    							name: "uint",
    							nodeType: "ElementaryTypeName",
    							src: "499:4:0",
    							typeDescriptions: {
    								typeIdentifier: "t_uint256",
    								typeString: "uint256"
    							}
    						}
    					},
    					value: null,
    					visibility: "public"
    				},
    				{
    					constant: false,
    					documentation: {
    						id: 20,
    						nodeType: "StructuredDocumentation",
    						src: "533:105:0",
    						text: "@dev check the last clock out day for working. Used to ensure that only one clock out is done per day"
    					},
    					id: 24,
    					mutability: "mutable",
    					name: "last_clock_in_day",
    					nodeType: "VariableDeclaration",
    					overrides: null,
    					scope: 208,
    					src: "643:53:0",
    					stateVariable: true,
    					storageLocation: "default",
    					typeDescriptions: {
    						typeIdentifier: "t_mapping$_t_address_$_t_uint16_$",
    						typeString: "mapping(address => uint16)"
    					},
    					typeName: {
    						id: 23,
    						keyType: {
    							id: 21,
    							name: "address",
    							nodeType: "ElementaryTypeName",
    							src: "652:7:0",
    							typeDescriptions: {
    								typeIdentifier: "t_address",
    								typeString: "address"
    							}
    						},
    						nodeType: "Mapping",
    						src: "643:27:0",
    						typeDescriptions: {
    							typeIdentifier: "t_mapping$_t_address_$_t_uint16_$",
    							typeString: "mapping(address => uint16)"
    						},
    						valueType: {
    							id: 22,
    							name: "uint16",
    							nodeType: "ElementaryTypeName",
    							src: "663:6:0",
    							typeDescriptions: {
    								typeIdentifier: "t_uint16",
    								typeString: "uint16"
    							}
    						}
    					},
    					value: null,
    					visibility: "private"
    				},
    				{
    					anonymous: false,
    					documentation: null,
    					id: 30,
    					name: "PayoutMadeEvent",
    					nodeType: "EventDefinition",
    					parameters: {
    						id: 29,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 26,
    								indexed: true,
    								mutability: "mutable",
    								name: "_to",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 30,
    								src: "725:19:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 25,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "725:7:0",
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
    								id: 28,
    								indexed: false,
    								mutability: "mutable",
    								name: "value",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 30,
    								src: "746:10:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 27,
    									name: "uint",
    									nodeType: "ElementaryTypeName",
    									src: "746:4:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "724:33:0"
    					},
    					src: "703:55:0"
    				},
    				{
    					anonymous: false,
    					documentation: null,
    					id: 36,
    					name: "ClockInTimeEvent",
    					nodeType: "EventDefinition",
    					parameters: {
    						id: 35,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 32,
    								indexed: true,
    								mutability: "mutable",
    								name: "user",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 36,
    								src: "786:20:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 31,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "786:7:0",
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
    								id: 34,
    								indexed: false,
    								mutability: "mutable",
    								name: "timestamp",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 36,
    								src: "808:14:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 33,
    									name: "uint",
    									nodeType: "ElementaryTypeName",
    									src: "808:4:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "785:38:0"
    					},
    					src: "763:61:0"
    				},
    				{
    					anonymous: false,
    					documentation: null,
    					id: 42,
    					name: "ClockOutTimeEvent",
    					nodeType: "EventDefinition",
    					parameters: {
    						id: 41,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 38,
    								indexed: true,
    								mutability: "mutable",
    								name: "user",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 42,
    								src: "853:20:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 37,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "853:7:0",
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
    								id: 40,
    								indexed: false,
    								mutability: "mutable",
    								name: "timestamp",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 42,
    								src: "875:14:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 39,
    									name: "uint",
    									nodeType: "ElementaryTypeName",
    									src: "875:4:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "852:38:0"
    					},
    					src: "829:62:0"
    				},
    				{
    					body: {
    						id: 68,
    						nodeType: "Block",
    						src: "957:109:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 52,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "985:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 53,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "985:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										],
    										id: 51,
    										name: "transferOwnership",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 396,
    										src: "967:17:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$returns$__$",
    											typeString: "function (address)"
    										}
    									},
    									id: 54,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "967:29:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 55,
    								nodeType: "ExpressionStatement",
    								src: "967:29:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 57,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "1012:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 58,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1012:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										},
    										{
    											argumentTypes: null,
    											commonType: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											},
    											id: 65,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											leftExpression: {
    												argumentTypes: null,
    												id: 59,
    												name: "initialSupply",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 44,
    												src: "1024:13:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											nodeType: "BinaryOperation",
    											operator: "*",
    											rightExpression: {
    												argumentTypes: null,
    												components: [
    													{
    														argumentTypes: null,
    														commonType: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														},
    														id: 63,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														leftExpression: {
    															argumentTypes: null,
    															hexValue: "3130",
    															id: 60,
    															isConstant: false,
    															isLValue: false,
    															isPure: true,
    															kind: "number",
    															lValueRequested: false,
    															nodeType: "Literal",
    															src: "1041:2:0",
    															subdenomination: null,
    															typeDescriptions: {
    																typeIdentifier: "t_rational_10_by_1",
    																typeString: "int_const 10"
    															},
    															value: "10"
    														},
    														nodeType: "BinaryOperation",
    														operator: "**",
    														rightExpression: {
    															argumentTypes: null,
    															"arguments": [
    															],
    															expression: {
    																argumentTypes: [
    																],
    																id: 61,
    																name: "decimals",
    																nodeType: "Identifier",
    																overloadedDeclarations: [
    																],
    																referencedDeclaration: 672,
    																src: "1047:8:0",
    																typeDescriptions: {
    																	typeIdentifier: "t_function_internal_view$__$returns$_t_uint8_$",
    																	typeString: "function () view returns (uint8)"
    																}
    															},
    															id: 62,
    															isConstant: false,
    															isLValue: false,
    															isPure: false,
    															kind: "functionCall",
    															lValueRequested: false,
    															names: [
    															],
    															nodeType: "FunctionCall",
    															src: "1047:10:0",
    															tryCall: false,
    															typeDescriptions: {
    																typeIdentifier: "t_uint8",
    																typeString: "uint8"
    															}
    														},
    														src: "1041:16:0",
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													}
    												],
    												id: 64,
    												isConstant: false,
    												isInlineArray: false,
    												isLValue: false,
    												isPure: false,
    												lValueRequested: false,
    												nodeType: "TupleExpression",
    												src: "1040:18:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											src: "1024:34:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 56,
    										name: "_mint",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 972,
    										src: "1006:5:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 66,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1006:53:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 67,
    								nodeType: "ExpressionStatement",
    								src: "1006:53:0"
    							}
    						]
    					},
    					documentation: null,
    					id: 69,
    					implemented: true,
    					kind: "constructor",
    					modifiers: [
    						{
    							"arguments": [
    								{
    									argumentTypes: null,
    									hexValue: "45766965434f494e",
    									id: 47,
    									isConstant: false,
    									isLValue: false,
    									isPure: true,
    									kind: "string",
    									lValueRequested: false,
    									nodeType: "Literal",
    									src: "938:10:0",
    									subdenomination: null,
    									typeDescriptions: {
    										typeIdentifier: "t_stringliteral_a380435aae1dd9717e07f6cdd6e0c710f1e343a25de61444c2b974b3094ba707",
    										typeString: "literal_string \"EvieCOIN\""
    									},
    									value: "EvieCOIN"
    								},
    								{
    									argumentTypes: null,
    									hexValue: "455645",
    									id: 48,
    									isConstant: false,
    									isLValue: false,
    									isPure: true,
    									kind: "string",
    									lValueRequested: false,
    									nodeType: "Literal",
    									src: "950:5:0",
    									subdenomination: null,
    									typeDescriptions: {
    										typeIdentifier: "t_stringliteral_af94fe894bf0e22494392493fc7eb18a0ab98754fe785e74fd233f476b9c37c9",
    										typeString: "literal_string \"EVE\""
    									},
    									value: "EVE"
    								}
    							],
    							id: 49,
    							modifierName: {
    								argumentTypes: null,
    								id: 46,
    								name: "ERC20",
    								nodeType: "Identifier",
    								overloadedDeclarations: [
    								],
    								referencedDeclaration: 1096,
    								src: "932:5:0",
    								typeDescriptions: {
    									typeIdentifier: "t_type$_t_contract$_ERC20_$1096_$",
    									typeString: "type(contract ERC20)"
    								}
    							},
    							nodeType: "ModifierInvocation",
    							src: "932:24:0"
    						}
    					],
    					name: "",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 45,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 44,
    								mutability: "mutable",
    								name: "initialSupply",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 69,
    								src: "909:21:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 43,
    									name: "uint256",
    									nodeType: "ElementaryTypeName",
    									src: "909:7:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "908:23:0"
    					},
    					returnParameters: {
    						id: 50,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "957:0:0"
    					},
    					scope: 208,
    					src: "897:169:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 88,
    						nodeType: "Block",
    						src: "1097:105:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											commonType: {
    												typeIdentifier: "t_uint16",
    												typeString: "uint16"
    											},
    											id: 84,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											leftExpression: {
    												argumentTypes: null,
    												"arguments": [
    													{
    														argumentTypes: null,
    														"arguments": [
    															{
    																argumentTypes: null,
    																hexValue: "31",
    																id: 77,
    																isConstant: false,
    																isLValue: false,
    																isPure: true,
    																kind: "number",
    																lValueRequested: false,
    																nodeType: "Literal",
    																src: "1142:6:0",
    																subdenomination: "days",
    																typeDescriptions: {
    																	typeIdentifier: "t_rational_86400_by_1",
    																	typeString: "int_const 86400"
    																},
    																value: "1"
    															}
    														],
    														expression: {
    															argumentTypes: [
    																{
    																	typeIdentifier: "t_rational_86400_by_1",
    																	typeString: "int_const 86400"
    																}
    															],
    															expression: {
    																argumentTypes: null,
    																expression: {
    																	argumentTypes: null,
    																	id: 74,
    																	name: "block",
    																	nodeType: "Identifier",
    																	overloadedDeclarations: [
    																	],
    																	referencedDeclaration: -4,
    																	src: "1122:5:0",
    																	typeDescriptions: {
    																		typeIdentifier: "t_magic_block",
    																		typeString: "block"
    																	}
    																},
    																id: 75,
    																isConstant: false,
    																isLValue: false,
    																isPure: false,
    																lValueRequested: false,
    																memberName: "timestamp",
    																nodeType: "MemberAccess",
    																referencedDeclaration: null,
    																src: "1122:15:0",
    																typeDescriptions: {
    																	typeIdentifier: "t_uint256",
    																	typeString: "uint256"
    																}
    															},
    															id: 76,
    															isConstant: false,
    															isLValue: false,
    															isPure: false,
    															lValueRequested: false,
    															memberName: "div",
    															nodeType: "MemberAccess",
    															referencedDeclaration: 523,
    															src: "1122:19:0",
    															typeDescriptions: {
    																typeIdentifier: "t_function_internal_pure$_t_uint256_$_t_uint256_$returns$_t_uint256_$bound_to$_t_uint256_$",
    																typeString: "function (uint256,uint256) pure returns (uint256)"
    															}
    														},
    														id: 78,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														kind: "functionCall",
    														lValueRequested: false,
    														names: [
    														],
    														nodeType: "FunctionCall",
    														src: "1122:27:0",
    														tryCall: false,
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													}
    												],
    												expression: {
    													argumentTypes: [
    														{
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													],
    													id: 73,
    													isConstant: false,
    													isLValue: false,
    													isPure: true,
    													lValueRequested: false,
    													nodeType: "ElementaryTypeNameExpression",
    													src: "1115:6:0",
    													typeDescriptions: {
    														typeIdentifier: "t_type$_t_uint16_$",
    														typeString: "type(uint16)"
    													},
    													typeName: {
    														id: 72,
    														name: "uint16",
    														nodeType: "ElementaryTypeName",
    														src: "1115:6:0",
    														typeDescriptions: {
    															typeIdentifier: null,
    															typeString: null
    														}
    													}
    												},
    												id: 79,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												kind: "typeConversion",
    												lValueRequested: false,
    												names: [
    												],
    												nodeType: "FunctionCall",
    												src: "1115:35:0",
    												tryCall: false,
    												typeDescriptions: {
    													typeIdentifier: "t_uint16",
    													typeString: "uint16"
    												}
    											},
    											nodeType: "BinaryOperation",
    											operator: ">",
    											rightExpression: {
    												argumentTypes: null,
    												baseExpression: {
    													argumentTypes: null,
    													id: 80,
    													name: "last_clock_in_day",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 24,
    													src: "1154:17:0",
    													typeDescriptions: {
    														typeIdentifier: "t_mapping$_t_address_$_t_uint16_$",
    														typeString: "mapping(address => uint16)"
    													}
    												},
    												id: 83,
    												indexExpression: {
    													argumentTypes: null,
    													expression: {
    														argumentTypes: null,
    														id: 81,
    														name: "msg",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: -15,
    														src: "1172:3:0",
    														typeDescriptions: {
    															typeIdentifier: "t_magic_message",
    															typeString: "msg"
    														}
    													},
    													id: 82,
    													isConstant: false,
    													isLValue: false,
    													isPure: false,
    													lValueRequested: false,
    													memberName: "sender",
    													nodeType: "MemberAccess",
    													referencedDeclaration: null,
    													src: "1172:10:0",
    													typeDescriptions: {
    														typeIdentifier: "t_address_payable",
    														typeString: "address payable"
    													}
    												},
    												isConstant: false,
    												isLValue: true,
    												isPure: false,
    												lValueRequested: false,
    												nodeType: "IndexAccess",
    												src: "1154:29:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint16",
    													typeString: "uint16"
    												}
    											},
    											src: "1115:68:0",
    											typeDescriptions: {
    												typeIdentifier: "t_bool",
    												typeString: "bool"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_bool",
    												typeString: "bool"
    											}
    										],
    										id: 71,
    										name: "require",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    											-18,
    											-18
    										],
    										referencedDeclaration: -18,
    										src: "1107:7:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_require_pure$_t_bool_$returns$__$",
    											typeString: "function (bool) pure"
    										}
    									},
    									id: 85,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1107:77:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 86,
    								nodeType: "ExpressionStatement",
    								src: "1107:77:0"
    							},
    							{
    								id: 87,
    								nodeType: "PlaceholderStatement",
    								src: "1194:1:0"
    							}
    						]
    					},
    					documentation: null,
    					id: 89,
    					name: "_once_per_day",
    					nodeType: "ModifierDefinition",
    					overrides: null,
    					parameters: {
    						id: 70,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1094:2:0"
    					},
    					src: "1072:130:0",
    					virtual: false,
    					visibility: "internal"
    				},
    				{
    					body: {
    						id: 124,
    						nodeType: "Block",
    						src: "1302:198:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									id: 101,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									leftHandSide: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 95,
    											name: "clock_in_times",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 19,
    											src: "1312:14:0",
    											typeDescriptions: {
    												typeIdentifier: "t_mapping$_t_address_$_t_uint256_$",
    												typeString: "mapping(address => uint256)"
    											}
    										},
    										id: 98,
    										indexExpression: {
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 96,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "1327:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 97,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1327:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										},
    										isConstant: false,
    										isLValue: true,
    										isPure: false,
    										lValueRequested: true,
    										nodeType: "IndexAccess",
    										src: "1312:26:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									nodeType: "Assignment",
    									operator: "=",
    									rightHandSide: {
    										argumentTypes: null,
    										expression: {
    											argumentTypes: null,
    											id: 99,
    											name: "block",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: -4,
    											src: "1341:5:0",
    											typeDescriptions: {
    												typeIdentifier: "t_magic_block",
    												typeString: "block"
    											}
    										},
    										id: 100,
    										isConstant: false,
    										isLValue: false,
    										isPure: false,
    										lValueRequested: false,
    										memberName: "timestamp",
    										nodeType: "MemberAccess",
    										referencedDeclaration: null,
    										src: "1341:15:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									src: "1312:44:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								id: 102,
    								nodeType: "ExpressionStatement",
    								src: "1312:44:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									id: 115,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									leftHandSide: {
    										argumentTypes: null,
    										baseExpression: {
    											argumentTypes: null,
    											id: 103,
    											name: "last_clock_in_day",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 24,
    											src: "1366:17:0",
    											typeDescriptions: {
    												typeIdentifier: "t_mapping$_t_address_$_t_uint16_$",
    												typeString: "mapping(address => uint16)"
    											}
    										},
    										id: 106,
    										indexExpression: {
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 104,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "1384:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 105,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1384:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										},
    										isConstant: false,
    										isLValue: true,
    										isPure: false,
    										lValueRequested: true,
    										nodeType: "IndexAccess",
    										src: "1366:29:0",
    										typeDescriptions: {
    											typeIdentifier: "t_uint16",
    											typeString: "uint16"
    										}
    									},
    									nodeType: "Assignment",
    									operator: "=",
    									rightHandSide: {
    										argumentTypes: null,
    										"arguments": [
    											{
    												argumentTypes: null,
    												"arguments": [
    													{
    														argumentTypes: null,
    														hexValue: "31",
    														id: 112,
    														isConstant: false,
    														isLValue: false,
    														isPure: true,
    														kind: "number",
    														lValueRequested: false,
    														nodeType: "Literal",
    														src: "1425:6:0",
    														subdenomination: "days",
    														typeDescriptions: {
    															typeIdentifier: "t_rational_86400_by_1",
    															typeString: "int_const 86400"
    														},
    														value: "1"
    													}
    												],
    												expression: {
    													argumentTypes: [
    														{
    															typeIdentifier: "t_rational_86400_by_1",
    															typeString: "int_const 86400"
    														}
    													],
    													expression: {
    														argumentTypes: null,
    														expression: {
    															argumentTypes: null,
    															id: 109,
    															name: "block",
    															nodeType: "Identifier",
    															overloadedDeclarations: [
    															],
    															referencedDeclaration: -4,
    															src: "1405:5:0",
    															typeDescriptions: {
    																typeIdentifier: "t_magic_block",
    																typeString: "block"
    															}
    														},
    														id: 110,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														memberName: "timestamp",
    														nodeType: "MemberAccess",
    														referencedDeclaration: null,
    														src: "1405:15:0",
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													},
    													id: 111,
    													isConstant: false,
    													isLValue: false,
    													isPure: false,
    													lValueRequested: false,
    													memberName: "div",
    													nodeType: "MemberAccess",
    													referencedDeclaration: 523,
    													src: "1405:19:0",
    													typeDescriptions: {
    														typeIdentifier: "t_function_internal_pure$_t_uint256_$_t_uint256_$returns$_t_uint256_$bound_to$_t_uint256_$",
    														typeString: "function (uint256,uint256) pure returns (uint256)"
    													}
    												},
    												id: 113,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												kind: "functionCall",
    												lValueRequested: false,
    												names: [
    												],
    												nodeType: "FunctionCall",
    												src: "1405:27:0",
    												tryCall: false,
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											}
    										],
    										expression: {
    											argumentTypes: [
    												{
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											],
    											id: 108,
    											isConstant: false,
    											isLValue: false,
    											isPure: true,
    											lValueRequested: false,
    											nodeType: "ElementaryTypeNameExpression",
    											src: "1398:6:0",
    											typeDescriptions: {
    												typeIdentifier: "t_type$_t_uint16_$",
    												typeString: "type(uint16)"
    											},
    											typeName: {
    												id: 107,
    												name: "uint16",
    												nodeType: "ElementaryTypeName",
    												src: "1398:6:0",
    												typeDescriptions: {
    													typeIdentifier: null,
    													typeString: null
    												}
    											}
    										},
    										id: 114,
    										isConstant: false,
    										isLValue: false,
    										isPure: false,
    										kind: "typeConversion",
    										lValueRequested: false,
    										names: [
    										],
    										nodeType: "FunctionCall",
    										src: "1398:35:0",
    										tryCall: false,
    										typeDescriptions: {
    											typeIdentifier: "t_uint16",
    											typeString: "uint16"
    										}
    									},
    									src: "1366:67:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint16",
    										typeString: "uint16"
    									}
    								},
    								id: 116,
    								nodeType: "ExpressionStatement",
    								src: "1366:67:0"
    							},
    							{
    								eventCall: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 118,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "1465:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 119,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1465:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										},
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 120,
    												name: "block",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -4,
    												src: "1477:5:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_block",
    													typeString: "block"
    												}
    											},
    											id: 121,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "timestamp",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1477:15:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 117,
    										name: "ClockInTimeEvent",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 36,
    										src: "1448:16:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_event_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 122,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1448:45:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 123,
    								nodeType: "EmitStatement",
    								src: "1443:50:0"
    							}
    						]
    					},
    					documentation: {
    						id: 90,
    						nodeType: "StructuredDocumentation",
    						src: "1208:42:0",
    						text: "@dev a user clocks in their start time"
    					},
    					functionSelector: "a481aada",
    					id: 125,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    						{
    							"arguments": null,
    							id: 93,
    							modifierName: {
    								argumentTypes: null,
    								id: 92,
    								name: "_once_per_day",
    								nodeType: "Identifier",
    								overloadedDeclarations: [
    								],
    								referencedDeclaration: 89,
    								src: "1288:13:0",
    								typeDescriptions: {
    									typeIdentifier: "t_modifier$__$",
    									typeString: "modifier ()"
    								}
    							},
    							nodeType: "ModifierInvocation",
    							src: "1288:13:0"
    						}
    					],
    					name: "clockStartTime",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 91,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1278:2:0"
    					},
    					returnParameters: {
    						id: 94,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1302:0:0"
    					},
    					scope: 208,
    					src: "1255:245:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 172,
    						nodeType: "Block",
    						src: "1583:336:0",
    						statements: [
    							{
    								assignments: [
    									129
    								],
    								declarations: [
    									{
    										constant: false,
    										id: 129,
    										mutability: "mutable",
    										name: "end_time",
    										nodeType: "VariableDeclaration",
    										overrides: null,
    										scope: 172,
    										src: "1593:13:0",
    										stateVariable: false,
    										storageLocation: "default",
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										},
    										typeName: {
    											id: 128,
    											name: "uint",
    											nodeType: "ElementaryTypeName",
    											src: "1593:4:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										},
    										value: null,
    										visibility: "internal"
    									}
    								],
    								id: 132,
    								initialValue: {
    									argumentTypes: null,
    									expression: {
    										argumentTypes: null,
    										id: 130,
    										name: "block",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: -4,
    										src: "1609:5:0",
    										typeDescriptions: {
    											typeIdentifier: "t_magic_block",
    											typeString: "block"
    										}
    									},
    									id: 131,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									memberName: "timestamp",
    									nodeType: "MemberAccess",
    									referencedDeclaration: null,
    									src: "1609:15:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								nodeType: "VariableDeclarationStatement",
    								src: "1593:31:0"
    							},
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											commonType: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											},
    											id: 139,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											leftExpression: {
    												argumentTypes: null,
    												id: 134,
    												name: "end_time",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 129,
    												src: "1642:8:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											nodeType: "BinaryOperation",
    											operator: ">=",
    											rightExpression: {
    												argumentTypes: null,
    												baseExpression: {
    													argumentTypes: null,
    													id: 135,
    													name: "clock_in_times",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 19,
    													src: "1654:14:0",
    													typeDescriptions: {
    														typeIdentifier: "t_mapping$_t_address_$_t_uint256_$",
    														typeString: "mapping(address => uint256)"
    													}
    												},
    												id: 138,
    												indexExpression: {
    													argumentTypes: null,
    													expression: {
    														argumentTypes: null,
    														id: 136,
    														name: "msg",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: -15,
    														src: "1669:3:0",
    														typeDescriptions: {
    															typeIdentifier: "t_magic_message",
    															typeString: "msg"
    														}
    													},
    													id: 137,
    													isConstant: false,
    													isLValue: false,
    													isPure: false,
    													lValueRequested: false,
    													memberName: "sender",
    													nodeType: "MemberAccess",
    													referencedDeclaration: null,
    													src: "1669:10:0",
    													typeDescriptions: {
    														typeIdentifier: "t_address_payable",
    														typeString: "address payable"
    													}
    												},
    												isConstant: false,
    												isLValue: true,
    												isPure: false,
    												lValueRequested: false,
    												nodeType: "IndexAccess",
    												src: "1654:26:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											src: "1642:38:0",
    											typeDescriptions: {
    												typeIdentifier: "t_bool",
    												typeString: "bool"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_bool",
    												typeString: "bool"
    											}
    										],
    										id: 133,
    										name: "require",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    											-18,
    											-18
    										],
    										referencedDeclaration: -18,
    										src: "1634:7:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_require_pure$_t_bool_$returns$__$",
    											typeString: "function (bool) pure"
    										}
    									},
    									id: 140,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1634:47:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 141,
    								nodeType: "ExpressionStatement",
    								src: "1634:47:0"
    							},
    							{
    								condition: {
    									argumentTypes: null,
    									commonType: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									},
    									id: 150,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									lValueRequested: false,
    									leftExpression: {
    										argumentTypes: null,
    										"arguments": [
    											{
    												argumentTypes: null,
    												baseExpression: {
    													argumentTypes: null,
    													id: 144,
    													name: "clock_in_times",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 19,
    													src: "1708:14:0",
    													typeDescriptions: {
    														typeIdentifier: "t_mapping$_t_address_$_t_uint256_$",
    														typeString: "mapping(address => uint256)"
    													}
    												},
    												id: 147,
    												indexExpression: {
    													argumentTypes: null,
    													expression: {
    														argumentTypes: null,
    														id: 145,
    														name: "msg",
    														nodeType: "Identifier",
    														overloadedDeclarations: [
    														],
    														referencedDeclaration: -15,
    														src: "1723:3:0",
    														typeDescriptions: {
    															typeIdentifier: "t_magic_message",
    															typeString: "msg"
    														}
    													},
    													id: 146,
    													isConstant: false,
    													isLValue: false,
    													isPure: false,
    													lValueRequested: false,
    													memberName: "sender",
    													nodeType: "MemberAccess",
    													referencedDeclaration: null,
    													src: "1723:10:0",
    													typeDescriptions: {
    														typeIdentifier: "t_address_payable",
    														typeString: "address payable"
    													}
    												},
    												isConstant: false,
    												isLValue: true,
    												isPure: false,
    												lValueRequested: false,
    												nodeType: "IndexAccess",
    												src: "1708:26:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											}
    										],
    										expression: {
    											argumentTypes: [
    												{
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											],
    											expression: {
    												argumentTypes: null,
    												id: 142,
    												name: "end_time",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 129,
    												src: "1695:8:0",
    												typeDescriptions: {
    													typeIdentifier: "t_uint256",
    													typeString: "uint256"
    												}
    											},
    											id: 143,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sub",
    											nodeType: "MemberAccess",
    											referencedDeclaration: 443,
    											src: "1695:12:0",
    											typeDescriptions: {
    												typeIdentifier: "t_function_internal_pure$_t_uint256_$_t_uint256_$returns$_t_uint256_$bound_to$_t_uint256_$",
    												typeString: "function (uint256,uint256) pure returns (uint256)"
    											}
    										},
    										id: 148,
    										isConstant: false,
    										isLValue: false,
    										isPure: false,
    										kind: "functionCall",
    										lValueRequested: false,
    										names: [
    										],
    										nodeType: "FunctionCall",
    										src: "1695:40:0",
    										tryCall: false,
    										typeDescriptions: {
    											typeIdentifier: "t_uint256",
    											typeString: "uint256"
    										}
    									},
    									nodeType: "BinaryOperation",
    									operator: "<=",
    									rightExpression: {
    										argumentTypes: null,
    										hexValue: "31",
    										id: 149,
    										isConstant: false,
    										isLValue: false,
    										isPure: true,
    										kind: "number",
    										lValueRequested: false,
    										nodeType: "Literal",
    										src: "1739:7:0",
    										subdenomination: "hours",
    										typeDescriptions: {
    											typeIdentifier: "t_rational_3600_by_1",
    											typeString: "int_const 3600"
    										},
    										value: "1"
    									},
    									src: "1695:51:0",
    									typeDescriptions: {
    										typeIdentifier: "t_bool",
    										typeString: "bool"
    									}
    								},
    								falseBody: null,
    								id: 164,
    								nodeType: "IfStatement",
    								src: "1691:161:0",
    								trueBody: {
    									id: 163,
    									nodeType: "Block",
    									src: "1748:104:0",
    									statements: [
    										{
    											expression: {
    												argumentTypes: null,
    												"arguments": [
    													{
    														argumentTypes: null,
    														expression: {
    															argumentTypes: null,
    															id: 152,
    															name: "msg",
    															nodeType: "Identifier",
    															overloadedDeclarations: [
    															],
    															referencedDeclaration: -15,
    															src: "1806:3:0",
    															typeDescriptions: {
    																typeIdentifier: "t_magic_message",
    																typeString: "msg"
    															}
    														},
    														id: 153,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														memberName: "sender",
    														nodeType: "MemberAccess",
    														referencedDeclaration: null,
    														src: "1806:10:0",
    														typeDescriptions: {
    															typeIdentifier: "t_address_payable",
    															typeString: "address payable"
    														}
    													},
    													{
    														argumentTypes: null,
    														commonType: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														},
    														id: 160,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														leftExpression: {
    															argumentTypes: null,
    															hexValue: "31",
    															id: 154,
    															isConstant: false,
    															isLValue: false,
    															isPure: true,
    															kind: "number",
    															lValueRequested: false,
    															nodeType: "Literal",
    															src: "1818:1:0",
    															subdenomination: null,
    															typeDescriptions: {
    																typeIdentifier: "t_rational_1_by_1",
    																typeString: "int_const 1"
    															},
    															value: "1"
    														},
    														nodeType: "BinaryOperation",
    														operator: "*",
    														rightExpression: {
    															argumentTypes: null,
    															components: [
    																{
    																	argumentTypes: null,
    																	commonType: {
    																		typeIdentifier: "t_uint256",
    																		typeString: "uint256"
    																	},
    																	id: 158,
    																	isConstant: false,
    																	isLValue: false,
    																	isPure: false,
    																	lValueRequested: false,
    																	leftExpression: {
    																		argumentTypes: null,
    																		hexValue: "3130",
    																		id: 155,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: true,
    																		kind: "number",
    																		lValueRequested: false,
    																		nodeType: "Literal",
    																		src: "1823:2:0",
    																		subdenomination: null,
    																		typeDescriptions: {
    																			typeIdentifier: "t_rational_10_by_1",
    																			typeString: "int_const 10"
    																		},
    																		value: "10"
    																	},
    																	nodeType: "BinaryOperation",
    																	operator: "**",
    																	rightExpression: {
    																		argumentTypes: null,
    																		"arguments": [
    																		],
    																		expression: {
    																			argumentTypes: [
    																			],
    																			id: 156,
    																			name: "decimals",
    																			nodeType: "Identifier",
    																			overloadedDeclarations: [
    																			],
    																			referencedDeclaration: 672,
    																			src: "1829:8:0",
    																			typeDescriptions: {
    																				typeIdentifier: "t_function_internal_view$__$returns$_t_uint8_$",
    																				typeString: "function () view returns (uint8)"
    																			}
    																		},
    																		id: 157,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		kind: "functionCall",
    																		lValueRequested: false,
    																		names: [
    																		],
    																		nodeType: "FunctionCall",
    																		src: "1829:10:0",
    																		tryCall: false,
    																		typeDescriptions: {
    																			typeIdentifier: "t_uint8",
    																			typeString: "uint8"
    																		}
    																	},
    																	src: "1823:16:0",
    																	typeDescriptions: {
    																		typeIdentifier: "t_uint256",
    																		typeString: "uint256"
    																	}
    																}
    															],
    															id: 159,
    															isConstant: false,
    															isInlineArray: false,
    															isLValue: false,
    															isPure: false,
    															lValueRequested: false,
    															nodeType: "TupleExpression",
    															src: "1822:18:0",
    															typeDescriptions: {
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														},
    														src: "1818:22:0",
    														typeDescriptions: {
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													}
    												],
    												expression: {
    													argumentTypes: [
    														{
    															typeIdentifier: "t_address_payable",
    															typeString: "address payable"
    														},
    														{
    															typeIdentifier: "t_uint256",
    															typeString: "uint256"
    														}
    													],
    													id: 151,
    													name: "_payout",
    													nodeType: "Identifier",
    													overloadedDeclarations: [
    													],
    													referencedDeclaration: 207,
    													src: "1798:7:0",
    													typeDescriptions: {
    														typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    														typeString: "function (address,uint256)"
    													}
    												},
    												id: 161,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												kind: "functionCall",
    												lValueRequested: false,
    												names: [
    												],
    												nodeType: "FunctionCall",
    												src: "1798:43:0",
    												tryCall: false,
    												typeDescriptions: {
    													typeIdentifier: "t_tuple$__$",
    													typeString: "tuple()"
    												}
    											},
    											id: 162,
    											nodeType: "ExpressionStatement",
    											src: "1798:43:0"
    										}
    									]
    								}
    							},
    							{
    								eventCall: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 166,
    												name: "msg",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -15,
    												src: "1884:3:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_message",
    													typeString: "msg"
    												}
    											},
    											id: 167,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "sender",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1884:10:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											}
    										},
    										{
    											argumentTypes: null,
    											expression: {
    												argumentTypes: null,
    												id: 168,
    												name: "block",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: -4,
    												src: "1896:5:0",
    												typeDescriptions: {
    													typeIdentifier: "t_magic_block",
    													typeString: "block"
    												}
    											},
    											id: 169,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											lValueRequested: false,
    											memberName: "timestamp",
    											nodeType: "MemberAccess",
    											referencedDeclaration: null,
    											src: "1896:15:0",
    											typeDescriptions: {
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										}
    									],
    									expression: {
    										argumentTypes: [
    											{
    												typeIdentifier: "t_address_payable",
    												typeString: "address payable"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 165,
    										name: "ClockOutTimeEvent",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 42,
    										src: "1866:17:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_event_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 170,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1866:46:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 171,
    								nodeType: "EmitStatement",
    								src: "1861:51:0"
    							}
    						]
    					},
    					documentation: null,
    					functionSelector: "b939df59",
    					id: 173,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    					],
    					name: "clockEndTime",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 126,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1573:2:0"
    					},
    					returnParameters: {
    						id: 127,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1583:0:0"
    					},
    					scope: 208,
    					src: "1552:367:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 186,
    						nodeType: "Block",
    						src: "1973:39:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											"arguments": [
    											],
    											expression: {
    												argumentTypes: [
    												],
    												id: 181,
    												name: "owner",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 333,
    												src: "1989:5:0",
    												typeDescriptions: {
    													typeIdentifier: "t_function_internal_view$__$returns$_t_address_$",
    													typeString: "function () view returns (address)"
    												}
    											},
    											id: 182,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											kind: "functionCall",
    											lValueRequested: false,
    											names: [
    											],
    											nodeType: "FunctionCall",
    											src: "1989:7:0",
    											tryCall: false,
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 183,
    											name: "amount",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 175,
    											src: "1998:6:0",
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
    										id: 180,
    										name: "_mint",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 972,
    										src: "1983:5:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 184,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "1983:22:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 185,
    								nodeType: "ExpressionStatement",
    								src: "1983:22:0"
    							}
    						]
    					},
    					documentation: null,
    					functionSelector: "5a9ece24",
    					id: 187,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    						{
    							"arguments": null,
    							id: 178,
    							modifierName: {
    								argumentTypes: null,
    								id: 177,
    								name: "onlyOwner",
    								nodeType: "Identifier",
    								overloadedDeclarations: [
    								],
    								referencedDeclaration: 346,
    								src: "1963:9:0",
    								typeDescriptions: {
    									typeIdentifier: "t_modifier$__$",
    									typeString: "modifier ()"
    								}
    							},
    							nodeType: "ModifierInvocation",
    							src: "1963:9:0"
    						}
    					],
    					name: "mint_new",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 176,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 175,
    								mutability: "mutable",
    								name: "amount",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 187,
    								src: "1943:11:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 174,
    									name: "uint",
    									nodeType: "ElementaryTypeName",
    									src: "1943:4:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "1942:13:0"
    					},
    					returnParameters: {
    						id: 179,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "1973:0:0"
    					},
    					scope: 208,
    					src: "1925:87:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "public"
    				},
    				{
    					body: {
    						id: 206,
    						nodeType: "Block",
    						src: "2073:99:0",
    						statements: [
    							{
    								expression: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											"arguments": [
    											],
    											expression: {
    												argumentTypes: [
    												],
    												id: 195,
    												name: "owner",
    												nodeType: "Identifier",
    												overloadedDeclarations: [
    												],
    												referencedDeclaration: 333,
    												src: "2093:5:0",
    												typeDescriptions: {
    													typeIdentifier: "t_function_internal_view$__$returns$_t_address_$",
    													typeString: "function () view returns (address)"
    												}
    											},
    											id: 196,
    											isConstant: false,
    											isLValue: false,
    											isPure: false,
    											kind: "functionCall",
    											lValueRequested: false,
    											names: [
    											],
    											nodeType: "FunctionCall",
    											src: "2093:7:0",
    											tryCall: false,
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 197,
    											name: "_to",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 189,
    											src: "2102:3:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 198,
    											name: "reward_val",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 191,
    											src: "2107:10:0",
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
    												typeIdentifier: "t_address",
    												typeString: "address"
    											},
    											{
    												typeIdentifier: "t_uint256",
    												typeString: "uint256"
    											}
    										],
    										id: 194,
    										name: "_transfer",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 917,
    										src: "2083:9:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_internal_nonpayable$_t_address_$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,address,uint256)"
    										}
    									},
    									id: 199,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "2083:35:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 200,
    								nodeType: "ExpressionStatement",
    								src: "2083:35:0"
    							},
    							{
    								eventCall: {
    									argumentTypes: null,
    									"arguments": [
    										{
    											argumentTypes: null,
    											id: 202,
    											name: "_to",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 189,
    											src: "2149:3:0",
    											typeDescriptions: {
    												typeIdentifier: "t_address",
    												typeString: "address"
    											}
    										},
    										{
    											argumentTypes: null,
    											id: 203,
    											name: "reward_val",
    											nodeType: "Identifier",
    											overloadedDeclarations: [
    											],
    											referencedDeclaration: 191,
    											src: "2154:10:0",
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
    										id: 201,
    										name: "PayoutMadeEvent",
    										nodeType: "Identifier",
    										overloadedDeclarations: [
    										],
    										referencedDeclaration: 30,
    										src: "2133:15:0",
    										typeDescriptions: {
    											typeIdentifier: "t_function_event_nonpayable$_t_address_$_t_uint256_$returns$__$",
    											typeString: "function (address,uint256)"
    										}
    									},
    									id: 204,
    									isConstant: false,
    									isLValue: false,
    									isPure: false,
    									kind: "functionCall",
    									lValueRequested: false,
    									names: [
    									],
    									nodeType: "FunctionCall",
    									src: "2133:32:0",
    									tryCall: false,
    									typeDescriptions: {
    										typeIdentifier: "t_tuple$__$",
    										typeString: "tuple()"
    									}
    								},
    								id: 205,
    								nodeType: "EmitStatement",
    								src: "2128:37:0"
    							}
    						]
    					},
    					documentation: null,
    					id: 207,
    					implemented: true,
    					kind: "function",
    					modifiers: [
    					],
    					name: "_payout",
    					nodeType: "FunctionDefinition",
    					overrides: null,
    					parameters: {
    						id: 192,
    						nodeType: "ParameterList",
    						parameters: [
    							{
    								constant: false,
    								id: 189,
    								mutability: "mutable",
    								name: "_to",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 207,
    								src: "2035:11:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_address",
    									typeString: "address"
    								},
    								typeName: {
    									id: 188,
    									name: "address",
    									nodeType: "ElementaryTypeName",
    									src: "2035:7:0",
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
    								id: 191,
    								mutability: "mutable",
    								name: "reward_val",
    								nodeType: "VariableDeclaration",
    								overrides: null,
    								scope: 207,
    								src: "2048:15:0",
    								stateVariable: false,
    								storageLocation: "default",
    								typeDescriptions: {
    									typeIdentifier: "t_uint256",
    									typeString: "uint256"
    								},
    								typeName: {
    									id: 190,
    									name: "uint",
    									nodeType: "ElementaryTypeName",
    									src: "2048:4:0",
    									typeDescriptions: {
    										typeIdentifier: "t_uint256",
    										typeString: "uint256"
    									}
    								},
    								value: null,
    								visibility: "internal"
    							}
    						],
    						src: "2034:30:0"
    					},
    					returnParameters: {
    						id: 193,
    						nodeType: "ParameterList",
    						parameters: [
    						],
    						src: "2073:0:0"
    					},
    					scope: 208,
    					src: "2018:154:0",
    					stateMutability: "nonpayable",
    					virtual: false,
    					visibility: "private"
    				}
    			],
    			scope: 209,
    			src: "314:1860:0"
    		}
    	],
    	src: "0:2175:0"
    };
    var legacyAST = {
    	attributes: {
    		absolutePath: "/home/lev/code/blockchain/eth/evie-timer/contracts/EvieCoin.sol",
    		exportedSymbols: {
    			EvieCoin: [
    				208
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
    				SourceUnit: 1097,
    				absolutePath: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				file: "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    				scope: 209,
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
    				SourceUnit: 398,
    				absolutePath: "@openzeppelin/contracts/access/Ownable.sol",
    				file: "@openzeppelin/contracts/access/Ownable.sol",
    				scope: 209,
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
    				SourceUnit: 594,
    				absolutePath: "@openzeppelin/contracts/math/SafeMath.sol",
    				file: "@openzeppelin/contracts/math/SafeMath.sol",
    				scope: 209,
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
    				abstract: false,
    				contractDependencies: [
    					288,
    					397,
    					1096,
    					1174
    				],
    				contractKind: "contract",
    				documentation: null,
    				fullyImplemented: true,
    				linearizedBaseContracts: [
    					208,
    					397,
    					1096,
    					1174,
    					288
    				],
    				name: "EvieCoin",
    				scope: 209
    			},
    			children: [
    				{
    					attributes: {
    						"arguments": null
    					},
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "ERC20",
    								referencedDeclaration: 1096,
    								type: "contract ERC20"
    							},
    							id: 5,
    							name: "UserDefinedTypeName",
    							src: "335:5:0"
    						}
    					],
    					id: 6,
    					name: "InheritanceSpecifier",
    					src: "335:5:0"
    				},
    				{
    					attributes: {
    						"arguments": null
    					},
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "Ownable",
    								referencedDeclaration: 397,
    								type: "contract Ownable"
    							},
    							id: 7,
    							name: "UserDefinedTypeName",
    							src: "342:7:0"
    						}
    					],
    					id: 8,
    					name: "InheritanceSpecifier",
    					src: "342:7:0"
    				},
    				{
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "SafeMath",
    								referencedDeclaration: 593,
    								type: "library SafeMath"
    							},
    							id: 9,
    							name: "UserDefinedTypeName",
    							src: "362:8:0"
    						},
    						{
    							attributes: {
    								name: "uint256",
    								type: "uint256"
    							},
    							id: 10,
    							name: "ElementaryTypeName",
    							src: "375:7:0"
    						}
    					],
    					id: 11,
    					name: "UsingForDirective",
    					src: "356:27:0"
    				},
    				{
    					children: [
    						{
    							attributes: {
    								contractScope: null,
    								name: "SafeMath",
    								referencedDeclaration: 593,
    								type: "library SafeMath"
    							},
    							id: 12,
    							name: "UserDefinedTypeName",
    							src: "394:8:0"
    						},
    						{
    							attributes: {
    								name: "uint",
    								type: "uint256"
    							},
    							id: 13,
    							name: "ElementaryTypeName",
    							src: "407:4:0"
    						}
    					],
    					id: 14,
    					name: "UsingForDirective",
    					src: "388:24:0"
    				},
    				{
    					attributes: {
    						constant: false,
    						functionSelector: "db68f612",
    						mutability: "mutable",
    						name: "clock_in_times",
    						overrides: null,
    						scope: 208,
    						stateVariable: true,
    						storageLocation: "default",
    						type: "mapping(address => uint256)",
    						value: null,
    						visibility: "public"
    					},
    					children: [
    						{
    							attributes: {
    								type: "mapping(address => uint256)"
    							},
    							children: [
    								{
    									attributes: {
    										name: "address",
    										type: "address"
    									},
    									id: 16,
    									name: "ElementaryTypeName",
    									src: "488:7:0"
    								},
    								{
    									attributes: {
    										name: "uint",
    										type: "uint256"
    									},
    									id: 17,
    									name: "ElementaryTypeName",
    									src: "499:4:0"
    								}
    							],
    							id: 18,
    							name: "Mapping",
    							src: "479:25:0"
    						},
    						{
    							attributes: {
    								text: "@dev the clock in time for an account on a given day"
    							},
    							id: 15,
    							name: "StructuredDocumentation",
    							src: "418:56:0"
    						}
    					],
    					id: 19,
    					name: "VariableDeclaration",
    					src: "479:47:0"
    				},
    				{
    					attributes: {
    						constant: false,
    						mutability: "mutable",
    						name: "last_clock_in_day",
    						overrides: null,
    						scope: 208,
    						stateVariable: true,
    						storageLocation: "default",
    						type: "mapping(address => uint16)",
    						value: null,
    						visibility: "private"
    					},
    					children: [
    						{
    							attributes: {
    								type: "mapping(address => uint16)"
    							},
    							children: [
    								{
    									attributes: {
    										name: "address",
    										type: "address"
    									},
    									id: 21,
    									name: "ElementaryTypeName",
    									src: "652:7:0"
    								},
    								{
    									attributes: {
    										name: "uint16",
    										type: "uint16"
    									},
    									id: 22,
    									name: "ElementaryTypeName",
    									src: "663:6:0"
    								}
    							],
    							id: 23,
    							name: "Mapping",
    							src: "643:27:0"
    						},
    						{
    							attributes: {
    								text: "@dev check the last clock out day for working. Used to ensure that only one clock out is done per day"
    							},
    							id: 20,
    							name: "StructuredDocumentation",
    							src: "533:105:0"
    						}
    					],
    					id: 24,
    					name: "VariableDeclaration",
    					src: "643:53:0"
    				},
    				{
    					attributes: {
    						anonymous: false,
    						documentation: null,
    						name: "PayoutMadeEvent"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										indexed: true,
    										mutability: "mutable",
    										name: "_to",
    										overrides: null,
    										scope: 30,
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
    											id: 25,
    											name: "ElementaryTypeName",
    											src: "725:7:0"
    										}
    									],
    									id: 26,
    									name: "VariableDeclaration",
    									src: "725:19:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										indexed: false,
    										mutability: "mutable",
    										name: "value",
    										overrides: null,
    										scope: 30,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint",
    												type: "uint256"
    											},
    											id: 27,
    											name: "ElementaryTypeName",
    											src: "746:4:0"
    										}
    									],
    									id: 28,
    									name: "VariableDeclaration",
    									src: "746:10:0"
    								}
    							],
    							id: 29,
    							name: "ParameterList",
    							src: "724:33:0"
    						}
    					],
    					id: 30,
    					name: "EventDefinition",
    					src: "703:55:0"
    				},
    				{
    					attributes: {
    						anonymous: false,
    						documentation: null,
    						name: "ClockInTimeEvent"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										indexed: true,
    										mutability: "mutable",
    										name: "user",
    										overrides: null,
    										scope: 36,
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
    											id: 31,
    											name: "ElementaryTypeName",
    											src: "786:7:0"
    										}
    									],
    									id: 32,
    									name: "VariableDeclaration",
    									src: "786:20:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										indexed: false,
    										mutability: "mutable",
    										name: "timestamp",
    										overrides: null,
    										scope: 36,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint",
    												type: "uint256"
    											},
    											id: 33,
    											name: "ElementaryTypeName",
    											src: "808:4:0"
    										}
    									],
    									id: 34,
    									name: "VariableDeclaration",
    									src: "808:14:0"
    								}
    							],
    							id: 35,
    							name: "ParameterList",
    							src: "785:38:0"
    						}
    					],
    					id: 36,
    					name: "EventDefinition",
    					src: "763:61:0"
    				},
    				{
    					attributes: {
    						anonymous: false,
    						documentation: null,
    						name: "ClockOutTimeEvent"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										indexed: true,
    										mutability: "mutable",
    										name: "user",
    										overrides: null,
    										scope: 42,
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
    											id: 37,
    											name: "ElementaryTypeName",
    											src: "853:7:0"
    										}
    									],
    									id: 38,
    									name: "VariableDeclaration",
    									src: "853:20:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										indexed: false,
    										mutability: "mutable",
    										name: "timestamp",
    										overrides: null,
    										scope: 42,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint",
    												type: "uint256"
    											},
    											id: 39,
    											name: "ElementaryTypeName",
    											src: "875:4:0"
    										}
    									],
    									id: 40,
    									name: "VariableDeclaration",
    									src: "875:14:0"
    								}
    							],
    							id: 41,
    							name: "ParameterList",
    							src: "852:38:0"
    						}
    					],
    					id: 42,
    					name: "EventDefinition",
    					src: "829:62:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						implemented: true,
    						isConstructor: true,
    						kind: "constructor",
    						name: "",
    						overrides: null,
    						scope: 208,
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
    										name: "initialSupply",
    										overrides: null,
    										scope: 69,
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
    											id: 43,
    											name: "ElementaryTypeName",
    											src: "909:7:0"
    										}
    									],
    									id: 44,
    									name: "VariableDeclaration",
    									src: "909:21:0"
    								}
    							],
    							id: 45,
    							name: "ParameterList",
    							src: "908:23:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 50,
    							name: "ParameterList",
    							src: "957:0:0"
    						},
    						{
    							children: [
    								{
    									attributes: {
    										argumentTypes: null,
    										overloadedDeclarations: [
    											null
    										],
    										referencedDeclaration: 1096,
    										type: "type(contract ERC20)",
    										value: "ERC20"
    									},
    									id: 46,
    									name: "Identifier",
    									src: "932:5:0"
    								},
    								{
    									attributes: {
    										argumentTypes: null,
    										hexvalue: "45766965434f494e",
    										isConstant: false,
    										isLValue: false,
    										isPure: true,
    										lValueRequested: false,
    										subdenomination: null,
    										token: "string",
    										type: "literal_string \"EvieCOIN\"",
    										value: "EvieCOIN"
    									},
    									id: 47,
    									name: "Literal",
    									src: "938:10:0"
    								},
    								{
    									attributes: {
    										argumentTypes: null,
    										hexvalue: "455645",
    										isConstant: false,
    										isLValue: false,
    										isPure: true,
    										lValueRequested: false,
    										subdenomination: null,
    										token: "string",
    										type: "literal_string \"EVE\"",
    										value: "EVE"
    									},
    									id: 48,
    									name: "Literal",
    									src: "950:5:0"
    								}
    							],
    							id: 49,
    							name: "ModifierInvocation",
    							src: "932:24:0"
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
    																typeIdentifier: "t_address_payable",
    																typeString: "address payable"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 396,
    														type: "function (address)",
    														value: "transferOwnership"
    													},
    													id: 51,
    													name: "Identifier",
    													src: "967:17:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "sender",
    														referencedDeclaration: null,
    														type: "address payable"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -15,
    																type: "msg",
    																value: "msg"
    															},
    															id: 52,
    															name: "Identifier",
    															src: "985:3:0"
    														}
    													],
    													id: 53,
    													name: "MemberAccess",
    													src: "985:10:0"
    												}
    											],
    											id: 54,
    											name: "FunctionCall",
    											src: "967:29:0"
    										}
    									],
    									id: 55,
    									name: "ExpressionStatement",
    									src: "967:29:0"
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
    																typeIdentifier: "t_address_payable",
    																typeString: "address payable"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 972,
    														type: "function (address,uint256)",
    														value: "_mint"
    													},
    													id: 56,
    													name: "Identifier",
    													src: "1006:5:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "sender",
    														referencedDeclaration: null,
    														type: "address payable"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -15,
    																type: "msg",
    																value: "msg"
    															},
    															id: 57,
    															name: "Identifier",
    															src: "1012:3:0"
    														}
    													],
    													id: 58,
    													name: "MemberAccess",
    													src: "1012:10:0"
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
    														operator: "*",
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 44,
    																type: "uint256",
    																value: "initialSupply"
    															},
    															id: 59,
    															name: "Identifier",
    															src: "1024:13:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isInlineArray: false,
    																isLValue: false,
    																isPure: false,
    																lValueRequested: false,
    																type: "uint256"
    															},
    															children: [
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
    																		operator: "**",
    																		type: "uint256"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				hexvalue: "3130",
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: true,
    																				lValueRequested: false,
    																				subdenomination: null,
    																				token: "number",
    																				type: "int_const 10",
    																				value: "10"
    																			},
    																			id: 60,
    																			name: "Literal",
    																			src: "1041:2:0"
    																		},
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				"arguments": [
    																					null
    																				],
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: false,
    																				isStructConstructorCall: false,
    																				lValueRequested: false,
    																				names: [
    																					null
    																				],
    																				tryCall: false,
    																				type: "uint8",
    																				type_conversion: false
    																			},
    																			children: [
    																				{
    																					attributes: {
    																						argumentTypes: [
    																							null
    																						],
    																						overloadedDeclarations: [
    																							null
    																						],
    																						referencedDeclaration: 672,
    																						type: "function () view returns (uint8)",
    																						value: "decimals"
    																					},
    																					id: 61,
    																					name: "Identifier",
    																					src: "1047:8:0"
    																				}
    																			],
    																			id: 62,
    																			name: "FunctionCall",
    																			src: "1047:10:0"
    																		}
    																	],
    																	id: 63,
    																	name: "BinaryOperation",
    																	src: "1041:16:0"
    																}
    															],
    															id: 64,
    															name: "TupleExpression",
    															src: "1040:18:0"
    														}
    													],
    													id: 65,
    													name: "BinaryOperation",
    													src: "1024:34:0"
    												}
    											],
    											id: 66,
    											name: "FunctionCall",
    											src: "1006:53:0"
    										}
    									],
    									id: 67,
    									name: "ExpressionStatement",
    									src: "1006:53:0"
    								}
    							],
    							id: 68,
    							name: "Block",
    							src: "957:109:0"
    						}
    					],
    					id: 69,
    					name: "FunctionDefinition",
    					src: "897:169:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						name: "_once_per_day",
    						overrides: null,
    						virtual: false,
    						visibility: "internal"
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
    							id: 70,
    							name: "ParameterList",
    							src: "1094:2:0"
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
    																typeIdentifier: "t_bool",
    																typeString: "bool"
    															}
    														],
    														overloadedDeclarations: [
    															-18,
    															-18
    														],
    														referencedDeclaration: -18,
    														type: "function (bool) pure",
    														value: "require"
    													},
    													id: 71,
    													name: "Identifier",
    													src: "1107:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														commonType: {
    															typeIdentifier: "t_uint16",
    															typeString: "uint16"
    														},
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														operator: ">",
    														type: "bool"
    													},
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
    																type: "uint16",
    																type_conversion: true
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: [
    																			{
    																				typeIdentifier: "t_uint256",
    																				typeString: "uint256"
    																			}
    																		],
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: true,
    																		lValueRequested: false,
    																		type: "type(uint16)"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				name: "uint16",
    																				type: null
    																			},
    																			id: 72,
    																			name: "ElementaryTypeName",
    																			src: "1115:6:0"
    																		}
    																	],
    																	id: 73,
    																	name: "ElementaryTypeNameExpression",
    																	src: "1115:6:0"
    																},
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
    																		type: "uint256",
    																		type_conversion: false
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: [
    																					{
    																						typeIdentifier: "t_rational_86400_by_1",
    																						typeString: "int_const 86400"
    																					}
    																				],
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: false,
    																				lValueRequested: false,
    																				member_name: "div",
    																				referencedDeclaration: 523,
    																				type: "function (uint256,uint256) pure returns (uint256)"
    																			},
    																			children: [
    																				{
    																					attributes: {
    																						argumentTypes: null,
    																						isConstant: false,
    																						isLValue: false,
    																						isPure: false,
    																						lValueRequested: false,
    																						member_name: "timestamp",
    																						referencedDeclaration: null,
    																						type: "uint256"
    																					},
    																					children: [
    																						{
    																							attributes: {
    																								argumentTypes: null,
    																								overloadedDeclarations: [
    																									null
    																								],
    																								referencedDeclaration: -4,
    																								type: "block",
    																								value: "block"
    																							},
    																							id: 74,
    																							name: "Identifier",
    																							src: "1122:5:0"
    																						}
    																					],
    																					id: 75,
    																					name: "MemberAccess",
    																					src: "1122:15:0"
    																				}
    																			],
    																			id: 76,
    																			name: "MemberAccess",
    																			src: "1122:19:0"
    																		},
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				hexvalue: "31",
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: true,
    																				lValueRequested: false,
    																				subdenomination: "days",
    																				token: "number",
    																				type: "int_const 86400",
    																				value: "1"
    																			},
    																			id: 77,
    																			name: "Literal",
    																			src: "1142:6:0"
    																		}
    																	],
    																	id: 78,
    																	name: "FunctionCall",
    																	src: "1122:27:0"
    																}
    															],
    															id: 79,
    															name: "FunctionCall",
    															src: "1115:35:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: true,
    																isPure: false,
    																lValueRequested: false,
    																type: "uint16"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 24,
    																		type: "mapping(address => uint16)",
    																		value: "last_clock_in_day"
    																	},
    																	id: 80,
    																	name: "Identifier",
    																	src: "1154:17:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		lValueRequested: false,
    																		member_name: "sender",
    																		referencedDeclaration: null,
    																		type: "address payable"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				overloadedDeclarations: [
    																					null
    																				],
    																				referencedDeclaration: -15,
    																				type: "msg",
    																				value: "msg"
    																			},
    																			id: 81,
    																			name: "Identifier",
    																			src: "1172:3:0"
    																		}
    																	],
    																	id: 82,
    																	name: "MemberAccess",
    																	src: "1172:10:0"
    																}
    															],
    															id: 83,
    															name: "IndexAccess",
    															src: "1154:29:0"
    														}
    													],
    													id: 84,
    													name: "BinaryOperation",
    													src: "1115:68:0"
    												}
    											],
    											id: 85,
    											name: "FunctionCall",
    											src: "1107:77:0"
    										}
    									],
    									id: 86,
    									name: "ExpressionStatement",
    									src: "1107:77:0"
    								},
    								{
    									id: 87,
    									name: "PlaceholderStatement",
    									src: "1194:1:0"
    								}
    							],
    							id: 88,
    							name: "Block",
    							src: "1097:105:0"
    						}
    					],
    					id: 89,
    					name: "ModifierDefinition",
    					src: "1072:130:0"
    				},
    				{
    					attributes: {
    						functionSelector: "a481aada",
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						name: "clockStartTime",
    						overrides: null,
    						scope: 208,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "public"
    					},
    					children: [
    						{
    							attributes: {
    								text: "@dev a user clocks in their start time"
    							},
    							id: 90,
    							name: "StructuredDocumentation",
    							src: "1208:42:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 91,
    							name: "ParameterList",
    							src: "1278:2:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 94,
    							name: "ParameterList",
    							src: "1302:0:0"
    						},
    						{
    							attributes: {
    								"arguments": null
    							},
    							children: [
    								{
    									attributes: {
    										argumentTypes: null,
    										overloadedDeclarations: [
    											null
    										],
    										referencedDeclaration: 89,
    										type: "modifier ()",
    										value: "_once_per_day"
    									},
    									id: 92,
    									name: "Identifier",
    									src: "1288:13:0"
    								}
    							],
    							id: 93,
    							name: "ModifierInvocation",
    							src: "1288:13:0"
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
    												lValueRequested: false,
    												operator: "=",
    												type: "uint256"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: true,
    														isPure: false,
    														lValueRequested: true,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 19,
    																type: "mapping(address => uint256)",
    																value: "clock_in_times"
    															},
    															id: 95,
    															name: "Identifier",
    															src: "1312:14:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: false,
    																isPure: false,
    																lValueRequested: false,
    																member_name: "sender",
    																referencedDeclaration: null,
    																type: "address payable"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: -15,
    																		type: "msg",
    																		value: "msg"
    																	},
    																	id: 96,
    																	name: "Identifier",
    																	src: "1327:3:0"
    																}
    															],
    															id: 97,
    															name: "MemberAccess",
    															src: "1327:10:0"
    														}
    													],
    													id: 98,
    													name: "IndexAccess",
    													src: "1312:26:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "timestamp",
    														referencedDeclaration: null,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -4,
    																type: "block",
    																value: "block"
    															},
    															id: 99,
    															name: "Identifier",
    															src: "1341:5:0"
    														}
    													],
    													id: 100,
    													name: "MemberAccess",
    													src: "1341:15:0"
    												}
    											],
    											id: 101,
    											name: "Assignment",
    											src: "1312:44:0"
    										}
    									],
    									id: 102,
    									name: "ExpressionStatement",
    									src: "1312:44:0"
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
    												operator: "=",
    												type: "uint16"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: true,
    														isPure: false,
    														lValueRequested: true,
    														type: "uint16"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 24,
    																type: "mapping(address => uint16)",
    																value: "last_clock_in_day"
    															},
    															id: 103,
    															name: "Identifier",
    															src: "1366:17:0"
    														},
    														{
    															attributes: {
    																argumentTypes: null,
    																isConstant: false,
    																isLValue: false,
    																isPure: false,
    																lValueRequested: false,
    																member_name: "sender",
    																referencedDeclaration: null,
    																type: "address payable"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: -15,
    																		type: "msg",
    																		value: "msg"
    																	},
    																	id: 104,
    																	name: "Identifier",
    																	src: "1384:3:0"
    																}
    															],
    															id: 105,
    															name: "MemberAccess",
    															src: "1384:10:0"
    														}
    													],
    													id: 106,
    													name: "IndexAccess",
    													src: "1366:29:0"
    												},
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
    														type: "uint16",
    														type_conversion: true
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: [
    																	{
    																		typeIdentifier: "t_uint256",
    																		typeString: "uint256"
    																	}
    																],
    																isConstant: false,
    																isLValue: false,
    																isPure: true,
    																lValueRequested: false,
    																type: "type(uint16)"
    															},
    															children: [
    																{
    																	attributes: {
    																		name: "uint16",
    																		type: null
    																	},
    																	id: 107,
    																	name: "ElementaryTypeName",
    																	src: "1398:6:0"
    																}
    															],
    															id: 108,
    															name: "ElementaryTypeNameExpression",
    															src: "1398:6:0"
    														},
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
    																type: "uint256",
    																type_conversion: false
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: [
    																			{
    																				typeIdentifier: "t_rational_86400_by_1",
    																				typeString: "int_const 86400"
    																			}
    																		],
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		lValueRequested: false,
    																		member_name: "div",
    																		referencedDeclaration: 523,
    																		type: "function (uint256,uint256) pure returns (uint256)"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: false,
    																				lValueRequested: false,
    																				member_name: "timestamp",
    																				referencedDeclaration: null,
    																				type: "uint256"
    																			},
    																			children: [
    																				{
    																					attributes: {
    																						argumentTypes: null,
    																						overloadedDeclarations: [
    																							null
    																						],
    																						referencedDeclaration: -4,
    																						type: "block",
    																						value: "block"
    																					},
    																					id: 109,
    																					name: "Identifier",
    																					src: "1405:5:0"
    																				}
    																			],
    																			id: 110,
    																			name: "MemberAccess",
    																			src: "1405:15:0"
    																		}
    																	],
    																	id: 111,
    																	name: "MemberAccess",
    																	src: "1405:19:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		hexvalue: "31",
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: true,
    																		lValueRequested: false,
    																		subdenomination: "days",
    																		token: "number",
    																		type: "int_const 86400",
    																		value: "1"
    																	},
    																	id: 112,
    																	name: "Literal",
    																	src: "1425:6:0"
    																}
    															],
    															id: 113,
    															name: "FunctionCall",
    															src: "1405:27:0"
    														}
    													],
    													id: 114,
    													name: "FunctionCall",
    													src: "1398:35:0"
    												}
    											],
    											id: 115,
    											name: "Assignment",
    											src: "1366:67:0"
    										}
    									],
    									id: 116,
    									name: "ExpressionStatement",
    									src: "1366:67:0"
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
    																typeIdentifier: "t_address_payable",
    																typeString: "address payable"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 36,
    														type: "function (address,uint256)",
    														value: "ClockInTimeEvent"
    													},
    													id: 117,
    													name: "Identifier",
    													src: "1448:16:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "sender",
    														referencedDeclaration: null,
    														type: "address payable"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -15,
    																type: "msg",
    																value: "msg"
    															},
    															id: 118,
    															name: "Identifier",
    															src: "1465:3:0"
    														}
    													],
    													id: 119,
    													name: "MemberAccess",
    													src: "1465:10:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "timestamp",
    														referencedDeclaration: null,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -4,
    																type: "block",
    																value: "block"
    															},
    															id: 120,
    															name: "Identifier",
    															src: "1477:5:0"
    														}
    													],
    													id: 121,
    													name: "MemberAccess",
    													src: "1477:15:0"
    												}
    											],
    											id: 122,
    											name: "FunctionCall",
    											src: "1448:45:0"
    										}
    									],
    									id: 123,
    									name: "EmitStatement",
    									src: "1443:50:0"
    								}
    							],
    							id: 124,
    							name: "Block",
    							src: "1302:198:0"
    						}
    					],
    					id: 125,
    					name: "FunctionDefinition",
    					src: "1255:245:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						functionSelector: "b939df59",
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						modifiers: [
    							null
    						],
    						name: "clockEndTime",
    						overrides: null,
    						scope: 208,
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
    							id: 126,
    							name: "ParameterList",
    							src: "1573:2:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 127,
    							name: "ParameterList",
    							src: "1583:0:0"
    						},
    						{
    							children: [
    								{
    									attributes: {
    										assignments: [
    											129
    										]
    									},
    									children: [
    										{
    											attributes: {
    												constant: false,
    												mutability: "mutable",
    												name: "end_time",
    												overrides: null,
    												scope: 172,
    												stateVariable: false,
    												storageLocation: "default",
    												type: "uint256",
    												value: null,
    												visibility: "internal"
    											},
    											children: [
    												{
    													attributes: {
    														name: "uint",
    														type: "uint256"
    													},
    													id: 128,
    													name: "ElementaryTypeName",
    													src: "1593:4:0"
    												}
    											],
    											id: 129,
    											name: "VariableDeclaration",
    											src: "1593:13:0"
    										},
    										{
    											attributes: {
    												argumentTypes: null,
    												isConstant: false,
    												isLValue: false,
    												isPure: false,
    												lValueRequested: false,
    												member_name: "timestamp",
    												referencedDeclaration: null,
    												type: "uint256"
    											},
    											children: [
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: -4,
    														type: "block",
    														value: "block"
    													},
    													id: 130,
    													name: "Identifier",
    													src: "1609:5:0"
    												}
    											],
    											id: 131,
    											name: "MemberAccess",
    											src: "1609:15:0"
    										}
    									],
    									id: 132,
    									name: "VariableDeclarationStatement",
    									src: "1593:31:0"
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
    																typeIdentifier: "t_bool",
    																typeString: "bool"
    															}
    														],
    														overloadedDeclarations: [
    															-18,
    															-18
    														],
    														referencedDeclaration: -18,
    														type: "function (bool) pure",
    														value: "require"
    													},
    													id: 133,
    													name: "Identifier",
    													src: "1634:7:0"
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
    														operator: ">=",
    														type: "bool"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 129,
    																type: "uint256",
    																value: "end_time"
    															},
    															id: 134,
    															name: "Identifier",
    															src: "1642:8:0"
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
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 19,
    																		type: "mapping(address => uint256)",
    																		value: "clock_in_times"
    																	},
    																	id: 135,
    																	name: "Identifier",
    																	src: "1654:14:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		lValueRequested: false,
    																		member_name: "sender",
    																		referencedDeclaration: null,
    																		type: "address payable"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				overloadedDeclarations: [
    																					null
    																				],
    																				referencedDeclaration: -15,
    																				type: "msg",
    																				value: "msg"
    																			},
    																			id: 136,
    																			name: "Identifier",
    																			src: "1669:3:0"
    																		}
    																	],
    																	id: 137,
    																	name: "MemberAccess",
    																	src: "1669:10:0"
    																}
    															],
    															id: 138,
    															name: "IndexAccess",
    															src: "1654:26:0"
    														}
    													],
    													id: 139,
    													name: "BinaryOperation",
    													src: "1642:38:0"
    												}
    											],
    											id: 140,
    											name: "FunctionCall",
    											src: "1634:47:0"
    										}
    									],
    									id: 141,
    									name: "ExpressionStatement",
    									src: "1634:47:0"
    								},
    								{
    									attributes: {
    										falseBody: null
    									},
    									children: [
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
    												operator: "<=",
    												type: "bool"
    											},
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
    														type: "uint256",
    														type_conversion: false
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: [
    																	{
    																		typeIdentifier: "t_uint256",
    																		typeString: "uint256"
    																	}
    																],
    																isConstant: false,
    																isLValue: false,
    																isPure: false,
    																lValueRequested: false,
    																member_name: "sub",
    																referencedDeclaration: 443,
    																type: "function (uint256,uint256) pure returns (uint256)"
    															},
    															children: [
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 129,
    																		type: "uint256",
    																		value: "end_time"
    																	},
    																	id: 142,
    																	name: "Identifier",
    																	src: "1695:8:0"
    																}
    															],
    															id: 143,
    															name: "MemberAccess",
    															src: "1695:12:0"
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
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 19,
    																		type: "mapping(address => uint256)",
    																		value: "clock_in_times"
    																	},
    																	id: 144,
    																	name: "Identifier",
    																	src: "1708:14:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		lValueRequested: false,
    																		member_name: "sender",
    																		referencedDeclaration: null,
    																		type: "address payable"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				overloadedDeclarations: [
    																					null
    																				],
    																				referencedDeclaration: -15,
    																				type: "msg",
    																				value: "msg"
    																			},
    																			id: 145,
    																			name: "Identifier",
    																			src: "1723:3:0"
    																		}
    																	],
    																	id: 146,
    																	name: "MemberAccess",
    																	src: "1723:10:0"
    																}
    															],
    															id: 147,
    															name: "IndexAccess",
    															src: "1708:26:0"
    														}
    													],
    													id: 148,
    													name: "FunctionCall",
    													src: "1695:40:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														hexvalue: "31",
    														isConstant: false,
    														isLValue: false,
    														isPure: true,
    														lValueRequested: false,
    														subdenomination: "hours",
    														token: "number",
    														type: "int_const 3600",
    														value: "1"
    													},
    													id: 149,
    													name: "Literal",
    													src: "1739:7:0"
    												}
    											],
    											id: 150,
    											name: "BinaryOperation",
    											src: "1695:51:0"
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
    																				typeIdentifier: "t_address_payable",
    																				typeString: "address payable"
    																			},
    																			{
    																				typeIdentifier: "t_uint256",
    																				typeString: "uint256"
    																			}
    																		],
    																		overloadedDeclarations: [
    																			null
    																		],
    																		referencedDeclaration: 207,
    																		type: "function (address,uint256)",
    																		value: "_payout"
    																	},
    																	id: 151,
    																	name: "Identifier",
    																	src: "1798:7:0"
    																},
    																{
    																	attributes: {
    																		argumentTypes: null,
    																		isConstant: false,
    																		isLValue: false,
    																		isPure: false,
    																		lValueRequested: false,
    																		member_name: "sender",
    																		referencedDeclaration: null,
    																		type: "address payable"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				overloadedDeclarations: [
    																					null
    																				],
    																				referencedDeclaration: -15,
    																				type: "msg",
    																				value: "msg"
    																			},
    																			id: 152,
    																			name: "Identifier",
    																			src: "1806:3:0"
    																		}
    																	],
    																	id: 153,
    																	name: "MemberAccess",
    																	src: "1806:10:0"
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
    																		operator: "*",
    																		type: "uint256"
    																	},
    																	children: [
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				hexvalue: "31",
    																				isConstant: false,
    																				isLValue: false,
    																				isPure: true,
    																				lValueRequested: false,
    																				subdenomination: null,
    																				token: "number",
    																				type: "int_const 1",
    																				value: "1"
    																			},
    																			id: 154,
    																			name: "Literal",
    																			src: "1818:1:0"
    																		},
    																		{
    																			attributes: {
    																				argumentTypes: null,
    																				isConstant: false,
    																				isInlineArray: false,
    																				isLValue: false,
    																				isPure: false,
    																				lValueRequested: false,
    																				type: "uint256"
    																			},
    																			children: [
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
    																						operator: "**",
    																						type: "uint256"
    																					},
    																					children: [
    																						{
    																							attributes: {
    																								argumentTypes: null,
    																								hexvalue: "3130",
    																								isConstant: false,
    																								isLValue: false,
    																								isPure: true,
    																								lValueRequested: false,
    																								subdenomination: null,
    																								token: "number",
    																								type: "int_const 10",
    																								value: "10"
    																							},
    																							id: 155,
    																							name: "Literal",
    																							src: "1823:2:0"
    																						},
    																						{
    																							attributes: {
    																								argumentTypes: null,
    																								"arguments": [
    																									null
    																								],
    																								isConstant: false,
    																								isLValue: false,
    																								isPure: false,
    																								isStructConstructorCall: false,
    																								lValueRequested: false,
    																								names: [
    																									null
    																								],
    																								tryCall: false,
    																								type: "uint8",
    																								type_conversion: false
    																							},
    																							children: [
    																								{
    																									attributes: {
    																										argumentTypes: [
    																											null
    																										],
    																										overloadedDeclarations: [
    																											null
    																										],
    																										referencedDeclaration: 672,
    																										type: "function () view returns (uint8)",
    																										value: "decimals"
    																									},
    																									id: 156,
    																									name: "Identifier",
    																									src: "1829:8:0"
    																								}
    																							],
    																							id: 157,
    																							name: "FunctionCall",
    																							src: "1829:10:0"
    																						}
    																					],
    																					id: 158,
    																					name: "BinaryOperation",
    																					src: "1823:16:0"
    																				}
    																			],
    																			id: 159,
    																			name: "TupleExpression",
    																			src: "1822:18:0"
    																		}
    																	],
    																	id: 160,
    																	name: "BinaryOperation",
    																	src: "1818:22:0"
    																}
    															],
    															id: 161,
    															name: "FunctionCall",
    															src: "1798:43:0"
    														}
    													],
    													id: 162,
    													name: "ExpressionStatement",
    													src: "1798:43:0"
    												}
    											],
    											id: 163,
    											name: "Block",
    											src: "1748:104:0"
    										}
    									],
    									id: 164,
    									name: "IfStatement",
    									src: "1691:161:0"
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
    																typeIdentifier: "t_address_payable",
    																typeString: "address payable"
    															},
    															{
    																typeIdentifier: "t_uint256",
    																typeString: "uint256"
    															}
    														],
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 42,
    														type: "function (address,uint256)",
    														value: "ClockOutTimeEvent"
    													},
    													id: 165,
    													name: "Identifier",
    													src: "1866:17:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "sender",
    														referencedDeclaration: null,
    														type: "address payable"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -15,
    																type: "msg",
    																value: "msg"
    															},
    															id: 166,
    															name: "Identifier",
    															src: "1884:3:0"
    														}
    													],
    													id: 167,
    													name: "MemberAccess",
    													src: "1884:10:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														lValueRequested: false,
    														member_name: "timestamp",
    														referencedDeclaration: null,
    														type: "uint256"
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: null,
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: -4,
    																type: "block",
    																value: "block"
    															},
    															id: 168,
    															name: "Identifier",
    															src: "1896:5:0"
    														}
    													],
    													id: 169,
    													name: "MemberAccess",
    													src: "1896:15:0"
    												}
    											],
    											id: 170,
    											name: "FunctionCall",
    											src: "1866:46:0"
    										}
    									],
    									id: 171,
    									name: "EmitStatement",
    									src: "1861:51:0"
    								}
    							],
    							id: 172,
    							name: "Block",
    							src: "1583:336:0"
    						}
    					],
    					id: 173,
    					name: "FunctionDefinition",
    					src: "1552:367:0"
    				},
    				{
    					attributes: {
    						documentation: null,
    						functionSelector: "5a9ece24",
    						implemented: true,
    						isConstructor: false,
    						kind: "function",
    						name: "mint_new",
    						overrides: null,
    						scope: 208,
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
    										name: "amount",
    										overrides: null,
    										scope: 187,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint",
    												type: "uint256"
    											},
    											id: 174,
    											name: "ElementaryTypeName",
    											src: "1943:4:0"
    										}
    									],
    									id: 175,
    									name: "VariableDeclaration",
    									src: "1943:11:0"
    								}
    							],
    							id: 176,
    							name: "ParameterList",
    							src: "1942:13:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 179,
    							name: "ParameterList",
    							src: "1973:0:0"
    						},
    						{
    							attributes: {
    								"arguments": null
    							},
    							children: [
    								{
    									attributes: {
    										argumentTypes: null,
    										overloadedDeclarations: [
    											null
    										],
    										referencedDeclaration: 346,
    										type: "modifier ()",
    										value: "onlyOwner"
    									},
    									id: 177,
    									name: "Identifier",
    									src: "1963:9:0"
    								}
    							],
    							id: 178,
    							name: "ModifierInvocation",
    							src: "1963:9:0"
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
    														referencedDeclaration: 972,
    														type: "function (address,uint256)",
    														value: "_mint"
    													},
    													id: 180,
    													name: "Identifier",
    													src: "1983:5:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														"arguments": [
    															null
    														],
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														isStructConstructorCall: false,
    														lValueRequested: false,
    														names: [
    															null
    														],
    														tryCall: false,
    														type: "address",
    														type_conversion: false
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: [
    																	null
    																],
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 333,
    																type: "function () view returns (address)",
    																value: "owner"
    															},
    															id: 181,
    															name: "Identifier",
    															src: "1989:5:0"
    														}
    													],
    													id: 182,
    													name: "FunctionCall",
    													src: "1989:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 175,
    														type: "uint256",
    														value: "amount"
    													},
    													id: 183,
    													name: "Identifier",
    													src: "1998:6:0"
    												}
    											],
    											id: 184,
    											name: "FunctionCall",
    											src: "1983:22:0"
    										}
    									],
    									id: 185,
    									name: "ExpressionStatement",
    									src: "1983:22:0"
    								}
    							],
    							id: 186,
    							name: "Block",
    							src: "1973:39:0"
    						}
    					],
    					id: 187,
    					name: "FunctionDefinition",
    					src: "1925:87:0"
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
    						name: "_payout",
    						overrides: null,
    						scope: 208,
    						stateMutability: "nonpayable",
    						virtual: false,
    						visibility: "private"
    					},
    					children: [
    						{
    							children: [
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "_to",
    										overrides: null,
    										scope: 207,
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
    											id: 188,
    											name: "ElementaryTypeName",
    											src: "2035:7:0"
    										}
    									],
    									id: 189,
    									name: "VariableDeclaration",
    									src: "2035:11:0"
    								},
    								{
    									attributes: {
    										constant: false,
    										mutability: "mutable",
    										name: "reward_val",
    										overrides: null,
    										scope: 207,
    										stateVariable: false,
    										storageLocation: "default",
    										type: "uint256",
    										value: null,
    										visibility: "internal"
    									},
    									children: [
    										{
    											attributes: {
    												name: "uint",
    												type: "uint256"
    											},
    											id: 190,
    											name: "ElementaryTypeName",
    											src: "2048:4:0"
    										}
    									],
    									id: 191,
    									name: "VariableDeclaration",
    									src: "2048:15:0"
    								}
    							],
    							id: 192,
    							name: "ParameterList",
    							src: "2034:30:0"
    						},
    						{
    							attributes: {
    								parameters: [
    									null
    								]
    							},
    							children: [
    							],
    							id: 193,
    							name: "ParameterList",
    							src: "2073:0:0"
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
    														referencedDeclaration: 917,
    														type: "function (address,address,uint256)",
    														value: "_transfer"
    													},
    													id: 194,
    													name: "Identifier",
    													src: "2083:9:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														"arguments": [
    															null
    														],
    														isConstant: false,
    														isLValue: false,
    														isPure: false,
    														isStructConstructorCall: false,
    														lValueRequested: false,
    														names: [
    															null
    														],
    														tryCall: false,
    														type: "address",
    														type_conversion: false
    													},
    													children: [
    														{
    															attributes: {
    																argumentTypes: [
    																	null
    																],
    																overloadedDeclarations: [
    																	null
    																],
    																referencedDeclaration: 333,
    																type: "function () view returns (address)",
    																value: "owner"
    															},
    															id: 195,
    															name: "Identifier",
    															src: "2093:5:0"
    														}
    													],
    													id: 196,
    													name: "FunctionCall",
    													src: "2093:7:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 189,
    														type: "address",
    														value: "_to"
    													},
    													id: 197,
    													name: "Identifier",
    													src: "2102:3:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 191,
    														type: "uint256",
    														value: "reward_val"
    													},
    													id: 198,
    													name: "Identifier",
    													src: "2107:10:0"
    												}
    											],
    											id: 199,
    											name: "FunctionCall",
    											src: "2083:35:0"
    										}
    									],
    									id: 200,
    									name: "ExpressionStatement",
    									src: "2083:35:0"
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
    														referencedDeclaration: 30,
    														type: "function (address,uint256)",
    														value: "PayoutMadeEvent"
    													},
    													id: 201,
    													name: "Identifier",
    													src: "2133:15:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 189,
    														type: "address",
    														value: "_to"
    													},
    													id: 202,
    													name: "Identifier",
    													src: "2149:3:0"
    												},
    												{
    													attributes: {
    														argumentTypes: null,
    														overloadedDeclarations: [
    															null
    														],
    														referencedDeclaration: 191,
    														type: "uint256",
    														value: "reward_val"
    													},
    													id: 203,
    													name: "Identifier",
    													src: "2154:10:0"
    												}
    											],
    											id: 204,
    											name: "FunctionCall",
    											src: "2133:32:0"
    										}
    									],
    									id: 205,
    									name: "EmitStatement",
    									src: "2128:37:0"
    								}
    							],
    							id: 206,
    							name: "Block",
    							src: "2073:99:0"
    						}
    					],
    					id: 207,
    					name: "FunctionDefinition",
    					src: "2018:154:0"
    				}
    			],
    			id: 208,
    			name: "ContractDefinition",
    			src: "314:1860:0"
    		}
    	],
    	id: 209,
    	name: "SourceUnit",
    	src: "0:2175:0"
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
    						name: "spender",
    						type: "address"
    					},
    					{
    						indexed: false,
    						internalType: "uint256",
    						name: "value",
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
    						indexed: false,
    						internalType: "uint256",
    						name: "value",
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
    						name: "value",
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
    			}
    		},
    		links: {
    		},
    		address: "0x757B747bB52BDda7EE97103D3e1dd7a3408cc57D",
    		transactionHash: "0x1b328fb258c2f44d81a0379e5d619f10eeec45b5b6a384b6153dc3614b7389b3"
    	}
    };
    var schemaVersion = "3.3.3";
    var updatedAt = "2021-01-17T14:48:05.997Z";
    var networkType = "ethereum";
    var devdoc = {
    	kind: "dev",
    	methods: {
    		"allowance(address,address)": {
    			details: "See {IERC20-allowance}."
    		},
    		"approve(address,uint256)": {
    			details: "See {IERC20-approve}. Requirements: - `spender` cannot be the zero address."
    		},
    		"balanceOf(address)": {
    			details: "See {IERC20-balanceOf}."
    		},
    		"clockStartTime()": {
    			details: "a user clocks in their start time"
    		},
    		"decimals()": {
    			details: "Returns the number of decimals used to get its user representation. For example, if `decimals` equals `2`, a balance of `505` tokens should be displayed to a user as `5,05` (`505 / 10 ** 2`). Tokens usually opt for a value of 18, imitating the relationship between Ether and Wei. This is the value {ERC20} uses, unless {_setupDecimals} is called. NOTE: This information is only used for _display_ purposes: it in no way affects any of the arithmetic of the contract, including {IERC20-balanceOf} and {IERC20-transfer}."
    		},
    		"decreaseAllowance(address,uint256)": {
    			details: "Atomically decreases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address. - `spender` must have allowance for the caller of at least `subtractedValue`."
    		},
    		"increaseAllowance(address,uint256)": {
    			details: "Atomically increases the allowance granted to `spender` by the caller. This is an alternative to {approve} that can be used as a mitigation for problems described in {IERC20-approve}. Emits an {Approval} event indicating the updated allowance. Requirements: - `spender` cannot be the zero address."
    		},
    		"name()": {
    			details: "Returns the name of the token."
    		},
    		"owner()": {
    			details: "Returns the address of the current owner."
    		},
    		"renounceOwnership()": {
    			details: "Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner."
    		},
    		"symbol()": {
    			details: "Returns the symbol of the token, usually a shorter version of the name."
    		},
    		"totalSupply()": {
    			details: "See {IERC20-totalSupply}."
    		},
    		"transfer(address,uint256)": {
    			details: "See {IERC20-transfer}. Requirements: - `recipient` cannot be the zero address. - the caller must have a balance of at least `amount`."
    		},
    		"transferFrom(address,address,uint256)": {
    			details: "See {IERC20-transferFrom}. Emits an {Approval} event indicating the updated allowance. This is not required by the EIP. See the note at the beginning of {ERC20}. Requirements: - `sender` and `recipient` cannot be the zero address. - `sender` must have a balance of at least `amount`. - the caller must have allowance for ``sender``'s tokens of at least `amount`."
    		},
    		"transferOwnership(address)": {
    			details: "Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner."
    		}
    	},
    	stateVariables: {
    		clock_in_times: {
    			details: "the clock in time for an account on a given day"
    		},
    		last_clock_in_day: {
    			details: "check the last clock out day for working. Used to ensure that only one clock out is done per day"
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
        return window.web3.utils.fromWei(wei);
    }

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
        console.log(endTime);
        UserInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { endTime });
        });
    }
    function _clockInListener(event) {
        const { timestamp } = event.returnValues;
        let startTime = ethTimestampToDate(timestamp);
        console.log(startTime);
        UserInfoStore.update((u) => {
            return Object.assign(Object.assign({}, u), { startTime });
        });
    }
    function _payoutListener(event) {
        const { value } = weiToCoinNumber(event.returnValues);
        alert(`You just got paid out ${value}`);
    }
    const clockInListener = wrapper(_clockInListener);
    const clockOutListener = wrapper(_clockOutListener);
    const payoutListener = wrapper(_payoutListener);

    const APIWriteable = writable({
        EvieCoin: undefined,
        address: "",
    });
    const UserInfoWriteable = writable({});
    const APIStore = {
        subscribe: APIWriteable.subscribe,
        update: APIWriteable.update,
    };
    const UserInfoStore = {
        subscribe: UserInfoWriteable.subscribe,
        update: APIWriteable.update,
    };
    async function initEvieCoin(web3) {
        await loadBlockchainData(web3);
    }
    APIWriteable.subscribe(async (api) => {
        if (api.EvieCoin) {
            const proms = [
                setEventListeners(api.EvieCoin, api.address),
                loadInitClockIn(api.EvieCoin, api.address),
                loadInitClockOut(api.EvieCoin, api.address),
            ];
            await Promise.all(proms);
        }
    });
    async function loadBlockchainData(web3) {
        const accounts = (await window.ethereum.send("eth_requestAccounts")).result;
        const networkId = await window.web3.eth.net.getId();
        const evieCoinData = EvieCoinContract.networks[networkId];
        let evieCoin;
        if (evieCoinData) {
            evieCoin = new web3.eth.Contract(EvieCoinContract.abi, evieCoinData.address);
            APIWriteable.set({
                EvieCoin: evieCoin,
                address: accounts[0],
            });
            const bal = await evieCoin.methods.balanceOf(accounts[0]).call();
            UserInfoWriteable.update((u) => {
                return Object.assign(Object.assign({}, u), { address: accounts[0], bal });
            });
        }
        else {
            window.alert("Evie Coin contract not deployed to detected network.");
            throw "Evie Coin contract not deployed to detected network.";
        }
    }
    async function loadInitClockIn(evieCoin, address) {
        try {
            console.log(address, evieCoin);
            const startTimeEth = await evieCoin.methods.clock_in_times(address).call();
            const startTime = ethTimestampToDate(startTimeEth);
            console.log(startTime);
            UserInfoWriteable.update((u) => {
                return Object.assign(Object.assign({}, u), { startTime });
            });
        }
        catch (error) {
            console.error(error);
            throw "Error getting initial clock in time";
        }
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
            UserInfoWriteable.update((u) => {
                return Object.assign(Object.assign({}, u), { endTime });
            });
        }
        catch (error) {
            console.error(error);
            throw "Error getting initial clock in time";
        }
    }
    async function setEventListeners(evieCoin, address) {
        evieCoin.events.ClockInTimeEvent({ user: address }, clockInListener);
        evieCoin.events.ClockOutTimeEvent({ user: address }, clockOutListener);
        evieCoin.events.PayoutMadeEvent({ _to: address }, payoutListener);
    }

    /* src/App.svelte generated by Svelte v3.31.2 */
    const file = "src/App.svelte";

    // (69:2) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Loading...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(69:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (43:2) {#if connected}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let p0;
    	let t0;
    	let t1_value = weiToCoinNumber(/*$UserInfoStore*/ ctx[1].bal) + "";
    	let t1;
    	let t2;
    	let div5;
    	let div2;
    	let p1;

    	let t3_value = (/*$UserInfoStore*/ ctx[1].endTime
    	? `Your clock out time: ${dateformat(/*$UserInfoStore*/ ctx[1].endTime, constants.dateFormatStr)}`
    	: "Looks like you have no last end time") + "";

    	let t3;
    	let t4;
    	let p2;
    	let t5;

    	let t6_value = (/*$UserInfoStore*/ ctx[1].startTime && /*$UserInfoStore*/ ctx[1].startTime.getTime() !== new Date(0).getTime()
    	? dateformat(/*$UserInfoStore*/ ctx[1].startTime, constants.dateFormatStr)
    	: "Please clock in to see your start time") + "";

    	let t6;
    	let t7;
    	let div3;
    	let button0;
    	let t9;
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
    			t3 = text(t3_value);
    			t4 = space();
    			p2 = element("p");
    			t5 = text("Start time: ");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			button0 = element("button");
    			button0.textContent = "Clock in";
    			t9 = space();
    			div4 = element("div");
    			button1 = element("button");
    			button1.textContent = "Clock out";
    			add_location(p0, file, 45, 8, 1756);
    			attr_dev(div0, "class", "col-8");
    			add_location(div0, file, 44, 6, 1728);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file, 43, 4, 1704);
    			add_location(p1, file, 50, 8, 1903);
    			add_location(p2, file, 58, 8, 2164);
    			attr_dev(div2, "class", "col-4");
    			add_location(div2, file, 49, 6, 1875);
    			add_location(button0, file, 65, 25, 2473);
    			attr_dev(div3, "class", "col-4");
    			add_location(div3, file, 65, 6, 2454);
    			add_location(button1, file, 66, 25, 2549);
    			attr_dev(div4, "class", "col-4");
    			add_location(div4, file, 66, 6, 2530);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file, 48, 4, 1851);
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
    			append_dev(div2, t4);
    			append_dev(div2, p2);
    			append_dev(p2, t5);
    			append_dev(p2, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, button0);
    			append_dev(div5, t9);
    			append_dev(div5, div4);
    			append_dev(div4, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*clockIn*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*clockOut*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$UserInfoStore*/ 2 && t1_value !== (t1_value = weiToCoinNumber(/*$UserInfoStore*/ ctx[1].bal) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$UserInfoStore*/ 2 && t3_value !== (t3_value = (/*$UserInfoStore*/ ctx[1].endTime
    			? `Your clock out time: ${dateformat(/*$UserInfoStore*/ ctx[1].endTime, constants.dateFormatStr)}`
    			: "Looks like you have no last end time") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*$UserInfoStore*/ 2 && t6_value !== (t6_value = (/*$UserInfoStore*/ ctx[1].startTime && /*$UserInfoStore*/ ctx[1].startTime.getTime() !== new Date(0).getTime()
    			? dateformat(/*$UserInfoStore*/ ctx[1].startTime, constants.dateFormatStr)
    			: "Please clock in to see your start time") + "")) set_data_dev(t6, t6_value);
    		},
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(43:2) {#if connected}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*connected*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "container");
    			add_location(div, file, 41, 0, 1658);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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

    function instance($$self, $$props, $$invalidate) {
    	let $APIStore;
    	let $UserInfoStore;
    	validate_store(APIStore, "APIStore");
    	component_subscribe($$self, APIStore, $$value => $$invalidate(5, $APIStore = $$value));
    	validate_store(UserInfoStore, "UserInfoStore");
    	component_subscribe($$self, UserInfoStore, $$value => $$invalidate(1, $UserInfoStore = $$value));
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

    	
    	let storageValue;
    	let connected = false;
    	let web3;

    	onMount(() => __awaiter(void 0, void 0, void 0, function* () {
    		const instance = yield loadWeb3();
    		window["web3"] = web3 = instance;
    		yield initEvieCoin(web3);
    		$$invalidate(0, connected = true);
    	}));

    	function clockIn() {
    		return __awaiter(this, void 0, void 0, function* () {
    			yield $APIStore.EvieCoin.methods.clockStartTime().send({ from: $UserInfoStore.address });
    		});
    	}

    	function clockOut() {
    		return __awaiter(this, void 0, void 0, function* () {
    			yield $APIStore.EvieCoin.methods.clockEndTime().send({ from: $UserInfoStore.address });
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		__awaiter,
    		dateformat,
    		loadWeb3,
    		onMount,
    		constants,
    		APIStore,
    		initEvieCoin,
    		UserInfoStore,
    		weiToCoinNumber,
    		storageValue,
    		connected,
    		web3,
    		clockIn,
    		clockOut,
    		$APIStore,
    		$UserInfoStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("storageValue" in $$props) storageValue = $$props.storageValue;
    		if ("connected" in $$props) $$invalidate(0, connected = $$props.connected);
    		if ("web3" in $$props) web3 = $$props.web3;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [connected, $UserInfoStore, clockIn, clockOut];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
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
