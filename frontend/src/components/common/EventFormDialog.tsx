import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import type { FallEvent } from '../../types/event';
import { emptyEventDraft } from '../../types/event';

export type EventDraft = Omit<FallEvent, 'id' | 'createdAt' | 'updatedAt'>;

/** 对话框内部表单态：备注允许为空字符串 */
type EventFormState = Omit<EventDraft, 'note'> & { note: string };

interface EventFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: EventDraft) => Promise<void> | void;
  /** 传入已有事件即编辑，否则为新建 */
  event?: FallEvent;
  title?: string;
  submitLabel?: string;
}

/** 降落事件新建 / 编辑对话框：名称、日期、主发现地 */
export default function EventFormDialog({
  open,
  onClose,
  onSubmit,
  event,
  title = '新建降落事件',
  submitLabel = '建档',
}: EventFormDialogProps) {
  const [draft, setDraft] = useState<EventFormState>({ ...emptyEventDraft(), note: '' });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setDraft(
        event
          ? {
              name: event.name,
              eventDate: event.eventDate,
              primaryLocation: event.primaryLocation,
              note: event.note ?? '',
            }
          : { ...emptyEventDraft(), note: '' },
      );
      setErrors([]);
    }
  }, [open, event]);

  const handleSubmit = async () => {
    const list: string[] = [];
    if (!draft.name.trim()) list.push('事件名称不能为空');
    if (!draft.eventDate) list.push('请选择事件日期');
    if (!draft.primaryLocation.trim()) list.push('主发现地不能为空');
    setErrors(list);
    if (list.length) return;
    await onSubmit({
      name: draft.name.trim(),
      eventDate: draft.eventDate,
      primaryLocation: draft.primaryLocation.trim(),
      note: draft.note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.75} sx={{ mt: 0.5 }}>
          {errors.length ? (
            <Alert severity="error">
              {errors.map((e) => (
                <div key={e}>{e}</div>
              ))}
            </Alert>
          ) : null}
          <TextField
            id="event-name"
            size="small"
            label="事件名称"
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="如 2024 年撒哈拉流星雨"
          />
          <TextField
            id="event-date"
            size="small"
            type="date"
            label="事件日期"
            required
            InputLabelProps={{ shrink: true }}
            value={draft.eventDate}
            onChange={(e) => setDraft((d) => ({ ...d, eventDate: e.target.value }))}
          />
          <TextField
            id="event-primary-location"
            size="small"
            label="主发现地"
            required
            value={draft.primaryLocation}
            onChange={(e) => setDraft((d) => ({ ...d, primaryLocation: e.target.value }))}
            placeholder="如 Dar al Gani 区域"
          />
          <TextField
            id="event-note"
            size="small"
            label="备注"
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button variant="contained" onClick={handleSubmit} id="event-submit">
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
