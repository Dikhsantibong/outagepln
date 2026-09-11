import LetterEditorTiptap from './letter-editor-tiptap';

export default function LetterEditor({
    value,
    onChange,
    className,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}) {
    return (
        <LetterEditorTiptap
            value={value}
            onChange={onChange}
            className={className}
            placeholder={placeholder}
        />
    );
}
