# Snapfront Community

A members' community built into Snapfront (web and Android app), in the spirit of Skool. It replaces
the need for a separate Skool or Discord subscription; the Discord/Whop links and live-coaching line in
the admin settings still show in the sidebar if they're set.

## What members get

- **Feed** with categories: Announcements (Snapfront only), General, Wins, Questions, Review my store,
  Tips & resources. Sort by latest activity, new or top. Posts can have one photo.
- **Comments with replies** (one level), likes on posts and comments.
- **Points and levels.** One point per like received. Nine levels: Newcomer (0), Starter (5),
  Seller (20), Hustler (65), Builder (155), Rainmaker (515), Mogul (2,015), Legend (8,015), Icon (33,015).
- **Leaderboards** for 7 days, 30 days and all time.
- **Members** list with a chosen display name, short bio, level and a link to their store. Emails are
  never shown.
- **Calendar** of live calls. Only members see the join link.
- **Notifications** (bell) for comments, replies and likes. Opening a post marks its notifications read.

## Who can do what

| | Free account | Member (paid plan) | Owner (OWNER_EMAILS) |
|---|---|---|---|
| Read the feed, members, leaderboard, calendar | ✓ | ✓ | ✓ |
| Post, comment, like, report | | ✓ | ✓ |
| Post announcements, pin, remove anything | | | ✓ |
| Pause someone's posting, see reports | | | ✓ |
| Add or remove calendar events | | | ✓ |

Limits: 10 posts and 120 comments per account per day; titles 140 characters, posts 5,000, comments 2,000.
Names that look like staff titles ("Snapfront Support", "Admin", "Moderator") are refused for non-owners.

## Running it

- Owner tools are inside the Community screen: **Pin/Unpin** and **Remove** on any post, **Pause posting**
  in Members, a **Reported** panel at the top of the feed, and **Add an event** in Calendar (date and time
  are entered in your own time zone).
- Code: `server/src/community-feed.js` (tables `community_*`), routes under `/api/community/*` in
  `server/src/index.js`, screens `mobile/src/app/community.tsx` and `mobile/src/app/community-post/[id].tsx`.
- Tests: `server/test/community-feed.test.js`.
