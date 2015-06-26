/// This file contains tests that make sense only in Dart
library angular2.test.di.integration_dart_spec;

import 'package:angular2/angular2.dart';
import 'package:angular2/di.dart';
import 'package:angular2/test_lib.dart';

class MockException implements Error {
  var message;
  var stackTrace;
}
class NonError {
  var message;
}

void functionThatThrows() {
  try {
    throw new MockException();
  } catch (e, stack) {
    // If we lose the stack trace the message will no longer match
    // the first line in the stack
    e.message = stack.toString().split('\n')[0];
    e.stackTrace = stack;
    rethrow;
  }
}

void functionThatThrowsNonError() {
  try {
    throw new NonError();
  } catch (e, stack) {
    // If we lose the stack trace the message will no longer match
    // the first line in the stack
    e.message = stack.toString().split('\n')[0];
    rethrow;
  }
}

main() {
  describe('TypeLiteral', () {
    it('should publish via appInjector', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '<type-literal-component></type-literal-component>',
          directives: [TypeLiteralComponent]))

      .createAsync(Dummy).then((tc) {
        tc.detectChanges();
        expect(asNativeElements(tc.componentViewChildren)).toHaveText('[Hello, World]');
        async.done();
      });
    }));
  });

  describe('Error handling', () {
    //TODO: vsavkin reenable this test after merging DI and EI
    xit('should preserve Error stack traces thrown from components', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '<throwing-component></throwing-component>',
          directives: [ThrowingComponent]))

      .createAsync(Dummy).catchError((e, stack) {
        expect(stack.toString().split('\n')[0]).toEqual(e.message);
        async.done();
      });
    }));

    //TODO: vsavkin reenable this test after merging DI and EI
    xit('should preserve non-Error stack traces thrown from components', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '<throwing-component2></throwing-component2>',
          directives: [ThrowingComponent2]))

      .createAsync(Dummy).catchError((e, stack) {
        expect(stack.toString().split('\n')[0]).toEqual(e.message);
        async.done();
      });
    }));
  });

  describe('Property access', () {
    it('should distinguish between map and property access', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '<property-access></property-access>',
          directives: [PropertyAccess]))

      .createAsync(Dummy).then((tc) {
        tc.detectChanges();
        expect(asNativeElements(tc.componentViewChildren)).toHaveText('prop:foo-prop;map:foo-map');
        async.done();
      });
    }));

    it('should not fallback on map access if property missing', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '<no-property-access></no-property-access>',
          directives: [NoPropertyAccess]))

      .createAsync(Dummy).then((tc) {
        expect(() => tc.detectChanges())
            .toThrowError(new RegExp('property not found'));
        async.done();
      });
    }));
  });

  describe('OnChange', () {
    it('should be notified of changes', inject([
      TestComponentBuilder,
      AsyncTestCompleter
    ], (tb, async) {
      tb.overrideView(Dummy, new View(
          template: '''<on-change [prop]="'hello'"></on-change>''',
          directives: [OnChangeComponent]))

      .createAsync(Dummy).then((tc) {
        tc.detectChanges();
        var cmp = tc.componentViewChildren[0].inject(OnChangeComponent);
        expect(cmp.prop).toEqual('hello');
        expect(cmp.changes.containsKey('prop')).toEqual(true);
        async.done();
      });
    }));
  });
}

@Component(selector: 'dummy')
class Dummy {}

@Component(
    selector: 'type-literal-component',
    appInjector: const [
  const Binding(const TypeLiteral<List<String>>(),
      toValue: const <String>['Hello', 'World'])
])
@View(template: '{{list}}')
class TypeLiteralComponent {
  final List<String> list;

  TypeLiteralComponent(this.list);
}

@Component(selector: 'throwing-component')
@View(template: '')
class ThrowingComponent {
  ThrowingComponent() {
    functionThatThrows();
  }
}

@Component(selector: 'throwing-component2')
@View(template: '')
class ThrowingComponent2 {
  ThrowingComponent2() {
    functionThatThrowsNonError();
  }
}

@proxy
class PropModel implements Map {
  final String foo = 'foo-prop';

  operator [](_) => 'foo-map';

  noSuchMethod(_) {
    throw 'property not found';
  }
}

@Component(selector: 'property-access')
@View(template: '''prop:{{model.foo}};map:{{model['foo']}}''')
class PropertyAccess {
  final model = new PropModel();
}

@Component(selector: 'no-property-access')
@View(template: '''{{model.doesNotExist}}''')
class NoPropertyAccess {
  final model = new PropModel();
}

@Component(selector: 'on-change',
    // TODO: needed because of https://github.com/angular/angular/issues/2120
    lifecycle: const [onChange], properties: const ['prop'])
@View(template: '')
class OnChangeComponent implements OnChange {
  Map changes;
  String prop;

  @override
  void onChange(Map changes) {
    this.changes = changes;
  }
}
