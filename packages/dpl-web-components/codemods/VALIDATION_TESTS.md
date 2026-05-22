# Safety- und Validierungschecks in Transform-Tests nutzen

Kurzanleitung fuer Entwickler, die Transforms implementieren.

## Safety-Pruefung in Tests

`validateSafety()` hilft, kaputte Ausgaben frueh zu erkennen.

### Einfaches Beispiel

```typescript
import { validateSafety } from '../validators/safety-validator';
import { transform } from './index';

describe('my-transform', () => {
  it('ist sicher und behaelt die Struktur', () => {
    const input = `{ type: 'icon', value: 'check-circle' }`;
    const output = transform(input, 'component.tsx');

    const result = validateSafety(input, output, 'component.tsx');

    // Fehler bedeuten: moegliche Korruption
    expect(result.errors).toHaveLength(0);
  });
});
```

### Was geprueft wird

- Inhalt nicht komplett geloescht
- Warnung bei uebermaessigen Loeschungen
- Warnung bei unausgeglichenen Delimitern
- Warnung bei starker Verdopplung
- Fehler, wenn Ausgabe leer ist obwohl Eingabe nicht leer war

## Idempotenz in Tests

`validateIdempotency()` stellt sicher, dass ein zweiter Lauf nichts weiter aendert.

### Einfaches Beispiel

```typescript
import { validateIdempotency } from '../validators/idempotency-validator';
import { transform } from './index';

describe('idempotency', () => {
  it('zweiter Lauf liefert gleiches Ergebnis', () => {
    const testCases = [
      {
        description: 'basic cell migration',
        input: `{ type: 'icon', value: 'check-circle' }`,
        filePath: 'component.tsx',
      },
      {
        description: 'already migrated',
        input: `{ type: 'status', value: { icon: 'check-circle', text: 'check-circle', color: 'gray' } }`,
        filePath: 'component.tsx',
      },
    ];

    const result = validateIdempotency(transform, testCases);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

## Gute Testpraxis

- No-op Fall immer testen (bereits migriert)
- Dynamische Bindings testen (sollten oft unveraendert bleiben)
- Mehrere Treffer in einer Datei testen
- JSX und HTML/Template Varianten getrennt testen

## Vollstaendiges Muster

```typescript
import { validateSafety } from '../validators/safety-validator';
import { validateIdempotency } from '../validators/idempotency-validator';
import { transform } from './index';

describe('rename-cell-type-icon-to-status', () => {
  it('ist idempotent', () => {
    const result = validateIdempotency(transform, [
      {
        description: 'basic rename + value object migration',
        input: `{ type: 'icon', value: 'check-circle' }`,
        filePath: 'component.tsx',
      },
      {
        description: 'dynamic value is left as-is',
        input: `{ type: 'icon', value: statusIconName }`,
        filePath: 'component.tsx',
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('korruptiert kein JSX', () => {
    const input = `const cell = { type: 'icon', value: 'check-circle' };`;
    const output = transform(input, 'component.tsx');

    const result = validateSafety(input, output, 'component.tsx');
    expect(result.errors).toHaveLength(0);
  });
});
```

## Jest-Integration

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
```

```bash
nx run dpl-web-components:codemods:test
nx run dpl-web-components:codemods:test -- rename-cell-type-icon-to-status
nx run dpl-web-components:codemods:test -- --watch
```

## CI/CD Beispiel

```yaml
name: Validate Transforms

on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: nx run dpl-web-components:codemods:build
      - run: nx run dpl-web-components:codemods:test
      - run: nx run dpl-web-components:codemods:validate:strict
```

## Troubleshooting

**Idempotenz faellt durch**

- Gib bei No-op immer den Original-String zurueck
- Pruefe, ob Regex im zweiten Lauf neue Treffer erzeugt

**Safety-Warnung: Delimiter unausgeglichen**

- Regex ist meist zu breit oder entfernt zu viel
- Fuer komplexe JS/TS-Faelle besser AST (`recast`) statt Regex nutzen

**Fixture-Tests schlagen fehl**

- `.input` und `.output` als Paar pruefen
- Syntax der Fixture-Dateien pruefen
