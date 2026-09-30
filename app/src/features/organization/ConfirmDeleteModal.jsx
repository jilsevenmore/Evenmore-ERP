import Modal from '../../components/ui/Modal';

/** "Delete X?" — the server refuses a unit people still belong to, and says so. */
export default function ConfirmDeleteModal({ target, noun, onCancel, onConfirm }) {
  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={onCancel}
      title={`Delete ${noun}`}
      footer={
        <>
          <button type="button" className="btn-outline h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn-danger h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer" onClick={onConfirm}>
            Delete
          </button>
        </>
      }
    >
      <p className="text-[13px] text-slate-600">
        Delete <b className="text-slate-900">{target?.name}</b>? A {noun.toLowerCase()} that
        employees still belong to can’t be deleted — move them first.
      </p>
    </Modal>
  );
}
