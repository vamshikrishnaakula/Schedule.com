import { getUsersCredentialsIncludeServiceAccountKey } from "@calcom/app-store/delegationCredential";
import type { Prisma } from "@calcom/prisma/client";
import { type eventTypeLocations, userMetadata as userMetadataSchema } from "@calcom/prisma/zod-utils";
import type { z } from "zod";

import getApps, {
  getAppIdentifiers,
  getSystemDefaultConferencingApp,
  getSystemDefaultConferencingLocationType,
} from "../utils";

type EventTypeLocation = z.infer<typeof eventTypeLocations>[number];

type User = {
  id: number;
  email: string;
  metadata: Prisma.JsonValue;
};

export async function getDefaultLocations(user: User): Promise<EventTypeLocation[]> {
  const defaultConferencingData = userMetadataSchema.parse(user.metadata)?.defaultConferencingApp;
  const systemDefaultConferencingApp = getSystemDefaultConferencingApp();
  const systemDefaultLocationType = getSystemDefaultConferencingLocationType();

  if (defaultConferencingData?.appSlug) {
    // We are not returning the credential, so we are fine with the service account key
    const credentials = await getUsersCredentialsIncludeServiceAccountKey(user);

    const foundApp = getApps(credentials, true).filter((app) =>
      getAppIdentifiers(app).includes(defaultConferencingData.appSlug ?? "")
    )[0]; // There is only one possible install here so index [0] is the one we are looking for ;
    const locationType = foundApp?.locationOption?.value ?? systemDefaultLocationType;
    return [{ type: locationType, link: defaultConferencingData.appLink }];
  }

  if (systemDefaultConferencingApp?.appData?.location?.type) {
    return [{ type: systemDefaultLocationType }];
  }

  return [];
}
