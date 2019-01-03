---
title: uv_link_t - libuv pipeline
date: 2016-08-15
---

## Preface

Writing servers/clients in C could be non-trivial. Even with the help of such
powerful (and awesome dinosaur) libraries as [libuv][0], it still takes lots of
effort and boilerplate code to create real world applications.

Some of this boilerplate code comes from the use of the widespread protocols
like TLS (SSL) and HTTP. While there are popular implementations available
as an Open Source libraries ([OpenSSL][1], [http-parser][2]), they still either
provide very abstract interface (like [http-parser][2]), or an API to transfer
the responsibility of the networking to the library itself (like `SSL_set_fd()`
in [OpenSSL][1] and Amazon's [s2n][3]). Such abstract nature makes them easier
to embed, but the adaptor code inevitably tend to appear in the particular
applications.

## Precursor - StreamBase

[libuv][0] is hardly an exception, and [node.js][4] and [bud][5]'s TLS
implementation is a vivid evidence of this. However, in a contrast to [bud][5],
[node.js][4] TLS code lives off on an abstraction called [StreamBase][6]. By
separating [libuv][0]-specific adaptor code into a generic C++ class, we have
created a foundation for a simpler and reusable implementation of any other
protocol! See, for example, recent [node_http_parser.cc][7] which uses only
a minor amount of power available through the means of [StreamBase][6], but
nevertheless provides [10-20%][8] performance improvement since its inception.

This implementation has some major drawbacks, preventing its wider adoption
outside of the node.js core:

* C++ headers: lots of virtual classes, complex API, non-trivial inheritance
  scheme
* High internal dependence on the node.js core itself

Because of these issues (and my own limitations) [StreamBase][6] has defied all
attempts to make it public.

## uv_link_t

Heavily inspired by the success of [StreamBase][6] in the node.js core, a
[uv_link_t][9] library was created. It has lots of similarities with the
[StreamBase][6], but it is:

* Implemented in C: self-documented structures, C-cast based inheritance, etc
* Standalone library

The API is based on the [uv_stream_t][10] and shouldn't come as a big surprise
to the users, since [uv_link_t][9] is intended to be used together with
[libuv][0].

Here is a visual explanation of how [uv_link_t][0] works:

![uv_link_source_t][17]

## Examples

Before we take a peek at the APIs, let's discuss what can be done with
[uv_link_t][9]. Technically, any stream-based (i.e. anything that uses
`uv_stream-t`) protocol can be implemented on top of it. Multiple protocols can
be chained together (that's why it is called `uv_`**link**`_t`!), provided that
there is an implementation:

`TCP <-> TLS <-> HTTP <-> WebSocket`.

This chaining works in a pretty transparent way, and every segment of it can be
observed without disturbing the data flow and operation of the other links.

Existing protocols:

* [uv_ssl_t][11] - TLS, based on OpenSSL's API
* [uv_http_t][12] - low-level HTTP/1.1 implementation, possibly incomplete

Small demo-project:

* [file-shooter][13] - dumb-simple HTTPS server based on both [uv_ssl_t][11] and
  [uv_http_t][12]

Note that all these projects, including [uv_link_t][9] itself are supposed to
be built with a [gypkg][14], which is a subject for a future blog post.

## API

The backbone of the API is a `uv_link_t` structure:

```c
#include "uv_link_t.h"

static uv_link_methods_t methods = {
  /* To be discussed below */
};

void _() {
  uv_link_t link;

  uv_link_init(&link, &methods);

  /* ... some operations */
  uv_link_close(&link, close_cb);
}
```

In the most of the cases a first link should be an `uv_link_source_t`. It
consumes an instance of `uv_stream_t`, and propagates reads and writes from
the whole chain of links connected to it.

```c
uv_link_source_t source;

uv_stream_t* to_be_consumed;
uv_link_source_init(&source, to_be_consumed);
```

As mentioned before, links can be chained together:

```c
uv_link_t a;
uv_link_t b;

/* Initialize `a` and `b` */
uv_link_chain(/* from */ a, /* to */ b);
```

This `uv_link_chain` call means that the data emitted by `a` will be passed as
an input to `b`, and the output of `b` will written to `a`.

Speaking of input/output, the API is pretty similar to [libuv][0]'s:

```c
int uv_link_write(uv_link_t* link, const uv_buf_t bufs[],
                  unsigned int nbufs, uv_stream_t* send_handle,
                  uv_link_write_cb cb, void* arg);

int uv_link_read_start(uv_link_t* link);
int uv_link_read_stop(uv_link_t* link);

void fn() {
  link->alloc_cb = /* something */;
  link->read_cb = /* something */;
}
```

Please check the [API docs][15] for further information on particular methods
and structures (likes `uv_link_source_t` and `uv_link_observer_t`).

There is also an [Implementation guide][16] for implementing custom types of
`uv_link_t`.

## Error reporting

Having multiple independent implementations of `uv_link_t` interface, it is a
natural question to ask: how does `uv_link_t` handle error code conflict?

The answer is that all error codes returned by `uv_link_...` methods are
actually prefixed with the index of the particular link in a chain. Thus, even
if there are several similar links in a chain, it is possible to get the pointer
to the `uv_link_t` instance that have emitted it:

```c
int uv_link_errno(uv_link_t** link, int err);
const char* uv_link_strerror(uv_link_t* link, int err);
```

## Foreword: gypkg

[gypkg][14] is recommended to be used when embedding `uv_link_t` in the C
project. There are not too many source files to put into a `Makefile` or some
other build file, but the convenience that [gypkg][14] provides, pays off very
quickly!

### Installation (node.js v6 is required):

```sh
npm install -g gypkg
```

### Init

```sh
mkdir project
cd project
gypkg init
```

### Adding `uv_link_t` as a dependency

```sh
vim project.gyp
```

```python
{
  "variables": {
    "gypkg_deps": [
      "git://github.com/libuv/libuv.git@^1.9.0 => uv.gyp:libuv",
      "git://github.com/indutny/uv_link_t@^1.0.0 [gpg] => uv_link_t.gyp:uv_link_t",
    },
  },

  # Some other GYP things
}
```

### Building

```sh
gypkg build
ls -la out/Release
```

[0]: https://github.com/libuv/libuv
[1]: https://github.com/openssl/openssl
[2]: https://github.com/nodejs/http-parser
[3]: https://github.com/awslabs/s2n
[4]: https://github.com/nodejs/node/blob/master/src/tls_wrap.cc
[5]: https://github.com/indutny/bud/blob/master/src/client.c
[6]: https://github.com/nodejs/node/blob/master/src/stream_base.h
[7]: https://github.com/nodejs/node/blob/29228c4089431d0e65749421f43aafd05694f376/src/node_http_parser.cc#L472-L486
[8]: https://github.com/nodejs/node/pull/2355
[9]: https://github.com/indutny/uv_link_t
[10]: http://docs.libuv.org/en/v1.x/stream.html
[11]: https://github.com/indutny/uv_ssl_t
[12]: https://github.com/indutny/uv_http_t
[13]: https://github.com/indutny/file-shooter
[14]: https://github.com/gypkg/gypkg
[15]: https://github.com/indutny/uv_link_t/blob/master/docs/api.md
[16]: https://github.com/indutny/uv_link_t/blob/master/docs/implementation-guide.md
[17]: /images/uv_link_source_t.svg
