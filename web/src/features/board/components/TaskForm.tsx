'use client';

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useEffect, useState, type FormEvent } from 'react';
import {
  DESCRIPTION_MAX_LENGTH,
  TASK_PRIORITIES,
  TITLE_MAX_LENGTH,
  type TaskInput,
  type TaskPriority,
} from '@/api/types';
import { PRIORITY_LABELS } from '../model/labels';
import { isDirty, toTaskInput, validateTaskForm, type TaskFormValues } from '../model/task-form';

export const TASK_FORM_ID = 'task-form';

interface Props {
  initial: TaskFormValues;
  onSubmit: (input: TaskInput) => void;
  /** dirty — есть несохранённый ввод; valid — можно отправлять (кнопка отправки активна). */
  onStateChange: (state: { dirty: boolean; valid: boolean }) => void;
}

/**
 * Поля задачи — общие для создания и правки. Кнопки живут в DialogActions и отправляют
 * форму через атрибут form={TASK_FORM_ID}. Ошибки — после ухода с поля или попытки отправки.
 */
export function TaskForm({ initial, onSubmit, onStateChange }: Props) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({ title: false, description: false });
  const errors = validateTaskForm(values);
  const dirty = isDirty(initial, values);
  const valid = !errors.title && !errors.description;

  useEffect(() => onStateChange({ dirty, valid }), [dirty, valid, onStateChange]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, description: true });
    if (valid) onSubmit(toTaskInput(values));
  };

  return (
    <Stack component="form" id={TASK_FORM_ID} noValidate onSubmit={submit} spacing={2.5} sx={{ pt: 1 }}>
      <TextField
        label="Название"
        required
        autoFocus
        value={values.title}
        onChange={(e) => setValues({ ...values, title: e.target.value })}
        onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        error={touched.title && Boolean(errors.title)}
        helperText={(touched.title && errors.title) || `${values.title.trim().length}/${TITLE_MAX_LENGTH}`}
        slotProps={{ htmlInput: { 'data-testid': 'task-title-input', maxLength: TITLE_MAX_LENGTH + 50 } }}
      />
      <TextField
        label="Описание"
        multiline
        minRows={4}
        maxRows={10}
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
        onBlur={() => setTouched((t) => ({ ...t, description: true }))}
        error={touched.description && Boolean(errors.description)}
        helperText={
          (touched.description && errors.description) || `${values.description.length}/${DESCRIPTION_MAX_LENGTH}`
        }
        slotProps={{ htmlInput: { 'data-testid': 'task-description-input' } }}
      />
      <FormControl>
        <InputLabel id="task-priority-label">Приоритет</InputLabel>
        <Select
          labelId="task-priority-label"
          label="Приоритет"
          value={values.priority}
          onChange={(e) => setValues({ ...values, priority: e.target.value as TaskPriority })}
          data-testid="task-priority-select"
        >
          {TASK_PRIORITIES.map((p) => (
            <MenuItem key={p} value={p} data-testid={`priority-option-${p}`}>
              {PRIORITY_LABELS[p]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
