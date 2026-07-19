import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ReadMoreProps {
  text: string;
  limit?: number; // Word limit
  className?: string;
}

export const ReadMore: React.FC<ReadMoreProps> = ({ text, limit = 100, className = "" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const words = text.split(/\s+/);
  
  if (words.length <= limit) {
    return <p className={`text-sm text-muted-foreground ${className}`}>{text}</p>;
  }

  const truncatedText = words.slice(0, limit).join(' ') + '...';

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <p>
        {isExpanded ? text : truncatedText}
      </p>
      <button
        onClick={(e) => {
           e.stopPropagation(); // Prevent card click if inside a clickable card
           setIsExpanded(!isExpanded);
        }}
        className="text-primary hover:underline mt-1 text-xs font-semibold focus:outline-none"
      >
        {isExpanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
};
