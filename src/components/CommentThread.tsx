import React, { useState } from 'react';

import { Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/constants';
import { Input } from './FormControls';
import { Button } from './Button';
import { Send } from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
}

export function CommentThread({ comments, onAddComment }: CommentThreadProps) {
  const { currentUser } = useAuth();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-night-black">Diskusi & Komentar</h4>
      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="flex items-start gap-3">
            <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 bg-violet-essence/50 p-2 rounded-lg">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold">{comment.authorName}</span>
                <span className="text-palladium">{formatDate(comment.timestamp)}</span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
            <p className="text-sm text-center text-palladium py-4">Belum ada komentar.</p>
        )}
      </div>
      {currentUser && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-8 h-8 rounded-full" />
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Tulis komentar..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      )}
    </div>
  );
}
