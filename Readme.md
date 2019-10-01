# Standard Notes Clipper

This is a browser add-on (Firefox and Chrome) that allows you to clip web pages to your Standard Notes account. The add-on let's you select the portion of the page you want to clip. It then adds the HTML content of that selection to your Standard Notes account.

The project is just a proof of concept right now, and needs much work. (Which is listed below.) Please use and share your feedback! And, of course, contributions are welcome!  
## Installation

### Firefox

Go to _Tools_ > _Add-ons_, then click the gear icon and select _Debug Addons_ from the menu. On the _Add-ons_ debug page, click _Load Temporary Add-on..._ and drive to folder containing this project and select the _manifest.json_ file.

### Chrome

Go to _Window_ > _Extensions_, then click _Load unpacked_ and drive to folder containing this project and click _Select_.

## ToDo

There is much to do to make this a fully usable project, and I'll need some help getting there. Here's a list of what I see needs to be done, but I'm open to suggestions for other necessary improvements:

* **Editor Preference** - When articles are clipped right now, they show up as HTML in Standard Notes, but if you switch the note to use the _Plus Editor_, the HTML renders properly. I do not know how to set that editor as the preferred editor when creating the note via the API.
* **Clipping User Experience** - The clipping experience is really just a proof of concept, and so there's very little thought given to the user experience of clipping.
* **Tagging** - It'd be great to tag clipped articles after saving.
* **Branding** - This will be determined by how this fits into the Standard Notes ecosystem, but there's really no look or feel to this add-on.
