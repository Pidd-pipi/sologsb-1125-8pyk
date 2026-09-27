import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import { Link as RouterLink } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState';
import EventFormDialog, { type EventDraft } from '../components/common/EventFormDialog';
import { useEventSummaries, type EventSummary } from '../hooks/useEventStats';
import { useSampleStore } from '../stores/sampleStore';
import { useToastStore } from '../stores/uiStore';
import { formatWeight } from '../utils/format';
import type { FallEvent } from '../types/event';

/** `/events` 降落事件归档总览 */
export default function Events() {
  const summaries = useEventSummaries();
  const samples = useSampleStore((s) => s.samples);
  const addEvent = useSampleStore((s) => s.addEvent);
  const updateEvent = useSampleStore((s) => s.updateEvent);
  const removeEvent = useSampleStore((s) => s.removeEvent);
  const notify = useToastStore((s) => s.notify);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FallEvent | null>(null);
  const [deleting, setDeleting] = useState<EventSummary | null>(null);

  const memberOf = (id: string) => samples.find((s) => s.id === id);

  const handleCreate = async (draft: EventDraft) => {
    await addEvent(draft);
    setCreateOpen(false);
    notify(`已建档「${draft.name}」`);
  };

  const handleEdit = async (draft: EventDraft) => {
    if (!editing) return;
    await updateEvent(editing.id, draft);
    setEditing(null);
    notify(`已更新「${draft.name}」`);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const name = deleting.name;
    await removeEvent(deleting.id);
    setDeleting(null);
    notify(`已删除事件「${name}」，${deleting.memberCount} 块样本已退出归档`);
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction="row" alignItems="flex-end" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">降落事件</Typography>
          <Typography variant="body2" color="text.secondary">
            同一场坠落捡回的碎块归为同一事件归档；汇总成员数量、总重量与各处发现地。共 {summaries.length} 场事件。
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} id="create-event-page">
          新建降落事件
        </Button>
      </Stack>

      {summaries.length === 0 ? (
        <EmptyState
          title="还没有降落事件档案"
          description="在样本详情页可新建事件并把碎块归入，也可以在这里先建档，再到样本详情归入。"
          actionLabel="新建第一场事件"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Grid container spacing={2.5}>
          {summaries.map((ev) => (
            <Grid item xs={12} md={6} key={ev.id}>
              <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {ev.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        日期 {ev.eventDate} · 主发现地 {ev.primaryLocation}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        sx={{ minWidth: 0 }}
                        startIcon={<EditIcon />}
                        onClick={() => setEditing(ev)}
                        aria-label={`编辑事件 ${ev.name}`}
                      >
                        编辑
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        sx={{ minWidth: 0 }}
                        startIcon={<DeleteOutlineIcon />}
                        onClick={() => setDeleting(ev)}
                        aria-label={`删除事件 ${ev.name}`}
                      >
                        删除
                      </Button>
                    </Stack>
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Chip size="small" color="primary" label={`成员 ${ev.memberCount} 块`} />
                    <Chip size="small" variant="outlined" label={`总重 ${formatWeight(ev.totalWeight)}`} />
                    <Chip size="small" variant="outlined" label={`发现地 ${ev.locations.length} 处`} />
                  </Stack>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      各处发现地
                    </Typography>
                    {ev.locations.length ? (
                      <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                        {ev.locations.map((l) => (
                          <Typography key={l.label} variant="body2">
                            {l.label} · {l.sampleCount} 块 · {formatWeight(l.totalWeight)}
                          </Typography>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        成员均未登记发现记录
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      成员清单
                    </Typography>
                    {ev.memberCount ? (
                      <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                        {ev.memberIds.map((mid) => {
                          const m = memberOf(mid);
                          if (!m) return null;
                          return (
                            <Link
                              key={mid}
                              component={RouterLink}
                              to={`/samples/${mid}`}
                              variant="body2"
                              sx={{ textDecoration: 'none' }}
                            >
                              {m.sampleNo} · {formatWeight(m.totalWeight)}
                            </Link>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        暂无成员，可到样本详情页归入
                      </Typography>
                    )}
                  </Box>

                  {ev.note ? (
                    <Typography variant="caption" color="text.secondary">
                      备注：{ev.note}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <EventFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="新建降落事件"
        submitLabel="建档"
      />
      <EventFormDialog
        open={Boolean(editing)}
        event={editing ?? undefined}
        onClose={() => setEditing(null)}
        onSubmit={handleEdit}
        title="编辑降落事件"
        submitLabel="保存"
      />

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        <DialogTitle>删除事件 {deleting?.name}？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            事件删除后不可恢复；其 {deleting?.memberCount ?? 0} 块成员样本会自动退出归档（样本本身保留）。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)}>取消</Button>
          <Button color="error" variant="contained" onClick={handleDelete} id="confirm-delete-event">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
