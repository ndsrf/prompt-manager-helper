'use client';

import ReactDiffViewer from 'react-diff-viewer-continued';

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  oldTitle?: string;
  newTitle?: string;
}

export function DiffViewer({
  oldValue,
  newValue,
  oldTitle = 'Original',
  newTitle = 'Modified',
}: DiffViewerProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView={true}
        leftTitle={oldTitle}
        rightTitle={newTitle}
        styles={{
          variables: {
            dark: {
              diffViewerBackground: '#ffffff',
              diffViewerColor: '#000000',
              addedBackground: '#e6ffec',
              addedColor: '#24292e',
              removedBackground: '#ffeef0',
              removedColor: '#24292e',
              wordAddedBackground: '#acf2bd',
              wordRemovedBackground: '#fdb8c0',
              addedGutterBackground: '#cdffd8',
              removedGutterBackground: '#ffdce0',
              gutterBackground: '#f6f8fa',
              gutterBackgroundDark: '#f3f4f6',
              highlightBackground: '#fffbdd',
              highlightGutterBackground: '#fff5b1',
            },
          },
          line: {
            padding: '10px 2px',
            fontSize: '13px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          },
        }}
        useDarkTheme={false}
        showDiffOnly={false}
      />
    </div>
  );
}
