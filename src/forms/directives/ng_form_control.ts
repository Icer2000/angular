import {CONST_EXPR} from 'angular2/src/facade/lang';
import {StringMapWrapper} from 'angular2/src/facade/collection';
import {EventEmitter, ObservableWrapper} from 'angular2/src/facade/async';

import {Directive, Ancestor, onChange, Query, QueryList} from 'angular2/angular2';
import {forwardRef, Binding} from 'angular2/di';

import {NgControl} from './ng_control';
import {Control} from '../model';
import {NgValidator} from './validators';
import {setUpControl, composeNgValidator} from './shared';

const formControlBinding =
    CONST_EXPR(new Binding(NgControl, {toAlias: forwardRef(() => NgFormControl)}));

/**
 * Binds an existing control to a DOM element.
 *
 * # Example
 *
 * In this example, we bind the control to an input element. When the value of the input element
 * changes, the value of
 * the control will reflect that change. Likewise, if the value of the control changes, the input
 * element reflects that
 * change.
 *
 *  ```
 * @Component({selector: "login-comp"})
 * @View({
 *      directives: [formDirectives],
 *      template: "<input type='text' [ng-form-control]='loginControl'>"
 *      })
 * class LoginComp {
 *  loginControl:Control;
 *
 *  constructor() {
 *    this.loginControl = new Control('');
 *  }
 * }
 *
 *  ```
 *
 * We can also use ng-model to bind a domain model to the form.
 *
 *  ```
 * @Component({selector: "login-comp"})
 * @View({
 *      directives: [formDirectives],
 *      template: "<input type='text' [ng-form-control]='loginControl' [(ng-model)]='login'>"
 *      })
 * class LoginComp {
 *  loginControl:Control;
 *  login:string;
 *
 *  constructor() {
 *    this.loginControl = new Control('');
 *  }
 * }
 *  ```
 *
 * @exportedAs angular2/forms
 */
@Directive({
  selector: '[ng-form-control]',
  hostInjector: [formControlBinding],
  properties: ['form: ng-form-control', 'model: ng-model'],
  events: ['ngModel'],
  lifecycle: [onChange],
  exportAs: 'form'
})
export class NgFormControl extends NgControl {
  form: Control;
  ngModel: EventEmitter;
  _added: boolean;
  model: any;
  ngValidators: QueryList<NgValidator>;

  // Scope the query once https://github.com/angular/angular/issues/2603 is fixed
  constructor(@Query(NgValidator) ngValidators: QueryList<NgValidator>) {
    super();
    this.ngModel = new EventEmitter();
    this._added = false;
    this.ngValidators = ngValidators;
  }

  onChange(c) {
    if (!this._added) {
      setUpControl(this.form, this);
      this.form.updateValidity();
      this._added = true;
    }
    if (StringMapWrapper.contains(c, "model")) {
      this.form.updateValue(this.model);
    }
  }

  get path(): List<string> { return []; }

  get control(): Control { return this.form; }

  get validator(): Function { return composeNgValidator(this.ngValidators); }

  viewToModelUpdate(newValue: any): void { ObservableWrapper.callNext(this.ngModel, newValue); }
}
