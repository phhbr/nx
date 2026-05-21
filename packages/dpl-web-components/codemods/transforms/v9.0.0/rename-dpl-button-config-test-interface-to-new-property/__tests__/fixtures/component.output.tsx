import React from 'react';

export function ConfiguredButtonDemo() {
  const externalConfig = { testInterface: data, title: 'External', id: 'ext' };

  return (
    <div>
      <dpl-button buttonConfig={{ newProperty: data, title: 'Inline', id: 'a' }} />
      <dpl-button buttonConfig={{ newProperty: testInterface, title: 'Shorthand', id: 'b' }} />
      <dpl-button buttonConfig={{ newProperty: data, title: 'Quoted key', id: 'c' }} />
      <dpl-button buttonConfig={externalConfig} />
      <dpl-button buttonConfig={{ newProperty: data, title: 'Already migrated', id: 'd' }} />
      <DplButton buttonConfig={{ newProperty: ngData, title: 'Angular', id: 'e' }} />
      <SomeOther buttonConfig={{ testInterface: x }} />
    </div>
  );
}
