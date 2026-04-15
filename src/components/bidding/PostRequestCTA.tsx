import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostRequestCTAProps {
  searchDestination?: string;
  searchCheckIn?: string;
  searchCheckOut?: string;
}

export function PostRequestCTA({ searchDestination, searchCheckIn, searchCheckOut }: PostRequestCTAProps) {
  const params = new URLSearchParams();
  params.set('tab', 'wishes');
  params.set('prefill', 'true');
  if (searchDestination) params.set('destination', searchDestination);
  if (searchCheckIn) params.set('checkin', searchCheckIn);
  if (searchCheckOut) params.set('checkout', searchCheckOut);

  const href = `/marketplace?${params.toString()}`;

  return (
    <div className="bg-muted border border-border rounded-xl p-6 text-center max-w-lg mx-auto mt-6">
      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
      <h4 className="font-semibold text-lg mb-2">Can&apos;t find what you need?</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Post a Wish and let owners come to you. Tell us what you want — owners with matching weeks will send you Offers.
      </p>
      <Link to={href}>
        <Button>
          Post a Wish
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground mt-3">
        Your Wish will be visible to all verified owners on RAV.
      </p>
    </div>
  );
}
