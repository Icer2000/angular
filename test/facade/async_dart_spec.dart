/// This file contains tests that make sense only in Dart
library angular2.test.facade.async_dart_spec;

import 'package:angular2/test_lib.dart';
import 'package:angular2/src/facade/async.dart';

class MockException implements Error { var message; var stackTrace; }

void functionThatThrows() {
  try { throw new MockException(); }
  catch(e, stack) {
    // If we lose the stack trace the message will no longer match
    // the first line in the stack
    e.message = stack.toString().split('\n')[0];
    e.stackTrace = stack;
    rethrow;
  }
}

void functionThatThrowsNonError() {
  throw 'this is an error';
}

void expectFunctionThatThrowsWithStackTrace(
    Future future, AsyncTestCompleter async) {
  PromiseWrapper.catchError(future, (err, StackTrace stack) {
    expect(stack.toString().split('\n')[0]).toEqual(err.message);
    async.done();
  });
}

void expectFunctionThatThrowsWithoutStackTrace(Future future,
    AsyncTestCompleter async) {
  PromiseWrapper.catchError(future, (err, StackTrace stack) {
    expect(stack).toBe(null);
    async.done();
  });
}

main() {
  describe('Completer', () {

    it('should preserve error stack traces',
        inject([AsyncTestCompleter], (async) {
      var c = PromiseWrapper.completer();

      expectFunctionThatThrowsWithStackTrace(c.promise, async);

      try {
        functionThatThrows();
      } catch(e) {
        c.reject(e);
      }
    }));

    // TODO: We might fix this one day; for now testing it to be explicit
    it('CANNOT preserve error stack traces for non-Errors',
        inject([AsyncTestCompleter], (async) {
      var c = PromiseWrapper.completer();

      expectFunctionThatThrowsWithoutStackTrace(c.promise, async);

      try {
        functionThatThrowsNonError();
      } catch(e) {
        c.reject(e);
      }
    }));

  });

  describe('PromiseWrapper', () {

    describe('reject', () {

      it('should preserve error stack traces',
          inject([AsyncTestCompleter], (async) {
        try {
          functionThatThrows();
        } catch(e) {
          var rejectedFuture = PromiseWrapper.reject(e);
          expectFunctionThatThrowsWithStackTrace(rejectedFuture, async);
        }
      }));

      // TODO: We might fix this one day; for now testing it to be explicit
      it('CANNOT preserve stack traces for non-Errors',
          inject([AsyncTestCompleter], (async) {
        try {
          functionThatThrowsNonError();
        } catch(e) {
          var rejectedFuture = PromiseWrapper.reject(e);
          expectFunctionThatThrowsWithoutStackTrace(rejectedFuture, async);
        }
      }));

    });

  });
}
