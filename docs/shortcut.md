# Add to MedPally Find on iPhone

First create the `intake` label in the repository. Create a GitHub fine-grained personal access token limited to this repository with **Issues: read and write**. Keep it private: anyone who can use the token can create and edit issues. Replace `<OWNER>`, `<REPO>`, and `<PAT>` below with your own values.

1. In Shortcuts, create a shortcut named **Add to MedPally Find**. Open its details, enable **Show in Share Sheet**, and set accepted types to **URLs** and **Text**. Set “If there's no input” to ask for input.
2. Add **Get URLs from Input**, with Shortcut Input as its input. Add **Get Item from List**, choosing **First Item**, to extract the first URL from a shared URL or text such as an X post. If no URL is found, stop and show an explanatory alert.
3. Add **Ask for Input**. Choose Text, prompt “Optional note”, and leave the default blank. Enable empty input if your iOS version offers it. Save the result as `Note`.
4. Add a **Text** action containing the URL from step 2, then a blank line, then `note: ` followed by the `Note` variable. Save this as `Issue Body`. Add another Text action containing `intake: ` followed by the URL and save it as `Issue Title`.
5. Add **URL** with `https://api.github.com/repos/<OWNER>/<REPO>/issues`.
6. Add **Get Contents of URL** and choose **POST**. Add headers `Authorization: Bearer <PAT>`, `Accept: application/vnd.github+json`, and `X-GitHub-Api-Version: 2022-11-28`. Choose **JSON** as the request body. Add text fields `title` = `Issue Title` and `body` = `Issue Body`. Add an array field `labels` containing one text item, `intake`.
7. Add **Show Notification** with `Sent to MedPally Find ✓`. Test by sharing a resource URL, then check the issue and Actions run. If the API call fails, Shortcuts should stop before the notification.

The shortcut stores the PAT in its actions. Do not share the shortcut with the token in it; revoke and replace the token if exposed.

## Desktop fallback

Create a browser bookmark and use the following as its URL, replacing `OWNER` and `REPO`. Select text containing a URL or visit the resource page, then click the bookmark. Review and submit the prefilled issue manually; you can add a note before submitting.

```javascript
javascript:(()=>{const s=String(getSelection());const u=(s.match(/https?:\/\/[^\s<>]+/)||[])[0]||location.href;open('https://github.com/OWNER/REPO/issues/new?labels=intake&title='+encodeURIComponent('intake: '+u)+'&body='+encodeURIComponent(u+'\n\nnote: '),'_blank','noopener')})()
```
