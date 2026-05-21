import React from 'react';

interface ButtonBarProps {
  isDestructive?: boolean;
}

export function ButtonBar({ isDestructive }: ButtonBarProps) {
  const dynamicVariant = isDestructive ? 'outline' : 'solid';

  return (
    <div className="button-bar">
      <dpl-button variant="ghost" label="Delete" />
      <dpl-button variant="ghost" label="Cancel" />
      <dpl-button variant={"ghost"} label="JSX expression" />
      <dpl-button variant={isDestructive ? "ghost" : "solid"} label="Ternary" />
      <dpl-button variant={dynamicVariant} label="Variable" />
      <dpl-button {...spreadProps} variant="ghost" label="Spread" />
      <DplButton variant="ghost" label="Angular proxy" />
      <SomeOtherButton variant="outline" label="Other" />
      <dpl-button
        disabled
        variant="ghost"
        onClick={handleClick}
      >
        Save changes
      </dpl-button>
    </div>
  );
}
