"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * sendOtp — sends a 6-digit OTP via SMS to the given phone number.
 * Phone must be in E.164 format: +91XXXXXXXXXX
 */
export async function sendOtp(phone: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: error.message };
  return {};
}

/**
 * verifyOtp — verifies the OTP token entered by the user.
 * On success, Supabase sets the session cookie automatically.
 */
export async function verifyOtp(
  phone: string,
  token: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) return { error: error.message };
  return {};
}

/**
 * signOut — clears the Supabase session and redirects to home.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * getSession — returns the current user session (null if not logged in).
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}
