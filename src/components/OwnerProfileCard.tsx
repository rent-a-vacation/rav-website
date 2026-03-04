import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ShieldCheck, Home } from 'lucide-react';

interface OwnerProfileCardProps {
  ownerId: string;
}

export function OwnerProfileCard({ ownerId }: OwnerProfileCardProps) {
  const { data: profile, isLoading } = useOwnerProfile(ownerId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card space-y-3" data-testid="owner-profile-skeleton">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = profile.first_name
    ? profile.first_name[0].toUpperCase()
    : '?';

  const memberYear = new Date(profile.member_since).getFullYear();

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card" data-testid="owner-profile-card">
      {/* Owner info */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={profile.avatar_url || undefined} alt={profile.first_name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{profile.first_name || 'Owner'}</span>
            {profile.is_verified && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Member since {memberYear}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm border-t pt-3">
        <div className="flex items-center gap-1.5">
          <Home className="h-4 w-4 text-muted-foreground" />
          <span>{profile.listing_count} listing{profile.listing_count !== 1 ? 's' : ''}</span>
        </div>
        {profile.review_count > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span>{profile.avg_rating}</span>
            <span className="text-muted-foreground">({profile.review_count})</span>
          </div>
        )}
      </div>
    </div>
  );
}
