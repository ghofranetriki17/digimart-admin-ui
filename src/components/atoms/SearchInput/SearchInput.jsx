import './SearchInput.css'

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  inputClassName = '',
  ...props
}) {
  const wrapperClass = `search-input ${className}`.trim()
  const inputClass = `search-input-field ${inputClassName}`.trim()
  return (
    <div className={wrapperClass}>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
        {...props}
      />
    </div>
  )
}
