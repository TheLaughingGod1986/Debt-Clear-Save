# Public Pages

Static HTML for the URLs Apple requires before App Review:

| File | Purpose | App Store field |
|---|---|---|
| `privacy.html` | Privacy policy (on-device storage explained) | Privacy Policy URL |
| `support.html` | Help + contact email | Support URL |
| `terms.html` | Terms of use + financial disclaimer | (linked from privacy + support) |
| `index.html` | Tiny landing page linking the three above | optional Marketing URL |
| `style.css` | Shared styles — mirrors the app's design tokens | — |

All four pages are mobile-first responsive, framework-free, accessible, and weigh under 6 KB each. They share a single stylesheet so they look identical and are quick to update.

---

## Publishing with GitHub Pages

The whole `docs/` folder is already part of the main repo. GitHub Pages can serve straight from it — no extra branches needed.

### One-off setup

1. Open <https://github.com/TheLaughingGod1986/Debt-Clear-Save/settings/pages> in a browser.
2. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
3. Click **Save**.
4. Wait ~1–2 minutes for the first deploy. GitHub will show the live URL banner at the top of the same Pages settings page when it's ready.

### Resulting URLs (use these in App Store Connect)

```
https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/privacy.html
https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/support.html
https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/terms.html
https://thelaughinggod1986.github.io/Debt-Clear-Save/public-pages/
```

GitHub Pages serves `index.html` automatically when you hit a folder URL, so the last one shows the landing page.

### Verifying

After GitHub finishes the deploy, open each URL in Safari on your iPhone and confirm:
- The page renders without horizontal scroll
- The header brand mark, nav, footer all look right
- Every internal link works
- The contact email link opens the Mail composer

If anything looks off, edit the file in this folder, commit + push, and GitHub will redeploy automatically within a couple of minutes.

---

## Before you submit to Apple — update the placeholders

Two strings need a real value:

1. **Contact email:** every page links to `support@example.com`. Either:
   - Replace globally with your real address:
     ```bash
     cd docs/public-pages
     sed -i '' 's/support@example.com/<your real address>/g' *.html
     ```
   - Or set up a forwarding alias (e.g. `support@<your-domain>` → your inbox) so the email on the public web isn't your personal one.

2. **The "last updated" date** on each page. Currently `29 May 2026` (the build date). Bump it whenever you make a substantive edit, especially before cloud sync ships.

---

## Custom domain (optional, post-launch)

`*.github.io` URLs are perfectly fine for App Store submission. If later you want a friendlier domain (e.g. `debtfreedom.app/privacy`):

1. Buy the domain (Namecheap, Cloudflare Registrar, etc.)
2. Add a `CNAME` file in `docs/` containing just the domain
3. Configure DNS per <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site>
4. Update the URLs in App Store Connect

Not needed for v1.0.

---

## Why static HTML, not Markdown?

These pages are referenced from App Store Connect by exact URL. GitHub renders `.md` files as Markdown previews with their own header/nav UI, which Apple's reviewer may flag as "not a real privacy policy". Plain `.html` removes that doubt — Apple sees a clean, branded, mobile-friendly page that does nothing but display the policy text.
