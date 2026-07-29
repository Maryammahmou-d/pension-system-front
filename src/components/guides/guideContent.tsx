import type { GuideSection } from '../UserGuide';

/* Page-specific user-guide content. Kept deliberately short. */

const IMG = '/user-guide';

export const dashboardGuide: GuideSection[] = [
  {
    title: 'Dashboard',
    image: `${IMG}/Dashboard.png`,
    body: (
      <>
        <h4>Stat cards</h4>
        <ul>
          <li><strong>Screening Records</strong> — total records across all active lists.</li>
          <li><strong>Class A Flags</strong> — high-confidence matches (ID match).</li>
          <li><strong>Class D Flags</strong> — fuzzy / name-only matches to review.</li>
          <li><strong>Terrorism List</strong> / <strong>Prosecution List</strong> — active version + record count.</li>
        </ul>

        <h4>Recent Flags</h4>
        <p>Latest match hits. <strong>Policy / Source</strong> shows the policy number when the flag came from a policy screening, otherwise the source category. <strong>Checked By</strong> is the user who ran the screening.</p>

        <h4>Latest List Versions</h4>
        <p>The most recent uploads for each list type. Click <em>Manage</em> to jump to List Management.</p>
      </>
    ),
  },
];

export const amlCheckGuide: GuideSection[] = [
  {
    title: 'Run a check',
    image: `${IMG}/AML Check.png`,
    body: (
      <>
        <h4>Purpose</h4>
        <p>Screen a single person or company against every active sanction list.</p>

        <h4>Fields (all optional — fill at least one)</h4>
        <ul>
          <li><strong>Full Name</strong> — Arabic or transliterated.</li>
          <li><strong>National ID</strong> — for individuals.</li>
          <li><strong>Passport ID</strong> — for non-residents.</li>
          <li><strong>Commercial Registry</strong> — for companies.</li>
          <li><strong>Policy No.</strong> — optional. Stored on any flag so the result can later be traced back to a policy.</li>
        </ul>
        <p>The more identifiers you provide, the higher the chance of an ID match (Class A) instead of a name match (Class D).</p>
      </>
    ),
  },
  {
    title: 'Reading the result',
    image: `${IMG}/AML Check Result.png`,
    body: (
      <>
        <h4>Status</h4>
        <p><strong>CLEAR</strong> — no match. <strong>FLAGGED</strong> — at least one match, review the match cards.</p>

        <h4>Match cards</h4>
        <ul>
          <li><strong>List type</strong> — <code>TERRORISM</code> or <code>PROSECUTION</code>.</li>
          <li><strong>Class A</strong> — ID match (the person's ID is present on the AML list). Highest confidence.</li>
          <li><strong>Class D</strong> — name match only: either the full name matches, or up to 4 name parts match, and the person has <em>no ID on record</em> in the AML list. Review before acting.</li>
          <li><strong>Score</strong> — fuzzy similarity 0-100.</li>
          <li>Expand <em>Record Details</em> to see the full source-list row.</li>
        </ul>
      </>
    ),
  },
];

export const policyScreeningGuide: GuideSection[] = [
  {
    title: 'Policy Screening',
    image: `${IMG}/Policy Screening Example.png`,
    body: (
      <>
        <h4>Purpose</h4>
        <p>Screen every insured person on a policy at once by uploading the roster as an Excel sheet.</p>

        <h4>Volume mode</h4>
        <ul>
          <li><strong>Standard</strong> — up to 50 000 persons. Synchronous; result appears when it finishes.</li>
          <li><strong>Large volume</strong> — up to 600 000 persons. Queued; poll the job status.</li>
        </ul>

        <h4>Steps</h4>
        <ul>
          <li>Drag-drop (or click to browse) an <code>.xlsx</code> / <code>.xls</code> file. Only the header row + row count are read up-front, so huge files stay responsive.</li>
          <li>Map the columns: <strong>Name</strong> (required), <strong>ID number</strong> (optional but reduces false positives), <strong>ID type</strong> (optional). Common headers are auto-detected.</li>
          <li>Enter a <strong>Policy No.</strong> (optional) — it's attached to every flag produced by this run, so the result can be filtered by policy later.</li>
          <li>Click <strong>Run screening</strong> / <strong>Queue screening job</strong>. Flagged persons appear as expandable rows with their match details.</li>
        </ul>
      </>
    ),
  },
];

export const listManagementGuide: GuideSection[] = [
  {
    title: 'View & manage',
    image: `${IMG}/List Managment View.png`,
    body: (
      <>
        <h4>Purpose</h4>
        <p>Browse the current version of each sanction list, filter records, and drill into per-record flag history.</p>

        <h4>How to use it</h4>
        <ul>
          <li>Switch between <strong>Terrorism</strong> and <strong>Prosecution</strong> at the top.</li>
          <li>Filter by <strong>Flagged Only</strong> to focus on Flagged hits.</li>
          <li>Click any row's edit button to expand the full record's details</li>
          <li>Use <strong>Add record</strong> to insert a record manually, or <strong>Edit</strong> on a row to update one.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Upload a new version',
    image: `${IMG}/List Upload Example.png`,
    body: (
      <>
        <h4>File format</h4>
        <p>Upload the official published Excel file. It must contain the <strong>two list sheets</strong> (Terrorism and Prosecution) in the same workbook — nothing else should be uploaded separately.</p>
        <p>The system detects each list first by <strong>sheet name</strong> (Arabic keywords like "ارهابيين" / "النائب العام"), and falls back to scanning the <strong>column headers</strong> if the sheet has been renamed.</p>

        <h4>Two-step flow: Analyze → Commit</h4>
        <p>After picking a file and choosing a mode, click <strong>Analyze</strong>. The system parses the workbook and compares every row against the current active list <em>before</em> anything is saved.</p>
        <ul>
          <li><strong>Replace</strong> — archives the current list and creates a new version from the file.</li>
          <li><strong>Merge</strong> — appends only genuinely new rows to the current active list. No new version is created.</li>
        </ul>
        <p>The preview shows per-sheet stats: total new rows, how many are <strong>identical</strong> to the current list, how many of those identical rows carry <strong>flag history</strong>, and how many will actually be inserted.</p>

        <h4>Keep flagged history?</h4>
        <p>When using <strong>Replace</strong>, if any identical records were previously flagged in screenings, you will be asked whether to migrate their flag history onto the new version:</p>
        <ul>
          <li><strong>Yes</strong> — flags are repointed to the new records so they continue to show as flagged in the new active list.</li>
          <li><strong>No</strong> — flags stay only on the archived version; the new list appears clear for those records.</li>
        </ul>

        <h4>What happens after commit</h4>
        <ul>
          <li>A <code>LIST_UPLOAD</code> entry is added to the audit log.</li>
          <li>Previous versions are always preserved and can be viewed under <strong>Audit &amp; Archives ▸ Archived Lists</strong>.</li>
        </ul>
        <p>Records can also be added or edited manually from the list view if you need a one-off change outside a full re-upload.</p>
      </>
    ),
  },
];

export const auditLogGuide: GuideSection[] = [
  {
    title: 'Audit Events',
    image: `${IMG}/Audit Log - Audit Events.png`,
    body: (
      <>
        <h4>What it is</h4>
        <p>Chronological log of every system action: AML checks, batch runs, list uploads, overrides, user changes, logins.</p>

        <h4>Filters</h4>
        <ul>
          <li><strong>Action type</strong>, <strong>Result</strong>, and <strong>Date range</strong>.</li>
        </ul>
        <p>Click a row to expand the full request payload. Use <strong>Export</strong> (top right) to download the currently filtered events as Excel.</p>
      </>
    ),
  },
  {
    title: 'Flagged Records',
    image: `${IMG}/Audit Log - Flagged Records.png`,
    body: (
      <>
        <h4>What it is</h4>
        <p>Every match hit ever produced — one row per flagged person/record pair.</p>

        <h4>Filters</h4>
        <ul>
          <li><strong>Source</strong> — Policy Screening or Individual Check.</li>
          <li><strong>Match class</strong> — A (ID match) or D (name match only).</li>
        </ul>
        <p><strong>Policy / Source</strong> shows the policy number when present. <strong>Checked By</strong> shows who ran the screening. <strong>Export</strong> downloads every row matching the current filters.</p>
      </>
    ),
  },
  {
    title: 'Archived Lists',
    image: `${IMG}/Audit Log - Archieved Lists.png`,
    body: (
      <>
        <h4>What it is</h4>
        <p>Every previous version of every sanction list, archived automatically on upload. Read-only.</p>

        <h4>How to use it</h4>
        <ul>
          <li>Pick list type and version to see that frozen snapshot.</li>
          <li>Use it to prove which records were on the list at the time of a historical check.</li>
        </ul>
      </>
    ),
  },
];
