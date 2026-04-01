import type { AppListCardProps } from "@calcom/ui/components/app-list-card";
import { AppListCard } from "@calcom/ui/components/app-list-card";

export default function AppListCardPlatformWrapper(props: AppListCardProps) {
  const logo = `https://www.leadnest.ai${props.logo}`;
  return <AppListCard {...props} logo={logo} />;
}
