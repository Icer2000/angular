import {describe, xit, it, expect, beforeEach, ddescribe, iit, el} from 'test_lib/test_lib';

import {DOM} from 'facade/src/dom';

import {Injector} from 'di/di';
import {Lexer, Parser, ChangeDetector, dynamicChangeDetection} from 'change_detection/change_detection';

import {Compiler, CompilerCache} from 'core/src/compiler/compiler';
import {DirectiveMetadataReader} from 'core/src/compiler/directive_metadata_reader';
import {ShadowDomEmulated} from 'core/src/compiler/shadow_dom';

import {Decorator, Component, Template} from 'core/src/annotations/annotations';
import {TemplateConfig} from 'core/src/annotations/template_config';

import {ViewPort} from 'core/src/compiler/viewport';
import {MapWrapper} from 'facade/src/collection';

export function main() {
  describe('integration tests', function() {
    var compiler;

    beforeEach( () => {
      compiler = new Compiler(dynamicChangeDetection, null, new DirectiveMetadataReader(),
        new Parser(new Lexer()), new CompilerCache());
    });

    describe('react to record changes', function() {
      var view, ctx, cd;
      function createView(pv) {
        ctx = new MyComp();
        view = pv.instantiate(null);
        view.hydrate(new Injector([]), null, ctx);
        cd = view.changeDetector;
      }

      it('should consume text node changes', (done) => {
        compiler.compile(MyComp, el('<div>{{ctxProp}}</div>')).then((pv) => {
          createView(pv);
          ctx.ctxProp = 'Hello World!';

          cd.detectChanges();
          expect(DOM.getInnerHTML(view.nodes[0])).toEqual('Hello World!');
          done();
        });
      });

      it('should consume element binding changes', (done) => {
        compiler.compile(MyComp, el('<div [id]="ctxProp"></div>')).then((pv) => {
          createView(pv);

          ctx.ctxProp = 'Hello World!';
          cd.detectChanges();

          expect(view.nodes[0].id).toEqual('Hello World!');
          done();
        });
      });

      it('should consume directive watch expression change.', (done) => {
        compiler.compile(MyComp, el('<div my-dir [elprop]="ctxProp"></div>')).then((pv) => {
          createView(pv);

          ctx.ctxProp = 'Hello World!';
          cd.detectChanges();

          var elInj = view.elementInjectors[0];
          expect(elInj.get(MyDir).dirProp).toEqual('Hello World!');
          done();
        });
      });

      it('should consume element binding for class attribute', (done) => {
        compiler.compile(MyComp, el('<div class="foo" [class.bar]="boolProp"></div>')).then((pv) => {
          createView(pv);

          ctx.boolProp = true;
          cd.detectChanges();
          expect(view.nodes[0].className).toEqual('foo ng-binding bar');

          ctx.boolProp = false;
          cd.detectChanges();
          expect(view.nodes[0].className).toEqual('foo ng-binding');

          done();
        });
      });

      it('should support nested components.', (done) => {
        compiler.compile(MyComp, el('<child-cmp></child-cmp>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          expect(view.nodes[0].shadowRoot.childNodes[0].nodeValue).toEqual('hello');
          done();
        });
      });

      // GH issue 328 - https://github.com/angular/angular/issues/328
      it('should support different directive types on a single node', (done) => {
        compiler.compile(MyComp, el('<child-cmp my-dir [elprop]="ctxProp"></child-cmp>')).then((pv) => {
          createView(pv);

          ctx.ctxProp = 'Hello World!';
          cd.detectChanges();

          var elInj = view.elementInjectors[0];
          expect(elInj.get(MyDir).dirProp).toEqual('Hello World!');
          expect(elInj.get(ChildComp).dirProp).toEqual(null);

          done();
        });
      });

      it('should support template directives via `<template>` elements.', (done) => {
        compiler.compile(MyComp, el('<div><template some-tmplate var-greeting="some-tmpl"><copy-me>{{greeting}}</copy-me></template></div>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          var childNodesOfWrapper = view.nodes[0].childNodes;
          // 1 template + 2 copies.
          expect(childNodesOfWrapper.length).toBe(3);
          expect(childNodesOfWrapper[1].childNodes[0].nodeValue).toEqual('hello');
          expect(childNodesOfWrapper[2].childNodes[0].nodeValue).toEqual('again');
          done();
        });
      });

      it('should support template directives via `template` attribute.', (done) => {
        compiler.compile(MyComp, el('<div><copy-me template="some-tmplate: var greeting=some-tmpl">{{greeting}}</copy-me></div>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          var childNodesOfWrapper = view.nodes[0].childNodes;
          // 1 template + 2 copies.
          expect(childNodesOfWrapper.length).toBe(3);
          expect(childNodesOfWrapper[1].childNodes[0].nodeValue).toEqual('hello');
          expect(childNodesOfWrapper[2].childNodes[0].nodeValue).toEqual('again');
          done();
        });
      });
    });
  });
}

@Decorator({
  selector: '[my-dir]',
  bind: {'elprop':'dirProp'}
})
class MyDir {
  dirProp:string;
  constructor() {
    this.dirProp = '';
  }
}

@Component({
  template: new TemplateConfig({
    directives: [MyDir, ChildComp, SomeTemplate]
  })
})
class MyComp {
  ctxProp:string;
  boolProp:boolean;
  constructor() {
    this.ctxProp = 'initial value';
  }
}

@Component({
  selector: 'child-cmp',
  componentServices: [MyService],
  template: new TemplateConfig({
    directives: [MyDir],
    inline: '{{ctxProp}}'
  })
})
class ChildComp {
  ctxProp:string;
  dirProp:string;
  constructor(service: MyService) {
    this.ctxProp = service.greeting;
    this.dirProp = null;
  }
}

@Template({
  selector: '[some-tmplate]'
})
class SomeTemplate {
  constructor(viewPort: ViewPort) {
    viewPort.create().setLocal('some-tmpl', 'hello');
    viewPort.create().setLocal('some-tmpl', 'again');
  }
}

class MyService {
  greeting:string;
  constructor() {
    this.greeting = 'hello';
  }
}

