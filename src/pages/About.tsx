export default function About() {
  return (
    <div className="fh-page-container" style={{ maxWidth: '800px' }}>
      <h1 className="fh-section-title">About FurnitureHub</h1>
      <div className="fh-card p-4">
        <p className="lead">FurnitureHub is a premium social platform dedicated to furniture enthusiasts, designers, and homeowners.</p>
        <p>Our mission is to create a community where people can discover, share, and discuss beautiful furniture from around the world. Whether you're looking for inspiration for your next room redesign, searching for the perfect piece, or just love great design, FurnitureHub is your home.</p>
        <h3 className="mt-4 mb-3" style={{ color: 'var(--fh-primary)' }}>What We Offer</h3>
        <ul>
          <li>Curated furniture feed with infinite scroll</li>
          <li>Browse by category, trending, and featured collections</li>
          <li>Like, comment, share, and save your favorite pieces</li>
          <li>Real-time chat with our design team</li>
          <li>Search across posts, captions, tags, and users</li>
        </ul>
      </div>
    </div>
  )
}
