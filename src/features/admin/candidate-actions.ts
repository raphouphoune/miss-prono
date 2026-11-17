"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const photoBucket = "candidate-photos";

async function getCandidateAdminContext() {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims.sub) redirect("/connexion");
  const { data: isAdmin, error: adminError } = await supabase.rpc("is_app_admin");
  if (adminError || !isAdmin) redirect("/");
  const { data: edition, error } = await supabase.from("editions").select("id").eq("slug", "miss-france-2027").maybeSingle();
  if (error || !edition) redirect("/admin?status=unavailable");
  return { supabase, edition };
}

function readCandidateFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const region = String(formData.get("region") ?? "").trim();
  const candidateNumber = Number(String(formData.get("candidate_number") ?? ""));
  const rawAge = String(formData.get("age") ?? "").trim();
  const rawHeight = String(formData.get("height_cm") ?? "").trim();
  const age = rawAge ? Number(rawAge) : null;
  const heightCm = rawHeight ? Number(rawHeight) : null;
  const electedOn = String(formData.get("elected_on") ?? "").trim() || null;
  const electedAt = String(formData.get("elected_at") ?? "").trim();
  const hometown = String(formData.get("hometown") ?? "").trim();
  const education = String(formData.get("education") ?? "").trim();
  const occupation = String(formData.get("occupation") ?? "").trim();
  const biography = String(formData.get("biography") ?? "").trim();
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim();
  const officialSourceUrl = String(formData.get("official_source_url") ?? "").trim();
  const profileSourceUrl = String(formData.get("profile_source_url") ?? "").trim();
  const photoSourceUrl = String(formData.get("photo_source_url") ?? "").trim();
  const readList = (name: string) => String(formData.get(name) ?? "").split("\n").map((value) => value.trim()).filter(Boolean);
  const passions = readList("passions");
  const commitments = readList("commitments");
  const validUrl = (value: string) => {
    if (!value) return true;
    try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
  };
  const validDate = !electedOn || ( /^\d{4}-\d{2}-\d{2}$/.test(electedOn) && !Number.isNaN(Date.parse(`${electedOn}T00:00:00Z`)) && new Date(`${electedOn}T00:00:00Z`).toISOString().slice(0, 10) === electedOn );

  if (
    name.length < 2 || name.length > 120 || region.length < 2 || region.length > 100 ||
    !Number.isInteger(candidateNumber) || candidateNumber < 1 || candidateNumber > 32767 ||
    (age !== null && (!Number.isInteger(age) || age < 16 || age > 100)) ||
    (heightCm !== null && (!Number.isInteger(heightCm) || heightCm < 100 || heightCm > 250)) ||
    !validDate || electedAt.length > 120 || hometown.length > 200 || education.length > 2000 || occupation.length > 2000 ||
    biography.length > 10000 || passions.length > 30 || commitments.length > 30 ||
    [...passions, ...commitments].some((item) => item.length > 300) ||
    [instagramUrl, officialSourceUrl, profileSourceUrl, photoSourceUrl].some((value) => value.length > 500 || !validUrl(value))
  ) return null;

  return {
    name,
    region,
    candidate_number: candidateNumber,
    age,
    height_cm: heightCm,
    elected_on: electedOn,
    elected_at: electedAt || null,
    hometown: hometown || null,
    education: education || null,
    occupation: occupation || null,
    biography: biography || null,
    instagram_url: instagramUrl || null,
    official_source_url: officialSourceUrl || null,
    profile_source_url: profileSourceUrl || null,
    photo_source_url: photoSourceUrl || null,
    passions,
    commitments,
  };
}

function slugify(name: string) {
  return name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
}

function oldBucketPath(url: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const prefix = baseUrl ? `${baseUrl}/storage/v1/object/public/${photoBucket}/` : "";
  if (!prefix || !url?.startsWith(prefix)) return null;
  try { return decodeURIComponent(url.slice(prefix.length)); } catch { return null; }
}

function validatePhoto(value: FormDataEntryValue | null): File | null | false {
  if (!value || typeof value === "string" || value.size === 0) return null;
  if (value.size > 8 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(value.type)) return false;
  return value;
}

