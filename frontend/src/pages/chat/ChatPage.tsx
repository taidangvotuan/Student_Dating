import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle, Search } from "lucide-react";
import { useDemo } from "../../app/DemoProvider";
import { candidateById } from "../../mocks/data";
import {
  dateLabel,
  markConversationRead,
  timeLabel,
} from "../../services/chat";
import { EmptyState } from "../../components/ui";
import ChatThread from "./ChatThread";

export default function ChatPage() {
  const { state, update } = useDemo();
  const { conversationId } = useParams();
  const [search, setSearch] = useState("");
  const selected = state.conversations.find(
    (item) => item.id === conversationId,
  );
  const unread = selected?.unreadCount ?? 0;
  useEffect(() => {
    if (conversationId && unread)
      update((s) => markConversationRead(s, conversationId));
  }, [conversationId, unread, update]);
  const list = [...state.conversations]
    .sort((a, b) =>
      (b.messages.at(-1)?.sentAt || "").localeCompare(
        a.messages.at(-1)?.sentAt || "",
      ),
    )
    .filter((item) =>
      candidateById(item.participantId)
        ?.fullName.toLocaleLowerCase("vi")
        .includes(search.toLocaleLowerCase("vi")),
    );
  return (
    <>
      <div className="page-heading chat-heading">
        <div>
          <span className="eyebrow">TỪ MỘT KẾT NỐI, ĐẾN MỘT CÂU CHUYỆN</span>
          <h1>
            Trò chuyện<span className="heading-dot">.</span>
          </h1>
          <p>Những lời chào đang chờ được hồi đáp.</p>
        </div>
        <span className="section-chip">
          <MessageCircle size={16} /> {state.conversations.length} kết nối
        </span>
      </div>
      {!state.conversations.length ? (
        <div className="panel">
          <EmptyState
            title="Câu chuyện đầu tiên đang chờ bạn"
            description="Khi hai bạn cùng thích nhau, cuộc trò chuyện sẽ xuất hiện tại đây."
          >
            <Link className="button button-primary" to="/discover">
              Khám phá ngay
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className={`chat-layout ${conversationId ? "has-selection" : ""}`}>
          <section
            className="conversation-list"
            aria-label="Danh sách hội thoại"
          >
            <div className="conversation-list-top">
              <h2>
                Tin nhắn{" "}
                <span>
                  {state.conversations.reduce(
                    (sum, item) => sum + item.unreadCount,
                    0,
                  )}
                </span>
              </h2>
              <div className="chat-search">
                <Search size={16} />
                <label className="sr-only" htmlFor="chat-search">
                  Tìm cuộc trò chuyện
                </label>
                <input
                  id="chat-search"
                  type="search"
                  placeholder="Tìm một người bạn…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            {list.length ? (
              list.map((item) => {
                const person = candidateById(item.participantId);
                const last = item.messages.at(-1);
                return (
                  person && (
                    <Link
                      to={`/chat/${item.id}`}
                      key={item.id}
                      className={`conversation-item ${selected?.id === item.id ? "selected" : ""}`}
                      aria-current={
                        selected?.id === item.id ? "page" : undefined
                      }
                    >
                      <img src={person.avatar} alt="" />
                      <div>
                        <div className="conversation-title">
                          <strong>{person.fullName}</strong>
                          {last && (
                            <time
                              dateTime={last.sentAt}
                              title={dateLabel(last.sentAt)}
                            >
                              {timeLabel(last.sentAt)}
                            </time>
                          )}
                        </div>
                        <div className="conversation-preview">
                          <p>
                            {!item.active
                              ? "Kết nối đã ngừng hoạt động"
                              : last
                                ? `${last.senderId === state.profile.id ? "Bạn: " : ""}${last.body}`
                                : "Gửi lời chào đầu tiên"}
                          </p>
                          {item.unreadCount > 0 && (
                            <span
                              className="badge"
                              aria-label={`${item.unreadCount} tin chưa đọc`}
                            >
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                );
              })
            ) : (
              <p className="chat-no-results">
                Không tìm thấy cuộc trò chuyện phù hợp.
              </p>
            )}
          </section>
          {selected ? (
            <ChatThread key={selected.id} conversation={selected} />
          ) : (
            <div className="chat-placeholder">
              <EmptyState
                title={
                  conversationId
                    ? "Không tìm thấy hội thoại"
                    : "Chọn một cuộc trò chuyện"
                }
                description={
                  conversationId
                    ? "Hội thoại này không có trong phiên demo hiện tại."
                    : "Một câu chuyện hay có thể bắt đầu bằng một lời chào thật đơn giản."
                }
              >
                {conversationId && (
                  <Link className="button button-secondary" to="/chat">
                    Quay lại danh sách
                  </Link>
                )}
              </EmptyState>
            </div>
          )}
        </div>
      )}
    </>
  );
}
