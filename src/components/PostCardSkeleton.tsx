export default function PostCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="p-3 d-flex align-items-center gap-2">
        <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
        <div className="flex-grow-1">
          <div className="skeleton" style={{ width: '120px', height: '16px' }}></div>
          <div className="skeleton mt-1" style={{ width: '80px', height: '12px' }}></div>
        </div>
      </div>
      <div className="skeleton" style={{ width: '100%', height: '300px' }}></div>
      <div className="p-3">
        <div className="skeleton" style={{ width: '100%', height: '20px' }}></div>
        <div className="skeleton mt-2" style={{ width: '60%', height: '20px' }}></div>
      </div>
    </div>
  )
}
