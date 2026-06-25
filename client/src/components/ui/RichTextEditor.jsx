import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, Heading } from 'lucide-react';

const RichTextEditor = ({
  value = '',
  onChange,
  label,
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '<p><br></p>';
    }
  }, [value]);

  const handleInput = () => {
    if (onChange && editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div className="rounded-lg border border-white/10 overflow-hidden bg-white/[0.01]">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-1.5 bg-white/[0.03] border-b border-white/10 text-text-secondary select-none">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="p-1.5 rounded hover:bg-white/10 hover:text-text-primary transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="p-1.5 rounded hover:bg-white/10 hover:text-text-primary transition-colors"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-white/10 hover:text-text-primary transition-colors"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'h3')}
            className="p-1.5 rounded hover:bg-white/10 hover:text-text-primary transition-colors"
            title="Heading"
          >
            <Heading className="h-4 w-4" />
          </button>
        </div>

        {/* Contenteditable field */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-3 min-h-[160px] outline-none text-sm text-text-primary bg-transparent focus:bg-white/[0.01] transition-all duration-200"
          style={{ minHeight: '160px' }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
