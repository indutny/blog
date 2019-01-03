importScripts('/_nuxt/workbox.4c4f5ca6.js')

workbox.precaching.precacheAndRoute([
  {
    "url": "/_nuxt/4ec8f16511dd6bdabcd7.js",
    "revision": "b2eb214b9da71efdddb1abff998a1588"
  },
  {
    "url": "/_nuxt/60d6fca0a45e57d2e524.js",
    "revision": "d781b5a8dfe4551130e6240e3cf5a90c"
  },
  {
    "url": "/_nuxt/68ed4414fa84df794c60.js",
    "revision": "e48a537e120d072085a29acdfe972c02"
  },
  {
    "url": "/_nuxt/9d6a1117aeebb6127a4e.js",
    "revision": "b3ea435ce674a84f481cee45905b9a2f"
  },
  {
    "url": "/_nuxt/bf43b59f30dc6ef31874.js",
    "revision": "a67def040a018a3b978270a3db0e9b7b"
  },
  {
    "url": "/_nuxt/c43d69b19bb83ad2f7b2.js",
    "revision": "c87179bb46127a15768146aa3d9c4e16"
  },
  {
    "url": "/_nuxt/ff10335471717f06e53e.js",
    "revision": "80e66b8858d7f644c008042be762a270"
  }
], {
  "cacheId": "blog",
  "directoryIndex": "/",
  "cleanUrls": false
})

workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(new RegExp('/_nuxt/.*'), workbox.strategies.cacheFirst({}), 'GET')

workbox.routing.registerRoute(new RegExp('/.*'), workbox.strategies.networkFirst({}), 'GET')
