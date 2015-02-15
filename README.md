# kurtsore

[![Travis Badge](https://img.shields.io/travis/dialelo/kurtsore.svg?style=flat)](https://travis-ci.org/dialelo/kurtsore "Travis Badge")

A [cursor](https://github.com/omcljs/om/wiki/Cursors) implementation in JavaScript for focusing on [atoms](https://github.com/dialelo/atomo) with [immutable](https://github.com/facebook/immutable-js) data structures.

## Installation

```
$ npm install kurtsore
```

## Usage

Let's say you are managing some state with an Atom and you have a deeply nested,
associative immutable data structure on it. Managing it with a bare atom can get
tedious and cursors allow you to focus on a substructure of the atom. The most
basic cursor will point to the root of the atom:

```javascript
var a = require("atomo"),
    k = require("kurtsore"),
    i = require("immutable");

var atom = a.atom(i.fromJS({
    a: {
        b: {
            c: {
                d: [0, 1, 2]
            }
        }
    }
}));
var cursor = k.cursor(a);

i.is(cursor.deref(), atom.deref());
//=> true
```

### Focusing on keys and paths

However, cursors can point to keys and paths in the Atom they are constructed from:

```javascript
var cursorA = k.cursor(a, 'a');

i.is(cursorA.deref(), atom.deref().get('a'));
//=> true
```

Cursors can be derived from others, refining the path they point to:

```javascript
var cursorC = cursorA.derive(['b', 'c']);

i.is(cursorC.deref(), atom.deref().getIn(['a', 'b', 'c']));
//=> true
```

### Atomic operations

Cursor instances support Atom's `deref` method as you have seen in the above examples, but
they also implement `swap` so you can apply a function to the focused structure of the
original atom:

```javascript
var cursorB = k.cursor(atom, ['a', 'b']);

cursorB.swap(function(st, x, y){
    return st.set('c', x + y);
}, 21, 21);

i.is(cursorB.deref(), i.fromJS({c: 42}))
//=> true
i.is(atom.deref(), i.fromJS({a: {b: {c: 42}}}));
//=> true
```

If you instead want to replace the focused structure, you can use `reset`:

```javascript
atom.reset(i.fromJS(
    a: {
        b: {
            c: {
                d: [0, 1, 2]
            }
        }
    }

));

var cursorD1 = k.cursor(atom, ['a', 'b', 'c', 'd', 1]);
cursorD1.deref();
//=> 1

cursorD1.reset(42);
i.is(atom.deref(), i.fromJS(
    a: {
        b: {
            c: {
                d: [0, 42, 2]
                //      ^
                //      |_ notice the change
            }
        }
    }
));
//=> true
```

### Snapshots

Cursors remember a snapshot of the focused structure when they were created, this helps
libraries like [react-kurtsore](https://github.com/dialelo/react-kurtsore) implement efficient
`shouldComponentUpdate` in React components.

```javascript
atom.reset(i.fromJS(
    a: {
        b: {
            c: {
                d: [0, 1, 2]
            }
        }
    }

));

var cursorB = k.cursor(atom, ['a', 'b']);
i.is(cursorB.snapshot, i.fromJS({c: {d: [0, 1, 2]}}));
//=> true

cursorB.reset(42);
var newCursorB = cursorB.derive();
i.is(newCursorB.snapshot, 42);
//=> true
```

## License

BSD 2-clause license, Copyright 2015 Alejandro Gómez.
