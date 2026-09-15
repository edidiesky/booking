export interface UserProfileDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  userType: string;
  createdAt: string;
  profile: {
    bio: string | null;
    avatarUrl: string | null;
    address: Record<string, string>;
    preferences: Record<string, unknown>;
  } | null;
}