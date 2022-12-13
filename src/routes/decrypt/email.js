// import * as PostalMime from 'postal-mime'
// import { preview } from 'vite'

// import { curMail } from '../../store/email.js'

// export async function parseMail(unparsed) {
    
//     const parser = new PostalMime.default()
//     let preview = await parser.parse(unparsed)
//     curMail.from = preview.from
//     curMail.from.set(preview.from)
//     curMail.to.set(preview.to)
//     curMail.date.set(preview.headers[0]["value"])
//     curMail.body.set(preview.html)
//     // parsedMail.to = preview.to
//     // parsedMail.date = preview.headers[0]["value"]
//     // parsedMail.subject = preview.subject
//     // parsedMail.body = preview.html
// }

// download email on button click
export function downloadFile(outFile) {
    const downFile = new Blob([outFile], { type: "text/html"}) // not sure if text/html is correct....
    let a = document.createElement("a"),
        url = URL.createObjectURL(downFile)

    a.href = url;
    a.download = "postguard.eml"
    document.body.appendChild(a)

    a.click()
    URL.revokeObjectURL(url)
    a.remove()
}