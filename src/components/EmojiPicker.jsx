import './EmojiPicker.css';

// Curated palette for a study / knowledge blog. Free input still allowed.
const EMOJIS = [
  '📚', '📖', '📝', '✏️', '🧠', '💡', '🔬', '🧪', '⚛️', '🧬',
  '🤖', '💻', '🖥️', '⌨️', '🌐', '🔗', '⚙️', '🧩', '📐', '📊',
  '📈', '🧮', '🔢', '🔭', '🛰️', '🎯', '🚀', '🏗️', '🗂️', '📦',
  '🔍', '🎓', '📌', '🧵', '🪐', '♟️', '🎲', '📡', '🔐', '🧱',
];

/**
 * Compact emoji picker: a free-text field (for any custom emoji) plus a
 * clickable palette of common ones. `value` is the current icon string.
 */
export default function EmojiPicker({ value, onChange }) {
  return (
    <div className="emoji-picker">
      <input
        className="emoji-picker__input"
        type="text"
        maxLength={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="📚"
        title="自定义：输入任意 emoji"
      />
      <div className="emoji-picker__grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className={`emoji-picker__btn${value === e ? ' emoji-picker__btn--active' : ''}`}
            onClick={() => onChange(e)}
            title={e}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
