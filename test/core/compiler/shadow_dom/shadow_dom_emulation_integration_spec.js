import {describe, xit, it, expect, beforeEach, ddescribe, iit, el} from 'angular2/test_lib';

import {DOM} from 'angular2/src/facade/dom';

import {Injector} from 'angular2/di';
import {Lexer, Parser, ChangeDetector, dynamicChangeDetection} from 'angular2/change_detection';

import {Compiler, CompilerCache} from 'angular2/src/core/compiler/compiler';
import {LifeCycle} from 'angular2/src/core/life_cycle/life_cycle';
import {DirectiveMetadataReader} from 'angular2/src/core/compiler/directive_metadata_reader';
import {ShadowDomStrategy,
        NativeShadowDomStrategy,
        EmulatedShadowDomStrategy} from 'angular2/src/core/compiler/shadow_dom_strategy';
import {TemplateLoader} from 'angular2/src/core/compiler/template_loader';

import {Decorator, Component, Viewport} from 'angular2/src/core/annotations/annotations';
import {TemplateConfig} from 'angular2/src/core/annotations/template_config';

import {ViewContainer} from 'angular2/src/core/compiler/view_container';
import {StringMapWrapper, MapWrapper} from 'angular2/src/facade/collection';

import {XHRMock} from 'angular2/src/mock/xhr_mock';

export function main() {
  describe('integration tests', function() {

    StringMapWrapper.forEach({
        "native" : new NativeShadowDomStrategy(),
        "emulated" : new EmulatedShadowDomStrategy()
      },
      (strategy, name) => {

      describe(`${name} shadow dom strategy`, () => {
        var compiler;

        beforeEach( () => {
          compiler = new Compiler(dynamicChangeDetection,
            new TemplateLoader(new XHRMock()),
            new DirectiveMetadataReader(),
            new Parser(new Lexer()),
            new CompilerCache(),
            strategy
          );
        });

        function compile(template, assertions) {
          compiler.compile(MyComp, el(template)).
            then(createView).
            then((view) => {
              var lc = new LifeCycle(view.changeDetector, false);
              assertions(view, lc);
            });
        }

        it('should support multiple content tags', (done) => {
          var temp = '<multiple-content-tags>' +
            '<div>B</div>' +
            '<div>C</div>' +
            '<div class="left">A</div>' +
          '</multiple-content-tags>';

          compile(temp, (view, lc) => {
            expect(view.nodes).toHaveText('(A, BC)');
            done();
          });
        });

        it('should redistribute only direct children', (done) => {
          var temp = '<multiple-content-tags>' +
            '<div>B<div class="left">A</div></div>' +
            '<div>C</div>' +
            '</multiple-content-tags>';

          compile(temp, (view, lc) => {
            expect(view.nodes).toHaveText('(, BAC)');
            done();
          });
        });

        it("should redistribute direct child viewcontainers when the light dom changes", (done) => {
          var temp = '<multiple-content-tags>' +
            '<div><div template="manual" class="left">A</div></div>' +
            '<div>B</div>' +
            '</multiple-content-tags>';

          compile(temp, (view, lc) => {
            var dir = view.elementInjectors[1].get(ManualViewportDirective);

            expect(view.nodes).toHaveText('(, B)');

            dir.show();
            lc.tick();

            expect(view.nodes).toHaveText('(, AB)');

            dir.hide();
            lc.tick();

            expect(view.nodes).toHaveText('(, B)');

            done();
          });
        });

        it("should redistribute when the light dom changes", (done) => {
          var temp = '<multiple-content-tags>' +
            '<div template="manual" class="left">A</div>' +
            '<div>B</div>' +
            '</multiple-content-tags>';

          compile(temp, (view, lc) => {
            var dir = view.elementInjectors[1].get(ManualViewportDirective);

            expect(view.nodes).toHaveText('(, B)');

            dir.show();
            lc.tick();

            expect(view.nodes).toHaveText('(A, B)');

            dir.hide();
            lc.tick();

            expect(view.nodes).toHaveText('(, B)');

            done();
          });
        });

        it("should support nested components", (done) => {
          var temp = '<outer-with-indirect-nested>' +
            '<div>A</div>' +
            '<div>B</div>' +
            '</outer-with-indirect-nested>';

          compile(temp, (view, lc) => {
            expect(view.nodes).toHaveText('OUTER(SIMPLE(AB))');

            done();
          });
        });

        it("should support nesting with content being direct child of a nested component", (done) => {
          var temp = '<outer>' +
            '<div template="manual" class="left">A</div>' +
            '<div>B</div>' +
            '<div>C</div>' +
            '</outer>';

          compile(temp, (view, lc) => {
            var dir = view.elementInjectors[1].get(ManualViewportDirective);

            expect(view.nodes).toHaveText('OUTER(INNER(INNERINNER(,BC)))');

            dir.show();
            lc.tick();

            expect(view.nodes).toHaveText('OUTER(INNER(INNERINNER(A,BC)))');
            done();
          });
        });

        // Enable once dom-write queue is implemented and onDehydrate is implemented
        //it('should redistribute when the shadow dom changes', (done) => {
        //  var temp = '<conditional-content>' +
        //    '<div class="left">A</div>' +
        //    '<div>B</div>' +
        //    '<div>C</div>' +
        //    '</conditional-content>';
        //
        //
        //  compile(temp, (view, lc) => {
        //    var cmp = view.elementInjectors[0].get(ConditionalContentComponent);
        //
        //    expect(view.nodes).toHaveText('(, ABC)');
        //
        //    cmp.showLeft();
        //    lc.tick();
        //
        //    expect(view.nodes).toHaveText('(A, BC)');
        //
        //    cmp.hideLeft()
        //    lc.tick();
        //
        //    expect(view.nodes).toHaveText('(, ABC)');
        //
        //    done();
        //  });
        //});

        //Implement once NgElement support changing a class
        //it("should redistribute when a class has been added or removed");
        //it('should not lose focus', () => {
        //  var temp = `<simple>aaa<input type="text" id="focused-input" ng-class="{'aClass' : showClass}"> bbb</simple>`;
        //
        //  compile(temp, (view, lc) => {
        //    var input = view.nodes[1];
        //    input.focus();
        //
        //    expect(document.activeElement.id).toEqual("focused-input");
        //
        //    // update class of input
        //
        //    expect(document.activeElement.id).toEqual("focused-input");
        //  });
        //});
      });
    });

  });
}

