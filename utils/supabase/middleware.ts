import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (request: NextRequest) => {
    // Create an unmodified response
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        supabaseUrl!,
        supabaseKey!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        },
    );

    return supabaseResponse
};