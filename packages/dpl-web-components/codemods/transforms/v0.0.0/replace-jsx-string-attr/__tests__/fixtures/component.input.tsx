import React from 'react';

function Showcase() {
  const isPrimary = true;
  const active = false;

  return (
    <div>
      {/* Paired tag */}
      <DplButton variant="outline">Label</DplButton>

      {/* Self-closing */}
      <DplButton variant="outline" />

      {/* Attribute among others */}
      <DplButton className="btn" variant="outline" disabled />

      {/* Multi-line tag */}
      <DplButton
        className="action"
        variant="outline"
      />

      {/* JSX expression container — string literal */}
      <DplButton variant={"outline"} />

      {/* Ternary inside expression container */}
      <DplButton variant={isPrimary ? "outline" : "solid"} />

      {/* kebab-case alias in target list */}
      <dpl-button variant="outline" />

      {/* Non-target elements — must NOT change */}
      <OtherButton variant="outline" />
      <span className="outline" />
    </div>
  );
}

export default Showcase;
