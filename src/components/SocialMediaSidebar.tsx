export default function SocialMediaSidebar() {
  const socialLinks = [
    { icon: 'bi-facebook', url: 'https://www.facebook.com/homeofcomfortsupholstery', label: 'Facebook', color: '#1877F2' },
    { icon: 'bi-instagram', url: 'https://instagram.com', label: 'Instagram', color: '#E4405F' },
    { icon: 'bi-chat-dots-fill', url: 'https://wa.me/447393921037', label: 'WhatsApp', color: '#25D366' },
    { icon: 'bi-telephone-fill', url: 'viber://chat/447393921037', label: 'Viber', color: '#665CAC' },
  ]

  return (
    <div className="social-media-sidebar">
      {socialLinks.map(link => (
        <a
          key={link.label}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
          title={link.label}
          style={{ backgroundColor: link.color }}
        >
          <i className={`bi ${link.icon}`}></i>
        </a>
      ))}
    </div>
  )
}
