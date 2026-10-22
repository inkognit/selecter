import Chip from '@mui/material/Chip';
import type { TaskPriority } from '@/api/types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../model/labels';

export function PriorityChip({ priority }: { priority: TaskPriority }) {
  return (
    <Chip
      size="small"
      label={PRIORITY_LABELS[priority]}
      color={PRIORITY_COLORS[priority]}
      variant={priority === 'LOW' ? 'outlined' : 'filled'}
      data-testid={`priority-${priority}`}
    />
  );
}
