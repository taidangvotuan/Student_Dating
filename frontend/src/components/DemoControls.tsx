import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, RotateCcw } from "lucide-react";
import { useDemo } from "../app/DemoProvider";
import { createInitialState } from "../mocks/data";
import { Button, Modal } from "./ui";

export default function DemoControls() {
  const { update } = useDemo();
  const navigate = useNavigate();
  const [reset, setReset] = useState(false);
  return (
    <section className="panel mobile-demo-controls">
      <h2>Trải nghiệm demo</h2>
      <p>Dữ liệu chỉ được lưu trên trình duyệt này.</p>
      <div className="demo-control-buttons">
        <Button variant="secondary" onClick={() => setReset(true)}>
          <RotateCcw size={16} />
          Đặt lại demo
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            update((s) => ({ ...s, session: false }));
            navigate("/login");
          }}
        >
          <LogOut size={16} />
          Thoát trải nghiệm
        </Button>
      </div>
      {reset && (
        <Modal title="Bắt đầu lại trải nghiệm?" onClose={() => setReset(false)}>
          <p>Hồ sơ đã sửa, tin nhắn và lượt tương tác demo sẽ được đặt lại.</p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setReset(false)}>
              Giữ tiến độ
            </Button>
            <Button
              onClick={() => {
                update(() => ({ ...createInitialState(), session: true }));
                navigate("/discover");
              }}
            >
              Đặt lại demo
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
