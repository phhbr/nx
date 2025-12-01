import { Component, h } from '@stencil/core';

@Component({
  tag: 'dpl-button',
  styleUrl: 'dpl-button.css',
  shadow: true,
})
export class DplButton {
  render() {
    return (
      <button>
        <slot></slot>
      </button>
    );
  }
}
