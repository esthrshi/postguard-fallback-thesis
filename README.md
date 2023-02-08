## How to run this project

1. Clone repository
2. yarn install (first time)
3. yarn dev (development)

## Features
- Decrypt postguard.encrypted files
- Supports multiple recipients
- Stores decrypted emails in localstorage (user opt-in)
- Caches IRMA credentials in localstorage (user opt-in)
- Supports deleting cached emails, and deleting cached IRMA credentials
- Supports downloading email attachments
- Supports including encrypted `postguard.encrypted` file as a URL parameter (in separate branch, checkout `encrypted-file-in-url`)
Takes a parameter with an encrypted file in the format: `/decrypt#encrypted={encryptedfile}`

## Limits
- Localstorage has 10MB limit
- Including encrypted `postguard.encrypted` as a URL parameter has a size limit of 512KB
