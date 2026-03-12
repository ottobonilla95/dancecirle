import { Link } from "@/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string; // The base URL without page parameter
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className = ""
}: PaginationProps) {
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Helper function to build URL with page parameter
  const buildPageUrl = (page: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  // Generate page numbers to show (max 5 pages)
  const getPageNumbers = () => {
    const maxPages = Math.min(5, totalPages);
    const pages = [];
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className={`flex justify-center items-center gap-2 ${className}`}>
      {/* Previous Button */}
      <Link
        href={buildPageUrl(currentPage - 1)}
        className={`btn btn-sm ${!hasPrevPage ? 'btn-disabled' : 'btn-outline'}`}
        aria-disabled={!hasPrevPage}
      >
        <FaChevronLeft />
        Previous
      </Link>
      
      {/* Page Numbers */}
      <div className="flex gap-1">
        {getPageNumbers().map((pageNum) => {
          const isCurrentPage = pageNum === currentPage;
          
          return (
            <Link
              key={pageNum}
              href={buildPageUrl(pageNum)}
              className={`btn btn-sm ${
                isCurrentPage ? 'btn-primary' : 'btn-outline'
              }`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      <Link
        href={buildPageUrl(currentPage + 1)}
        className={`btn btn-sm ${!hasNextPage ? 'btn-disabled' : 'btn-outline'}`}
        aria-disabled={!hasNextPage}
      >
        Next
        <FaChevronRight />
      </Link>
    </div>
  );
} 