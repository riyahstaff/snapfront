// Web version of release-info.ts: the website has no installed app version to show.
export const RELEASE_NAME = "New UGC lesson · founding Lifetime · cleaner home";

export function installedRelease() {
  return { version: null as string | null, build: null as string | null, packageId: null as string | null, label: "Snapfront for web", release: RELEASE_NAME };
}
