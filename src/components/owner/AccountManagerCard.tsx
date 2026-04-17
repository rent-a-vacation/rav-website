import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Mail, Phone, UserCircle } from 'lucide-react';
import { useMyMembership } from '@/hooks/useMembership';
import { useMyAccountManager } from '@/hooks/useAccountManager';
import { hasAccountManager } from '@/lib/tierGating';

export function AccountManagerCard() {
  const { data: membership } = useMyMembership();
  const { data: manager, isLoading } = useMyAccountManager();

  const tierLevel = membership?.tier?.tier_level;
  const roleCategory = membership?.tier?.role_category;

  if (!hasAccountManager(tierLevel, roleCategory)) return null;

  if (isLoading) return null;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-600" />
          <CardTitle className="text-base">Your Account Manager</CardTitle>
        </div>
        <CardDescription>
          As a Business member, you have a dedicated point of contact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {manager ? (
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={manager.avatar_url || undefined} alt={manager.full_name} />
              <AvatarFallback>
                {manager.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'AM'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{manager.full_name}</p>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button asChild variant="outline" size="sm" className="gap-1.5">
                  <a href={`mailto:${manager.email}`}>
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                </Button>
                {manager.phone && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={`tel:${manager.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-muted-foreground">
            <UserCircle className="h-10 w-10" />
            <div>
              <p className="text-sm font-medium text-foreground">Not yet assigned</p>
              <p className="text-xs">
                We're assigning your dedicated account manager. You'll hear from us shortly.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
