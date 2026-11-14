import {
  BadgeCheck,
  GraduationCap,
  Heart,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import { ageAt, type Candidate } from "../services/models";
import { Button, Tags } from "./ui";

export default function ProfileCard({
  person,
  onDetails,
  onBlock,
}: {
  person: Candidate;
  onDetails: () => void;
  onBlock: () => void;
}) {
  return (
    <article className="discovery-card">
      <div className="candidate-photo">
        <img
          src={person.avatar}
          alt={`Ảnh minh họa hồ sơ ${person.fullName}`}
        />
        <span className="photo-caption">
          <MapPin size={13} /> Cách bạn {person.distanceKm} km · Mô phỏng
        </span>
        <div className="photo-info">
          <span className="photo-small">MỘT NGƯỜI BẠN CHƯA GẶP</span>
          <h2>
            {person.fullName}, {ageAt(person.birthDate)}
          </h2>
          <span>
            <GraduationCap size={17} /> Sinh viên · Khóa {person.cohort}
          </span>
        </div>
      </div>
      <div className="candidate-info">
        <div className="candidate-top">
          {person.verified ? (
            <span className="verified">
              <BadgeCheck size={15} /> Sinh viên đã xác thực*
            </span>
          ) : (
            <span className="muted">Sinh viên chưa xác thực*</span>
          )}
          <Button
            variant="ghost"
            aria-label={`Chặn ${person.fullName}`}
            title="Chặn hồ sơ"
            onClick={onBlock}
          >
            <MoreHorizontal size={21} />
          </Button>
        </div>
        <div className="candidate-faculty">
          <GraduationCap size={20} />
          <div>
            <strong>{person.faculty}</strong>
            <span>Trường Đại học Bình Minh · Hư cấu</span>
          </div>
        </div>
        <div className="candidate-section">
          <span className="eyebrow">MỘT CHÚT VỀ MÌNH</span>
          <p>{person.bio}</p>
        </div>
        <div className="candidate-section">
          <span className="eyebrow">NHỮNG ĐIỀU MÌNH THÍCH</span>
          <Tags items={person.interests} />
        </div>
        <div className="connection-goal">
          <Heart size={17} />
          <span>{person.connectionGoal}</span>
        </div>
        <Button variant="secondary" onClick={onDetails} className="full-width">
          Xem hồ sơ <span aria-hidden="true">↗</span>
        </Button>
        <small className="candidate-footnote">
          *Trạng thái xác thực chỉ dùng để minh họa.
        </small>
      </div>
    </article>
  );
}
