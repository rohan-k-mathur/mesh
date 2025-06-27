import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";

interface CommentTreeProps {
  comments: any[];
  currentUserId: bigint;
  currentUserImg: string;
}

const CommentTree = ({ comments, currentUserId, currentUserImg }: CommentTreeProps) => {
  return (
    <div className="ml-6 flex flex-col gap-3">
      {comments.map((comment) => (
        <div key={comment.id} className="mt-4">
          <ThreadCard
            id={comment.id}
            currentUserId={currentUserId}
            parentId={comment.parent_id}
            content={comment.content}
            author={comment.author}
            createdAt={comment.created_at.toDateString()}
            comments={comment.children}
            isComment
            likeCount={comment.like_count}
          />
          <div className="ml-6 mt-4">
            <Comment
              postId={comment.id}
              currentUserImg={currentUserImg}
              currentUserId={currentUserId}
            />
            {comment.children && comment.children.length > 0 && (
              <CommentTree
                comments={comment.children}
                currentUserId={currentUserId}
                currentUserImg={currentUserImg}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentTree;
