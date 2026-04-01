import { getAppRegistry } from "@calcom/app-store/_appRegistry";
import type { AppCategories } from "@calcom/prisma/enums";

type GetStaticPropsResult = {
  apps: Awaited<ReturnType<typeof getAppRegistry>>;
  category: AppCategories;
};

export const getStaticProps = async (category: AppCategories): Promise<GetStaticPropsResult> => {
  const appStore = await getAppRegistry();
  const apps = appStore.filter((app) => app.categories.includes(category));
  return {
    apps,
    category,
  };
};

export type CategoryDataProps = GetStaticPropsResult;
