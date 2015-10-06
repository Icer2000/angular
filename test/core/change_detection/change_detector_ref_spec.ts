import {
  ddescribe,
  describe,
  it,
  iit,
  xit,
  expect,
  beforeEach,
  afterEach,
  tick,
  fakeAsync
} from 'angular2/test_lib';

import {ChangeDetectorRef} from 'angular2/src/core/change_detection/change_detector_ref';
import {SpyChangeDetector} from '../spies';
import {ChangeDetectorRef_} from "../../../src/core/change_detection/change_detector_ref";


export function main() {
  describe('ChangeDetectorRef', () => {
    it('should delegate detectChanges()', () => {
      var changeDetector = new SpyChangeDetector();
      changeDetector.spy('detectChanges');
      var changeDetectorRef = new ChangeDetectorRef_(<any>changeDetector);
      changeDetectorRef.detectChanges();
      expect(changeDetector.spy('detectChanges')).toHaveBeenCalled();
    });
  });
}
