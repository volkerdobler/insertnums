# InsertSeq — Analysebericht: Bugs, Codequalität & Verbesserungsvorschläge

Dieser Bericht dokumentiert alle identifizierten Probleme, logischen Schwachstellen und Randfall-Bugs in der VS Code Extension **InsertSeq** (Version 1.1.1) sowie konkrete Empfehlungen für Erweiterungen und Optimierungen.

---

## Inhaltsverzeichnis

1. [Kritische Bugs (Schweregrad: Hoch)](#1-kritische-bugs-schweregrad-hoch)
2. [Berechnungs-, Logik- und Parsing-Fehler (Schweregrad: Mittel)](#2-berechnungs--logik--und-parsing-fehler-schweregrad-mittel)
4. [Vorschläge für funktionale Erweiterungen](#4-vorschläge-für-funktionale-erweiterungen)
5. [Vorschläge für User Experience (UX)](#5-vorschläge-für-user-experience-ux)
6. [Vorschläge für Architektur & Testautomatisierung](#6-vorschläge-für-architektur--testautomatisierung)
7. [Empfohlene Roadmap](#7-empfohlene-roadmap)

---

---

## 4. Vorschläge für funktionale Erweiterungen

### 4.3 Römische Ziffern
* **Nutzen:** Beliebt für Gliederungen in Markdown, HTML-Listen oder Dokumentationen.
* **Syntax-Idee:** `I` (groß: I, II, III...) oder `i` (klein: i, ii, iii...).

### 4.4 Zufalls-Token, Passwörter & Hash-Strings
* **Nutzen:** Schnelles Generieren von Dummy-Passwörtern oder Test-Hashes.
* **Syntax-Idee:** `rnd:12` (12-stelliger alphanumerischer Zufallsstring) oder `hex:16` (16 Bytes hexadezimal).

### 4.5 Netzwerk- & IP-Adressen
* **Nutzen:** DevOps- und Netzwerk-Konfigurationen (Subnetze, Host-Listen).
* **Syntax-Idee:** `192.168.1.1:1` -> zählt das letzte Oktett hoch (`192.168.1.1`, `.2`, `.3`, ...).

---

## 5. Vorschläge für User Experience (UX)

### 5.1 Quick-Presets / Favoriten (Named Sequences)
* Über ein Zahnrad-Icon oder einen Befehl `Insert Sequences: Save as Preset` sollten häufig genutzte Eingaben dauerhaft mit einem sprechenden Namen gespeichert werden können (z. B. *"Markdown Table Row Index"*, *"SQL Insert IDs"*).

### 5.2 Interaktiver Wizard / Sequenz-Assistent
* Die Syntax ist extrem mächtig, für Gelegenheitsnutzer aber schwer zu merken. Ein Wizard-Modus (`Insert Sequences: Wizard`) könnte Schritt für Schritt per Dropdown durch Typ, Start, Schrittweite und Format führen.

### 5.3 Live-Fehlerfeedback in der InputBox
* Der `validateInput`-Hook gibt derzeit immer `''` zurück. Bei Syntaxfehlern in Ausdrücken (`::`) oder ungültigen Parametern sollte dort eine direkte Hilfestellung angezeigt werden (z. B. *"Ungültiger Ausdruck: 'abc' is not defined"*).

### 5.4 Native Ghost-Text Preview
* Ergänzend zu den After-Decorations könnte VS Codes nativer Inline-Completion- / Ghost-Text-Modus verwendet werden, um Flackern und Layout-Verschiebungen bei komplexen Zeilenumbrüchen zu vermeiden.

---

## 6. Vorschläge für Architektur & Testautomatisierung

### 6.1 Echte Scope-Variablen statt Regex-Stringersetzung in `safeEvaluate`
`safeEvaluate` unterstützt bereits die Übergabe eines `context`-Objekts:
```typescript
safeEvaluate(expr, 1000, {
    _: currentValue,      // Zahl oder String je nach Sequenztyp
    i: currentIndex,      // 0-basierter Index
    n: selectionCount,    // Anzahl Cursors
    s: step,              // Schrittweite
    a: start,             // Startwert
    p: previousValue,     // Vorheriger Wert
    o: origSelectedText,  // Selektierter Originaltext
    c: valueAfterExpr,    // Wert nach Transformation
});
```
* **Vorteile:**
  - Löst den `'1' + 1 = '110'` Konkatenationsbug vollständig.
  - Verhindert Quote-Syntaxfehler (`don't`).
  - Keine fehlerhaften Ersetzungen in JS-Keywords oder Stringliteralen (`'i = ' + i`).

### 6.2 Debouncing bei `validateInput`
* Bei jedem Tastenanschlag wird die Sequenz derzeit synchron für bis zu 10.000 Iterationen neu berechnet und evaluiert. Ein Debounce von 50–80 ms entlastet die CPU und sorgt für flüssiges Tippen.

### 6.3 Atomare Edits mit `vscode.WorkspaceEdit`
* `editor.edit` kann in Randfällen scheitern, wenn währenddessen Dokument-Events eintreffen. Ein `WorkspaceEdit` fasst alle Änderungen (auch über Cursor-Grenzen hinweg) garantiert in einer einzigen atomaren Undo/Redo-Transaktion zusammen.

### 6.4 Echtes Unit-Test-Framework (Vitest / Mocha)
* Aufbau einer Test-Suite im Verzeichnis `test/`, die alle Sequenzarten automatisiert prüft:
  - Arithmetik (Positive/negative Steps, Floats, Hex, Binär, Oktal)
  - String-Sequenzen (Überlauf z -> aa, Groß-/Kleinschreibung)
  - Datum & Temporal-Formatierung
  - JS-Ausdrücke und Stop-Conditions
  - History-Verhalten und Multi-Cursor-Reihenfolge

---

## 7. Empfohlene Roadmap

1. **Sofortmaßnahmen (Bugfixes):**
   - [ ] History-Speicherung reparieren (`if (input !== undefined)`).
   - [ ] Datenverlust im History-QuickPick bei Escape/Edit beheben.
   - [ ] Cursors und selektierte Texte gemeinsam sortieren (`sortedOutput`).
   - [ ] Absturz bei `string.ts` (Index < 0) und `expression.ts` (Undefined Overflow) abfangen.
   - [ ] `#`-Füllzeichen in `formatString` aufnehmen und Unit-Test reparieren.
   - [ ] Datums-Locale Fallback für `de-DE` korrigieren.

2. **Refactoring (Ausdrucks-Evaluierung & Bereinigung):**
   - [ ] `replaceSpecialChars` durch echte Context-Parameter in `safeEvaluate` ablösen.
   - [ ] Totes Code-Material entfernen (`sequence.ts`, `regexBuilder.ts`, ungenutzte Hilfsfunktionen).
   - [ ] Linter-Warnungen beheben (`npm run lint`).

3. **Feature-Erweiterungen:**
   - [ ] UUIDv4/v7-Generator implementieren.
   - [ ] Timestamp-/Uhrzeit-Erweiterung für Datumssequenzen.
   - [ ] Presets / Favoriten-Verwaltung hinzufügen.
   - [ ] Vitest-basiertes Test-Setup einrichten.

