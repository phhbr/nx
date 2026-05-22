# Transform-Validierungssystem - Zusammenfassung

Uebersicht ueber das Validierungs- und Sicherheits-System fuer Codemods.

## Was enthalten ist

### 1. Validator-Module (`codemods/validators/`)

Fuenf klar getrennte Validatoren:

- `manifest-validator.ts`
- `transform-validator.ts`
- `fixture-validator.ts`
- `idempotency-validator.ts`
- `safety-validator.ts`

### 2. Validierungs-CLI (`codemods/validate.ts`)

```bash
node codemods/dist/validate.js
node codemods/dist/validate.js --strict
node codemods/dist/validate.js --transform <id>
```

### 3. Build-Targets

```bash
nx run dpl-web-components:codemods:validate
nx run dpl-web-components:codemods:validate:strict
```

```bash
pnpm --dir packages/dpl-web-components codemods:validate
pnpm --dir packages/dpl-web-components codemods:validate:strict
```

### 4. Dokumentation

- `VALIDATION.md`: Vollstaendige Erklaerung
- `VALIDATION_TESTS.md`: Nutzung in Tests

### 5. Integration

- `tsconfig.cjs.json` inkludiert Validatoren
- `package.json` und `project.json` enthalten Scripts/Targets

## Ablauf im Alltag

1. Transform erstellen
2. Logik implementieren
3. Fixtures anlegen
4. Tests laufen lassen
5. Validieren (Standard)
6. Validieren (Strict in CI/CD)
7. Veroeffentlichen

## Validierungsfluss

1. Manifest laden
2. Manifest pruefen
3. Jeden Transform pruefen
4. Fixtures pruefen
5. Ergebnis ausgeben

## Beispielausgabe (Erfolg)

```text
Validating codemods...

Manifest: OK
Transforms: OK
Fixtures: OK

All codemods passed validation.
```

## Beispielausgabe (Fehler)

```text
Manifest:
  Entry 2: Invalid ID "MyTransform"
Transform:
  Missing required export: transform(source, filePath)
Fixtures:
  Incomplete fixture pair: component.tsx

Validation failed.
```

## Vorteile

- Fruehe Fehlererkennung
- Bessere Sicherheit
- Stabilere, idempotente Migrationen
- Klar fuer CI/CD integrierbar
- Entwicklerfreundliche Rueckmeldungen

## Dateistruktur

```text
packages/dpl-web-components/codemods/
├── VALIDATION.md
├── VALIDATION_TESTS.md
├── VALIDATION_SUMMARY.md
├── validate.ts
└── validators/
    ├── index.ts
    ├── manifest-validator.ts
    ├── transform-validator.ts
    ├── fixture-validator.ts
    ├── idempotency-validator.ts
    └── safety-validator.ts
```

## Befehlsuebersicht

| Aufgabe | Befehl |
| --- | --- |
| Alle Transforms validieren | `nx run dpl-web-components:codemods:validate` |
| Strikt (CI/CD) | `nx run dpl-web-components:codemods:validate:strict` |
| Einzelnen Transform validieren | `nx run dpl-web-components:codemods:validate -- --transform <id>` |

## Naechste Schritte

1. Regeln in `VALIDATION.md` pruefen
2. Testmuster in `VALIDATION_TESTS.md` nutzen
3. `codemods:validate:strict` in CI einbauen
