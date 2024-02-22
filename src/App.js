import React, { useState, useEffect } from 'react';
import { EditorState, convertToRaw, convertFromRaw, Modifier, SelectionState, RichUtils } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import DOMPurify from 'dompurify';

import './App.css';

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
  RED_COLOR: {
    color: 'rgba(255, 0, 0, 0.7)',
    backgroundColor: 'red',
  },
  Bold: {
    fontWeight: 8
  }
};



function App() {
  const [editorState, setEditorState] = useState(() => {
    // Load content from localStorage on component mount
    const savedData = localStorage.getItem('editorData');
    if (savedData) {
      const contentState = convertFromRaw(JSON.parse(savedData));
      return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
  });

  useEffect(() => {
    // Save content to localStorage on editor state change
    const contentState = editorState.getCurrentContent();
    const rawData = convertToRaw(contentState);
    localStorage.setItem('editorData', JSON.stringify(rawData));
  }, [editorState]);

  const handleBeforeInput = (chars, editorState) => {
    const selectionState = editorState.getSelection();
    const anchorKey = selectionState.getAnchorKey();
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(anchorKey);
    const blockText = currentBlock.getText();

    let newEditorState = editorState;

    if (chars === '@' && blockText.trim() === '@') {
      const selection = SelectionState.createEmpty(anchorKey).merge({
        anchorOffset: blockText.length,
        focusOffset: blockText.length,
      });
  
      const contentState = Modifier.applyInlineStyle(currentContent, selection, 'RED_COLOR');
      newEditorState = EditorState.push(editorState, contentState, 'change-inline-style');
    }
    else if (blockText.startsWith('#') && blockText.trim() === '#') {
      newEditorState = applyHeaderFormatting(editorState);
    } else if (blockText.endsWith('*') && blockText.trim() === '*') {
      newEditorState = applyBoldFormatting(editorState);
    }
    else if (blockText.endsWith('$') && blockText.trim() === '$') {
      newEditorState = applyUnderlineFormatting(editorState);
    }

    if (newEditorState !== editorState) {
      setEditorState(newEditorState);
      return 'handled';
    }

    return 'not-handled';
  };

  const applyHeaderFormatting = (editorState) => {
    const selectionState = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const blockType = 'header-one';
    const contentState = Modifier.setBlockType(currentContent, selectionState, blockType);
    return EditorState.push(editorState, contentState, 'change-block-type');
  };

  const applyBoldFormatting = (editorState) => {
    return RichUtils.toggleInlineStyle(editorState, 'BOLD');
  };

  const applyRedColorFormatting = (editorState) => {
    return RichUtils.toggleInlineStyle(editorState, 'RED_COLOR');
  };

  const applyUnderlineFormatting = (editorState) => {
    return RichUtils.toggleInlineStyle(editorState, 'UNDERLINE');
  };

  const saveContent = () => {
    const contentState = editorState.getCurrentContent();
    const rawData = convertToRaw(contentState);
    localStorage.setItem('editorData', JSON.stringify(rawData));
  };

  return (
    <div className="App">
      <header className="App-header">
        DEMO editor by Sajeed Khan
      </header>
      <button onClick={saveContent}>Save</button>
      <Editor
        editorState={editorState}
        onEditorStateChange={setEditorState}
        wrapperClassName="wrapper-class"
        editorClassName="editor-class"
        toolbarClassName="toolbar-class"
        handleBeforeInput={handleBeforeInput}
        customStyleMap={styleMap}
        toolbar={{
        }}
      />
      <div className="preview" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorState.getCurrentContent().getPlainText()) }} />
    </div>
  );
}

export default App;
