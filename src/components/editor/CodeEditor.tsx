'use client';

import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';

interface Variable {
  name: string;
  type: string;
  default?: string;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  variables: Variable[];
}

// Create a plugin to highlight variables
function createVariableHighlighter(variables: Variable[]): Extension {
  const variableNames = new Set(variables.map(v => v.name));

  const plugin = ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const decorations: any[] = [];
        const text = view.state.doc.toString();
        // Match {{variable}} pattern
        const regex = /\{\{([^}]+)\}\}/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
          const from = match.index;
          const to = match.index + match[0].length;
          const varName = match[1].trim();

          const isDefined = variableNames.has(varName);

          decorations.push(
            Decoration.mark({
              class: isDefined
                ? 'cm-variable-defined'
                : 'cm-variable-undefined',
            }).range(from, to)
          );
        }

        return Decoration.set(decorations);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );

  return plugin;
}

export function CodeEditor({ value, onChange, variables }: CodeEditorProps) {
  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const extensions = useMemo(() => {
    return [
      markdown(),
      createVariableHighlighter(variables),
      EditorView.lineWrapping,
      EditorView.theme({
        '.cm-variable-defined': {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: 'rgb(59, 130, 246)',
          fontWeight: '500',
          borderRadius: '3px',
          padding: '1px 2px',
        },
        '.cm-variable-undefined': {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: 'rgb(239, 68, 68)',
          fontWeight: '500',
          borderRadius: '3px',
          padding: '1px 2px',
        },
        '&': {
          fontSize: '14px',
        },
        '.cm-content': {
          minHeight: '300px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
        '.cm-gutters': {
          backgroundColor: 'rgb(249, 250, 251)',
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgb(243, 244, 246)',
        },
      }),
    ];
  }, [variables]);

  return (
    <div className="border rounded-md overflow-hidden">
      <CodeMirror
        value={value}
        onChange={handleChange}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
        minHeight="300px"
        maxHeight="600px"
      />
    </div>
  );
}
