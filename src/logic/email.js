import { browser } from '$app/environment'
//import { boolCacheEmail, boolCacheIRMA } from './../store/settings.js'

let PostalMime

// postalmime only works in browser
if (browser) {
    import('postal-mime').then((module) => {
        PostalMime = module
    });
}

// parse email using postalmime
export function parseMail(unparsed) {
    const parser = new PostalMime.default()
    return parser.parse(unparsed)
}

// download email/attachment
export function downloadAttachment(outFile, fileType, fileName) {
    const downFile = new Blob([outFile], { type: fileType})
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = fileName
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}