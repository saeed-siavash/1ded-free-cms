# Introducing 1DED Free CMS: build a website you can own and take with you

**A free, self-hosted CMS with static publishing, 15 subject starters, eight visual themes, and an editable browser studio.**

Version 0.4.1 public beta · MIT licensed · Node.js 24+

A personal website should feel personal. A company website should be straightforward to maintain. A portfolio should leave room for the work. Yet a small website can quickly become a collection of copied headers, inconsistent menus, forgotten links, and pages that are difficult to update.

**1DED Free CMS** brings those everyday tasks into one small application. Create and organize pages in a browser, manage the shared navigation and footer, choose a starting design, then publish a complete static website. Keep the application on your own server and keep the option to export your finished website elsewhere.

The project is built around a practical idea: making a small website manageable should not require a paid CMS account, a collection of external APIs, or a build pipeline that every content editor has to understand.

> **Release status:** this is a public beta for evaluation, development, and carefully managed pilots. Production security hardening and an independent security review remain pending. Read [SECURITY.md](../SECURITY.md) before exposing an installation publicly. Screenshots show actual CMS previews with illustrative starter content, not real client businesses or verified professional claims.

## Edit in a studio. Publish a static website.

The CMS has two distinct jobs. The private administration application manages accounts, content, images, messages, and publication history. The public website consists of generated HTML, CSS, JavaScript, and referenced images.

That separation makes the publishing process easy to understand:

**Edit → save a draft → preview → publish a complete snapshot.**

Saving a page does not immediately change the public website. A publication builds a new snapshot before making it current. If generation fails, the previous published snapshot remains selected. A publication can also be rolled back without replacing the drafts you are currently editing.

For organizations that want a static delivery environment, the published website can be downloaded as a ZIP and deployed to a suitable static host. The editor still requires Node.js and persistent storage. Contact forms on an exported site need a reachable form endpoint; the static files alone cannot receive messages.

## A useful starting point for fifteen kinds of website

Choosing a template should give you more than a different accent color. Subject starters in 1DED Free CMS include page structures, relevant sections, suggested categories, and editable navigation.

The library includes **Web Hosting, Cloud Hosting, Food, Doctor, Engineer, Business Card, Biography, Resume, Music, Artist, IT, Company, Journal, Press, and Blog**.

Hosting starters include plan-comparison structures and support pages. Food includes a menu table and visiting information. Resume and biography starters include timelines. Music and artist starters make room for releases, work, events, and enquiries. Journal, press, and blog starters include categories, sample articles, and a collection section that displays matching content.

Select a subject during installation, or browse the library later. Existing-site imports are deliberately additive: choose a unique folder and add the new pages as drafts. An optional navigation group can be added at the same time. Existing pages and uploaded images are not overwritten. URL conflicts reject the import instead of silently replacing content.

The owner can review and edit the imported pages, then include them in the next publication. Example prices, dates, author names, professional details, and article text must be replaced with real information before publication.

