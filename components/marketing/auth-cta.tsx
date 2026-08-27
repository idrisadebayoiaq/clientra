import { ButtonLink } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { ComponentProps } from "react";

type ButtonProps = Omit<ComponentProps<typeof ButtonLink>, "href" | "children">;

export async function MarketingAuthCta({
  signedOutHref = "/signup",
  signedOutLabel = "Start Finding Clients",
  signedInHref = "/dashboard",
  signedInLabel = "Open dashboard",
  ...props
}: ButtonProps & {
  signedOutHref?: string;
  signedOutLabel?: string;
  signedInHref?: string;
  signedInLabel?: string;
}) {
  const { user } = await getAuthenticatedUser();

  if (user) {
    return (
      <ButtonLink href={signedInHref} {...props}>
        {signedInLabel}
      </ButtonLink>
    );
  }

  return (
    <ButtonLink href={signedOutHref} {...props}>
      {signedOutLabel}
    </ButtonLink>
  );
}
