import { Component, EventEmitter, Event, h, State } from "@stencil/core";
import { SomeEventInterface } from "../../interfaces/events/some-event-interface";

@Component({
  tag: "dpl-button",
  styleUrl: "dpl-button.css",
  shadow: true,
})
export class DplButton {
  @Event() buttonAction!: EventEmitter<SomeEventInterface>;
  @State() count: number = 0;
  render() {
    return (
      <button
        onClick={() =>
          this.buttonAction.emit({
            item: "button",
            name: "click",
            count: this.count++,
          })
        }
      >
        <slot></slot>
      </button>
    );
  }
}
