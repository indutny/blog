---
title: Diving into C++ internals of node
date: 2015-05-16
---

## Intro

There is nothing to be scared about in the C++ internals of the project,
especially in internals of [io.js][9] and [node.js][10].

If you ever tried to optimize JavaScript code to squeeze out every possible
performance or memory usage improvement out of it - you already wrote some C++
code.

Many blogs, workshops mention JavaScript optimizations, and some of the popular
suggestions are:

### Hidden Classes

Declare all properties in the constructor to avoid creating extra
"hidden classes". This makes them pretty much the same as a C structures,
or C++ classes, where properties are declared ahead of time to help the
compiler optimize access to them.

Example:

```javascript
function Point(x, y, z) {
  this.x = x
  this.y = y
  this.z = z
}
```

Similar code in C++:

```c
class Point {
 public:
  double x;
  double y;
  double z;
};
```

### Avoid Polymorphism

Avoid storing different types of values in a variables, and avoid passing
different types of values as an arguments to the function. This principle could
also be called "Make your code monomorphic", or "don't mess with Compiler".
This makes code look like as it has static typing, which is what we do in
C++.

```javascript
function add(x, y) {
  return x + y;
}

add(0, 1); // <- good
add('foo', 'bar'); // <- polymorphism!
```

Compare to:

```c
int add(int x, int y) {
  return x + y;
}
```

### Cache and Reuse

Cache and reuse instances of objects that are expensive to create and are
allocated often. This is one is similar to manual memory allocation in C++.

```javascript
function Parser() {
}

Parser.freelist = [];

Parser.get = function() {
  if (this.freelist.length)
    return this.freelist.pop();
  return new Parser();
};

Parser.prototype.release = ...;
```

In C++:

```c
Parser* p = new Parser();
delete p;
```

To conclude, even if you never wrote C++ code, you actually very likely did it
in JS.

It is no surprise we use C++ in io.js/node.js. After all, V8 is written in C++
and it provides only a limited set of ECMAScript JavaScript APIs. They are
definitely cool, but if you got used to `setTimeout()` / `clearTimeout()` -
you'll be pretty disappointed to use just plain ECMA.

Our C++ layer lives on top of the event-loop and provides all sorts of APIs:
from net sockets to dns queries, from file system events to the zlib bindings.
Which is the main reason why node.js was created in the first place!

## Short History of C++ layer

![History of git blame](/images/history_of_git_blame.jpg)

To better understand all of these, and to ease the contribution process - it
might be a good idea to start with the history of the subject. Luckily, from its
inception, node.js is using VCS, in particular git, so the history of the
development might be revealed by running `git log` and `git blame` on it.

Briefly, `git log deps/v8` - has the history of v8 fighting us, and
`git log src/` - has the history of us fighting v8.

## Very first version

Jokes aside, everything started from [61890720][4] commit. The commit log
just says:

    add readme and initial code

Unfortunately, we can't elaborate much from it, and need to figure out the
details ourselves. What do we see there?

* [libebb][0] - which was used as an HTTP parser. Ryan used the code
  from the [Ebb][3] server that he has previously written for Ruby
* [liboi][1]- which was as a TCP server framework on top of the [libev][2].
  liboi stands for `Library for Output Input`

So the first code (that actually started compiling only at [7b7ceea][5]) only
had one HTTP server and supplied JavaScript source code was just a handler for
it.

```javacsript
function Process(request) {
  if (options.verbose) {
    log("Processing " + request.host +
        request.path +
        " from " + request.referrer +
        "@" + request.userAgent);
  }
  if (!output[request.host])
    output[request.host] = 1;
  else
    output[request.host]++
}
```

How was it organized internally?

There was a `server.cc` file which was reading the command line options, loading
the JavaScript source file, feeding all of these into V8, and starting the HTTP
server.

Second C++ file was `js_http_request_processor.cc` and it was responsible for
invoking the JavaScript http request handler. Not that much for a separate C++
file, right?

It wasn't working that much at that point, and didn't have any of
functionality that is provided today. So let's conclude and move on from it
quickly.

This version is characterized by following:

* One file to setup V8 and let JavaScript know about command-line arguments
* HTTP server fully implemented in C/C++, not invoking the JavaScript for any
  networking activities
* One C++ instance per every incoming request, this instance maps some of the
  HTTP fields (like host, url, method) to the JavaScript object.

The last bullet point is very important to note: the C++ instance <-> JS object
mapping is a building brick of all future releases of node.js (including the
present one).

## 064c8f02

Now we quickly jump to [064c8f02][6]. The commit log says:

    Use ObjectWrap base class for File, Socket, Server.

And this is the point where node.js has introduced one API to wrap all objects.

`net.Server`, `net.Socket`, and `File` C++ classes are children of this
`ObjectWrap` class. Which means that for every instance of them -
there will be one instance of a JS object. Invoking methods on this JS object
will invoke C++ methods on the corresponding C++ class, and the constructor
itself is a C++ class constructor.

