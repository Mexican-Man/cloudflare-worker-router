### Fork of [tsndr/cloudflare-worker-router](https://github.com/tsndr/cloudflare-worker-router)

# Cloudflare Workers Pages

This package aims to mildly recreate the workflow of Cloudflare Pages [Functions](https://developers.cloudflare.com/pages/platform/functions/). I had to migrate an API from Pages to Workers, due to its lack of bindings for features available in Workers, despite them running on the same platform. I found [tsndr/cloudflare-worker-router](https://github.com/tsndr/cloudflare-worker-router), but I didn't quite understand how to take advantage of routes and middleware properly. I've gone and refactored the package to use `PagesFunction` from `@cloudflare/workers-types`, rather than the types types provided by tsndr.

It's worth noting that this does strip some functionality from the parent repository, because I'm trying to recreate Pages Functions as faithfully as possible.



## Contents

- [Usage](#usage)
- [Reference](#reference)
- [Setup](#setup)


## Usage

### Simple Example

```javascript
import Router from '@mexican-man/cloudflare-worker-pages'

// Initialize router
const router = new Router()

// Register middleware
router.onRequest("/v1", true, ({ request, next }) => {
  if (request.headers.has("Authorization")) {
    return next();
  }
  return new Response(401);
});

// Simple get
router.onRequestGet('/v1/user', () => {
  return new Response(
    JSON.stringify({
      data: {
        id: 1,
        name: 'John Doe'
      }
    });
  );
});

// Post route with url parameter
router.onRequestPost('/user/[id]', ({ params }) => {
  // using [] or [[]] is supported 
  const userId = params.id
  
  // Do stuff...
  
  if (errorDoingStuff) {
    return new Response(
      JSON.stringify({
        error: 'User did stupid stuff!'
      }, { status: 200 }));
  }
  
  return new Response(null, { status: 204 })
})

// Delete route using a middleware
router.onRequestDelete('/user/[id]', ({ params, next }) => {

  if (!apiTokenIsCorrect) {
    return new Response(null, { status: 401 })
  }
  
  await next()
}, (req, res) => {

  const userId = params.id
  
  // Do stuff...
})

// Listen Cloudflare Workers Fetch Event
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return Router.handle({
      request, env, ...ctx, next: () => ({} as Promise<Response>), data: {}, params: {},
      functionPath: ''
    });
  }
};
```


## Reference

### `router.debug([state = true])`

Enable or disable debug mode. Which will return the `error.stack` in case of an exception instead of and empty `500` response. Debug mode is disabled by default.


#### `state`
State is a `boolean` which determines if debug mode should be enabled or not (default: `true`)


### `router.onRequest([...PagesFunction])`

Register a global middleware handler.


### `router.onRequest(url, isMiddleware, [...PagesFunction])`
### `router.onRequestDelete(url, isMiddleware,  [...PagesFunction])`
### `router.onRequestGet(url, isMiddleware, [...PagesFunction])`
### `router.onRequestHead(url, isMiddleware, [...PagesFunction])`
### `router.onRequestOptions(url, isMiddleware, [...PagesFunction])`
### `router.onRequestPatch(url, isMiddleware, [...PagesFunction])`
### `router.onRequestPost(url, isMiddleware, [...PagesFunction])`
### `router.onRequestPut(url, isMiddleware, [...PagesFunction])`

#### `url` (string)

The URL starting with a `/`.
Supports the use of dynamic parameters, denoted by `[id]` for a single slug, and `[[id]]`, to match every following directory, which would results in `params.id` containing `string` or `string[]` respectively.

#### `isMiddleware` (boolean)
Whether or not this/these handlers should be treated as middleware (they should chain onto deeper requests).

#### `PagesFunction`
See [Cloudflare docs](https://developers.cloudflare.com/pages/platform/functions/#using-typescript) for more info.

## Setup

---

### **[Wrangler2](https://github.com/cloudflare/wrangler2#readme)**

Please follow Cloudflare's [Get started guide](https://developers.cloudflare.com/workers/get-started/guide/), then install the router using this command

```bash
npm i @mexican-man/cloudflare-worker-page
```

and replace your `index.ts` / `index.js` with one of the following scripts

<details>
<summary>TypeScript (<code>src/index.ts</code>)</summary>

```typescript
import Router from '@tsndr/cloudflare-worker-router'

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  ASSETS: { fetch: typeof fetch; };
}

const router = new Router()

// TODO: add your routes here

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return Router.handle({
      request, env, ...ctx, next: () => ({} as Promise<Response>), data: {}, params: {},
      functionPath: ''
    });
  }
};
```
</details>

<details>
<summary>JavaScript (<code>src/index.js</code>)</summary>

```javascript
import Router from '@tsndr/cloudflare-worker-router'

const router = new Router()

// TODO: add your routes here

export default {
  async fetch(request, env, ctx) {
    return Router.handle({
      request, env, ...ctx, next: () => ({}), data: {}, params: {},
      functionPath: ''
    });
  }
};
```
</details>

Of course, this doesn't quite let you maintain the file structure of the `functions` folder from Pages. To substitute that, you can `export` your endpoint functions other files, then import and register those in your `index.js/ts` file.

`index.ts`
```ts
import * as Users from '@routes/v1/users/[id]';

export interface Env {
  // ...
}

export const router = new Router()
router.onRequestGet('/v1/users/[id]', false, ...(Array.isArray(endpoint) ? endpoint : [endpoint]))
```

`@routes/v1/users/[id]`
```ts
import type { Env } from '../../../../index.ts';

export const onRequestGet: PagesFunction<Env> = async () => {
    return new Response();
};
```

If using a lot of files, I'd suggest automating this.