import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="fh-footer">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--fh-primary)' }}>
              <i className="bi bi-house-door-fill me-2"></i>Home of Comfort by Mark LTD
            </h5>
            <p style={{ opacity: 0.7, fontSize: '0.95rem' }}>
              Expert furniture repair, reupholstery, and restoration services. We breathe new life into your cherished pieces while preserving the memories and history built into them.
            </p>
          </div>
          <div className="col-lg-2 col-6">
            <h6 className="fw-bold mb-3">Explore</h6>
            <Link to="/feed" className="fh-footer-link">Feed</Link>
            <Link to="/categories" className="fh-footer-link">Categories</Link>
            <Link to="/trending" className="fh-footer-link">Trending</Link>
            <Link to="/search" className="fh-footer-link">Search</Link>
          </div>
          <div className="col-lg-2 col-6">
            <h6 className="fw-bold mb-3">Company</h6>
            <Link to="/about" className="fh-footer-link">About Us</Link>
            <Link to="/contact" className="fh-footer-link">Contact</Link>
            <Link to="/faq" className="fh-footer-link">FAQ</Link>
          </div>
          <div className="col-lg-2 col-6">
            <h6 className="fw-bold mb-3">Legal</h6>
            <Link to="/privacy" className="fh-footer-link">Privacy Policy</Link>
            <Link to="/terms" className="fh-footer-link">Terms of Service</Link>
          </div>
          <div className="col-lg-2 col-6">
            <h6 className="fw-bold mb-3">Follow Us</h6>
            <a href="#" className="fh-footer-link"><i className="bi bi-facebook me-1"></i> Facebook</a>
            <a href="#" className="fh-footer-link"><i className="bi bi-instagram me-1"></i> Instagram</a>
            <a href="#" className="fh-footer-link"><i className="bi bi-twitter-x me-1"></i> X</a>
            <a href="#" className="fh-footer-link"><i className="bi bi-pinterest me-1"></i> Pinterest</a>
          </div>
        </div>
        <div className="fh-divider"></div>
        <div className="text-center" style={{ opacity: 0.5, fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Home of Comfort by Mark LTD. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
