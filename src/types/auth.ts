export interface TokenPayload {
  sub: string;  // user id
  role: string;
  permissions: string[];
  type: 'access' | 'refresh';
  jti: string;  // token id
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}