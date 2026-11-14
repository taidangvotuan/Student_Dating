import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Coffee, Heart, MessageCircle, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useDemo } from '../../app/DemoProvider';
import { candidateById, defaultPreferences } from '../../mocks/data';
import { discover, interact } from '../../services/discovery';
import { ageAt, type Candidate, type Conversation } from '../../services/models';
import { Button, EmptyState, Modal, Tags } from '../../components/ui';
import ProfileCard from '../../components/ProfileCard';
import Filters from './Filters';

export default function DiscoveryPage() {
  const { state, update, notify } = useDemo();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(false);
  const [details, setDetails] = useState<Candidate | null>(null);
  const [blocking, setBlocking] = useState<Candidate | null>(null);
  const [match, setMatch] = useState<Conversation | null>(null);
  const people = discover(state);
  const current = people[0];
  const activeFilters = Object.entries(state.profile.preferences).filter(([key, value]) => value !== defaultPreferences[key as keyof typeof defaultPreferences]).length;
  function act(person: Candidate, kind: 'THICH' | 'BO_QUA' | 'CHAN') {
    const result = interact(state, person.id, kind);
    update(() => result.state); setDetails(null); setBlocking(null);
    if (result.match) setMatch(result.match);
    else notify(kind === 'THICH' ? 'Đã gửi một lượt thích. Cùng khám phá tiếp nhé!' : kind === 'CHAN' ? 'Đã chặn hồ sơ. Bạn sẽ không gặp lại người này.' : 'Đã bỏ qua hồ sơ. Một kết nối khác đang chờ bạn.');
  }
  const matchedPerson = match ? candidateById(match.participantId) : undefined;
  return <><div className="page-heading"><div><span className="eyebrow">MỘT NGÀY MỚI, MỘT KẾT NỐI MỚI</span><h1>Gặp một người cùng nhịp<span className="heading-dot">.</span></h1><p>Không cần vội vàng. Cứ là bạn, rồi sẽ gặp người phù hợp.</p></div><Button variant="secondary" onClick={() => setFilters(true)}><SlidersHorizontal size={17} /> Bộ lọc {activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}</Button></div>
    <div className="discovery-layout"><section className="discovery-area" aria-label="Hồ sơ gợi ý"><div className="discovery-toolbar"><span><Sparkles size={16} /> Dành cho bạn</span><span>{people.length} hồ sơ phù hợp</span></div>
      {current ? <><ProfileCard person={current} onDetails={() => setDetails(current)} onBlock={() => setBlocking(current)} /><div className="discovery-actions"><div><button className="circle-action skip-action" aria-label={`Bỏ qua ${current.fullName}`} onClick={() => act(current, 'BO_QUA')}><X size={26} /></button><span>Bỏ qua</span></div><div><button className="circle-action like-action" aria-label={`Thích ${current.fullName}`} onClick={() => act(current, 'THICH')}><Heart size={27} fill="currentColor" /></button><span>Thích</span></div></div><p className="discovery-caption"><Heart size={12} /> Hai lượt thích, một khởi đầu mới.</p></> : <div className="panel"><EmptyState title="Bạn đã gặp hết gợi ý hôm nay" description="Một kết nối đẹp cũng cần chút thời gian. Thử mở rộng bộ lọc hoặc đặt lại demo để trải nghiệm từ đầu."><Button variant="secondary" onClick={() => setFilters(true)}><SlidersHorizontal size={16} /> Điều chỉnh bộ lọc</Button></EmptyState></div>}
    </section><aside className="discovery-aside"><section className="daily-note"><span className="eyebrow">CHÚT CẢM HỨNG HÔM NAY</span><div className="coffee-illustration"><Coffee size={56} strokeWidth={1} /><Sparkles className="coffee-spark" size={25} strokeWidth={1} /></div><h2>Có thể, chỉ cách<br />một lời chào.</h2><p>Một người cùng nghe bài nhạc bạn thích, cùng ghé quán quen sau giờ học.</p><span className="daily-note-line" /><span className="daily-note-end">Cứ mở lòng, theo cách của bạn.</span></section><section className="panel new-connections"><div className="aside-title"><h2>Kết nối của bạn</h2><span>{state.conversations.filter(item => item.active).length.toString().padStart(2, '0')}</span></div>{state.conversations.filter(item => item.active).length ? <div className="connection-avatars">{state.conversations.filter(item => item.active).map(item => { const person = candidateById(item.participantId); return person && <Link key={item.id} to={`/chat/${item.id}`}><img src={person.avatar} alt="" /><span>{person.fullName.split(' ').at(-1)}</span></Link>; })}</div> : <p>Một lượt thích có thể mở ra một cuộc trò chuyện mới.</p>}<Link to="/chat" className="text-link">Đến trò chuyện <ArrowRight size={14} /></Link></section><div className="safety-note"><ShieldCheck size={22} /><div><strong>Kết nối với sự an tâm</strong><p>Tôn trọng ranh giới. Chỉ chia sẻ khi bạn thấy sẵn sàng.</p></div></div><span className="fiction-note">Tất cả nhân vật và khoảng cách trong bản demo đều là hư cấu.</span></aside></div>
    {filters && <Filters onClose={() => setFilters(false)} />}
    {details && <Modal title="Làm quen một chút" onClose={() => setDetails(null)} className="profile-detail-modal"><img className="detail-photo" src={details.avatar} alt={`Ảnh minh họa ${details.fullName}`} /><div className="detail-name"><h2>{details.fullName}, {ageAt(details.birthDate)}</h2>{details.verified && <BadgeCheck size={20} />}</div><p>{details.faculty} · Khóa {details.cohort}</p><span className="eyebrow detail-label">MỘT CHÚT VỀ MÌNH</span><p>{details.bio}</p><span className="eyebrow detail-label">SỞ THÍCH</span><Tags items={details.interests} /><div className="connection-goal"><Heart size={16} />{details.connectionGoal}</div><div className="modal-actions"><Button variant="secondary" onClick={() => setBlocking(details)}>Chặn hồ sơ</Button><Button onClick={() => act(details, 'THICH')}><Heart size={17} /> Thích {details.fullName.split(' ').at(-1)}</Button></div></Modal>}
    {blocking && <Modal title={`Chặn ${blocking.fullName}?`} onClose={() => setBlocking(null)}><p>Bạn sẽ không thấy lại hồ sơ này trong Khám phá. Kết nối và khả năng gửi tin nhắn giữa hai bạn sẽ bị tắt.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setBlocking(null)}>Hủy, giữ hồ sơ</Button><Button variant="danger" onClick={() => act(blocking, 'CHAN')}>Xác nhận chặn</Button></div></Modal>}
    {match && matchedPerson && <Modal title="Một kết nối mới!" onClose={() => setMatch(null)} className="match-modal"><span className="eyebrow">MỘT LƯỢT THÍCH ĐÃ ĐƯỢC ĐÁP LẠI</span><div className="match-portraits"><img src={state.profile.avatar} alt="Ảnh đại diện của bạn" /><span><Heart fill="currentColor" size={25} /></span><img src={matchedPerson.avatar} alt={`Ảnh minh họa ${matchedPerson.fullName}`} /></div><h3>Bạn và {matchedPerson.fullName.split(' ').slice(-2).join(' ')} đã ghép đôi</h3><p>Cả hai đều muốn làm quen. Một lời chào có thể là khởi đầu của điều rất đẹp.</p><Button className="full-width" onClick={() => navigate(`/chat/${match.id}`)}><MessageCircle size={18} /> Bắt đầu trò chuyện</Button><Button variant="ghost" className="full-width" onClick={() => setMatch(null)}>Tiếp tục khám phá</Button></Modal>}
  </>;
}
