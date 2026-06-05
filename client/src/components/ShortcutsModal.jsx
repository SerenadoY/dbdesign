import { Modal } from "@douyinfe/semi-ui";

const GROUPS = [
  {
    title: "文件",
    items: [
      { keys: "Ctrl+O", label: "打开" },
      { keys: "Ctrl+S", label: "保存" },
      { keys: "Ctrl+Shift+S", label: "另存为" },
    ],
  },
  {
    title: "编辑",
    items: [
      { keys: "Ctrl+Z", label: "撤销" },
      { keys: "Ctrl+Y", label: "重做" },
      { keys: "Ctrl+E", label: "编辑" },
      { keys: "Ctrl+X", label: "剪切" },
      { keys: "Ctrl+C", label: "复制" },
      { keys: "Ctrl+V", label: "粘贴" },
      { keys: "Ctrl+D", label: "复制选中" },
      { keys: "Delete", label: "删除" },
      { keys: "Ctrl+Alt+C", label: "复制为图片" },
    ],
  },
  {
    title: "视图",
    items: [
      { keys: "Ctrl+↑", label: "放大" },
      { keys: "Ctrl+↓", label: "缩小" },
      { keys: "Enter", label: "重置视图" },
      { keys: "Ctrl+Alt+W", label: "适应窗口" },
      { keys: "Ctrl+Shift+G", label: "显示网格" },
      { keys: "Ctrl+Shift+M", label: "严格模式" },
      { keys: "Ctrl+Shift+F", label: "字段详情" },
      { keys: "Alt+E", label: "DBML 视图" },
    ],
  },
];

export default function ShortcutsModal({ open, onClose }) {
  return (
    <Modal
      title="快捷键"
      visible={open}
      onCancel={onClose}
      footer={null}
      centered
      closeOnEsc
    >
      <div className="space-y-5">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {group.title}
            </h4>
            <div className="space-y-1.5">
              {group.items.map((item) => (
                <div
                  key={item.keys}
                  className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm"
                  style={{ backgroundColor: "var(--bg-primary)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                  <kbd
                    className="rounded-md border px-2 py-0.5 text-xs font-mono"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
