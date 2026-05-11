import { useEffect, useState } from "react"

export function FloatingActions() {
  const [_showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="floating-actions">
      {/* {showScrollTop && (
        <Tooltip content="Lên đầu trang" positioning={{ placement: "left" }}>
          <button
            className="fab-btn fab-btn-white"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <FiArrowUp size={18} />
          </button>
        </Tooltip>
      )}
      <Tooltip content="Nhắn tin" positioning={{ placement: "left" }}>
        <button
          className="fab-btn fab-btn-primary"
          onClick={() => navigate({ to: "/chat" })}
          aria-label="Nhắn tin"
        >
          <FiMessageCircle size={18} />
        </button>
      </Tooltip>
      <Tooltip content="Đăng tin mới" positioning={{ placement: "left" }}>
        <button
          className="fab-btn fab-btn-orange btn-shine"
          onClick={onOpenListingModal}
          aria-label="Đăng tin"
          style={{ position: "relative", overflow: "hidden" }}
        >
          <FiPlusCircle size={18} />
        </button>
      </Tooltip> */}
    </div>
  )
}
