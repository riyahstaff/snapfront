import * as Application from "expo-application";

export const RELEASE_NAME = "Bonus: 1k Prompts · Help & FAQ · easier photo cleanup";

/** Native values identify the binary actually installed, not a Play Console track or JS config. */
export function installedRelease() {
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;
  return {
    version,
    build,
    packageId: Application.applicationId,
    label: version && build ? `Snapfront ${version} · Build ${build}` : "Snapfront · Development preview",
    release: RELEASE_NAME,
  };
}
