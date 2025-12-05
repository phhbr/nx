/* tslint:disable */
/* auto-generated angular directive proxies */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, NgZone } from '@angular/core';

import { ProxyCmp, proxyOutputs } from './angular-component-lib/utils';

import type { Components } from '@designsystem/dpl-web-components/components';

import { defineCustomElement as defineDplButton } from '@designsystem/dpl-web-components/components/dpl-button.js';
@ProxyCmp({
  defineCustomElementFn: defineDplButton
})
@Component({
  selector: 'dpl-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content></ng-content>',
  // eslint-disable-next-line @angular-eslint/no-inputs-metadata-property
  inputs: [],
  standalone: true
})
export class DplButton {
  protected el: HTMLElement;
  constructor(c: ChangeDetectorRef, r: ElementRef, protected z: NgZone) {
    c.detach();
    this.el = r.nativeElement;
    proxyOutputs(this, this.el, ['buttonAction']);
  }
}


import type { SomeEventInterface as IDplButtonSomeEventInterface } from '@designsystem/dpl-web-components/components';

export declare interface DplButton extends Components.DplButton {

  buttonAction: EventEmitter<CustomEvent<IDplButtonSomeEventInterface>>;
}


