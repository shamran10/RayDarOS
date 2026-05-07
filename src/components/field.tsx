export function Field({
  label,
  children,
  htmlFor,
  help
}: {
  label: string;
  children: React.ReactNode;
  htmlFor?: string;
  help?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {help ? <div className="field-help">{help}</div> : null}
    </div>
  );
}
