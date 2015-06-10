import {NgControl} from './ng_control';
import {NgControlGroup} from './ng_control_group';
import {Control} from '../model';

export interface Form {
  addControl(dir: NgControl): void;
  removeControl(dir: NgControl): void;
  getControl(dir: NgControl): Control;
  addControlGroup(dir: NgControlGroup): void;
  removeControlGroup(dir: NgControlGroup): void;
  updateModel(dir: NgControl, value: any): void;
}