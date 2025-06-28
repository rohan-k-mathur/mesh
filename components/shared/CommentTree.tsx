import ThreadCard from "@/components/cards/ThreadCard";
import Comment from "@/components/forms/Comment";

interface CommentTreeProps {
  comments: any[];
  currentUserId: bigint;
  currentUserImg: string;
  depth?: number;
}

const MAX_DEPTH = 5;
const INDENT_PX = 24;

const CommentTree = ({ comments, currentUserId, currentUserImg, depth = 0 }: CommentTreeProps) => {
  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => {
        const indent = Math.min(depth, MAX_DEPTH) * INDENT_PX;
        return (
          <div
            key={comment.id}
            className="mt-4"
            style={{ marginLeft: indent, width: `calc(100% - ${indent}px)` }}
          >
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
          <div
            className="mt-4"
            style={{ marginLeft: indent, width: `calc(100% - ${indent}px)` }}
          >
                              <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-75" />

            <Comment
              postId={comment.id}
              currentUserImg={currentUserImg}
              currentUserId={currentUserId}
            />
                  <hr className="mt-4 mb-3 w-full h-px border-t-0 bg-transparent bg-gradient-to-r from-transparent via-slate-900 to-transparent opacity-75" />

            {comment.children && comment.children.length > 0 && (
              <CommentTree
                comments={comment.children}
                currentUserId={currentUserId}
                currentUserImg={currentUserImg}
                depth={depth + 1}
              />
            )}
          </div>
          </div>
        );
      })}
    </div>
  );
};

export default CommentTree;
