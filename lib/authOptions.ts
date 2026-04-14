import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "quran-foundation",
      name: "Quran Foundation",
      type: "oauth",
      authorization: {
        url: "https://prelive-oauth2.quran.foundation/oauth2/auth",
        params: {
            scope: "openid offline_access user post room streak",
          response_type: "code",
        },
      },
      token: {
        url: "https://prelive-oauth2.quran.foundation/oauth2/token",
        async request(context) {
          const credentials = Buffer.from(
            `${context.provider.clientId}:${context.provider.clientSecret}`
          ).toString("base64");

          const res = await fetch("https://prelive-oauth2.quran.foundation/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${credentials}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: context.params.code as string,
              redirect_uri: context.provider.callbackUrl,
            }),
          });

          const tokens = await res.json();
          return { tokens };
        },
      },
      userinfo: "https://prelive-oauth2.quran.foundation/userinfo",
      clientId: process.env.QURAN_CLIENT_ID,
      clientSecret: process.env.QURAN_CLIENT_SECRET,
      checks: ["state"],
      client: {
        token_endpoint_auth_method: "client_secret_basic",
      },
      profile(profile) {
        const name =
          profile.name ??
          profile.username ??
          profile.preferred_username ??
          (profile.given_name
            ? `${profile.given_name}${profile.family_name ? " " + profile.family_name : ""}`
            : null) ??
          profile.sub;
        return {
          id: profile.sub,
          name,
          email: profile.email ?? `${profile.sub}@quran.foundation`,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        try {
          const res = await fetch(
            "https://apis-prelive.quran.foundation/quran-reflect/v1/users/me",
            {
              headers: {
                "Accept": "application/json",
                "x-auth-token": account.access_token as string,
                "x-client-id": process.env.QURAN_CLIENT_ID!,
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const u = data.data ?? data;
            const displayName =
              (u.firstName && u.lastName
                ? `${u.firstName} ${u.lastName}`
                : u.firstName ?? u.username ?? u.name ?? null);
            if (displayName) token.displayName = displayName;
          }
        } catch {
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      if (token.displayName) {
        session.user = { ...session.user, name: token.displayName as string };
      } else if (session.user?.name) {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (UUID_RE.test(session.user.name)) {
          session.user = {
            ...session.user,
            name: session.user.email?.split("@")[0] ?? session.user.name,
          };
        }
      }
      return session;
    },
  },
};