class TestDirectiveMetadataReader extends DirectiveMetadataReader {
  shadowDomStrategy;

  constructor(shadowDomStrategy) {
    super();
    this.shadowDomStrategy = shadowDomStrategy;
  }

  parseShadowDomStrategy(annotation:Component):ShadowDomStrategy{
    return this.shadowDomStrategy;
  }
}

@Viewport({
  selector: '[manual]'
})
class ManualViewportDirective {
  viewContainer;
  constructor(viewContainer:ViewContainer) {
    this.viewContainer = viewContainer;
  }

  show() { this.viewContainer.create(); }
  hide() { this.viewContainer.remove(0); }
}

@Viewport({
  selector: '[auto]',
  bind: {
    'auto': 'auto'
  }
})
class AutoViewportDirective {
  viewContainer;
  constructor(viewContainer:ViewContainer) {
    this.viewContainer = viewContainer;
  }

  set auto(newValue:boolean) {
    if (newValue) {
      this.viewContainer.create();
    } else {
      this.viewContainer.remove(0);
    }
  }
}

@Component({
  selector: 'simple',
  template: new TemplateConfig({
    inline: 'SIMPLE(<content></content>)'
  })
})
class Simple {
}

@Component({
  selector: 'multiple-content-tags',
  template: new TemplateConfig({
    inline: '(<content select=".left"></content>, <content></content>)'
  })
})
class MultipleContentTagsComponent {
}


@Component({
  selector: 'conditional-content',
  template: new TemplateConfig({
    inline: '<div>(<div template="auto: cond"><content select=".left"></content></div>, <content></content>)</div>',
    directives: [AutoViewportDirective]
  })
})
class ConditionalContentComponent  {
  cond:boolean;

  constructor() {
    this.cond = false;
  }

  showLeft() { this.cond = true; }
  hideLeft() { this.cond = false; }
}

@Component({
  selector: 'outer-with-indirect-nested',
  template: new TemplateConfig({
    inline: 'OUTER(<simple><div><content></content></div></simple>)',
    directives: [Simple]
  })
})
class OuterWithIndirectNestedComponent  {
}

@Component({
  selector: 'outer',
  template: new TemplateConfig({
    inline: 'OUTER(<inner><content></content></inner>)',
    directives: [InnerComponent]
  })
})
class OuterComponent {
}

@Component({
  selector: 'inner',
  template: new TemplateConfig({
    inline: 'INNER(<innerinner><content></content></innerinner>)',
    directives: [InnerInnerComponent]
  })
})
class InnerComponent {
}

@Component({
  selector: 'innerinner',
  template: new TemplateConfig({
    inline: 'INNERINNER(<content select=".left"></content>,<content></content>)'
  })
})
class InnerInnerComponent {
}


@Component({
  selector: 'my-comp',
  template: new TemplateConfig({
    directives: [MultipleContentTagsComponent, ManualViewportDirective,
      ConditionalContentComponent, OuterWithIndirectNestedComponent, OuterComponent]
  })
})
class MyComp {
}

function createView(pv) {
  var view = pv.instantiate(null, null);
  view.hydrate(new Injector([]), null, {});
  return view;
}
