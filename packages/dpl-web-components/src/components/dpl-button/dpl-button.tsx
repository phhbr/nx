import { Component, Event, EventEmitter, h, Prop, State } from "@stencil/core";
import { SomeEventInterface, SomeInterface, ITestButtonConfig } from "../../interfaces/";

@Component({
  tag: "dpl-button",
  styleUrl: "dpl-button.css",
  shadow: true,
})
export class DplButton {
  @Prop() complexProp!: SomeInterface;
  @Prop() buttonConfig!: ITestButtonConfig;
  @Prop() disabled: boolean = false;
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
