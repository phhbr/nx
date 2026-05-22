import React from 'react';

function Showcase() {
  return (
    <div>
      {/* Identifier key */}
      <DplButton buttonConfig={{ newProperty: myData, title: "T" }} />
      {/* Shorthand property — gets expanded */}
      <DplButton buttonConfig={{ newProperty: testInterface, title: "T" }} />
      {/* Already migrated — no-op */}
      <DplButton buttonConfig={{ newProperty: myData }} />
      {/* kebab-case alias in target list */}
      <dpl-button buttonConfig={{ newProperty: val }} />
      {/* Non-target element — must NOT change */}
      <OtherButton buttonConfig={{ testInterface: data }} />
    </div>
  );
}

export default Showcase;
