import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Compass,
  Heart,
  LogOut,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  UserRound,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { useDemo } from "../../app/DemoProvider";
import { createInitialState } from "../../mocks/data";
import { Brand, Button, Modal } from "../ui";

const links = [
  { to: "/discover", label: "Khám phá", Icon: Compass },
  { to: "/chat", label: "Trò chuyện", Icon: MessageCircle },
  { to: "/notifications", label: "Thông báo", Icon: Bell },
  { to: "/profile", label: "Hồ sơ", Icon: UserRound },
];
export default function Shell() {
  const { state, update, notice, storageWarning } = useDemo();
  const [reset, setReset] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const unread = state.notifications.filter((item) => !item.readAt).length;
  const chatUnread = state.conversations.reduce(
    (sum, item) => sum + item.unreadCount,
    0,
  );
  const title =
    links.find((link) => pathname.startsWith(link.to))?.label || "Khám phá";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar">
        <NavLink
          to="/discover"
          className="brand-link"
          aria-label="Student Dating, về Khám phá"
        >
          <Brand />
        </NavLink>
        <div className="workspace-label">KHÔNG GIAN CỦA BẠN</div>
        <nav aria-label="Điều hướng chính" className="main-nav">
          {links.map(({ to, label, Icon }) => {
            const count =
              to === "/notifications"
                ? unread
                : to === "/chat"
                  ? chatUnread
                  : 0;
            return (
              <NavLink
                key={to}
                to={to}
                aria-label={count ? `${label}, ${count} chưa đọc` : label}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={21} />
                <span>{label}</span>
                {count > 0 && <span className="badge">{count}</span>}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <span className="mini-heart">
            <Heart size={20} />
          </span>
          <h3>Một lời chào, nhiều điều mới.</h3>
          <p>Những kết nối đẹp bắt đầu từ chính bạn.</p>
          <NavLink to="/profile">
            Hoàn thiện hồ sơ <ArrowUpRight size={15} />
          </NavLink>
        </div>
        <div className="sidebar-bottom">
          <span className="safe-caption">
            <ShieldCheck size={16} /> Không gian dành cho 18+
          </span>
          <Button variant="ghost" onClick={() => setReset(true)}>
            <RotateCcw size={16} /> Đặt lại demo
          </Button>
          <Button
            variant="ghost"
            onClick={() => update((s) => ({ ...s, session: false }))}
          >
            <LogOut size={16} /> Thoát trải nghiệm
          </Button>
          <NavLink to="/profile" className="user-mini">
            <img src={state.profile.avatar} alt="" />
            <span>
              <strong>{state.profile.fullName}</strong>
              <small>Tài khoản demo</small>
            </span>
            <ArrowUpRight size={16} />
          </NavLink>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="desktop-breadcrumb">
            Không gian của bạn <span>/</span> <strong>{title}</strong>
          </div>
          <NavLink className="mobile-brand" to="/discover">
            <Brand />
          </NavLink>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> Chế độ demo
            </span>
            <span className="topbar-divider" />
            <NavLink
              to="/notifications"
              className="notification-button"
              aria-label={`Thông báo nhanh, ${unread} chưa đọc`}
            >
              <Bell size={20} />
              {unread > 0 && <span className="notification-dot" />}
            </NavLink>
            <NavLink
              to="/profile"
              className="top-avatar"
              aria-label="Hồ sơ của tôi"
            >
              <img src={state.profile.avatar} alt="" />
            </NavLink>
          </div>
        </header>
        {storageWarning && (
          <div className="storage-warning" role="alert">
            {storageWarning}
          </div>
        )}
        <main
          id="main-content"
          className={`main-content ${pathname.startsWith("/chat") ? "chat-main" : ""}`}
        >
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>© {new Date().getFullYear()} Student Dating</span>
          <span>Kết nối chân thành. Tôn trọng khác biệt.</span>
          <span>Hồ sơ hư cấu · Ảnh minh họa</span>
        </footer>
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
      {reset && (
        <Modal title="Bắt đầu lại trải nghiệm?" onClose={() => setReset(false)}>
          <p>
            Hồ sơ đã sửa, tin nhắn và các lượt tương tác demo sẽ được đặt lại.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setReset(false)}>
              Giữ tiến độ
            </Button>
            <Button
              onClick={() => {
                update(() => ({ ...createInitialState(), session: true }));
                setReset(false);
                navigate("/discover");
              }}
            >
              Đặt lại demo
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
