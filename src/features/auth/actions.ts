"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, getSiteUrl } from "@/lib/supabase/server";

function getCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) return null;
  return { email, password };
}

export async function signIn(formData: FormData) {
  const credentials = getCredentials(formData);
  if (!credentials) redirect("/connexion?status=invalid");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect("/connexion?status=invalid");
  redirect("/pronostics");
}

export async function signUp(formData: FormData) {
  const credentials = getCredentials(formData);
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  if (!credentials || firstName.length < 1 || firstName.length > 80 || lastName.length < 1 || lastName.length > 80 || !/^[\p{L}\p{N}_-]{3,32}$/u.test(username)) {
    redirect("/inscription?status=invalid");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      emailRedirectTo: `${getSiteUrl()}/confirmation-email?next=%2Fpronostics`,
      data: { first_name: firstName, last_name: lastName, username },
    },
  });

  // Keep the response generic to avoid revealing whether an email is already registered.
  if (error) redirect(error.code === "23505" ? "/inscription?status=pseudo-taken" : "/inscription?status=unavailable");
  if (data.session) redirect("/pronostics");
  redirect("/inscription?status=check-email");
}

export async function confirmEmail(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  if (!tokenHash || tokenHash.length > 512) redirect("/connexion?status=confirmation-error");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (error) {
    console.error("Échec de confirmation email Supabase.", { code: error.code, message: error.message });
    redirect("/connexion?status=confirmation-error");
  }
  redirect("/pronostics");
}

export async function resendSignupConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/inscription?status=invalid-email");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/confirmation-email?next=%2Fpronostics` },
  });
  if (error) console.error("Échec de renvoi de confirmation email Supabase.", { code: error.code, message: error.message });
  // Keep the response generic so the page does not reveal whether an account exists.
  redirect("/inscription?status=resent");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  if (firstName.length < 1 || firstName.length > 80 || lastName.length < 1 || lastName.length > 80 || !/^[\p{L}\p{N}_-]{3,32}$/u.test(username)) {
    redirect("/profil?status=invalid");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_username: username,
  });
  if (error) redirect(error.code === "23505" ? "/profil?status=pseudo-taken" : "/profil?status=unavailable");
  redirect("/profil?status=saved");
}
