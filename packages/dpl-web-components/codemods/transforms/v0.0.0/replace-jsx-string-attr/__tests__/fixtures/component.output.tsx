import React from 'react';

function Showcase() {
  const isPrimary = true;
  const active = false;

  return (
    <div>
      {/* Paired tag */}
      <DplButton variant="ghost">Label</DplButton>
      {/* Self-closing */}
      <DplButton variant="ghost" />
      {/* Attribute among others */}
      <DplButton className="btn" variant="ghost" disabled />
      {/* Multi-line tag */}
      <DplButton
        className="action"
        variant="ghost"
      />
      {/* JSX expression container — string literal */}
      <DplButton variant={"ghost"} />
      {/* Ternary inside expression container */}
      <DplButton variant={isPrimary ? "ghost" : "solid"} />
      {/* kebab-case alias in target list */}
      <dpl-button variant="ghost" />
      {/* Non-target elements — must NOT change */}
      <OtherButton variant="outline" />
      <span className="outline" />
    </div>
  );
}

export default Showcase;