There are now different files for different parts of the provided API:

* `src/node.cc` to set up C++ libraries and invoke `src/main.js` which
  loads the script file and does some JavaScript initialization. (At this commit
  we started to write as much code as possible in JavaScript, and leave
  the rest in the C++ land. This pattern is used in io.js and node.js now too)
* `src/http.cc` - http server API, Connection, HttpRequest objects
* `src/file.cc`, `src/file.js` - future `fs` module.
  `src/file.js` consists of the API abstractions for the C++ layer,
  basically the same thing as with `src/node.cc` and `src/main.js`
* `src/process.cc` has only `exit()` method so far, will evolve into the
  `process` object
* `src/timers.cc` is about `setTimeout`/`setInterval`

Just a side note: HTTP server is still provided by [liboi][1], and node.js is
using [libev][2].

## v0.2

There was lots of growing and maturing from that commit to the v0.2, and most
notable of them were about separating the JS parts from the C++ ones,
adding CommonJS support, and tons of new modules! The file structure is
beginning to look like what we have now:

* `lib/` folder for all JavaScript CommonJS modules
* `src/` for their C++ counterparts
* `deps/` for all dependencies: v8, http-parser, c-ares (for async DNS),
  libeio (for async FS), and libev (for async networking and auxiliary stuff)

Previously barely used through the `src/`, `ObjectWrap` now became a public API,
which helped polish it out a lot and improved our core use case as well.

Very importantly, in [064c8f02][6] all C++ interfaces were global objects. In
v0.2 they are provided by `process.binding` and are thus not directly visible to
the user's code.

For example, `process.binding('fs')`:

```javascript
> process.binding('fs');
{ access: [Function: access],
  close: [Function: close],
  open: [Function: open],
  ...lots of stuff...
```

returns lots of C++ methods and classes that are heavily used for interoperation
between C++ and JS in `lib/fs.js`. Similar stuff is done for the rest of the
`lib/` modules.

## v0.6

Just a short note: `libev` was removed and replaced by [libuv][7]. A product of
lots of work by Ben Noordhuis, Bert Belder, Ryan Dahl, and others!

The v0.6 version is a major milestone in evolution of node.js. Partly because
Windows is now in the list of the officially supported platforms, partly because
we have our own single event-loop platform that supports both async File System
and async networking operations.

## v0.10

Good, stable, but boring...

## v0.12 and io.js

Lots of new stuff! :)

Mainly, we have outgrown the `ObjectWrap` to accommodate the tracing API (which
is still needs lots of rework, AFAIK). The hip thing now is `AsyncWrap` which is
in many ways the same thing, but now is attached to some particular domain of
operation (i.e. http, dns, tls) and which might have the another `AsyncWrap` as
a parent. Note that `ObjectWrap` lives in `src/node_object_wrap.h`, and
`AsyncWrap` in `src/async-wrap.h`.

This is now the present point of the node.js evolution, and I would like to
stop with the Software Archeology at this point.

## Interoperation, handles, wraps, and unicorns!

We are finally ready to dive into the C++ internals, and explore them in a
greater detail.

As we already figured out - whole APIs provided by the node.js/io.js live in
two folders: `lib` and `src`. `lib` holds the core modules, `src` holds their
C++ counterparts.

When you call `require('fs')` - it does nothing but just executes the contents
of the `lib/fs.js` file. No magic here.

Now comes the interesting part, JavaScript is not capable of file system
operations, nor it is capable of networking. This is actually for the
best! (You don't want your browser to mess up whole file system,
right?) So when you do `fs.writeFileSync`, or when you are calling
`http.request()` there is a lot of low-level C++ stuff happening outside of the
JS-land.

While the `fs` module is quite simple to explain, it is quite boring too. After
all, in most of the cases it is just using number to represent the opened
file (so called `file descriptor`), and it is passing this number around:
from C++ to JS, and from JS to C++. Nothing interesting, let's move on!

Certainly much more attractive is the `net` module. We create sockets, get
the `connect` events, and expect the `.write()` callbacks to be eventually
invoked. All of these should be powered by the C++ machinery!

Here is where most of the interoperation is happening. The
`tcp_wrap` and `stream_wrap` bindings (remember, `process.binding()`, right?)
provide very useful classes for JS-land: TCP, TCPConnectWrap, WriteWrap,
ShutdownWrap.

* `TCP` holds the TCP socket and provides methods for writing and reading
  stuff
* `*Wrap` objects are what you pass to the `TCP` methods when you expect
  some async action to happen, and need to receive notification (callback) on
  their completion.

For example, the normal workflow for `net.connect()` follows:

* Create `TCP` instance in `lib/net.js`, store it in the `_handle` property of
  the `net.Socket` object
