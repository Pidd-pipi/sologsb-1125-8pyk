import type { ReactNode } from 'react';
import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PlaceIcon from '@mui/icons-material/Place';
import ScaleIcon from '@mui/icons-material/Scale';
import { Link as RouterLink } from 'react-router-dom';
import type { EventSummary } from '../../utils/event';
import { formatWeight } from '../../utils/format';

interface EventSummaryCardProps {
  summary: EventSummary;
  /** 紧凑模式：总览页顶栏使用 */
  dense?: boolean;
  /** 是否列出成员样本编号链接 */
  showMembers?: boolean;
  /** 操作按钮（改归 / 退出等） */
  children?: ReactNode;
}

/** 降落事件卡：汇总成员数量、总重量与各处发现地 */
export function EventSummaryCard({
  summary,
  dense = false,
  showMembers = false,
  children,
}: EventSummaryCardProps) {
  const { event, members, memberCount, totalWeight, sites } = summary;
  return (
    <Paper variant="outlined" sx={{ p: dense ? 2 : 2.5, borderRadius: 2.5 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <TravelExploreIcon color="primary" />
          <Typography variant={dense ? 'subtitle1' : 'h6'} fontWeight={700}>
            {event.name}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            size="small"
            icon={<EventNoteIcon />}
            label={event.eventDate}
            variant="outlined"
          />
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" icon={<PlaceIcon />} label={`主发现地：${event.primaryLocation}`} />
          <Chip size="small" color="primary" label={`成员 ${memberCount} 块`} />
          <Chip
            size="small"
            icon={<ScaleIcon />}
            label={`总重 ${formatWeight(totalWeight)}`}
            color="secondary"
          />
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary">
            各处发现地（{sites.length}）
          </Typography>
          {sites.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              成员样本暂未登记发现地。
            </Typography>
          ) : (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
              {sites.map((site) => (
                <Chip
                  key={`${site.region}__${site.placeName}`}
                  size="small"
                  variant="outlined"
                  label={`${site.region} · ${site.placeName}（${site.count}）`}
                />
              ))}
            </Stack>
          )}
        </Box>

        {showMembers && members.length > 0 ? (
          <>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">
                事件成员
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                {members.map((m) => (
                  <Chip
                    key={m.id}
                    size="small"
                    clickable
                    component={RouterLink}
                    to={`/samples/${m.id}`}
                    label={`${m.sampleNo} · ${formatWeight(m.totalWeight)}`}
                  />
                ))}
              </Stack>
            </Box>
          </>
        ) : null}

        {children ? (
          <>
            <Divider />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {children}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default EventSummaryCard;
