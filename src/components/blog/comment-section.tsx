'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Reply, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FlagCommentButton } from '@/components/blog/flag-comment-button';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: string;
  allowComments: boolean;
}

export function CommentSection({ postId, allowComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/comments?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, postId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to comment.');
        } else {
          setError(data.error || 'Failed to post comment');
        }
        return;
      }

      setNewComment('');
      // Show pending message
      setComments((prev) => [
        { ...data, replies: [] },
        ...prev,
      ]);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent, postId, parentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to reply.');
        } else {
          setError(data.error || 'Failed to post reply');
        }
        return;
      }

      setReplyContent('');
      setReplyTo(null);
      // Update comment replies
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...(c.replies || []), data] }
            : c
        )
      );
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!allowComments) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Comments are disabled for this post.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-serif text-xl font-bold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="space-y-3">
        <Textarea
          placeholder="Share your thoughts..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex items-center justify-between">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="sm" disabled={submitting || !newComment.trim()} className="ml-auto">
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            Post Comment
          </Button>
        </div>
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              <CommentItem
                comment={comment}
                replyTo={replyTo}
                setReplyTo={setReplyTo}
                replyContent={replyContent}
                setReplyContent={setReplyContent}
                handleReply={handleReply}
                submitting={submitting}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  replyTo,
  setReplyTo,
  replyContent,
  setReplyContent,
  handleReply,
  submitting,
}: {
  comment: Comment;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (v: string) => void;
  handleReply: (parentId: string) => void;
  submitting: boolean;
}) {
  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.image || undefined} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/author/${comment.author.username}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {comment.author.name}
            </Link>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.createdAt).toLocaleDateString('en-KE', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <p className="text-sm mt-1 leading-relaxed">{comment.content}</p>
          <div className="flex items-center gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            <FlagCommentButton commentId={comment.id} />
          </div>

          {/* Reply form */}
          {replyTo === comment.id && (
            <div className="mt-2 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  className="h-7"
                  disabled={submitting || !replyContent.trim()}
                  onClick={() => handleReply(comment.id)}
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 mt-2 space-y-3 border-l-2 border-border pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={reply.author.image || undefined} />
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {reply.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/author/${reply.author.username}`}
                        className="text-xs font-medium hover:text-primary transition-colors"
                      >
                        {reply.author.name}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(reply.createdAt).toLocaleDateString('en-KE', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 leading-relaxed">{reply.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <FlagCommentButton commentId={reply.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