* Parse all arguments to `net.connect()`
* Create `TCPConnectWrap` instance (usually named `req`)
* Invoke `.connect()` method with `req, port, host`
* Get `req.oncomplete` function invoked eventually, once the connection was
  established, or once the kernel reported an error

In conclusion: most of the C++ classes are either handles, or requests.
Requests are very temporary and never outlive the handle that they are bound to,
while the handles are something that live much longer (i.e. for the entire life
time of the TCP connection).

Speaking of the file structure: `TCP` is represented by the `TCPWrap` class in
`src/tcp_wrap.cc`, `TCPConnectWrap` lives in the same place, and `WriteWrap`
is in the `stream_base.cc` file (in io.js).

## Structure of C++ files

But how does the C++ provide this classes to JavaScript?

Each binding has a `NODE_MODULE_CONTEXT_AWARE_BUILTIN` macro that registers it
in the `node.cc`. This has the same effect as following JavaScript snippet:

```javascript
modules[moduleName] = {
  initialized: false,
  initFn: moduleInitFn
};
```

When `process.binding('moduleName')` is invoked, `node.cc` looks up the proper
internal binding in this hashmap and initializes it (if it wasn't previously
initialized) by calling the supplied function.

```javascript
process.binding = function(moduleName) {
  var module = modules[moduleName];
  if (module.initialized)
    return module.exports;

  module.exports = {};
  module.initFn(module.exports);
  return module.exports;
};
```

This initialization function receives `exports` object as an input, and exports
the methods and classes to it in pretty much the same way as you normally do
in CommonJS modules.

Each of the exported classes are bound to some C++ classes, and most of them are
actually derived from the `AsyncWrap` C++ class.

The Handle instances are destroyed automatically by V8's GC (once they are
closed in JS), and the Wraps are manually destroyed by the Handle, once they are
not used anymore.

Side-note:

there are two types of references to the JS
objects from C++ land: normal and weak. By default `AsyncWrap`s are referencing
their objects in a `normal` way, which means that the JS objects representing
the C++ classes won't be garbage collected until C++ class will dispose the
reference. The weak mode is turned on only when the `MakeWeak` is called
somewhere in C++. This might be very useful when debugging memory leaks.

## Small exam

### Situation

You debug some io.js/node.js issue, and find that it is crashing when
instantiating a class provided by `process.binding('broken')`. Where will you
attempt to search for the C++ source code of that class?

### Answer

Somewhere in `src/`. Find
`NODE_MODULE_CONTEXT_AWARE_BUILTIN(broken, ...)` and it is most like going to be
in `src/broken_something.cc`.

## C++ Streams

Now comes one of my recent obsessions. The C++ Stream API.

It is a established fact for me that exposing the building blocks of APIs helps
to renovate, reshape and make them better *a lot better*. One of such thing
that I was always keen to re-do was a `StreamWrap` instance.

It was ok-ish in v0.10, but when we moved TLS (SSL) implementation into C++
land it changed dramatically... and, honestly saying, not in a good way.

The previously singular `StreamWrap` instance, now became a monster that was
capable of passing the incoming data elsewhere, skipping the JavaScript
callbacks completely and doing some dark-magic OpenSSL machinery on top of it.
The implementation worked like a charm, providing much better TLS performance,
but the source code became cluttered and rigid.

This "move-parsing-to-elsewhere" thing reminded me a lot about the
`stream.pipe` that we had for JavaScript streams for ages. The natural thing to
do about it was to introduce something similar in the C++ land too. This is
exactly what was done in io.js, and the results of this live in
`src/stream_base.cc`.

## Next step with the C++ Stream APIs

Now we have a very general implementation of this thing that could be reused in
many places. The first thing that I expect will be using this might be an
HTTP2 stream. To do it in core, we should do it in user-land first, and it could
be accomplished only by exposing the C++ Stream API, in the same way as we did
it with ObjectWrap.

## Epilogue

I'm going to ask you to:

* Clone the io.js repo
* Open the `src/`
* Go through files in it, and check what you read about it
* Open `src/stream_base.h`, `src/stream_base.cc` and friends and figure out
  what seems to be wrong to you
* [Send a PR][8]
* Have fun!

[0]: https://github.com/taf2/libebb
[1]: https://cs.fit.edu/code/projects/cse2410_fall2014_bounce/repository/revisions/90fc8d36220c0d66c352ee5f72080b8592d310d5/show/deps/liboi
[2]: http://software.schmorp.de/pkg/libev.html
[3]: https://github.com/gnosek/ebb
[4]: https://github.com/nodejs/io.js/commit/61890720
[5]: https://github.com/nodejs/io.js/commit/7b7ceea
[6]: https://github.com/nodejs/io.js/commit/064c8f02
[7]: https://github.com/libuv/libuv
[8]: https://github.com/nodejs/io.js/pulls
[9]: https://github.com/nodejs/io.js
[10]: https://github.com/nodejs/node
