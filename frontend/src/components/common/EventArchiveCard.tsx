import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink } from 'react-router-dom';
import EventFormDialog, { type EventDraft } from './EventFormDialog';
import { useSampleStore } from '../../stores/sampleStore';
import { useToastStore } from '../../stores/uiStore';
import { useEventSummary } from '../../hooks/useEventStats';
import type { MeteoriteSample } from '../../types/sample';
import { formatWeight } from '../../utils/format';

interface EventArchiveCardProps {
  sample: MeteoriteSample;
}

/** 样本详情中的降落事件归档：新建事件 / 归入已有事件 / 退出原场，展示事件汇总 */
export function EventArchiveCard({ sample }: EventArchiveCardProps) {
  const events = useSampleStore((s) => s.events);
  const samples = useSampleStore((s) => s.samples);
  const addEvent = useSampleStore((s) => s.addEvent);
  const assignSampleEvent = useSampleStore((s) => s.assignSampleEvent);
  const notify = useToastStore((s) => s.notify);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');

  const summary = useEventSummary(sample.eventId);
  const otherEvents = events.filter((e) => e.id !== sample.eventId);
  const otherMembers = summary
    ? summary.memberIds
        .filter((mid) => mid !== sample.id)
        .map((mid) => samples.find((s) => s.id === mid))
        .filter((m): m is (typeof samples)[number] => Boolean(m))
    : [];

  const handleCreate = async (draft: EventDraft) => {
    const eventId = await addEvent(draft);
    await assignSampleEvent(sample.id, eventId);
    setCreateOpen(false);
    notify(`已建档并把 ${sample.sampleNo} 归入「${draft.name}」`);
  };

  const handleJoin = async () => {
    if (!selectedEventId) return;
    const target = events.find((e) => e.id === selectedEventId);
    await assignSampleEvent(sample.id, selectedEventId);
    setSelectedEventId('');
    notify(sample.eventId ? `已改归「${target?.name ?? ''}」` : `已归入「${target?.name ?? ''}」`);
  };

  const handleLeave = async () => {
    await assignSampleEvent(sample.id, undefined);
    notify('已退出原降落事件');
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 1.5 }}>
        降落事件归档
      </Typography>

      {summary ? (
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box>
              <Link
                component={RouterLink}
                to="/events"
                variant="subtitle1"
                sx={{ fontWeight: 700, textDecoration: 'none' }}
              >
                {summary.name}
              </Link>
              <Typography variant="body2" color="text.secondary">
                日期 {summary.eventDate} · 主发现地 {summary.primaryLocation}
              </Typography>
            </Box>
            <Button
              size="small"
              color="warning"
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLeave}
              id="leave-event"
            >
              退出事件
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" color="primary" label={`成员 ${summary.memberCount} 块`} />
            <Chip size="small" variant="outlined" label={`总重 ${formatWeight(summary.totalWeight)}`} />
            <Chip size="small" variant="outlined" label={`发现地 ${summary.locations.length} 处`} />
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">
              各处发现地
            </Typography>
            <Typography variant="body2">
              {summary.locations.map((l) => `${l.label}（${l.sampleCount} 块）`).join('；') ||
                summary.primaryLocation}
            </Typography>
          </Box>

          {otherMembers.length ? (
            <Box>
              <Typography variant="caption" color="text.secondary">
                同场碎块
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                {otherMembers.map((member) => (
                  <Link
                    key={member.id}
                    component={RouterLink}
                    to={`/samples/${member.id}`}
                    variant="body2"
                    sx={{ textDecoration: 'none' }}
                  >
                    {member.sampleNo} · {formatWeight(member.totalWeight)}
                  </Link>
                ))}
              </Stack>
            </Box>
          ) : null}

          {summary.note ? (
            <Typography variant="caption" color="text.secondary">
              备注：{summary.note}
            </Typography>
          ) : null}

          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary">
              改归其它事件（将先退出本场）
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="join-event-label">选择已有事件</InputLabel>
                <Select
                  labelId="join-event-label"
                  label="选择已有事件"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                >
                  {otherEvents.length === 0 ? (
                    <MenuItem value="" disabled>
                      暂无可改归的事件
                    </MenuItem>
                  ) : null}
                  {otherEvents.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.name}（{e.eventDate}）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={handleJoin} disabled={!selectedEventId} id="join-event">
                改归
              </Button>
            </Stack>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Alert severity="info">该样本尚未归入任何降落事件，可新建事件，或归入已有事件。</Alert>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              id="create-event"
            >
              新建降落事件
            </Button>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="assign-event-label">归入已有事件</InputLabel>
              <Select
                labelId="assign-event-label"
                label="归入已有事件"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                {events.length === 0 ? (
                  <MenuItem value="" disabled>
                    还没有任何事件
                  </MenuItem>
                ) : null}
                {events.map((e) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.name}（{e.eventDate}）
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={handleJoin} disabled={!selectedEventId}>
              归入
            </Button>
          </Stack>
        </Stack>
      )}

      <EventFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        title="新建降落事件"
        submitLabel="建档并归入"
      />
    </Paper>
  );
}

export default EventArchiveCard;
