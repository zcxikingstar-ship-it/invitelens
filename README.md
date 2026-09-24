# InviteLens

**A local preflight for `.ics` calendar invitations before you import them into Google Calendar, Outlook, or Apple Calendar.**

InviteLens reads an iCalendar file in your browser and shows its event count, raw time style, recurrence, alarm triggers, external links, organizer, and missing end times. It has no account, calendar permission, upload, API key, or network request.

## Why

An `.ics` file can create an event, a repeating series, reminders, and links with a single import. Calendar clients are built to import; iCalendar libraries are built to parse. InviteLens is the visible local checkpoint in between: inspect the raw structure first, then decide whether to import.

## Use

Open the [live app](https://zcxikingstar-ship-it.github.io/invitelens/) or clone this repository and open `index.html` in a modern browser.

1. Drop an `.ics` file or paste iCalendar text.
2. Select **Inspect invite**.
3. Review every item, especially floating times, recurrences, alarms, and external links.
4. Keep the original file and import it only when appropriate.

## Scope and limits

- Parsing is local and deterministic; it does not authenticate organizers or validate URLs.
- It reports raw time values and whether they are all-day, UTC, TZID-tagged, or floating. It does not convert times between zones.
- It is a structural review, not a universal iCalendar validator or a calendar-service integration.
- It never imports, edits, sends, or subscribes to a calendar.

## Development

The app has no runtime dependencies. Node.js 20+ is needed only for checks.

```sh
npm run check
npm test
```

## Security

Review source before using this tool in a sensitive workflow. Report vulnerabilities through GitHub Security Advisories, without putting private calendar data in a public issue.

## License

[MIT](LICENSE).
