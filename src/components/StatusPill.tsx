import { STATUS_LABEL, statusTone } from '@/lib/orders';

export default function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${statusTone(status)}`}>{STATUS_LABEL[status] ?? status}</span>;
}
