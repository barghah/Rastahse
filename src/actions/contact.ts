"use server";

/**
 * actions/contact.ts
 * Server Action to persist contact form submissions to Supabase.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface ContactFormInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export async function submitContactMessage(input: ContactFormInput) {
  const supabase = await createAdminClient();

  const { error } = await supabase.from("contact_messages").insert({
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    subject: input.subject?.trim() ?? null,
    message: input.message.trim(),
  });

  if (error) {
    console.error("[submitContactMessage] Supabase error:", error);
    throw new Error("Failed to submit message. Please try again.");
  }
}
