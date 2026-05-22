/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, NgZone } from '@angular/core';

import { ProxyCmp } from './angular-component-lib/utils';

import type { Components } from '@designsystem/dpl-web-components/components';

import { defineCustomElement as defineDplButton } from '@designsystem/dpl-web-components/components/dpl-button.js';
@ProxyCmp({
  defineCustomElementFn: defineDplButton,
  inputs: ['disabled', 'name']
})
@Component({
  selector: 'dpl-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [{ name: 'disabled', required: true }, 'name'],
  outputs: ['dplClick'],
})
export class DplButton {
  protected el: HTMLDplButtonElement;
  @Output() dplClick = new EventEmitter<CustomEvent<void>>();
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
  }
}


export declare interface DplButton extends Components.DplButton {

  dplClick: EventEmitter<CustomEvent<void>>;
}


