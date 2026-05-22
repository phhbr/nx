# @designsystem/migrations

Versionsbasierte Migrations-CLI fuer `@designsystem/dpl-web-components`.
Fuehre das Tool beim Upgrade aus. Es wendet automatisch alle passenden Codemods auf dein Projekt an.

## Was dieses Paket macht

- Dieses Paket ist der Runner, nicht die Quelle der Transforms.
- Es liest `--from`, `--to`, `--dir` und optional `--only`.
- Es unterstuetzt auch `--format=json`, `--verbose`, `--color` und `--no-color`.
- Es laedt das Codemod-Manifest aus `@designsystem/dpl-web-components/codemods/manifest`.
- Es scannt passende Dateien und fuehrt die gewaehlten Transforms in semver-Reihenfolge aus.
- Die eigentliche Migrationslogik liegt in `packages/dpl-web-components/codemods/`.

---

## Schnellstart

```bash
# Nur anzeigen, was geaendert wuerde (schreibt keine Dateien)
npx @designsystem/migrations --from=1.0.0 --to=2.0.0 --dir=./src --dry-run

# Echt ausfuehren
npx @designsystem/migrations --from=1.0.0 --to=2.0.0 --dir=./src
```

Ersetze `./src` durch den Ordner, den du migrieren willst.
Das Tool scannt rekursiv und ignoriert `node_modules` und `dist` automatisch.

---

## Warum es dieses Tool gibt

Wenn `@designsystem/dpl-web-components` Breaking Changes hat, musst du sonst viele Stellen manuell anpassen.
Mit dieser CLI gibst du Start- und Zielversion an.
Das Tool findet passende Migrationen, fuehrt sie in richtiger Reihenfolge aus und zeigt die Aenderungen.

---

## Nutzung

```text
npx @designsystem/migrations [options]

Options:
  --from <version>   Version, von der du kommst (exclusive), z. B. 1.0.0
  --to   <version>   Version, auf die du gehst (inclusive), z. B. 2.0.0
  --dir  <path>      Ordner mit Dateien, die migriert werden sollen (required)
  --only <id,...>    Kommagetrennte Liste von Migration-IDs (optional)
  --dry-run          Zeigt nur, was geaendert wuerde
  --format=json      Gibt das Ergebnis als JSON aus
  --verbose, -v      Zeigt mehr Logs waehrend der Ausfuehrung
  --color            Erzwingt farbige Ausgabe
  --no-color         Deaktiviert farbige Ausgabe
  --help             Hilfe anzeigen
```

### Mit pnpm

```bash
pnpm dlx @designsystem/migrations --from=1.0.0 --to=2.0.0 --dir=./src
```

### Mit lokaler Installation

```bash
npm install --save-dev @designsystem/migrations
npx migrations --from=1.0.0 --to=2.0.0 --dir=./src
```

---

## Empfohlener Ablauf

1. Lies zuerst den Changelog der Zielversion.
2. Starte mit Dry-Run:

   ```bash
   npx @designsystem/migrations --from=1.0.0 --to=2.0.0 --dir=./src --dry-run
   ```

3. Committe oder stash deine aktuellen Aenderungen.
4. Fuehre die Migration aus:

   ```bash
   npx @designsystem/migrations --from=1.0.0 --to=2.0.0 --dir=./src
   ```

5. Pruefe den Diff, starte Tests, dann committen.

---

## Verfuegbare Migrationen

| From -> To | ID | Aenderung |
| --- | --- | --- |
| < 2.0.0 -> >= 2.0.0 | `rename-cell-type-icon-to-status` | Benennt `CellType`-Wert `icon` in `status` um |

### Unterstuetzte Dateitypen

| Endung | Strategie |
| --- | --- |
| `.tsx`, `.jsx` | Regex-basiert auf flachen Cell-Objektliteralen |
| `.ts`, `.js` | Regex-basiert auf flachen Cell-Objektliteralen |
| `.html` | Regex-basiert auf flachen Cell-Objektliteralen |
| `.vue` | Regex-basiert auf flachen Cell-Objektliteralen |

Dynamische oder berechnete `value`-Werte werden nicht in ein Status-Objekt umgebaut.
Bei solchen Faellen wird nur `type: "icon"` zu `type: "status"` umbenannt.

---

## Beispielausgabe

```text
[dry-run] Would modify: src/app/app.component.ts  (rename-cell-type-icon-to-status)
[dry-run] Would modify: src/components/cell.tsx  (rename-cell-type-icon-to-status)

--- Migration Summary ---
Files scanned:  142
Files modified: 2
  rename-cell-type-icon-to-status: 2 file(s) modified

(dry-run mode: no files were written)
```

---

## Nur eine einzelne Migration ausfuehren

```bash
npx @designsystem/migrations \
  --from=1.0.0 \
  --to=2.0.0 \
  --dir=./src \
  --only=rename-cell-type-icon-to-status
```

---

## Troubleshooting

**"No migrations to apply for X -> Y"**
Dein Versionsbereich enthaelt keine registrierte Migration.
Pruefe `--from` und `--to`.

**"Invalid --from version"**
`--from` und `--to` muessen gueltige semver-Werte sein (z. B. `2.0.0`).

**Eine Datei wurde nicht migriert, obwohl sie sollte**
Der Transform greift nur bei Cell-Objekten mit `type: "icon"`.
Bei dynamischen/berechneten `value`-Ausdruecken wird `value` nicht automatisch umgebaut.

**Die Migration hat etwas Falsches geaendert**
Bitte ein Issue mit reproduzierbarem Beispiel erstellen.

---

## Sicherheitsgarantien

- Migrationen sind **idempotent**.
- **Dry-run** schreibt nie auf die Platte.
- Bei dynamischen `value`-Ausdruecken wird nur `type` umbenannt; `value` bleibt unveraendert.
- Dateien ohne Aenderung werden nicht neu geschrieben.