<table>
<tr>
<td width="50%" valign="top">
<h3>Web Hosting</h3>
<a href="images/subjects/web-hosting.jpg"><img src="images/subjects/web-hosting.jpg" width="440" alt="Web Hosting subject starter screenshot"></a>
<p>6 editable pages · corporate · mega menu</p>
</td>
<td width="50%" valign="top">
<h3>Cloud Hosting</h3>
<a href="images/subjects/cloud-hosting.jpg"><img src="images/subjects/cloud-hosting.jpg" width="440" alt="Cloud Hosting subject starter screenshot"></a>
<p>6 editable pages · coast · mega menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Food</h3>
<a href="images/subjects/food.jpg"><img src="images/subjects/food.jpg" width="440" alt="Food subject starter screenshot"></a>
<p>5 editable pages · citrus · normal menu</p>
</td>
<td width="50%" valign="top">
<h3>Doctor</h3>
<a href="images/subjects/doctor.jpg"><img src="images/subjects/doctor.jpg" width="440" alt="Doctor subject starter screenshot"></a>
<p>5 editable pages · coast · normal menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Engineer</h3>
<a href="images/subjects/engineer.jpg"><img src="images/subjects/engineer.jpg" width="440" alt="Engineer subject starter screenshot"></a>
<p>5 editable pages · corporate · normal menu</p>
</td>
<td width="50%" valign="top">
<h3>Business Card</h3>
<a href="images/subjects/business-card.jpg"><img src="images/subjects/business-card.jpg" width="440" alt="Business Card subject starter screenshot"></a>
<p>1 editable pages · bloom · normal menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Biography</h3>
<a href="images/subjects/biography.jpg"><img src="images/subjects/biography.jpg" width="440" alt="Biography subject starter screenshot"></a>
<p>5 editable pages · lavender · normal menu</p>
</td>
<td width="50%" valign="top">
<h3>Resume</h3>
<a href="images/subjects/resume.jpg"><img src="images/subjects/resume.jpg" width="440" alt="Resume subject starter screenshot"></a>
<p>5 editable pages · minimal · normal menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Music</h3>
<a href="images/subjects/music.jpg"><img src="images/subjects/music.jpg" width="440" alt="Music subject starter screenshot"></a>
<p>6 editable pages · graphic · normal menu</p>
</td>
<td width="50%" valign="top">
<h3>Artist</h3>
<a href="images/subjects/artist.jpg"><img src="images/subjects/artist.jpg" width="440" alt="Artist subject starter screenshot"></a>
<p>6 editable pages · maximal · normal menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>IT</h3>
<a href="images/subjects/it.jpg"><img src="images/subjects/it.jpg" width="440" alt="IT subject starter screenshot"></a>
<p>6 editable pages · corporate · mega menu</p>
</td>
<td width="50%" valign="top">
<h3>Company</h3>
<a href="images/subjects/company.jpg"><img src="images/subjects/company.jpg" width="440" alt="Company subject starter screenshot"></a>
<p>6 editable pages · coast · mega menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Journal</h3>
<a href="images/subjects/journal.jpg"><img src="images/subjects/journal.jpg" width="440" alt="Journal subject starter screenshot"></a>
<p>7 editable pages · lavender · normal menu</p>
</td>
<td width="50%" valign="top">
<h3>Press</h3>
<a href="images/subjects/press.jpg"><img src="images/subjects/press.jpg" width="440" alt="Press subject starter screenshot"></a>
<p>8 editable pages · corporate · mega menu</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Blog</h3>
<a href="images/subjects/blog.jpg"><img src="images/subjects/blog.jpg" width="440" alt="Blog subject starter screenshot"></a>
<p>6 editable pages · bloom · normal menu</p>
</td>
<td></td>
</tr>
</table>


## Eight visual themes, independent of your content

The subject and the visual design are separate choices. A biography can use a quiet minimal theme or an expressive artistic one. A company can choose a structured corporate look or a softer coastal palette.

The eight included visual themes are **Minimal, Corporate, Graphic, Maximal, Coast, Bloom, Citrus, and Lavender**. They use local CSS, system fonts, and decorative shapes. No external font service, image CDN, tracking script, or paid design account is required.

Private theme previews use your saved content without applying the theme. When switching, you can choose the recommended accent and typography or preserve your current settings. The button text selects light or dark ink to maintain readable contrast against the configured accent.

The page editor also offers split, centered, card, resume, and editorial layouts. This gives owners control over both a site's overall appearance and the presentation of individual pages.

<table>
<tr>
<td width="50%" valign="top">
<h3>Minimal</h3>
<a href="images/themes/minimal.jpg"><img src="images/themes/minimal.jpg" width="440" alt="Minimal visual theme screenshot"></a>
<p>Quiet confidence. Room to breathe.</p>
</td>
<td width="50%" valign="top">
<h3>Corporate</h3>
<a href="images/themes/corporate.jpg"><img src="images/themes/corporate.jpg" width="440" alt="Corporate visual theme screenshot"></a>
<p>Clear, structured, ready for business.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Graphic</h3>
<a href="images/themes/graphic.jpg"><img src="images/themes/graphic.jpg" width="440" alt="Graphic visual theme screenshot"></a>
<p>Bold ideas deserve a bold canvas.</p>
</td>
<td width="50%" valign="top">
<h3>Maximal</h3>
<a href="images/themes/maximal.jpg"><img src="images/themes/maximal.jpg" width="440" alt="Maximal visual theme screenshot"></a>
<p>Texture, character, and a playful spirit.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Coast</h3>
<a href="images/themes/coast.jpg"><img src="images/themes/coast.jpg" width="440" alt="Coast visual theme screenshot"></a>
<p>Fresh sea blues, airy space, and soft geometry.</p>
</td>
<td width="50%" valign="top">
<h3>Bloom</h3>
<a href="images/themes/bloom.jpg"><img src="images/themes/bloom.jpg" width="440" alt="Bloom visual theme screenshot"></a>
<p>Warm coral, blush tones, and a friendly human touch.</p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3>Citrus</h3>
<a href="images/themes/citrus.jpg"><img src="images/themes/citrus.jpg" width="440" alt="Citrus visual theme screenshot"></a>
<p>Sunlit yellow, leafy green, and lively simple shapes.</p>
</td>
<td width="50%" valign="top">
<h3>Lavender</h3>
<a href="images/themes/lavender.jpg"><img src="images/themes/lavender.jpg" width="440" alt="Lavender visual theme screenshot"></a>
<p>Soft violet, editorial type, and a considered rhythm.</p>
</td>
</tr>
</table>


