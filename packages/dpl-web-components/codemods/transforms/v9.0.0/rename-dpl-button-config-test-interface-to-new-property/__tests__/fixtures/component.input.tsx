import React from 'react';

export function ConfiguredButtonDemo() {
  const externalConfig = { testInterface: data, title: 'External', id: 'ext' };

  return (
    <div>
      <dpl-button buttonConfig={{ testInterface: data, title: 'Inline', id: 'a' }} />
      <dpl-button buttonConfig={{ testInterface, title: 'Shorthand', id: 'b' }} />
      <dpl-button buttonConfig={{ "testInterface": data, title: 'Quoted key', id: 'c' }} />
      <dpl-button buttonConfig={externalConfig} />
      <dpl-button buttonConfig={{ newProperty: data, title: 'Already migrated', id: 'd' }} />
      <DplButton buttonConfig={{ testInterface: ngData, title: 'Angular', id: 'e' }} />
      <SomeOther buttonConfig={{ testInterface: x }} />
    </div>
  );
}
