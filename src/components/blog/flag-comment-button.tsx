'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FlagCommentButtonProps {
  commentId: string;
  contentType?: 'COMMENT' | 'POST';
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'default' | 'icon';
  showLabel?: boolean;
}

const FLAG_REASONS = [
  { value: 'SPAM', label: 'Spam', description: 'Irrelevant or promotional content' },
  { value: 'HARASSMENT', label: 'Harassment', description: 'Targeted abuse or intimidation' },
  { value: 'HATE_SPEECH', label: 'Hate Speech', description: 'Discriminatory or hateful language' },
  { value: 'MISINFORMATION', label: 'Misinformation', description: 'False or misleading claims' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate', description: 'Offensive or unsuitable content' },
  { value: 'OTHER', label: 'Other', description: 'Any other concern' },
];

export function FlagCommentButton({
  commentId,
  contentType = 'COMMENT',
  variant = 'ghost',
  size = 'sm',
  showLabel = true,
}: FlagCommentButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/flagged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId: commentId,
          reason,
          description: description.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Content reported. Our moderation team will review it.');
        setOpen(false);
        setReason('');
        setDescription('');
      } else if (res.status === 409) {
        toast.info('You have already reported this content');
        setOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to report content');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    // Not logged in — no flag option
    return null;
  }

  const label = contentType === 'POST' ? 'Report Post' : 'Report';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={contentType === 'POST' ? 'text-muted-foreground hover:text-amber-600' : 'h-6 px-2 text-xs text-muted-foreground hover:text-amber-600'}
        >
          <Flag className={contentType === 'POST' ? 'h-4 w-4 mr-1.5' : 'h-3 w-3 mr-1'} />
          {showLabel && <span>{label}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            {contentType === 'POST' ? 'Report Article' : 'Report Content'}
          </DialogTitle>
          <DialogDescription>
            {contentType === 'POST'
              ? 'Report this article for review. Our moderation team will assess it.'
              : 'Help us keep the community safe. Reports are reviewed by our moderation team.'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flag-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="flag-reason">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {FLAG_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <span className="font-medium">{r.label}</span>
                      <span className="text-muted-foreground"> — {r.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="flag-description">Additional details (optional)</Label>
            <Textarea
              id="flag-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about the issue..."
              className="min-h-[80px] resize-none text-sm"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !reason}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
