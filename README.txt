# Maison De La Fork — Event Menu & Giveaway

Hi,This package contains the final front-end files for the event menu and giveaway page.
The project uses plain HTML, CSS, and JavaScript, so no build process, npm installation, or compilation is required.

## Project Structure

assets/
index.html
styles.css
script.js
giveaway.html
giveaway.css
giveaway.js

Please keep the current file names and folder structure unchanged, as the asset paths are relative.

## Deployment

The intended main URL is:

https://maisondelafork.com/event

The included `index.html` should be served from the `/event` directory.

The giveaway button currently links to:

giveaway.html

So the giveaway page will be available at:

https://maisondelafork.com/event/giveaway.html

Feel free to use a cleaner route such as `/event/giveaway` if preferred. In that case, the link inside `index.html` will also need to be updated.

## Giveaway Form

The giveaway form collects:

- Name
- Email

The front-end validation, loading state, error state, and success screen are already included.

The remaining step is to connect the form to the existing WordPress/Mailchimp setup.

Please add successful submissions to the appropriate Mailchimp Audience and apply a suitable tag, for example:

SmorgasJOON Giveaway

The success screen should only appear after the server confirms that the submission was accepted.

The Mailchimp API key should remain server-side and should not be placed inside `giveaway.js`.

Any preferred secure implementation is fine, including a WordPress endpoint, REST route, existing Mailchimp plugin, or server-side form handler.

## Final Checks

After deployment, please verify:

- `/event` loads correctly
- The giveaway button opens the correct page
- Fonts, images, and animations load correctly
- Social-media links work
- Name and email validation work
- Valid submissions are stored in Mailchimp
- The Mailchimp tag is applied
- Failed submissions display an error
- Both pages work correctly on mobile


Thank you.