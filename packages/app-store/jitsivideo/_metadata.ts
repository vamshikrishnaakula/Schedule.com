import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Leadnest Video",
  description: _package.description,
  installed: true,
  type: "leadnest_video",
  variant: "conferencing",
  categories: ["conferencing"],
  logo: "https://meet.leadnest.ai/custom/favicon.svg",
  publisher: "leadnest.ai",
  url: "https://meet.leadnest.ai/",
  slug: "jitsi",
  title: "Leadnest Meet",
  isGlobal: false,
  email: "support@leadnest.ai",
  appData: {
    location: {
      linkType: "dynamic",
      type: "integrations:leadnestvideo",
      label: "Leadnest Video",
    },
  },
  dirName: "leadnestvideo",
  concurrentMeetings: true,
  isOAuth: false,
  defaultVideo: true,
} as AppMeta;

export default metadata;
