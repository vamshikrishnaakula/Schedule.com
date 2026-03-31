import { getServerSession } from "@calcom/feature-auth/lib/getServerSession";
import { getOptions } from "@calcom/feature-auth/lib/next-auth-options";
import { getTrackingFromCookies } from "@calcom/lib/tracking";
import type { GetServerSidePropsContext } from "next";

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession({
    req: context.req,
    authOptions: getOptions({
      getDubId: () => context.req.cookies.dub_id || context.req.cookies.dclid,
      getTrackingData: () => getTrackingFromCookies(context.req.cookies),
    }),
  });

  // Disable this check if we ever make this self serve.
  if (session?.user.role !== "ADMIN") {
    return {
      notFound: true,
    } as const;
  }

  return {
    props: {},
  };
};

// This is the code block that represents the suggested code change:
// "scripts": {
//   "build": "NODE_OPTIONS=\"--max-old-space-size=8192\" turbo run build --filter=@calcom/web...",
// }
