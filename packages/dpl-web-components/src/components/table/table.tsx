import { Component, Event, EventEmitter, h, Prop } from "@stencil/core";

@Component({
  tag: "dpl-table",
  styleUrl: "table.css",
  shadow: true,
})
export class Table {

  render() {
    const { name, disabled, dplClick } = this;
    return (
      <button name={name} disabled={disabled} onClick={() => dplClick.emit()}
      >
        <slot></slot>
      </button>
    );
  }
}
