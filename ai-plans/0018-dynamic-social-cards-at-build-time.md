# 0018 Dynamic Social Cards at Build Time

## Rationale

Social cards (Open Graph images) are essential for link previews on social media and messaging platforms. Currently, the site uses a single default social card for all pages. This plan introduces dynamic generation of social cards at build time, creating unique, visually appealing images for each blog post and event based on their metadata (title, date, tags, event type). This improves social sharing engagement without requiring manual image creation for each piece of content.

## Acceptance Criteria

- [ ] A new build script generates social card images for all blog posts and events
- [ ] Generated images follow Open Graph recommended dimensions (1200×630)
- [ ] Each card displays the page title prominently, with optional metadata (date, tags, event type)
- [ ] The visual design is consistent with the "Kenny Codes" branding (colors, fonts, logo)
- [ ] Generated images are saved to `static/img/social-cards/` with predictable file names based on the slug
- [ ] Generated images are committed to git for reproducible deploys and visual review
- [ ] The script automatically updates frontmatter to include the `image` field pointing to the generated card
- [ ] The generation script integrates into the existing build pipeline (via `prebuild` hook)
- [ ] Pages can opt-out by specifying a custom `image` in their frontmatter (script skips these)
- [ ] Long titles are handled automatically via text wrapping and dynamic font scaling
- [ ] Users can optionally specify a `socialTitle` frontmatter field to override the title for social cards
- [ ] The script is idempotent: re-running it produces the same output for unchanged content
- [ ] Build performance remains acceptable (generation should not add excessive build time)

## Technical Details

### Technology Choice

Use a **composite approach** combining a base template image with dynamic text overlay:

- **sharp** - For image compositing (loading base template, overlaying text layer, outputting final PNG)
- **Satori** (by Vercel) - For rendering dynamic text to SVG, which is then composited onto the base image

This approach is:
- Fast and lightweight (no headless browser)
- Preserves complex visual elements (photo) that are hard to recreate programmatically
- Easy to update the design (just swap the template image)
- Maintains visual consistency with existing branding

### Base Template Image

A base template image (`static/img/social-card-template.png`) will be provided containing:
- The photo on the right side
- Dark background on the left side
- **No logo** and **no "kenny-codes.net" label** (these will be rendered dynamically)

The dynamic text overlay will be composited on top of this base image.

### Script Architecture

Create a new script `scripts/generate-social-cards.ts` following the pattern established by `generate-home-data.ts`:

```
scripts/
  generate-social-cards.ts    # Main generation script
  social-card-template.tsx    # JSX template for the text overlay
```

**Key components:**

1. **Content Discovery** - Reuse the file traversal logic from `generate-home-data.ts` to find all blog posts and events with their frontmatter.

2. **Text Overlay Rendering** - A JSX component (compatible with Satori) that renders the dynamic content for the left side of the card:
   - "Kenny Codes" logo from `static/img/logo-dark.svg` (small, top-left corner)
   - Title text (scaled/truncated to fit)
   - Date and content type indicator (e.g., "Blog" or "Workshop")
   - "kenny-codes.net" label at the bottom

3. **Image Compositing** - For each content item:
   - Load the base template image via sharp
   - Render the text overlay via Satori to PNG
   - Composite the text layer onto the base image
   - Save to `static/img/social-cards/{slug}.png`

4. **Frontmatter Update** - Modify the source markdown files to add the `image` field pointing to the generated card.

### Title Handling

The script uses a **hybrid approach** for handling titles:

**Automatic handling (primary):**
- Smart text wrapping - Break titles into multiple lines (2-3 lines maximum)
- Dynamic font scaling - Reduce font size for longer titles to maintain readability
- Truncation as last resort - If title is extremely long, truncate with ellipsis

**Optional override (fallback):**
- Users can specify a `socialTitle` field in frontmatter for a custom, shorter version
- Example:
  ```markdown
  ---
  title: "How to async – async await Internals and Expert Knowledge for Scalable .NET Apps"
  socialTitle: "async/await Internals for Scalable .NET"
  ---
  ```
- Use cases: auto-generated layout doesn't look good, desire for punchier social sharing text, or formatting issues

This ensures 99% of posts work automatically while providing an escape hatch for edge cases.

### Integration Approach

The script runs in `prebuild` and generates images, then modifies frontmatter in-place (adds `image: /img/social-cards/{slug}.png`). Generated images are committed to git for reproducible deploys and visual review. This approach is simple, works with standard Docusaurus, and makes the social cards explicit and reviewable in the repository. The trade-off is that source files are modified, requiring careful git handling.

### Font Handling

Satori requires font files to be loaded explicitly. Include at least:
- A primary font for titles (e.g., Inter, Roboto, or a brand font)
- Consider hosting fonts in `static/fonts/` or loading from Google Fonts at build time

### Package Dependencies

Add to `devDependencies`:
- `satori` - JSX to SVG conversion
- `sharp` - Image compositing and SVG to PNG conversion

### Build Pipeline Integration

Update `package.json`:
```json
{
  "scripts": {
    "generate-social-cards": "tsx scripts/generate-social-cards.ts",
    "prebuild": "npm run generate-home-data && npm run generate-social-cards"
  }
}
```

### Performance Considerations

- Cache generated images by comparing content hash (title + date) with a manifest file
- Only regenerate cards when content changes
- Consider parallelizing generation using `Promise.all` with concurrency limits

### File Naming Convention

Use the content slug directly: `static/img/social-cards/{slug}.png`

For example:
- `2025-05-05-adc-async-await-workshop.png`
- `2015-06-05-watch-my-new-video-series-on-test-driven-development.png`

### Edge Cases

- **Long titles** - Implement text truncation or dynamic font scaling
- **Missing metadata** - Gracefully handle posts without all expected fields
- **Existing custom images** - Skip generation if `image` frontmatter is already set
- **Non-ASCII characters** - Ensure font supports required character sets
