/**
 * Route Object
 * 
 * @typedef Route
 * @property {string} method HTTP request method
 * @property {string} url URL String
 * @property {PagesFunction[]} handlers Array of handler functions
 */
export interface Route {
    method: string;
    url: string;
    handlers: PagesFunction[];
}

/**
 * Router
 * 
 * @public
 * @class
 */
export default class Router {

    /**
     * Router Array
     * 
     * @protected
     * @type {Route[]}
     */
    protected routes: Route[] = [];

    /**
     * Middleware Array
     * 
     * @protected
     * @type {Route[]}
     */
    protected middleware: Route[] = [];

    /**
     * Debug Mode
     * 
     * @protected
     * @type {boolean}
     */
    protected debugMode: boolean = false;

    /**
     * Register DELETE route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestDelete<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('DELETE', url, isMiddleware, handlers as any);
    }

    /**
     * Register GET route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestGet<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('GET', url, isMiddleware, handlers as any);
    }

    /**
     * Register HEAD route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestHead<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('HEAD', url, isMiddleware, handlers as any);
    }

    /**
     * Register OPTIONS route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestOptions<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('OPTIONS', url, isMiddleware, handlers as any);
    }

    /**
     * Register PATCH route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestPatch<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('PATCH', url, isMiddleware, handlers as any);
    }

    /**
     * Register POST route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestPost<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('POST', url, isMiddleware, handlers as any);
    }

    /**
     * Register PUT route
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequestPut<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('PUT', url, isMiddleware, handlers as any);
    }

    /**
     * Register route, ignoring method
     * 
     * @param {string} url 
     * @param {boolean} isMiddleware 
     * @param  {PagesFunction[]} handlers 
     * @returns {Router}
     */
    public onRequest<
        Env = unknown,
        Params extends string = any,
        Data extends Record<string, unknown> = Record<string, unknown>
    >(url: string, isMiddleware: boolean, ...handlers: PagesFunction<Env, Params, Data>[]): Router {
        return this.register('*', url, isMiddleware, handlers as any);
    }

    /**
     * Debug Mode
     * 
     * @param {boolean} [state=true] Whether to turn on or off debug mode (default: true)
     * @returns {Router}
     */
    public debug(state: boolean = true): Router {
        this.debugMode = state;
        return this;
    }

    /**
     * Register route
     * 
     * @private
     * @param {string} method HTTP request method
     * @param {string} url URL String
     * @param {boolean} isMiddleware 
     * @param {PagesFunction[]} handlers Arrar of handler functions
     * @returns {Router}
     */
    private register(method: string, url: string, isMiddleware: boolean, handlers: PagesFunction[]): Router {
        (isMiddleware ? this.middleware : this.routes).push({
            method,
            url,
            handlers
        });
        return this;
    }

    /**
     * Get Route by request
     * 
     * @private
     * @param {Request} request
     * @returns {Router | undefined}
     */
    private getRoute(request: Request): Route | undefined {
        const url = new URL(request.url);
        const pathArr = url.pathname.split('/').filter(i => i);
        const a = this.routes.filter((r) => {
            if (r.method === request.method || r.method === '*') { return true; }
            return false;
        }).sort((a, b) => {
            if (a.method === '*' && b.method !== '*') { return -1; }
            if (a.method !== '*' && b.method === '*') { return 1; }
            return 0;
        }).filter(r => {
            const routeArr = r.url.split('/').filter(i => i);
            if (routeArr.length !== pathArr.length) { return false; }
            return pathArr.every((route, i) => {
                if (route === routeArr[i]) {
                    return true;
                } else if (routeArr[i] && routeArr[i].match(/^\[[a-zA-Z0-9]+\]$/)) {
                    return true;
                } else if (i >= pathArr.length && routeArr.slice(-1)[0].match(/^\[\[[a-zA-Z0-9]+\]\]$/)) {
                    return true;
                }
                return false;
            });
        });
        if (a.length > 1) {
            const b = a.pop()!;
            return { ...b, handlers: [...a.flatMap(i => i.handlers), ...b.handlers] };
        }

        return a[0];
    }

    /**
     * Get middleware by request
     * 
     * @private
     * @param {Request} request
     * @returns {Router[]}
     */
    private getMiddleware(request: Request): Route[] {
        const url = new URL(request.url);
        const pathArr = url.pathname.split('/').filter(i => i);
        return this.middleware.filter((r) => {
            if (r.method === request.method || r.method === '*') { return true; }
            return false;
        }).filter(r => {
            const routeArr = r.url.split('/').filter(i => i);
            return routeArr.every((route, i) => {
                if (route === pathArr[i]) {
                    return true;
                } else if (pathArr[i] && /^\[[a-zA-Z0-9]+\]$/.test(route)) {
                    return true;
                }
                return false;
            }) || (routeArr.length === pathArr.length && /^\[\[[a-zA-Z0-9]+\]\]$/.test(routeArr.slice(-1)[0]));
        });
    }

    /**
     * Handle requests
     * @param {Request} ctx
     * @returns {Promise<Response>}
     */
    public async handle<Env, P extends string, Data>(ctx: EventContext<Env, P, Data>): Promise<Response> {
        try {
            if (['POST', 'PUT', 'PATCH'].includes(ctx.request.method)) {
                ctx.request = new Request(ctx.request, { body: ctx.request.body });
            }
            const route = this.getRoute(ctx.request);
            const handlers = [...this.getMiddleware(ctx.request).flatMap((r) => r.handlers), ...(route ? route.handlers : [])];
            let prevIndex = -1;
            const runner = async (index: number): Promise<Response> => {
                if (index === prevIndex)
                    throw new Error('next() called multiple times');
                prevIndex = index;
                if (typeof handlers[index] === 'function') {
                    const params = new URL(ctx.request.url).pathname.split('/');
                    params.filter(i => i).map((p, i) => {
                        const routeArr = route?.url.split('/').filter(i => i);
                        const match1 = routeArr?.[i]?.match(/^\[\[([a-zA-Z0-9]+)\]\]$/);
                        const match2 = routeArr?.[i]?.match(/^\[([a-zA-Z0-9]+)\]$/);
                        if (match1) {
                            (ctx.params as { [key: string]: string | string[]; })[match1[1]] = params.slice(i);
                        } else if (match2) {
                            (ctx.params as { [key: string]: string | string[]; })[match2[1]] = p;
                        }
                    });
                    return handlers[index]({ ...ctx, next: async () => runner(index + 1) } as EventContext<Env, P, any>);
                }
                if (typeof handlers[index] === 'undefined') {
                    return new Response(this.debugMode ? 'Handler not found!' : null, { status: 404 });
                }
                return runner(index + 1);
            };
            return runner(0);
        } catch (err) {
            console.error(err);
            return new Response(this.debugMode && err instanceof Error ? err.stack : '', { status: 500 });
        }
    }
}
