import './Button.css'

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}) {
  const classes = `ui-button ${variant} ${className}`.trim()
  return <button className={classes} {...props} />
}
