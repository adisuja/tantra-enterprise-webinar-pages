# Your LinkedIn Rebrand: Step by Step

Everything you need is in the team pack: https://adisuja.github.io/tantra-enterprise-webinar-pages/linkedin-profiles/v2/

Find your name there. Your cover, your photo and every field (headline, About, role, skills) are in your section. Two ways to apply it: let Claude Code do it on your laptop (about 20 minutes, mostly waiting), or do it by hand (about 30 minutes).

| Person | Key | Headline starts with | Profile |
| --- | --- | --- | --- |
| Bhaskar | bhaskar | Leading marketing & product @ Tantra | https://www.linkedin.com/in/bhaskar-dev/ |
| Aquila | aquila | Leading automations @ Tantra | https://www.linkedin.com/in/aquilaeldho/ |
| Bharath | bharath | Leading development @ Tantra | https://www.linkedin.com/in/bkp31415/ |
| Ben | ben | Leading development @ Tantra | https://www.linkedin.com/in/ben-basil-tomy-5533b9218/ |
| Nelbin | nelbin | Leading marketing ops @ Tantra | https://www.linkedin.com/in/nelbin-xav/ |

The role title on your Tantra experience entry is the same words without " @ Tantra".

## Option 1: Claude Code Does It

You need: Chrome signed in to your own LinkedIn, Node.js 20 or newer, and Claude Code.

1. Open Terminal and make a folder: `mkdir -p ~/linkedin-rebrand && cd ~/linkedin-rebrand`
2. Start Claude Code there: `claude`
3. Paste the prompt below. Put your key from the table in the first line.
4. Stay near your laptop. Claude stops and asks you whenever LinkedIn wants a password, a code or a security check, and when Chrome needs a click from you (installing the OpenCLI extension). Never give Claude your password; type it yourself in Chrome.
5. When it finishes, it shows you a table of every field and a screenshot of your profile. Send the screenshot to Adi.

## Option 2: By Hand

Do these in order on https://www.linkedin.com/in/me/ and check each one on your profile after saving.

1. **Cover**: click the pencil on your cover, Edit cover image, Upload single photo, pick `<key>-cover-1584x396@2x.png` from your section, Save changes.
2. **Photo**: click your photo, Edit or Add photo, Upload photo, pick `<key>-photo-1200.png`, Save.
3. **Headline**: pencil next to your name, paste your headline, Save. Leave "notify network" off.
4. **About**: pencil on About, replace the text with yours, then under Skills add your five top skills (pick each from the list LinkedIn shows; if one is missing, take the closest one listed), Save.
5. **Current role**: Experience, pencil on your current role. Title: your title from the table in the pack. Company: type Tantra and pick the page with the circuit tree logo from the dropdown (never free text). Paste your role description, add the same five skills, Save. Do not tick "End current position" on anything else.
6. **Contact info**: Contact info, Edit contact info. Add the two website links from the Links table in your section (workshop as Company, consultation as Other). Remove growthclub.org and any old booking links (anything other than crm.usetantra.com). Save.
7. **Featured**: Featured, the + menu, Add a link. Paste the Featured 2 "Lands on" link from the Links table in your section, wait up to a minute for the preview, set the title and description, Choose thumbnail, pick `featured-consultation-1200x627.png`, Save. Then do the same for the Featured 1 "Lands on" link (jointantra.com) with `featured-workshop-1200x627.png` (the item added last shows first, so the workshop ends up on top). Remove old GrowthClub or Oiti items.

## The Prompt for Claude Code

