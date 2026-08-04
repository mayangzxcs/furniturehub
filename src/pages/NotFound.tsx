export default function NotFound() {
  return (
    <div className="text-center py-5">
      <i className="bi bi-exclamation-circle" style={{ fontSize: '4rem', color: 'var(--fh-primary)', opacity: 0.5 }}></i>
      <h1 className="mt-3" style={{ fontSize: '3rem', color: 'var(--fh-primary)' }}>404</h1>
      <p className="text-muted">Page not found</p>
      <a href="/" className="btn-fh-outline btn mt-2">Go Home</a>
    </div>
  )
}
