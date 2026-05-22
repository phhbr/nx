# Transform-Validierung und Sicherheitspruefungen

Automatisches Validierungssystem, damit Codemods sicher und korrekt bleiben.

## Schnellstart

Nach dem Build der Codemods:

```bash
# Standard-Validierung (Warnungen sind erlaubt)
nx run dpl-web-components:codemods:validate

# Strikter Modus (Warnungen sind Fehler)
nx run dpl-web-components:codemods:validate:strict

# Nur einen Transform pruefen
nx run dpl-web-components:codemods:validate -- --transform rename-my-prop

# Via npm/pnpm
pnpm --dir packages/dpl-web-components codemods:validate
pnpm --dir packages/dpl-web-components codemods:validate:strict
```

## Was geprueft wird

### 1. Manifest-Validierung

Prueft `manifest.ts`:

- Version muss gueltiges semver sein (z. B. `3.0.0`)
- Transform-ID muss kebab-case sein und eindeutig
- Beschreibung darf nicht leer sein (Warnung bei > 120 Zeichen)
- File-Extensions muessen gueltig sein
- Transform-Pfad muss existieren
- Keine doppelten IDs
- Mehrere Transforms in derselben Version erzeugen Warnung

Beispiel:

```text
Entry 2 (my-transform): Invalid ID "MyTransform". Must be kebab-case.
Entry 1 (rename-prop): Transform file not found: /path/to/transforms/v3.0.0/rename-prop/index.ts
```

### 2. Transform-Modul-Validierung

Prueft die Implementierung:

- Pflicht-Export: `transform(source: string, filePath: string) => string`
- Optionale Exporte: `transformJsx()` und/oder `transformHtml()`
- Keine Syntaxfehler
- Erwartete Signaturen

Beispiel:

```text
Transform: rename-cell-type-icon-to-status
  Missing required export: function transform(source, filePath)
  Warning: No transformJsx or transformHtml functions found.
```

### 3. Fixture-Validierung

Prueft Fixtures auf Vollstaendigkeit und Syntax:

- `.input` und `.output` Dateien muessen als Paar vorhanden sein
- Dateien muessen syntaktisch gueltig sein
- Mindestens ein vollstaendiges Fixture-Paar sollte existieren

Beispiel:

```text
Fixtures: rename-cell-type-icon-to-status
  Incomplete fixture pair: component.tsx. Both .input and .output files must exist.
  Warning: No complete fixture pairs found.
```

### 4. Idempotenz-Checks (in Tests)

Ziel:

- `transform(transform(source)) === transform(source)`
- Keine doppelten Aenderungen
- Stabiles Ergebnis

### 5. Sicherheits-Checks (in Tests)

Prueft typische Fehler:

- Inhalt nicht komplett geloescht
- Keine extremen Loeschungen (> 50%)
- Keine unbeabsichtigte Verdopplung
- Klammern und Delimiter bleiben ausgeglichen
- Kein unerwartetes `undefined`/`null`

## Validierungsmodi

### Standard-Modus

Nur Fehler blockieren.

```bash
nx run dpl-web-components:codemods:validate
```

### Strikter Modus

Fehler und Warnungen blockieren (CI/CD).

```bash
nx run dpl-web-components:codemods:validate:strict
```

## Typischer Workflow

```bash
# Build
nx run dpl-web-components:codemods:build

# Tests
nx run dpl-web-components:codemods:test

# Strikt validieren
nx run dpl-web-components:codemods:validate:strict

# Danach veroeffentlichen
pnpm publish
```

## In CI/CD

```yaml
- name: Validate codemods
  run: nx run dpl-web-components:codemods:validate:strict
```

## Kurzreferenz der Validatoren

### ManifestValidator

```typescript
validateManifest(manifest: CodemodEntry[], manifestDir: string): ManifestValidationResult
```

### TransformValidator

```typescript
validateTransformModule(transformPath: string): TransformValidationResult
```

### FixtureValidator

```typescript
validateFixtures(transformDir: string): FixtureValidationResult
```

### IdempotencyValidator

```typescript
validateIdempotency(transform, testCases): IdempotencyValidationResult
```

### SafetyValidator

```typescript
validateSafety(input: string, output: string, filePath: string): SafetyValidationResult
```

## Haeufige Probleme

### Unvollstaendiges Fixture-Paar

Loesung: Fehlende `.output` Datei anlegen.

### Syntaxfehler in Fixtures

Loesung: Datei mit TypeScript/HTML-Tools pruefen und korrigieren.

### Warnung: Zu viel geloescht

Loesung:

- Matching enger machen
- Bei No-op immer Originalquelle zurueckgeben
- Guard-Checks vor destruktiven Schritten einbauen

### Warnung: Kein `transformJsx`/`transformHtml`

Das kann okay sein, wenn `transform()` das Routing selbst uebernimmt.
Dokumentiere den Grund.

## Integration mit dem Generator

`nx generate @designsystem/dpl-web-components:transform` hilft bereits bei:

- Manifest-Eintrag
- Fixture-Vorlagen
- Typen und Grundstruktur

Trotzdem nach Implementierung immer validieren.

## Moegliche Verbesserungen

- Auto-Fix fuer einfache Probleme
- Laufzeitmessungen pro Transform
- Bessere Coverage-Berichte
- ESLint-Integration
- Vergleich mit frueheren Outputs
- Framework-spezifische Regeln