```text
My key is: ____ (one of bhaskar, aquila, bharath, ben, nelbin)

Rebrand my own LinkedIn profile for Tantra, end to end, in my signed-in Chrome, using OpenCLI. Everything you need is public:
- Team pack (my fields, images, every rule): https://adisuja.github.io/tantra-enterprise-webinar-pages/linkedin-profiles/v2/
- Spec as markdown: https://adisuja.github.io/tantra-enterprise-webinar-pages/linkedin-profiles/v2/PROFILE_SPEC.md
- Upload helper: https://adisuja.github.io/tantra-enterprise-webinar-pages/linkedin-profiles/v2/li-upload.sh
- Images: https://adisuja.github.io/tantra-enterprise-webinar-pages/linkedin-profiles/v2/assets/<key>-cover-1584x396@2x.png, <key>-photo-1200.png, featured-consultation-1200x627.png, featured-workshop-1200x627.png

Hard rules:
- Never type, ask for or store my password, codes or cookies. If LinkedIn or Chrome asks for a password, a code or a security check, stop and tell me exactly what to do in Chrome, then wait.
- Only edit my own profile, only the fields below. Never post, message, connect, endorse or follow anyone. Never tick "notify network". Never end another position.
- Before overwriting a field, save its old value to ./backup/ so it can be restored.
- No em dashes or en dashes in anything you type into LinkedIn.
- Keep the Chrome window with the LinkedIn tab visible and in front while you work (not minimised, not on another desktop or fullscreen space). OpenCLI's real clicks fail with "Native input requires a visible browser page" otherwise, and LinkedIn does not render Featured or menus in background tabs. If that happens, ask me to bring Chrome to the front.

Step 0, setup (fix anything missing yourself, ask me only for clicks only I can do):
1. node --version must be 20 or newer. Then: npm install -g @jackwener/opencli@latest and opencli --version (2.0.3 or newer).
2. opencli doctor. It must show daemonRunning true and extensionConnected true.
   - If the extension is not installed: download the latest extension zip from https://github.com/jackwener/opencli/releases into a new empty folder ~/opencli-extension and unzip it there. Then tell me to open chrome://extensions in Chrome, turn on Developer mode (top right), click Load unpacked and pick ~/opencli-extension. Wait for me, then run opencli doctor again.
   - If it says the extension is not connected: opencli daemon restart, tell me to click the reload icon on the OpenCLI card in chrome://extensions, run doctor again.
   - If doctor says several browser profiles are connected: run opencli profile list, then for each run opencli --profile <id> linkedin whoami, and opencli profile use <id> for the one that returns my name.
3. opencli linkedin whoami must return my name. If it says signed out, ask me to sign in to LinkedIn in Chrome myself.
4. Download my files with curl into ./assets/ (spec, helper, my cover @2x, my photo, both Featured images). chmod +x li-upload.sh.
5. From PROFILE_SPEC.md, read the section for my name and the "Shared by All Six Profiles" section: headline, About, title, role description, five skills, Featured text, and my "Links" table. Every link I add comes from that table: use the short go.usetantra.com link everywhere (About, role, websites, role media) except the two Featured items, which use their "Lands on" link. Never change or drop the UTM parameters.

Step 1, audit (read only): opencli linkedin profile-read --profile-url <my profile URL> -f json > backup/before.json and profile-experience the same way. Show me a short table: field, now, will become.

Step 2, edits. Use one browser session, for example --session me. Work through these, and after EACH save reload the profile and confirm the new value is really on the page before moving on:
a. Headline: open https://www.linkedin.com/in/me/edit/intro/ . The headline is a contenteditable with aria-label "Headline": opencli browser fill --session me '[contenteditable=true][aria-label="Headline"]' "<headline>". Click Save.
b. About and top skills: the About form is at https://www.linkedin.com/in/<slug>/edit/forms/summary/new/ (get the exact link from the profile page: the element with aria-label "Edit about"). Fill the contenteditable with aria-label "About". fill may report value_mismatch only because LinkedIn shows paragraph breaks as extra blank lines; check the text, then Save. For skills: click Add skill, fill the input whose placeholder starts with "Skill", wait 3 seconds, click the [role=option] whose first line equals the skill exactly. Typeahead lags: never click the first option blindly. If a skill does not exist, use the closest real one LinkedIn lists and tell me which.
c. Cover: on the profile click [aria-label="Edit background image"], then in the menu click "Edit cover image" by its ref from opencli browser state (a JS click does not work there), then click the "Change photo" ref. In the "Add a cover image" dialog run ./li-upload.sh me --catch, click the button "Upload single photo", then ./li-upload.sh me assets/<key>-cover-1584x396@2x.png. Do not use opencli browser upload on LinkedIn: it fails with "Not allowed". Check the preview, click "Save changes".
d. Photo: click my photo on the profile, find the change or upload photo button, run --catch, click it, upload assets/<key>-photo-1200.png the same way, keep it centred with no zoom, Save.
e. Contact info: open https://www.linkedin.com/in/<slug>/overlay/contact-info/ and click the link "Edit contact info" (it opens /edit/forms/contact-info/new/). Set the two websites from my Links table (workshop as Company, consultation as Other), remove growthclub.org and any old booking links (anything other than crm.usetantra.com), Save.
f. Current role: open https://www.linkedin.com/in/<slug>/details/experience/ and use the "Edit <title> at <company>" link of my current role. Role title = my title from the spec. Organization: type Tantra and pick the Tantra page from the dropdown (circuit tree logo, linkedin.com/company/13588687), never free text. Description = my role description (contenteditable whose aria-label starts with "Highlights"). Add my five skills the same way as in b. Check that the notify checkbox and every "End current position" checkbox are unticked, then Save. Then open https://www.linkedin.com/in/me/edit/intro/ and make sure the Organization dropdown is Tantra, so my top card shows Tantra.
g. Featured: open https://www.linkedin.com/in/<slug>/details/featured/ , click [aria-label="Featured overflow menu"], "Add a link", paste the Featured 2 "Lands on" link from my Links table (Featured uses the full UTM link because LinkedIn cannot preview go.usetantra.com short links yet; everywhere else use the short link), click Add and wait up to 60 seconds for the Title field (the preview is slow; retry twice). Set title and description from the spec, run --catch, click [aria-label="Choose thumbnail image"], upload assets/featured-consultation-1200x627.png, Save. Then add the Featured 1 "Lands on" link from my Links table the same way (jointantra.com, thumbnail assets/featured-workshop-1200x627.png); the item added last shows first, so the workshop ends up on top. After saving, read each Featured item's real link (the href behind it) and check the UTMs are still there; if LinkedIn shows a bare domain, open https://www.linkedin.com/post-inspector/ , inspect that exact URL to refresh LinkedIn's cache, then delete and re-add the item. Then delete Featured items that point to GrowthClub, Oiti or past events (use their "Delete <title>" buttons).

Step 3, verify: run profile-read again into backup/after.json, compare every field with the spec, take opencli browser screenshot --session me profile-after.png of the top of my profile, and show me a table: field, done or not, and why. Tell me anything you could not do and the exact click I need to make.
```

## Known Blockers and the Fix for Each

| Blocker | Fix |
| --- | --- |
| OpenCLI extension not connected | `opencli daemon restart`, reload the OpenCLI card in chrome://extensions, `opencli doctor` |
| Several Chrome profiles connected | `opencli profile list`, `opencli --profile <id> linkedin whoami`, `opencli profile use <id>` |
| `opencli browser upload` fails with "Not allowed" | Use `li-upload.sh` (catch the file field, then attach) |
| "Edit cover image" does nothing when clicked by script | Click it by its ref from `opencli browser state` |
| Featured link says "couldn't load a preview" | LinkedIn's preview is slow: wait up to a minute and click Add again, up to three times |
| Featured link shows a bare domain without UTMs | Inspect the exact URL at https://www.linkedin.com/post-inspector/ , then delete and re-add the item |
| A skill name does not exist on LinkedIn | Pick the closest real one from the list |
| Your top card shows the wrong company after editing roles | Edit intro, Organization: pick Tantra, Save |
| "Native input requires a visible browser page" | Bring the Chrome window with the LinkedIn tab to the front and keep it visible |
| LinkedIn asks for a password, code or check | Do it yourself in Chrome, then tell Claude to carry on |
