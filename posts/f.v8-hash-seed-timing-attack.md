---
title: V8 hash seed timing attack
date: 2017-01-19
---

## Moment of History

There is a mostly forgotten [security issue][0] that was fixed in
Node.js back in 2012. It was originally announced on the
[28c3 conference][1] December, 2011 and the final fix landed in
[January, 2012][2].

In few words, the most of dynamic languages use either bucket lists or
[open addressing][3] variants of hash tables. V8 uses the latter one, and in
such case when VM is asked to insert a property into an object it does
the following sequence of actions:

1. Compute the hash of the key (quite often with a [Jenkins hash][4])
2. Clear the high bits of the hash value
3. Use it as an index in the internal array
4. Find unused slot in that array
5. Insert the key/value pair at that slot.

This sounds pretty much OK, except for the step 4. One may ask: What if the
target slot is way too far from the index in the step 3? The answer is: it will
take more time to do such insertion.

Do you see where it is going?

## Collision attacks

If the attacker can insert many keys like these into the hash table - the whole
procedure is going be much slower than usual (20x slower in some cases). During
this time Node.js will be blocked, and performing such insertions one after
another leads directly to Denial of Service attack. To put it in concrete
context: `req.headers` in `http.Server` is populated with user data, and is thus
susceptible to this kind of attack.

How does one generate such keys? Trivial and fast brute-force could generate as
many keys as needed to give desired "collisions" given that attacker knows what
hash function is used by VM.

What was done to fix it in V8/Node.js? Together with V8 team we added seeds to
all hash tables used in V8, and made sure that they are randomized on the
process start.

## Inspiration for an Experiment

After reading this [Perl blog post][5] I thought that it would be funny to
carry out an actual hash seed extraction out of the live node.js process:
first - locally within the process itself, second - from http server on the same
machine, third - remotely (no luck so far). Knowing the seed means being able
to craft the collisions, and this gets us back to DoS problem.

Numerous code paths in V8 have been tried, until I stumbled upon a
[particular function][6]. There V8 puts a new property into an internal list
called `DescriptorArray`. For performance reasons properties in that array
must be sorted, and since V8 extends the array - it has to shift all bigger
properties to the right to make space for the new one.

By measuring timing of such insertions, attacker could figure out approximate
position of the inserted key. `DescriptorArray` holds no more than 18 keys, so
it could be attempted to insert the same 17 keys and one random one many times,
and infer the difference in timing to find the random keys that were placed
either at the very end or at the start of the array.

It's easier said than done, though. V8 has many layers of caching (which is one
of the reasons why your JavaScript code is so fast!). In order to get
through to that `DescriptorArray::Append` function, I had to outflank all of
them. In the end, the resulting program does everything in reverse - the random
key is inserted first, and then 17 predefined keys are inserted right after it.
The difference is non-obvious, but that's the part of the solution to skip all
of the caches.

This is how it looks:
```javascript
function test(pre, list) {
  const o = {};
  o[pre] = null;
  for (let i = 0; i < list.length; i++)
    o[list[i]] = null;
  return o;
}
```

Now this script has to create a `list` of keys, and a large number of probes
(2093 strings that are passed one after another as `pre`). It can try each probe
with the same `list`, and measure the timing with `process.hrtime()` with
nanosecond precision. Largertime difference means that the probe was inserted
at the start of the `DescriptorArray`, and thus its hash value (32 bit number)
is less than all hashes of the keys in the `list`. When the time delta is least
- probe was appended to the end of the `DescriptorArray`, meaning that its hash
is the biggest in it.

It may sound like not too much to stick to, but if one can collect enough such
"relations" between the probe and keys - one can brute force all 32-bit seed
values to find the one that gives the best approximation to this relation!
In fact, it takes just about 15 minutes on 20 core machine to do it, and this
time can be improved by using GPU (I dare you!).

The most important part of brute forcing function is `check`:

```c
static int check(uint32_t seed) {
  int score;
  uint32_t key_hashes[ARRAY_SIZE(keys)];

  score = 0;

  for (size_t i = 0; i < ARRAY_SIZE(keys); i++) {
    key_hashes[i] = jenkins(keys[i], seed);
  }

  for (size_t i = 0; i < ARRAY_SIZE(probes); i += 2) {
    uint32_t l;
    uint32_t r;

    l = jenkins(probes[i], seed);
    r = jenkins(probes[i + 1], seed);

    for (size_t j = 0; j < ARRAY_SIZE(keys); j++) {
      if (l < key_hashes[j])
        score++;
      if (key_hashes[j] <= r)
        score++;
    }
  }

  return score;
}
```

`l` is a probe that supposedly has the lowest hash value in `DescriptorArray`,
`r` is a probe that has the highest. So all in all, `brute.c` just searches for
the seed value that maximizes the result of `check`. Simple!

## Conclusions and code

This works locally as a charm, and works with a `http.Server` on the same
machine to some extent. Unfortunately (or fortunately?) this attack doesn't work
with remote servers (or I wasn't able to execute it), even when the ping is
around 1ms. The timing difference that we are looking for is about several
microseconds, and it looks like it is smudged out in the network delay
distribution.

V8 team is aware of this effort, and the decision is that this is not a security
defect - hence it is published here.

All code is available on [github][7]. Please enjoy with care!

[0]: https://github.com/nodejs/node-v0.x-archive/issues/2431
[1]: https://www.youtube.com/watch?v=R2Cq3CLI6H8
[2]: https://github.com/nodejs/node/commit/16953329413831b32f4c3b2255aeacec874ed69d
[3]: https://en.wikipedia.org/wiki/Hash_table#Open_addressing
[4]: https://en.wikipedia.org/wiki/Jenkins_hash_function
[5]: http://perl11.org/blog/seed.html
[6]: https://github.com/v8/v8/blob/140d4df7954259e60a555efc0b2d00a9c924564c/src/objects-inl.h#L3140-L3157
[7]: https://github.com/indutny/hash-cracker
