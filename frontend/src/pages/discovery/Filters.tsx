import { useState, type FormEvent } from 'react';
import { useDemo } from '../../app/DemoProvider';
import { defaultPreferences, faculties } from '../../mocks/data';
import { Button, Field, Modal, SelectField } from '../../components/ui';
import { preferencesSchema } from '../../services/models';

export default function Filters({ onClose }: { onClose: () => void }) {
  const { state, update, notify } = useDemo();
  const [draft, setDraft] = useState({ ...state.profile.preferences });
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = preferencesSchema.safeParse(draft);
    if (!result.success) { setError('Chọn độ tuổi từ 18 đến 100. Tuổi tối thiểu không được lớn hơn tối đa.'); return; }
    update(s => ({ ...s, profile: { ...s.profile, preferences: result.data } }));
    notify('Đã áp dụng bộ lọc khám phá.'); onClose();
  }
  return <Modal title="Gặp người hợp với bạn" onClose={onClose}><p className="filter-description">Một vài lựa chọn để những kết nối gần bạn hơn.</p><form noValidate onSubmit={submit}><div className="form-grid"><Field label="Tuổi tối thiểu" type="number" min={18} max={100} value={draft.minAge} onChange={e => setDraft({ ...draft, minAge: Number(e.target.value) })} /><Field label="Tuổi tối đa" type="number" min={18} max={100} value={draft.maxAge} onChange={e => setDraft({ ...draft, maxAge: Number(e.target.value) })} /></div><SelectField label="Giới tính muốn gặp" value={draft.preferredGender} onChange={e => setDraft({ ...draft, preferredGender: e.target.value })}><option value="">Tất cả</option><option>Nam</option><option>Nữ</option><option>Khác</option></SelectField><SelectField label="Khoa muốn gặp" value={draft.preferredFaculty} onChange={e => setDraft({ ...draft, preferredFaculty: e.target.value })}><option value="">Tất cả các khoa</option>{faculties.map(item => <option key={item}>{item}</option>)}</SelectField><label className="checkbox-row"><input type="checkbox" checked={draft.verifiedOnly} onChange={e => setDraft({ ...draft, verifiedOnly: e.target.checked })} />Chỉ hồ sơ đã xác thực (mô phỏng)</label>{error && <p role="alert" className="error">{error}</p>}<div className="modal-actions"><Button variant="secondary" onClick={() => { setDraft({ ...defaultPreferences }); setError(''); }}>Đặt mặc định</Button><Button type="submit">Áp dụng bộ lọc</Button></div></form></Modal>;
}
