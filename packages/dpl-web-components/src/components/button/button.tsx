import { Component, Event, EventEmitter, h, Prop } from "@stencil/core";

@Component({
  tag: "dpl-button",
  styleUrl: "button.css",
  shadow: true,
})
export class Button {
  @Prop() disabled!: boolean;
  @Prop() name?: string;
  @Event() dplClick!: EventEmitter<void>;
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
