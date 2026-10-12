import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // const headers = new Headers(request.headers);
  // headers.set("x-current-path", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request,
  });

  // // check origin URL, if the same base URL, allow the request
  // if (request.nextUrl.origin.startsWith(process.env.NEXT_PUBLIC_BASE_URL!)) {
  //   return supabaseResponse;
  // }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, {
                ...options,
                domain: ".ubclaunchpad.com", // Set your root domain
                secure: true,
                sameSite: "lax",
              }),
            );
            // Keep CDNs from caching responses that set auth cookies
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value),
            );
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      // no user, potentially respond by redirecting the user to the login page
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      const resp = NextResponse.redirect(url);
      resp.cookies.set("x-path", request.nextUrl.pathname);
      return resp;
    }
  } catch (error) {
    console.error("Error fetching user", error);
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
