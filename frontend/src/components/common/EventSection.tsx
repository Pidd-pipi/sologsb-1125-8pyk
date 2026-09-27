import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';
import LoginIcon from '@mui/icons-material/Login';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSampleStore } from '../../stores/sampleStore';
import { useToastStore } from '../../stores/uiStore';
import type { MeteoriteSample } from '../../types/sample';
import EventSummaryCard from './EventSummaryCard';
import { buildEventSummary } from '../../utils/event';

type DialogMode = 'create' | 'assign' | null;

interface EventSectionProps {
  sample: MeteoriteSample;
}

/** 样本详情中的「降落事件归档」：新建事件、归入已有事件、改归、退出 */
export function EventSection({ sample }: EventSectionProps) {
  const samples = useSampleStore((s) => s.samples);
  const finds = useSampleStore((s) => s.finds);
  const events = useSampleStore((s) => s.events);
  const addEvent = useSampleStore((s) => s.addEvent);
  const assignSampleToEvent = useSampleStore((s) => s.assignSampleToEvent);
  const notify = useToastStore((s) => s.notify);

  const [dialog, setDialog] = useState<DialogMode>(null);
  const [name, setName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [primaryLocation, setPrimaryLocation] = useState('');
  const [targetEventId, setTargetEventId] = useState('');
  const [error, setError] = useState('');

  const currentEvent = useMemo(
    () => events.find((e) => e.id === sample.eventId),
    [events, sample.eventId],
  );
  const summary = useMemo(
    () => (currentEvent ? buildEventSummary(currentEvent, samples, finds) : null),
    [currentEvent, samples, finds],
  );

  /** 归入 / 改归候选：排除当前已属事件 */
  const candidates = useMemo(
    () => events.filter((e) => e.id !== sample.eventId),
    [events, sample.eventId],
  );

  const openDialog = (mode: DialogMode) => {
    setDialog(mode);
    setError('');
    if (mode === 'create') {
      setName('');
      setEventDate(new Date().toISOString().slice(0, 10));
      setPrimaryLocation('');
    } else if (mode === 'assign') {
      setTargetEventId(candidates[0]?.id ?? '');
    }
  };

  const submitCreate = async () => {
    if (!name.trim()) return setError('事件名称不能为空');
    if (!eventDate) return setError('请选择事件日期');
    if (!primaryLocation.trim()) return setError('主发现地不能为空');
    // addEvent 会在同一事务里把当前样本挂到新事件；若样本原属其他场，覆盖即先退出原场
    await addEvent({
      name: name.trim(),
      eventDate,
      primaryLocation: primaryLocation.trim(),
      firstSampleId: sample.id,
    });
    setDialog(null);
    notify(`已建立事件「${name.trim()}」，${sample.sampleNo} 已归档`);
  };

  const submitAssign = async () => {
    if (!targetEventId) return setError('请选择一场已有事件');
    const target = events.find((e) => e.id === targetEventId);
    await assignSampleToEvent(sample.id, targetEventId);
    setDialog(null);
    notify(`已将 ${sample.sampleNo} 归入「${target?.name ?? '该事件'}」`);
  };

  const leave = async () => {
    if (!currentEvent) return;
    await assignSampleToEvent(sample.id, null);
    notify(`已将 ${sample.sampleNo} 退出「${currentEvent.name}」`);
  };

  if (!currentEvent || !summary) {
    return (
      <Stack spacing={1.5}>
        <Alert severity="info">
          该样本尚未归档到任何降落事件。可以新建一场事件，或归入已有事件；每块样本只归一场。
        </Alert>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            startIcon={<AddCardIcon />}
            onClick={() => openDialog('create')}
            id="event-create"
          >
            新建降落事件
          </Button>
          <Button
            variant="outlined"
            startIcon={<LoginIcon />}
            onClick={() => openDialog('assign')}
            disabled={candidates.length === 0}
            title={candidates.length === 0 ? '暂无其他事件可归入' : undefined}
            id="event-assign"
          >
            归入已有事件
          </Button>
        </Stack>

        <Dialog open={dialog !== null} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
          {dialog === 'create' ? (
            <>
              <DialogTitle>新建降落事件并归档当前样本</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    id="event-name"
                    size="small"
                    label="事件名称"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：2024 年春撒哈拉回收批"
                    autoFocus
                  />
                  <TextField
                    id="event-date"
                    size="small"
                    type="date"
                    label="日期"
                    InputLabelProps={{ shrink: true }}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <TextField
                    id="event-primary-location"
                    size="small"
                    label="主发现地"
                    value={primaryLocation}
                    onChange={(e) => setPrimaryLocation(e.target.value)}
                    placeholder="如：Dar al Gani 区域"
                  />
                  {error ? <Alert severity="error">{error}</Alert> : null}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialog(null)}>取消</Button>
                <Button variant="contained" onClick={submitCreate}>
                  建立并归档
                </Button>
              </DialogActions>
            </>
          ) : (
            <>
              <DialogTitle>将 {sample.sampleNo} 归入已有事件</DialogTitle>
              <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  {candidates.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      还没有其他事件，请先新建。
                    </Typography>
                  ) : (
                    <FormControl size="small" fullWidth>
                      <InputLabel id="event-pick-label">降落事件</InputLabel>
                      <Select
                        labelId="event-pick-label"
                        label="降落事件"
                        value={targetEventId}
                        onChange={(e) => setTargetEventId(e.target.value)}
                      >
                        {candidates.map((e) => (
                          <MenuItem key={e.id} value={e.id}>
                            {e.name}（{e.eventDate} · {e.primaryLocation}）
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {error ? <Alert severity="error">{error}</Alert> : null}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDialog(null)}>取消</Button>
                <Button variant="contained" onClick={submitAssign} disabled={candidates.length === 0}>
                  归入
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Stack>
    );
  }

  return (
    <>
      <EventSummaryCard summary={summary} showMembers>
        <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => openDialog('assign')} id="event-reassign">
          改归其他事件
        </Button>
        <Button size="small" color="warning" startIcon={<LogoutIcon />} onClick={leave} id="event-leave">
          退出本事件
        </Button>
      </EventSummaryCard>

      <Dialog open={dialog === 'assign'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>将 {sample.sampleNo} 改归其他事件</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              改归会先退出原事件「{currentEvent.name}」，再归入所选事件。
            </Typography>
            {candidates.length === 0 ? (
              <Alert severity="warning">暂无其他事件，可先在其他样本上新建。</Alert>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel id="event-repick-label">降落事件</InputLabel>
                <Select
                  labelId="event-repick-label"
                  label="降落事件"
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                >
                  {candidates.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.name}（{e.eventDate} · {e.primaryLocation}）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>取消</Button>
          <Button variant="contained" onClick={submitAssign} disabled={candidates.length === 0}>
            改归
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default EventSection;
