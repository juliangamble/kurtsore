jest.dontMock("atomo");
jest.dontMock("immutable");
jest.dontMock("../kurtsore");

var a = require("atomo"),
    i = require("immutable"),
    k = require("../kurtsore");

describe("Cursor", function(){
    var sampleData = i.fromJS({
        a: {
            b: {
                c: {
                    d: [0, 1, 2],
                    e: 42
                    }
                }
            }
        }),
        atom = a.atom();

    beforeEach(function(){
        atom.reset(sampleData);
    });

    it("keeps a reference to the atom they are based on", function(){
        var cursor = k.cursor(atom);

        expect(cursor.state).toBe(atom);
    });

    it("when are derived, they still keep a reference to the atom they are based on", function(){
        var cursor = k.cursor(atom),
            derivedCursor = cursor.derive('a');

        expect(derivedCursor.state).toBe(atom);
    });

    it("keeps a snapshot of the value of the substructure within the atom when they were created", function(){
        var cursor = k.cursor(atom);

        expect(cursor.snapshot).toBe(sampleData);

        atom.reset(42);
        expect(cursor.snapshot).toBe(sampleData);
    });

    it("keeps a snapshot of the value of the substructure within the atom when they are derived", function(){
        var cursor = k.cursor(atom),
            derivedCursor = cursor.derive('a');

        expect(
            i.is(derivedCursor.snapshot, sampleData.get('a'))
        ).toBeTruthy();

        atom.reset(42);
        expect(
            i.is(derivedCursor.snapshot, sampleData.get('a'))
        ).toBeTruthy();
    });

    describe("'deref' method ", function(){
        it("returns the state's value when doesn't have a path", function() {
            var cursor = k.cursor(atom);

            expect(
                i.is(cursor.deref(), atom.deref())
            ).toBeTruthy();
        });

        it("returns the focused state's value when its path is a key", function() {
            var cursor = k.cursor(atom, 'a');

            expect(
                i.is(cursor.deref(), atom.deref().get('a'))
            ).toBeTruthy();
        });

        it("returns the focused state's value when its path is a list", function() {
            var cursor = k.cursor(atom, ['a', 'b']);

            expect(
                i.is(cursor.deref(), atom.deref().getIn(['a', 'b']))
            ).toBeTruthy();
        });
    });

    describe("'swap'", function(){
        it("alters the state's value when doesn't have a path", function() {
            var cursor = k.cursor(atom);

            cursor.swap(function(st) { return st.set('foo', 42); });

            expect(
                i.is(atom.deref(), sampleData.set('foo', 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), sampleData.set('foo', 42))
            ).toBeTruthy();
        });

        it("alters the state's value when doesn't have a path, accepting multiple args", function() {
            var cursor = k.cursor(atom);

            cursor.swap(function(st, x, y) { return st.set('foo', x + y); }, 21, 21);

            expect(
                i.is(atom.deref(), sampleData.set('foo', 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), sampleData.set('foo', 42))
            ).toBeTruthy();
        });

        it("alters the state's value when its path is a key", function(){
            var cursor = k.cursor(atom, 'a');

            cursor.swap(function(st) { return st.set('b', 42); });

            expect(
                i.is(atom.deref(), sampleData.setIn(['a', 'b'], 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), i.fromJS({b: 42}))
            ).toBeTruthy();

        });

        it("alters the state's value when its path is a key, accepting multiple args", function(){
            var cursor = k.cursor(atom, 'a');

            cursor.swap(function(st, x, y) { return st.set('b', x + y); }, 21, 21);

            expect(
                i.is(atom.deref(), sampleData.setIn(['a', 'b'], 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), i.fromJS({b: 42}))
            ).toBeTruthy();

        });

        it("alters the focused state's value when its path is a list", function() {
            var cursor = k.cursor(atom, ['a', 'b', 'c']);

            cursor.swap(function(st) { return st.set('d', 42); });

            expect(
                i.is(atom.deref(), sampleData.setIn(['a', 'b', 'c', 'd'], 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), atom.deref().getIn(['a', 'b', 'c']))
            ).toBeTruthy();
        });

        it("alters the focused state's value when its path is a list, accepting multiple args", function() {
            var cursor = k.cursor(atom, ['a', 'b', 'c']);

            cursor.swap(function(st, x, y) { return st.set('d', x + y); }, 21, 21);

            expect(
                i.is(atom.deref(), sampleData.setIn(['a', 'b', 'c', 'd'], 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), atom.deref().getIn(['a', 'b', 'c']))
            ).toBeTruthy();
        });
    });

    describe("'reset'", function(){
        it("replaces the state's value when doesn't have a path", function() {
            var cursor = k.cursor(atom);

            cursor.reset(42);

            expect(
                i.is(atom.deref(), 42)
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), 42)
            ).toBeTruthy();
        });

        it("replaces the state's focused value when its path is a key", function() {
            var cursor = k.cursor(atom, 'a');

            cursor.reset(42);

            expect(
                i.is(atom.deref(), i.fromJS({a: 42}))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), 42)
            ).toBeTruthy();
        });

        it("replaces the state's focused value when its path is a list", function() {
            var cursor = k.cursor(atom, ['a', 'b', 'c', 'd', 0]);

            cursor.reset(42);

            expect(
                i.is(atom.deref(), sampleData.setIn(['a', 'b', 'c', 'd', 0], 42))
            ).toBeTruthy();
            expect(
                i.is(cursor.deref(), 42)
            ).toBeTruthy();
        });
    });

    describe("can be compared ", function(){
        it("by path", function(){
            var cursor = k.cursor(atom, 'a'),
                sameCursor = cursor.derive(),
                anotherCursor = sameCursor.derive('b');

            expect(cursor.hasSamePath(sameCursor)).toBeTruthy();
            expect(cursor.hasSamePath(anotherCursor)).toBeFalsy();
        });

        it("by snapshot", function(){
            var cursor = k.cursor(atom, 'a'),
                sameCursor = cursor.derive();

            atom.swap(function(st){ return st.set('a', 42); });
            var anotherSameCursor = sameCursor.derive();

            expect(cursor.hasSameSnapshot(sameCursor)).toBeTruthy();
            expect(cursor.hasSameSnapshot(anotherSameCursor)).toBeFalsy();
        });

        it("by current value", function(){
            var cursor = k.cursor(atom, 'a'),
                sameCursor = cursor.derive();

            expect(cursor.hasSameValue(sameCursor)).toBeTruthy();

            atom.swap(function(st){ return st.set('a', 42); });
            expect(cursor.hasSameValue(sameCursor)).toBeTruthy();
        });
    });

});
