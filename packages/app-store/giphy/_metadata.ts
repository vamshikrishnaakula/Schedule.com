import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Giphy",
  description: _package.description,
  installed: true,
  categories: ["other"],
  logo: "icon.svg",
  publisher: "leadnest.ai",
  slug: "giphy",
  title: "Giphy",
  type: "giphy_other",
  url: "https://www.leadnest.ai/apps/giphy",
  variant: "other",
  extendsFeature: "EventType",
  email: "help@leadnest.ai",
  dirName: "giphy",
  isOAuth: false,
} as AppMeta;

export default metadata;
