import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: objects, error: listError } = await supabaseAdmin.storage
      .from("documents")
      .list(userId, { limit: 1000 });
    if (listError) throw new Error("Could not prepare your uploaded documents for deletion.");

    if (objects?.length) {
      const { error: removeError } = await supabaseAdmin.storage
        .from("documents")
        .remove(objects.map((object) => `${userId}/${object.name}`));
      if (removeError) throw new Error("Could not remove your uploaded documents.");
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Account deletion failed", error);
      throw new Error("Could not delete your account.");
    }

    return { deleted: true as const };
  });

