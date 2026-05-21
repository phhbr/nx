import React from 'react';

interface ButtonBarProps {
  isDestructive?: boolean;
}

export function ButtonBar({ isDestructive }: ButtonBarProps) {
  const dynamicVariant = isDestructive ? 'outline' : 'solid';

  return (
    <div className="button-bar">
      <dpl-button variant="outline" label="Delete" />
      <dpl-button variant="ghost" label="Cancel" />
      <dpl-button variant={"outline"} label="JSX expression" />
      <dpl-button variant={isDestructive ? "outline" : "solid"} label="Ternary" />
      <dpl-button variant={dynamicVariant} label="Variable" />
      <dpl-button {...spreadProps} variant="outline" label="Spread" />
      <DplButton variant="outline" label="Angular proxy" />
      <SomeOtherButton variant="outline" label="Other" />
      <dpl-button
        disabled
        variant="outline"
        onClick={handleClick}
      >
        Save changes
      </dpl-button>
    </div>
  );
}
