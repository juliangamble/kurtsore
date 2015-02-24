var immutable = require("immutable"),
    atomo = require("atomo");

// ================================================================================
//  Constructors

function Cursor(atomOrCursor, maybePath){
    this.state = toState(atomOrCursor);
    this.path = toPath(maybePath);
    this.snapshot = this.state.deref().getIn(this.path);
};

function cursor(atomOrCursor, maybePath){
    return new Cursor(atomOrCursor, maybePath);
};

// ================================================================================
//  Static methods

Cursor.prototype.isCursor = function(maybeCursor) {
    return maybeCursor instanceof Cursor;
};

// ================================================================================
//  Cursor derivation

Cursor.prototype.derive = function(maybePath){
    var newPath = this.path.concat(toPath(maybePath));
    return new Cursor(this.state, newPath);
};

// ================================================================================
//  Atom-like interface
//    https://github.com/dialelo/atomo

Cursor.prototype.deref = function(){
    var st = this.state.deref();
    if (this.path.isEmpty()){
        return st;
    } else {
        return st.getIn(this.path);
    }
};

Cursor.prototype.swap = function(f /*, args */) {
    var current = this.deref(),
        args = [].slice.call(arguments, 1);
    args.splice(0, 0, current);
    var next = f.apply(null, args),
        path = this.path;
    this.state.swap(function(st){
        return st.setIn(path, next);
    });
    return next;
};

Cursor.prototype.reset = function(next){
    var path = this.path;
    this.state.swap(function(st){
        return st.setIn(path, next);
    });
    return next;
};

// ================================================================================
//  Comparisons

Cursor.prototype.hasSamePath = function(cursor){
    return immutable.is(this.path, cursor.path);
};

Cursor.prototype.hasSameSnapshot = function(cursor){
    return immutable.is(this.snapshot, cursor.snapshot);
};

Cursor.prototype.hasSameValue = function(cursor){
    return immutable.is(this.deref(), cursor.deref());
};

// ================================================================================
//  Helpers

function toPath(maybePath){
    if (maybePath === undefined){
        return immutable.List();
    } else if (maybePath instanceof Array) {
        return immutable.List(maybePath);
    } else if (immutable.List.isList(maybePath)){
        return maybePath;
    } else {
        return immutable.List([maybePath]);
    }
};

function toState(atomOrCursor){
    if (atomOrCursor instanceof atomo.Atom){
        return atomOrCursor;
    } else if (Cursor.prototype.isCursor(atomOrCursor)){
        return atomOrCursor.state;
    } else {
        throw new Error("The state must be an atom or a cursor");
    }
};

// ================================================================================
//  Public API

module.exports = {
    cursor: cursor,
    Cursor: Cursor
};
