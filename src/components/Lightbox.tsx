import { useState, useEffect } from 'react'

interface Props {
  urls: string[]
  startIndex: number
  onClose: () => void
}

export default function Lightbox({ urls, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1)
      if (e.key === 'ArrowRight' && index < urls.length - 1) setIndex(index + 1)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, urls.length, onClose])

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">&times;</button>
      {urls.length > 1 && index > 0 && (
        <button className="position-absolute start-0 text-white btn fs-2" style={{ marginLeft: '1rem' }} onClick={(e) => { e.stopPropagation(); setIndex(index - 1) }} aria-label="Previous">
          <i className="bi bi-chevron-left"></i>
        </button>
      )}
      <img src={urls[index]} alt="" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
      {urls.length > 1 && index < urls.length - 1 && (
        <button className="position-absolute end-0 text-white btn fs-2" style={{ marginRight: '1rem' }} onClick={(e) => { e.stopPropagation(); setIndex(index + 1) }} aria-label="Next">
          <i className="bi bi-chevron-right"></i>
        </button>
      )}
      {urls.length > 1 && (
        <div className="position-absolute bottom-0 start-50 translate-middle-x text-white mb-4">
          {index + 1} / {urls.length}
        </div>
      )}
    </div>
  )
}