## Build pages from sections you can understand

The editor is organized around reusable section types rather than unrestricted placement on a canvas. Add a section, edit its fields, move it into position, and preview the saved result.

The twelve section types are:

- **Hero:** the main introduction and call to action.
- **Text:** paragraphs and formatted content.
- **Features:** services, benefits, skills, or other grouped information.
- **Image and gallery:** photographs, artwork, projects, or release selections.
- **Timeline:** experience, milestones, education, or a personal journey.
- **Testimonials:** owner-supplied quotations and attribution.
- **FAQ:** expandable questions and answers.
- **Call to action:** a clear next step.
- **Contact:** a general enquiry form and contact information.
- **Links:** a directory of saved resources, optionally filtered by category.
- **Collection:** matching posts, projects, services, team entries, or pages.

The formatting toolbar supports bold, italic, links, lists, quotations, code, and tables through readable Markdown. Raw HTML is escaped. This is a focused formatted-text editor rather than a full WYSIWYG HTML editor.

Page edits autosave after a short pause, and manual saving remains available. Earlier saved versions are retained in page history. Deleted content moves to recoverable trash. If another session has changed a page, revision checks reject a stale save rather than silently overwriting the newer edit.

## One place for menus, headers, and footers

Navigation is shared across the website. Owners can edit it once, save the draft settings, and publish the resulting menu everywhere.

Choose normal dropdowns or wider mega menus as the default, then override individual top-level groups when a mixed navigation makes more sense. Mega menus support two to four columns. Add headings and child links, descriptions, built-in icons, highlighted button links, new-tab behavior, and nofollow flags. Reorder or duplicate entries without editing source files.

Page and category destinations are stored as references. A menu can follow a page when its URL changes, and assigned references protect against accidental deletion. Normal and mega menus both become expandable groups on mobile. Owners can also enable a sticky header, change desktop alignment, and add the built-in search link.

![An editable three-column mega menu](coast-megamenu.jpg)

## Organize content and make useful connections

Categories and tags help organize pages and articles. Content-type filters distinguish regular pages, posts, projects, services, and team content. Category archives and a public blog index are generated from eligible published content.

Saved links provide a reusable directory for resources, partners, or internal pages. A links section can display the whole directory or one category. The internal link checker identifies missing destinations, draft references, redirects, and pages with no detected incoming links. It checks local relationships without requesting external websites.

Built-in website search uses a generated local search index. It requires no hosted search account and excludes draft pages from the public index.

## Keep images local, and keep the originals

The media library supports names, folder labels, descriptions, search, and reusable paths. Optional browser-local processing can resize supported images and create a smaller WebP copy. The original upload is preserved and remains downloadable from the image details.

That approach keeps image processing independent of an external optimization service. Owners can use their own photographs, illustrations, and artwork without adding a CDN account.

Current uploads are raster images. Multiple responsive image variants, audio uploads, and document generation are not included. Images in the library are accessible by their public URLs and should not contain confidential material.

## SEO foundations, included in the workflow

The CMS provides page titles and descriptions, canonical URLs, social metadata, sharing images, identity JSON-LD, an XML sitemap, and robots.txt output. Owners can choose which pages should be excluded from indexing.

Published URL changes create redirects. Static exports include redirect configuration examples, and the built-in server serves published redirects and proper not-found responses. Private previews require authentication and are marked noindex.

