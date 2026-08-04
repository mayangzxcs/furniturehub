export default function Privacy() {
  return (
    <div className="fh-page-container" style={{ maxWidth: '800px' }}>
      <h1 className="fh-section-title">Privacy Policy</h1>
      <div className="fh-card p-4">
        <p className="lead">Your privacy is important to us.</p>
        <h3 className="mt-4 mb-2" style={{ color: 'var(--fh-primary)' }}>Information We Collect</h3>
        <p>We collect your name, email address, and profile information when you create an account. We also collect data about your interactions with our platform, such as posts you like, comment on, and save.</p>
        <h3 className="mt-4 mb-2" style={{ color: 'var(--fh-primary)' }}>How We Use Your Information</h3>
        <ul><li>To provide and maintain our service</li><li>To notify you about changes to our platform</li><li>To provide customer support</li><li>To gather analysis and improve our service</li></ul>
        <h3 className="mt-4 mb-2" style={{ color: 'var(--fh-primary)' }}>Data Storage</h3>
        <p>Your data is stored securely using Supabase infrastructure with row-level security policies ensuring only you can access your personal data.</p>
        <h3 className="mt-4 mb-2" style={{ color: 'var(--fh-primary)' }}>Your Rights</h3>
        <p>You have the right to access, modify, or delete your personal data at any time through your profile settings.</p>
      </div>
    </div>
  )
}
