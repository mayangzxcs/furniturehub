import { type ReactNode } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import SocialMediaSidebar from './SocialMediaSidebar'
import RatingsModal from './RatingsModal'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">{children}</main>
      <Footer />
      <SocialMediaSidebar />
      <RatingsModal />
    </div>
  )
}
