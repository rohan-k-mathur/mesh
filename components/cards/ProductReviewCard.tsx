"use client";

interface ProductReviewCardProps {
  productName: string;
  rating: number;
  summary: string;
  productLink: string;
}

const ProductReviewCard = ({
  productName,
  rating,
  summary,
  productLink,
}: ProductReviewCardProps) => {
  return (
    <div className="flex flex-col items-start mt-2 mb-2">
      <div className="font-bold">{productName}</div>
      <div>Rating: {rating}/5</div>
      <div className="text-sm mt-1">{summary}</div>
      <a
        href={productLink}
        className="text-xs text-blue-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Product
      </a>
    </div>
  );
};

export default ProductReviewCard;
