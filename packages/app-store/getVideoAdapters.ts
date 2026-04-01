import { appStoreMetadata } from "@calcom/app-store/appStoreMetaData";
import { doesAppIdMatch } from "@calcom/app-store/utils";
import { VideoApiAdapterMap } from "@calcom/app-store/video.adapters.generated";
import logger from "@calcom/lib/logger";
import { getPiiFreeCredential } from "@calcom/lib/piiFreeData";
import { safeStringify } from "@calcom/lib/safeStringify";
import type { CredentialPayload } from "@calcom/types/Credential";
import type { VideoApiAdapter, VideoApiAdapterFactory } from "@calcom/types/VideoApiAdapter";

const log = logger.getSubLogger({ prefix: ["[app-store] getVideoAdapters"] });

const getVideoAdapterImportForCredential = (cred: CredentialPayload) => {
  const appName = cred.type.split("_").join("");
  const appTypeVariant = cred.type.substring(0, cred.type.lastIndexOf("_"));
  const matchedAppStoreEntryByAppId = cred.appId
    ? Object.entries(appStoreMetadata).find(([, appMetadata]) => doesAppIdMatch(appMetadata, cred.appId))
    : undefined;
  const matchedAppStoreEntryByType = Object.entries(appStoreMetadata).find(
    ([, appMetadata]) => appMetadata.type === cred.type
  );
  const matchedAppStoreEntry = matchedAppStoreEntryByAppId ?? matchedAppStoreEntryByType;

  return (
    VideoApiAdapterMap[appName as keyof typeof VideoApiAdapterMap] ||
    VideoApiAdapterMap[appTypeVariant as keyof typeof VideoApiAdapterMap] ||
    (matchedAppStoreEntry
      ? VideoApiAdapterMap[matchedAppStoreEntry[0] as keyof typeof VideoApiAdapterMap]
      : undefined)
  );
};

// factory
export const getVideoAdapters = async (withCredentials: CredentialPayload[]): Promise<VideoApiAdapter[]> => {
  const videoAdapters: VideoApiAdapter[] = [];

  for (const cred of withCredentials) {
    const appName = cred.type.split("_").join(""); // Transform `zoom_video` to `zoomvideo`;
    log.silly("Getting video adapter for", safeStringify({ appName, cred: getPiiFreeCredential(cred) }));

    const videoAdapterImport = getVideoAdapterImportForCredential(cred);

    if (!videoAdapterImport) {
      log.error(`Couldn't get adapter for ${appName}`, safeStringify({ appId: cred.appId, type: cred.type }));
      continue;
    }

    const videoAdapterModule = await videoAdapterImport;
    const makeVideoApiAdapter = videoAdapterModule.default as VideoApiAdapterFactory;

    if (makeVideoApiAdapter) {
      const videoAdapter = makeVideoApiAdapter(cred);
      videoAdapters.push(videoAdapter);
    } else {
      log.error(`App ${appName} doesn't have a default VideoApiAdapter export`);
    }
  }

  return videoAdapters;
};
