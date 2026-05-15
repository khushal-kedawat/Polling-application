import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { pollFormSchema } from '@/lib/validators';
import { api, extractError } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const defaultExpiry = () => {
  const t = new Date(Date.now() + 24 * 60 * 60 * 1000);
  t.setSeconds(0, 0);
  // for datetime-local: YYYY-MM-DDTHH:mm
  const pad = (n) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
};

export default function PollCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: '',
      description: '',
      responseMode: 'anonymous',
      expiresAt: defaultExpiry(),
      questions: [
        {
          text: '',
          isRequired: true,
          options: [{ text: '' }, { text: '' }],
        },
      ],
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields: questions, append: appendQ, remove: removeQ } = useFieldArray({
    control,
    name: 'questions',
  });

  const responseMode = watch('responseMode');

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        description: values.description || undefined,
        expiresAt: new Date(values.expiresAt).toISOString(),
      };
      const { data } = await api.post('/polls', payload);
      toast.success('Poll created');
      navigate(`/dashboard/polls/${data.poll.id}`);
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New poll</h1>
        <p className="text-sm text-muted-foreground">
          Add questions and options. Single-choice only.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Set the title, mode, and expiry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="expiresAt">Expires at</Label>
                <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
                {errors.expiresAt && (
                  <p className="text-sm text-destructive">{errors.expiresAt.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Response mode</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch
                    id="mode"
                    checked={responseMode === 'authenticated'}
                    onCheckedChange={(v) =>
                      setValue('responseMode', v ? 'authenticated' : 'anonymous', {
                        shouldValidate: true,
                      })
                    }
                  />
                  <Label htmlFor="mode" className="cursor-pointer">
                    {responseMode === 'authenticated'
                      ? 'Authenticated only'
                      : 'Anonymous allowed'}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {questions.map((q, qi) => (
            <QuestionEditor
              key={q.id}
              qIndex={qi}
              register={register}
              control={control}
              errors={errors}
              onRemove={() => removeQ(qi)}
              canRemove={questions.length > 1}
            />
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendQ({ text: '', isRequired: false, options: [{ text: '' }, { text: '' }] })
            }
          >
            <Plus className="h-4 w-4" /> Add question
          </Button>
          {errors.questions?.message && (
            <p className="text-sm text-destructive">{errors.questions.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create poll'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function QuestionEditor({ qIndex, register, control, errors, onRemove, canRemove }) {
  const {
    fields: options,
    append: appendOpt,
    remove: removeOpt,
  } = useFieldArray({ control, name: `questions.${qIndex}.options` });

  const qErrors = errors.questions?.[qIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                {...register(`questions.${qIndex}.isRequired`)}
              />
              Required
            </label>
            {canRemove && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onRemove}
                aria-label="Remove question"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Question text" {...register(`questions.${qIndex}.text`)} />
        {qErrors?.text && <p className="text-sm text-destructive">{qErrors.text.message}</p>}

        <div className="space-y-2">
          {options.map((opt, oi) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm w-6">{oi + 1}.</span>
              <Input
                placeholder={`Option ${oi + 1}`}
                {...register(`questions.${qIndex}.options.${oi}.text`)}
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeOpt(oi)}
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => appendOpt({ text: '' })}
          >
            <Plus className="h-4 w-4" /> Add option
          </Button>
          {qErrors?.options && (
            <p className="text-sm text-destructive">
              {qErrors.options.message || qErrors.options.root?.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
