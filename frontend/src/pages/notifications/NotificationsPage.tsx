import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, CheckCheck, Heart, X } from "lucide-react";
import { useDemo } from "../../app/DemoProvider";
import { candidateById } from "../../mocks/data";
import { dateLabel, openNotification, timeLabel } from "../../services/chat";
import { Button, EmptyState } from "../../components/ui";

export default function NotificationsPage() {
  const { state, update, notify } = useDemo();
  const navigate = useNavigate();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const unread = state.notifications.filter((item) => !item.readAt).length;
  const items = state.notifications.filter(
    (item) => !onlyUnread || !item.readAt,
  );
  function open(id: string) {
    const result = openNotification(state, id);
    update(() => result.state);
    if (result.conversationId) navigate(`/chat/${result.conversationId}`);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">NHỮNG ĐIỀU DỄ THƯƠNG VỪA ĐẾN</span>
          <h1>
            Thông báo<span className="heading-dot">.</span>
          </h1>
          <p>
            {unread
              ? `Bạn có ${unread} thông báo chưa đọc. Có người muốn làm quen đấy!`
              : "Mọi kết nối mới, được gửi đến bạn ở đây."}
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={!unread}
          onClick={() => {
            update((s) => ({
              ...s,
              notifications: s.notifications.map((item) => ({
                ...item,
                readAt: item.readAt || new Date().toISOString(),
              })),
            }));
            notify("Đã đánh dấu tất cả thông báo là đã đọc.");
          }}
        >
          <CheckCheck size={17} /> Đọc tất cả
        </Button>
      </div>
      <section className="notifications-panel panel">
        <div className="notification-tabs" aria-label="Lọc thông báo">
          <button
            type="button"
            className={!onlyUnread ? "selected" : ""}
            aria-pressed={!onlyUnread}
            onClick={() => setOnlyUnread(false)}
          >
            Tất cả <span>{state.notifications.length}</span>
          </button>
          <button
            type="button"
            className={onlyUnread ? "selected" : ""}
            aria-pressed={onlyUnread}
            onClick={() => setOnlyUnread(true)}
          >
            Chưa đọc <span>{unread}</span>
          </button>
        </div>
        {items.length ? (
          <ul className="notification-list">
            {items.map((item) => {
              const person = candidateById(item.actorId);
              return (
                <li
                  className={`notification-item ${item.readAt ? "" : "unread"}`}
                  key={item.id}
                >
                  <button
                    className="notification-content"
                    onClick={() => open(item.id)}
                  >
                    <span className="notification-avatar">
                      <img src={person?.avatar} alt="" />
                      <span>
                        <Heart size={11} fill="currentColor" />
                      </span>
                    </span>
                    <span className="notification-copy">
                      <strong>Bạn có một kết nối mới!</strong>
                      <span>
                        {person?.fullName || "Một người bạn"} cũng thích bạn.
                        Bắt đầu câu chuyện của hai bạn nhé.
                      </span>
                      <small>
                        <time dateTime={item.createdAt}>
                          {dateLabel(item.createdAt)} ·{" "}
                          {timeLabel(item.createdAt)}
                        </time>{" "}
                        · {item.readAt ? "Đã đọc" : "Chưa đọc"}
                      </small>
                      <span className="notification-cta">
                        Mở cuộc trò chuyện <ArrowUpRight size={13} />
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    aria-label={`Ẩn thông báo từ ${person?.fullName || "người bạn"}`}
                    onClick={() => {
                      update((s) => ({
                        ...s,
                        notifications: s.notifications.filter(
                          (n) => n.id !== item.id,
                        ),
                      }));
                      notify("Đã ẩn thông báo khỏi hộp thư demo.");
                    }}
                  >
                    <X size={16} />
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title={
              onlyUnread
                ? "Bạn đã đọc hết thông báo"
                : "Một chút yên tĩnh cũng thật dễ chịu"
            }
            description={
              onlyUnread
                ? "Khi có kết nối mới, chúng mình sẽ báo bạn tại đây."
                : "Chưa có thông báo. Tiếp tục khám phá để gặp người cùng nhịp nhé."
            }
          >
            <Bell size={18} />
          </EmptyState>
        )}
      </section>
      <p className="notification-footer">
        <Heart size={13} /> Mỗi thông báo có thể là khởi đầu của một câu chuyện.
      </p>
    </>
  );
}