export async function createCandidate(formData: FormData) {
  const fields = readCandidateFields(formData);
  if (!fields) redirect("/admin/candidates?status=invalid");
  const slug = slugify(fields.name);
  if (!slug) redirect("/admin/candidates?status=invalid");

  const photo = validatePhoto(formData.get("photo"));
  if (photo === false) redirect("/admin/candidates?status=invalid-photo");
  const { supabase, edition } = await getCandidateAdminContext();
  let photoUrl: string | null = null;
  if (photo) {
    const extension = photo.type === "image/jpeg" ? "jpg" : photo.type === "image/png" ? "png" : "webp";
    const path = `${edition.id}/${slug}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(photoBucket).upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) {
      console.error("candidate photo upload failed", { message: uploadError.message });
      redirect("/admin/candidates?status=photo-error");
    }
    photoUrl = supabase.storage.from(photoBucket).getPublicUrl(path).data.publicUrl;
  }

  const { data, error } = await supabase.from("candidates").insert({ ...fields, slug, edition_id: edition.id, photo_url: photoUrl }).select("id").single();
  if (error || !data) {
    if (photoUrl) {
      const path = oldBucketPath(photoUrl);
      if (path) await supabase.storage.from(photoBucket).remove([path]);
    }
    console.error("candidate creation failed", { code: error?.code, message: error?.message });
    redirect(error?.code === "23505" ? "/admin/candidates?status=duplicate" : "/admin/candidates?status=save-error");
  }
  redirect(`/admin/candidates/${data.id}?status=created`);
}

export async function updateCandidate(formData: FormData) {
  const id = String(formData.get("candidate_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) redirect("/admin/candidates?status=not-found");
  const fields = readCandidateFields(formData);
  if (!fields) redirect(`/admin/candidates/${id}?status=invalid`);
  const photo = validatePhoto(formData.get("photo"));
  if (photo === false) redirect(`/admin/candidates/${id}?status=invalid-photo`);

  const { supabase, edition } = await getCandidateAdminContext();
  const { data: candidate, error: candidateError } = await supabase.from("candidates").select("slug,photo_url").eq("id", id).eq("edition_id", edition.id).maybeSingle();
  if (candidateError || !candidate) redirect("/admin/candidates?status=not-found");

  let newPhotoUrl: string | undefined;
  if (photo) {
    const extension = photo.type === "image/jpeg" ? "jpg" : photo.type === "image/png" ? "png" : "webp";
    const path = `${edition.id}/${candidate.slug}/${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(photoBucket).upload(path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) {
      console.error("candidate photo upload failed", { message: uploadError.message });
      redirect(`/admin/candidates/${id}?status=photo-error`);
    }
    newPhotoUrl = supabase.storage.from(photoBucket).getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase.from("candidates").update({ ...fields, ...(newPhotoUrl ? { photo_url: newPhotoUrl } : {}) }).eq("id", id).eq("edition_id", edition.id);
  if (error) {
    if (newPhotoUrl) {
      const path = oldBucketPath(newPhotoUrl);
      if (path) await supabase.storage.from(photoBucket).remove([path]);
    }
    console.error("candidate update failed", { code: error.code, message: error.message });
    redirect(error.code === "23505" ? `/admin/candidates/${id}?status=duplicate` : `/admin/candidates/${id}?status=save-error`);
  }

  if (newPhotoUrl) {
    const oldPath = oldBucketPath(candidate.photo_url);
    if (oldPath) await supabase.storage.from(photoBucket).remove([oldPath]);
  }
  redirect(`/admin/candidates/${id}?status=${newPhotoUrl ? "photo-saved" : "saved"}`);
}

export async function deleteCandidate(formData: FormData) {
  const id = String(formData.get("candidate_id") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) redirect("/admin/candidates?status=not-found");
  const { supabase, edition } = await getCandidateAdminContext();
  const { data: candidate } = await supabase.from("candidates").select("photo_url").eq("id", id).eq("edition_id", edition.id).maybeSingle();
  const { error } = await supabase.from("candidates").delete().eq("id", id).eq("edition_id", edition.id);
  if (error) {
    console.error("candidate deletion failed", { code: error.code, message: error.message });
    redirect("/admin/candidates?status=delete-blocked");
  }
  const photoPath = oldBucketPath(candidate?.photo_url ?? null);
  if (photoPath) await supabase.storage.from(photoBucket).remove([photoPath]);
  redirect("/admin/candidates?status=deleted");
}