The SEO screen provides specific checks, such as missing page-specific descriptions or problematic internal links. These are useful publishing aids, not a promise of search rankings or a measured Core Web Vitals score. Original content, appropriate attribution, accessibility, and the performance of the deployed site still matter.

## General enquiries without a mandatory mail service

The contact section stores validated messages in the built-in inbox. It includes a honeypot, request limits, and rate limiting. Editors can read messages and use their own email application to reply.

Email notifications and SMTP delivery are not included in this beta. An optional external form endpoint can be configured if the owner already uses another service. Neither that integration nor any paid account is required to use the CMS itself.

The Doctor starter is a public-information website template, not a patient portal. It explicitly asks visitors not to submit confidential clinical information through the general enquiry form. Hosting starters do not provision infrastructure; Food does not supply ordering or reservation software; Music does not include streaming or ticket checkout. Those boundaries keep the included functionality clear.

## Update the application while retaining the website

Website content belongs in persistent storage, separate from replaceable application files. 1DED Free CMS keeps the database, uploads, and published snapshots in its data directory. Docker deployments retain that data in a named volume.

The offline updater reads a downloaded release ZIP, checks its manifest and version compatibility, creates a recovery copy of the current application and data, and replaces application files. It does not copy an installation's database or images from the release package. Configuration in `.env` is preserved.

Database migrations create a safety backup before applying transactional changes. Full backups can be downloaded through the admin or created from the console. The restore command validates a full backup, saves a safety copy of the existing data, and stages restoration before switching directories.

```sh
# Stop the CMS and keep the same DATA_DIR before update or restore.
node cli.mjs update /path/to/new-release.zip
node cli.mjs backup /path/to/new-backup-folder
node cli.mjs restore /path/to/full-backup.zip
```

Backups are sensitive and should be stored privately, with a separate copy away from the installation. Hash manifests detect corruption; signed release authentication is still planned. Follow the [upgrade guide](UPGRADING.md), verify release checksums through the trusted repository, and retain recovery copies until an update is verified.

## A small installation, with explicit requirements

The application uses Node.js 24 or newer and its built-in SQLite support. There is no npm dependency installation or frontend build step required to start it.

```sh
git clone https://github.com/saeed-siavash/1ded-free-cms.git
cd 1ded-free-cms
node server.mjs
```

Open `http://127.0.0.1:3000/admin/`, enter the installation token printed in the server terminal, and create the owner account. Choose a subject starter, review the content, and publish when ready. There are no bundled owner credentials.

Docker configuration is included. A public installation needs appropriate HTTPS, secure-cookie and public-origin settings, persistent disk storage, and a suitable reverse proxy. The CMS cannot run on PHP-only hosting or a static-only host, although its exported website can run on compatible static hosting. Root-domain deployments are supported; subdirectory hosting is not currently supported.

## Security, testing, and the path toward a stable release

Current safeguards include salted password hashing, random session tokens stored as hashes, HttpOnly/SameSite cookies, CSRF and origin checks on administrative writes, server-enforced owner/editor permissions, and session revocation after password changes. The application validates structured content, escapes rendered text, restricts accepted URLs, and limits supported upload types.

Those controls are a foundation, not a certification. Important work remains: MFA, stronger explicit password-hashing parameters, signed releases, persistent abuse controls, deeper server-side image validation, bounded large-download handling, and more comprehensive interruption recovery. Independent security review is pending.

The automated suite exercises content validation, roles, authentication flows, draft isolation, static publishing, rollback, forms, redirects, exports, backup restoration, legacy data migration, update preservation, template imports, preview privacy, and the public asset budget. Eighteen tests passed during preparation of this release. Docker and broad production deployment testing remain separate work.

## Try it, make it yours, and help improve it

1DED Free CMS is for people who want a manageable website and control over its content, hosting, and future. Start with a subject pack, choose a visual direction, edit the sections, and keep the option to export the result.

The project is released under the MIT license. Explore the source, evaluate the beta with a disposable installation, report reproducible issues, and contribute improvements. Developers can extend the structured section model, starter library, and themes while preserving the clear boundary between application code and website data.

**Small by design. Yours by default.**

[Get the project](https://github.com/saeed-siavash/1ded-free-cms) · [Download a release](https://github.com/saeed-siavash/1ded-free-cms/releases) · [Installation and user guide](USER-GUIDE.md) · [Security status](../SECURITY.md)
