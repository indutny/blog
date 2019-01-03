---
title: Side Projects
date: 2015-02-26
---

After reading [antirez][0]'s [blog post][1] I decided that it might be a good
exercise to write down the notable side projects that I spent my time upon since
Jan 2014.

Here is the list and some comments from me:

### [bn.js][2]

JavaScript library for working with Big Numbers. [bn.js][2] is an ultra-fast
[bignum][3] alternative with support for running in io.js/node.js and browsers.

This one took lots of time and effort through whole year with some periodic
[sparks in a contributions graph][4], and many PRs from OpenSource community.
Seriously, big kudos to you people for helping me with it!

### [elliptic][5]

JS library for doing Elliptic Curve crypto. It was the reason for creating the
[bn.js][2] in the first place, and excuse for me to learn more about EC
cryptography and crazy math behind it.

### [bud][6]

A friendly and clever TLS-terminating proxy in C.

Although I worked on it since Nov 2013, lots of development happened during the
2014 year. This is my biggest project in C so far, and it has taught me a lot
about designing the APIs and interfaces in low-level languages.

Bud seens lots of love from [Emmanuel Odeke][21]. Big thanks to you, Emmanuel!

### [tls.js][7]

(Incomplete) TLS implementation in JavaScript.

Totally experimental protocol implementation. Did it just for fun, but it turned
to be useful in screening the web servers.

### [hash.js][8]

Implementations of SHA1, SHA224, SHA256, SHA384, SHA512, RIPEMD160, various
HMACs. One of the mandatory dependencies of...

### [bcoin][9]

BitCoin SPV client implementation. Purely experimental, but I heard that some
people do use it.

Lots of contributions from [Christopher Jeffrey][22] here. Thank you!

### [bthread][10] ([src][11])

Writing blog posts in a BitCoin block-chain.

_I know many people hate me for this, but still I wanted to experiment with it
a little_.

### [js.js][12]

JS JIT compiler written in JS.

Very preliminary implementation with little or no compatibility with ECMAScript
yet :)

### [heap.js, jit.js, cfg.js, ...][13]

Various [js.js][12] dependencies.

### [lll-reduction][14]

[Lenstra–Lenstra–Lovász algorithm][15] JavaScript implementation.

I don't remember exact reasons for writing this, but I guess I thought about
doing more optimal [GLV Method][16] for [elliptic][5].

### [core2dump][17]

Creating heap snapshots out of the core file on OS X, linuxes, and FreeBSD.

### [asn1.js][18]

ASN.1 encoding implementation in JS.

### [miller-rabin][19]

Miller-Rabin primality test in JS.

### [caine][20]

Butler bot for github projects. I wanted it to be used for io.js, but we decided
to walk a different road.

#### Epilogue

I guess that's it.

Most of these projects were a big incentive for me to dig into the protocols,
technology, science. I find it much more enjoyable and interesting to
investigate new topics through their applications.

**Thank you for all your contributions, people! It is really awesome to see
you interested in helping me with these and other projects!**

Thanks for reading this.

[0]: https://github.com/antirez
[1]: http://antirez.com/news/86
[2]: https://github.com/indutny/bn.js
[3]: https://github.com/justmoon/node-bignum
[4]: https://github.com/indutny/bn.js/graphs/contributors
[5]: https://github.com/indutny/elliptic
[6]: https://github.com/indutny/bud
[7]: https://github.com/indutny/tls.js
[8]: https://github.com/indutny/hash.js
[9]: https://github.com/indutny/bcoin
[10]: https://chrome.google.com/webstore/detail/bthread/ldbfhhncehnfgppdlgjhfgffachpehkd
[11]: https://github.com/indutny/bthread
[12]: https://github.com/js-js/js.js
[13]: https://github.com/js-js
[14]: https://github.com/indutny/lll-reduction
[15]: http://en.wikipedia.org/wiki/Lenstra%E2%80%93Lenstra%E2%80%93Lov%C3%A1sz_lattice_basis_reduction_algorithm
[16]: http://www.hyperelliptic.org/tanja/conf/ECC08/slides/Mike-Scott.pdf
[17]: https://github.com/indutny/core2dump
[18]: https://github.com/indutny/asn1.js
[19]: https://github.com/indutny/miller-rabin
[20]: https://github.com/indutny/caine
[21]: https://github.com/odeke-em
[22]: https://github.com/chjj
