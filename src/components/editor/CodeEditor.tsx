'use client';

import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark' || resolvedTheme === 'futuristic';

  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  const extensions = useMemo(() => {
    // Theme-aware colors
    const theme = isDark ? {
      background: resolvedTheme === 'futuristic' ? 'hsl(240, 10%, 5%)' : 'hsl(222.2, 84%, 4.9%)',
      foreground: resolvedTheme === 'futuristic' ? 'hsl(180, 100%, 90%)' : 'hsl(210, 40%, 98%)',
      gutter: resolvedTheme === 'futuristic' ? 'hsl(240, 10%, 8%)' : 'hsl(217.2, 32.6%, 12%)',
      activeGutter: resolvedTheme === 'futuristic' ? 'hsl(240, 10%, 10%)' : 'hsl(217.2, 32.6%, 15%)',
      selection: resolvedTheme === 'futuristic' ? 'hsl(180, 100%, 50%, 0.15)' : 'hsl(217.2, 91.2%, 59.8%, 0.15)',
      activeLine: resolvedTheme === 'futuristic' ? 'hsl(240, 10%, 7%)' : 'hsl(217.2, 32.6%, 10%)',
      variableDefined: {
        bg: resolvedTheme === 'futuristic' ? 'rgba(0, 255, 255, 0.1)' : 'rgba(59, 130, 246, 0.15)',
        color: resolvedTheme === 'futuristic' ? 'hsl(180, 100%, 60%)' : 'rgb(96, 165, 250)',
      },
      variableUndefined: {
        bg: resolvedTheme === 'futuristic' ? 'rgba(255, 0, 100, 0.1)' : 'rgba(239, 68, 68, 0.15)',
        color: resolvedTheme === 'futuristic' ? 'hsl(330, 100%, 60%)' : 'rgb(248, 113, 113)',
      },
    } : {
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(222.2, 84%, 4.9%)',
      gutter: 'hsl(210, 40%, 98%)',
      activeGutter: 'hsl(210, 40%, 96%)',
      selection: 'hsl(221.2, 83.2%, 53.3%, 0.1)',
      activeLine: 'hsl(210, 40%, 98%)',
      variableDefined: {
        bg: 'rgba(59, 130, 246, 0.1)',
        color: 'rgb(59, 130, 246)',
      },
      variableUndefined: {
        bg: 'rgba(239, 68, 68, 0.1)',
        color: 'rgb(239, 68, 68)',
      },
    };

    return [
      markdown(),
      createVariableHighlighter(variables),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          backgroundColor: theme.background,
          color: theme.foreground,
        },
        '.cm-content': {
          minHeight: '300px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          caretColor: theme.foreground,
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: theme.foreground,
        },
        '&.cm-focused .cm-selectionBackground, ::selection': {
          backgroundColor: theme.selection,
        },
        '.cm-activeLine': {
          backgroundColor: theme.activeLine,
        },
        '.cm-gutters': {
          backgroundColor: theme.gutter,
          color: theme.foreground,
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: theme.activeGutter,
        },
        '.cm-lineNumbers .cm-gutterElement': {
          color: isDark ? 'hsl(215, 20.2%, 65.1%)' : 'hsl(215.4, 16.3%, 46.9%)',
        },
        '.cm-variable-defined': {
          backgroundColor: theme.variableDefined.bg,
          color: theme.variableDefined.color,
          fontWeight: '500',
          borderRadius: '3px',
          padding: '1px 2px',
        },
        '.cm-variable-undefined': {
          backgroundColor: theme.variableUndefined.bg,
          color: theme.variableUndefined.color,
          fontWeight: '500',
          borderRadius: '3px',
          padding: '1px 2px',
        },
      }, { dark: isDark }),
    ];
  }, [variables, isDark, resolvedTheme]);

  return (
    <div className="border rounded-md overflow-hidden border-border">
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
